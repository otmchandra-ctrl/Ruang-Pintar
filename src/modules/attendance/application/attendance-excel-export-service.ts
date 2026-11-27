/**
 * Ruang Pintar — M12 Attendance Excel Export Service
 * Menghasilkan file Excel (.xlsx) resmi untuk rekapitulasi presensi pembelajaran kelas.
 */

import ExcelJS from "exceljs";
import { attendanceService } from "./attendance-service";
import {
  filterClassAttendanceRecapByMonth,
  mapAttendanceStatusToCode,
} from "../domain/attendance-recap-helper";

export interface AttendanceExcelExportResult {
  filename: string;
  buffer: Buffer;
  base64: string;
}

function getExcelColumnLetter(colNumber: number): string {
  let temp = colNumber;
  let letter = "";
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
}

function getStatusCellStyle(code: string): { textArgb: string; fillArgb?: string; bold?: boolean } {
  switch (code) {
    case "H":
      return { textArgb: "FF15803D", fillArgb: "FFF0FDF4", bold: true };
    case "S":
      return { textArgb: "FFB45309", fillArgb: "FFFFFBEB", bold: true };
    case "I":
      return { textArgb: "FF0369A1", fillArgb: "FFF0F9FF", bold: true };
    case "A":
      return { textArgb: "FFBE123C", fillArgb: "FFFFF1F2", bold: true };
    case "D":
      return { textArgb: "FF7E22CE", fillArgb: "FFFAF5FF", bold: true };
    case "T":
      return { textArgb: "FFC2410C", fillArgb: "FFFFF7ED", bold: true };
    default:
      return { textArgb: "FF94A3B8" };
  }
}

