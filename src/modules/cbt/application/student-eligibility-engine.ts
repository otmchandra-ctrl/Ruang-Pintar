/**
 * Ruang Pintar — M14 CBT: Student Eligibility Engine
 *
 * Bertanggung jawab mengevaluasi kelayakan siswa mengikuti ujian CBT:
 * 1. Siswa aktif di sekolah (status_akademik = 'AKTIF')
 * 2. Terdaftar pada rombel aktif (PenempatanRombel)
 * 3. Terdaftar pada asesmen (PenugasanMengajar rombel target)
 * 4. Tenant benar (sekolah_id cocok dengan tenant actor)
 * 5. Jadwal aktif (waktu saat ini berada dalam rentang sesi yang dibuka)
 * 6. Kuota attempt belum terlampaui (attempt_count < maksimal_attempt)
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { StudentEligibilityResultDTO } from "../domain/cbt-types";
import { CbtNotFoundError } from "../domain/cbt-errors";
import { ExamTokenEngine, examTokenEngine } from "./exam-token-engine";

export class StudentEligibilityEngine {
  private tokenEngine: ExamTokenEngine;

  constructor(tokenEngine?: ExamTokenEngine) {
    this.tokenEngine = tokenEngine || examTokenEngine;
  }

  /**
   * Mengevaluasi kelayakan penuh siswa
   */
  async checkEligibility(params: {
    ujianId: string;
    siswaId: string;
    sekolahId: string;
    sessionId?: string | null;
    tokenInput?: string | null;
    now?: Date;
  }): Promise<StudentEligibilityResultDTO> {
    const { ujianId, siswaId, sekolahId, sessionId, tokenInput, now = new Date() } = params;
    const reasons: string[] = [];

    // 1. Ambil data Ujian
    const exam = await prisma.ujianCbt.findFirst({
      where: { id: ujianId, sekolah_id: sekolahId },
      include: {
        penugasan_mengajar: {
          select: { id: true, rombel_id: true, guru_id: true },
        },
      },
    });

    if (!exam) {
      throw new CbtNotFoundError("Ujian CBT", ujianId);
    }

    // 2. Ambil data Siswa & Verifikasi Tenant
    const siswa = await prisma.siswa.findFirst({
      where: { id: siswaId },
      select: {
        id: true,
        sekolah_id: true,
        status_akademik: true,
        nama_lengkap: true,
      },
    });

    if (!siswa) {
      throw new CbtNotFoundError("Siswa", siswaId);
    }

    const isTenantValid = siswa.sekolah_id === sekolahId;
    if (!isTenantValid) {
      reasons.push("Tenant sekolah siswa tidak cocok dengan sekolah penyelenggara ujian.");
    }

    const isStudentActive = siswa.status_akademik === "AKTIF";
    if (!isStudentActive) {
      reasons.push(`Status akademik siswa tidak aktif (${siswa.status_akademik}).`);
    }

    // 3. Verifikasi Penempatan Rombel & Terdaftar Asesmen
    const targetRombelId = exam.penugasan_mengajar.rombel_id;
    const penempatan = await prisma.penempatanRombel.findFirst({
      where: {
        sekolah_id: sekolahId,
        rombel_id: targetRombelId,
        status: "AKTIF",
        keikutsertaan: {
          siswa_id: siswaId,
          status: "AKTIF",
        },
      },
      select: { id: true },
    });

    const isEnrolledInRombel = Boolean(penempatan);
    const isAssessmentAssigned = isEnrolledInRombel; // Rombel siswa ditugaskan ujian ini
    if (!isEnrolledInRombel) {
      reasons.push("Siswa tidak terdaftar aktif di rombel kelas yang ditugaskan untuk ujian ini.");
    }

    // 4. Verifikasi Sesi Ujian & Jadwal Aktif
    let isScheduleActive = false;
    let isSessionOpen = false;
    let resolvedSessionId: string | undefined = sessionId || undefined;

    if (sessionId) {
      const session = await prisma.examSession.findFirst({
        where: { id: sessionId, ujian_cbt_id: ujianId, sekolah_id: sekolahId },
      });

      if (!session) {
        reasons.push("Sesi ujian tidak ditemukan untuk ujian ini.");
      } else {
        resolvedSessionId = session.id;
        isSessionOpen = session.status === "DIBUKA";
        if (!isSessionOpen) {
          reasons.push(`Sesi ujian sedang tidak dibuka (Status: ${session.status}).`);
        }

        const start = new Date(session.waktu_mulai);
        const end = new Date(session.waktu_selesai);
        isScheduleActive = now >= start && now <= end;

        if (now < start) {
          reasons.push(`Sesi ujian belum dimulai (Mulai: ${start.toLocaleString("id-ID")}).`);
        } else if (now > end) {
          reasons.push(`Sesi ujian telah berakhir (Selesai: ${end.toLocaleString("id-ID")}).`);
        }

        // Validasi Token jika sesi memiliki token aktif
        if (session.token_aktif && session.token) {
          if (!tokenInput) {
            reasons.push("Token ujian wajib dimasukkan untuk sesi ini.");
          } else {
            const tokenCheck = await this.tokenEngine.validateToken({
              sessionId: session.id,
              tokenInput,
              sekolahId,
            });
            if (!tokenCheck.isValid) {
              reasons.push(tokenCheck.reason || "Token ujian tidak valid.");
            }
          }
        }
      }
    } else {
      // Jika tanpa session_id spesifik, cek apakah ada sesi aktif untuk ujian ini
      const activeSessions = await prisma.examSession.findMany({
        where: {
          ujian_cbt_id: ujianId,
          sekolah_id: sekolahId,
          status: "DIBUKA",
        },
      });

      if (activeSessions.length > 0) {
        const matchingSession = activeSessions.find(
          (s) => now >= new Date(s.waktu_mulai) && now <= new Date(s.waktu_selesai)
        );
        if (matchingSession) {
          isScheduleActive = true;
          isSessionOpen = true;
          resolvedSessionId = matchingSession.id;
        } else {
          isSessionOpen = true;
          reasons.push("Tidak ada sesi ujian yang berada dalam rentang jadwal aktif saat ini.");
        }
      } else {
        // Fallback: periksa rentang waktu di UjianCbt langsung jika tidak memakai model sesi
        const publishedStatuses = [
          "PUBLISHED",
          "DITERBITKAN",
          "DIPUBLIKASI",
          "ACTIVE",
          "BERLANGSUNG",
        ];
        const currentExamStatus = (exam.status || "").toUpperCase();
        isSessionOpen = publishedStatuses.includes(currentExamStatus);

        if (exam.waktu_mulai && exam.waktu_selesai) {
          const start = new Date(exam.waktu_mulai);
          const end = new Date(exam.waktu_selesai);
          isScheduleActive = now >= start && now <= end;
          if (!isScheduleActive) {
            reasons.push("Waktu pengerjaan berada di luar jadwal ujian.");
          }
        } else {
          isScheduleActive = true;
        }

        if (!isSessionOpen) {
          reasons.push(`Ujian belum dibuka untuk dikerjakan (Status: ${exam.status}).`);
        }
      }
    }

    // 5. Verifikasi Kuota Attempt
    const existingAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        ujian_cbt_id: ujianId,
        siswa_id: siswaId,
        sekolah_id: sekolahId,
      },
      select: { id: true, status: true, attempt_ke: true },
    });

    const attemptCount = existingAttempts.length;
    const maxAttempts = exam.maksimal_attempt || 1;
    const hasRemainingAttempts = attemptCount < maxAttempts;

    if (!hasRemainingAttempts) {
      reasons.push(`Anda telah mencapai batas maksimal pengerjaan (${maxAttempts} kali).`);
    }

    // Evaluasi hasil akhir
    const isEligible =
      isTenantValid &&
      isStudentActive &&
      isEnrolledInRombel &&
      isAssessmentAssigned &&
      isScheduleActive &&
      isSessionOpen &&
      hasRemainingAttempts &&
      reasons.length === 0;

    return {
      isEligible,
      reasons,
      details: {
        isStudentActive,
        isEnrolledInRombel,
        isAssessmentAssigned,
        isTenantValid,
        isScheduleActive,
        isSessionOpen,
        hasRemainingAttempts,
        attemptCount,
        maxAttempts,
        penempatanRombelId: penempatan?.id,
        sessionId: resolvedSessionId,
      },
    };
  }
}

export const studentEligibilityEngine = new StudentEligibilityEngine();
