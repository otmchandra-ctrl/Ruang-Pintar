"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

/**
 * Format tanggal lengkap Indonesia (e.g., "Senin, 06 Oktober 2026")
 */
export function formatFullIndonesianDate(d: Date): string {
  const raw = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // Pastikan huruf kapital pada setiap awal kata
  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format waktu WIB (e.g., "16:42 WIB")
 */
export function formatTimeWIB(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} WIB`;
}

/**
 * Format badge live (e.g., "Sen, 06 Okt • 16:42 WIB")
 */
export function formatLiveDateBadge(d: Date): string {
  const dayShort = d.toLocaleDateString("id-ID", { weekday: "short" }).replace(/\.$/, "");
  const dayNum = String(d.getDate()).padStart(2, "0");
  const monthShort = d.toLocaleDateString("id-ID", { month: "short" }).replace(/\.$/, "");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  const capDay = dayShort.charAt(0).toUpperCase() + dayShort.slice(1);
  const capMonth = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);

  return `${capDay}, ${dayNum} ${capMonth} • ${hh}:${mm} WIB`;
}

export interface ActiveSessionInfo {
  rombel_nama: string;
  mata_pelajaran_nama: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  status?: "BERLANGSUNG" | "AKAN_DATANG" | "SELESAI";
  sesi_id?: string;
  rombel_id?: string;
}

export interface TeacherCompactHeaderProps {
  className?: string;
  dateOverride?: string;
  timeOverride?: string;
  badgeOverride?: string;
  initialDate?: Date;
  activeSession?: ActiveSessionInfo | null;
}

/**
 * Header ringkas dashboard guru untuk tampilan mobile (<768px).
 * Bertindak sebagai Live Teaching Cockpit Card: menampilkan sesi mengajar aktif/terdekat jika ada,
 * atau status kalender KBM hari ini dengan live date badge.
 * Auto-update waktu setiap 60 detik (1 menit).
 */
export function TeacherCompactHeader({
  className,
  dateOverride,
  timeOverride,
  badgeOverride,
  initialDate,
  activeSession,
}: TeacherCompactHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date>(() => initialDate || new Date());

  useEffect(() => {
    if (dateOverride && timeOverride && badgeOverride) return;

    const update = () => setCurrentTime(new Date());

    // Hitung sisa milidetik ke menit berikutnya agar transisi menit akurat tepat di detik 00
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let intervalId: NodeJS.Timeout | undefined;
    const initialTimeout = setTimeout(
      () => {
        update();
        intervalId = setInterval(update, 60000);
      },
      Math.max(msToNextMinute, 1000)
    );

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [dateOverride, timeOverride, badgeOverride]);

  const displayDate = dateOverride || formatFullIndonesianDate(currentTime);
  const displayTime = timeOverride || formatTimeWIB(currentTime);
  const displayBadge = badgeOverride || formatLiveDateBadge(currentTime);

  // Jika terdapat sesi KBM aktif atau terdekat hari ini
  if (activeSession) {
    const isOngoing = activeSession.status === "BERLANGSUNG";
    const isCompleted = activeSession.status === "SELESAI";

    return (
      <header
        data-testid="teacher-compact-header"
        className={`md:hidden rounded-[24px] bg-white/95 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 p-4 sm:p-5 shadow-xs dark:shadow-[0_0_25px_-5px_rgba(37,99,235,0.15)] flex flex-col gap-3 transition-all ${
          className || ""
        }`}
      >
        {/* Top Meta: Status Sesi & Live Clock */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isOngoing
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60"
                : isCompleted
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70"
                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOngoing
                  ? "bg-emerald-500 animate-pulse"
                  : isCompleted
                    ? "bg-slate-400"
                    : "bg-blue-500"
              }`}
            />
            <span>
              {isOngoing
                ? "Sedang Berlangsung"
                : isCompleted
                  ? "Sesi Selesai"
                  : `Sesi Terdekat • ${activeSession.jam_mulai} WIB`}
            </span>
          </span>

          <span
            data-testid="compact-header-badge"
            suppressHydrationWarning
            className="text-[11px] font-mono text-slate-500 dark:text-slate-400"
          >
            {displayBadge}
          </span>
        </div>

        {/* Content: Nama Rombel & Mapel */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-mono text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
              {activeSession.rombel_nama}
            </h1>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
              • {activeSession.mata_pelajaran_nama}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2 flex-wrap">
            <span
              data-testid="compact-header-time"
              suppressHydrationWarning
              className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1"
            >
              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
              <span>
                {activeSession.jam_mulai} – {activeSession.jam_selesai} WIB
              </span>
            </span>
            {activeSession.ruangan && (
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                ({activeSession.ruangan})
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Buka Sesi KBM */}
        <div className="pt-1 flex items-center gap-2">
          <a
            href={
              activeSession.sesi_id
                ? `/sesi-pembelajaran?id=${activeSession.sesi_id}`
                : `/sesi-pembelajaran`
            }
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-mono text-xs font-bold text-center shadow-xs shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            {isOngoing ? "Masuk Sesi KBM & Presensi →" : "Buka Sesi KBM →"}
          </a>
        </div>
      </header>
    );
  }

  // Fallback / Default View (Jika tidak ada sesi hari ini, atau saat test)
  return (
    <header
      data-testid="teacher-compact-header"
      className={`md:hidden rounded-[24px] bg-white/95 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 p-5 shadow-xs dark:shadow-[0_0_25px_-5px_rgba(37,99,235,0.15)] flex items-start justify-between gap-4 transition-all ${
        className || ""
      }`}
    >
      <div className="space-y-1 min-w-0">
        <h1 className="font-mono text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
          Jadwal Mengajar
        </h1>
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          <div data-testid="compact-header-date" suppressHydrationWarning>
            {displayDate}
          </div>
          <div
            data-testid="compact-header-time"
            suppressHydrationWarning
            className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5"
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span suppressHydrationWarning>{displayTime}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 pt-0.5">
        <span
          data-testid="compact-header-badge"
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span suppressHydrationWarning>{displayBadge}</span>
        </span>
      </div>
    </header>
  );
}