export async function exportAttendanceRecapToExcel(
  penugasanId: string,
  sekolahId: string,
  monthKey?: string | null
): Promise<AttendanceExcelExportResult> {
  const rawRecap = await attendanceService.getClassAttendanceRecap(
    penugasanId,
    sekolahId,
    null,
    true
  );
  const recap = filterClassAttendanceRecapByMonth(rawRecap, monthKey);
  const sessionDates = recap.sesi_pertemuan ?? [];
  const sessionCount = sessionDates.length;
  const totalColumns = 14 + sessionCount;
  const lastColLetter = getExcelColumnLetter(totalColumns);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Ruang Pintar — School Digital Operating Platform";
  wb.created = new Date();
  wb.modified = new Date();

  const ws = wb.addWorksheet("Rekap Presensi");

  // Atur lebar kolom secara dinamis (5 kolom identitas + N kolom tanggal + 9 kolom ringkasan)
  ws.columns = [
    { width: 6 }, // A: NO
    { width: 12 }, // B: NO. ABSEN
    { width: 16 }, // C: NISN
    { width: 14 }, // D: NIS
    { width: 34 }, // E: NAMA PESERTA DIDIK
    ...sessionDates.map(() => ({ width: 8 })), // Kolom tanggal DD/MM
    { width: 11 }, // HADIR (H)
    { width: 11 }, // SAKIT (S)
    { width: 11 }, // IZIN (I)
    { width: 11 }, // ALPHA (A)
    { width: 14 }, // DISPENSASI (D)
    { width: 14 }, // TERLAMBAT (T)
    { width: 13 }, // TOTAL SESI
    { width: 16 }, // % KEHADIRAN
    { width: 20 }, // STATUS CAPAIAN
  ];

  // Header Title
  ws.mergeCells(`A2:${lastColLetter}2`);
  const titleCell = ws.getCell("A2");
  titleCell.value = "REKAPITULASI PRESENSI PEMBELAJARAN KELAS";
  titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF1E293B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(`A3:${lastColLetter}3`);
  const subTitleCell = ws.getCell("A3");
  subTitleCell.value = "RUANG PINTAR — ACADEMIC LEARNING PLATFORM";
  subTitleCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF64748B" } };
  subTitleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Metadata Block (Row 5 - 8)
  const metaStyleLabel = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF475569" } };
  const metaStyleVal = { name: "Segoe UI", size: 10, bold: false, color: { argb: "FF0F172A" } };

  ws.getCell("B5").value = "Kelas / Rombel:";
  ws.getCell("B5").font = metaStyleLabel;
  ws.getCell("C5").value = recap.rombel_nama;
  ws.getCell("C5").font = metaStyleVal;

  ws.getCell("B6").value = "Mata Pelajaran:";
  ws.getCell("B6").font = metaStyleLabel;
  ws.getCell("C6").value = `${recap.mata_pelajaran_nama} (${recap.mata_pelajaran_kode})`;
  ws.getCell("C6").font = metaStyleVal;

  ws.getCell("B7").value = "Guru Pengampu:";
  ws.getCell("B7").font = metaStyleLabel;
  ws.getCell("C7").value = recap.guru_nama || "-";
  ws.getCell("C7").font = metaStyleVal;

  ws.getCell("B8").value = "Periode Rekap:";
  ws.getCell("B8").font = metaStyleLabel;
  ws.getCell("C8").value = recap.periode_label || "Semua Periode";
  ws.getCell("C8").font = metaStyleVal;

  ws.getCell("G5").value = "Total Siswa:";
  ws.getCell("G5").font = metaStyleLabel;
  ws.getCell("H5").value = `${recap.total_siswa} Siswa`;
  ws.getCell("H5").font = metaStyleVal;

  ws.getCell("G6").value = "Sesi Diabsen:";
  ws.getCell("G6").font = metaStyleLabel;
  ws.getCell("H6").value =
    `${recap.total_sesi_tercatat} dari ${recap.total_sesi_terjadwal} Sesi Terjadwal`;
  ws.getCell("H6").font = metaStyleVal;

  ws.getCell("G7").value = "Rerata Kehadiran:";
  ws.getCell("G7").font = metaStyleLabel;
  ws.getCell("H7").value =
    recap.total_sesi_tercatat > 0 ? `${recap.rerata_kehadiran_kelas}%` : "Belum Ada Sesi";
  ws.getCell("H7").font = metaStyleVal;

  // Table Headers (Row 10)
  const headers = [
    "No",
    "No. Absen",
    "NISN",
    "NIS",
    "Nama Siswa",
    ...sessionDates.map((s) => s.label_tanggal),
    "Hadir (H)",
    "Sakit (S)",
    "Izin (I)",
    "Alpha (A)",
    "Dispensasi (D)",
    "Terlambat (T)",
    "Total Sesi",
    "% Kehadiran",
    "Status Capaian",
  ];

  const headerRow = ws.getRow(10);
  headerRow.height = 28;
  headers.forEach((h, i) => {
    const isDateCol = i >= 5 && i < 5 + sessionCount;
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isDateCol ? "FF1E40AF" : "FF2563EB" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1D4ED8" } },
      left: { style: "thin", color: { argb: "FF1D4ED8" } },
      bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
      right: { style: "thin", color: { argb: "FF1D4ED8" } },
    };
  });

  // Data rows
  let rowIdx = 11;
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };

  let totalH = 0;
  let totalS = 0;
  let totalI = 0;
  let totalA = 0;
  let totalD = 0;
  let totalT = 0;

  recap.daftar_siswa.forEach((s, idx) => {
    totalH += s.hadir;
    totalS += s.sakit;
    totalI += s.izin;
    totalA += s.alpha;
    totalD += s.dispensasi;
    totalT += s.terlambat;

    const row = ws.getRow(rowIdx);
    row.height = 20;

    const isEven = idx % 2 === 1;
    const bgArgb = isEven ? "FFF8FAFC" : "FFFFFFFF";
    const dateCodes = sessionDates.map((sd) =>
      mapAttendanceStatusToCode(sd.status_per_siswa[s.siswa_id])
    );

    const values = [
      idx + 1,
      s.nomor_absen ?? "-",
      s.nisn ?? "-",
      s.nis ?? "-",
      s.nama_lengkap,
      ...dateCodes,
      s.hadir,
      s.sakit,
      s.izin,
      s.alpha,
      s.dispensasi,
      s.terlambat,
      s.total_sesi_tercatat,
      s.total_sesi_tercatat > 0 ? `${s.persentase_kehadiran}%` : "-",
      s.total_sesi_tercatat > 0 ? s.status_evaluasi : "Belum Ada Sesi",
    ];

    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;

      const isDateCol = colIdx >= 5 && colIdx < 5 + sessionCount;
      if (isDateCol) {
        const style = getStatusCellStyle(String(val));
        cell.font = {
          name: "Segoe UI",
          size: 10,
          bold: Boolean(style.bold),
          color: { argb: style.textArgb },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: style.fillArgb ?? bgArgb },
        };
      } else {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgArgb },
        };
      }

      cell.border = borderThin;
      cell.alignment = {
        horizontal: colIdx === 4 ? "left" : "center",
        vertical: "middle",
      };
    });

    rowIdx++;
  });

  // Summary Row
  const summaryRow = ws.getRow(rowIdx);
  summaryRow.height = 24;
  ws.mergeCells(`A${rowIdx}:E${rowIdx}`);
  const summaryTitleCell = summaryRow.getCell(1);
  summaryTitleCell.value = `TOTAL AKUMULASI KELAS (${recap.daftar_siswa.length} Siswa)`;
  summaryTitleCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
  summaryTitleCell.alignment = { horizontal: "center", vertical: "middle" };

  const summaryStartCol = 6 + sessionCount;
  const summaryValues: Record<number, string | number> = {
    [summaryStartCol]: totalH,
    [summaryStartCol + 1]: totalS,
    [summaryStartCol + 2]: totalI,
    [summaryStartCol + 3]: totalA,
    [summaryStartCol + 4]: totalD,
    [summaryStartCol + 5]: totalT,
    [summaryStartCol + 6]: recap.total_sesi_tercatat,
    [summaryStartCol + 7]: recap.total_sesi_tercatat > 0 ? `${recap.rerata_kehadiran_kelas}%` : "-",
    [summaryStartCol + 8]:
      recap.total_sesi_tercatat > 0
        ? recap.rerata_kehadiran_kelas >= 85
          ? "Baik / Sangat Baik"
          : "Perlu Perhatian"
        : "Belum Ada Sesi",
  };

  for (let c = 1; c <= totalColumns; c++) {
    const cell = summaryRow.getCell(c);
    if (c >= summaryStartCol && summaryValues[c] !== undefined) {
      cell.value = summaryValues[c];
    }
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF94A3B8" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }

  // Legenda kode status jika terdapat kolom tanggal pertemuan
  if (sessionCount > 0) {
    const legendRow = ws.getRow(rowIdx + 2);
    legendRow.getCell(1).value =
      "Keterangan Kode: H = Hadir | S = Sakit | I = Izin | A = Alpha | D = Dispensasi | T = Terlambat | - = Belum Diabsen";
    legendRow.getCell(1).font = {
      name: "Segoe UI",
      size: 9,
      italic: true,
      color: { argb: "FF64748B" },
    };
  }

  const rawBuffer = await wb.xlsx.writeBuffer();
  const buffer = Buffer.from(rawBuffer);
  const base64 = buffer.toString("base64");
  const sanitizedRombel = recap.rombel_nama.replace(/\s+/g, "_");
  const monthSuffix = monthKey && monthKey !== "ALL" ? `_${monthKey}` : "";
  const filename = `Rekap_Presensi_${sanitizedRombel}_${recap.mata_pelajaran_kode}${monthSuffix}_${Date.now()}.xlsx`;

  return { filename, buffer, base64 };
}
