import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClassStudentDirectoryTabView } from "@/modules/student/presentation/class-student-directory-tab-view";
import { StudentAcademicDirectoryItemDTO } from "@/modules/student/domain/student-academic-directory-types";
import * as teacherNoteActions from "@/app/actions/teacher-note-actions";

vi.mock("@/app/actions/teacher-note-actions", () => ({
  createTeacherClassNoteAction: vi.fn(),
}));

describe("STAGE UX-04: Class Student Directory & Academic Health Monitoring (Part B)", () => {
  const mockStudents: StudentAcademicDirectoryItemDTO[] = [
    {
      siswa_id: "s-1",
      penempatan_rombel_id: "pr-1",
      nama_lengkap: "Abieza Praya",
      nis: "26004",
      nisn: "0012345671",
      nomor_absen: 1,
      jenis_kelamin: "L",
      foto_url: null,
      rombel_nama: "XII RPL",
      health_status: "AMAN",
      kehadiran_persen: 96,
      kehadiran_stats: {
        hadir: 24,
        sakit: 1,
        izin: 0,
        alpha: 0,
        total: 25,
      },
      tugas_selesai: 8,
      tugas_total: 10,
      tugas_persen: 80,
      tp_selesai: 6,
      tp_total: 8,
      tp_persen: 75,
      nilai_rata_rata: 88,
      tugas_detail: [
        {
          id: "t-1",
          judul: "Tugas TP1: Algoritma OOP",
          tp_kode: "TP-1",
          status: "DIKUMPULKAN",
          nilai: 90,
          tanggal_kumpul: "2026-10-01T08:00:00Z",
          catatan_guru: null,
        },
      ],
      presensi_detail: [
        {
          sesi_id: "sesi-1",
          tanggal: "2026-10-06T08:00:00Z",
          status: "HADIR",
          catatan: null,
        },
      ],
      nilai_detail: [
        {
          asesmen_id: "asm-1",
          judul: "Formatif BAB 1",
          kategori: "FORMATIF",
          nilai: 88,
          kkm: 75,
          tercapai: true,
        },
      ],
      tp_matrix: [
        {
          tp_id: "tp-1",
          kode: "TP-1",
          deskripsi: "Memahami konsep OOP dan enkapsulasi",
          tercapai: true,
          bukti: "Formatif BAB 1 (88)",
        },
      ],
      cbt_stats: {
        total_ujian: 2,
        diikuti: 2,
        rata_rata: 85,
      },
      catatan_list: [
        {
          id: "note-1",
          judul: "Peningkatan pemahaman materi",
          isi: "Siswa sangat antusias dan memahami konsep kelas.",
          kategori: "AKADEMIK",
          tingkat_urgensi: "RENDAH",
          penulis_id: "guru-1",
          penulis_nama: "Pak Guru",
          created_at: "2026-10-02T10:00:00Z",
        },
      ],
    },
    {
      siswa_id: "s-2",
      penempatan_rombel_id: "pr-2",
      nama_lengkap: "Budi Utomo",
      nis: "26005",
      nisn: "0012345672",
      nomor_absen: 2,
      jenis_kelamin: "L",
      foto_url: null,
      rombel_nama: "XII RPL",
      health_status: "PERLU_PERHATIAN",
      kehadiran_persen: 75,
      kehadiran_stats: {
        hadir: 15,
        sakit: 3,
        izin: 0,
        alpha: 2,
        total: 20,
      },
      tugas_selesai: 6,
      tugas_total: 10,
      tugas_persen: 60,
      tp_selesai: 4,
      tp_total: 8,
      tp_persen: 50,
      nilai_rata_rata: 72,
      tugas_detail: [],
      presensi_detail: [],
      nilai_detail: [],
      tp_matrix: [],
      cbt_stats: { total_ujian: 1, diikuti: 1, rata_rata: 70 },
      catatan_list: [],
    },
    {
      siswa_id: "s-3",
      penempatan_rombel_id: "pr-3",
      nama_lengkap: "Citra Dewi",
      nis: "26006",
      nisn: "0012345673",
      nomor_absen: 3,
      jenis_kelamin: "P",
      foto_url: null,
      rombel_nama: "XII RPL",
      health_status: "RISIKO_AKADEMIK",
      kehadiran_persen: 60,
      kehadiran_stats: {
        hadir: 12,
        sakit: 2,
        izin: 1,
        alpha: 5,
        total: 20,
      },
      tugas_selesai: 4,
      tugas_total: 10,
      tugas_persen: 40,
      tp_selesai: 2,
      tp_total: 8,
      tp_persen: 25,
      nilai_rata_rata: 55,
      tugas_detail: [],
      presensi_detail: [],
      nilai_detail: [],
      tp_matrix: [],
      cbt_stats: { total_ujian: 1, diikuti: 0, rata_rata: 0 },
      catatan_list: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Section 1: renders header with title, active student badge, and Tambah Siswa CTA", () => {
    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    expect(screen.getByRole("heading", { name: "Siswa" })).toBeInTheDocument();
    expect(screen.getByText("3 Siswa Aktif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tambah Siswa/i })).toBeInTheDocument();
  });

  it("Section 2: filters students by category pills (Semua, Laki-laki, Perempuan, Perlu Perhatian, Sering Alpha)", () => {
    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    // Initial: all 3 visible
    expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
    expect(screen.getByText("Budi Utomo")).toBeInTheDocument();
    expect(screen.getByText("Citra Dewi")).toBeInTheDocument();

    // Click Perempuan
    fireEvent.click(screen.getByRole("button", { name: /Perempuan/i }));
    expect(screen.queryByText("Abieza Praya")).not.toBeInTheDocument();
    expect(screen.queryByText("Budi Utomo")).not.toBeInTheDocument();
    expect(screen.getByText("Citra Dewi")).toBeInTheDocument();

    // Click Perlu Perhatian (Budi and Citra)
    fireEvent.click(screen.getByRole("button", { name: /Perlu Perhatian/i }));
    expect(screen.queryByText("Abieza Praya")).not.toBeInTheDocument();
    expect(screen.getByText("Budi Utomo")).toBeInTheDocument();
    expect(screen.getByText("Citra Dewi")).toBeInTheDocument();

    // Click Sering Alpha (Budi has 2 alpha, Citra has 5 alpha)
    fireEvent.click(screen.getByRole("button", { name: /Sering Alpha/i }));
    expect(screen.queryByText("Abieza Praya")).not.toBeInTheDocument();
    expect(screen.getByText("Budi Utomo")).toBeInTheDocument();
    expect(screen.getByText("Citra Dewi")).toBeInTheDocument();

    // Reset to Semua
    fireEvent.click(screen.getByRole("button", { name: /Semua/i }));
    expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
  });

  it("Section 3: search input filters student list by name and NISN", () => {
    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    const searchInput = screen.getByPlaceholderText("Cari siswa");

    // Search by NISN
    fireEvent.change(searchInput, { target: { value: "26004" } });
    expect(screen.getByText("Abieza Praya")).toBeInTheDocument();
    expect(screen.queryByText("Budi Utomo")).not.toBeInTheDocument();

    // Search by name
    fireEvent.change(searchInput, { target: { value: "Citra" } });
    expect(screen.queryByText("Abieza Praya")).not.toBeInTheDocument();
    expect(screen.getByText("Citra Dewi")).toBeInTheDocument();
  });

  it("Section 4: renders Academic Health Card with 4 indicators (Kehadiran, Tugas, TP, Nilai)", () => {
    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    // Abieza card indicators
    expect(screen.getByText("96%")).toBeInTheDocument();
    expect(screen.getByText("8 / 10")).toBeInTheDocument();
    expect(screen.getByText("6 / 8")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();

    // Health badges
    expect(screen.getByText("Aman")).toBeInTheDocument();
    expect(screen.getAllByText("Perlu Perhatian").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Risiko Akademik").length).toBeGreaterThanOrEqual(1);
  });

  it("Section 5: clicking card opens slide-over Right Side Sheet with 6 tabs", async () => {
    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    // Click on Abieza's card
    fireEvent.click(screen.getByText("Abieza Praya"));

    // Side Sheet appears
    await waitFor(() => {
      expect(screen.getByRole("complementary", { name: "Detail Siswa" })).toBeInTheDocument();
    });

    // Check 6 internal tabs exist
    expect(screen.getByRole("tab", { name: "Tab Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab Presensi" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab Tugas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab Nilai" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab TP" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab Catatan" })).toBeInTheDocument();
  });

  it("Section 6: clicking Catatan button opens Side Sheet directly on Catatan tab and saves new note", async () => {
    (teacherNoteActions.createTeacherClassNoteAction as any).mockResolvedValue({
      success: true,
      message: "Catatan internal berhasil disimpan.",
      data: {
        id: "note-new",
        judul: "Belum mengumpulkan TP3",
        isi: "Siswa perlu pendampingan remedial.",
        kategori: "AKADEMIK",
        tingkat_urgensi: "SEDANG",
        penulis_id: "guru-1",
        penulis_nama: "Pak Guru",
        created_at: new Date().toISOString(),
      },
    });

    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    // Find Catatan button specifically for Abieza
    const catatanBtn = screen.getByRole("button", { name: "Catatan Internal Abieza Praya" });
    fireEvent.click(catatanBtn);

    // Side Sheet opens on Catatan tab
    await waitFor(() => {
      expect(screen.getByText("Catatan Internal Guru")).toBeInTheDocument();
      expect(screen.getByText(/🔒 Rahasia • Tidak terlihat oleh siswa/i)).toBeInTheDocument();
    });

    // Existing note is visible
    expect(screen.getByText("Peningkatan pemahaman materi")).toBeInTheDocument();

    // Open add note form
    fireEvent.click(screen.getByRole("button", { name: /Catatan Baru/i }));

    // Fill form
    const judulInput = screen.getByPlaceholderText(/Judul catatan/i);
    const isiTextarea = screen.getByPlaceholderText(/Rincian catatan/i);

    fireEvent.change(judulInput, { target: { value: "Belum mengumpulkan TP3" } });
    fireEvent.change(isiTextarea, { target: { value: "Siswa perlu pendampingan remedial." } });

    // Submit note
    fireEvent.click(screen.getByRole("button", { name: /Simpan Catatan Internal/i }));

    await waitFor(() => {
      expect(teacherNoteActions.createTeacherClassNoteAction).toHaveBeenCalledWith(
        expect.objectContaining({
          penugasan_mengajar_id: "pen-1",
          rombel_id: "rom-1",
          siswa_id: "s-1",
          judul: "Belum mengumpulkan TP3",
          isi: "Siswa perlu pendampingan remedial.",
        })
      );
    });
  });

  it("Section 7: clicking Chat button opens Student Conversation Modal", async () => {
    render(
      <ClassStudentDirectoryTabView
        penugasanId="pen-1"
        rombelId="rom-1"
        rombelNama="XII RPL"
        mapelNama="Pemrograman Berbasis Objek"
        students={mockStudents}
        canManage={true}
      />
    );

    const chatBtn = screen.getByRole("button", { name: "Chat Abieza Praya" });
    fireEvent.click(chatBtn);

    await waitFor(() => {
      expect(screen.getByText(/Percakapan: Abieza Praya/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Siswa$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Orang Tua$/i })).toBeInTheDocument();
    });
  });
});
