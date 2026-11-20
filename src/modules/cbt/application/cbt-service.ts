/**
 * Ruang Pintar — M14 CBT (Computer-Based Test) Application Service
 *
 * Invariant & Scope Guard:
 * - Question ≠ Question Version ≠ Exam Blueprint ≠ Exam ≠ Exam Snapshot ≠ Attempt ≠ Answer ≠ Result ≠ Assessment ≠ Grade
 * - Snapshot Ujian Immutable saat Ujian dipublikasi.
 * - One Active Attempt per Siswa per Ujian.
 * - Server Authoritative Timer (Klien tidak mendikte durasi/waktu habis).
 * - Kunci Penilaian TIDAK PERNAH dikirim ke Klien/Player CBT.
 * - Nilai CBT ditransfer ke Buku Nilai (M13) melalui contract resmi, bukan double-gradebook.
 * - Integrity Event adalah indikator integritas, bukan vonis mutlak otomatis tanpa audit.
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { cbtRepository, CbtRepository } from "../infrastructure/cbt-repository";
import {
  CbtNotFoundError,
  CbtAccessDeniedError,
  CbtValidationError,
  CbtAttemptClosedError,
  CbtAttemptLockedError,
  CbtTimerExpiredError,
  CbtExamNotActiveError,
  CbtSessionInvalidatedError,
} from "../domain/cbt-errors";
import {
  CreateBankSoalSchema,
  CreateVersiSoalSchema,
  CreateUjianCbtSchema,
  AutosaveJawabanSchema,
  RecordIntegrityEventSchema,
  TransferToGradebookSchema,
} from "../domain/cbt-validation";
import {
  CreateBankSoalInput,
  CreateVersiSoalInput,
  CreateUjianCbtInput,
  AutosaveJawabanInput,
  RecordIntegrityEventInput,
  TransferToGradebookInput,
  BankSoalDTO,
  VersiSoalDTO,
  UjianCbtDTO,
  SesiUjianSiswaDTO,
  HasilUjianCbtDTO,
  EventIntegritasDTO,
  ManifestItemSoal,
} from "../domain/cbt-types";

export class CbtService {
  private repo: CbtRepository;

  constructor(repo: CbtRepository = cbtRepository) {
    this.repo = repo;
  }

  /**
   * Helper: Verifikasi hak akses guru pada penugasan mengajar
   */
  private async verifyTeacherAssignmentScope(
    penugasanId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ) {
    if (isSuperAdmin) return true;

    const penugasan = await prisma.penugasanMengajar.findFirst({
      where: { id: penugasanId, sekolah_id: sekolahId },
      select: { guru_id: true, status: true },
    });

    if (!penugasan) {
      throw new CbtNotFoundError(`Penugasan mengajar ${penugasanId} tidak ditemukan.`);
    }

    if (!guruId || penugasan.guru_id !== guruId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda hanya berwenang mengelola CBT pada kelas yang Anda ampu."
      );
    }

    return true;
  }

  /**
   * Helper: Verifikasi siswa aktif di rombel penugasan mengajar
   */
  private async verifyStudentEnrollment(
    penugasanId: string,
    sekolahId: string,
    siswaId: string
  ): Promise<{ penempatanRombelId: string }> {
    const penugasan = await prisma.penugasanMengajar.findFirst({
      where: { id: penugasanId, sekolah_id: sekolahId },
      select: { rombel_id: true },
    });

    if (!penugasan) {
      throw new CbtNotFoundError(`Penugasan mengajar ${penugasanId} tidak ditemukan.`);
    }

    const penempatan = await prisma.penempatanRombel.findFirst({
      where: {
        sekolah_id: sekolahId,
        rombel_id: penugasan.rombel_id,
        status: "AKTIF",
        keikutsertaan: {
          siswa_id: siswaId,
        },
      },
      select: { id: true },
    });

    if (!penempatan) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda tidak terdaftar sebagai siswa aktif di rombel kelas ini."
      );
    }

    return { penempatanRombelId: penempatan.id };
  }

  // ============================================================================
  // BANK SOAL & VERSI SOAL
  // ============================================================================

  async getQuestions(
    sekolahId: string,
    guruId?: string | null,
    filter?: { mapelId?: string; jenisSoal?: any; status?: any; search?: string }
  ): Promise<BankSoalDTO[]> {
    return this.repo.findBankSoal(sekolahId, guruId ?? undefined, filter);
  }

  async getQuestionDetail(bankSoalId: string, sekolahId: string): Promise<BankSoalDTO> {
    const q = await this.repo.findBankSoalById(bankSoalId, sekolahId);
    if (!q) throw new CbtNotFoundError(`Bank Soal ${bankSoalId} tidak ditemukan.`);
    return q;
  }

  async createQuestion(
    rawInput: unknown,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<BankSoalDTO> {
    const parsed = CreateBankSoalSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new CbtValidationError(
        `Validasi Bank Soal gagal: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const input = parsed.data;

    let effectiveGuruId = guruId?.trim();
    if (!effectiveGuruId) {
      const anyGuru = await prisma.guru.findFirst({
        where: { sekolah_id: sekolahId },
        select: { id: true },
      });
      if (anyGuru) {
        effectiveGuruId = anyGuru.id;
      }
    }
    if (!effectiveGuruId) {
      throw new CbtValidationError("Data guru pengampu tidak ditemukan di sekolah ini.");
    }

    let effectiveMapelId = input.mata_pelajaran_id?.trim();
    if (!effectiveMapelId) {
      const penugasan = await prisma.penugasanMengajar.findFirst({
        where: { sekolah_id: sekolahId, guru_id: effectiveGuruId, status: "AKTIF" },
        select: { mata_pelajaran_id: true },
      });
      if (penugasan) {
        effectiveMapelId = penugasan.mata_pelajaran_id;
      }
    }
    if (!effectiveMapelId) {
      const anyMapel = await prisma.mataPelajaran.findFirst({
        where: { sekolah_id: sekolahId },
        select: { id: true },
      });
      if (anyMapel) {
        effectiveMapelId = anyMapel.id;
      }
    }
    if (!effectiveMapelId) {
      throw new CbtValidationError("Mata pelajaran wajib dipilih untuk membuat butir soal.");
    }

    return this.repo.createBankSoal(
      { ...input, mata_pelajaran_id: effectiveMapelId },
      sekolahId,
      effectiveGuruId
    );
  }

  async createQuestionVersion(
    bankSoalId: string,
    rawInput: unknown,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<VersiSoalDTO> {
    const question = await this.repo.findBankSoalById(bankSoalId, sekolahId);
    if (!question) throw new CbtNotFoundError(`Bank Soal ${bankSoalId} tidak ditemukan.`);

    if (
      !isSuperAdmin &&
      guruId &&
      (question.guru_id || question.pembuat_guru_id) &&
      (question.guru_id || question.pembuat_guru_id) !== guruId
    ) {
      throw new CbtAccessDeniedError("Akses ditolak: Anda bukan pembuat soal ini.");
    }

    const parsed = CreateVersiSoalSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new CbtValidationError(
        `Validasi Versi Soal gagal: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const input: CreateVersiSoalInput = parsed.data;

    return this.repo.createVersiSoal(bankSoalId, input, guruId ?? null);
  }

  // ============================================================================
  // DUAL QUESTION BANK (PERSONAL vs SEKOLAH)
  // ============================================================================

  async getPersonalQuestions(
    sekolahId: string,
    guruId: string,
    filter?: {
      mataPelajaranId?: string;
      tipe_soal?: string;
      tingkat_kesulitan?: string;
      level_kognitif?: string;
      search?: string;
    }
  ): Promise<BankSoalDTO[]> {
    if (!guruId) {
      throw new CbtAccessDeniedError("Akses ditolak: Identitas guru wajib ditentukan.");
    }
    return this.repo.getPersonalQuestions(sekolahId, guruId, filter);
  }

  async getSchoolQuestions(
    sekolahId: string,
    mataPelajaranId: string,
    filter?: {
      tipe_soal?: string;
      tingkat_kesulitan?: string;
      level_kognitif?: string;
      search?: string;
    }
  ): Promise<BankSoalDTO[]> {
    if (!mataPelajaranId) {
      throw new CbtValidationError("Mata pelajaran wajib dipilih untuk melihat bank soal sekolah.");
    }
    return this.repo.getSchoolQuestions(sekolahId, mataPelajaranId, filter);
  }

  async shareQuestionToSchoolBank(
    bankSoalId: string,
    sekolahId: string,
    actorGuruId: string,
    levelKognitif?: "L1" | "L2" | "L3"
  ): Promise<BankSoalDTO> {
    const question = await this.repo.findBankSoalById(bankSoalId, sekolahId);
    if (!question) throw new CbtNotFoundError(`Bank Soal ${bankSoalId} tidak ditemukan.`);

    if (question.guru_id !== actorGuruId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Hanya pemilik soal yang dapat membagikan butir soal ke Bank Soal Sekolah."
      );
    }

    return this.repo.updateQuestionScope(
      sekolahId,
      bankSoalId,
      actorGuruId,
      "SEKOLAH",
      levelKognitif
    );
  }

  async cloneQuestionToPersonal(
    bankSoalId: string,
    sekolahId: string,
    actorGuruId: string,
    actorName: string
  ): Promise<BankSoalDTO> {
    const question = await this.repo.findBankSoalById(bankSoalId, sekolahId);
    if (!question) throw new CbtNotFoundError(`Bank Soal ${bankSoalId} tidak ditemukan.`);

    // Jika soal berstatus PERSONAL milik orang lain, tolak kloning
    if (question.scope_kepemilikan === "PERSONAL" && question.guru_id !== actorGuruId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda tidak memiliki izin menyalin soal privat milik guru lain."
      );
    }

    return this.repo.cloneQuestionToPersonal(sekolahId, bankSoalId, actorGuruId, actorName);
  }

  async deleteQuestionPermanently(
    bankSoalId: string,
    sekolahId: string,
    actorGuruId?: string | null,
    isSuperAdmin = false
  ): Promise<void> {
    if (!bankSoalId) {
      throw new CbtValidationError("ID butir soal wajib disertakan.");
    }
    return this.repo.deleteQuestionPermanently(bankSoalId, sekolahId, actorGuruId, isSuperAdmin);
  }

  // ============================================================================
  // UJIAN CBT & SNAPSHOT BLUEPRINT
  // ============================================================================

  async getExamsByPenugasan(
    penugasanId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<UjianCbtDTO[]> {
    await this.verifyTeacherAssignmentScope(penugasanId, sekolahId, guruId, isSuperAdmin);
    return this.repo.findUjianByPenugasan(penugasanId, sekolahId);
  }

  async getExamDetail(
    ujianId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<UjianCbtDTO> {
    const exam = await this.repo.findUjianById(ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${ujianId} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );
    return exam;
  }

  async createExam(
    rawInput: unknown,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<UjianCbtDTO> {
    const parsed = CreateUjianCbtSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new CbtValidationError(
        `Validasi Ujian CBT gagal: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const input: CreateUjianCbtInput = parsed.data;

    await this.verifyTeacherAssignmentScope(
      input.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    return this.repo.createUjian(input, sekolahId, guruId ?? null);
  }

  async publishExam(
    ujianId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<{ ujian: UjianCbtDTO; snapshotId: string }> {
    const exam = await this.repo.findUjianById(ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${ujianId} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    // Invariant: Snapshot dibuat saat publikasi dan bersifat immutable
    const result = await this.repo.freezeSnapshot(ujianId, sekolahId);
    await this.repo.updateUjianStatus(ujianId, "DIPUBLIKASI", sekolahId);

    const updatedExam = await this.repo.findUjianById(ujianId, sekolahId);
    return { ujian: updatedExam!, snapshotId: result.id };
  }

  async archiveExam(
    ujianId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<void> {
    const exam = await this.repo.findUjianById(ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${ujianId} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );
    await this.repo.updateUjianStatus(ujianId, "DIARSIPKAN", sekolahId);
  }

  async bulkCreateQuestions(
    questions: any[],
    sekolahId: string,
    guruId?: string | null,
    mapelId?: string | null
  ): Promise<{ count: number }> {
    let created = 0;
    for (const q of questions) {
      const payload = {
        mata_pelajaran_id: mapelId || q.mata_pelajaran_id,
        kode: q.kode || undefined,
        jenis_soal: q.jenis_soal || "PILIHAN_GANDA",
        tingkat_kesulitan: q.tingkat_kesulitan || "SEDANG",
        bobot_default: q.bobot || q.bobot_default || 1,
        pertanyaan: q.pertanyaan,
        gambar_url: q.gambar_url || null,
        opsi: q.opsi,
        kunci_jawaban: q.kunci_jawaban,
      };
      await this.createQuestion(payload, sekolahId, guruId, true);
      created++;
    }
    return { count: created };
  }

  // ============================================================================
  // STUDENT EXAM ATTEMPT & PLAYER LIFECYCLE
  // ============================================================================

  /**
   * Memulai atau melanjutkan attempt pengerjaan ujian siswa
   */
  async startOrResumeAttempt(
    ujianId: string,
    sekolahId: string,
    siswaId: string,
    metadata?: { ipAddress?: string; userAgent?: string },
    tokenInput?: string
  ): Promise<{
    session: SesiUjianSiswaDTO;
    manifest: ManifestItemSoal[];
    timeRemainingSeconds: number;
    savedAnswers: Record<string, any>;
    sessionToken?: string | null;
  }> {
    const exam = await this.repo.findUjianById(ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${ujianId} tidak ditemukan.`);

    // Check token if required
    if (exam.gunakan_token && exam.token_masuk) {
      const given = (tokenInput || "").trim().toUpperCase();
      const expected = exam.token_masuk.trim().toUpperCase();
      if (!given || given !== expected) {
        throw new CbtAccessDeniedError(
          "Token ujian tidak valid. Pastikan token yang Anda masukkan sesuai dengan yang diberikan oleh pengawas ruang."
        );
      }
    }

    if (
      exam.status !== "DIPUBLIKASI" &&
      exam.status !== "DITERBITKAN" &&
      exam.status !== "BERLANGSUNG"
    ) {
      throw new CbtExamNotActiveError("Ujian ini belum dibuka atau telah diarsipkan.");
    }

    const now = new Date();
    if (exam.waktu_mulai && now < new Date(exam.waktu_mulai)) {
      throw new CbtExamNotActiveError("Ujian belum dapat dimulai sesuai jadwal.");
    }
    if (exam.waktu_selesai && now > new Date(exam.waktu_selesai)) {
      throw new CbtExamNotActiveError("Waktu pelaksanaan ujian telah berakhir.");
    }

    // Verify student active enrollment in rombel
    const { penempatanRombelId } = await this.verifyStudentEnrollment(
      exam.penugasan_mengajar_id,
      sekolahId,
      siswaId
    );

    // Ambil atau buat snapshot
    let snapshot = await this.repo.getActiveSnapshot(ujianId);
    if (!snapshot) {
      // Auto-freeze snapshot jika belum ada saat student start
      snapshot = await this.repo.freezeSnapshot(ujianId, sekolahId);
    }

    // Start or resume attempt (Enforcing One Active Attempt)
    const session = await this.repo.startOrResumeAttempt(
      ujianId,
      snapshot.id,
      siswaId,
      penempatanRombelId,
      exam.durasi_menit,
      { ...metadata, tokenInput }
    );

    if (session.status === "TERKUNCI_PELANGGARAN") {
      throw new CbtAttemptLockedError(
        "Sesi ujian Anda telah terkunci karena pelanggaran integritas. Hubungi pengawas ujian."
      );
    }

    if (session.status === "SELESAI" || session.status === "TERLAMBAT") {
      throw new CbtAttemptClosedError("Sesi ujian Anda telah selesai dan dikumpulkan.");
    }

    // Server-Authoritative Timer Check
    const deadline = new Date(session.batas_waktu_server).getTime();
    const remainingMs = deadline - Date.now();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    if (remainingSeconds <= 0 && session.status === "SEDANG_MENGERJAKAN") {
      // Auto-close attempt due to server timer expiration
      await this.repo.submitAttempt(session.id);
      throw new CbtTimerExpiredError("Waktu pengerjaan ujian Anda telah habis.");
    }

    // Load existing answers
    const answers = await this.repo.findJawabanBySession(session.id);
    const savedAnswers: Record<string, any> = {};
    for (const ans of answers) {
      savedAnswers[ans.nomor_urut] = {
        jawaban_pilihan: ans.jawaban_pilihan,
        jawaban_teks: ans.jawaban_teks,
        jawaban_kompleks: ans.jawaban_kompleks,
        ragu_ragu: ans.ragu_ragu,
      };
    }

    const rawManifest: any[] = Array.isArray(snapshot.manifest_soal)
      ? snapshot.manifest_soal
      : typeof snapshot.manifest_soal === "string"
        ? JSON.parse(snapshot.manifest_soal)
        : [];

    const normalizedManifest = rawManifest.map((item) => ({
      ...item,
      soal_id: item.soal_id || item.bank_soal_id,
    }));

    // Invariant: Return manifest WITHOUT answer keys or scoring rubrics
    return {
      session,
      manifest: normalizedManifest,
      timeRemainingSeconds: remainingSeconds,
      savedAnswers,
      sessionToken: session.token_sesi_aktif,
    };
  }

  /**
   * Ambil data player untuk attempt aktif siswa
   */
  async getAttemptPlayer(
    attemptId: string,
    sekolahId: string,
    siswaId: string
  ): Promise<{
    session: SesiUjianSiswaDTO;
    manifest: ManifestItemSoal[];
    timeRemainingSeconds: number;
    savedAnswers: Record<string, any>;
    sessionToken?: string | null;
    ujian: { judul: string; deskripsi: string | null; acak_soal: boolean };
  }> {
    const session = await this.repo.findSessionById(attemptId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian ${attemptId} tidak ditemukan.`);

    if (session.siswa_id !== siswaId) {
      throw new CbtAccessDeniedError("Akses ditolak: Sesi ujian ini bukan milik Anda.");
    }

    const exam = await this.repo.findUjianById(session.ujian_cbt_id, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT tidak ditemukan.`);

    const snapshot = await this.repo.getActiveSnapshot(session.ujian_cbt_id);
    if (!snapshot) throw new CbtNotFoundError(`Snapshot ujian tidak ditemukan.`);

    if (session.status === "TERKUNCI_PELANGGARAN") {
      throw new CbtAttemptLockedError(
        "Sesi ujian Anda telah terkunci karena indikasi kecurangan. Silakan lapor ke pengawas."
      );
    }

    if (
      session.status === "SELESAI" ||
      session.status === "DIKUMPULKAN" ||
      session.status === "WAKTU_HABIS" ||
      session.status === "TERLAMBAT"
    ) {
      throw new CbtAttemptClosedError(
        "Sesi ujian Anda telah selesai dan dikumpulkan. Lembar ujian tidak dapat diakses lagi."
      );
    }

    const deadline = new Date(session.batas_waktu_server).getTime();
    const remainingSeconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000));

    if (remainingSeconds <= 0 && session.status === "SEDANG_MENGERJAKAN") {
      await this.repo.submitAttempt(session.id);
      throw new CbtTimerExpiredError("Batas waktu server ujian Anda telah berakhir.");
    }

    const answers = await this.repo.findJawabanBySession(session.id);
    const savedAnswers: Record<string, any> = {};
    for (const ans of answers) {
      savedAnswers[ans.nomor_urut] = {
        jawaban_pilihan: ans.jawaban_pilihan,
        jawaban_teks: ans.jawaban_teks,
        jawaban_kompleks: ans.jawaban_kompleks,
        ragu_ragu: ans.ragu_ragu,
      };
    }

    const rawManifest: any[] = Array.isArray(snapshot.manifest_soal)
      ? snapshot.manifest_soal
      : typeof snapshot.manifest_soal === "string"
        ? JSON.parse(snapshot.manifest_soal)
        : [];

    const normalizedManifest = rawManifest.map((item) => ({
      ...item,
      soal_id: item.soal_id || item.bank_soal_id,
    }));

    return {
      session,
      manifest: normalizedManifest,
      timeRemainingSeconds: remainingSeconds,
      savedAnswers,
      sessionToken: session.token_sesi_aktif,
      ujian: {
        judul: exam.judul,
        deskripsi: exam.deskripsi,
        acak_soal: exam.acak_soal,
      },
    };
  }

  /**
   * Autosave jawaban siswa secara periodik / per perubahan butir
   */
  async autosaveAnswer(
    rawInput: unknown,
    sekolahId: string,
    siswaId: string
  ): Promise<{ savedAt: Date; saved: boolean }> {
    const parsed = AutosaveJawabanSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new CbtValidationError(
        `Validasi autosave jawaban gagal: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const input: AutosaveJawabanInput = parsed.data;

    // HIGH-RISK-01: Optimized Single Validation + Single Upsert Fast Path
    if (input.soal_id) {
      await this.repo.saveAnswerOptimized({
        sesi_ujian_id: input.sesi_ujian_siswa_id,
        siswa_id: siswaId,
        soal_id: input.soal_id,
        versi_soal_id: input.versi_soal_id,
        session_token: input.session_token,
        jawaban_pilihan: input.jawaban_pilihan,
        jawaban_teks: input.jawaban_teks,
        jawaban_kompleks: input.jawaban_kompleks,
        jawaban_menjodohkan: input.jawaban_menjodohkan,
        ragu_ragu: input.ragu_ragu,
      });
      return { savedAt: new Date(), saved: true };
    }

    // Fallback path untuk backward compatibility
    const session = await this.repo.findSessionById(input.sesi_ujian_siswa_id);
    if (!session) throw new CbtNotFoundError(`Sesi ujian tidak ditemukan.`);

    if (session.siswa_id !== siswaId) {
      throw new CbtAccessDeniedError("Akses ditolak: Sesi ujian bukan milik Anda.");
    }

    // HIGH-RISK-02: Single Device Lock Validation
    if (
      session.token_sesi_aktif &&
      input.session_token &&
      session.token_sesi_aktif !== input.session_token
    ) {
      throw new CbtSessionInvalidatedError(
        "Sesi ujian Anda telah dibuka di perangkat lain. Halaman ini telah dinonaktifkan."
      );
    }

    if (session.status !== "SEDANG_MENGERJAKAN") {
      throw new CbtAttemptClosedError(
        `Sesi ujian telah ditutup (status: ${session.status}). Jawaban tidak dapat disimpan.`
      );
    }

    // Server-Authoritative Timer Check
    const deadline = new Date(session.batas_waktu_server).getTime();
    if (Date.now() > deadline) {
      await this.repo.submitAttempt(session.id);
      throw new CbtTimerExpiredError("Waktu ujian telah habis. Sesi telah dikumpulkan.");
    }

    await this.repo.saveJawaban(input);
    return { savedAt: new Date(), saved: true };
  }

  /**
   * Mencatat Event Integritas (blur, keluar layar penuh, devtools, tab switch).
   * Pada batas percobaan tertentu (misal 2 strike keluar layar), mengunci attempt.
   */
  async recordIntegrityEvent(
    rawInput: unknown,
    sekolahId: string,
    siswaId: string
  ): Promise<{ event: EventIntegritasDTO; isLocked: boolean }> {
    const parsed = RecordIntegrityEventSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new CbtValidationError(
        `Validasi event integritas gagal: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const input: RecordIntegrityEventInput = parsed.data;

    const sessionId = input.sesi_ujian_siswa_id || input.sesi_ujian_id;
    if (!sessionId) {
      throw new CbtValidationError("ID sesi ujian wajib disertakan.");
    }

    const session = await this.repo.findSessionById(sessionId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian tidak ditemukan.`);

    if (session.siswa_id !== siswaId) {
      throw new CbtAccessDeniedError("Akses ditolak: Sesi ujian bukan milik Anda.");
    }

    const event = await this.repo.recordIntegrityEvent(input);

    // Periksa total strike pelanggaran keluar layar / pindah tab
    const allEvents = await this.repo.findIntegrityEvents(session.id);
    const exitScreenEvents = allEvents.filter(
      (e) => e.tipe_event === "KELUAR_LAYAR_PENUH" || e.tipe_event === "PINDAH_TAB_ATAU_WINDOW"
    );

    let isLocked = false;
    // Jika strike >= 2, kunci sesi ujian siswa
    if (exitScreenEvents.length >= 2 && session.status === "SEDANG_MENGERJAKAN") {
      await this.repo.lockAttemptForViolation(
        session.id,
        `Sesi dikunci otomatis: Terdeteksi ${exitScreenEvents.length} kali keluar dari layar penuh / pindah tab.`,
        session.sekolah_id
      );
      isLocked = true;
    }

    return { event, isLocked };
  }

  /**
   * Mengumpulkan ujian siswa dan melakukan penilaian otomatis server-side
   */
  async submitAttempt(
    attemptId: string,
    sekolahId: string,
    siswaId: string,
    sessionToken?: string | null
  ): Promise<HasilUjianCbtDTO> {
    const session = await this.repo.findSessionById(attemptId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian ${attemptId} tidak ditemukan.`);

    if (session.siswa_id !== siswaId) {
      throw new CbtAccessDeniedError("Akses ditolak: Sesi ujian bukan milik Anda.");
    }

    // HIGH-RISK-02: Single Device Lock Validation
    if (session.token_sesi_aktif && sessionToken && session.token_sesi_aktif !== sessionToken) {
      throw new CbtSessionInvalidatedError(
        "Sesi ujian Anda telah dibuka di perangkat lain. Pengumpulan dari perangkat ini ditolak."
      );
    }

    if (session.status === "TERKUNCI_PELANGGARAN") {
      throw new CbtAttemptLockedError(
        "Sesi ujian Anda terkunci karena pelanggaran. Tidak dapat melakukan submission mandiri."
      );
    }

    return this.repo.submitAttempt(attemptId);
  }

  /**
   * Ambil hasil ujian siswa untuk tampilan selesai
   */
  async getStudentResult(
    attemptId: string,
    sekolahId: string,
    siswaId: string
  ): Promise<{ session: SesiUjianSiswaDTO; hasil: HasilUjianCbtDTO | null }> {
    const session = await this.repo.findSessionById(attemptId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian ${attemptId} tidak ditemukan.`);

    if (session.siswa_id !== siswaId) {
      throw new CbtAccessDeniedError("Akses ditolak: Sesi ujian bukan milik Anda.");
    }

    const hasil = await this.repo.findHasilBySession(attemptId);
    return { session, hasil };
  }

  // ============================================================================
  // PROCTORING & TEACHER MONITORING & GRADEBOOK BRIDGE
  // ============================================================================

  /**
   * Monitor seluruh sesi ujian siswa pada suatu Ujian CBT (untuk Pengawas / Guru)
   */
  async getExamAttempts(
    ujianId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<{
    ujian: UjianCbtDTO;
    attempts: Array<
      SesiUjianSiswaDTO & {
        siswa: { id: string; nama_lengkap: string; nisn: string | null };
        hasil: HasilUjianCbtDTO | null;
        integrityEventCount: number;
      }
    >;
  }> {
    const exam = await this.getExamDetail(ujianId, sekolahId, guruId, isSuperAdmin);
    const attempts = await this.repo.findExamAttempts(ujianId);
    return { ujian: exam, attempts };
  }

  /**
   * Guru membuka kunci sesi ujian siswa yang sempat terkunci pelanggaran
   */
  async unlockAttempt(
    attemptId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<void> {
    const session = await this.repo.findSessionById(attemptId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian ${attemptId} tidak ditemukan.`);

    const exam = await this.repo.findUjianById(session.ujian_cbt_id, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );
    await this.repo.unlockAttempt(attemptId, sekolahId);
  }

  /**
   * Reset attempt pengerjaan siswa agar siswa dapat mengulang dari awal
   */
  async resetAttempt(
    attemptId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<void> {
    const session = await this.repo.findSessionById(attemptId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian ${attemptId} tidak ditemukan.`);

    const exam = await this.repo.findUjianById(session.ujian_cbt_id, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );
    await this.repo.resetAttempt(attemptId);
  }

  /**
   * Pengawas / Guru memaksa pengumpulan jawaban siswa dari jarak jauh
   */
  async forceSubmitAttempt(
    attemptId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<any> {
    const session = await this.repo.findSessionById(attemptId);
    if (!session) throw new CbtNotFoundError(`Sesi ujian ${attemptId} tidak ditemukan.`);

    if (session.status !== "SEDANG_MENGERJAKAN" && session.status !== "TERKUNCI_PELANGGARAN") {
      throw new CbtAttemptClosedError(
        `Sesi ujian ${attemptId} sudah ditutup (status: ${session.status}). Tidak dapat dipaksa kumpul.`
      );
    }

    const exam = await this.repo.findUjianById(session.ujian_cbt_id, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );
    return this.repo.submitAttempt(attemptId);
  }

  /**
   * Transfer nilai hasil CBT ke Buku Nilai (M13 Assessment Module)
   */
  async transferToGradebook(
    rawInput: unknown,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<{ assessmentId: string; transferredCount: number }> {
    const parsed = TransferToGradebookSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new CbtValidationError(
        `Validasi transfer nilai gagal: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const input: TransferToGradebookInput = parsed.data;

    const exam = await this.repo.findUjianById(input.ujian_cbt_id, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${input.ujian_cbt_id} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    return this.repo.transferResultsToGradebook(input, sekolahId);
  }

  /**
   * Koreksi & submit lembar jawaban manual (LJM kertas / susulan)
   */
  async submitPaperExam(
    ujianId: string,
    siswaId: string,
    jawabanMap: Record<number, string>,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<HasilUjianCbtDTO> {
    const exam = await this.repo.findUjianById(ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${ujianId} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    return this.repo.submitPaperExam(ujianId, siswaId, jawabanMap, sekolahId);
  }

  /**
   * Ekstraksi visual foto Lembar Jawaban Manual via AI Vision
   */
  async scanPaperLjmPhoto(
    imageBase64: string,
    totalSoal: number,
    mimeType = "image/jpeg"
  ): Promise<{
    detectedAnswers: Record<number, string>;
    confidence: number;
    detectedStudentName?: string;
    detectedNis?: string;
    notes: string;
  }> {
    return this.repo.scanPaperLjmPhoto(imageBase64, totalSoal, mimeType);
  }

  /**
   * Mengambil daftar seluruh soal dan kunci jawaban dari ujian aktif untuk keperluan koreksi/edit
   */
  async getActiveExamQuestionsForEdit(
    ujianId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<{
    ujian: { id: string; judul: string; status: string };
    questions: Array<{
      nomor_urut: number;
      bank_soal_id: string;
      versi_soal_id: string;
      tipe_soal: string;
      pertanyaan: string;
      gambar_url: string | null;
      opsi_jawaban: any;
      kunci_jawaban: any;
      bobot: number;
      pembahasan: string | null;
    }>;
  }> {
    const exam = await this.repo.findUjianById(ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${ujianId} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    const snapshot = await this.repo.getActiveSnapshot(ujianId);
    if (!snapshot) {
      throw new CbtNotFoundError(`Snapshot untuk ujian CBT ${ujianId} tidak ditemukan.`);
    }

    const manifest: any[] = Array.isArray(snapshot.manifest_soal)
      ? snapshot.manifest_soal
      : JSON.parse(snapshot.manifest_soal || "[]");

    const keysList: any[] = Array.isArray(snapshot.kunci_penilaian)
      ? snapshot.kunci_penilaian
      : JSON.parse(snapshot.kunci_penilaian || "[]");

    const keysMap = new Map<string, any>();
    keysList.forEach((k) => {
      const id = k.bank_soal_id || k.soal_id || String(k.nomor_urut);
      keysMap.set(id, k);
    });

    const questions = manifest.map((m, idx) => {
      const bankId = m.bank_soal_id || m.soal_id;
      const keyObj = keysMap.get(bankId) || keysMap.get(String(m.nomor_urut)) || keysList[idx];
      return {
        nomor_urut: m.nomor_urut || idx + 1,
        bank_soal_id: bankId,
        versi_soal_id: m.versi_soal_id,
        tipe_soal: m.tipe_soal || "PILIHAN_GANDA",
        pertanyaan: m.pertanyaan || "",
        gambar_url: m.gambar_url || null,
        opsi_jawaban: m.opsi_jawaban || m.opsi || null,
        kunci_jawaban: keyObj?.kunci_jawaban ?? null,
        bobot: m.bobot || keyObj?.bobot || 1,
        pembahasan: keyObj?.pembahasan || null,
      };
    });

    return {
      ujian: {
        id: exam.id,
        judul: exam.judul,
        status: exam.status,
      },
      questions,
    };
  }

  /**
   * Mengedit/mengoreksi butir soal pada ujian CBT aktif dan menyinkronkan snapshot
   */
  async updateActiveExamQuestion(
    input: {
      ujianId: string;
      bankSoalId: string;
      nomorUrut?: number;
      pertanyaan: string;
      gambar_url?: string | null;
      opsi?: any[];
      kunci_jawaban?: any;
      bobot?: number;
      recalculateScores?: boolean;
    },
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<{ success: boolean; message: string }> {
    const exam = await this.repo.findUjianById(input.ujianId, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT ${input.ujianId} tidak ditemukan.`);

    await this.verifyTeacherAssignmentScope(
      exam.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    const snapshot = await this.repo.getActiveSnapshot(input.ujianId);
    if (!snapshot) {
      throw new CbtNotFoundError(`Snapshot ujian ${input.ujianId} tidak ditemukan.`);
    }

    // 1. Update atau terbitkan Versi Baru pada Bank Soal
    let updatedVersiId = "";
    try {
      const newVersion = await this.repo.createVersiSoal(
        input.bankSoalId,
        {
          pertanyaan: input.pertanyaan,
          gambar_url: input.gambar_url || undefined,
          opsi: input.opsi,
          kunci_jawaban: input.kunci_jawaban,
          bobot: input.bobot || 1,
        },
        guruId ?? null
      );
      updatedVersiId = newVersion.id;
    } catch {
      // Jika bank soal direct update fallback
      const latestVer = await prisma.versiSoal.findFirst({
        where: { bank_soal_id: input.bankSoalId },
        orderBy: { nomor_versi: "desc" },
      });
      if (latestVer) {
        await prisma.versiSoal.update({
          where: { id: latestVer.id },
          data: {
            pertanyaan: input.pertanyaan,
            gambar_url: input.gambar_url,
            opsi_jawaban: input.opsi ? JSON.stringify(input.opsi) : null,
            kunci_jawaban: input.kunci_jawaban ? JSON.stringify(input.kunci_jawaban) : null,
            bobot_default: input.bobot || 1,
          },
        });
        updatedVersiId = latestVer.id;
      }
    }

    // 2. Perbarui manifest_soal & kunci_penilaian pada snapshot
    const manifest: any[] = Array.isArray(snapshot.manifest_soal)
      ? snapshot.manifest_soal
      : JSON.parse(snapshot.manifest_soal || "[]");

    const keysList: any[] = Array.isArray(snapshot.kunci_penilaian)
      ? snapshot.kunci_penilaian
      : JSON.parse(snapshot.kunci_penilaian || "[]");

    for (let i = 0; i < manifest.length; i++) {
      const m = manifest[i];
      if (
        (m.bank_soal_id && m.bank_soal_id === input.bankSoalId) ||
        (m.soal_id && m.soal_id === input.bankSoalId) ||
        (input.nomorUrut && m.nomor_urut === input.nomorUrut)
      ) {
        m.pertanyaan = input.pertanyaan;
        m.gambar_url = input.gambar_url || null;
        if (input.opsi) {
          m.opsi_jawaban = input.opsi;
          m.opsi = input.opsi;
        }
        if (input.bobot !== undefined) {
          m.bobot = input.bobot;
        }
        if (updatedVersiId) {
          m.versi_soal_id = updatedVersiId;
        }
        break;
      }
    }

    for (let i = 0; i < keysList.length; i++) {
      const k = keysList[i];
      if (
        (k.bank_soal_id && k.bank_soal_id === input.bankSoalId) ||
        (k.soal_id && k.soal_id === input.bankSoalId) ||
        (input.nomorUrut && k.nomor_urut === input.nomorUrut)
      ) {
        if (input.kunci_jawaban !== undefined) {
          k.kunci_jawaban = Array.isArray(input.kunci_jawaban)
            ? input.kunci_jawaban
            : [input.kunci_jawaban];
        }
        if (input.bobot !== undefined) {
          k.bobot = input.bobot;
        }
        if (updatedVersiId) {
          k.versi_soal_id = updatedVersiId;
        }
        break;
      }
    }

    await prisma.snapshotUjian.update({
      where: { id: snapshot.id },
      data: {
        manifest_soal: JSON.stringify(manifest),
        kunci_penilaian: JSON.stringify(keysList),
      },
    });

    // 3. Jika diminta hitung ulang skor yang sudah terkumpul
    if (input.recalculateScores) {
      const submittedSessions = await prisma.sesiUjianSiswa.findMany({
        where: {
          ujian_cbt_id: input.ujianId,
          status: { in: ["DIKUMPULKAN", "SELESAI", "WAKTU_HABIS"] },
        },
        select: { id: true },
      });

      for (const s of submittedSessions) {
        try {
          await this.repo.submitAttempt(s.id, "Koreksi butir soal ujian aktif", true);
        } catch {}
      }
    }

    return {
      success: true,
      message: `Soal berhasil dikoreksi dan snapshot ujian aktif telah disinkronkan.${
        input.recalculateScores ? " Seluruh nilai peserta yang terkumpul telah dihitung ulang." : ""
      }`,
    };
  }
}

export const cbtService = new CbtService();
