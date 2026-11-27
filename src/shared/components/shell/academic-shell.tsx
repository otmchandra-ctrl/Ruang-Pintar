"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileDrawer } from "./mobile-drawer";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { BreadcrumbItem } from "./breadcrumb";
import { BaseRole, CapabilityBundle } from "@/shared/infrastructure/authorization/types";
import { ThemeProvider } from "./theme-provider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, LogOut, Loader2 } from "lucide-react";
import { clearActiveTenantAction } from "@/app/actions/tenant-actions";

const teacherWorkspaceRoutes = [
  "/dashboard",
  "/kelas-saya",
  "/data-siswa",
  "/materi",
  "/jadwal-saya",
  "/sesi-pembelajaran",
  "/kalender-akademik",
  "/presensi-kelas",
  "/penilaian",
  "/cbt-ujian",
  "/asisten-ai",
  "/guru-pengajaran",
  "/wali-kelas",
  "/pimpinan",
  "/onboarding",
];

export interface AcademicShellProps {
  user: {
    id: string;
    username: string;
    nama_lengkap: string;
    peran_dasar: string;
    sekolah_id?: string | null;
    foto_url?: string | null;
    avatar_id?: string | null;
    is_owner_tenant?: boolean;
  };
  userCapabilities?: CapabilityBundle[];
  breadcrumbItems?: BreadcrumbItem[];
  isSubscribed?: boolean;
  activeSchoolName?: string | null;
  children: React.ReactNode;
}

export function AcademicShell({
  user,
  userCapabilities = [],
  breadcrumbItems,
  isSubscribed = false,
  activeSchoolName = null,
  children,
}: AcademicShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [isClearingTenant, setIsClearingTenant] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hasActiveTenant = Boolean(user.sekolah_id);
  const isSuperAdminInTenant = user.peran_dasar === "SUPER_ADMIN" && hasActiveTenant;
  const isTeacherWorkspace =
    user.peran_dasar === "TEACHER" &&
    teacherWorkspaceRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  React.useEffect(() => {
    document.documentElement.classList.toggle("teacher-workspace", isTeacherWorkspace);

    return () => document.documentElement.classList.remove("teacher-workspace");
  }, [isTeacherWorkspace]);

  // Global Keyboard Shortcut: Cmd+B / Ctrl+B to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hak owner tenant untuk peran TEACHER HANYA berlaku untuk Guru Mandiri (Solo Teacher Workspace di luar sekolah berlangganan)
  const isOwner =
    user.peran_dasar === "TEACHER"
      ? !isSubscribed && Boolean(user.is_owner_tenant)
      : Boolean(user.is_owner_tenant);

  return (
    <ThemeProvider>
      <div
        className={`flex h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
          isTeacherWorkspace ? "teacher-workspace" : ""
        }`}
      >
        {/* Desktop Sidebar / Rail */}
        <Sidebar
          user={user}
          userRole={user.peran_dasar as BaseRole}
          userCapabilities={userCapabilities}
          isOwner={isOwner}
          hasActiveTenant={hasActiveTenant}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSubscribed={isSubscribed}
        />

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          userRole={user.peran_dasar as BaseRole}
          userCapabilities={userCapabilities}
          isOwner={isOwner}
          hasActiveTenant={hasActiveTenant}
        />

        {/* Main Content Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden relative bg-[#F8FAFC] dark:bg-[#090D16] dashboard-viewport-canvas">
          {/* Topbar */}
          <Topbar
            user={user}
            breadcrumbItems={breadcrumbItems}
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Scrollable Page Body with bottom clearance on mobile (< md) for MobileBottomNav */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 pb-24 md:pb-12 pt-2">
            {isSuperAdminInTenant && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Building2 className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#1D4ED8] dark:text-blue-300 block sm:inline">
                      Mode Dukungan Sekolah Aktif
                    </span>
                    <span className="hidden sm:inline text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold truncate block sm:inline">
                      {activeSchoolName || "Sekolah Terpilih"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/sekolah"
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 hover:bg-blue-100/60 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 font-semibold transition-colors whitespace-nowrap"
                  >
                    Ganti Sekolah
                  </Link>
                  <button
                    type="button"
                    disabled={isClearingTenant}
                    onClick={async () => {
                      setIsClearingTenant(true);
                      try {
                        const res = await clearActiveTenantAction();
                        if (res.success) {
                          router.push("/dashboard");
                          router.refresh();
                        }
                      } finally {
                        setIsClearingTenant(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {isClearingTenant ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <LogOut className="size-3.5" />
                    )}
                    <span>Keluar ke Mode Platform</span>
                  </button>
                </div>
              </div>
            )}
            <div className="w-full">{children}</div>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (< md) */}
        <MobileBottomNav
          userRole={user.peran_dasar as BaseRole}
          userCapabilities={userCapabilities}
          isOwner={isOwner}
          hasActiveTenant={hasActiveTenant}
          onOpenMenu={() => setIsMobileDrawerOpen(true)}
        />
      </div>
    </ThemeProvider>
  );
}
