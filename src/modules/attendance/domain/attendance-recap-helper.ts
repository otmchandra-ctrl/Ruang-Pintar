import {
  ClassAttendanceRecapDTO,
  ClassAttendanceSessionDateDTO,
  EvaluationAttendanceStatus,
  StudentClassAttendanceRecapItemDTO,
} from "./attendance-types";

export interface AttendanceMonthOption {
  key: string; // YYYY-MM
  label: string; // mis. "November 2026"
  sessionCount: number;
}

/**
 * Mengonversi status presensi lengkap menjadi kode 1 huruf standar.
 */
export function mapAttendanceStatusToCode(status?: string | null): string {
  const normalized = (status || "").toUpperCase();
  if (normalized === "HADIR") return "H";
  if (normalized === "SAKIT") return "S";
  if (normalized === "IZIN") return "I";
  if (normalized === "ALPHA" || normalized === "ALPA") return "A";
  if (normalized === "DISPENSASI") return "D";
  if (normalized === "TERLAMBAT") return "T";
  return "-";
}

/**
 * Memformat key bulan "YYYY-MM" menjadi label Bahasa Indonesia, mis. "November 2026".
 */
export function formatMonthKeyLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) return monthKey;

  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Mengambil daftar bulan unik yang tersedia dari sesi pertemuan (diurutkan terbaru dulu).
 */
export function extractAvailableMonths(
  sessions?: ClassAttendanceSessionDateDTO[]
): AttendanceMonthOption[] {
  if (!sessions || sessions.length === 0) return [];

  const counts = new Map<string, number>();
  for (const session of sessions) {
    counts.set(session.bulan_key, (counts.get(session.bulan_key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, sessionCount]) => ({
      key,
      label: formatMonthKeyLabel(key),
      sessionCount,
    }));
}

/**
 * Menghitung status evaluasi kehadiran siswa berdasarkan persentase dan jumlah alpha.
 */
export function computeEvaluationStatus(
  totalSesi: number,
  persentase: number,
  alpha: number
): EvaluationAttendanceStatus {
  if (totalSesi <= 0) return "Belum Ada Sesi";
  if (persentase < 75 || alpha >= 3) return "Perlu Perhatian";
  if (persentase < 85) return "Cukup";
  if (persentase < 95) return "Baik";
  return "Sangat Baik";
}

/**
 * Memfilter dan menghitung ulang rekapitulasi presensi kelas berdasarkan bulan ("YYYY-MM").
 * Jika monthKey kosong atau "ALL", mengembalikan seluruh periode.
 */
export function filterClassAttendanceRecapByMonth(
  recap: ClassAttendanceRecapDTO,
  monthKey?: string | null
): ClassAttendanceRecapDTO {
  const sessions = recap.sesi_pertemuan ?? [];
  if (!monthKey || monthKey === "ALL" || sessions.length === 0) {
    return {
      ...recap,
      periode_label: "Semua Periode",
    };
  }

  const filteredSessions = sessions.filter((s) => s.bulan_key === monthKey);
  const totalSesiTercatat = filteredSessions.length;

  let sumPercentages = 0;
  let jumlahPerluPerhatian = 0;

  const daftar_siswa: StudentClassAttendanceRecapItemDTO[] = recap.daftar_siswa.map((siswa) => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpha = 0;
    let dispensasi = 0;
    let terlambat = 0;

    for (const session of filteredSessions) {
      const code = mapAttendanceStatusToCode(session.status_per_siswa[siswa.siswa_id]);
      if (code === "H") hadir++;
      else if (code === "S") sakit++;
      else if (code === "I") izin++;
      else if (code === "A") alpha++;
      else if (code === "D") dispensasi++;
      else if (code === "T") terlambat++;
    }

    const effectivePresent = hadir + terlambat + dispensasi;
    const persentase =
      totalSesiTercatat > 0 ? Math.round((effectivePresent / totalSesiTercatat) * 100) : 0;

    if (totalSesiTercatat > 0) {
      sumPercentages += persentase;
    }

    const status_evaluasi = computeEvaluationStatus(totalSesiTercatat, persentase, alpha);
    if (status_evaluasi === "Perlu Perhatian") {
      jumlahPerluPerhatian++;
    }

    return {
      ...siswa,
      hadir,
      sakit,
      izin,
      alpha,
      dispensasi,
      terlambat,
      total_sesi_tercatat: totalSesiTercatat,
      persentase_kehadiran: persentase,
      status_evaluasi,
    };
  });

  const totalSiswa = daftar_siswa.length;
  const rerataKehadiranKelas =
    totalSesiTercatat > 0 && totalSiswa > 0 ? Math.round(sumPercentages / totalSiswa) : 0;

  return {
    ...recap,
    total_sesi_tercatat: totalSesiTercatat,
    rerata_kehadiran_kelas: rerataKehadiranKelas,
    jumlah_perlu_perhatian: jumlahPerluPerhatian,
    periode_label: formatMonthKeyLabel(monthKey),
    sesi_pertemuan: filteredSessions,
    daftar_siswa,
  };
}
