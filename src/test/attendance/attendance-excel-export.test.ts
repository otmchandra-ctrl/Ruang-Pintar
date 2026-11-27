import { describe, it, expect, vi, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { exportAttendanceRecapToExcel } from "@/modules/attendance/application/attendance-excel-export-service";
import { attendanceService } from "@/modules/attendance/application/attendance-service";
import { ClassAttendanceRecapDTO } from "@/modules/attendance/domain/attendance-types";

describe("M12 Attendance Excel Export Service", () => {
  const mockRecap: ClassAttendanceRecapDTO = {
    penugasan_id: "pen-101",
    rombel_id: "rom-x-dkv-1",
    rombel_nama: "X DKV 1",
    tingkat_nama: "Kelas 10",
    mata_pelajaran_id: "mapel-kka",
    mata_pelajaran_nama: "Koding dan Kecerdasan Artifisial",
    mata_pelajaran_kode: "KKA",
    guru_id: "guru-eri",
    guru_nama: "Eri Chandra A",
    total_sesi_terjadwal: 7,
    total_sesi_tercatat: 2,
    total_siswa: 2,
    rerata_kehadiran_kelas: 100,
    jumlah_perlu_perhatian: 0,
    daftar_siswa: [
      {
        siswa_id: "s-1",
        nomor_absen: 1,
        nis: "260801",
        nisn: "0012345671",
        nama_lengkap: "Ailsa Citra Kirana",
        foto_url: null,
        hadir: 2,
        sakit: 0,
        izin: 0,
        alpha: 0,
        dispensasi: 0,
        terlambat: 0,
        total_sesi_tercatat: 2,
        persentase_kehadiran: 100,
        status_evaluasi: "Sangat Baik",
      },
      {
        siswa_id: "s-2",
        nomor_absen: 2,
        nis: "260802",
        nisn: "0012345672",
        nama_lengkap: "Alya Ervina Rasty",
        foto_url: null,
        hadir: 1,
        sakit: 1,
        izin: 0,
        alpha: 0,
        dispensasi: 0,
        terlambat: 0,
        total_sesi_tercatat: 2,
        persentase_kehadiran: 50,
        status_evaluasi: "Perlu Perhatian",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a valid .xlsx file with proper metadata, columns, and data rows", async () => {
    vi.spyOn(attendanceService, "getClassAttendanceRecap").mockResolvedValue(mockRecap);

    const result = await exportAttendanceRecapToExcel("pen-101", "sch-01");

    expect(result.filename).toMatch(/Rekap_Presensi_X_DKV_1_KKA_\d+\.xlsx/);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.base64).toBeTruthy();

    // Parse the generated buffer with ExcelJS to verify sheet structure
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(result.buffer as any);

    const ws = wb.getWorksheet("Rekap Presensi");
    expect(ws).toBeDefined();

    // Check title
    expect(ws?.getCell("A2").value).toBe("REKAPITULASI PRESENSI PEMBELAJARAN KELAS");

    // Check table headers at row 10
    expect(ws?.getCell("A10").value).toBe("No");
    expect(ws?.getCell("B10").value).toBe("No. Absen");
    expect(ws?.getCell("C10").value).toBe("NISN");
    expect(ws?.getCell("D10").value).toBe("NIS");
    expect(ws?.getCell("E10").value).toBe("Nama Siswa");
    expect(ws?.getCell("F10").value).toBe("Hadir (H)");
    expect(ws?.getCell("G10").value).toBe("Sakit (S)");
    expect(ws?.getCell("H10").value).toBe("Izin (I)");
    expect(ws?.getCell("I10").value).toBe("Alpha (A)");
    expect(ws?.getCell("J10").value).toBe("Dispensasi (D)");
    expect(ws?.getCell("K10").value).toBe("Terlambat (T)");
    expect(ws?.getCell("L10").value).toBe("Total Sesi");
    expect(ws?.getCell("M10").value).toBe("% Kehadiran");
    expect(ws?.getCell("N10").value).toBe("Status Capaian");

    // Check student 1 (row 11)
    expect(ws?.getCell("A11").value).toBe(1);
    expect(ws?.getCell("E11").value).toBe("Ailsa Citra Kirana");
    expect(ws?.getCell("F11").value).toBe(2); // Hadir
    expect(ws?.getCell("M11").value).toBe("100%");
    expect(ws?.getCell("N11").value).toBe("Sangat Baik");

    // Check student 2 (row 12)
    expect(ws?.getCell("A12").value).toBe(2);
    expect(ws?.getCell("E12").value).toBe("Alya Ervina Rasty");
    expect(ws?.getCell("F12").value).toBe(1); // Hadir
    expect(ws?.getCell("G12").value).toBe(1); // Sakit
    expect(ws?.getCell("M12").value).toBe("50%");
    expect(ws?.getCell("N12").value).toBe("Perlu Perhatian");

    // Check summary row (row 13)
    expect(ws?.getCell("A13").value).toBe("TOTAL AKUMULASI KELAS (2 Siswa)");
    expect(ws?.getCell("F13").value).toBe(3); // Total Hadir (2 + 1)
    expect(ws?.getCell("G13").value).toBe(1); // Total Sakit (0 + 1)
  });

  it("filters sessions by monthKey and inserts per-date attendance columns (DD/MM)", async () => {
    const recapWithDates: ClassAttendanceRecapDTO = {
      ...mockRecap,
      total_sesi_terjadwal: 3,
      total_sesi_tercatat: 3,
      sesi_pertemuan: [
        {
          sesi_id: "sesi-okt-1",
          tanggal_iso: "2026-10-29",
          label_tanggal: "29/10",
          bulan_key: "2026-10",
          status_per_siswa: { "s-1": "HADIR", "s-2": "HADIR" },
        },
        {
          sesi_id: "sesi-nov-1",
          tanggal_iso: "2026-11-19",
          label_tanggal: "19/11",
          bulan_key: "2026-11",
          status_per_siswa: { "s-1": "HADIR", "s-2": "SAKIT" },
        },
        {
          sesi_id: "sesi-nov-2",
          tanggal_iso: "2026-11-26",
          label_tanggal: "26/11",
          bulan_key: "2026-11",
          status_per_siswa: { "s-1": "HADIR", "s-2": "ALPHA" },
        },
      ],
    };

    vi.spyOn(attendanceService, "getClassAttendanceRecap").mockResolvedValue(recapWithDates);

    const result = await exportAttendanceRecapToExcel("pen-101", "sch-01", "2026-11");
    expect(result.filename).toMatch(/Rekap_Presensi_X_DKV_1_KKA_2026-11_\d+\.xlsx/);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(result.buffer as any);
    const ws = wb.getWorksheet("Rekap Presensi");
    expect(ws).toBeDefined();

    // Periode Rekap metadata
    expect(ws?.getCell("B8").value).toBe("Periode Rekap:");
    expect(ws?.getCell("C8").value).toBe("November 2026");

    // 2 date columns inserted after Nama Siswa (E): F = 19/11, G = 26/11
    expect(ws?.getCell("F10").value).toBe("19/11");
    expect(ws?.getCell("G10").value).toBe("26/11");
    expect(ws?.getCell("H10").value).toBe("Hadir (H)");
    expect(ws?.getCell("K10").value).toBe("Alpha (A)");

    // Student 1: H, H -> Hadir = 2, 100%
    expect(ws?.getCell("F11").value).toBe("H");
    expect(ws?.getCell("G11").value).toBe("H");
    expect(ws?.getCell("H11").value).toBe(2);
    expect(ws?.getCell("O11").value).toBe("100%");

    // Student 2: S, A -> Hadir = 0, Sakit = 1, Alpha = 1, 0%
    expect(ws?.getCell("F12").value).toBe("S");
    expect(ws?.getCell("G12").value).toBe("A");
    expect(ws?.getCell("H12").value).toBe(0);
    expect(ws?.getCell("I12").value).toBe(1);
    expect(ws?.getCell("K12").value).toBe(1);
    expect(ws?.getCell("O12").value).toBe("0%");
  });
});
