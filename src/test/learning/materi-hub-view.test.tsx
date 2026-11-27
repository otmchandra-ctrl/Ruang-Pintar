/**
 * Ruang Pintar — MateriHubView Chapter-Centric Workspace Unit Tests
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MateriHubView } from "@/modules/learning/presentation/materi-hub-view";
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

vi.mock("@/app/actions/learning-actions", () => ({
  deleteMateriAction: vi.fn(),
  deleteLingkupMateriAction: vi.fn(),
}));

describe("MateriHubView (Chapter-Centric Workspace)", () => {
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
      total_bab: 2,
      total_materi: 3,
      total_tugas: 1,
      total_jurnal: 2,
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
        judul: "Pengenalan Dasar HTML & CSS",
        deskripsi: "Konsep dasar struktur web dan styling modern",
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
            deskripsi: "Memahami elemen semantik HTML5",
            urutan: 1,
            status: "AKTIF",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      },
      {
        id: "BAB_02",
        sekolah_id: "SCH_01",
        penugasan_mengajar_id: "PEN_01",
        kode: "BAB 2",
        judul: "Dasar JavaScript & Interaktivitas",
        deskripsi: "Variabel, tipe data, fungsi, dan manipulasi DOM",
        urutan: 2,
        status: "AKTIF",
        created_at: new Date(),
        updated_at: new Date(),
        tujuan_pembelajaran: [],
      },
    ],
    materi_list: [
      {
        id: "MAT_01",
        sekolah_id: "SCH_01",
        guru_id: "G_01",
        lingkup_materi_id: "BAB_01",
        lingkup_materi_judul: "Pengenalan Dasar HTML & CSS",
        judul: "Panduan Modul HTML5 Semantik",
        deskripsi: "Materi pengenalan tag header, nav, main, dan footer",
        tipe_konten: "DOKUMEN",
        status: "PUBLISHED",
        is_published: true,
        created_at: new Date("2026-10-10"),
        updated_at: new Date("2026-10-10"),
      },
      {
        id: "MAT_02",
        sekolah_id: "SCH_01",
        guru_id: "G_01",
        lingkup_materi_id: "BAB_01",
        lingkup_materi_judul: "Pengenalan Dasar HTML & CSS",
        judul: "Dokumentasi MDN Web Docs",
        deskripsi: "Referensi resmi untuk HTML & CSS",
        tipe_konten: "TAUTAN",
        tautan_url: "https://developer.mozilla.org",
        status: "PUBLISHED",
        is_published: true,
        created_at: new Date("2026-10-11"),
        updated_at: new Date("2026-10-11"),
      },
      {
        id: "MAT_03",
        sekolah_id: "SCH_01",
        guru_id: "G_01",
        lingkup_materi_id: "BAB_02",
        lingkup_materi_judul: "Dasar JavaScript & Interaktivitas",
        judul: "Catatan JavaScript Dasar (Draf)",
        deskripsi: "Konsep let, const, dan function closures",
        tipe_konten: "TEKS",
        konten_teks: "Closure adalah kombinasi fungsi dan lexical environment...",
        status: "DRAFT",
        is_published: false,
        created_at: new Date("2026-10-12"),
        updated_at: new Date("2026-10-12"),
      },
    ],
    tugas_list: [],
    administrasi_list: [],
    jadwal_list: [],
  };

  it("renders cockpit header with title and metric pills", () => {
    render(
      <MateriHubView
        classes={mockClasses}
        selectedPenugasanId="PEN_01"
        workspace={mockWorkspace}
        canManage={true}
        teacherName="Budi Santoso, M.Kom."
        isAdmin={false}
      />
    );

    expect(screen.getByText("Bank Materi & Modul Ajar")).toBeInTheDocument();
    expect(screen.getByText(/2 Bab Kurikulum/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Total Modul/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2 Terbit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/1 Draf/i)).toBeInTheDocument();
  });

  it("renders chapter cards and resource cards inside correct chapters", () => {
    render(
      <MateriHubView
        classes={mockClasses}
        selectedPenugasanId="PEN_01"
        workspace={mockWorkspace}
        canManage={true}
        teacherName="Budi Santoso, M.Kom."
        isAdmin={false}
      />
    );

    // Bab headers (muncul di sidebar outline dan heading panel kanan)
    expect(
      screen.getByRole("heading", { name: "Pengenalan Dasar HTML & CSS" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dasar JavaScript & Interaktivitas" })
    ).toBeInTheDocument();

    // TP
    expect(screen.getByText("TP 1.1")).toBeInTheDocument();
    expect(screen.getByText("Memahami elemen semantik HTML5")).toBeInTheDocument();

    // Material cards inside Bab 1
    expect(screen.getByText("Panduan Modul HTML5 Semantik")).toBeInTheDocument();
    expect(screen.getByText("Dokumentasi MDN Web Docs")).toBeInTheDocument();

    // Material cards inside Bab 2
    expect(screen.getByText("Catatan JavaScript Dasar (Draf)")).toBeInTheDocument();
  });

  it("filters materials by type pill", () => {
    render(
      <MateriHubView
        classes={mockClasses}
        selectedPenugasanId="PEN_01"
        workspace={mockWorkspace}
        canManage={true}
        teacherName="Budi Santoso, M.Kom."
        isAdmin={false}
      />
    );

    // Click Tautan filter pill
    const tautanFilterBtn = screen.getByRole("button", { name: /Tautan \(1\)/i });
    fireEvent.click(tautanFilterBtn);

    // Only Tautan should be visible, others hidden
    expect(screen.getByText("Dokumentasi MDN Web Docs")).toBeInTheDocument();
    expect(screen.queryByText("Panduan Modul HTML5 Semantik")).not.toBeInTheDocument();
    expect(screen.queryByText("Catatan JavaScript Dasar (Draf)")).not.toBeInTheDocument();
  });

  it("filters materials by real-time search query", () => {
    render(
      <MateriHubView
        classes={mockClasses}
        selectedPenugasanId="PEN_01"
        workspace={mockWorkspace}
        canManage={true}
        teacherName="Budi Santoso, M.Kom."
        isAdmin={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari materi, bab, topik/i);
    fireEvent.change(searchInput, { target: { value: "MDN" } });

    expect(screen.getByText("Dokumentasi MDN Web Docs")).toBeInTheDocument();
    expect(screen.queryByText("Panduan Modul HTML5 Semantik")).not.toBeInTheDocument();
    expect(screen.queryByText("Catatan JavaScript Dasar (Draf)")).not.toBeInTheDocument();
  });

  it("switches active chapter from sidebar and toggles list/grid view", () => {
    render(
      <MateriHubView
        classes={mockClasses}
        selectedPenugasanId="PEN_01"
        workspace={mockWorkspace}
        canManage={true}
        teacherName="Budi Santoso, M.Kom."
        isAdmin={false}
      />
    );

    // Klik Bab 2 pada sidebar
    const bab2SidebarBtn = screen.getByRole("button", { name: /BAB 2\s+Dasar JavaScript/i });
    fireEvent.click(bab2SidebarBtn);

    expect(screen.getByText("Catatan JavaScript Dasar (Draf)")).toBeInTheDocument();
    expect(screen.queryByText("Panduan Modul HTML5 Semantik")).not.toBeInTheDocument();

    // Toggle ke tampilan Kartu (Grid)
    const gridBtn = screen.getByRole("button", { name: /Kartu/i });
    fireEvent.click(gridBtn);
    expect(screen.getByText("Catatan JavaScript Dasar (Draf)")).toBeInTheDocument();
  });
});
