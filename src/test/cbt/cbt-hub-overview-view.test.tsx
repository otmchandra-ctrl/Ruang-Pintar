import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { CbtHubOverviewView } from "@/modules/cbt/presentation/cbt-hub-overview-view";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: any) => <img {...props} alt={props.alt || "mocked-img"} />,
}));

// Mock CBT modals
vi.mock("@/modules/cbt/presentation/question-bank-modal", () => ({
  QuestionBankModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="question-bank-modal">Question Bank Modal Open</div> : null,
}));

vi.mock("@/modules/cbt/presentation/create-exam-modal", () => ({
  CreateExamModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-exam-modal">Create Exam Modal Open</div> : null,
}));

// Mock cbt-actions finishExamAction
vi.mock("@/app/actions/cbt-actions", () => ({
  finishExamAction: vi.fn().mockResolvedValue({
    success: true,
    message: "Ujian berhasil diakhiri.",
  }),
}));

const mockTeacherClasses = [
  {
    penugasan_id: "pen-1",
    rombel_id: "r-1",
    rombel_nama: "X DKV 1",
    mata_pelajaran_id: "m-1",
    mata_pelajaran_nama: "KKA",
    guru_nama: "Eri Chandra A",
    total_ujian: 3,
    total_published: 0,
    total_draft: 2,
    total_selesai: 1,
    exams: [
      {
        id: "ex-1",
        judul: "Ujian Harian Pemrograman",
        durasi_menit: 45,
        status: "SELESAI",
        total_peserta: 20,
        total_selesai: 20,
        rata_rata: null,
        total_perlu_koreksi: 5,
      },
      {
        id: "ex-2",
        judul: "Persiapan PTS KKA",
        durasi_menit: 60,
        status: "DRAFT",
        total_peserta: 0,
        total_selesai: 0,
        total_soal: 25,
        rata_rata: null,
      },
      {
        id: "ex-3",
        judul: "Asesmen Semester",
        durasi_menit: 90,
        status: "DRAFT",
        total_peserta: 0,
        total_selesai: 0,
        total_soal: null,
        rata_rata: null,
      },
    ],
  },
];

