import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeacherHeroActions } from "@/shared/components/dashboard/cockpit/teacher-hero-actions";
import { TeacherKpiGrid } from "@/shared/components/dashboard/cockpit/teacher-kpi-grid";
import { TeachingTimelineRail } from "@/shared/components/dashboard/cockpit/teaching-timeline-rail";
import { PerformanceBarChart } from "@/shared/components/dashboard/cockpit/performance-bar-chart";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("STAGE UI-GLASS-01: Academic Glass Dashboard v1.0", () => {
  it("renders Button System with linear-gradient presensi kilat and soft glass perangkat ajar", () => {
    render(<TeacherHeroActions />);

    const presensiBtn = screen.getByRole("link", { name: /Presensi Kilat 15 Detik/i });
    expect(presensiBtn).toBeInTheDocument();
    expect(presensiBtn).toHaveClass("shadow-[0_12px_30px_rgba(37,99,235,0.25)]");

    const perangkatBtn = screen.getByRole("link", { name: /Perangkat Ajar/i });
    expect(perangkatBtn).toBeInTheDocument();
    expect(perangkatBtn).toHaveClass("bg-white/65");
    expect(perangkatBtn).toHaveClass("backdrop-blur-[12px]");
    expect(perangkatBtn).toHaveClass("border-white/75");
  });

  it("renders Statistic Cards with Soft Glass tokens (70% white, 16px blur, border-white/75, soft shadow)", () => {
    const { container } = render(
      <TeacherKpiGrid
        totalRombel={4}
        activeAssignmentsCount={6}
        uniqueMapelsCount={2}
        totalSiswaBinaan={128}
        totalJamMinggu={24}
        totalTugasPerluDiperiksa={3}
        totalCbtAktif={1}
      />
    );

    // Verify soft glass classes on cards
    const softGlassCards = container.querySelectorAll(".backdrop-blur-\\[16px\\]");
    expect(softGlassCards.length).toBe(5);

    softGlassCards.forEach((card) => {
      expect(card).toHaveClass("bg-white/70");
      expect(card).toHaveClass("border-white/75");
      expect(card).toHaveClass("shadow-[0_8px_24px_rgba(0,0,0,0.03)]");
    });
  });

  it("renders Jadwal Mengajar as Floating Glass Panel with normalized elevation and keeps blue session card", () => {
    const mockBlock = {
      key: "block-1",
      penugasan_mengajar_id: "penugasan-1",
      rombel_id: "rombel-1",
      mata_pelajaran_id: "mapel-1",
      rombel_nama: "X-A",
      mata_pelajaran_nama: "Matematika",
      jam_mulai: "07:30",
      jam_selesai: "09:00",
      total_jp: 2,
      ruangan: "Lab 1",
    };

    const { container } = render(
      <TeachingTimelineRail
        mergedBlocks={[mockBlock as any]}
        actualSessions={[]}
        announcements={[]}
        upcomingEvents={[]}
      />
    );

    // Jadwal Mengajar Floating Glass Panel (Normalized depth)
    const scheduleCard = screen.getByText("Jadwal Mengajar").closest(".rounded-\\[28px\\]");
    expect(scheduleCard).toBeInTheDocument();
    expect(scheduleCard).toHaveClass("bg-white/65");
    expect(scheduleCard).toHaveClass("backdrop-blur-[24px]");
    expect(scheduleCard).toHaveClass("border-white/75");
    expect(scheduleCard).toHaveClass("shadow-[0_20px_50px_rgba(37,99,235,0.08)]");

    // Existing Blue Session Card preserved
    const blueCard = container.querySelector(
      ".bg-gradient-to-br.from-\\[\\#2563EB\\].to-\\[\\#1D4ED8\\]"
    );
    expect(blueCard).toBeInTheDocument();
  });

  it("renders Ketuntasan Penilaian with glass surface outer card and normalized analytics depth", () => {
    render(
      <PerformanceBarChart
        items={[{ id: "1", name: "X-A", score: 88.5, subject: "Matematika" }]}
        averageScore={88.5}
        bestClass={{ name: "X-A", score: 88.5 }}
      />
    );

    const perfCard = screen.getByText("Ketuntasan Penilaian").closest(".rounded-\\[28px\\]");
    expect(perfCard).toBeInTheDocument();
    expect(perfCard).toHaveClass("bg-white/65");
    expect(perfCard).toHaveClass("backdrop-blur-[20px]");
    expect(perfCard).toHaveClass("border-white/75");
    expect(perfCard).toHaveClass("shadow-[0_12px_36px_rgba(0,0,0,0.04)]");
  });

  it("renders Agenda & Pengumuman with glass surface outer card and normalized analytics depth", () => {
    render(
      <TeachingTimelineRail
        mergedBlocks={[]}
        actualSessions={[]}
        announcements={[]}
        upcomingEvents={[]}
      />
    );

    const agendaCard = screen.getByText("Agenda & Pengumuman").closest(".rounded-\\[28px\\]");
    expect(agendaCard).toBeInTheDocument();
    expect(agendaCard).toHaveClass("bg-white/65");
    expect(agendaCard).toHaveClass("backdrop-blur-[20px]");
    expect(agendaCard).toHaveClass("border-white/75");
    expect(agendaCard).toHaveClass("shadow-[0_12px_36px_rgba(0,0,0,0.04)]");
  });
});

describe("STAGE UI-GLASS-02: Dashboard Harmonization & Visual Integration", () => {
  it("verifies Topbar integrates Glass Header tokens", async () => {
    const { Topbar } = await import("@/shared/components/shell/topbar");
    const mockUser = {
      id: "user-1",
      username: "eri.chandra",
      nama_lengkap: "Eri Chandra A S.Kom",
      peran_dasar: "TEACHER",
    };

    const { container } = render(<Topbar user={mockUser} onOpenMobileDrawer={vi.fn()} />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("bg-[#F8FAFC]/80");
    expect(header).toHaveClass("backdrop-blur-xl");
    expect(header).toHaveClass("border-slate-200/50");
  });
});
