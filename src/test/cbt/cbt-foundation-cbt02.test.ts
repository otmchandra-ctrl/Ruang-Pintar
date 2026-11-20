/**
 * Ruang Pintar — STAGE CBT-02.1 Unit & Integration Test Suite
 *
 * Menguji 4 fondasi utama:
 * 1. Curriculum Lineage Foundation (CP → TP → KKTP)
 * 2. Dual Question Bank Foundation (PERSONAL vs SEKOLAH & Anti-Data-Leakage)
 * 3. Assessment Blueprint (Kisi-Kisi Matriks & Cognitive Level Mapping L1/L2/L3)
 * 4. Assessment Administration Foundation (Kartu Soal, Naskah Soal, Kunci Jawaban)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LearningService } from "@/modules/learning/application/learning-service";
import { CbtService } from "@/modules/cbt/application/cbt-service";
import { AssessmentService } from "@/modules/assessment/application/assessment-service";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { CbtAccessDeniedError, CbtValidationError } from "@/modules/cbt/domain/cbt-errors";
import {
  AssessmentAccessDeniedError,
  AssessmentValidationError,
} from "@/modules/assessment/domain/assessment-errors";

// Mock audit logger
vi.mock("@/shared/infrastructure/audit/audit-logger", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({ id: "AUDIT_MOCK_1" }),
}));

describe("STAGE CBT-02.1: Assessment Foundation Implementation Tests", () => {
  const mockSekolahId = "01J00000000000000000000001";
  const mockFaseId = "01J00000000000000000FASE_E";
  const mockMapelId = "01J0000000000000000MAPEL_01";
  const mockGuruOwnerId = "01J000000000000000000GURU1";
  const mockGuruPeerId = "01J000000000000000000GURU2";
  const mockPenugasanId = "01J000000000000000PENUGAS1";
  const mockAsesmenId = "01J000000000000000ASESMEN1";
  const mockCpId = "01J00000000000000000000CP1";
  const mockTpId = "01J00000000000000000000TP1";
  const mockKisiKisiId = "01J0000000000000000KISIKISI";

  // ==========================================================================
  // PACKAGE 1: CURRICULUM LINEAGE FOUNDATION (CP → TP → KKTP)
  // ==========================================================================
  describe("Package 1: Curriculum Lineage Foundation (CP → TP → KKTP)", () => {
    let learningService: LearningService;
    let mockLearningRepo: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockLearningRepo = {
        listCapaianPembelajaran: vi.fn(),
        getCapaianPembelajaranById: vi.fn(),
        createCapaianPembelajaran: vi.fn(),
        updateCapaianPembelajaran: vi.fn(),
        deleteCapaianPembelajaran: vi.fn(),
        getKktpByTpId: vi.fn(),
        upsertKktp: vi.fn(),
        getCurriculumLineage: vi.fn(),
      };
      learningService = new LearningService(mockLearningRepo);
    });

    it("1.1. Membuat Capaian Pembelajaran (CP) baru dengan validasi schema", async () => {
      const input = {
        sekolah_id: mockSekolahId,
        fase_id: mockFaseId,
        mata_pelajaran_id: mockMapelId,
        kode: "CP-INF-01",
        deskripsi: "Peserta didik mampu memahami konsep logika matematika dan algoritma.",
        elemen: "Berpikir Komputasional",
      };

      const expectedDto = {
        id: mockCpId,
        ...input,
        urutan: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockLearningRepo.createCapaianPembelajaran.mockResolvedValue(expectedDto);

      const result = await learningService.createCapaianPembelajaran(
        "USER_GURU_1",
        "TEACHER",
        input
      );

      expect(mockLearningRepo.createCapaianPembelajaran).toHaveBeenCalledWith(
        expect.objectContaining({
          sekolah_id: mockSekolahId,
          kode: "CP-INF-01",
          elemen: "Berpikir Komputasional",
        })
      );
      expect(result.id).toBe(mockCpId);
      expect(result.kode).toBe("CP-INF-01");
    });

    it("1.2. Menolak pembuatan CP jika kode atau deskripsi kosong", async () => {
      const invalidInput = {
        sekolah_id: mockSekolahId,
        fase_id: mockFaseId,
        mata_pelajaran_id: mockMapelId,
        kode: "",
        deskripsi: "",
      };

      await expect(
        learningService.createCapaianPembelajaran("USER_1", "TEACHER", invalidInput as any)
      ).rejects.toThrow();
    });

    it("1.3. Menyimpan KKTP (Kriteria Ketercapaian TP) berbasis Interval Nilai", async () => {
      const input = {
        sekolah_id: mockSekolahId,
        tujuan_pembelajaran_id: mockTpId,
        tipe_kktp: "SKALA_INTERVAL" as const,
        ambang_tuntas: 75.0,
        deskripsi_kriteria: "Kriteria ketercapaian berdasarkan rentang interval nilai rapor.",
      };

      const expectedDto = {
        id: "01J000000000000000000KKTP1",
        sekolah_id: mockSekolahId,
        tujuan_pembelajaran_id: mockTpId,
        tipe_kktp: "SKALA_INTERVAL",
        ambang_tuntas: 75.0,
        deskripsi_kriteria: "Kriteria ketercapaian berdasarkan rentang interval nilai rapor.",
        interval_rendah_max: 60.0,
        interval_sedang_max: 74.0,
        interval_mahir_min: 88.0,
        rubrik_items: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockLearningRepo.upsertKktp.mockResolvedValue(expectedDto);

      const result = await learningService.upsertKktp("USER_1", "TEACHER", input);

      expect(mockLearningRepo.upsertKktp).toHaveBeenCalledWith(
        expect.objectContaining({
          sekolah_id: mockSekolahId,
          tujuan_pembelajaran_id: mockTpId,
          ambang_tuntas: 75.0,
          tipe_kktp: "SKALA_INTERVAL",
        })
      );
      expect(result.ambang_tuntas).toBe(75.0);
    });

    it("1.4. Mengambil Curriculum Lineage utuh (CP → TP → KKTP Tree)", async () => {
      const mockLineageTree = [
        {
          cp: {
            id: mockCpId,
            sekolah_id: mockSekolahId,
            fase_id: mockFaseId,
            mata_pelajaran_id: mockMapelId,
            kode: "CP-INF-01",
            deskripsi: "Capaian Pembelajaran Informatika Fase E",
            elemen: "Algoritma Pemrograman",
            urutan: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          lingkup_materi: {
            id: "01J_MATERI_01",
            judul: "Algoritma Dasar",
            urutan: 1,
          },
          tp: {
            id: mockTpId,
            sekolah_id: mockSekolahId,
            lingkup_materi_id: "01J_MATERI_01",
            capaian_pembelajaran_id: mockCpId,
            kode: "TP-01",
            deskripsi: "Siswa mampu menerapkan algoritma percabangan",
            urutan: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
          kktp: {
            id: "01J000000000000000000KKTP1",
            sekolah_id: mockSekolahId,
            tujuan_pembelajaran_id: mockTpId,
            tipe_kktp: "SKALA_INTERVAL",
            ambang_tuntas: 75.0,
            interval_rendah_max: 60.0,
            interval_sedang_max: 74.0,
            interval_mahir_min: 88.0,
            rubrik_items: null,
            deskripsi_kriteria: "Interval 0-100",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ];

      mockLearningRepo.getCurriculumLineage.mockResolvedValue(mockLineageTree);

      const lineage = await learningService.getCurriculumLineage(mockSekolahId, mockMapelId);

      expect(mockLearningRepo.getCurriculumLineage).toHaveBeenCalledWith(
        mockSekolahId,
        mockMapelId,
        undefined
      );
      expect(lineage.length).toBe(1);
      expect(lineage[0].cp?.kode).toBe("CP-INF-01");
      expect(lineage[0].tp.kode).toBe("TP-01");
      expect(lineage[0].kktp?.ambang_tuntas).toBe(75.0);
    });
  });

  // ==========================================================================
  // PACKAGE 2: DUAL QUESTION BANK (PERSONAL vs SEKOLAH)
  // ==========================================================================
  describe("Package 2: Dual Question Bank (PERSONAL vs SEKOLAH)", () => {
    let cbtService: CbtService;
    let mockCbtRepo: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockCbtRepo = {
        findBankSoal: vi.fn(),
        findBankSoalById: vi.fn(),
        getPersonalQuestions: vi.fn(),
        getSchoolQuestions: vi.fn(),
        updateQuestionScope: vi.fn(),
        cloneQuestionToPersonal: vi.fn(),
        createBankSoal: vi.fn(),
      };
      cbtService = new CbtService(mockCbtRepo);
    });

    it("2.1. Memfilter Personal Bank secara ketat berdasarkan guru_id pemilik", async () => {
      mockCbtRepo.getPersonalQuestions.mockResolvedValue([
        {
          id: "01J_QUESTION_01",
          judul: "Soal Logika Guru 1",
          scope_kepemilikan: "PERSONAL",
          guru_id: mockGuruOwnerId,
          level_kognitif: "L2",
        },
      ]);

      const result = await cbtService.getPersonalQuestions(mockSekolahId, mockGuruOwnerId, {
        mataPelajaranId: mockMapelId,
      });

      expect(mockCbtRepo.getPersonalQuestions).toHaveBeenCalledWith(
        mockSekolahId,
        mockGuruOwnerId,
        { mataPelajaranId: mockMapelId }
      );
      expect(result.length).toBe(1);
      expect(result[0].scope_kepemilikan).toBe("PERSONAL");
    });

    it("2.2. Mengakses School Bank untuk kolaborasi guru pada mata pelajaran yang sama", async () => {
      mockCbtRepo.getSchoolQuestions.mockResolvedValue([
        {
          id: "01J_QUESTION_SHARED",
          judul: "Soal Ujian Bersama Sekolah",
          scope_kepemilikan: "SEKOLAH",
          guru_id: mockGuruOwnerId,
          level_kognitif: "L3",
        },
      ]);

      const result = await cbtService.getSchoolQuestions(mockSekolahId, mockMapelId);

      expect(mockCbtRepo.getSchoolQuestions).toHaveBeenCalledWith(
        mockSekolahId,
        mockMapelId,
        undefined
      );
      expect(result.length).toBe(1);
      expect(result[0].scope_kepemilikan).toBe("SEKOLAH");
    });

    it("2.3. Membagikan soal Personal ke School Bank dengan izin pemilik", async () => {
      mockCbtRepo.findBankSoalById.mockResolvedValue({
        id: "01J_QUESTION_01",
        sekolah_id: mockSekolahId,
        guru_id: mockGuruOwnerId,
        scope_kepemilikan: "PERSONAL",
      });

      mockCbtRepo.updateQuestionScope.mockResolvedValue({
        id: "01J_QUESTION_01",
        scope_kepemilikan: "SEKOLAH",
      });

      const updated = await cbtService.shareQuestionToSchoolBank(
        "01J_QUESTION_01",
        mockSekolahId,
        mockGuruOwnerId
      );

      expect(mockCbtRepo.updateQuestionScope).toHaveBeenCalledWith(
        mockSekolahId,
        "01J_QUESTION_01",
        mockGuruOwnerId,
        "SEKOLAH",
        undefined
      );
      expect(updated.scope_kepemilikan).toBe("SEKOLAH");
    });

    it("2.4. Anti-Data-Leakage: Menolak guru lain membagikan soal personal milik orang lain", async () => {
      mockCbtRepo.findBankSoalById.mockResolvedValue({
        id: "01J_QUESTION_01",
        sekolah_id: mockSekolahId,
        guru_id: mockGuruOwnerId,
        scope_kepemilikan: "PERSONAL",
      });

      await expect(
        cbtService.shareQuestionToSchoolBank(
          "01J_QUESTION_01",
          mockSekolahId,
          mockGuruPeerId // Bukan pemilik
        )
      ).rejects.toThrow(CbtAccessDeniedError);
    });

    it("2.5. Melakukan klon soal dari School Bank ke Personal Bank guru lain", async () => {
      mockCbtRepo.findBankSoalById.mockResolvedValue({
        id: "01J_QUESTION_SHARED",
        sekolah_id: mockSekolahId,
        guru_id: mockGuruOwnerId,
        scope_kepemilikan: "SEKOLAH",
      });

      mockCbtRepo.cloneQuestionToPersonal.mockResolvedValue({
        id: "01J_QUESTION_CLONED",
        guru_id: mockGuruPeerId,
        scope_kepemilikan: "PERSONAL",
      });

      const cloned = await cbtService.cloneQuestionToPersonal(
        "01J_QUESTION_SHARED",
        mockSekolahId,
        mockGuruPeerId,
        "Guru Peer"
      );

      expect(mockCbtRepo.cloneQuestionToPersonal).toHaveBeenCalledWith(
        mockSekolahId,
        "01J_QUESTION_SHARED",
        mockGuruPeerId,
        "Guru Peer"
      );
      expect(cloned.guru_id).toBe(mockGuruPeerId);
      expect(cloned.scope_kepemilikan).toBe("PERSONAL");
    });
  });

  // ==========================================================================
  // PACKAGE 3: ASSESSMENT BLUEPRINT (KISI-KISI ASESMEN & LEVEL KOGNITIF L1/L2/L3)
  // ==========================================================================
  describe("Package 3: Assessment Blueprint (Kisi-Kisi Asesmen)", () => {
    let assessmentService: AssessmentService;
    let mockAssessmentRepo: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockAssessmentRepo = {
        findById: vi.fn(),
        findKisiKisiByAsesmenId: vi.fn(),
        upsertKisiKisi: vi.fn(),
        upsertItemKisiKisi: vi.fn(),
        deleteItemKisiKisi: vi.fn(),
        generateKartuSoalPayload: vi.fn(),
        generateNaskahSoalPayload: vi.fn(),
        generateKunciJawabanPayload: vi.fn(),
      };
      assessmentService = new AssessmentService(mockAssessmentRepo);
    });

    it("3.1. Membuat Header Kisi-Kisi Asesmen baru", async () => {
      // Mock verifikasi penugasan guru
      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      mockAssessmentRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        sekolah_id: mockSekolahId,
        penugasan_mengajar_id: mockPenugasanId,
        judul: "Sumatif Akhir Bab 1",
      });

      mockAssessmentRepo.upsertKisiKisi.mockResolvedValue({
        id: mockKisiKisiId,
        definisi_asesmen_id: mockAsesmenId,
        judul: "Kisi-Kisi Asesmen Sumatif Bab 1",
        tahun_ajaran: "2026/2027",
        semester: "Ganjil",
        alokasi_waktu_menit: 90,
        total_butir_soal: 0,
        status: "DRAFT",
        items: [],
      });

      const result = await assessmentService.upsertKisiKisi(
        {
          definisi_asesmen_id: mockAsesmenId,
          judul: "Kisi-Kisi Asesmen Sumatif Bab 1",
          tahun_ajaran: "2026/2027",
          semester: "Ganjil",
          alokasi_waktu_menit: 90,
          status: "DRAFT",
        },
        mockSekolahId,
        mockGuruOwnerId
      );

      expect(mockAssessmentRepo.upsertKisiKisi).toHaveBeenCalledWith(
        mockSekolahId,
        expect.objectContaining({
          definisi_asesmen_id: mockAsesmenId,
          judul: "Kisi-Kisi Asesmen Sumatif Bab 1",
        })
      );
      expect(result.id).toBe(mockKisiKisiId);
    });

    it("3.2. Menambahkan Butir Matriks Item Kisi-Kisi dengan Level Kognitif L1/L2/L3", async () => {
      vi.spyOn(prisma.kisiKisiAsesmen, "findFirst").mockResolvedValue({
        id: mockKisiKisiId,
        sekolah_id: mockSekolahId,
        definisi_asesmen_id: mockAsesmenId,
      } as any);

      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      mockAssessmentRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        sekolah_id: mockSekolahId,
        penugasan_mengajar_id: mockPenugasanId,
      });

      const itemInput = {
        kisi_kisi_id: mockKisiKisiId,
        tujuan_pembelajaran_id: mockTpId,
        nomor_urut: 1,
        indikator_soal: "Disajikan kode program percabangan, siswa dapat menganalisis outputnya.",
        level_kognitif: "L3" as const,
        bentuk_soal: "PILIHAN_GANDA",
        bobot_skor: 2.5,
      };

      mockAssessmentRepo.upsertItemKisiKisi.mockResolvedValue({
        id: "01J_ITEM_01",
        ...itemInput,
        sekolah_id: mockSekolahId,
      });

      const item = await assessmentService.upsertItemKisiKisi(
        itemInput,
        mockSekolahId,
        mockGuruOwnerId
      );

      expect(mockAssessmentRepo.upsertItemKisiKisi).toHaveBeenCalledWith(
        mockSekolahId,
        expect.objectContaining({
          level_kognitif: "L3",
          nomor_urut: 1,
        })
      );
      expect(item.level_kognitif).toBe("L3");
    });

    it("3.3. Menolak modifikasi kisi-kisi oleh guru yang bukan pengampu kelas", async () => {
      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      mockAssessmentRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        sekolah_id: mockSekolahId,
        penugasan_mengajar_id: mockPenugasanId,
      });

      await expect(
        assessmentService.upsertKisiKisi(
          {
            definisi_asesmen_id: mockAsesmenId,
            judul: "Kisi-Kisi Modifikasi Ilegal",
            tahun_ajaran: "2026/2027",
            semester: "Ganjil",
          },
          mockSekolahId,
          mockGuruPeerId // Bukan pengampu
        )
      ).rejects.toThrow(AssessmentAccessDeniedError);
    });
  });

  // ==========================================================================
  // PACKAGE 4: ASSESSMENT ADMINISTRATION FOUNDATION (KARTU SOAL, NASKAH, KUNCI)
  // ==========================================================================
  describe("Package 4: Assessment Administration Foundation", () => {
    let assessmentService: AssessmentService;
    let mockAssessmentRepo: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockAssessmentRepo = {
        findById: vi.fn(),
        generateKartuSoalPayload: vi.fn(),
        generateNaskahSoalPayload: vi.fn(),
        generateKunciJawabanPayload: vi.fn(),
      };
      assessmentService = new AssessmentService(mockAssessmentRepo);

      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      mockAssessmentRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        sekolah_id: mockSekolahId,
        penugasan_mengajar_id: mockPenugasanId,
        judul: "Ujian Akhir Semester Informatika",
        tanggal_pelaksanaan: new Date("2026-11-20T08:00:00Z"),
      });
    });

    it("4.1. Menghasilkan Payload Kartu Soal Resmi dengan Kop Sekolah dan Indikator Soal", async () => {
      const mockKartuPayload = {
        kop_sekolah: {
          nama_sekolah: "SMA Negeri 1 Prestasi",
          npsn: "12345678",
          alamat: "Jl. Pendidikan No. 1",
        },
        identitas: {
          tahun_ajaran: "2026/2027",
          semester: "Ganjil",
          mata_pelajaran: "Informatika",
          penyusun_nama: "Budi Santoso, S.Kom.",
          nama_asesmen: "Ujian Akhir Semester Informatika",
        },
        kartu_list: [
          {
            nomor_soal: 1,
            kompetensi_tp: "Menerapkan percabangan",
            materi_pokok: "Algoritma Dasar",
            indikator_soal: "Disajikan snippet kode",
            level_kognitif: "L3",
            bentuk_soal: "PILIHAN_GANDA",
            teks_soal: "Berapa nilai variabel x?",
            kunci_jawaban: "C",
            pedoman_penskoran: "Kunci: C, Skor: 2.0",
          },
        ],
      };

      mockAssessmentRepo.generateKartuSoalPayload.mockResolvedValue(mockKartuPayload);

      const result = await assessmentService.getKartuSoal(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId
      );

      expect(mockAssessmentRepo.generateKartuSoalPayload).toHaveBeenCalledWith(
        mockAsesmenId,
        mockSekolahId
      );
      expect(result.kop_sekolah.nama_sekolah).toBe("SMA Negeri 1 Prestasi");
      expect(result.kartu_list.length).toBe(1);
      expect(result.kartu_list[0].kunci_jawaban).toBe("C");
    });

    it("4.2. Menghasilkan Payload Naskah Soal Siap Cetak (Tanpa Kunci Jawaban)", async () => {
      const mockNaskahPayload = {
        kop_sekolah: {
          nama_sekolah: "SMA Negeri 1 Prestasi",
          alamat: "Jl. Pendidikan No. 1",
        },
        metadata_ujian: {
          judul_asesmen: "Ujian Akhir Semester Informatika",
          mata_pelajaran: "Informatika",
          kelas_rombel: "X RPL 1",
          hari_tanggal: "Jumat, 20 November 2026",
          alokasi_waktu: "90 Menit",
          kategori: "SUMATIF",
        },
        petunjuk_umum: ["Berdoalah sebelum mengerjakan soal."],
        butir_soal: [
          {
            nomor: 1,
            pertanyaan: "Berapa nilai variabel x?",
            bentuk_soal: "PILIHAN_GANDA",
            opsi_jawaban: [
              { label: "A", teks: "10" },
              { label: "B", teks: "20" },
              { label: "C", teks: "30" },
              { label: "D", teks: "40" },
            ],
            bobot: 2.0,
          },
        ],
      };

      mockAssessmentRepo.generateNaskahSoalPayload.mockResolvedValue(mockNaskahPayload);

      const result = await assessmentService.getNaskahSoal(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId
      );

      expect(mockAssessmentRepo.generateNaskahSoalPayload).toHaveBeenCalledWith(
        mockAsesmenId,
        mockSekolahId
      );
      expect(result.butir_soal.length).toBe(1);
      // Naskah soal tidak memuat kunci jawaban ke peserta ujian
      expect((result.butir_soal[0] as any).kunci_jawaban).toBeUndefined();
    });

    it("4.3. Menghasilkan Payload Dokumen Kunci Jawaban Resmi (Akses Khusus Guru/Admin)", async () => {
      const mockKunciPayload = {
        identitas: {
          nama_sekolah: "SMA Negeri 1 Prestasi",
          judul_asesmen: "Ujian Akhir Semester Informatika",
          mata_pelajaran: "Informatika",
          kelas_rombel: "X RPL 1",
          guru_nama: "Budi Santoso, S.Kom.",
          tanggal_pelaksanaan: "20/11/2026",
        },
        kunci_list: [
          {
            nomor: 1,
            bentuk_soal: "PILIHAN_GANDA",
            kunci_jawaban: "C",
            bobot: 2.0,
            pembahasan: "Nilai x dievaluasi pada baris ke-3.",
          },
        ],
        total_bobot: 2.0,
      };

      mockAssessmentRepo.generateKunciJawabanPayload.mockResolvedValue(mockKunciPayload);

      const result = await assessmentService.getKunciJawaban(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId
      );

      expect(mockAssessmentRepo.generateKunciJawabanPayload).toHaveBeenCalledWith(
        mockAsesmenId,
        mockSekolahId
      );
      expect(result.kunci_list[0].kunci_jawaban).toBe("C");
      expect(result.total_bobot).toBe(2.0);
    });

    it("4.4. Menolak akses Kunci Jawaban jika diakses oleh guru yang tidak berwenang", async () => {
      await expect(
        assessmentService.getKunciJawaban(
          mockAsesmenId,
          mockSekolahId,
          mockGuruPeerId // Guru lain
        )
      ).rejects.toThrow(AssessmentAccessDeniedError);
    });
  });
});
