import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SessionAttendanceModal } from "@/modules/attendance/presentation/session-attendance-modal";
import * as attendanceActions from "@/app/actions/attendance-actions";

vi.mock("@/app/actions/attendance-actions", () => ({
  getSessionAttendanceAction: vi.fn(),
  saveSessionAttendanceAction: vi.fn(),
}));

describe("STAGE UX-04.1: Attendance Workflow Optimization", () => {
  const mockSessionData: any = {
    sesi_id: "sesi-pbo-101",
    sekolah_id: "sch-01",
    penugasan_mengajar_id: "pen-01",
    rombel_id: "rom-xii-rpl",
    rombel_nama: "XII RPL",
    mata_pelajaran_id: "mapel-pbo",
    mata_pelajaran_nama: "Pemrograman Berbasis Objek",
    guru_id: "guru-01",
    guru_nama: "Pak Guru",
    tanggal: new Date("2026-10-06T08:00:00Z"), // Selasa, 06 Oktober 2026
    status_sesi: "DIMULAI",
    total_siswa: 3,
    jumlah_hadir: 2,
    jumlah_izin: 0,
    jumlah_sakit: 1,
    jumlah_alpha: 0,
    jumlah_dispensasi: 0,
    jumlah_terlambat: 0,
    persentase_kehadiran: 67,
    sudah_diabsen: false,
    daftar_siswa: [
      {
        siswa_id: "s-1",
        nama_lengkap: "Abieza Praya",
        nis: "26004",
        nisn: "0012345671",
        nomor_absen: 1,
        foto_url: null,
        penempatan_rombel_id: "pr-1",
        presensi_id: "pres-1",
        status: "HADIR",
        catatan: null,
        waktu_presensi: null,
      },
      {
        siswa_id: "s-2",
        nama_lengkap: "Budi Utomo",
        nis: "26005",
        nisn: "0012345672",
        nomor_absen: 2,
        foto_url: null,
        penempatan_rombel_id: "pr-2",
        presensi_id: "pres-2",
        status: "SAKIT",
        catatan: "Demam",
        waktu_presensi: null,
      },
      {
        siswa_id: "s-3",
        nama_lengkap: "Citra Dewi",
        nis: "26006",
        nisn: "0012345673",
        nomor_absen: 3,
        foto_url: null,
        penempatan_rombel_id: "pr-3",
        presensi_id: null,
        status: "HADIR",
        catatan: null,
        waktu_presensi: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Header: renders Presensi Kelas, Mapel, Rombel • Tanggal, without clutter", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    render(<SessionAttendanceModal sesiId="sesi-pbo-101" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Presensi Kelas")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Pemrograman Berbasis Objek" })).toBeInTheDocument();
    expect(screen.getByText(/XII RPL/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tutup Modal/i })).toBeInTheDocument();

    // Pastikan UI tidak memuat chart, donut, progress ring, atau spreadsheet berat
    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.queryByText("67%")).not.toBeInTheDocument();
  });

  it("Step 1 & Step 5: Quick Attendance & Summary: renders [Toggle Semua Hadir] and handles toggle state rules", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    render(<SessionAttendanceModal sesiId="sesi-pbo-101" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
    });

    // Baris 1: Total Siswa
    expect(screen.getByText("3 Siswa")).toBeInTheDocument();

    // Baris 2: Toggle Semua Hadir (awalnya OFF karena Budi Utomo Sakit)
    const toggleSwitch = screen.getByRole("switch", { name: /Toggle Semua Hadir/i });
    expect(toggleSwitch).toBeInTheDocument();
    expect(toggleSwitch).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/Semua Hadir/i)).toBeInTheDocument();

    // Saat toggle diaktifkan -> seluruh siswa menjadi Hadir
    fireEvent.click(toggleSwitch);

    // Toggle otomatis ON
    expect(toggleSwitch).toHaveAttribute("aria-checked", "true");

    // Semua siswa kini berstatus Hadir di list view
    await waitFor(() => {
      const hadirBadges = screen.getAllByText("Hadir");
      expect(hadirBadges.length).toBeGreaterThanOrEqual(3);
    });

    // Buka editor Budi Utomo dan ubah ke Sakit -> toggle otomatis OFF
    const budiRow = screen.getByRole("button", { name: /Ubah presensi Budi Utomo/i });
    fireEvent.click(budiRow);

    await waitFor(() => {
      expect(screen.getByRole("radiogroup", { name: "Status Presensi" })).toBeInTheDocument();
    });

    const radioSakit = screen.getByRole("radio", { name: /Sakit/i });
    fireEvent.click(radioSakit);
    const simpanSheetBtn = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(simpanSheetBtn);

    // Verifikasi toggle otomatis menjadi OFF karena ada 1 siswa sakit
    await waitFor(() => {
      expect(toggleSwitch).toHaveAttribute("aria-checked", "false");
    });
  });

  it("Step 6: Search: renders sticky [ Cari Nama / NISN ] and filters students properly", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    render(<SessionAttendanceModal sesiId="sesi-pbo-101" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
      expect(screen.getByText("Budi Utomo")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cari Nama / NISN");
    expect(searchInput).toBeInTheDocument();

    // Cari berdasarkan NISN/NIS
    fireEvent.change(searchInput, { target: { value: "26004" } });

    await waitFor(() => {
      expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
      expect(screen.queryByText("Budi Utomo")).not.toBeInTheDocument();
    });

    // Reset pencarian
    fireEvent.change(searchInput, { target: { value: "" } });
    await waitFor(() => {
      expect(screen.getByText("Budi Utomo")).toBeInTheDocument();
    });
  });

  it("Step 2 & Step 8: Compact List View: renders compact student rows (56px-72px) without repeating segmented controls", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    render(<SessionAttendanceModal sesiId="sesi-pbo-101" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
    });

    // Siswa dirender sebagai compact row button
    const studentRow = screen.getByRole("button", { name: /Ubah presensi Abieza Praya/i });
    expect(studentRow).toBeInTheDocument();
    // Ketinggian compact row (h-[60px] = ~60px, dalam batas 56px - 72px)
    expect(studentRow.className).toContain("h-[60px]");

    // Kontrol segmented tidak diulang pada setiap baris di list view
    expect(screen.queryAllByRole("radio").length).toBe(0);
  });

  it("Step 3 & Step 4: Bottom Sheet Editor: opens when student card clicked, with Real Glass Radio Buttons", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    render(<SessionAttendanceModal sesiId="sesi-pbo-101" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
    });

    // Klik baris siswa untuk membuka Bottom Sheet
    const studentRow = screen.getByRole("button", { name: /Ubah presensi Abieza Praya/i });
    fireEvent.click(studentRow);

    // Bottom Sheet Editor terbuka
    await waitFor(() => {
      expect(screen.getByRole("radiogroup", { name: "Status Presensi" })).toBeInTheDocument();
    });

    // Tersedia 6 Real Glass Radio Buttons (Hadir, Sakit, Izin, Alpha, Dispensasi, Terlambat)
    const radioHadir = screen.getByRole("radio", { name: /Hadir/i });
    const radioSakit = screen.getByRole("radio", { name: /Sakit/i });
    const radioIzin = screen.getByRole("radio", { name: /Izin/i });
    const radioAlpha = screen.getByRole("radio", { name: /Alpha/i });
    const radioDispensasi = screen.getByRole("radio", { name: /Dispensasi/i });
    const radioTerlambat = screen.getByRole("radio", { name: /Terlambat/i });

    expect(radioHadir).toBeInTheDocument();
    expect(radioSakit).toBeInTheDocument();
    expect(radioIzin).toBeInTheDocument();
    expect(radioAlpha).toBeInTheDocument();
    expect(radioDispensasi).toBeInTheDocument();
    expect(radioTerlambat).toBeInTheDocument();

    // Verifikasi Apple Glass styling (backdrop-blur-xl, transition 150ms)
    expect(radioHadir.className).toContain("backdrop-blur-xl");
    expect(radioHadir.className).toContain("duration-150");
    expect(radioDispensasi.className).toContain("backdrop-blur-xl");
    expect(radioTerlambat.className).toContain("backdrop-blur-xl");

    // Ubah status ke Alpha
    fireEvent.click(radioAlpha);
    expect(radioAlpha.className).toContain("scale-[1.02]");

    // Isi Catatan
    const catatanInput = screen.getByPlaceholderText("Tulis alasan...");
    fireEvent.change(catatanInput, { target: { value: "Tanpa keterangan" } });

    // Simpan dari Bottom Sheet
    const simpanSheetBtn = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(simpanSheetBtn);

    // Bottom sheet tertutup
    await waitFor(() => {
      expect(screen.queryByRole("radiogroup", { name: "Status Presensi" })).not.toBeInTheDocument();
    });

    // Status Abieza di list view terupdate menjadi Alpha dan catatan tampil
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText(/Tanpa keterangan/i)).toBeInTheDocument();
  });

  it("Step 7: Sticky Footer: renders summary count, Tutup button, and prominent Simpan Presensi button", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    (attendanceActions.saveSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      message: "Presensi berhasil disimpan.",
    });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <SessionAttendanceModal
        sesiId="sesi-pbo-101"
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("3 siswa selesai")).toBeInTheDocument();
    });

    const tutupBtn = screen.getByRole("button", { name: "Tutup" });
    expect(tutupBtn).toBeInTheDocument();

    const simpanBtn = screen.getByRole("button", { name: /Simpan Presensi Kelas/i });
    expect(simpanBtn).toBeInTheDocument();
    expect(simpanBtn.className).toContain("hover:scale-[1.02]");
    expect(simpanBtn.className).toContain("active:scale-[0.98]");
    expect(simpanBtn.className).toContain("shadow-[0_4px_14px_rgba(37,99,235,0.10)]");

    fireEvent.click(simpanBtn);

    await waitFor(() => {
      expect(attendanceActions.saveSessionAttendanceAction).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalledWith("Presensi berhasil disimpan.");
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("Full 6-Status Support: allows setting DISPENSASI and TERLAMBAT and updates counter and save payload", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: mockSessionData,
    });

    (attendanceActions.saveSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      message: "Presensi berhasil disimpan.",
    });

    const handleSuccess = vi.fn();

    render(
      <SessionAttendanceModal
        sesiId="sesi-pbo-101"
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
    });

    // 1. Ubah Abieza Praya menjadi DISPENSASI
    const abiezaRow = screen.getByRole("button", { name: /Ubah presensi Abieza Praya/i });
    fireEvent.click(abiezaRow);

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: /Dispensasi/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("radio", { name: /Dispensasi/i }));
    fireEvent.change(screen.getByPlaceholderText("Tulis alasan..."), {
      target: { value: "Lomba OSN Tingkat Provinsi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => {
      expect(screen.getByText("Dispensasi")).toBeInTheDocument();
      expect(screen.getByText(/Lomba OSN Tingkat Provinsi/i)).toBeInTheDocument();
    });

    // 2. Ubah Citra Dewi menjadi TERLAMBAT
    const citraRow = screen.getByRole("button", { name: /Ubah presensi Citra Dewi/i });
    fireEvent.click(citraRow);

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: /Terlambat/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("radio", { name: /Terlambat/i }));
    fireEvent.change(screen.getByPlaceholderText("Tulis alasan..."), {
      target: { value: "Terlambat 15 menit karena ban bocor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => {
      expect(screen.getByText("Terlambat")).toBeInTheDocument();
      expect(screen.getByText(/Terlambat 15 menit karena ban bocor/i)).toBeInTheDocument();
    });

    // 3. Simpan dan verifikasi payload memuat DISPENSASI dan TERLAMBAT
    const simpanBtn = screen.getByRole("button", { name: /Simpan Presensi Kelas/i });
    fireEvent.click(simpanBtn);

    await waitFor(() => {
      expect(attendanceActions.saveSessionAttendanceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          sesi_kelas_id: "sesi-pbo-101",
          items: expect.arrayContaining([
            expect.objectContaining({
              siswa_id: "s-1",
              status: "DISPENSASI",
              catatan: "Lomba OSN Tingkat Provinsi",
            }),
            expect.objectContaining({
              siswa_id: "s-3",
              status: "TERLAMBAT",
              catatan: "Terlambat 15 menit karena ban bocor",
            }),
          ]),
        })
      );
    });
  });

  it("Jurnal KBM: allows inputting topik and catatan jurnal and submits with attendance", async () => {
    (attendanceActions.getSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      data: {
        ...mockSessionData,
        topik_pembelajaran: "Dasar Polymorphism",
        catatan: "Siswa aktif berdiskusi",
      },
    });

    (attendanceActions.saveSessionAttendanceAction as any).mockResolvedValue({
      success: true,
      message: "Presensi dan jurnal berhasil disimpan.",
    });

    render(<SessionAttendanceModal sesiId="sesi-pbo-101" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Jurnal Mengajar / KBM")).toBeInTheDocument();
    });

    // Check pre-populated values
    const topikInput = screen.getByPlaceholderText(
      /Pengenalan Algoritma Searching/i
    ) as HTMLInputElement;
    expect(topikInput.value).toBe("Dasar Polymorphism");

    const catatanInput = screen.getByPlaceholderText(
      /Catatan kegiatan, pemahaman siswa/i
    ) as HTMLTextAreaElement;
    expect(catatanInput.value).toBe("Siswa aktif berdiskusi");

    // Modify topic and notes
    fireEvent.change(topikInput, { target: { value: "Polymorphism & Abstraction OOP" } });
    fireEvent.change(catatanInput, {
      target: { value: "Seluruh praktikum lab terlaksana lancar" },
    });

    // Submit
    const simpanBtn = screen.getByRole("button", { name: /Simpan Presensi Kelas/i });
    fireEvent.click(simpanBtn);

    await waitFor(() => {
      expect(attendanceActions.saveSessionAttendanceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          sesi_kelas_id: "sesi-pbo-101",
          topik_pembelajaran: "Polymorphism & Abstraction OOP",
          catatan_jurnal: "Seluruh praktikum lab terlaksana lancar",
        })
      );
    });
  });
});
