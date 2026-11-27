/**
 * Ruang Pintar — CBT Validation Schemas (M14)
 */

import { z } from "zod";

export const CreateBankSoalSchema = z.object({
  mata_pelajaran_id: z.string().optional().nullable(),
  lingkup_materi_id: z.string().optional().nullable(),
  tujuan_pembelajaran_id: z.string().optional().nullable(),
  capaian_pembelajaran_id: z.string().optional().nullable(),
  folder_id: z.string().optional().nullable(),
  kode: z.string().optional().nullable(),
  jenis_soal: z.enum([
    "PILIHAN_GANDA",
    "PILIHAN_GANDA_KOMPLEKS",
    "BENAR_SALAH",
    "MENJODOHKAN",
    "ISIAN_SINGKAT",
    "URAIAN_ESAI",
    "ESAI",
  ]),
  tingkat_kesulitan: z.enum(["MUDAH", "SEDANG", "SULIT", "HOTS"]).optional().default("SEDANG"),
  scope_kepemilikan: z.enum(["PERSONAL", "SEKOLAH"]).optional().default("PERSONAL"),
  level_kognitif: z.enum(["L1", "L2", "L3"]).optional().default("L2"),
  bobot_default: z.number().min(0.1).optional().default(1.0),
  pertanyaan: z.string().min(1, "Pertanyaan wajib diisi"),
  gambar_url: z.string().optional().nullable(),
  opsi: z.any().optional().nullable(),
  kunci_jawaban: z.any(),
});

export const UpdateBankSoalScopeSchema = z.object({
  target_scope: z.enum(["PERSONAL", "SEKOLAH"]),
  level_kognitif: z.enum(["L1", "L2", "L3"]).optional(),
});

export const CreateVersiSoalSchema = z.object({
  pertanyaan: z.string().min(1, "Pertanyaan versi baru wajib diisi"),
  gambar_url: z.string().optional().nullable(),
  opsi: z.any().optional().nullable(),
  kunci_jawaban: z.any(),
  bobot: z.number().min(0.1).optional(),
  alasan_perubahan: z.string().optional().nullable(),
  tingkat_kesulitan: z.enum(["MUDAH", "SEDANG", "SULIT", "HOTS"]).optional().nullable(),
});

export const CreateUjianCbtSchema = z.object({
  penugasan_mengajar_id: z.string().min(1, "Penugasan mengajar wajib dipilih"),
  judul: z.string().min(1, "Judul ujian wajib diisi"),
  deskripsi: z.string().optional().nullable(),
  durasi_menit: z
    .number()
    .int()
    .min(5, "Durasi minimal 5 menit")
    .max(360, "Durasi maksimal 360 menit"),
  kktp: z.number().min(0).max(100).default(75),
  acak_soal: z.boolean().default(false),
  acak_opsi: z.boolean().default(false),
  gunakan_token: z.boolean().default(false),
  token_masuk: z.string().optional().nullable(),
  tampilkan_nilai: z.boolean().default(true),
  tampilkan_pembahasan: z.boolean().optional().default(false),
  maksimal_attempt: z.number().int().min(1).max(10).optional().default(1),
  waktu_mulai: z.coerce.date().optional().nullable(),
  waktu_selesai: z.coerce.date().optional().nullable(),
  blueprint_soal: z
    .array(
      z.object({
        bank_soal_id: z.string().min(1),
        nomor_urut: z.number().int().min(1),
        bobot_kustom: z.number().min(0.1).optional(),
      })
    )
    .min(1, "Minimal pilih 1 butir soal untuk menyusun ujian"),
});

export const AutosaveJawabanSchema = z.object({
  sesi_ujian_siswa_id: z.string().min(1),
  nomor_urut: z.number().int().min(1),
  soal_id: z.string().optional().nullable(),
  versi_soal_id: z.string().optional().nullable(),
  session_token: z.string().optional().nullable(),
  jawaban_pilihan: z.string().optional().nullable(),
  jawaban_teks: z.string().optional().nullable(),
  jawaban_kompleks: z.array(z.string()).optional().nullable(),
  jawaban_menjodohkan: z.record(z.string(), z.string()).optional().nullable(),
  ragu_ragu: z.boolean().optional(),
});

export const BatchAutosaveJawabanSchema = z.object({
  sesi_ujian_siswa_id: z.string().min(1),
  session_token: z.string().optional().nullable(),
  items: z
    .array(
      AutosaveJawabanSchema.extend({
        soal_id: z.string().min(1),
      })
    )
    .min(1)
    .max(100),
});

export const RecordIntegrityEventSchema = z.object({
  sesi_ujian_siswa_id: z.string().min(1),
  nomor_urut_soal: z.number().int().optional().nullable(),
  tipe_event: z.enum([
    "KELUAR_LAYAR_PENUH",
    "PINDAH_TAB_ATAU_WINDOW",
    "PERCOBAAN_DEVTOOLS",
    "KONEKSI_TERPUTUS",
    "LAINNYA",
  ]),
  deskripsi: z.string().min(1, "Deskripsi event integritas wajib diisi"),
  metadata: z.any().optional().nullable(),
});