describe("CBT Hub Overview View — 3D Exam Astronaut Banner & Perlu Tindakan Rail", () => {
  it("1. Renders Desktop Hero Banner with badge, title, subtitle and action buttons", () => {
    render(
      <CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" teacherClasses={mockTeacherClasses} />
    );

    // Capsule Badge
    expect(screen.getByText("Assessment & Exam Cockpit")).toBeDefined();

    // Heading Title
    expect(screen.getByRole("heading", { name: /CBT Ujian & Evaluasi Akademik/i })).toBeDefined();

    // Buttons
    expect(screen.getAllByRole("button", { name: /Buat Ujian Baru/i })[0]).toBeDefined();
    expect(screen.getByRole("button", { name: /Buka Bank Soal/i })).toBeDefined();
  });

  it("2. Renders 3D Exam Astronaut Mascot Image with new CBT asset path", () => {
    render(<CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" />);

    const mascotImg = screen.getByAltText("Maskot Astronot Ruang Pintar CBT");
    expect(mascotImg).toBeDefined();
    expect(mascotImg.getAttribute("src")).toBe("/images/illustrations/astronaut-cbt-exam-hero.png");
  });

  it("3. Renders Right Rail Card 'Perlu Tindakan' with priority action highlight from real data", () => {
    render(
      <CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" teacherClasses={mockTeacherClasses} />
    );

    // Heading Perlu Tindakan
    expect(screen.getByRole("heading", { name: /Perlu Tindakan/i })).toBeDefined();

    // Highlight action
    expect(screen.getByText("Koreksi Lembar Esai Siswa")).toBeDefined();
    expect(screen.getByText("Mulai Koreksi")).toBeDefined();

    // Secondary actions
    expect(screen.getByText("Ujian Siap Diterbitkan")).toBeDefined();
    expect(screen.getByText("Bekukan Snapshot Naskah")).toBeDefined();
  });

  it("4. Renders Mobile Compact Header for screen < 768px", () => {
    render(<CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" />);

    expect(screen.getByRole("heading", { name: /CBT Ujian Online/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Buat Ujian$/i })).toBeDefined();
  });

  it("5. Triggers modals correctly", () => {
    render(
      <CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" teacherClasses={mockTeacherClasses} />
    );

    // Bank Soal modal
    const btnBank = screen.getByRole("button", { name: /Buka Bank Soal/i });
    fireEvent.click(btnBank);
    expect(screen.getByTestId("question-bank-modal")).toBeDefined();

    // Create exam modal
    const btnCreate = screen.getAllByRole("button", { name: /Buat Ujian Baru/i })[0];
    fireEvent.click(btnCreate);
    expect(screen.getByTestId("create-exam-modal")).toBeDefined();
  });

  it("6. Renders 4 Info Cards (Draft Ujian, Ujian Aktif, Ujian Selesai, Bank Soal)", () => {
    render(
      <CbtHubOverviewView
        role="TEACHER"
        sekolahId="SCH_1"
        teacherClasses={mockTeacherClasses}
        bankSoalCount={15}
      />
    );

    expect(screen.getByText("Draft Ujian")).toBeDefined();
    expect(screen.getByText("Ujian Aktif")).toBeDefined();
    expect(screen.getByText("Ujian Selesai")).toBeDefined();
    expect(screen.getAllByText("Bank Soal")[0]).toBeDefined();
    expect(screen.getByText("15")).toBeDefined(); // bank soal count
  });

  it("7. Renders All Caught Up state when no pending actions exist", () => {
    render(<CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" teacherClasses={[]} />);

    expect(screen.getByText("Semua Evaluasi Tuntas")).toBeDefined();
    expect(screen.getByText("0 Aksi")).toBeDefined();
  });

  it("8. Renders Student view without teacher banner or perlu tindakan", () => {
    render(<CbtHubOverviewView role="STUDENT" sekolahId="SCH_1" />);

    expect(screen.getByRole("heading", { name: /Portal Ujian Siswa/i })).toBeDefined();
    expect(screen.queryByText("Assessment & Exam Cockpit")).toBeNull();
    expect(screen.queryByText("Perlu Tindakan")).toBeNull();
  });

  it("9. Renders Standby Card when no exams are currently running", () => {
    render(
      <CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" teacherClasses={mockTeacherClasses} />
    );

    expect(screen.queryByText("Ujian Sedang Berlangsung")).toBeNull();
    expect(screen.getByText("Tidak Ada Ujian yang Sedang Berlangsung")).toBeDefined();
    expect(screen.getByRole("button", { name: /Jadwalkan Ujian/i })).toBeDefined();
  });

  it("10. Renders Live Active Exam Card with class, token, progress tracker, and actions", () => {
    const mockTeacherClassesWithActive = [
      {
        penugasan_id: "pen-active-1",
        rombel_id: "r-active-1",
        rombel_nama: "XII RPL 1",
        mata_pelajaran_id: "m-rpl-1",
        mata_pelajaran_nama: "Pemrograman Web Lanjut",
        guru_nama: "Eri Chandra A",
        total_ujian: 1,
        total_published: 1,
        total_draft: 0,
        total_selesai: 0,
        exams: [
          {
            id: "ex-live-1",
            judul: "Penilaian Sumatif Akhir Jenjang RPL",
            durasi_menit: 90,
            status: "PUBLISHED",
            total_peserta: 30,
            total_selesai: 12,
            total_sedang_mengerjakan: 15,
            total_soal: 40,
            rata_rata: null,
            gunakan_token: true,
            token_masuk: "RPL992",
          },
        ],
      },
    ];

    render(
      <CbtHubOverviewView
        role="TEACHER"
        sekolahId="SCH_1"
        teacherClasses={mockTeacherClassesWithActive}
      />
    );

    // Section title & Live Badge
    expect(screen.getByText("Ujian Sedang Berlangsung")).toBeDefined();
    expect(screen.getByText("1 Sesi Live")).toBeDefined();

    // Exam item details
    expect(screen.getAllByText("Kelas XII RPL 1")[0]).toBeDefined();
    expect(screen.getAllByText(/Pemrograman Web Lanjut/i)[0]).toBeDefined();
    expect(screen.getAllByText("Penilaian Sumatif Akhir Jenjang RPL")[0]).toBeDefined();
    expect(screen.getAllByText(/Token:\s*RPL992/i)[0]).toBeDefined();

    // Participation progress
    expect(screen.getByText(/12 dari 30 Selesai \(40%\)/i)).toBeDefined();
    expect(screen.getByText("12 Selesai")).toBeDefined();
    expect(screen.getByText("15 Mengerjakan")).toBeDefined();
    expect(screen.getByText("3 Belum Mulai")).toBeDefined();

    // Action buttons
    const monitorLink = screen.getByRole("link", { name: /Monitor Proctor Live/i });
    expect(monitorLink).toBeDefined();
    expect(monitorLink.getAttribute("href")).toBe("/cbt-ujian/proctor/ex-live-1");

    expect(screen.getByRole("button", { name: /Akhiri Ujian/i })).toBeDefined();
  });

  it("11. Opens confirmation modal when clicking Akhiri Ujian and confirms termination", async () => {
    const mockTeacherClassesWithActive = [
      {
        penugasan_id: "pen-active-1",
        rombel_id: "r-active-1",
        rombel_nama: "XII RPL 1",
        mata_pelajaran_id: "m-rpl-1",
        mata_pelajaran_nama: "Pemrograman Web Lanjut",
        guru_nama: "Eri Chandra A",
        total_ujian: 1,
        total_published: 1,
        total_draft: 0,
        total_selesai: 0,
        exams: [
          {
            id: "ex-live-1",
            judul: "Penilaian Sumatif Akhir Jenjang RPL",
            durasi_menit: 90,
            status: "PUBLISHED",
            total_peserta: 30,
            total_selesai: 12,
            total_sedang_mengerjakan: 15,
            total_soal: 40,
            rata_rata: null,
            gunakan_token: true,
            token_masuk: "RPL992",
          },
        ],
      },
    ];

    render(
      <CbtHubOverviewView
        role="TEACHER"
        sekolahId="SCH_1"
        teacherClasses={mockTeacherClassesWithActive}
      />
    );

    // Click "Akhiri Ujian" button
    const endBtn = screen.getByRole("button", { name: /Akhiri Ujian/i });
    fireEvent.click(endBtn);

    // Modal should appear
    expect(screen.getByText("Akhiri Sesi Ujian?")).toBeDefined();
    expect(
      screen.getByText(
        /Saat diakhiri, seluruh lembar kerja siswa yang masih mengerjakan akan otomatis dikumpulkan/i
      )
    ).toBeDefined();

    // Click confirm button
    const confirmBtn = screen.getByRole("button", { name: /Ya, Akhiri Ujian/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(screen.queryByText("Akhiri Sesi Ujian?")).toBeNull();
    });
  });

  it("12. Renders Daftar Seluruh Ujian CBT Table with search and status filtering", () => {
    render(
      <CbtHubOverviewView role="TEACHER" sekolahId="SCH_1" teacherClasses={mockTeacherClasses} />
    );

    // Table heading & count
    expect(screen.getByText("Daftar Seluruh Ujian CBT")).toBeDefined();
    expect(screen.getByText("3 Berkas")).toBeDefined();

    // Table rows
    expect(screen.getAllByText("Ujian Harian Pemrograman")[0]).toBeDefined();
    expect(screen.getByText("Persiapan PTS KKA")).toBeDefined();
    expect(screen.getByText("Asesmen Semester")).toBeDefined();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Cari ujian/i);
    fireEvent.change(searchInput, { target: { value: "Harian" } });
    expect(screen.getAllByText("Ujian Harian Pemrograman")[0]).toBeDefined();
    expect(screen.queryByText("Persiapan PTS KKA")).toBeNull();

    // Reset search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Persiapan PTS KKA")).toBeDefined();
  });

  it("13. Renders Folder Bank Soal Mapel Card below Perlu Tindakan with mapel items and opens modal on click", () => {
    const mockFolders = [
      {
        mapel_id: "m-1",
        mapel_nama: "Keterampilan Komputer & Administrasi",
        mapel_kode: "KKA",
        total_soal: 24,
      },
      {
        mapel_id: "m-2",
        mapel_nama: "Informatika & Pemrograman",
        mapel_kode: "INF",
        total_soal: 15,
      },
    ];

    render(
      <CbtHubOverviewView
        role="TEACHER"
        sekolahId="SCH_1"
        teacherClasses={mockTeacherClasses}
        bankSoalCount={39}
        bankSoalFolders={mockFolders}
      />
    );

    // Heading card
    expect(screen.getByText("Folder Bank Soal Mapel")).toBeDefined();
    expect(screen.getByText("2 Mapel")).toBeDefined();

    // Mapel folder items
    expect(screen.getByText("Keterampilan Komputer & Administrasi")).toBeDefined();
    expect(screen.getByText("24 Butir Soal")).toBeDefined();
    expect(screen.getByText("Informatika & Pemrograman")).toBeDefined();
    expect(screen.getByText("15 Butir Soal")).toBeDefined();

    // Click folder to open bank soal modal
    const kkaFolder = screen.getByText("Keterampilan Komputer & Administrasi");
    fireEvent.click(kkaFolder);
    expect(screen.getByTestId("question-bank-modal")).toBeDefined();
  });
});
