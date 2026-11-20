import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssessmentService } from "@/modules/assessment/application/assessment-service";
import {
  generateDeterministicSnapshotHash,
  formatSnapshotSealCode,
} from "@/modules/assessment/infrastructure/snapshot-hash-helper";
import { AssessmentAccessDeniedError } from "@/modules/assessment/domain/assessment-errors";
import { prisma } from "@/shared/infrastructure/database/prisma";

// Mock audit logger
vi.mock("@/shared/infrastructure/audit/audit-logger", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({ id: "AUDIT_1" }),
}));

describe("STAGE CBT-03: Assessment Administration & Print Engine Service", () => {
  let service: AssessmentService;
  let mockRepo: any;

  const mockSekolahId = "01J00000000000000000000001";
  const mockPenugasanId = "01J000000000000000PENUGAS1";
  const mockGuruOwnerId = "01J000000000000000000GURU1";
  const mockOtherGuruId = "01J000000000000000000GURU2";
  const mockAsesmenId = "01J0000000000000000ASESMEN1";
  const mockKisiKisiId = "01J00000000000000000KISIKIS1";

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      findById: vi.fn(),
      findKisiKisiByAsesmenId: vi.fn(),
      freezeKisiKisiSnapshot: vi.fn(),
      generateKartuSoalPayload: vi.fn(),
      generateNaskahSoalPayload: vi.fn(),
      generateKunciJawabanPayload: vi.fn(),
      generateDaftarHadirPayload: vi.fn(),
      generateBeritaAcaraPayload: vi.fn(),
      generateCoverPaketPayload: vi.fn(),
      generateBerkasPengesahanPayload: vi.fn(),
      generateRekapNilaiAsesmenPayload: vi.fn(),
      generateAnalisisButirSoalPayload: vi.fn(),
    };

    service = new AssessmentService(mockRepo);
  });

  describe("1. Cryptographic Snapshot Hash & Seal Code Helper", () => {
    it("generates 64-character SHA-256 deterministic hash regardless of key order", () => {
      const obj1 = { z: 1, a: "test", nested: { y: 2, b: 3 } };
      const obj2 = { a: "test", z: 1, nested: { b: 3, y: 2 } };

      const hash1 = generateDeterministicSnapshotHash(obj1);
      const hash2 = generateDeterministicSnapshotHash(obj2);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    });

    it("formats snapshot seal code with valid prefix, 8 hex characters, and school year", () => {
      const sampleHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const seal = formatSnapshotSealCode(sampleHash, "2026/2027");

      expect(seal).toBe("RP-SNAP-E3B0C442-2026");
    });
  });

  describe("2. Freeze Kisi-Kisi & Immutability Hard-Pinning", () => {
    it("successfully freezes snapshot when accessed by owner teacher", async () => {
      // Setup mock kisi-kisi finding
      vi.spyOn(prisma.kisiKisiAsesmen, "findFirst").mockResolvedValue({
        id: mockKisiKisiId,
        sekolah_id: mockSekolahId,
        definisi_asesmen_id: mockAsesmenId,
      } as any);

      // Setup mock penugasan finding for authorization guard
      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      mockRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        penugasan_mengajar_id: mockPenugasanId,
        penugasan_mengajar: { guru_id: mockGuruOwnerId },
      });

      const frozenDate = new Date().toISOString();
      const mockFrozenResult = {
        id: mockKisiKisiId,
        sekolah_id: mockSekolahId,
        definisi_asesmen_id: mockAsesmenId,
        status: "FINAL",
        snapshot_hash: "a".repeat(64),
        tanggal_dibekukan: frozenDate,
        items: [],
      };
      mockRepo.freezeKisiKisiSnapshot.mockResolvedValue(mockFrozenResult);

      const result = await service.freezeKisiKisi(
        mockKisiKisiId,
        mockSekolahId,
        mockGuruOwnerId,
        false,
        "USER_ACTOR"
      );

      expect(result.status).toBe("FINAL");
      expect(result.snapshot_hash).toBe("a".repeat(64));
      expect(mockRepo.freezeKisiKisiSnapshot).toHaveBeenCalledWith(mockKisiKisiId, mockSekolahId);
    });

    it("rejects non-owner teacher from freezing the snapshot", async () => {
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

      mockRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        penugasan_mengajar_id: mockPenugasanId,
        penugasan_mengajar: { guru_id: mockGuruOwnerId },
      });

      await expect(
        service.freezeKisiKisi(
          mockKisiKisiId,
          mockSekolahId,
          mockOtherGuruId,
          false,
          "UNAUTHORIZED_USER"
        )
      ).rejects.toThrow(AssessmentAccessDeniedError);

      expect(mockRepo.freezeKisiKisiSnapshot).not.toHaveBeenCalled();
    });
  });

  describe("3. Document Generation & Snapshot Reading", () => {
    beforeEach(() => {
      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      mockRepo.findById.mockResolvedValue({
        id: mockAsesmenId,
        penugasan_mengajar_id: mockPenugasanId,
        penugasan_mengajar: { guru_id: mockGuruOwnerId },
      });
    });

    it("generates Kartu Soal payload with school letterhead and items from snapshot", async () => {
      const mockKartuPayload = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        identitas: {
          tahun_ajaran: "2026/2027",
          semester: "GANJIL",
          mata_pelajaran: "Pemrograman Web",
          penyusun_nama: "Pak Budi",
          nama_asesmen: "Sumatif Akhir Bab",
        },
        snapshot_hash: "b".repeat(64),
        kartu_list: [
          {
            nomor_soal: 1,
            kompetensi_tp: "Memahami DOM Manipulation",
            materi_pokok: "DOM API",
            indikator_soal: "Disajikan kode DOM, siswa dapat menganalisis output",
            level_kognitif: "L3",
            bentuk_soal: "PILIHAN_GANDA",
            teks_soal: "Apa output dari document.getElementById('test')?",
            kunci_jawaban: "A",
            pedoman_penskoran: "Skor 1 untuk jawaban benar",
          },
        ],
      };

      mockRepo.generateKartuSoalPayload.mockResolvedValue(mockKartuPayload);

      const result = await service.getKartuSoal(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(result.identitas.mata_pelajaran).toBe("Pemrograman Web");
      expect(result.kartu_list).toHaveLength(1);
      expect(result.kartu_list[0].level_kognitif).toBe("L3");
      expect(mockRepo.generateKartuSoalPayload).toHaveBeenCalledWith(mockAsesmenId, mockSekolahId);
    });

    it("generates Naskah Soal 2 Kolom payload with general instructions and question items", async () => {
      const mockNaskahPayload = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        metadata_ujian: {
          judul_asesmen: "Ujian Akhir Semester",
          mata_pelajaran: "Informatika",
          kelas_rombel: "XII-RPL-1",
          hari_tanggal: "Senin, 12 Oktober 2026",
          alokasi_waktu: "90 Menit",
          kategori: "SUMATIF",
        },
        snapshot_hash: "c".repeat(64),
        petunjuk_umum: ["Berdoalah sebelum mengerjakan soal."],
        butir_soal: [
          {
            nomor: 1,
            pertanyaan: "Jelaskan definisi modular monolith!",
            bentuk_soal: "URAIAN",
            bobot: 10,
          },
        ],
      };

      mockRepo.generateNaskahSoalPayload.mockResolvedValue(mockNaskahPayload);

      const result = await service.getNaskahSoal(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(result.metadata_ujian.judul_asesmen).toBe("Ujian Akhir Semester");
      expect(result.petunjuk_umum).toContain("Berdoalah sebelum mengerjakan soal.");
      expect(result.butir_soal[0].nomor).toBe(1);
      expect(mockRepo.generateNaskahSoalPayload).toHaveBeenCalledWith(mockAsesmenId, mockSekolahId);
    });

    it("generates Kunci Jawaban confidential payload with total score calculation", async () => {
      const mockKunciPayload = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        identitas: {
          judul_asesmen: "Ujian Akhir Semester",
          mata_pelajaran: "Informatika",
          kelas_rombel: "XII-RPL-1",
          guru_nama: "Pak Budi",
          tanggal_pelaksanaan: "12/10/2026",
        },
        snapshot_hash: "d".repeat(64),
        kunci_list: [
          { nomor: 1, bentuk_soal: "PG", kunci_jawaban: "A", bobot: 2, pembahasan: "Opsi A benar" },
          { nomor: 2, bentuk_soal: "URAIAN", kunci_jawaban: "Rubrik terlampir", bobot: 8 },
        ],
        total_bobot: 10,
      };

      mockRepo.generateKunciJawabanPayload.mockResolvedValue(mockKunciPayload);

      const result = await service.getKunciJawaban(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(result.total_bobot).toBe(10);
      expect(result.kunci_list).toHaveLength(2);
      expect(mockRepo.generateKunciJawabanPayload).toHaveBeenCalledWith(
        mockAsesmenId,
        mockSekolahId
      );
    });

    it("generates Daftar Hadir and Berita Acara with student list and attendance statistics", async () => {
      const mockDaftarHadir = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        metadata_ujian: {
          judul_asesmen: "Ujian Akhir Semester",
          mata_pelajaran: "Informatika",
          kelas_rombel: "XII-RPL-1",
          hari_tanggal: "Senin, 12 Oktober 2026",
          alokasi_waktu: "90 Menit",
          guru_pengampu: "Pak Budi",
        },
        siswa_list: [
          { nomor: 1, siswa_id: "SISWA_1", nis: "1001", nama_lengkap: "Ahmad Santoso" },
          { nomor: 2, siswa_id: "SISWA_2", nis: "1002", nama_lengkap: "Budi Pratama" },
        ],
      };

      const mockBeritaAcara = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        metadata_ujian: {
          judul_asesmen: "Ujian Akhir Semester",
          mata_pelajaran: "Informatika",
          kelas_rombel: "XII-RPL-1",
          hari_tanggal: "Senin, 12 Oktober 2026",
          waktu_mulai_selesai: "08.00 s.d. 09.30 WIB",
        },
        statistik: {
          jumlah_peserta_seharusnya: 2,
          jumlah_hadir: 2,
          jumlah_tidak_hadir: 0,
        },
        siswa_tidak_hadir: [],
        pengawas_1: { nama: "Pak Budi" },
      };

      mockRepo.generateDaftarHadirPayload.mockResolvedValue(mockDaftarHadir);
      mockRepo.generateBeritaAcaraPayload.mockResolvedValue(mockBeritaAcara);

      const resHadir = await service.getDaftarHadir(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );
      const resBA = await service.getBeritaAcara(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(resHadir.siswa_list).toHaveLength(2);
      expect(resBA.statistik.jumlah_hadir).toBe(2);
      expect(resBA.statistik.jumlah_tidak_hadir).toBe(0);
    });

    it("generates Cover Paket payload with 10 documents catalog and verification seal", async () => {
      const mockCover = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        identitas: {
          judul_asesmen: "Ujian Akhir Semester",
          mata_pelajaran: "Informatika",
          kelas_rombel: "XII-RPL-1",
          tahun_ajaran: "2026/2027",
          semester: "GANJIL",
          guru_pengampu: "Pak Budi",
          tanggal_penyusunan: "12 Oktober 2026",
        },
        kode_segel: "RP-SNAP-C0VER001-2026",
        versi_paket: "PAKET-FINAL-SEALED",
        total_lampiran: 10,
        daftar_dokumen_lampiran: [{ no: 1, nama_dokumen: "Cover", status: "TERSEDIA" }],
      };

      mockRepo.generateCoverPaketPayload.mockResolvedValue(mockCover);

      const res = await service.getCoverPaket(mockAsesmenId, mockSekolahId, mockGuruOwnerId, false);

      expect(res.kode_segel).toBe("RP-SNAP-C0VER001-2026");
      expect(res.total_lampiran).toBe(10);
      expect(mockRepo.generateCoverPaketPayload).toHaveBeenCalledWith(mockAsesmenId, mockSekolahId);
    });

    it("generates Berkas Pengesahan with curriculum review aspects and 3 signers", async () => {
      const mockPengesahan = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        identitas: {
          judul_asesmen: "Ujian Akhir Semester",
          mata_pelajaran: "Informatika",
          nomor_dokumen: "DOC/BA-VAL/2026/01J",
        },
        aspek_verifikasi: [
          { no: 1, aspek: "Kesesuaian CP/TP", hasil_telaah: "MEMENUHI" },
          { no: 2, aspek: "KKTP", hasil_telaah: "MEMENUHI" },
        ],
        rekomendasi: "LAYAK_DIGUNAKAN",
        pihak_pengesah: {
          guru_penyusun: { nama: "Pak Budi" },
          penelaah_kurikulum: { nama: "Waka Kurikulum" },
          kepala_sekolah: { nama: "Kepala Sekolah" },
        },
      };

      mockRepo.generateBerkasPengesahanPayload.mockResolvedValue(mockPengesahan);

      const res = await service.getBerkasPengesahan(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(res.rekomendasi).toBe("LAYAK_DIGUNAKAN");
      expect(res.pihak_pengesah.guru_penyusun.nama).toBe("Pak Budi");
      expect(res.aspek_verifikasi).toHaveLength(2);
    });

    it("generates Rekap Nilai Asesmen with KKTP status and remedial summary", async () => {
      const mockRekap = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        identitas: { judul_asesmen: "Ujian Akhir Semester", kkm_kktp: 75 },
        peserta_nilai: [
          { nomor: 1, nama_lengkap: "Siswa 1", nilai_angka: 85, status_tuntas: "TUNTAS" },
          { nomor: 2, nama_lengkap: "Siswa 2", nilai_angka: 65, status_tuntas: "BELUM_TUNTAS" },
        ],
        statistik: {
          total_siswa: 2,
          jumlah_tuntas: 1,
          persentase_tuntas: 50,
          jumlah_remedial: 1,
          rata_rata_kelas: 75.0,
        },
      };

      mockRepo.generateRekapNilaiAsesmenPayload.mockResolvedValue(mockRekap);

      const res = await service.getRekapNilaiAsesmen(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(res.statistik.jumlah_tuntas).toBe(1);
      expect(res.statistik.jumlah_remedial).toBe(1);
      expect(res.peserta_nilai[0].status_tuntas).toBe("TUNTAS");
    });

    it("generates Analisis Butir Soal with difficulty index, discrimination index, and distractors", async () => {
      const mockAnalisis = {
        kop_sekolah: { nama_sekolah: "SMA Negeri 1 Prestasi" },
        identitas: { judul_asesmen: "Ujian Akhir Semester", total_butir_soal: 2 },
        butir_analisis: [
          {
            nomor: 1,
            tingkat_kesukaran: 0.75,
            kategori_kesukaran: "MUDAH",
            daya_pembeda: 0.42,
            kategori_daya_pembeda: "BAIK_SEKALI",
            status_kualitas: "DITERIMA",
          },
        ],
        distribusi_nilai: { total_peserta: 30, rata_rata: 78.5 },
        ringkasan: { butir_diterima: 1, butir_direvisi: 0, butir_ditolak: 0 },
      };

      mockRepo.generateAnalisisButirSoalPayload.mockResolvedValue(mockAnalisis);

      const res = await service.getAnalisisButirSoal(
        mockAsesmenId,
        mockSekolahId,
        mockGuruOwnerId,
        false
      );

      expect(res.butir_analisis[0].tingkat_kesukaran).toBe(0.75);
      expect(res.butir_analisis[0].kategori_daya_pembeda).toBe("BAIK_SEKALI");
      expect(res.ringkasan.butir_diterima).toBe(1);
    });

    it("enforces Teacher Scope Guard on all CBT-03.1 administrative endpoints", async () => {
      // Setup mock penugasan finding for non-owner teacher
      vi.spyOn(prisma.penugasanMengajar, "findFirst").mockResolvedValue({
        id: mockPenugasanId,
        guru_id: mockGuruOwnerId,
        status: "AKTIF",
      } as any);

      await expect(
        service.getCoverPaket(mockAsesmenId, mockSekolahId, mockOtherGuruId, false)
      ).rejects.toThrow(AssessmentAccessDeniedError);

      await expect(
        service.getBerkasPengesahan(mockAsesmenId, mockSekolahId, mockOtherGuruId, false)
      ).rejects.toThrow(AssessmentAccessDeniedError);

      await expect(
        service.getRekapNilaiAsesmen(mockAsesmenId, mockSekolahId, mockOtherGuruId, false)
      ).rejects.toThrow(AssessmentAccessDeniedError);

      await expect(
        service.getAnalisisButirSoal(mockAsesmenId, mockSekolahId, mockOtherGuruId, false)
      ).rejects.toThrow(AssessmentAccessDeniedError);
    });
  });
});
