/**
 * Ruang Pintar — M13 Assessment & Gradebook Application Service
 *
 * Invariant & Scope Guard:
 * - Assessment Definition ≠ Grade ≠ Grade Publication
 * - Missing Grade ≠ Zero Grade
 * - Guru hanya dapat mengelola penilaian pada Penugasan Mengajar miliknya (atau Super Admin)
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { recordAuditEvent } from "@/shared/infrastructure/audit/audit-logger";
import {
  AssessmentNotFoundError,
  AssessmentAccessDeniedError,
  AssessmentFinalizedError,
  AssessmentValidationError,
} from "../domain/assessment-errors";
import {
  CreateAssessmentSchema,
  UpdateAssessmentSchema,
  BulkSaveGradesSchema,
  PublishAssessmentSchema,
  UpsertKisiKisiSchema,
  UpsertItemKisiKisiSchema,
} from "../domain/assessment-validation";
import {
  assessmentRepository,
  AssessmentRepository,
} from "../infrastructure/assessment-repository";
import {
  CreateAssessmentInput,
  UpdateAssessmentInput,
  GradeItemInput,
  PublicationAudience,
  DefinisiAsesmenDTO,
  NilaiSiswaDTO,
  ClassGradebookDTO,
  KisiKisiAsesmenDTO,
  ItemKisiKisiDTO,
  UpsertKisiKisiInput,
  UpsertItemKisiKisiInput,
  KartuSoalPayloadDTO,
  NaskahSoalPayloadDTO,
  KunciJawabanPayloadDTO,
  BeritaAcaraPayloadDTO,
  DaftarHadirPayloadDTO,
  AnalisisButirSoalPayloadDTO,
  RekapNilaiAsesmenPayloadDTO,
  BerkasPengesahanPayloadDTO,
  CoverPaketAsesmenPayloadDTO,
} from "../domain/assessment-types";

export class AssessmentService {
  private repo: AssessmentRepository;
  constructor(repo: AssessmentRepository = assessmentRepository) {
    this.repo = repo;
  }

  /**
   * Helper verifikasi hak akses pengampu penugasan mengajar
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
      throw new AssessmentNotFoundError(penugasanId);
    }

    if (!guruId || penugasan.guru_id !== guruId) {
      throw new AssessmentAccessDeniedError(
        "Akses ditolak: Anda hanya berwenang mengelola penilaian pada kelas yang Anda ampu."
      );
    }

    return true;
  }

  /**
   * Ambil seluruh asesmen untuk satu penugasan mengajar
   */
  async getAssessments(
    penugasanId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<DefinisiAsesmenDTO[]> {
    await this.verifyTeacherAssignmentScope(penugasanId, sekolahId, guruId, isSuperAdmin);
    return this.repo.findByPenugasan(penugasanId, sekolahId);
  }

  /**
   * Ambil detail asesmen berdasarkan ID
   */
  async getAssessmentDetail(
    asesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ) {
    const asesmen = await this.repo.findById(asesmenId, sekolahId);
    if (!asesmen) {
      throw new AssessmentNotFoundError(asesmenId);
    }

    await this.verifyTeacherAssignmentScope(
      asesmen.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    return asesmen;
  }

  /**
   * Ambil daftar nilai siswa untuk form input / evaluasi per asesmen
   */
  async getAssessmentGrades(
    asesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<{ asesmen: any; grades: NilaiSiswaDTO[] }> {
    const asesmen = await this.getAssessmentDetail(asesmenId, sekolahId, guruId, isSuperAdmin);
    const grades = await this.repo.findAssessmentGrades(asesmenId, sekolahId);

    return { asesmen, grades };
  }

  /**
   * Buat Asesmen Baru
   */
  async createAssessment(
    input: CreateAssessmentInput,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ) {
    // 1. Validasi skema input
    const parsed = CreateAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      throw new AssessmentValidationError(parsed.error.issues.map((e) => e.message).join(", "));
    }

    // 2. Verifikasi hak akses
    await this.verifyTeacherAssignmentScope(
      input.penugasan_mengajar_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    // 3. Persistensi asesmen baru
    const created = await this.repo.createAssessment({
      sekolah_id: sekolahId,
      penugasan_mengajar_id: input.penugasan_mengajar_id,
      tp_id: input.tp_id,
      lingkup_materi_id: input.lingkup_materi_id,
      judul: input.judul.trim(),
      deskripsi: input.deskripsi?.trim() || null,
      kategori: input.kategori,
      teknik_penilaian: input.teknik_penilaian,
      bobot: input.bobot,
      skala_maksimal: input.skala_maksimal,
      kkm_kktp: input.kkm_kktp,
      tanggal_pelaksanaan: input.tanggal_pelaksanaan
        ? new Date(input.tanggal_pelaksanaan)
        : new Date(),
    });

    // 4. Audit Log
    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "CREATE_ASSESSMENT",
      tipe_sumber: "DefinisiAsesmen",
      id_sumber: created.id,
      payload_sesudah: {
        judul: created.judul,
        kategori: created.kategori,
        bobot: created.bobot,
        kkm_kktp: created.kkm_kktp,
        penugasan_mengajar_id: created.penugasan_mengajar_id,
      },
    });

    return created;
  }

  /**
   * Perbarui Asesmen
   */
  async updateAssessment(
    asesmenId: string,
    input: UpdateAssessmentInput,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ) {
    const existing = await this.getAssessmentDetail(asesmenId, sekolahId, guruId, isSuperAdmin);

    if (existing.status === "FINALIZED" && !isSuperAdmin) {
      throw new AssessmentFinalizedError(asesmenId);
    }

    const parsed = UpdateAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      throw new AssessmentValidationError(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const updated = await this.repo.updateAssessment(asesmenId, sekolahId, {
      ...input,
      tanggal_pelaksanaan: input.tanggal_pelaksanaan
        ? new Date(input.tanggal_pelaksanaan)
        : undefined,
    });

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "UPDATE_ASSESSMENT",
      tipe_sumber: "DefinisiAsesmen",
      id_sumber: asesmenId,
      payload_sebelum: {
        judul: existing.judul,
        kategori: existing.kategori,
        status: existing.status,
      },
      payload_sesudah: {
        judul: updated.judul,
        kategori: updated.kategori,
        status: updated.status,
      },
    });

    return updated;
  }

  /**
   * Hapus Asesmen
   */
  async deleteAssessment(
    asesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ) {
    const existing = await this.getAssessmentDetail(asesmenId, sekolahId, guruId, isSuperAdmin);

    if (existing.status === "FINALIZED" && !isSuperAdmin) {
      throw new AssessmentFinalizedError(asesmenId);
    }

    const deleted = await this.repo.deleteAssessment(asesmenId, sekolahId);

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "DELETE_ASSESSMENT",
      tipe_sumber: "DefinisiAsesmen",
      id_sumber: asesmenId,
      payload_sebelum: {
        judul: existing.judul,
        penugasan_id: existing.penugasan_mengajar_id,
      },
    });

    return deleted;
  }

  /**
   * Simpan Sekaligus Nilai Siswa (Bulk Grade Entry)
   */
  async saveGrades(
    asesmenId: string,
    grades: GradeItemInput[],
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = "",
    alasanKoreksi?: string | null
  ) {
    const asesmen = await this.getAssessmentDetail(asesmenId, sekolahId, guruId, isSuperAdmin);

    if (asesmen.status === "FINALIZED" && !isSuperAdmin) {
      throw new AssessmentFinalizedError(asesmenId);
    }

    const parsed = BulkSaveGradesSchema.safeParse({
      asesmen_id: asesmenId,
      grades,
      alasan_koreksi: alasanKoreksi,
    });

    if (!parsed.success) {
      throw new AssessmentValidationError(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const result = await this.repo.bulkSaveGrades(
      asesmenId,
      sekolahId,
      grades,
      userId,
      alasanKoreksi
    );

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "SAVE_ASSESSMENT_GRADES",
      tipe_sumber: "NilaiSiswa",
      id_sumber: asesmenId,
      payload_sesudah: {
        asesmen_id: asesmenId,
        total_grades: grades.length,
        alasan_koreksi: alasanKoreksi || null,
      },
    });

    return result;
  }

  /**
   * Publikasikan Hasil Asesmen & Nilai
   */
  async publishAssessment(
    asesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = "",
    targetAudience: PublicationAudience = "SEMUA",
    catatan?: string | null
  ) {
    await this.getAssessmentDetail(asesmenId, sekolahId, guruId, isSuperAdmin);

    const parsed = PublishAssessmentSchema.safeParse({
      asesmen_id: asesmenId,
      target_audience: targetAudience,
      catatan,
    });

    if (!parsed.success) {
      throw new AssessmentValidationError(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const pub = await this.repo.publishAssessment(
      asesmenId,
      sekolahId,
      userId,
      targetAudience,
      catatan
    );

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "PUBLISH_ASSESSMENT_GRADES",
      tipe_sumber: "PublikasiNilaiAsesmen",
      id_sumber: pub.id,
      payload_sesudah: {
        asesmen_id: asesmenId,
        target_audience: targetAudience,
        catatan: catatan || null,
      },
    });

    return pub;
  }

  /**
   * Ambil data Matriks Buku Nilai (Gradebook) Komprehensif
   */
  async getGradebook(
    penugasanId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<ClassGradebookDTO> {
    await this.verifyTeacherAssignmentScope(penugasanId, sekolahId, guruId, isSuperAdmin);
    return this.repo.getGradebookData(penugasanId, sekolahId);
  }

  /**
   * Ambil ringkasan seluruh penugasan untuk halaman Buku Nilai Terpusat Guru (/penilaian)
   */
  async getTeacherOverview(sekolahId: string, guruId?: string | null, isSuperAdmin = false) {
    return this.repo.getTeacherGradebookOverview(sekolahId, guruId, isSuperAdmin);
  }

  // ==========================================
  // ASSESSMENT BLUEPRINT (KISI-KISI)
  // ==========================================

  /**
   * Ambil Kisi-Kisi Asesmen lengkap dengan butir item matriks
   */
  async getKisiKisi(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<KisiKisiAsesmenDTO | null> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.findKisiKisiByAsesmenId(definisiAsesmenId, sekolahId);
  }

  /**
   * Buat atau Perbarui Header Kisi-Kisi Asesmen
   */
  async upsertKisiKisi(
    input: UpsertKisiKisiInput,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ): Promise<KisiKisiAsesmenDTO> {
    const parsed = UpsertKisiKisiSchema.safeParse(input);
    if (!parsed.success) {
      throw new AssessmentValidationError(parsed.error.issues.map((e) => e.message).join(", "));
    }

    await this.getAssessmentDetail(input.definisi_asesmen_id, sekolahId, guruId, isSuperAdmin);

    const result = await this.repo.upsertKisiKisi(sekolahId, parsed.data);

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "UPSERT_KISI_KISI",
      tipe_sumber: "KisiKisiAsesmen",
      id_sumber: result.id,
      payload_sesudah: {
        definisi_asesmen_id: input.definisi_asesmen_id,
        judul: input.judul,
        status: input.status || "DRAFT",
      },
    });

    return result;
  }

  /**
   * Buat atau Perbarui Butir Matriks Item Kisi-Kisi
   */
  async upsertItemKisiKisi(
    input: UpsertItemKisiKisiInput,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ): Promise<ItemKisiKisiDTO> {
    const parsed = UpsertItemKisiKisiSchema.safeParse(input);
    if (!parsed.success) {
      throw new AssessmentValidationError(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const kisiKisi = await prisma.kisiKisiAsesmen.findFirst({
      where: { id: input.kisi_kisi_id, sekolah_id: sekolahId },
    });
    if (!kisiKisi) {
      throw new AssessmentNotFoundError(`Kisi-kisi '${input.kisi_kisi_id}' tidak ditemukan.`);
    }

    await this.getAssessmentDetail(kisiKisi.definisi_asesmen_id, sekolahId, guruId, isSuperAdmin);

    const result = await this.repo.upsertItemKisiKisi(sekolahId, parsed.data);

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "UPSERT_ITEM_KISI_KISI",
      tipe_sumber: "ItemKisiKisi",
      id_sumber: result.id,
      payload_sesudah: {
        kisi_kisi_id: input.kisi_kisi_id,
        nomor_urut: input.nomor_urut,
        level_kognitif: input.level_kognitif,
      },
    });

    return result;
  }

  /**
   * Hapus Butir Item Kisi-Kisi
   */
  async deleteItemKisiKisi(
    itemId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ): Promise<void> {
    const item = await prisma.itemKisiKisi.findFirst({
      where: { id: itemId, sekolah_id: sekolahId },
      include: { kisi_kisi: true },
    });
    if (!item) {
      throw new AssessmentNotFoundError(`Item kisi-kisi '${itemId}' tidak ditemukan.`);
    }

    await this.getAssessmentDetail(
      item.kisi_kisi.definisi_asesmen_id,
      sekolahId,
      guruId,
      isSuperAdmin
    );

    await this.repo.deleteItemKisiKisi(sekolahId, itemId);

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "DELETE_ITEM_KISI_KISI",
      tipe_sumber: "ItemKisiKisi",
      id_sumber: itemId,
      payload_sebelum: {
        kisi_kisi_id: item.kisi_kisi_id,
        nomor_urut: item.nomor_urut,
      },
    });
  }

  // ==========================================
  // ASSESSMENT ADMINISTRATION FOUNDATION
  // ==========================================

  /**
   * Generate Dokumen Kartu Soal Resmi per Butir
   */
  async getKartuSoal(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<KartuSoalPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateKartuSoalPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * Generate Dokumen Naskah Soal 2 Kolom dengan Kop Resmi
   */
  async getNaskahSoal(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<NaskahSoalPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateNaskahSoalPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * Generate Dokumen Kunci Jawaban & Pedoman Penskoran Resmi (Akses Rahasia Pengampu/Admin)
   */
  async getKunciJawaban(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<KunciJawabanPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateKunciJawabanPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * Bekukan Snapshot Kisi-Kisi Asesmen (Hard-Pinning & Segel Hash SHA-256)
   */
  async freezeKisiKisi(
    kisiKisiId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false,
    userId = ""
  ): Promise<KisiKisiAsesmenDTO> {
    const kisiKisi = await prisma.kisiKisiAsesmen.findFirst({
      where: { id: kisiKisiId, sekolah_id: sekolahId },
    });
    if (!kisiKisi) {
      throw new AssessmentNotFoundError(`Kisi-kisi '${kisiKisiId}' tidak ditemukan.`);
    }

    await this.getAssessmentDetail(kisiKisi.definisi_asesmen_id, sekolahId, guruId, isSuperAdmin);

    const frozen = await this.repo.freezeKisiKisiSnapshot(kisiKisiId, sekolahId);

    await recordAuditEvent({
      sekolah_id: sekolahId,
      aktor_id: userId || "SYSTEM",
      aktor_role: isSuperAdmin ? "SUPER_ADMIN" : "TEACHER",
      aksi: "FREEZE_ASSESSMENT_SNAPSHOT",
      tipe_sumber: "KisiKisiAsesmen",
      id_sumber: kisiKisiId,
      payload_sesudah: {
        snapshot_hash: frozen.snapshot_hash,
        status: frozen.status,
        tanggal_dibekukan: frozen.tanggal_dibekukan,
      },
    });

    return frozen;
  }

  /**
   * Generate Dokumen Daftar Hadir Peserta Ujian Resmi
   */
  async getDaftarHadir(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<DaftarHadirPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateDaftarHadirPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * Generate Dokumen Berita Acara Pelaksanaan Ujian Resmi
   */
  async getBeritaAcara(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<BeritaAcaraPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateBeritaAcaraPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * CBT-03.1 — 1. Ambil Laporan Analisis Butir Soal Resmi
   */
  async getAnalisisButirSoal(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<AnalisisButirSoalPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateAnalisisButirSoalPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * CBT-03.1 — 2. Ambil Rekapitulasi Nilai Asesmen & Status Ketuntasan KKTP
   */
  async getRekapNilaiAsesmen(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<RekapNilaiAsesmenPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateRekapNilaiAsesmenPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * CBT-03.1 — 3. Ambil Berkas Pengesahan & Validasi Supervisi Asesmen
   */
  async getBerkasPengesahan(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<BerkasPengesahanPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateBerkasPengesahanPayload(definisiAsesmenId, sekolahId);
  }

  /**
   * CBT-03.1 — 4. Ambil Halaman Sampul (Cover Page) Paket Asesmen
   */
  async getCoverPaket(
    definisiAsesmenId: string,
    sekolahId: string,
    guruId?: string | null,
    isSuperAdmin = false
  ): Promise<CoverPaketAsesmenPayloadDTO> {
    await this.getAssessmentDetail(definisiAsesmenId, sekolahId, guruId, isSuperAdmin);
    return this.repo.generateCoverPaketPayload(definisiAsesmenId, sekolahId);
  }
}

export const assessmentService = new AssessmentService();
