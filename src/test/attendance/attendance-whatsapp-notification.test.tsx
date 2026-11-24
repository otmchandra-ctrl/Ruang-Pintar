import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionAttendanceModal } from "@/modules/attendance/presentation/session-attendance-modal";
import * as attendanceActions from "@/app/actions/attendance-actions";

vi.mock("@/app/actions/attendance-actions", () => ({
  getSessionAttendanceAction: vi.fn(),
  saveSessionAttendanceAction: vi.fn(),
}));

describe("WhatsApp Attendance Notification (One-Click Rekap & Direct Wali)", () => {
  const mockSessionData = {
    sesi_id: "sesi-1",
    sekolah_id: "school-1",
    penugasan_mengajar_id: "penugasan-1",
    rombel_id: "rombel-1",
    rombel_nama: "X RPL 1",
    mata_pelajaran_id: "mapel-1",
    mata_pelajaran_nama: "Pemrograman Web",
    guru_id: "guru-1",
    guru_nama: "Fauzan S.Kom",
    tanggal: new Date("2026-10-20"),
    status_sesi: "BERLANGSUNG",
    total_siswa: 2,
    jumlah_hadir: 1,
    jumlah_izin: 0,
    jumlah_sakit: 1,
    jumlah_alpha: 0,
    jumlah_dispensasi: 0,
    jumlah_terlambat: 0,
    persentase_kehadiran: 50,
    sudah_diabsen: false,
    daftar_siswa: [
      {
        siswa_id: "siswa-1",
        nama_lengkap: "Ahmad Dahlan",
        nis: "1001",
        nisn: "0011223344",
        nomor_absen: 1,
        foto_url: null,
        telepon_wali: "08123456789",
        nama_wali: "Dahlan Senior",
        penempatan_rombel_id: "placement-1",
        presensi_id: null,
        status: "HADIR" as const,
        catatan: null,
        waktu_presensi: null,
      },
      {
        siswa_id: "siswa-2",
        nama_lengkap: "Budi Santoso",
        nis: "1002",
        nisn: "0011223355",
        nomor_absen: 2,
        foto_url: null,
        telepon_wali: "08987654321",
        nama_wali: "Santoso Senior",
        penempatan_rombel_id: "placement-2",
        presensi_id: null,
        status: "SAKIT" as const,
        catatan: "Demam tinggi",
        waktu_presensi: null,
      },
    ],
  };

  it("merender tombol Kirim Rekap WA dan memicu pembagian rekapitulasi ke WhatsApp", async () => {
    vi.mocked(attendanceActions.getSessionAttendanceAction).mockResolvedValue({
      success: true,
      message: "OK",
      data: mockSessionData as any,
    });

    const openSpy = vi.fn();
    window.open = openSpy;

    render(<SessionAttendanceModal sesiId="sesi-1" isOpen={true} onClose={vi.fn()} />);

    const rekapWaBtn = await screen.findByRole("button", { name: /Kirim Rekap WA/i });
    expect(rekapWaBtn).toBeInTheDocument();

    fireEvent.click(rekapWaBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const openedUrl = openSpy.mock.calls[0][0];
    expect(openedUrl).toContain("https://api.whatsapp.com/send?text=");
    expect(decodeURIComponent(openedUrl)).toContain("LAPORAN PRESENSI KELAS");
    expect(decodeURIComponent(openedUrl)).toContain("X RPL 1");
    expect(decodeURIComponent(openedUrl)).toContain("Pemrograman Web");
    expect(decodeURIComponent(openedUrl)).toContain("*Budi Santoso* — SAKIT (Demam tinggi)");
  });

  it("merender tombol WA Wali pada siswa yang sakit dan membuka chat langsung dengan nomor wali", async () => {
    vi.mocked(attendanceActions.getSessionAttendanceAction).mockResolvedValue({
      success: true,
      message: "OK",
      data: mockSessionData as any,
    });

    const openSpy = vi.fn();
    window.open = openSpy;

    render(<SessionAttendanceModal sesiId="sesi-1" isOpen={true} onClose={vi.fn()} />);

    const waWaliBtn = await screen.findByRole("button", { name: /Kirim WA ke Wali Budi Santoso/i });
    expect(waWaliBtn).toBeInTheDocument();

    fireEvent.click(waWaliBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const openedUrl = openSpy.mock.calls[0][0];
    // 08987654321 diformat menjadi 628987654321
    expect(openedUrl).toContain("https://wa.me/628987654321?text=");
    expect(decodeURIComponent(openedUrl)).toContain("Budi Santoso");
    expect(decodeURIComponent(openedUrl)).toContain("SAKIT");
  });
});
