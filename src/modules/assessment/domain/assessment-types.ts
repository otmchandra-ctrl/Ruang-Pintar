/**
 * Ruang Pintar — M13 Assessment & Gradebook Domain Types
 *
 * Invariant Kanonikal:
 * - Assessment Definition ≠ Grade ≠ Grade Publication
 * - Missing Grade ≠ Zero Grade (nilai_angka bernilai null jika belum dinilai, BUKAN 0)
 * - TP adalah data domain dinamis, dilarang nama kolom statis (nilai_tp1, nilai_tp2)
 */

export type AssessmentCategory = "FORMATIF" | "SUMATIF" | "SUMATIF_AKHIR" | "TUGAS" | "PRAKTIK";

/**
 * Mengelompokkan kategori asesmen yang berperan sebagai penilaian proses / formatif pada TP
 * (mencakup FORMATIF, TUGAS, dan PRAKTIK).
 */
export function isFormatifAssessmentCategory(kategori: string): boolean {
  return kategori === "FORMATIF" || kategori === "TUGAS" || kategori === "PRAKTIK";
}

export type AssessmentTechnique =
  "TES_TERTULIS" | "TES_LISAN" | "PENUGASAN" | "KINERJA" | "PORTOFOLIO";

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "FINALIZED" | "ARSIP";

export type GradeStatus = "DRAFT" | "PUBLISHED" | "FINALIZED";

export type PublicationAudience = "SISWA" | "WALI" | "SEMUA";

export interface DefinisiAsesmenDTO {
  id: string;
  sekolah_id: string;
  penugasan_mengajar_id: string;
  tp_id?: string | null;
  tp_kode?: string | null;
  tp_deskripsi?: string | null;
  lingkup_materi_id?: string | null;
  lingkup_materi_judul?: string | null;
  judul: string;
  deskripsi?: string | null;
  kategori: AssessmentCategory;
  teknik_penilaian: AssessmentTechnique;
  bobot: number;
  skala_maksimal: number;
  kkm_kktp: number;
  tanggal_pelaksanaan: string; // ISO String
  status: AssessmentStatus;
  is_published: boolean;
  total_siswa_dinilai: number;
  total_siswa_rombel: number;
  rata_rata_nilai?: number | null;
  created_at: string;
  updated_at: string;
}

