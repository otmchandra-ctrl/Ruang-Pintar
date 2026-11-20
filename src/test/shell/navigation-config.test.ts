import { describe, it, expect } from "vitest";
import {
  getFilteredNavigation,
  CANONICAL_NAVIGATION_CONFIG,
} from "@/shared/components/shell/navigation-config";

describe("Role-Aware Navigation Filtering (Phase 05)", () => {
  it("filters navigation correctly for TEACHER role", () => {
    const nav = getFilteredNavigation("TEACHER");
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds).toContain("teacher-workspace");
    expect(allItemIds).toContain("teacher-classes");
    expect(allItemIds).toContain("teacher-grades");
    expect(allItemIds).toContain("teacher-cbt");
    expect(allItemIds).toContain("teacher-announcements");
    expect(allItemIds).toContain("teacher-profile");

    // Must NOT contain student, guardian, admin, or institution broadcast items
    expect(allItemIds).not.toContain("student-schedule");
    expect(allItemIds).not.toContain("guardian-attendance");
    expect(allItemIds).not.toContain("system-configs");
  });

  it("filters navigation correctly for STUDENT role with structured groups", () => {
    const nav = getFilteredNavigation("STUDENT");
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds).toContain("student-schedule");
    expect(allItemIds).toContain("student-learning");
    expect(allItemIds).toContain("student-cbt");
    expect(allItemIds).toContain("student-grades");
    expect(allItemIds).toContain("student-announcements");
    expect(allItemIds).toContain("student-calendar");

    expect(allItemIds).not.toContain("teacher-workspace");
    expect(allItemIds).not.toContain("system-configs");

    // Verify group structures and titles
    const groupTitles = nav.map((g) => g.title);
    expect(groupTitles).toEqual(["Menu Utama", "Aktivitas Belajar", "Hasil & Informasi"]);

    // Verify daily learning order: Jadwal -> Materi & Tugas -> CBT
    const learningItems = nav.find((g) => g.id === "student-ops")?.items.map((i) => i.id);
    expect(learningItems).toEqual(["student-schedule", "student-learning", "student-cbt"]);

    // Verify outcomes & info order: Nilai -> Pengumuman -> Kalender
    const infoItems = nav.find((g) => g.id === "student-info")?.items.map((i) => i.id);
    expect(infoItems).toEqual(["student-grades", "student-announcements", "student-calendar"]);
  });

  it("filters navigation correctly for GUARDIAN role", () => {
    const nav = getFilteredNavigation("GUARDIAN");
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds).toContain("guardian-attendance");
    expect(allItemIds).toContain("guardian-grades");

    expect(allItemIds).not.toContain("teacher-workspace");
    expect(allItemIds).not.toContain("student-schedule");
  });

  it("filters navigation correctly for SUPER_ADMIN role", () => {
    const nav = getFilteredNavigation("SUPER_ADMIN");
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds.some((id) => id === "staff-school" || id === "saas-schools")).toBe(true);
    expect(allItemIds.some((id) => id === "staff-academic" || id === "saas-academic")).toBe(true);
    expect(allItemIds.some((id) => id === "staff-students" || id === "saas-students")).toBe(true);
    expect(allItemIds.some((id) => id === "staff-reports" || id === "saas-reports")).toBe(true);
  });

  it("restricts SCHOOL_STAFF without capabilities from specialized administrative items", () => {
    const nav = getFilteredNavigation("SCHOOL_STAFF", []);
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds).toContain("staff-school");
    expect(allItemIds).not.toContain("staff-academic");
    expect(allItemIds).not.toContain("staff-students");
    expect(allItemIds).not.toContain("staff-attendance");
    expect(allItemIds).not.toContain("staff-reports");
  });

  it("grants ACADEMIC_OPERATOR capability items to SCHOOL_STAFF", () => {
    const nav = getFilteredNavigation("SCHOOL_STAFF", ["ACADEMIC_OPERATOR"]);
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds).toContain("staff-school");
    expect(allItemIds).toContain("staff-academic");
    expect(allItemIds).toContain("staff-attendance");
    expect(allItemIds).not.toContain("staff-students");
  });

  it("grants STUDENT_DATA_OPERATOR capability items to SCHOOL_STAFF", () => {
    const nav = getFilteredNavigation("SCHOOL_STAFF", ["STUDENT_DATA_OPERATOR"]);
    const allItemIds = nav.flatMap((g) => g.items.map((i) => i.id));

    expect(allItemIds).toContain("dashboard");
    expect(allItemIds).toContain("staff-school");
    expect(allItemIds).toContain("staff-students");
    expect(allItemIds).not.toContain("staff-academic");
  });

  it("ensures no duplicate hrefs exist for any role (Bug Prevention)", () => {
    const roles = ["SUPER_ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "SCHOOL_STAFF"] as const;
    for (const role of roles) {
      const nav = getFilteredNavigation(role);
      const hrefs = nav.flatMap((g) => g.items.map((i) => i.href));
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
    }
  });
});