export const TransferToGradebookSchema = z.object({
  ujian_cbt_id: z.string().min(1),
  nama_asesmen: z.string().min(1, "Nama asesmen di buku nilai wajib diisi"),
  kategori: z.enum(["FORMATIF", "SUMATIF"]),
  jenis_asesmen: z.string().min(1),
  bobot: z.number().min(0.1).default(1.0),
  lingkup_materi_id: z.string().optional().nullable(),
  tujuan_pembelajaran_id: z.string().optional().nullable(),
});

/**
 * M14 CBT — Publication Engine Validation
 */
export const TransitionPublicationStatusSchema = z.object({
  target_status: z.enum([
    "DRAFT",
    "REVIEW",
    "FINAL",
    "SCHEDULED",
    "PUBLISHED",
    "ACTIVE",
    "SUBMITTED",
    "CLOSED",
    "ARCHIVED",
  ]),
  alasan: z.string().optional().nullable(),
});

/**
 * M14 CBT — Session Engine Validation
 */
export const CreateExamSessionSchema = z.object({
  ujian_cbt_id: z.string().min(1, "ID Ujian CBT wajib diisi"),
  kode_sesi: z.string().min(1, "Kode sesi wajib diisi"),
  nama_sesi: z.string().min(1, "Nama sesi wajib diisi"),
  waktu_mulai: z.coerce.date(),
  waktu_selesai: z.coerce.date(),
  ruang_ujian: z.string().optional().nullable(),
  pengawas_nama: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
  generate_token: z.boolean().default(true),
});

export const UpdateExamSessionStatusSchema = z.object({
  status: z.enum(["TERJADWAL", "DIBUKA", "DITUTUP", "SELESAI"]),
  catatan: z.string().optional().nullable(),
});

/**
 * M14 CBT — Token Engine Validation
 */
export const GenerateExamTokenSchema = z.object({
  session_id: z.string().min(1, "ID Sesi wajib diisi"),
  expiry_minutes: z.number().int().min(5).max(1440).optional().default(120),
});

export const ValidateExamTokenSchema = z.object({
  session_id: z.string().min(1, "ID Sesi wajib diisi"),
  token: z.string().min(6).max(6, "Token wajib 6 karakter"),
});

/**
 * M14 CBT — Student Eligibility Validation
 */
export const CheckStudentEligibilitySchema = z.object({
  ujian_cbt_id: z.string().min(1, "ID Ujian CBT wajib diisi"),
  session_id: z.string().optional().nullable(),
  siswa_id: z.string().min(1, "ID Siswa wajib diisi"),
});

/**
 * M14 CBT — Attempt Foundation Validation
 */
export const CreateAssessmentAttemptSchema = z.object({
  ujian_cbt_id: z.string().min(1, "ID Ujian CBT wajib diisi"),
  session_id: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
});

export const UpdateAttemptStatusSchema = z.object({
  attempt_id: z.string().min(1, "ID Attempt wajib diisi"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "ABANDONED"]),
  alasan: z.string().optional().nullable(),
});

// Inferred Types
export type CreateBankSoalInput = z.input<typeof CreateBankSoalSchema>;
export type CreateBankSoalOutput = z.output<typeof CreateBankSoalSchema>;
export type CreateVersiSoalInput = z.infer<typeof CreateVersiSoalSchema>;
export type CreateUjianCbtInput = z.infer<typeof CreateUjianCbtSchema>;
export type AutosaveJawabanInput = z.infer<typeof AutosaveJawabanSchema>;
export type BatchAutosaveJawabanInput = z.infer<typeof BatchAutosaveJawabanSchema>;
export type RecordIntegrityEventInput = z.infer<typeof RecordIntegrityEventSchema>;
export type TransferToGradebookInput = z.infer<typeof TransferToGradebookSchema>;
export type TransitionPublicationStatusInput = z.infer<typeof TransitionPublicationStatusSchema>;
export type CreateExamSessionInput = z.infer<typeof CreateExamSessionSchema>;
export type UpdateExamSessionStatusInput = z.infer<typeof UpdateExamSessionStatusSchema>;
export type GenerateExamTokenInput = z.infer<typeof GenerateExamTokenSchema>;
export type ValidateExamTokenInput = z.infer<typeof ValidateExamTokenSchema>;
export type CheckStudentEligibilityInput = z.infer<typeof CheckStudentEligibilitySchema>;
export type CreateAssessmentAttemptInput = z.infer<typeof CreateAssessmentAttemptSchema>;
export type UpdateAttemptStatusInput = z.infer<typeof UpdateAttemptStatusSchema>;

// Backward-compatible alias exports
export const createQuestionSchema = CreateBankSoalSchema;
export const createExamSchema = CreateUjianCbtSchema;
export const saveAnswerSchema = AutosaveJawabanSchema;
export const recordIntegrityEventSchema = RecordIntegrityEventSchema;
export const transferResultSchema = TransferToGradebookSchema;
