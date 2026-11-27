"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  MoreVertical,
  Eye,
  DoorOpen,
  LogOut,
  Trash2,
  CreditCard,
  KeyRound,
  Loader2,
} from "lucide-react";

export interface TenantActionMenuProps {
  schoolName: string;
  infoHref: string;
  isCurrentActive: boolean;
  isStatusAktif: boolean;
  isSwitching?: boolean;
  canDelete: boolean;
  onEnterTenant: () => void;
  onExitTenant?: () => void;
  onDeleteTenant?: () => void;
  onManageLicense?: () => void;
  onResetOwnerPassword?: () => void;
}

/**
 * Menu aksi titik-tiga (⋮) terpadu untuk baris tenant Super Admin:
 * - Mata (Eye): Lihat informasi / detail tenant
 * - Pintu (DoorOpen): Masuk ke ruang kerja sekolah (atau Keluar bila sedang aktif)
 * - Tong Sampah (Trash2): Hapus permanen tenant trial / FREEMIUM
 * - Opsional di halaman direktori: Kelola Lisensi & Reset Sandi Pemilik
 */
export function TenantActionMenu({
  schoolName,
  infoHref,
  isCurrentActive,
  isStatusAktif,
  isSwitching = false,
  canDelete,
  onEnterTenant,
  onExitTenant,
  onDeleteTenant,
  onManageLicense,
  onResetOwnerPassword,
}: TenantActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number; openUp: boolean }>({
    top: 0,
    right: 0,
    openUp: false,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 220 && rect.top > 220;
    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      openUp,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (target && !triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const menuContent = isOpen ? (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Menu aksi ${schoolName}`}
      style={{
        position: "fixed",
        top: coords.top,
        right: coords.right,
        transform: coords.openUp ? "translateY(-100%)" : undefined,
      }}
      className="z-50 w-52 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl p-1.5 text-xs animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <Link
        href={infoHref}
        role="menuitem"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
      >
        <Eye className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <span>Lihat Informasi</span>
      </Link>

      {isCurrentActive && onExitTenant ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsOpen(false);
            onExitTenant();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer text-left"
        >
          <LogOut className="size-4 text-slate-600 dark:text-slate-300 shrink-0" />
          <span>Keluar ke Mode Platform</span>
        </button>
      ) : (
        <button
          type="button"
          role="menuitem"
          disabled={isSwitching || !isStatusAktif}
          onClick={() => {
            setIsOpen(false);
            onEnterTenant();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[#2563EB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed text-left"
        >
          {isSwitching ? (
            <Loader2 className="size-4 animate-spin shrink-0" />
          ) : (
            <DoorOpen className="size-4 shrink-0" />
          )}
          <span>Masuk ke Sekolah</span>
        </button>
      )}

      {onManageLicense && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsOpen(false);
            onManageLicense();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer text-left"
        >
          <CreditCard className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Atur Lisensi &amp; Kuota</span>
        </button>
      )}

      {onResetOwnerPassword && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsOpen(false);
            onResetOwnerPassword();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer text-left"
        >
          <KeyRound className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Reset Sandi Pemilik</span>
        </button>
      )}

      {canDelete && onDeleteTenant && (
        <>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDeleteTenant();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold transition-colors cursor-pointer text-left"
          >
            <Trash2 className="size-4 shrink-0" />
            <span>Hapus Tenant</span>
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="inline-flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label={`Aksi tenant ${schoolName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Menu aksi ${schoolName}`}
        className="inline-flex items-center justify-center size-8 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
      >
        <MoreVertical className="size-4" />
      </button>
      {typeof document !== "undefined" ? createPortal(menuContent, document.body) : menuContent}
    </div>
  );
}
