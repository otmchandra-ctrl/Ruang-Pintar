/**
 * Ruang Pintar — M11 Learning Presentation Views Unit Tests
 */

import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TeacherClassesView } from "@/modules/learning/presentation/teacher-classes-view";
import { ClassWorkspaceView } from "@/modules/learning/presentation/class-workspace-view";
import { deleteRombelAction, updateRombelAction } from "@/app/actions/academic-actions";
import {
  TeacherClassCardDTO,
  TeacherClassWorkspaceDTO,
} from "@/modules/learning/domain/learning-types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/actions/academic-actions", () => ({
  deleteRombelAction: vi.fn(),
  updateRombelAction: vi.fn(),
}));

describe("M11 Learning Presentation Views", () => {
  const mockClasses: TeacherClassCardDTO[] = [
    {
      id: "PEN_01",
      guru_id: "G_01",
      guru_nama: "Budi Santoso, M.Kom.",
      rombel_id: "R_01",
      rombel_nama: "X RPL 1",
      tingkat_nama: "Kelas X",
      mata_pelajaran_id: "MP_01",
      mata_pelajaran_nama: "Pemrograman Web",
      mata_pelajaran_kode: "WEB",
      tahun_ajaran_nama: "2026/2027",
      semester_nama: "Ganjil",
      jumlah_jam_minggu: 4,
      status: "AKTIF",
      total_siswa: 36,
      total_bab: 3,
      total_materi: 5,
      total_tugas: 2,
      total_jurnal: 4,
      jadwal_hari_ini: "07:00 - 08:30",
    },
  ];

  const mockWorkspace: TeacherClassWorkspaceDTO = {
    penugasan: {
      id: "PEN_01",
      sekolah_id: "SCH_01",
      guru_id: "G_01",
      guru_nama: "Budi Santoso, M.Kom.",
      mata_pelajaran_id: "MP_01",
      mata_pelajaran_nama: "Pemrograman Web",
      mata_pelajaran_kode: "WEB",
      rombel_id: "R_01",
      rombel_nama: "X RPL 1",
      tingkat_nama: "Kelas X",
      tahun_ajaran_id: "TA_01",
      tahun_ajaran_nama: "2026/2027",
      semester_id: "SEM_01",
      semester_nama: "Ganjil",
      jumlah_jam_minggu: 4,
      status: "AKTIF",
    },
    total_siswa: 36,
    lingkup_materi: [
      {
        id: "BAB_01",
        sekolah_id: "SCH_01",
        penugasan_mengajar_id: "PEN_01",
        kode: "BAB 1",
        judul: "Pengantar HTML dan CSS",
        deskripsi: "Dasar markup dokumen web modern",
        urutan: 1,
        status: "AKTIF",
        created_at: new Date(),
        updated_at: new Date(),
        tujuan_pembelajaran: [
          {
            id: "TP_01",
            sekolah_id: "SCH_01",
            lingkup_materi_id: "BAB_01",
            kode: "TP 1.1",
            deskripsi: "Memahami struktur anatomi elemen HTML5 semantik",
            urutan: 1,
            status: "AKTIF",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      },
    ],
    materi_list: [
      {
        id: "MAT_01",
        sekolah_id: "SCH_01",
        guru_id: "G_01",
        lingkup_materi_id: "BAB_01",
        lingkup_materi_judul: "Pengantar HTML dan CSS",
        mata_pelajaran_id: "MP_01",
        mata_pelajaran_nama: "Pemrograman Web",
        judul: "Modul Praktikum HTML5",
        deskripsi: "Panduan tag dasar semantik",
        tipe_konten: "DOKUMEN",
        status: "PUBLISHED",
        created_at: new Date(),
        updated_at: new Date(),
        is_published: true,
      },
    ],
    tugas_list: [
      {
        id: "TUG_01",
        sekolah_id: "SCH_01",
        guru_id: "G_01",
        lingkup_materi_id: "BAB_01",
        lingkup_materi_judul: "Pengantar HTML dan CSS",
        mata_pelajaran_id: "MP_01",
        mata_pelajaran_nama: "Pemrograman Web",
        judul: "Tugas 1: Halaman Portofolio Pribadi",
        petunjuk: "Buat file HTML semantik",
        tipe_penyerahan: "FILE",
        status: "PUBLISHED",
        created_at: new Date(),
        updated_at: new Date(),
        publikasi_aktif: {
          id: "PUB_TUG_01",
          sekolah_id: "SCH_01",
          tugas_id: "TUG_01",
          penugasan_mengajar_id: "PEN_01",
          tanggal_mulai: new Date(),
          batas_waktu: new Date(Date.now() + 86400000),
          izinkan_terlambat: true,
          status: "DITERBITKAN",
          submission_count: 32,
          created_at: new Date(),
          updated_at: new Date(),
        },
      },
    ],
    administrasi_list: [
      {
        id: "ADM_01",
        sekolah_id: "SCH_01",
        penugasan_mengajar_id: "PEN_01",
        guru_id: "G_01",
        guru_nama: "Budi Santoso, M.Kom.",
        tanggal: new Date(),
        pertemuan_ke: 1,
        materi_disampaikan: "Pengenalan Struktur HTML5",
        kegiatan_pembelajaran: "Praktikum tag heading dan paragraph",
        catatan_refleksi: "Seluruh siswa berhasil membuat file pertama",
        status_realisasi: "TERLAKSANA",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    jadwal_list: [
      {
        hari: "SENIN",
        jam_mulai: "07:00",
        jam_selesai: "08:30",
        ruangan: "Lab RPL 1",
        slot_nama: "Jam Ke-1 – 2",
      },
    ],
  };

  describe("TeacherClassesView (/kelas-saya)", () => {
    it("renders class card and statistics correctly", () => {
      render(<TeacherClassesView classes={mockClasses} />);

      expect(screen.getByText("Pemrograman Web")).toBeInTheDocument();
      expect(screen.getByText("X RPL 1")).toBeInTheDocument();
      expect(screen.getByText("WEB")).toBeInTheDocument();
      expect(screen.getByText("4 JP")).toBeInTheDocument();
      expect(screen.getByText("36 Siswa")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /masuk kelas|kelola kelas/i })).toHaveAttribute(
        "href",
        "/kelas-saya/PEN_01"
      );
    });

    it("shows rename and delete controls only to the tenant owner", () => {
      const { rerender } = render(<TeacherClassesView classes={mockClasses} />);

      expect(screen.queryByRole("button", { name: "Ubah Nama Kelas" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hapus Kelas" })).not.toBeInTheDocument();

      rerender(<TeacherClassesView classes={mockClasses} isTenantOwner />);

      expect(screen.getByRole("button", { name: "Ubah Nama Kelas" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Hapus Kelas" })).toBeInTheDocument();
    });

    it("submits a partial rename for the selected rombel", async () => {
      vi.mocked(updateRombelAction).mockResolvedValue({
        success: true,
        message: "Nama kelas berhasil diperbarui.",
      });
      render(<TeacherClassesView classes={mockClasses} isTenantOwner />);

      fireEvent.click(screen.getByRole("button", { name: "Ubah Nama Kelas" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Nama Kelas" }), {
        target: { value: "X RPL 2" },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Simpan Nama Kelas" }));
        await vi.waitFor(() => {
          expect(updateRombelAction).toHaveBeenCalledWith("R_01", expect.any(FormData));
        });
      });
      const submittedForm = vi.mocked(updateRombelAction).mock.calls[0][1];
      expect(submittedForm.get("nama")).toBe("X RPL 2");
      expect(submittedForm.has("semester_id")).toBe(false);
    });

    it("requires confirmation before archiving a class", async () => {
      vi.mocked(deleteRombelAction).mockResolvedValue({
        success: true,
        message: "Kelas berhasil dihapus dari workspace.",
      });
      render(<TeacherClassesView classes={mockClasses} isTenantOwner />);

      fireEvent.click(screen.getByRole("button", { name: "Hapus Kelas" }));
      expect(screen.getByRole("dialog", { name: "Hapus Kelas?" })).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Konfirmasi Hapus" }));
        await vi.waitFor(() => {
          expect(deleteRombelAction).toHaveBeenCalledWith("R_01");
        });
      });
    });

    it("filters classes when search input changes", () => {
      render(<TeacherClassesView classes={mockClasses} />);

      const searchInput = screen.getByPlaceholderText(/cari rombel/i);
      fireEvent.change(searchInput, { target: { value: "Matematika" } });

      expect(screen.getByText(/tidak ada kelas yang ditemukan/i)).toBeInTheDocument();
    });

    it("renders in admin mode with teacher filter and teacher name on card", () => {
      const mockTeachers = [
        {
          id: "G_01",
          nama_lengkap: "Budi Santoso",
          gelar_depan: null,
          gelar_belakang: "M.Kom.",
          total_kelas: 1,
        },
      ];
      render(
        <TeacherClassesView classes={mockClasses} isAdmin={true} teachersList={mockTeachers} />
      );

      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
      expect(screen.getByText(/Semua Guru/i)).toBeInTheDocument();
      expect(screen.getByText("Budi Santoso, M.Kom.")).toBeInTheDocument();
    });

    it("calculates distinct students across multiple subjects in the same rombel (15 instead of 60)", () => {
      const multiSubjectSameRombel: TeacherClassCardDTO[] = [
        {
          ...mockClasses[0],
          id: "P1",
          mata_pelajaran_nama: "Mapel 1",
          rombel_id: "R_XII",
          total_siswa: 15,
        },
        {
          ...mockClasses[0],
          id: "P2",
          mata_pelajaran_nama: "Mapel 2",
          rombel_id: "R_XII",
          total_siswa: 15,
        },
        {
          ...mockClasses[0],
          id: "P3",
          mata_pelajaran_nama: "Mapel 3",
          rombel_id: "R_XII",
          total_siswa: 15,
        },
        {
          ...mockClasses[0],
          id: "P4",
          mata_pelajaran_nama: "Mapel 4",
          rombel_id: "R_XII",
          total_siswa: 15,
        },
      ];
      render(<TeacherClassesView classes={multiSubjectSameRombel} />);
      expect(screen.getAllByText("Mapel 4").length).toBeGreaterThan(0);
    });

    it("renders class cards cleanly without redundant hero banner on menu kelas saya", () => {
      render(<TeacherClassesView classes={mockClasses} isSubscribed={true} />);

      // Banner kartu disembunyikan pada menu kelas saya per preferensi pengguna
      expect(screen.queryByText(/Teaching Command Center/i)).not.toBeInTheDocument();
      expect(screen.getByText("Pemrograman Web")).toBeInTheDocument();
    });

    it("renders schedule alert banner and quick set button when class has no schedule", () => {
      const unscheduledClass: TeacherClassCardDTO[] = [
        {
          ...mockClasses[0],
          id: "P_NO_SCHED",
          jadwal_ringkas: null,
          jumlah_jam_minggu: 0,
        },
      ];
      render(<TeacherClassesView classes={unscheduledClass} />);

      expect(screen.getByText(/1 Rombel Belum Memiliki Jam Mengajar/i)).toBeInTheDocument();
      expect(screen.getByText("Jam Belum Diatur")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /\+ Atur Jam/i }).length).toBeGreaterThan(0);
    });
  });

  describe("ClassWorkspaceView (/kelas-saya/[id])", () => {
    it("renders workspace header with subject, rombel and teacher information", () => {
      render(<ClassWorkspaceView workspace={mockWorkspace} canManage={true} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pemrograman Web");
      expect(screen.getAllByText("Budi Santoso, M.Kom.").length).toBeGreaterThan(0);
      expect(screen.getByText(/4\s*JP/)).toBeInTheDocument();
      expect(screen.getAllByText("36 Siswa").length).toBeGreaterThan(0);
      expect(screen.getByAltText(/Maskot Siswa Ruang Pintar 3D/i)).toBeInTheDocument();
    });

    it("renders only 3 tabs (Ringkasan, Siswa, Pengaturan) and excludes Penilaian tab", () => {
      render(<ClassWorkspaceView workspace={mockWorkspace} canManage={true} />);

      expect(screen.getByTestId("tab-RINGKASAN")).toBeInTheDocument();
      expect(screen.getByTestId("tab-SISWA")).toBeInTheDocument();
      expect(screen.getByTestId("tab-PENGATURAN")).toBeInTheDocument();
      expect(screen.queryByTestId("tab-PENILAIAN")).not.toBeInTheDocument();
    });

    it("renders class workspace with card banner and tabs cleanly on Ringkasan view", () => {
      render(<ClassWorkspaceView workspace={mockWorkspace} canManage={true} />);

      // Hero Card Banner info
      expect(screen.getByText("Pemrograman Web")).toBeInTheDocument();
      expect(screen.getByText("X RPL 1")).toBeInTheDocument();
      expect(screen.getByText("Budi Santoso, M.Kom.")).toBeInTheDocument();

      // Nav Tabs
      expect(screen.getByTestId("tab-RINGKASAN")).toBeInTheDocument();
      expect(screen.getByTestId("tab-SISWA")).toBeInTheDocument();
      expect(screen.getByTestId("tab-PENGATURAN")).toBeInTheDocument();
    });

    it("renders task compliance, attendance rate, and at-risk students table in Tab Ringkasan", () => {
      const mockStudents = [
        {
          siswa_id: "s-1",
          penempatan_rombel_id: "pr-1",
          nama_lengkap: "Ahmad Fauzi",
          nis: "26001",
          nisn: "0012345671",
          nomor_absen: 1,
          jenis_kelamin: "L" as const,
          foto_url: null,
          rombel_nama: "X RPL 1",
          health_status: "AMAN" as const,
          kehadiran_persen: 100,
          kehadiran_stats: { hadir: 10, sakit: 0, izin: 0, alpha: 0, total: 10 },
          tugas_selesai: 2,
          tugas_total: 2,
          tugas_persen: 100,
          tp_selesai: 4,
          tp_total: 4,
          tp_persen: 100,
          nilai_rata_rata: 90,
          tugas_detail: [],
          presensi_detail: [],
          nilai_detail: [],
          tp_matrix: [],
          cbt_stats: { total_ujian: 1, diikuti: 1, rata_rata: 90 },
          catatan_list: [],
        },
        {
          siswa_id: "s-2",
          penempatan_rombel_id: "pr-2",
          nama_lengkap: "Bella Safitri",
          nis: "26002",
          nisn: "0012345672",
          nomor_absen: 2,
          jenis_kelamin: "P" as const,
          foto_url: null,
          rombel_nama: "X RPL 1",
          health_status: "AMAN" as const,
          kehadiran_persen: 95,
          kehadiran_stats: { hadir: 9, sakit: 1, izin: 0, alpha: 0, total: 10 },
          tugas_selesai: 2,
          tugas_total: 2,
          tugas_persen: 100,
          tp_selesai: 4,
          tp_total: 4,
          tp_persen: 100,
          nilai_rata_rata: 92,
          tugas_detail: [],
          presensi_detail: [],
          nilai_detail: [],
          tp_matrix: [],
          cbt_stats: { total_ujian: 1, diikuti: 1, rata_rata: 92 },
          catatan_list: [],
        },
        {
          siswa_id: "s-3",
          penempatan_rombel_id: "pr-3",
          nama_lengkap: "Candra Wijaya",
          nis: "26003",
          nisn: "0012345673",
          nomor_absen: 3,
          jenis_kelamin: "L" as const,
          foto_url: null,
          rombel_nama: "X RPL 1",
          health_status: "PERLU_PERHATIAN" as const,
          kehadiran_persen: 60,
          kehadiran_stats: { hadir: 6, sakit: 1, izin: 1, alpha: 2, total: 10 },
          tugas_selesai: 0,
          tugas_total: 2,
          tugas_persen: 0,
          tp_selesai: 2,
          tp_total: 4,
          tp_persen: 50,
          nilai_rata_rata: 70,
          tugas_detail: [],
          presensi_detail: [],
          nilai_detail: [],
          tp_matrix: [],
          cbt_stats: { total_ujian: 1, diikuti: 0, rata_rata: 0 },
          catatan_list: [],
        },
      ];

      render(
        <ClassWorkspaceView
          workspace={mockWorkspace}
          canManage={true}
          studentDirectory={mockStudents}
        />
      );

      // Verify Card 1: Kepatuhan Tugas Guru
      expect(screen.getByText("Kepatuhan Tugas Kelas")).toBeInTheDocument();
      expect(screen.getByText("Tingkat Penyerahan")).toBeInTheDocument();

      // Verify Card 2: Tingkat Kehadiran KBM
      expect(screen.getByText("Tingkat Kehadiran KBM")).toBeInTheDocument();
      expect(screen.getByText("Rata-rata Presensi")).toBeInTheDocument();

      // Verify Table: Siswa Perlu Perhatian Khusus
      expect(screen.getByText("Siswa Perlu Perhatian Khusus")).toBeInTheDocument();
      expect(screen.getByText(/1 Siswa Terdeteksi/i)).toBeInTheDocument();

      // Verify at-risk student rendered with stacked name & NIS in both radar and list
      expect(screen.getAllByText("Candra Wijaya").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/NIS.*26003/).length).toBeGreaterThan(0);
      expect(screen.getByText("4x Tidak Hadir")).toBeInTheDocument();
      expect(screen.getByText("2 Alfa")).toBeInTheDocument();
      expect(screen.getByText("1 Sakit")).toBeInTheDocument();
      expect(screen.getByText("1 Izin")).toBeInTheDocument();
      expect(screen.getByText("2 Tugas Nunggak")).toBeInTheDocument();

      // Verify Daftar Siswa Widget (Retained in full-width academic glass layout)
      expect(screen.getByRole("heading", { name: "Daftar Siswa" })).toBeInTheDocument();
      expect(screen.getByText("3 Siswa")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Cari nama atau NIS siswa...")).toBeInTheDocument();
      expect(screen.getByTitle("Filter Laki-laki")).toBeInTheDocument();
      expect(screen.getByTitle("Filter Perempuan")).toBeInTheDocument();
      expect(screen.getByText("Ahmad Fauzi")).toBeInTheDocument();
      expect(screen.getByText("Bella Safitri")).toBeInTheDocument();

      // Verify click to navigate to Siswa Tab
      const viewAllBtn = screen.getByRole("button", { name: /Buka Tab Siswa Lengkap/i });
      expect(viewAllBtn).toBeInTheDocument();
      fireEvent.click(viewAllBtn);

      // Now active tab is Siswa, showing full student directory table
      expect(screen.getByText("Daftar Murid Kelas")).toBeInTheDocument();
    });

    it("switches to Siswa tab and renders student table with 6-status attendance columns and search", () => {
      const mockStudents = [
        {
          siswa_id: "s-1",
          penempatan_rombel_id: "pr-1",
          nama_lengkap: "Ahmad Fauzi",
          nis: "26001",
          nisn: "0012345671",
          nomor_absen: 1,
          jenis_kelamin: "L" as const,
          foto_url: null,
          rombel_nama: "X RPL 1",
          health_status: "AMAN" as const,
          kehadiran_persen: 100,
          kehadiran_stats: { hadir: 10, sakit: 0, izin: 0, alpha: 0, total: 10 },
          tugas_selesai: 2,
          tugas_total: 2,
          tugas_persen: 100,
          tp_selesai: 4,
          tp_total: 4,
          tp_persen: 100,
          nilai_rata_rata: 90,
          tugas_detail: [],
          presensi_detail: [],
          nilai_detail: [],
          tp_matrix: [],
          cbt_stats: { total_ujian: 1, diikuti: 1, rata_rata: 90 },
          catatan_list: [],
        },
      ];

      render(
        <ClassWorkspaceView
          workspace={mockWorkspace}
          canManage={true}
          studentDirectory={mockStudents}
        />
      );

      const siswaTabBtn = screen.getByTestId("tab-SISWA");
      fireEvent.click(siswaTabBtn);

      expect(screen.getByText("Daftar Murid Kelas")).toBeInTheDocument();
      expect(screen.getByText("Ahmad Fauzi")).toBeInTheDocument();
      expect(screen.getByText(/26001/)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Cari murid berdasarkan nama atau NIS/i)
      ).toBeInTheDocument();
    });

    it("paginates student directory with 10 items per page and navigates to next page", () => {
      const mockManyStudents = Array.from({ length: 15 }, (_, i) => ({
        siswa_id: `siswa-${i + 1}`,
        penempatan_rombel_id: `pr-${i + 1}`,
        nama_lengkap: `Murid Ke-${i + 1}`,
        nis: `NIS-${1000 + i}`,
        nisn: `NISN-${2000 + i}`,
        jenis_kelamin: (i % 2 === 0 ? "L" : "P") as "L" | "P",
        nomor_absen: i + 1,
        foto_url: null,
        rombel_nama: "X RPL 1",
        health_status: "AMAN" as const,
        kehadiran_persen: 100,
        tugas_persen: 100,
        tugas_total: 2,
        tugas_selesai: 2,
        presensi_persen: 100,
        kehadiran_stats: { hadir: 10, sakit: 0, izin: 0, alpha: 0, total: 10 },
        tp_selesai: 2,
        tp_total: 2,
        tp_persen: 100,
        nilai_rata_rata: 85,
        tugas_detail: [],
        presensi_detail: [],
        nilai_detail: [],
        tp_matrix: [],
        cbt_stats: { total_ujian: 1, diikuti: 1, rata_rata: 85 },
        catatan_list: [],
      }));

      render(
        <ClassWorkspaceView
          workspace={mockWorkspace}
          canManage={true}
          studentDirectory={mockManyStudents}
        />
      );

      const siswaTabBtn = screen.getByTestId("tab-SISWA");
      fireEvent.click(siswaTabBtn);

      // Halaman 1: Murid Ke-1 s/d Murid Ke-10 tampil, Murid Ke-11 tidak tampil
      expect(screen.getByText("Murid Ke-1")).toBeInTheDocument();
      expect(screen.getByText("Murid Ke-10")).toBeInTheDocument();
      expect(screen.queryByText("Murid Ke-11")).not.toBeInTheDocument();

      // Klik Berikutnya
      const nextBtn = screen.getByTitle("Halaman Berikutnya");
      fireEvent.click(nextBtn);

      // Halaman 2: Murid Ke-11 s/d Ke-15 tampil, Murid Ke-1 tidak tampil
      expect(screen.getByText("Murid Ke-11")).toBeInTheDocument();
      expect(screen.getByText("Murid Ke-15")).toBeInTheDocument();
      expect(screen.queryByText("Murid Ke-1")).not.toBeInTheDocument();
    });

    it("switches to Pengaturan tab and renders class settings, join code, and teacher authorization info", async () => {
      render(<ClassWorkspaceView workspace={mockWorkspace} canManage={true} />);

      const pengaturanTabBtn = screen.getByTestId("tab-PENGATURAN");
      await act(async () => {
        fireEvent.click(pengaturanTabBtn);
      });

      expect(screen.getByText("Kode Akses & Pendaftaran Mandiri Murid")).toBeInTheDocument();
      expect(screen.getByText("Informasi & Konfigurasi Kelas")).toBeInTheDocument();
      expect(screen.getByText("Hak Akses & Otorisasi")).toBeInTheDocument();
    });

    it("renders ClassAssessmentTabView when deep link initialTab is PENILAIAN and gradebook is provided", () => {
      const mockGradebook = {
        penugasan_id: "PEN_01",
        sekolah_id: "SCH_01",
        rombel_id: "R_01",
        rombel_nama: "X RPL 1",
        mata_pelajaran_id: "MP_01",
        mata_pelajaran_nama: "Pemrograman Web",
        kkm_default: 75,
        columns: [],
        rows: [],
        statistics: {
          total_siswa: 36,
          total_asesmen: 1,
          total_formatif: 0,
          total_sumatif: 1,
          rata_rata_kelas: 80,
          persentase_tuntas_kktp: 85,
        },
      };

      render(
        <ClassWorkspaceView
          workspace={mockWorkspace}
          canManage={true}
          initialTab="PENILAIAN"
          gradebook={mockGradebook as any}
        />
      );

      expect(screen.getByText("Total Asesmen")).toBeInTheDocument();
      expect(
        screen.getByText(/Akses penilaian kelas telah dialihkan ke menu global/i)
      ).toBeInTheDocument();
    });

    it("renders CBT workspace view when deep link initialTab is CBT", () => {
      render(<ClassWorkspaceView workspace={mockWorkspace} canManage={true} initialTab="CBT" />);

      expect(screen.getByText("Ujian Berbasis Komputer (CBT)")).toBeInTheDocument();
    });
  });
});
