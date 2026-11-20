import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  TeacherCompactHeader,
  formatFullIndonesianDate,
  formatTimeWIB,
  formatLiveDateBadge,
} from "@/shared/components/dashboard/cockpit/teacher-compact-header";
import { TeacherLiveBadge } from "@/shared/components/dashboard/cockpit/teacher-live-badge";
import { TeachingTimelineRail } from "@/shared/components/dashboard/cockpit/teaching-timeline-rail";
import { TeacherDashboard } from "@/shared/components/dashboard/role-views/teacher-dashboard";
import { AuthenticatedUser } from "@/shared/infrastructure/auth/auth-service";
import { MergedScheduleBlock } from "@/modules/schedule/domain/schedule-merger";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockTeacherUser: AuthenticatedUser = {
  id: "01J000000000000000000TEACH1",
  username: "guru_erichandra",
  nama_lengkap: "Eri Chandra A, S.Kom",
  email: null,
  peran_dasar: "TEACHER",
  status_akun: "AKTIF",
  harus_ganti_password: false,
  sekolah_id: "01J00000000000000000000001",
};

const mockBlock: MergedScheduleBlock = {
  key: "block-test-1",
  hari: "SENIN",
  mata_pelajaran_id: "mapel-kka",
  mata_pelajaran_nama: "Koding dan Kecerdasan Artifisial",
  mata_pelajaran_kode: "KKA",
  rombel_id: "rombel-x-rpl-1",
  rombel_nama: "X RPL 1",
  guru_id: "guru-eri",
  guru_nama: "Eri Chandra A, S.Kom",
  ruangan: "Lab Komputer 1",
  tahun_ajaran_id: "ta-2026",
  penugasan_mengajar_id: "pm-1",
  jam_mulai: "07:00",
  jam_selesai: "08:20",
  total_jp: 2,
  slot_range_label: "Jam ke-1 – 2",
  entries: [],
  primary_entry: {} as any,
};

