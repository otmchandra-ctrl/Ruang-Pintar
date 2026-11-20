/**
 * Ruang Pintar — M07/M11 Student Academic Directory Domain Contracts
 *
 * STAGE UX-04: Student Academic Directory & Academic Health Monitoring
 */

export type StudentAcademicHealthStatus = "AMAN" | "PERLU_PERHATIAN" | "RISIKO_AKADEMIK";

export interface StudentTaskHistoryItem {
  id: string;
  judul: string;
  tp_kode?: string | null;
  status: "DIKUMPULKAN" | "TERLAMBAT" | "BELUM_KUMPUL";
  nilai?: number | null;
  tanggal_kumpul?: string | null;
  catatan_guru?: string | null;
}

export interface StudentAttendanceHistoryItem {
  sesi_id: string;
  tanggal: string;
  pertemuan_ke?: number;
  status: "HADIR" | "SAKIT" | "IZIN" | "ALPHA";
  catatan?: string | null;
}

export interface StudentGradeBreakdownItem {
  asesmen_id: string;
  judul: string;
  kategori: string;
  nilai: number | null;
  kkm: number;
  tercapai: boolean;
}

export interface StudentTpMatrixItem {
  tp_id: string;
  kode: string;
  deskripsi: string;
  tercapai: boolean;
  bukti?: string | null;
}

export interface StudentCbtStats {
  total_ujian: number;
  diikuti: number;
  rata_rata: number;
}

export interface StudentInternalNoteItem {
  id: string;
  judul: string;
  isi: string;
  kategori: string;
  tingkat_urgensi: string;
  penulis_id: string;
  penulis_nama: string;
  created_at: string;
}

export interface StudentAcademicDirectoryItemDTO {
  siswa_id: string;
  penempatan_rombel_id: string;
  nama_lengkap: string;
  nis: string | null;
  nisn: string | null;
  nomor_absen: number | null;
  jenis_kelamin: "L" | "P";
  foto_url: string | null;
  rombel_nama: string;
  health_status: StudentAcademicHealthStatus;
  kehadiran_persen: number;
  kehadiran_stats: {
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    total: number;
  };
  tugas_selesai: number;
  tugas_total: number;
  tugas_persen: number;
  tp_selesai: number;
  tp_total: number;
  tp_persen: number;
  nilai_rata_rata: number;
  tugas_detail: StudentTaskHistoryItem[];
  presensi_detail: StudentAttendanceHistoryItem[];
  nilai_detail: StudentGradeBreakdownItem[];
  tp_matrix: StudentTpMatrixItem[];
  cbt_stats: StudentCbtStats;
  catatan_list: StudentInternalNoteItem[];
}
