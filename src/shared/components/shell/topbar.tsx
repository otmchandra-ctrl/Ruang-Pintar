"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NotificationEntry } from "./notification-entry";
import { ThemeSwitcher } from "./theme-switcher";
import { Breadcrumb, BreadcrumbItem } from "./breadcrumb";

export interface TopbarProps {
  user: {
    id: string;
    username: string;
    nama_lengkap: string;
    peran_dasar: string;
    sekolah_id?: string | null;
    foto_url?: string | null;
    avatar_id?: string | null;
  };
  breadcrumbItems?: BreadcrumbItem[];
  onOpenMobileDrawer: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}

export function Topbar({
  user,
  breadcrumbItems = [{ label: "Dashboard", href: "/dashboard", isCurrent: true }],
  onOpenMobileDrawer,
  isSidebarCollapsed = false,
  onToggleSidebar,
  className = "",
}: TopbarProps) {
  const router = useRouter();
  return (
    <header
      className={`sticky top-0 z-40 flex h-20 w-full items-center justify-between bg-[#F8FAFC]/80 dark:bg-[#090D16]/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 border-b border-slate-200/50 dark:border-white/5 transition-colors duration-200 ${className}`}
    >
      {/* Left side: Mobile Drawer Trigger + Desktop Sidebar Toggle + Dashboard Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Smartphone Drawer Trigger (< md) */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          aria-label="Buka Menu Navigasi"
          className="md:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
            title={isSidebarCollapsed ? "Perluas Sidebar (Ctrl+B)" : "Ciutkan Sidebar (Ctrl+B)"}
            className="hidden md:flex h-10 w-10 items-center justify-center text-slate-400 hover:text-[#2563EB] hover:bg-slate-200/60 dark:hover:bg-slate-800 dark:hover:text-blue-400 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 cursor-pointer flex-shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Dynamic Title / Breadcrumb (Hidden on mobile view, visible on md+) */}
        <div className="hidden md:flex items-center pl-1 max-w-sm lg:max-w-md xl:max-w-lg truncate">
          {breadcrumbItems && breadcrumbItems.length > 1 ? (
            <Breadcrumb items={breadcrumbItems} />
          ) : (
            <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {breadcrumbItems?.[0]?.label || "Dashboard"}
            </span>
          )}
        </div>
      </div>

      {/* Center: Quick Academic Search (Desktop lg+) */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Cari materi, tugas, pengumuman..."
            aria-label="Cari materi, tugas, atau pengumuman"
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-sans"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                router.push(`/tugas-siswa?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right side: Theme Switcher + Notifications + User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-end min-w-0">
        {/* Action Controls Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Mode Switcher (Ikon bersih tanpa lingkaran) */}
          <ThemeSwitcher />

          {/* Notification Bell */}
          <NotificationEntry />

          {/* User Profile */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
