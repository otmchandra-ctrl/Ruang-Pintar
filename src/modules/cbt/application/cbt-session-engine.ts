/**
 * Ruang Pintar — M14 CBT: CBT Session Engine
 *
 * Bertanggung jawab mengelola unit pelaksanaan ujian (ExamSession):
 * - Membuka sesi (openSession)
 * - Menutup sesi (closeSession)
 * - Validasi jadwal waktu pelaksanaan (validateSchedule)
 * - Validasi kelayakan peserta rombel (validateParticipant)
 * - Validasi status kesiapan ujian (validateExamStatus)
 *
 * Catatan Arsitektur:
 * - Engine ini murni fondasi delivery server-side (Bukan player).
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { generateUlid } from "@/shared/lib/ulid";
import {
  CbtNotFoundError,
  CbtValidationError,
  CbtSessionClosedError,
  CbtAccessDeniedError,
  CbtExamNotActiveError,
} from "../domain/cbt-errors";
import { ExamSessionDTO, ExamSessionStatus } from "../domain/cbt-types";
import { CreateExamSessionInput } from "../domain/cbt-validation";
import { ExamTokenEngine, examTokenEngine } from "./exam-token-engine";

export class CbtSessionEngine {
  private tokenEngine: ExamTokenEngine;

  constructor(tokenEngine?: ExamTokenEngine) {
    this.tokenEngine = tokenEngine || examTokenEngine;
  }

  /**
   * Membuat sesi pelaksanaan ujian baru
   */
  async createSession(
    input: CreateExamSessionInput,
    sekolahId: string,
    actorId: string,
    actorRole: string
  ): Promise<ExamSessionDTO> {
    const exam = await prisma.ujianCbt.findFirst({
      where: { id: input.ujian_cbt_id, sekolah_id: sekolahId },
      include: { penugasan_mengajar: { select: { guru_id: true } } },
    });

    if (!exam) {
      throw new CbtNotFoundError("Ujian CBT", input.ujian_cbt_id);
    }

    // Authorization Guard
    if (actorRole === "TEACHER" && exam.penugasan_mengajar.guru_id !== actorId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda hanya berwenang membuat sesi ujian pada kelas yang Anda ampu."
      );
    }

    // Validasi rentang waktu
    const mulai = new Date(input.waktu_mulai);
    const selesai = new Date(input.waktu_selesai);
    if (selesai <= mulai) {
      throw new CbtValidationError(
        "Waktu selesai sesi ujian harus lebih besar dari waktu mulai sesi.",
        { waktu_selesai: ["Waktu selesai harus setelah waktu mulai"] }
      );
    }

    const sessionId = generateUlid();
    let initialToken: string | null = null;
    let tokenExpiredAt: Date | null = null;

    if (input.generate_token) {
      initialToken = this.tokenEngine.generateTokenCode();
      tokenExpiredAt = new Date(selesai.getTime() + 60 * 60 * 1000); // 1 jam setelah sesi selesai
    }

    const session = await prisma.examSession.create({
      data: {
        id: sessionId,
        sekolah_id: sekolahId,
        ujian_cbt_id: input.ujian_cbt_id,
        kode_sesi: input.kode_sesi,
        nama_sesi: input.nama_sesi,
        waktu_mulai: mulai,
        waktu_selesai: selesai,
        token: initialToken,
        token_aktif: Boolean(initialToken),
        token_expired_at: tokenExpiredAt,
        status: "TERJADWAL",
        ruang_ujian: input.ruang_ujian || null,
        pengawas_nama: input.pengawas_nama || null,
        catatan: input.catatan || null,
      },
      include: {
        ujian_cbt: { select: { judul: true } },
      },
    });

    return {
      id: session.id,
      sekolah_id: session.sekolah_id,
      ujian_cbt_id: session.ujian_cbt_id,
      kode_sesi: session.kode_sesi,
      nama_sesi: session.nama_sesi,
      waktu_mulai: session.waktu_mulai,
      waktu_selesai: session.waktu_selesai,
      token: session.token,
      token_aktif: session.token_aktif,
      token_expired_at: session.token_expired_at,
      status: session.status,
      ruang_ujian: session.ruang_ujian,
      pengawas_nama: session.pengawas_nama,
      catatan: session.catatan,
      ujian_judul: session.ujian_cbt.judul,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  }

  /**
   * Membuka sesi pelaksanaan ujian (Status -> DIBUKA)
   */
  async openSession(
    sessionId: string,
    sekolahId: string,
    actorId: string,
    actorRole: string
  ): Promise<ExamSessionDTO> {
    const session = await prisma.examSession.findFirst({
      where: { id: sessionId, sekolah_id: sekolahId },
      include: {
        ujian_cbt: {
          include: { penugasan_mengajar: { select: { guru_id: true } } },
        },
      },
    });

    if (!session) {
      throw new CbtNotFoundError("Sesi Ujian", sessionId);
    }

    if (actorRole === "TEACHER" && session.ujian_cbt.penugasan_mengajar.guru_id !== actorId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda tidak berwenang membuka sesi ujian kelas lain."
      );
    }

    // Validasi kesiapan ujian
    this.validateExamStatus(session.ujian_cbt);

    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: "DIBUKA",
        token_aktif: true,
      },
      include: { ujian_cbt: { select: { judul: true } } },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      ujian_cbt_id: updated.ujian_cbt_id,
      kode_sesi: updated.kode_sesi,
      nama_sesi: updated.nama_sesi,
      waktu_mulai: updated.waktu_mulai,
      waktu_selesai: updated.waktu_selesai,
      token: updated.token,
      token_aktif: updated.token_aktif,
      token_expired_at: updated.token_expired_at,
      status: updated.status,
      ruang_ujian: updated.ruang_ujian,
      pengawas_nama: updated.pengawas_nama,
      catatan: updated.catatan,
      ujian_judul: (updated as any).ujian_cbt?.judul,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Menutup sesi pelaksanaan ujian (Status -> DITUTUP)
   */
  async closeSession(
    sessionId: string,
    sekolahId: string,
    actorId: string,
    actorRole: string
  ): Promise<ExamSessionDTO> {
    const session = await prisma.examSession.findFirst({
      where: { id: sessionId, sekolah_id: sekolahId },
      include: {
        ujian_cbt: {
          include: { penugasan_mengajar: { select: { guru_id: true } } },
        },
      },
    });

    if (!session) {
      throw new CbtNotFoundError("Sesi Ujian", sessionId);
    }

    if (actorRole === "TEACHER" && session.ujian_cbt.penugasan_mengajar.guru_id !== actorId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda tidak berwenang menutup sesi ujian kelas lain."
      );
    }

    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: "DITUTUP",
        token_aktif: false,
      },
      include: { ujian_cbt: { select: { judul: true } } },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      ujian_cbt_id: updated.ujian_cbt_id,
      kode_sesi: updated.kode_sesi,
      nama_sesi: updated.nama_sesi,
      waktu_mulai: updated.waktu_mulai,
      waktu_selesai: updated.waktu_selesai,
      token: updated.token,
      token_aktif: updated.token_aktif,
      token_expired_at: updated.token_expired_at,
      status: updated.status,
      ruang_ujian: updated.ruang_ujian,
      pengawas_nama: updated.pengawas_nama,
      catatan: updated.catatan,
      ujian_judul: (updated as any).ujian_cbt?.judul,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Validasi apakah waktu sekarang berada dalam rentang jadwal sesi ujian
   */
  validateSchedule(
    session: { waktu_mulai: Date | string; waktu_selesai: Date | string; status: string },
    now = new Date()
  ): { isValid: boolean; reason?: string } {
    if (session.status === "DITUTUP" || session.status === "SELESAI") {
      return { isValid: false, reason: "Sesi ujian telah ditutup." };
    }

    const start = new Date(session.waktu_mulai);
    const end = new Date(session.waktu_selesai);

    if (now < start) {
      return {
        isValid: false,
        reason: `Sesi ujian belum dimulai. Jadwal mulai: ${start.toLocaleString("id-ID")}`,
      };
    }

    if (now > end) {
      return {
        isValid: false,
        reason: `Sesi ujian telah berakhir. Jadwal selesai: ${end.toLocaleString("id-ID")}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validasi apakah siswa terdaftar aktif pada rombel penugasan ujian
   */
  async validateParticipant(
    ujianId: string,
    siswaId: string,
    sekolahId: string
  ): Promise<{ isEligible: boolean; reason?: string; penempatanRombelId?: string }> {
    const exam = await prisma.ujianCbt.findFirst({
      where: { id: ujianId, sekolah_id: sekolahId },
      select: { penugasan_mengajar: { select: { rombel_id: true } } },
    });

    if (!exam) {
      return { isEligible: false, reason: "Ujian CBT tidak ditemukan." };
    }

    const targetRombelId = exam.penugasan_mengajar.rombel_id;

    // Periksa status siswa di sekolah
    const siswa = await prisma.siswa.findFirst({
      where: { id: siswaId, sekolah_id: sekolahId },
      select: { status_akademik: true },
    });

    if (!siswa || siswa.status_akademik !== "AKTIF") {
      return { isEligible: false, reason: "Status siswa tidak aktif di sekolah." };
    }

    // Periksa penempatan rombel aktif
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

    if (!penempatan) {
      return {
        isEligible: false,
        reason: "Siswa tidak terdaftar aktif di rombel kelas yang ditugaskan untuk ujian ini.",
      };
    }

    return { isEligible: true, penempatanRombelId: penempatan.id };
  }

  /**
   * Validasi kesiapan status ujian untuk pelaksanaan sesi
   */
  validateExamStatus(exam: { status: string; snapshot_aktif_id: string | null }): {
    isValid: boolean;
    reason?: string;
  } {
    const validExamStatuses = [
      "PUBLISHED",
      "DITERBITKAN",
      "DIPUBLIKASI",
      "ACTIVE",
      "BERLANGSUNG",
      "SCHEDULED",
    ];
    const current = exam.status.toUpperCase();

    if (!validExamStatuses.includes(current)) {
      throw new CbtExamNotActiveError(
        `Ujian belum siap untuk dilaksanakan (Status saat ini: ${exam.status}). Status minimal harus PUBLISHED/SCHEDULED.`
      );
    }

    if (!exam.snapshot_aktif_id) {
      throw new CbtValidationError(
        "Ujian belum memiliki snapshot aktif yang dibekukan. Harap terbitkan ujian terlebih dahulu."
      );
    }

    return { isValid: true };
  }

  /**
   * Mengambil daftar sesi ujian untuk suatu Ujian CBT
   */
  async getSessionsByExam(ujianId: string, sekolahId: string): Promise<ExamSessionDTO[]> {
    const sessions = await prisma.examSession.findMany({
      where: { ujian_cbt_id: ujianId, sekolah_id: sekolahId },
      include: {
        ujian_cbt: { select: { judul: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { waktu_mulai: "asc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      sekolah_id: s.sekolah_id,
      ujian_cbt_id: s.ujian_cbt_id,
      kode_sesi: s.kode_sesi,
      nama_sesi: s.nama_sesi,
      waktu_mulai: s.waktu_mulai,
      waktu_selesai: s.waktu_selesai,
      token: s.token,
      token_aktif: s.token_aktif,
      token_expired_at: s.token_expired_at,
      status: s.status,
      ruang_ujian: s.ruang_ujian,
      pengawas_nama: s.pengawas_nama,
      catatan: s.catatan,
      ujian_judul: s.ujian_cbt.judul,
      total_peserta: s._count.attempts,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));
  }
}

export const cbtSessionEngine = new CbtSessionEngine();
