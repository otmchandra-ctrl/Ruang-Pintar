/**
 * Ruang Pintar — M14 CBT: Assessment Attempt Foundation Engine
 *
 * Bertanggung jawab mengelola daur hidup percobaan pengerjaan ujian (AssessmentAttempt):
 * NOT_STARTED -> IN_PROGRESS -> SUBMITTED / AUTO_SUBMITTED / ABANDONED
 *
 * Invariants & Guarantees:
 * - One Active Attempt per Siswa per Ujian.
 * - Server-Authoritative Timer: Batas waktu dihitung dan ditegakkan server-side.
 * - Pertahankan batasan: Belum membuat UI pengerjaan, belum menyimpan jawaban.
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { generateUlid } from "@/shared/lib/ulid";
import {
  CbtNotFoundError,
  CbtOneActiveAttemptViolationError,
  CbtStudentNotEligibleError,
  CbtAttemptClosedError,
  CbtTimerExpiredError,
  CbtAccessDeniedError,
  CbtValidationError,
} from "../domain/cbt-errors";
import {
  AssessmentAttemptDTO,
  AssessmentAttemptStatus,
  ManifestItemSoal,
} from "../domain/cbt-types";
import { StudentEligibilityEngine, studentEligibilityEngine } from "./student-eligibility-engine";
import { ExamSnapshotEngine, examSnapshotEngine } from "./exam-snapshot-engine";

export class AssessmentAttemptEngine {
  private eligibilityEngine: StudentEligibilityEngine;
  private snapshotEngine: ExamSnapshotEngine;

  constructor(eligibilityEngine?: StudentEligibilityEngine, snapshotEngine?: ExamSnapshotEngine) {
    this.eligibilityEngine = eligibilityEngine || studentEligibilityEngine;
    this.snapshotEngine = snapshotEngine || examSnapshotEngine;
  }

  /**
   * Inisialisasi attempt awal siswa (Status: NOT_STARTED)
   */
  async initAttempt(params: {
    ujianId: string;
    siswaId: string;
    sekolahId: string;
    sessionId?: string | null;
    tokenInput?: string | null;
    actorId: string;
    actorRole: string;
  }): Promise<AssessmentAttemptDTO> {
    const { ujianId, siswaId, sekolahId, sessionId, tokenInput, actorId, actorRole } = params;

    // Authorization: Siswa hanya dapat menginisiasi attempt miliknya sendiri
    if (actorRole === "STUDENT" && actorId !== siswaId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda hanya berwenang memulai ujian untuk akun Anda sendiri."
      );
    }

    // 1. Evaluasi Kelayakan Siswa
    const eligibility = await this.eligibilityEngine.checkEligibility({
      ujianId,
      siswaId,
      sekolahId,
      sessionId,
      tokenInput,
    });

    if (!eligibility.isEligible) {
      throw new CbtStudentNotEligibleError(eligibility.reasons);
    }

    // 2. Ambil Ujian & Snapshot Aktif
    const exam = await prisma.ujianCbt.findFirst({
      where: { id: ujianId, sekolah_id: sekolahId },
    });

    if (!exam || !exam.snapshot_aktif_id) {
      throw new CbtValidationError("Ujian CBT belum siap atau belum memiliki snapshot aktif.");
    }

    // 3. One Active Attempt Guard: Pastikan tidak ada attempt berstatus IN_PROGRESS
    const activeAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        ujian_cbt_id: ujianId,
        siswa_id: siswaId,
        sekolah_id: sekolahId,
        status: "IN_PROGRESS",
      },
    });

    if (activeAttempt) {
      throw new CbtOneActiveAttemptViolationError(
        `Anda sudah memiliki attempt aktif (${activeAttempt.id}) yang sedang berjalan. Lanjutkan attempt tersebut.`
      );
    }

    // 4. Hitung nomor attempt
    const attemptKe = eligibility.details.attemptCount + 1;
    const attemptId = generateUlid();

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        id: attemptId,
        sekolah_id: sekolahId,
        ujian_cbt_id: ujianId,
        exam_session_id: eligibility.details.sessionId || null,
        snapshot_id: exam.snapshot_aktif_id,
        siswa_id: siswaId,
        penempatan_rombel_id: eligibility.details.penempatanRombelId || null,
        attempt_ke: attemptKe,
        status: "NOT_STARTED",
      },
      include: {
        siswa: { select: { nama_lengkap: true, nis: true } },
      },
    });

    return {
      id: attempt.id,
      sekolah_id: attempt.sekolah_id,
      ujian_cbt_id: attempt.ujian_cbt_id,
      exam_session_id: attempt.exam_session_id,
      snapshot_id: attempt.snapshot_id,
      siswa_id: attempt.siswa_id,
      penempatan_rombel_id: attempt.penempatan_rombel_id,
      attempt_ke: attempt.attempt_ke,
      waktu_mulai: attempt.waktu_mulai,
      batas_waktu_server: attempt.batas_waktu_server,
      waktu_selesai: attempt.waktu_selesai,
      status: attempt.status,
      urutan_soal_peserta: attempt.urutan_soal_peserta,
      siswa_nama: attempt.siswa.nama_lengkap,
      siswa_nis: attempt.siswa.nis,
      created_at: attempt.created_at,
      updated_at: attempt.updated_at,
    };
  }

  /**
   * Memulai pengerjaan attempt (Status -> IN_PROGRESS)
   * Menetapkan server-authoritative timer deadline dan urutan soal
   */
  async startAttempt(params: {
    attemptId: string;
    sekolahId: string;
    siswaId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{
    attempt: AssessmentAttemptDTO;
    manifest: ManifestItemSoal[];
    timeRemainingSeconds: number;
  }> {
    const { attemptId, sekolahId, siswaId, ipAddress, userAgent } = params;

    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, sekolah_id: sekolahId, siswa_id: siswaId },
      include: {
        ujian_cbt: true,
        siswa: { select: { nama_lengkap: true, nis: true } },
      },
    });

    if (!attempt) {
      throw new CbtNotFoundError("Assessment Attempt", attemptId);
    }

    if (attempt.status !== "NOT_STARTED" && attempt.status !== "IN_PROGRESS") {
      throw new CbtAttemptClosedError(
        `Attempt ini telah diselesaikan sebelumnya dengan status ${attempt.status}.`
      );
    }

    const now = new Date();

    // Jika sudah IN_PROGRESS, hitung sisa waktu
    if (attempt.status === "IN_PROGRESS") {
      const deadline = attempt.batas_waktu_server ? new Date(attempt.batas_waktu_server) : now;
      const sisaDetik = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

      if (sisaDetik <= 0) {
        // Auto-submit bila waktu habis saat resume
        await this.autoSubmitAttempt(attemptId, sekolahId, "Waktu server telah habis saat resume.");
        throw new CbtTimerExpiredError();
      }

      const { manifest } = await this.snapshotEngine.getStudentManifest(
        attempt.snapshot_id,
        sekolahId
      );

      return {
        attempt: {
          id: attempt.id,
          sekolah_id: attempt.sekolah_id,
          ujian_cbt_id: attempt.ujian_cbt_id,
          exam_session_id: attempt.exam_session_id,
          snapshot_id: attempt.snapshot_id,
          siswa_id: attempt.siswa_id,
          penempatan_rombel_id: attempt.penempatan_rombel_id,
          attempt_ke: attempt.attempt_ke,
          waktu_mulai: attempt.waktu_mulai,
          batas_waktu_server: attempt.batas_waktu_server,
          waktu_selesai: attempt.waktu_selesai,
          status: attempt.status,
          urutan_soal_peserta: attempt.urutan_soal_peserta,
          siswa_nama: attempt.siswa.nama_lengkap,
          siswa_nis: attempt.siswa.nis,
          created_at: attempt.created_at,
          updated_at: attempt.updated_at,
        },
        manifest,
        timeRemainingSeconds: sisaDetik,
      };
    }

    // Status NOT_STARTED -> Transisi ke IN_PROGRESS
    const durasiMenit = attempt.ujian_cbt.durasi_menit || 60;
    const waktuMulai = now;
    const batasWaktuServer = new Date(waktuMulai.getTime() + durasiMenit * 60 * 1000);

    // Ambil manifest soal dari snapshot
    const { manifest, konfigurasi } = await this.snapshotEngine.getStudentManifest(
      attempt.snapshot_id,
      sekolahId
    );

    // Permutasi urutan soal jika acak_soal aktif
    let urutanSoalPeserta = manifest.map((m) => m.soal_id);
    if (konfigurasi.acak_soal) {
      urutanSoalPeserta = this.shuffleArray([...urutanSoalPeserta]);
    }

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "IN_PROGRESS",
        waktu_mulai: waktuMulai,
        batas_waktu_server: batasWaktuServer,
        urutan_soal_peserta: JSON.stringify(urutanSoalPeserta),
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      },
      include: {
        siswa: { select: { nama_lengkap: true, nis: true } },
      },
    });

    const timeRemainingSeconds = Math.max(
      0,
      Math.floor((batasWaktuServer.getTime() - now.getTime()) / 1000)
    );

    return {
      attempt: {
        id: updated.id,
        sekolah_id: updated.sekolah_id,
        ujian_cbt_id: updated.ujian_cbt_id,
        exam_session_id: updated.exam_session_id,
        snapshot_id: updated.snapshot_id,
        siswa_id: updated.siswa_id,
        penempatan_rombel_id: updated.penempatan_rombel_id,
        attempt_ke: updated.attempt_ke,
        waktu_mulai: updated.waktu_mulai,
        batas_waktu_server: updated.batas_waktu_server,
        waktu_selesai: updated.waktu_selesai,
        status: updated.status,
        urutan_soal_peserta: updated.urutan_soal_peserta,
        siswa_nama: updated.siswa.nama_lengkap,
        siswa_nis: updated.siswa.nis,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
      manifest,
      timeRemainingSeconds,
    };
  }

  /**
   * Submit attempt secara manual oleh siswa (Status -> SUBMITTED)
   */
  async submitAttempt(params: {
    attemptId: string;
    sekolahId: string;
    siswaId: string;
    catatan?: string | null;
  }): Promise<AssessmentAttemptDTO> {
    const { attemptId, sekolahId, siswaId, catatan } = params;

    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, sekolah_id: sekolahId, siswa_id: siswaId },
      include: { siswa: { select: { nama_lengkap: true, nis: true } } },
    });

    if (!attempt) {
      throw new CbtNotFoundError("Assessment Attempt", attemptId);
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new CbtAttemptClosedError(
        `Attempt tidak dapat dikumpulkan karena berstatus '${attempt.status}'.`
      );
    }

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        waktu_selesai: new Date(),
        catatan: catatan || "Dikumpulkan oleh siswa.",
      },
      include: { siswa: { select: { nama_lengkap: true, nis: true } } },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      ujian_cbt_id: updated.ujian_cbt_id,
      exam_session_id: updated.exam_session_id,
      snapshot_id: updated.snapshot_id,
      siswa_id: updated.siswa_id,
      penempatan_rombel_id: updated.penempatan_rombel_id,
      attempt_ke: updated.attempt_ke,
      waktu_mulai: updated.waktu_mulai,
      batas_waktu_server: updated.batas_waktu_server,
      waktu_selesai: updated.waktu_selesai,
      status: updated.status,
      urutan_soal_peserta: updated.urutan_soal_peserta,
      catatan: updated.catatan,
      siswa_nama: updated.siswa.nama_lengkap,
      siswa_nis: updated.siswa.nis,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Auto-submit attempt ketika batas waktu server tercapai (Status -> AUTO_SUBMITTED)
   */
  async autoSubmitAttempt(
    attemptId: string,
    sekolahId: string,
    reason = "Batas waktu server telah habis."
  ): Promise<AssessmentAttemptDTO> {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, sekolah_id: sekolahId },
      include: { siswa: { select: { nama_lengkap: true, nis: true } } },
    });

    if (!attempt) {
      throw new CbtNotFoundError("Assessment Attempt", attemptId);
    }

    if (attempt.status !== "IN_PROGRESS") {
      return {
        id: attempt.id,
        sekolah_id: attempt.sekolah_id,
        ujian_cbt_id: attempt.ujian_cbt_id,
        exam_session_id: attempt.exam_session_id,
        snapshot_id: attempt.snapshot_id,
        siswa_id: attempt.siswa_id,
        penempatan_rombel_id: attempt.penempatan_rombel_id,
        attempt_ke: attempt.attempt_ke,
        waktu_mulai: attempt.waktu_mulai,
        batas_waktu_server: attempt.batas_waktu_server,
        waktu_selesai: attempt.waktu_selesai,
        status: attempt.status,
        catatan: attempt.catatan,
        siswa_nama: attempt.siswa.nama_lengkap,
        siswa_nis: attempt.siswa.nis,
        created_at: attempt.created_at,
        updated_at: attempt.updated_at,
      };
    }

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "AUTO_SUBMITTED",
        waktu_selesai: attempt.batas_waktu_server || new Date(),
        catatan: reason,
      },
      include: { siswa: { select: { nama_lengkap: true, nis: true } } },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      ujian_cbt_id: updated.ujian_cbt_id,
      exam_session_id: updated.exam_session_id,
      snapshot_id: updated.snapshot_id,
      siswa_id: updated.siswa_id,
      penempatan_rombel_id: updated.penempatan_rombel_id,
      attempt_ke: updated.attempt_ke,
      waktu_mulai: updated.waktu_mulai,
      batas_waktu_server: updated.batas_waktu_server,
      waktu_selesai: updated.waktu_selesai,
      status: updated.status,
      catatan: updated.catatan,
      siswa_nama: updated.siswa.nama_lengkap,
      siswa_nis: updated.siswa.nis,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Mengabaikan atau membatalkan attempt (Status -> ABANDONED)
   */
  async abandonAttempt(params: {
    attemptId: string;
    sekolahId: string;
    actorId: string;
    actorRole: string;
    reason: string;
  }): Promise<AssessmentAttemptDTO> {
    const { attemptId, sekolahId, reason } = params;

    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, sekolah_id: sekolahId },
      include: { siswa: { select: { nama_lengkap: true, nis: true } } },
    });

    if (!attempt) {
      throw new CbtNotFoundError("Assessment Attempt", attemptId);
    }

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "ABANDONED",
        waktu_selesai: new Date(),
        catatan: `Dibatalkan: ${reason}`,
      },
      include: { siswa: { select: { nama_lengkap: true, nis: true } } },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      ujian_cbt_id: updated.ujian_cbt_id,
      exam_session_id: updated.exam_session_id,
      snapshot_id: updated.snapshot_id,
      siswa_id: updated.siswa_id,
      penempatan_rombel_id: updated.penempatan_rombel_id,
      attempt_ke: updated.attempt_ke,
      waktu_mulai: updated.waktu_mulai,
      batas_waktu_server: updated.batas_waktu_server,
      waktu_selesai: updated.waktu_selesai,
      status: updated.status,
      catatan: updated.catatan,
      siswa_nama: updated.siswa.nama_lengkap,
      siswa_nis: updated.siswa.nis,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Helper permutasi acak array (Fisher-Yates shuffle)
   */
  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export const assessmentAttemptEngine = new AssessmentAttemptEngine();
