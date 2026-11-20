import { describe, it, expect, beforeEach } from "vitest";
import { cbtService } from "@/modules/cbt/application/cbt-service";
import { cbtRepository } from "@/modules/cbt/infrastructure/cbt-repository";
import { prisma } from "@/shared/infrastructure/database/prisma";
import {
  CbtSessionInvalidatedError,
  CbtTimerExpiredError,
  CbtAttemptClosedError,
  CbtAttemptLockedError,
} from "@/modules/cbt/domain/cbt-errors";

describe("STAGE CBT-03.4 — Critical Remediation & Production Hardening Test Suite", () => {
  const SCH_ID = "SCH_CBT_034_TEST";
  const GURU_ID = "GURU_034_A";
  const MAPEL_ID = "MP_034_FISIKA";
  const ROMBEL_ID = "RBL_034_X1";
  const PENUGASAN_ID = "PNG_034_A";
  const SISWA_ID = "SISWA_034_A";
  const PLACEMENT_ID = "PLC_034_A";
  const ENROLLMENT_ID = "ENR_034_A";

  beforeEach(async () => {
    // Bersihkan data uji
    await prisma.jawabanSiswa.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.eventIntegritasUjian.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.sesiUjianSiswa.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.hasilUjianCbt.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.snapshotUjian.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.ujianCbt.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.versiSoal.deleteMany({ where: { sekolah_id: SCH_ID } });
    await prisma.bankSoal.deleteMany({ where: { sekolah_id: SCH_ID } });
  });

  async function setupFixture(options?: { durasiMenit?: number }) {
    await prisma.sekolah.upsert({
      where: { id: SCH_ID },
      update: {},
      create: { id: SCH_ID, nama: "SMA Digital CBT 03.4", npsn: "88889999", jenjang: "SMA" },
    });

    const ta = await prisma.tahunAjaran.upsert({
      where: { id: "TA_034" },
      update: {},
      create: {
        id: "TA_034",
        sekolah_id: SCH_ID,
        nama: "2025/2026",
        tanggal_mulai: new Date("2025-07-01"),
        tanggal_selesai: new Date("2026-06-30"),
      },
    });

    const tingkat = await prisma.tingkatKelas.upsert({
      where: { sekolah_id_kode: { sekolah_id: SCH_ID, kode: "X" } },
      update: {},
      create: { id: "TK_034_X", sekolah_id: SCH_ID, kode: "X", nama: "Kelas 10", urutan: 10 },
    });

    await prisma.rombel.upsert({
      where: { id: ROMBEL_ID },
      update: {},
      create: {
        id: ROMBEL_ID,
        sekolah_id: SCH_ID,
        tahun_ajaran_id: ta.id,
        tingkat_id: tingkat.id,
        nama: "X-Fisika-1",
      },
    });

    await prisma.mataPelajaran.upsert({
      where: { id: MAPEL_ID },
      update: {},
      create: { id: MAPEL_ID, sekolah_id: SCH_ID, nama: "Fisika Dasar", kode: "FIS-01" },
    });

    await prisma.guru.upsert({
      where: { id: GURU_ID },
      update: {},
      create: { id: GURU_ID, sekolah_id: SCH_ID, nama_lengkap: "Guru Fisika", jenis_kelamin: "L" },
    });

    await prisma.penugasanMengajar.upsert({
      where: { id: PENUGASAN_ID },
      update: {},
      create: {
        id: PENUGASAN_ID,
        sekolah_id: SCH_ID,
        guru_id: GURU_ID,
        rombel_id: ROMBEL_ID,
        mata_pelajaran_id: MAPEL_ID,
        tahun_ajaran_id: ta.id,
        status: "AKTIF",
      },
    });

    await prisma.siswa.upsert({
      where: { id: SISWA_ID },
      update: {},
      create: {
        id: SISWA_ID,
        sekolah_id: SCH_ID,
        nama_lengkap: "Siswa Remediasi 03.4",
        nis: "NIS034",
        nisn: "0011223344",
        jenis_kelamin: "L",
        status_akademik: "AKTIF",
      },
    });

    await prisma.keikutsertaanSiswa.upsert({
      where: { id: ENROLLMENT_ID },
      update: {},
      create: {
        id: ENROLLMENT_ID,
        sekolah_id: SCH_ID,
        siswa_id: SISWA_ID,
        tahun_ajaran_id: ta.id,
        status: "AKTIF",
      },
    });

    await prisma.penempatanRombel.upsert({
      where: { id: PLACEMENT_ID },
      update: {},
      create: {
        id: PLACEMENT_ID,
        sekolah_id: SCH_ID,
        rombel_id: ROMBEL_ID,
        keikutsertaan_id: ENROLLMENT_ID,
        status: "AKTIF",
      },
    });

    // 1 Soal Fisika
    const q1 = await cbtService.createQuestion(
      {
        mata_pelajaran_id: MAPEL_ID,
        jenis_soal: "PILIHAN_GANDA",
        tingkat_kesulitan: "SEDANG",
        bobot_default: 10,
        pertanyaan: "Berapa percepatan gravitasi bumi rata-rata?",
        opsi: [
          { label: "A", teks: "9.8 m/s^2" },
          { label: "B", teks: "10 m/s^2" },
        ],
        kunci_jawaban: ["A"],
      },
      SCH_ID,
      GURU_ID,
      true
    );

    // Buat Ujian
    const exam = await cbtService.createExam(
      {
        penugasan_mengajar_id: PENUGASAN_ID,
        judul: "Ujian Fisika Mandiri CBT-03.4",
        durasi_menit: options?.durasiMenit || 60,
        blueprint_soal: [{ bank_soal_id: q1.id, nomor_urut: 1, bobot_kustom: 10 }],
      },
      SCH_ID,
      GURU_ID,
      true
    );

    await cbtService.publishExam(exam.id, SCH_ID, GURU_ID, true);

    return { exam, question: q1 };
  }

  // ============================================================================
  // 1. HIGH-RISK-02: SINGLE DEVICE LOCK TEST
  // ============================================================================
  describe("HIGH-RISK-02: Single Device Lock & Session Token Invalidation", () => {
    it("harus men-generate token_sesi_aktif saat student memulai attempt pertama kali", async () => {
      const { exam } = await setupFixture();

      const startResult = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);
      expect(startResult.session.token_sesi_aktif).toBeDefined();
      expect(typeof startResult.session.token_sesi_aktif).toBe("string");
      expect(startResult.sessionToken).toBe(startResult.session.token_sesi_aktif);

      const dbSession = await prisma.sesiUjianSiswa.findUnique({
        where: { id: startResult.session.id },
      });
      expect(dbSession?.token_sesi_aktif).toBe(startResult.session.token_sesi_aktif);
    });

    it("harus menginvalidasi sesi lama jika student me-resume attempt dari perangkat kedua", async () => {
      const { exam, question } = await setupFixture();

      // Perangkat 1: Memulai attempt
      const device1 = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID, {
        userAgent: "Device-1 (Chrome Desktop)",
      });
      const token1 = device1.sessionToken;

      // Perangkat 1 menyimpan jawaban
      const saveRes1 = await cbtService.autosaveAnswer(
        {
          sesi_ujian_siswa_id: device1.session.id,
          nomor_urut: 1,
          soal_id: question.id,
          session_token: token1,
          jawaban_pilihan: "A",
        },
        SCH_ID,
        SISWA_ID
      );
      expect(saveRes1.saved).toBe(true);

      // Perangkat 2: Siswa membuka ujian di HP/laptop lain (me-resume attempt yang sama)
      const device2 = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID, {
        userAgent: "Device-2 (Android Mobile)",
      });
      const token2 = device2.sessionToken;

      // Token sesi harus berubah (baru)
      expect(token2).toBeDefined();
      expect(token2).not.toBe(token1);

      // Perangkat 1 (dengan token lama) mencoba autosave lagi -> Wajib DITOLAK dengan CbtSessionInvalidatedError
      await expect(
        cbtService.autosaveAnswer(
          {
            sesi_ujian_siswa_id: device1.session.id,
            nomor_urut: 1,
            soal_id: question.id,
            session_token: token1, // Token lama
            jawaban_pilihan: "B",
          },
          SCH_ID,
          SISWA_ID
        )
      ).rejects.toThrow(CbtSessionInvalidatedError);

      // Perangkat 2 (dengan token baru) dapat menyimpan jawaban dengan lancar
      const saveRes2 = await cbtService.autosaveAnswer(
        {
          sesi_ujian_siswa_id: device2.session.id,
          nomor_urut: 1,
          soal_id: question.id,
          session_token: token2, // Token aktif
          jawaban_pilihan: "A",
        },
        SCH_ID,
        SISWA_ID
      );
      expect(saveRes2.saved).toBe(true);

      // Perangkat 1 mencoba submit dengan token lama -> Wajib DITOLAK
      await expect(
        cbtService.submitAttempt(device1.session.id, SCH_ID, SISWA_ID, token1)
      ).rejects.toThrow(CbtSessionInvalidatedError);

      // Perangkat 2 submit dengan token aktif -> Berhasil
      const finalSubmit = await cbtService.submitAttempt(
        device2.session.id,
        SCH_ID,
        SISWA_ID,
        token2
      );
      expect(finalSubmit.status_kelulusan).toBe("TUNTAS");
    });
  });

  // ============================================================================
  // 2. HIGH-RISK-01: AUTOSAVE BOTTLENECK OPTIMIZATION TEST
  // ============================================================================
  describe("HIGH-RISK-01: Autosave Bottleneck (Single Validation + Single Upsert)", () => {
    it("harus menyimpan jawaban via direct optimized pipeline ketika soal_id disertakan", async () => {
      const { exam, question } = await setupFixture();

      const session = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);

      const res = await cbtService.autosaveAnswer(
        {
          sesi_ujian_siswa_id: session.session.id,
          nomor_urut: 1,
          soal_id: question.id,
          session_token: session.sessionToken,
          jawaban_pilihan: "A",
          ragu_ragu: true,
        },
        SCH_ID,
        SISWA_ID
      );

      expect(res.saved).toBe(true);

      // Verifikasi jawaban tersimpan di database secara akurat
      const saved = await prisma.jawabanSiswa.findUnique({
        where: {
          sesi_ujian_id_soal_id: {
            sesi_ujian_id: session.session.id,
            soal_id: question.id,
          },
        },
      });

      expect(saved).not.toBeNull();
      expect(saved?.jawaban_peserta).toBe(JSON.stringify(["A"]));
      expect(saved?.ragu_ragu).toBe(true);
    });

    it("harus menolak autosave jika siswa_id tidak cocok (akses ditolak)", async () => {
      const { exam, question } = await setupFixture();

      const session = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);

      await expect(
        cbtService.autosaveAnswer(
          {
            sesi_ujian_siswa_id: session.session.id,
            nomor_urut: 1,
            soal_id: question.id,
            session_token: session.sessionToken,
            jawaban_pilihan: "A",
          },
          SCH_ID,
          "SISWA_LAIN_ID" // Hacker mencoba membajak sesi
        )
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // 3. HIGH-RISK-03: SERVER AUTHORITATIVE TIMER TEST
  // ============================================================================
  describe("HIGH-RISK-03: Server-Authoritative Timer & Drift Prevention", () => {
    it("harus menolak autosave dan meng-auto-submit jika batas waktu server telah lampau", async () => {
      const { exam, question } = await setupFixture({ durasiMenit: 60 });

      const session = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);

      // Simulasikan waktu server habis dengan memanipulasi batas_waktu_server ke masa lalu
      await prisma.sesiUjianSiswa.update({
        where: { id: session.session.id },
        data: { batas_waktu_server: new Date(Date.now() - 5000) },
      });

      // Percobaan autosave setelah deadline server harus melempar CbtTimerExpiredError
      await expect(
        cbtService.autosaveAnswer(
          {
            sesi_ujian_siswa_id: session.session.id,
            nomor_urut: 1,
            soal_id: question.id,
            session_token: session.sessionToken,
            jawaban_pilihan: "A",
          },
          SCH_ID,
          SISWA_ID
        )
      ).rejects.toThrow(CbtTimerExpiredError);

      // Verifikasi sesi otomatis tertutup di database
      const updatedSession = await prisma.sesiUjianSiswa.findUnique({
        where: { id: session.session.id },
      });
      expect(["DIKUMPULKAN", "SELESAI"]).toContain(updatedSession?.status);
    });
  });

  // ============================================================================
  // 4. BLOCKER-01: OFFLINE SUBMISSION LOSS & SYNC BARRIER DOMAIN INTEGRITY
  // ============================================================================
  describe("BLOCKER-01: Offline Buffer & Pre-Submit Barrier Invariants", () => {
    it("harus menjaga konsistensi jawaban saat autosave dilakukan berkali-kali (idempotent)", async () => {
      const { exam, question } = await setupFixture();

      const session = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);

      // Siswa mengganti jawaban A -> B -> A
      await cbtService.autosaveAnswer(
        {
          sesi_ujian_siswa_id: session.session.id,
          nomor_urut: 1,
          soal_id: question.id,
          session_token: session.sessionToken,
          jawaban_pilihan: "A",
        },
        SCH_ID,
        SISWA_ID
      );

      await cbtService.autosaveAnswer(
        {
          sesi_ujian_siswa_id: session.session.id,
          nomor_urut: 1,
          soal_id: question.id,
          session_token: session.sessionToken,
          jawaban_pilihan: "B",
        },
        SCH_ID,
        SISWA_ID
      );

      await cbtService.autosaveAnswer(
        {
          sesi_ujian_siswa_id: session.session.id,
          nomor_urut: 1,
          soal_id: question.id,
          session_token: session.sessionToken,
          jawaban_pilihan: "A",
        },
        SCH_ID,
        SISWA_ID
      );

      const allAnswers = await prisma.jawabanSiswa.findMany({
        where: { sesi_ujian_id: session.session.id },
      });

      // Hanya boleh ada 1 record jawaban untuk butir soal tersebut
      expect(allAnswers.length).toBe(1);
      expect(allAnswers[0].jawaban_peserta).toBe(JSON.stringify(["A"]));
    });

    it("tidak boleh menerima autosave pada sesi yang sudah berstatus SELESAI", async () => {
      const { exam, question } = await setupFixture();

      const session = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);
      await cbtService.submitAttempt(session.session.id, SCH_ID, SISWA_ID, session.sessionToken);

      await expect(
        cbtService.autosaveAnswer(
          {
            sesi_ujian_siswa_id: session.session.id,
            nomor_urut: 1,
            soal_id: question.id,
            session_token: session.sessionToken,
            jawaban_pilihan: "A",
          },
          SCH_ID,
          SISWA_ID
        )
      ).rejects.toThrow(CbtAttemptClosedError);
    });
  });

  // ============================================================================
  // 5. BLOCKER-02: ANTI-CHEAT STRIKE HARDENING TEST
  // ============================================================================
  describe("BLOCKER-02: Anti-Cheat Strike Accumulation & Lock Enforcement", () => {
    it("harus mencatat event integritas dan mengunci attempt setelah 2 strike keluar layar", async () => {
      const { exam } = await setupFixture();

      const session = await cbtService.startOrResumeAttempt(exam.id, SCH_ID, SISWA_ID);

      // Strike 1
      const res1 = await cbtService.recordIntegrityEvent(
        {
          sesi_ujian_siswa_id: session.session.id,
          nomor_urut_soal: 1,
          tipe_event: "PINDAH_TAB_ATAU_WINDOW",
          deskripsi: "Pindah tab pertama",
        },
        SCH_ID,
        SISWA_ID
      );
      expect(res1.isLocked).toBe(false);

      // Strike 2
      const res2 = await cbtService.recordIntegrityEvent(
        {
          sesi_ujian_siswa_id: session.session.id,
          nomor_urut_soal: 1,
          tipe_event: "KELUAR_LAYAR_PENUH",
          deskripsi: "Keluar fullscreen kedua",
        },
        SCH_ID,
        SISWA_ID
      );
      expect(res2.isLocked).toBe(true);

      // Verifikasi sesi terkunci di database
      const lockedSession = await prisma.sesiUjianSiswa.findUnique({
        where: { id: session.session.id },
      });
      expect(lockedSession?.status).toBe("TERKUNCI_PELANGGARAN");

      // Attempt terkunci tidak boleh submit mandiri
      await expect(
        cbtService.submitAttempt(session.session.id, SCH_ID, SISWA_ID, session.sessionToken)
      ).rejects.toThrow(CbtAttemptLockedError);
    });
  });
});