export interface NilaiSiswaDTO {
  id: string;
  sekolah_id: string;
  asesmen_id: string;
  siswa_id: string;
  penempatan_rombel_id?: string | null;
  siswa_nis: string | null;
  siswa_nama: string;
  nomor_absen?: number | null;
  nilai_angka: number | null; // NULLABLE! Missing Grade ≠ Zero Grade
  nilai_huruf?: string | null;
  capaian_kompetensi?: string | null;
  catatan?: string | null;
  status: GradeStatus;
  diinput_oleh?: string | null;
  diubah_terakhir_oleh?: string | null;
  alasan_koreksi?: string | null;
  is_tercapai_kktp?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface PublikasiNilaiAsesmenDTO {
  id: string;
  sekolah_id: string;
  asesmen_id: string;
  target_audience: PublicationAudience;
  tanggal_publikasi: string;
  dipublikasikan_oleh: string;
  status: "PUBLISHED" | "DITARIK";
  catatan?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Representasi satu kolom asesmen pada Matriks Buku Nilai (Gradebook)
 */
export interface GradebookColumnDTO {
  id: string; // asesmen_id
  judul: string;
  kategori: AssessmentCategory;
  tp_id?: string | null;
  tp_kode?: string | null;
  tp_deskripsi?: string | null;
  lingkup_materi_id?: string | null;
  lingkup_materi_judul?: string | null;
  bobot: number;
  kkm_kktp: number;
  status: AssessmentStatus;
  is_published: boolean;
  tanggal_pelaksanaan: string;
}

/**
 * Representasi satu baris siswa pada Matriks Buku Nilai (Gradebook)
 */
export interface GradebookStudentRowDTO {
  siswa_id: string;
  penempatan_rombel_id?: string | null;
  nis: string | null;
  nisn?: string | null;
  nama_lengkap: string;
  nomor_absen?: number | null;
  // Map asesmen_id ke nilai angka (atau null jika belum dinilai)
  grades: Record<
    string,
    {
      nilai_id?: string;
      nilai_angka: number | null;
      status: GradeStatus;
      capaian_kompetensi?: string | null;
    }
  >;
  rata_rata_formatif: number | null;
  rata_rata_sumatif: number | null;
  nilai_akhir: number | null;
  ketercapaian_kktp_persen: number | null;
}

/**
 * Matriks Buku Nilai Lengkap untuk Penugasan Mengajar (Kelas + Mapel)
 */
export interface ClassGradebookDTO {
  penugasan_id: string;
  sekolah_id: string;
  rombel_id: string;
  rombel_nama: string;
  mata_pelajaran_id: string;
  mata_pelajaran_nama: string;
  kkm_default: number;
  columns: GradebookColumnDTO[];
  rows: GradebookStudentRowDTO[];
  statistics: {
    total_siswa: number;
    total_asesmen: number;
    total_formatif: number;
    total_sumatif: number;
    rata_rata_kelas: number | null;
    persentase_tuntas_kktp: number | null;
  };
}

export interface CreateAssessmentInput {
  penugasan_mengajar_id: string;
  tp_id?: string | null;
  lingkup_materi_id?: string | null;
  judul: string;
  deskripsi?: string | null;
  kategori: AssessmentCategory;
  teknik_penilaian: AssessmentTechnique;
  bobot?: number;
  skala_maksimal?: number;
  kkm_kktp?: number;
  tanggal_pelaksanaan?: string;
}

export interface UpdateAssessmentInput {
  judul?: string;
  deskripsi?: string | null;
  kategori?: AssessmentCategory;
  teknik_penilaian?: AssessmentTechnique;
  bobot?: number;
  skala_maksimal?: number;
  kkm_kktp?: number;
  tanggal_pelaksanaan?: string;
  status?: AssessmentStatus;
}

export interface GradeItemInput {
  siswa_id: string;
  penempatan_rombel_id?: string | null;
  nilai_angka: number | null; // NULLABLE! Missing Grade ≠ Zero Grade
  capaian_kompetensi?: string | null;
  catatan?: string | null;
  status?: GradeStatus;
  alasan_koreksi?: string | null;
}

export interface BulkSaveGradesInput {
  asesmen_id: string;
  grades: GradeItemInput[];
  alasan_koreksi?: string | null;
}

export interface PublishAssessmentInput {
  asesmen_id: string;
  target_audience?: PublicationAudience;
  catatan?: string | null;
}

/**
 * M13 — Assessment Blueprint & Administration
 */
export type StatusKisiKisi = "DRAFT" | "REVIEW" | "FINAL" | "ARSIP";
export type LevelKognitifBlueprint = "L1" | "L2" | "L3";

export interface ItemKisiKisiDTO {
  id: string;
  sekolah_id: string;
  kisi_kisi_id: string;
  tujuan_pembelajaran_id: string;
  tp_kode?: string | null;
  tp_deskripsi?: string;
  lingkup_materi_judul?: string | null;
  nomor_urut: number;
  indikator_soal: string;
  level_kognitif: LevelKognitifBlueprint;
  bentuk_soal: string;
  bobot_skor: number;
  bank_soal_id?: string | null;
  versi_soal_id?: string | null;
  snapshot_pertanyaan?: string | null;
  snapshot_opsi?: string | null;
  snapshot_kunci?: string | null;
  snapshot_pembahasan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KisiKisiAsesmenDTO {
  id: string;
  sekolah_id: string;
  definisi_asesmen_id: string;
  asesmen_judul?: string;
  mata_pelajaran_nama?: string;
  guru_nama?: string;
  rombel_nama?: string;
  judul: string;
  tahun_ajaran: string;
  semester: string;
  alokasi_waktu_menit: number;
  total_butir_soal: number;
  status: StatusKisiKisi;
  catatan_supervisi?: string | null;
  snapshot_hash?: string | null;
  tanggal_dibekukan?: string | null;
  items: ItemKisiKisiDTO[];
  created_at: string;
  updated_at: string;
}

export interface UpsertKisiKisiInput {
  definisi_asesmen_id: string;
  judul: string;
  tahun_ajaran: string;
  semester: string;
  alokasi_waktu_menit?: number;
  catatan_supervisi?: string | null;
  status?: StatusKisiKisi;
}

export interface UpsertItemKisiKisiInput {
  kisi_kisi_id: string;
  tujuan_pembelajaran_id: string;
  nomor_urut: number;
  indikator_soal: string;
  level_kognitif?: LevelKognitifBlueprint;
  bentuk_soal?: string;
  bobot_skor?: number;
  bank_soal_id?: string | null;
  versi_soal_id?: string | null;
}

// Kop Surat Fleksibel Sekolah Indonesia
export interface KopSekolahDTO {
  nama_sekolah: string;
  npsn?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  email?: string | null;
  website?: string | null;
  baris_instansi_1?: string | null; // e.g. "PEMERINTAH PROVINSI JAWA BARAT"
  baris_instansi_2?: string | null; // e.g. "DINAS PENDIDIKAN"
  baris_instansi_3?: string | null; // e.g. "CABANG DINAS PENDIDIKAN WILAYAH VII"
  logo_kiri_url?: string | null; // Logo Pemprov / Dinas / Yayasan
  logo_kanan_url?: string | null; // Logo Sekolah / Tut Wuri Handayani
}

// Payload Siap Cetak Dokumen Administrasi Resmi
export interface KartuSoalItemDTO {
  nomor_soal: number;
  kompetensi_tp: string;
  materi_pokok: string;
  indikator_soal: string;
  level_kognitif: LevelKognitifBlueprint;
  bentuk_soal: string;
  stimulus_teks?: string | null;
  stimulus_gambar_url?: string | null;
  teks_soal: string;
  kunci_jawaban: string;
  pedoman_penskoran: string;
}

export interface KartuSoalPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  identitas: {
    tahun_ajaran: string;
    semester: string;
    mata_pelajaran: string;
    penyusun_nama: string;
    nama_asesmen: string;
  };
  snapshot_hash?: string | null;
  tanggal_dibekukan?: string | null;
  kartu_list: KartuSoalItemDTO[];
}

export interface NaskahSoalButirDTO {
  nomor: number;
  stimulus?: string | null;
  gambar_url?: string | null;
  pertanyaan: string;
  bentuk_soal: string;
  opsi_jawaban?: Array<{ label: string; teks: string }> | null;
  bobot: number;
}

export interface NaskahSoalPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  metadata_ujian: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    hari_tanggal: string;
    alokasi_waktu: string;
    kategori: string;
  };
  snapshot_hash?: string | null;
  tanggal_dibekukan?: string | null;
  petunjuk_umum: string[];
  butir_soal: NaskahSoalButirDTO[];
}

