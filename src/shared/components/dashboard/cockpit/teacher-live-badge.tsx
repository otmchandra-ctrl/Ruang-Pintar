"use client";

import React, { useState, useEffect } from "react";
import { formatLiveDateBadge } from "./teacher-compact-header";

export interface TeacherLiveBadgeProps {
  override?: string;
  className?: string;
}

/**
 * Badge tanggal dan waktu aktual yang diperbarui otomatis setiap 60 detik.
 * Menggantikan badge statis "Hari Ini" pada TeachingTimelineRail dan Rekap Presensi.
 */
export function TeacherLiveBadge({ override, className }: TeacherLiveBadgeProps) {
  const [badgeText, setBadgeText] = useState<string>(() => {
    if (override) return override;
    return formatLiveDateBadge(new Date());
  });

  useEffect(() => {
    if (override) return;

    const update = () => {
      setBadgeText(formatLiveDateBadge(new Date()));
    };

    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let intervalId: NodeJS.Timeout | undefined;
    const timeoutId = setTimeout(
      () => {
        update();
        intervalId = setInterval(update, 60000);
      },
      Math.max(msToNextMinute, 1000)
    );

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [override]);

  return (
    <span
      data-testid="teacher-live-badge"
      suppressHydrationWarning
      className={
        className ||
        "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs whitespace-nowrap"
      }
    >
      {badgeText}
    </span>
  );
}
