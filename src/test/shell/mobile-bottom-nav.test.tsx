import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MobileBottomNav,
  getMobileBottomNavItems,
} from "@/shared/components/shell/mobile-bottom-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("MobileBottomNav Component", () => {
  it("generates correct role-aware items for TEACHER", () => {
    const items = getMobileBottomNavItems("TEACHER");
    expect(items.map((i) => i.label)).toEqual(["Beranda", "Jadwal", "Kelas", "Sesi KBM"]);
    expect(items.map((i) => i.href)).toEqual([
      "/dashboard",
      "/jadwal-saya",
      "/kelas-saya",
      "/sesi-pembelajaran",
    ]);
  });

  it("generates contextual role-aware items for SUPER_ADMIN (Platform vs Active Tenant)", () => {
    const platformItems = getMobileBottomNavItems("SUPER_ADMIN", [], false, false);
    expect(platformItems.map((i) => i.label)).toEqual(["Beranda", "Sekolah"]);
    expect(platformItems.map((i) => i.href)).toEqual(["/dashboard", "/sekolah"]);

    const tenantItems = getMobileBottomNavItems("SUPER_ADMIN", [], false, true);
    expect(tenantItems.map((i) => i.label)).toEqual(["Beranda", "Sekolah", "Siswa", "Akademik"]);
    expect(tenantItems.map((i) => i.href)).toEqual([
      "/dashboard",
      "/sekolah",
      "/data-siswa",
      "/struktur-akademik",
    ]);
  });

  it("generates correct role-aware items for STUDENT and GUARDIAN", () => {
    const studentItems = getMobileBottomNavItems("STUDENT");
    expect(studentItems.map((i) => i.label)).toEqual([
      "Beranda",
      "CBT",
      "Jadwal",
      "Materi & Tugas",
    ]);
    expect(studentItems.map((i) => i.href)).toEqual([
      "/dashboard",
      "/cbt-ujian",
      "/jadwal-saya",
      "/tugas-siswa",
    ]);

    const guardianItems = getMobileBottomNavItems("GUARDIAN");
    expect(guardianItems.map((i) => i.label)).toEqual(["Beranda", "Presensi", "Nilai"]);
  });

  it("renders MobileBottomNav with correct links and active state for dashboard", () => {
    const mockOnOpenMenu = vi.fn();
    render(<MobileBottomNav userRole="TEACHER" onOpenMenu={mockOnOpenMenu} />);

    expect(screen.getByLabelText("Navigasi Bawah Mobile")).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /Beranda/i });
    expect(homeLink).toHaveAttribute("href", "/dashboard");
    expect(homeLink).toHaveAttribute("aria-current", "page");

    const scheduleLink = screen.getByRole("link", { name: /Jadwal/i });
    expect(scheduleLink).toHaveAttribute("href", "/jadwal-saya");
    expect(scheduleLink).not.toHaveAttribute("aria-current");

    const menuButton = screen.getByRole("button", { name: /Buka Menu Lainnya/i });
    expect(menuButton).toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(mockOnOpenMenu).toHaveBeenCalledTimes(1);
  });
});
