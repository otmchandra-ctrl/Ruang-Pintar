import { describe, it, expect, vi, beforeEach } from "vitest";
import { cbtService } from "@/modules/cbt/application/cbt-service";
import { prisma } from "@/shared/infrastructure/database/prisma";
import {
  CbtAccessDeniedError,
  CbtExamNotActiveError,
  CbtAttemptClosedError,
  CbtTimerExpiredError,
  CbtNotFoundError,
} from "@/modules/cbt/domain/cbt-errors";

describe("STAGE CBT-03.2 — CBT Player Foundation & Student Exam Runtime", () => {
  const SCH_ID = "SCH_CBT_032_TEST";
  const GURU_ID = "GURU_032_A";
  const MAPEL_ID = "MP_032_BIO";
  const ROMBEL_A_ID = "RBL_032_X1";
  const ROMBEL_B_ID = "RBL_032_X2";
  const PENUGASAN_A_ID = "PNG_032_A";
  const SISWA_A_ID = "SISWA_032_A";
  const SISWA_B_ID = "SISWA_032_B";
  const PLACEMENT_A_ID = "PLC_032_A";
  const ENROLLMENT_A_ID = "ENR_032_A";

  beforeEach(async () => {
    // Clean up test data
    await prisma.jawabanSiswa.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.sesiUjianSiswa.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.hasilUjianCbt.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.snapshotUjian.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.ujianCbt.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.versiSoal.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.bankSoal.deleteMany({ where: { sekolah_id: SCH_ID } });
  });

  // Helper setup
  async function setupStudentAndExamFixture(options?: {
    gunakanToken?: boolean;
    tokenMasuk?: string;
    tampilkanNilai?: boolean;
    durasiMenit?: number;
  }) {
    // 1. Ensure School, Teacher, Mapel, Rombel, Student, Placement exist
    await prisma.sekolah.upsert({
      where: { id: SCH_ID },
      update: {},
      create: { id: SCH_ID, nama: "SMA Digital CBT 03.2", npsn: "12345678", jenjang: "SMA" },
    });

    const ta = await prisma.tahunAjaran.upsert({
      where: { id: "TA_032" },
      update: {},
      create: {
        id: "TA_032",
        sekolah_id: SCH_ID,
        nama: "2025/2026",
        tanggal_mulai: new Date("2025-07-01"),
        tanggal_selesai: new Date("2026-06-30"),
      },
    });

    const tingkat = await prisma.tingkatKelas.upsert({
      where: { sekolah_id_kode: { sekolah_id: SCH_ID, kode: "X" } },
      update: {},
      create: { id: "TK_032_X", sekolah_id: SCH_ID, kode: "X", nama: "Kelas 10", urutan: 10 },
    });

    await prisma.rombel.upsert({
      where: { id: ROMBEL_A_ID },
      update: {},
      create: {
        id: ROMBEL_A_ID,
        sekolah_id: SCH_ID,
        tahun_ajaran_id: ta.id,
        tingkat_id: tingkat.id,
        nama: "X-MIPA-1",
      },
    });

    await prisma.rombel.upsert({
      where: { id: ROMBEL_B_ID },
      update: {},
      create: {
        id: ROMBEL_B_ID,
        sekolah_id: SCH_ID,
        tahun_ajaran_id: ta.id,
        tingkat_id: tingkat.id,
        nama: "X-MIPA-2",
      },
    });

    await prisma.mataPelajaran.upsert({
      where: { id: MAPEL_ID },
      update: {},
      create: { id: MAPEL_ID, sekolah_id: SCH_ID, nama: "Biologi Sel", kode: "BIO-01" },
    });

    await prisma.guru.upsert({
      where: { id: GURU_ID },
      update: {},
      create: { id: GURU_ID, sekolah_id: SCH_ID, nama_lengkap: "Dr. Biologi", jenis_kelamin: "L" },
    });

    await prisma.penugasanMengajar.upsert({
      where: { id: PENUGASAN_A_ID },
      update: {},
      create: {
        id: PENUGASAN_A_ID,
        sekolah_id: SCH_ID,
        guru_id: GURU_ID,
        mata_pelajaran_id: MAPEL_ID,
        rombel_id: ROMBEL_A_ID,
        tahun_ajaran_id: ta.id,
      },
    });

    // Student A (in Rombel A)
    await prisma.siswa.upsert({
      where: { id: SISWA_A_ID },
      update: {},
      create: {
        id: SISWA_A_ID,
        sekolah_id: SCH_ID,
        nama_lengkap: "Ahmad Siswa 1",
        nis: "NIS-001",
        jenis_kelamin: "L",
        status_akademik: "AKTIF",
      },
    });

    await prisma.keikutsertaanSiswa.upsert({
      where: { id: ENROLLMENT_A_ID },
      update: {},
      create: {
        id: ENROLLMENT_A_ID,
        sekolah_id: SCH_ID,
        siswa_id: SISWA_A_ID,
        tahun_ajaran_id: ta.id,
        status: "AKTIF",
      },
    });

    await prisma.penempatanRombel.upsert({
      where: { id: PLACEMENT_A_ID },
      update: {},
      create: {
        id: PLACEMENT_A_ID,
        sekolah_id: SCH_ID,
        keikutsertaan_id: ENROLLMENT_A_ID,
        rombel_id: ROMBEL_A_ID,
        status: "AKTIF",
      },
    });

    // Student B (in Rombel B - not in Rombel A)
    await prisma.siswa.upsert({
      where: { id: SISWA_B_ID },
      update: {},
      create: {
        id: SISWA_B_ID,
        sekolah_id: SCH_ID,
        nama_lengkap: "Budi Siswa 2",
        nis: "NIS-002",
        jenis_kelamin: "L",
        status_akademik: "AKTIF",
      },
    });

    const enrB = await prisma.keikutsertaanSiswa.upsert({
      where: { id: "ENR_032_B" },
      update: {},
      create: {
        id: "ENR_032_B",
        sekolah_id: SCH_ID,
        siswa_id: SISWA_B_ID,
        tahun_ajaran_id: ta.id,
        status: "AKTIF",
      },
    });

    await prisma.penempatanRombel.upsert({
      where: { id: "PLC_032_B" },
      update: {},
      create: {
        id: "PLC_032_B",
        sekolah_id: SCH_ID,
        keikutsertaan_id: enrB.id,
        rombel_id: ROMBEL_B_ID,
        status: "AKTIF",
      },
    });

    // 2. Create 6 types of questions in Bank Soal
    const q1 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "PILIHAN_GANDA",
        pertanyaan: "Fungsi mitokondria pada sel adalah?",
        opsi: [
          { label: "A", teks: "Respirasi seluler dan penghasil ATP", urutan: 1 },
          { label: "B", teks: "Sintesis protein", urutan: 2 },
          { label: "C", teks: "Fotosintesis", urutan: 3 },
        ],
        kunci_jawaban: "A",
        bobot_default: 10,
      },
      SCH_ID,
      GURU_ID,
      true
    );

    const q2 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "PILIHAN_GANDA_KOMPLEKS",
        pertanyaan: "Pilihlah organel yang bermembran ganda:",
        opsi: [
          { label: "A", teks: "Mitokondria", urutan: 1 },
          { label: "B", teks: "Kloroplas", urutan: 2 },
          { label: "C", teks: "Ribosom", urutan: 3 },
        ],
        kunci_jawaban: ["A", "B"],
        bobot_default: 15,
      },
      SCH_ID,
      GURU_ID,
      true
    );

    const q3 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "BENAR_SALAH",
        pertanyaan: "Dinding sel tumbuhan tersusun dari peptidoglikan.",
        opsi: [
          { label: "BENAR", teks: "Pernyataan Benar", urutan: 1 },
          { label: "SALAH", teks: "Pernyataan Salah", urutan: 2 },
        ],
        kunci_jawaban: "SALAH",
        bobot_default: 10,
      },
      SCH_ID,
      GURU_ID,
      true
    );

    const q4 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "MENJODOHKAN",
        pertanyaan: "Pasangkan organel dengan fungsinya:",
        opsi_jawaban: {
          premis: [
            { id: "1", teks: "Kloroplas" },
            { id: "2", teks: "Nukleus" },
          ],
          pilihan_target: ["Fotosintesis", "Pengatur aktivitas sel"],
        },
        kunci_jawaban: { "1": "Fotosintesis", "2": "Pengatur aktivitas sel" },
        bobot_default: 15,
      },
      SCH_ID,
      GURU_ID,
      true
    );

    const q5 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "ISIAN_SINGKAT",
        pertanyaan: "Cairan pengisi sel di luar nukleus disebut...",
        kunci_jawaban: "SITOPLASMA",
        bobot_default: 10,
      },
      SCH_ID,
      GURU_ID,
      true
    );

    const q6 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "ESAI",
        pertanyaan: "Jelaskan perbedaan sel prokariotik dan eukariotik!",
        kunci_jawaban: "Rubrik: Memiliki membran inti vs tidak memiliki membran inti.",
        bobot_default: 20,
      },
      SCH_ID,
      GURU_ID,
      true
    );

    // 3. Create Exam
    const exam = await cbtService.createExam(
      {
        penugasan_mengajar_id: PENUGASAN_A_ID,
        judul: "Asesmen Sumatif Biologi Sel",
        deskripsi: "CBT Ujian Bab Sel Terpadu",
        durasi_menit: options?.durasiMenit ?? 60,
        kkm_kktp: 75,
        acak_soal: false,
        acak_opsi: false,
        gunakan_token: options?.gunakanToken ?? false,
        token_masuk: options?.tokenMasuk ?? null,
        tampilkan_nilai: options?.tampilkanNilai ?? false,
        blueprint_soal: [
          { bank_soal_id: q1.id, nomor_urut: 1, bobot_kustom: 10 },
          { bank_soal_id: q2.id, nomor_urut: 2, bobot_kustom: 15 },
          { bank_soal_id: q3.id, nomor_urut: 3, bobot_kustom: 10 },
          { bank_soal_id: q4.id, nomor_urut: 4, bobot_kustom: 15 },
          { bank_soal_id: q5.id, nomor_urut: 5, bobot_kustom: 10 },
          { bank_soal_id: q6.id, nomor_urut: 6, bobot_kustom: 20 },
        ],
      },
      SCH_ID,
      GURU_ID,
      true
    );

    // Publish exam -> creates frozen immutable snapshot
    await cbtService.publishExam(exam.id, SCH_ID, GURU_ID, true);

    return { examId: exam.id };
  }

  // ============================================================================
  // 1. EXAM ENTRY GATE & TOKEN VALIDATION
  // ============================================================================
  it("harus menolak siswa jika ujian membutuhkan token dan token salah atau kosong", async () => {
    const { examId } = await setupStudentAndExamFixture({
      gunakanToken: true,
      tokenMasuk: "XYZ789",
    });

    // Tanpa token
    await expect(
      cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID, undefined, "")
    ).rejects.toThrow(CbtAccessDeniedError);

    // Token salah
    await expect(
      cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID, undefined, "SALAH1")
    ).rejects.toThrow(CbtAccessDeniedError);

    // Token benar (case-insensitive: xyz789 -> XYZ789)
    const result = await cbtService.startOrResumeAttempt(
      examId,
      SCH_ID,
      SISWA_A_ID,
      undefined,
      "xyz789"
    );
    expect(result.session).toBeDefined();
    expect(result.session.id).toBeDefined();
  });

  // ============================================================================
  // 2. STUDENT ELIGIBILITY & ENROLLMENT ENFORCEMENT
  // ============================================================================
  it("harus menolak siswa yang tidak terdaftar pada rombel ujian (Domain Invariant)", async () => {
    const { examId } = await setupStudentAndExamFixture();

    // Siswa B berada di ROMBEL_B, sedangkan ujian untuk ROMBEL_A
    await expect(cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_B_ID)).rejects.toThrow(
      CbtAccessDeniedError
    );
  });

  // ============================================================================
  // 3. ZERO ANSWER KEY LEAKAGE & SERVER AUTHORITATIVE TIMER
  // ============================================================================
  it("harus menyajikan manifest tanpa bocoran kunci jawaban dan menghitung timer authoritative", async () => {
    const { examId } = await setupStudentAndExamFixture({ durasiMenit: 45 });

    const startPayload = await cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID);
    const sessionId = startPayload.session.id;

    // Load attempt player
    const player = await cbtService.getAttemptPlayer(sessionId, SCH_ID, SISWA_A_ID);

    expect(player.manifest).toHaveLength(6);
    expect(player.timeRemainingSeconds).toBeGreaterThan(0);
    expect(player.timeRemainingSeconds).toBeLessThanOrEqual(45 * 60);

    // Verifikasi TIDAK ADA kunci_jawaban atau is_correct yang bocor ke client manifest
    for (const item of player.manifest) {
      expect((item as any).kunci_jawaban).toBeUndefined();
      expect((item as any).is_correct).toBeUndefined();
      expect((item as any).pembahasan).toBeUndefined();
    }
  });

  // ============================================================================
  // 4. IDEMPOTENT AUTOSAVE & SUPPORT FOR 6 QUESTION TYPES
  // ============================================================================
  it("harus menyimpan jawaban autosave secara idempotent untuk seluruh 6 tipe soal dan flag ragu-ragu", async () => {
    const { examId } = await setupStudentAndExamFixture();
    const { session } = await cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID);

    // 1. Pilihan Ganda (PG)
    const savePg = await cbtService.autosaveAnswer(
      {
        sesi_ujian_siswa_id: session.id,
        nomor_urut: 1,
        jawaban_pilihan: "A",
        ragu_ragu: false,
      },
      SCH_ID,
      SISWA_A_ID
    );
    expect(savePg.saved).toBe(true);

    // 2. PG Kompleks (Multi Select)
    const savePgk = await cbtService.autosaveAnswer(
      {
        sesi_ujian_siswa_id: session.id,
        nomor_urut: 2,
        jawaban_kompleks: ["A", "B"],
        ragu_ragu: true,
      },
      SCH_ID,
      SISWA_A_ID
    );
    expect(savePgk.saved).toBe(true);

    // 3. Benar / Salah
    const saveBs = await cbtService.autosaveAnswer(
      {
        sesi_ujian_siswa_id: session.id,
        nomor_urut: 3,
        jawaban_pilihan: "SALAH",
        ragu_ragu: false,
      },
      SCH_ID,
      SISWA_A_ID
    );
    expect(saveBs.saved).toBe(true);

    // 4. Menjodohkan
    const saveMjd = await cbtService.autosaveAnswer(
      {
        sesi_ujian_siswa_id: session.id,
        nomor_urut: 4,
        jawaban_menjodohkan: { "1": "Fotosintesis", "2": "Pengatur aktivitas sel" },
        ragu_ragu: false,
      },
      SCH_ID,
      SISWA_A_ID
    );
    expect(saveMjd.saved).toBe(true);

    // 5. Isian Singkat
    const saveIs = await cbtService.autosaveAnswer(
      {
        sesi_ujian_siswa_id: session.id,
        nomor_urut: 5,
        jawaban_teks: "sitoplasma",
        ragu_ragu: false,
      },
      SCH_ID,
      SISWA_A_ID
    );
    expect(saveIs.saved).toBe(true);

    // 6. Esai
    const saveEsai = await cbtService.autosaveAnswer(
      {
        sesi_ujian_siswa_id: session.id,
        nomor_urut: 6,
        jawaban_teks:
          "Sel prokariotik tidak memiliki membran inti, sedangkan eukariotik memiliki membran inti.",
        ragu_ragu: false,
      },
      SCH_ID,
      SISWA_A_ID
    );
    expect(saveEsai.saved).toBe(true);

    // Verifikasi reload player memuat seluruh jawaban yang telah tersimpan
    const reloaded = await cbtService.getAttemptPlayer(session.id, SCH_ID, SISWA_A_ID);
    expect(reloaded.savedAnswers[1].jawaban_pilihan).toBe("A");
    expect(reloaded.savedAnswers[2].ragu_ragu).toBe(true);
    expect(reloaded.savedAnswers[3].jawaban_pilihan).toBe("SALAH");
    expect(reloaded.savedAnswers[5].jawaban_teks).toBe("sitoplasma");
  });

  // ============================================================================
  // 5. SUBMISSION ENGINE & RESULT FOUNDATION
  // ============================================================================
  it("harus mengeksekusi submission authoritative dan menyajikan hasil sesuai izin tampilkan_nilai", async () => {
    // Skenario A: tampilkan_nilai = true
    const { examId } = await setupStudentAndExamFixture({ tampilkanNilai: true });
    const { session } = await cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID);

    // Jawab soal no 1 dengan benar
    await cbtService.autosaveAnswer(
      { sesi_ujian_siswa_id: session.id, nomor_urut: 1, jawaban_pilihan: "A" },
      SCH_ID,
      SISWA_A_ID
    );

    // Submit attempt
    const submitResult = await cbtService.submitAttempt(session.id, SCH_ID, SISWA_A_ID);
    expect(submitResult.id).toBeDefined();
    expect(submitResult.nilai_akhir).toBeGreaterThan(0);

    // Sesi attempt sekarang berstatus SELESAI
    const closedSession = await prisma.sesiUjianSiswa.findUnique({ where: { id: session.id } });
    expect(["DIKUMPULKAN", "SELESAI"]).toContain(closedSession?.status);

    // Pemanggilan getAttemptPlayer pada sesi yang telah selesai harus ditolak
    await expect(cbtService.getAttemptPlayer(session.id, SCH_ID, SISWA_A_ID)).rejects.toThrow(
      CbtAttemptClosedError
    );
  });

  // ============================================================================
  // 6. ONE ACTIVE ATTEMPT RULE
  // ============================================================================
  it("harus memberlakukan One Active Attempt: memanggil start saat attempt sedang berjalan harus mengembalikan sesi aktif", async () => {
    const { examId } = await setupStudentAndExamFixture();

    const first = await cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID);
    const second = await cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID);

    expect(first.session.id).toBe(second.session.id);
  });

  // ============================================================================
  // 7. SECURITY & TENANT BOUNDARY
  // ============================================================================
  it("harus mencegah siswa mengakses attempt milik siswa lain", async () => {
    const { examId } = await setupStudentAndExamFixture();
    const { session } = await cbtService.startOrResumeAttempt(examId, SCH_ID, SISWA_A_ID);

    // Siswa B mencoba mengakses session milik Siswa A
    await expect(cbtService.getAttemptPlayer(session.id, SCH_ID, SISWA_B_ID)).rejects.toThrow(
      CbtAccessDeniedError
    );

    await expect(
      cbtService.autosaveAnswer(
        { sesi_ujian_siswa_id: session.id, nomor_urut: 1, jawaban_pilihan: "B" },
        SCH_ID,
        SISWA_B_ID
      )
    ).rejects.toThrow(CbtAccessDeniedError);

    await expect(cbtService.submitAttempt(session.id, SCH_ID, SISWA_B_ID)).rejects.toThrow(
      CbtAccessDeniedError
    );
  });
});