export interface KunciJawabanItemDTO {
  nomor: number;
  bentuk_soal: string;
  kunci_jawaban: string;
  bobot: number;
  pembahasan?: string | null;
}

export interface KunciJawabanPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  identitas: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    guru_nama: string;
    tanggal_pelaksanaan: string;
  };
  snapshot_hash?: string | null;
  tanggal_dibekukan?: string | null;
  kunci_list: KunciJawabanItemDTO[];
  total_bobot: number;
}

export interface SiswaDaftarHadirDTO {
  nomor: number;
  siswa_id: string;
  nis?: string | null;
  nisn?: string | null;
  nama_lengkap: string;
  nomor_absen?: number | null;
}

export interface DaftarHadirPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  metadata_ujian: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    hari_tanggal: string;
    alokasi_waktu: string;
    ruang?: string | null;
    guru_pengampu: string;
  };
  snapshot_hash?: string | null;
  siswa_list: SiswaDaftarHadirDTO[];
}

export interface SiswaAbsenBeritaAcaraDTO {
  nomor: number;
  nis?: string | null;
  nama_lengkap: string;
  keterangan: string; // SAKIT | IZIN | ALPA
}

export interface BeritaAcaraPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  metadata_ujian: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    hari_tanggal: string;
    waktu_mulai_selesai: string;
    ruang?: string | null;
  };
  statistik: {
    jumlah_peserta_seharusnya: number;
    jumlah_hadir: number;
    jumlah_tidak_hadir: number;
  };
  siswa_tidak_hadir: SiswaAbsenBeritaAcaraDTO[];
  catatan_pelaksanaan?: string | null;
  pengawas_1: {
    nama: string;
    nip?: string | null;
  };
  pengawas_2?: {
    nama: string;
    nip?: string | null;
  } | null;
  snapshot_hash?: string | null;
}

/**
 * CBT-03.1 — Complete School Administration DTOs
 */

// 1. Analisis Butir Soal
export interface DistraktorItemDTO {
  opsi: string;
  jumlah_pemilih: number;
  persentase: number;
  status: "KUNCI" | "BERFUNGSI" | "TIDAK_EFEKTIF";
}