describe("STAGE UX MOBILE OPTIMIZATION — Teacher Mobile Cockpit (<768px)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. Utility Formatting Functions", () => {
    it("formats full Indonesian date properly (e.g. 'Senin, 06 Oktober 2026')", () => {
      // 6 Oktober 2026 is a Tuesday (Selasa in Indonesian)
      const testDate = new Date(2026, 9, 6, 16, 42); // Oct 6, 2026 16:42
      const formatted = formatFullIndonesianDate(testDate);
      expect(formatted).toMatch(/Selasa, 06 Oktober 2026/);

      // Oct 5, 2026 is a Monday (Senin)
      const mondayDate = new Date(2026, 9, 5, 16, 42);
      expect(formatFullIndonesianDate(mondayDate)).toMatch(/Senin, 05 Oktober 2026/);
    });

    it("formats time in WIB format (e.g. '16:42 WIB')", () => {
      const testDate = new Date(2026, 9, 6, 16, 42);
      expect(formatTimeWIB(testDate)).toBe("16:42 WIB");
    });

    it("formats live date badge as 'Sen, 06 Okt • 16:42 WIB'", () => {
      const testDate = new Date(2026, 9, 6, 16, 42);
      expect(formatLiveDateBadge(testDate)).toBe("Sel, 06 Okt • 16:42 WIB");

      const mondayDate = new Date(2026, 9, 5, 16, 42);
      expect(formatLiveDateBadge(mondayDate)).toBe("Sen, 05 Okt • 16:42 WIB");
    });
  });

  describe("2. TeacherCompactHeader Component", () => {
    it("renders title 'Jadwal Mengajar' and Indonesian subtitle date & time", () => {
      render(
        <TeacherCompactHeader
          dateOverride="Senin, 06 Oktober 2026"
          timeOverride="16:42 WIB"
          badgeOverride="Sen, 06 Okt • 16:42 WIB"
        />
      );

      // Title
      expect(screen.getByRole("heading", { name: "Jadwal Mengajar" })).toBeInTheDocument();

      // Subtitle
      expect(screen.getByTestId("compact-header-date")).toHaveTextContent("Senin, 06 Oktober 2026");
      expect(screen.getByTestId("compact-header-time")).toHaveTextContent("16:42 WIB");

      // Badge
      expect(screen.getByTestId("compact-header-badge")).toHaveTextContent(
        "Sen, 06 Okt • 16:42 WIB"
      );
    });

    it("has 'md:hidden' class to ensure visibility only on mobile (<768px)", () => {
      render(<TeacherCompactHeader />);
      const header = screen.getByTestId("teacher-compact-header");
      expect(header.className).toContain("md:hidden");
    });

    it("updates time automatically every 60 seconds", () => {
      const startDate = new Date(2026, 9, 6, 16, 42, 0);
      vi.setSystemTime(startDate);

      render(<TeacherCompactHeader initialDate={startDate} />);

      expect(screen.getByTestId("compact-header-time")).toHaveTextContent("16:42 WIB");

      // Fast-forward 60 seconds
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(screen.getByTestId("compact-header-time")).toHaveTextContent("16:43 WIB");
    });
  });

  describe("3. TeacherLiveBadge Component", () => {
    it("renders live formatted badge and replaces 'Hari Ini'", () => {
      const fixedDate = new Date(2026, 9, 6, 16, 42, 0);
      vi.setSystemTime(fixedDate);

      render(<TeacherLiveBadge />);

      const badge = screen.getByTestId("teacher-live-badge");
      expect(badge).toHaveTextContent("Sel, 06 Okt • 16:42 WIB");
      expect(badge).not.toHaveTextContent("Hari Ini");
    });

    it("updates every minute automatically", () => {
      const startDate = new Date(2026, 9, 6, 16, 42, 0);
      vi.setSystemTime(startDate);

      render(<TeacherLiveBadge />);
      const badge = screen.getByTestId("teacher-live-badge");
      expect(badge).toHaveTextContent("16:42 WIB");

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(badge).toHaveTextContent("16:43 WIB");
    });
  });

  describe("4. TeachingTimelineRail Integration", () => {
    it("displays live date badge instead of static 'Hari Ini' in card header", () => {
      const testDate = new Date(2026, 9, 6, 16, 42, 0);
      vi.setSystemTime(testDate);

      render(
        <TeachingTimelineRail
          mergedBlocks={[mockBlock]}
          actualSessions={[]}
          currentTimeOverride={testDate}
          badgeOverride="Sen, 06 Okt • 16:42 WIB"
        />
      );

      // Badge must show actual date & time
      expect(screen.getByText("Sen, 06 Okt • 16:42 WIB")).toBeInTheDocument();
      expect(screen.queryByText("Hari Ini")).not.toBeInTheDocument();

      // Card schedule content must be rendered
      expect(screen.getByText("Koding dan Kecerdasan Artifisial")).toBeInTheDocument();
      expect(screen.getByText("Kelas X RPL 1 • Lab Komputer 1")).toBeInTheDocument();
    });
  });

  describe("5. TeacherDashboard Responsive & Priority Structure", () => {
    it("hides hero banner on mobile (<768px) with 'hidden md:flex' and preserves desktop visibility", async () => {
      const jsx = await TeacherDashboard({
        user: mockTeacherUser,
        initialData: {
          hasProfile: true,
          teacher: {
            id: "guru-eri",
            sekolah_id: "01J00000000000000000000001",
            nama_lengkap: "Eri Chandra A",
            gelar_belakang: "S.Kom",
            nama_dengan_gelar: "Eri Chandra A, S.Kom",
            jenis_kelamin: "L",
            status_kepegawaian: "TETAP",
            status_aktif: true,
            status_lifecycle: "AKTIF",
            created_at: new Date(),
            updated_at: new Date(),
          },
          activeAssignments: [],
          activeHomeroom: null,
          totalJamMinggu: 0,
          totalRombel: 0,
          totalSiswaBinaan: 0,
        },
      });

      const { container } = render(jsx);

      // Hero banner container must contain 'hidden md:flex'
      const heroBanner =
        container.querySelector(".rounded-\\[32px\\]") ||
        container.querySelector(".rounded-\\[28px\\]") ||
        screen.getByText("Teaching Command Center").closest(".hidden.md\\:flex");
      expect(heroBanner).toBeInTheDocument();
      expect(heroBanner?.className).toContain("hidden md:flex");

      // Verify the hero banner elements are contained inside it
      expect(screen.getByText("Teaching Command Center")).toBeInTheDocument();
      expect(screen.getByText("Halo, Eri Chandra A, S.Kom!")).toBeInTheDocument();
      expect(screen.getByText("Presensi Kilat 15 Detik")).toBeInTheDocument();
      expect(screen.getByText("Perangkat Ajar")).toBeInTheDocument();
      expect(screen.getByAltText("Maskot Astronot Ruang Pintar")).toBeInTheDocument();
    });

    it("renders compact header at the top with 'md:hidden'", async () => {
      const jsx = await TeacherDashboard({
        user: mockTeacherUser,
        initialData: {
          hasProfile: true,
          teacher: null,
          activeAssignments: [],
          activeHomeroom: null,
          totalJamMinggu: 0,
          totalRombel: 0,
          totalSiswaBinaan: 0,
        },
      });

      render(jsx);

      const compactHeader = screen.getByTestId("teacher-compact-header");
      expect(compactHeader).toBeInTheDocument();
      expect(compactHeader.className).toContain("md:hidden");
    });

    it("establishes priority ordering: Schedule & Rail (order-1 on mobile), Workspace (order-2 on mobile)", async () => {
      const jsx = await TeacherDashboard({
        user: mockTeacherUser,
        initialData: {
          hasProfile: true,
          teacher: null,
          activeAssignments: [],
          activeHomeroom: null,
          totalJamMinggu: 0,
          totalRombel: 0,
          totalSiswaBinaan: 0,
        },
      });

      const { container } = render(jsx);

      // Right rail has priority 1 on mobile
      const rightRail = container.querySelector(".xl\\:col-span-4");
      expect(rightRail?.className).toContain("order-1 md:order-2 xl:order-2");

      // Left workspace has priority 2 on mobile (after schedule)
      const leftWorkspace = container.querySelector(".xl\\:col-span-8");
      expect(leftWorkspace?.className).toContain("order-2 md:order-1 xl:order-1");
    });

    it("replaces 'Hari Ini' with TeacherLiveBadge in both timeline rail and Rekap Presensi", async () => {
      const jsx = await TeacherDashboard({
        user: mockTeacherUser,
        initialData: {
          hasProfile: true,
          teacher: null,
          activeAssignments: [],
          activeHomeroom: null,
          totalJamMinggu: 0,
          totalRombel: 0,
          totalSiswaBinaan: 0,
        },
      });

      render(jsx);

      // Verify no static "Hari Ini" text remains in the dashboard
      expect(screen.queryByText("Hari Ini")).not.toBeInTheDocument();

      // Verify live badges are rendered
      const liveBadges = screen.getAllByTestId("teacher-live-badge");
      expect(liveBadges.length).toBeGreaterThanOrEqual(2);
    });
  });
});