export interface ButirAnalisisSoalDTO {
  nomor: number;
  bentuk_soal: string;
  tingkat_kesukaran: number; // Indeks P (0.00 - 1.00)
  kategori_kesukaran: "SUKAR" | "SEDANG" | "MUDAH";
  daya_pembeda: number; // Indeks D (-1.00 - 1.00)
  kategori_daya_pembeda: "BAIK_SEKALI" | "BAIK" | "CUKUP" | "JELEK";
  efektivitas_distraktor?: DistraktorItemDTO[];
  daya_serap_persen: number;
  status_kualitas: "DITERIMA" | "DIREVISI" | "DITOLAK";
  rekomendasi_tindak_lanjut: string;
}

export interface DistribusiNilaiDTO {
  total_peserta: number;
  nilai_tertinggi: number;
  nilai_terendah: number;
  rata_rata: number;
  simpangan_baku: number;
  rentang_distribusi: Array<{ rentang: string; frekuensi: number }>;
}

export interface AnalisisButirSoalPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  identitas: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    guru_nama: string;
    tahun_ajaran: string;
    semester: string;
    kkm_kktp: number;
    total_butir_soal: number;
    total_peserta: number;
  };
  snapshot_hash?: string | null;
  tanggal_dibekukan?: string | null;
  butir_analisis: ButirAnalisisSoalDTO[];
  distribusi_nilai: DistribusiNilaiDTO;
  ringkasan: {
    butir_diterima: number;
    butir_direvisi: number;
    butir_ditolak: number;
    daya_serap_rata_rata: number;
  };
}

// 2. Rekap Nilai Asesmen
export interface PesertaNilaiDTO {
  nomor: number;
  siswa_id: string;
  nis: string;
  nisn?: string | null;
  nama_lengkap: string;
  nilai_angka: number | null;
  predikat: string;
  status_tuntas: "TUNTAS" | "BELUM_TUNTAS";
  status_tindak_lanjut: "PENGAYAAN" | "REMEDIAL" | "MENUNGGU_NILAI";
  catatan?: string | null;
}

export interface RekapNilaiAsesmenPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  identitas: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    guru_nama: string;
    tahun_ajaran: string;
    semester: string;
    kkm_kktp: number;
    tanggal_pelaksanaan: string;
  };
  snapshot_hash?: string | null;
  peserta_nilai: PesertaNilaiDTO[];
  statistik: {
    total_siswa: number;
    total_dinilai: number;
    jumlah_tuntas: number;
    persentase_tuntas: number;
    jumlah_remedial: number;
    rata_rata_kelas: number | null;
    nilai_tertinggi: number | null;
    nilai_terendah: number | null;
  };
}

// 3. Berkas Pengesahan Asesmen
export interface AspekVerifikasiDTO {
  no: number;
  aspek: string;
  kriteria: string;
  hasil_telaah: "MEMENUHI" | "PERLU_PERBAIKAN";
  catatan?: string | null;
}

export interface PihakPengesahDTO {
  nama: string;
  nip?: string | null;
  jabatan: string;
  tanggal?: string | null;
}

export interface BerkasPengesahanPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  identitas: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    tahun_ajaran: string;
    semester: string;
    nomor_dokumen: string;
    tanggal_pengesahan: string;
  };
  snapshot_hash?: string | null;
  aspek_verifikasi: AspekVerifikasiDTO[];
  catatan_supervisor?: string | null;
  rekomendasi: "LAYAK_DIGUNAKAN" | "DAPAT_DIGUNAKAN_DENGAN_REVISI" | "TIDAK_LAYAK";
  pihak_pengesah: {
    guru_penyusun: PihakPengesahDTO;
    penelaah_kurikulum: PihakPengesahDTO;
    kepala_sekolah: PihakPengesahDTO;
  };
}

// 4. Packet Version Cover Page
export interface DokumenLampiranPaketDTO {
  no: number;
  nama_dokumen: string;
  orientasi: "PORTRAIT" | "LANDSCAPE";
  status: "TERSEDIA" | "BELUM_TERSEDIA";
  keterangan?: string;
}

export interface CoverPaketAsesmenPayloadDTO {
  kop_sekolah: KopSekolahDTO;
  identitas: {
    judul_asesmen: string;
    mata_pelajaran: string;
    kelas_rombel: string;
    tahun_ajaran: string;
    semester: string;
    guru_pengampu: string;
    nip_guru?: string | null;
    tanggal_penyusunan: string;
  };
  snapshot_hash?: string | null;
  tanggal_dibekukan?: string | null;
  kode_segel: string;
  versi_paket: string;
  status_dokumen: "DRAFT" | "FINAL";
  total_lampiran: number;
  daftar_dokumen_lampiran: DokumenLampiranPaketDTO[];
}
