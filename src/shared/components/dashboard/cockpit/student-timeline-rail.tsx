"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, ChevronRight, Clock, BookOpen } from "lucide-react";
import {
  StudentTodayScheduleItem,
  StudentCbtExamItem,
  StudentAssignmentItem,
} from "@/modules/student/domain/student-experience-types";

interface StudentTimelineRailProps {
  jadwalHariIni: StudentTodayScheduleItem[];
  cbtMendatang?: StudentCbtExamItem[];
  tugasMendatang?: StudentAssignmentItem[];
  rombelNama?: string;
  currentTimeOverride?: Date;
}

export function StudentTimelineRail({
  jadwalHariIni,
  cbtMendatang = [],
  tugasMendatang = [],
  rombelNama,
  currentTimeOverride,
}: StudentTimelineRailProps) {
  // Status sesi aktif & waktu dinamis (auto-update setiap menit)
  const [currentTime, setCurrentTime] = useState<Date>(() => currentTimeOverride || new Date());

  useEffect(() => {
    if (currentTimeOverride) return;

    const update = () => setCurrentTime(new Date());
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
  }, [currentTimeOverride]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const blocksWithStatus = jadwalHariIni.map((item) => {
    const startM = parseTimeToMinutes(item.jamMulai);
    const endM = parseTimeToMinutes(item.jamSelesai);
    const isCurrent = currentMinutes >= startM && currentMinutes <= endM;
    const isPast = currentMinutes > endM;
    const isFuture = currentMinutes < startM;

    return {
      ...item,
      isCurrent,
      isPast,
      isFuture,
    };
  });

  const activeSession = blocksWithStatus.find((b) => b.isCurrent);

  const hariMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanMap = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const namaHari = hariMap[currentTime.getDay()];
  const tgl = currentTime.getDate();
  const bln = bulanMap[currentTime.getMonth()];
  const thn = currentTime.getFullYear();
  const jamStr = String(currentTime.getHours()).padStart(2, "0");
  const menitStr = String(currentTime.getMinutes()).padStart(2, "0");
  const fullDateTimeFormatted = `${namaHari}, ${tgl} ${bln} ${thn} • ${jamStr}:${menitStr} WIB`;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. CARD LINIMASA JADWAL PELAJARAN HARI INI ── */}
      <div className="rounded-[28px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/75 dark:border-white/15 p-5 sm:p-6 shadow-[0_20px_50px_rgba(37,99,235,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Jadwal Pelajaran Hari Ini
              </h3>
              <Link
                href="/jadwal-saya"
                className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
              {jadwalHariIni.length > 0
                ? `${jadwalHariIni.length} sesi pembelajaran hari ini`
                : "Tidak ada jadwal hari ini"}
            </span>
          </div>

          {/* Badge Tanggal & Jam */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 text-[10px] sm:text-[11px] font-mono font-bold border border-blue-200/80 dark:border-blue-800/80 shadow-2xs"
            >
              <span className="size-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400 animate-pulse" />
              <span suppressHydrationWarning>{fullDateTimeFormatted}</span>
            </span>
          </div>
        </div>

        {/* Timeline Items */}
        {jadwalHariIni.length === 0 ? (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/30 dark:from-blue-950/40 dark:via-slate-900/70 dark:to-blue-900/30 border border-dashed border-blue-200/80 dark:border-blue-500/30 text-center space-y-2">
            <CalendarIcon className="h-8 w-8 text-blue-500/70 dark:text-blue-400 mx-auto" />
            <h4 className="font-mono text-xs font-bold text-slate-800 dark:text-white">
              Tidak Ada Jadwal Hari Ini
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Selamat belajar mandiri, mengeksplorasi modul pembelajaran, atau menyelesaikan tugas
              di Ruang Pintar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. Card Hero "Sedang Berlangsung" di Paling Atas */}
            {activeSession && (
              <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-blue-500/20 dark:shadow-[0_0_25px_rgba(37,99,235,0.35)] space-y-3 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-blue-200">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Sedang Berlangsung</span>
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-extrabold line-clamp-1 text-white">
                        {activeSession.mataPelajaranNama}
                      </h4>
                      {activeSession.totalJp && activeSession.totalJp > 1 && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/25">
                          {activeSession.totalJp} JP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-100 font-medium truncate">
                      Guru: {activeSession.guruNama} • {activeSession.ruangan || "Ruang Kelas"}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md shrink-0">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-blue-100 font-mono font-semibold text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-blue-200" />
                    <span>
                      {activeSession.jamMulai} - {activeSession.jamSelesai} WIB
                    </span>
                  </div>

                  <Link
                    href="/tugas-siswa"
                    className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/35 text-white font-semibold text-xs backdrop-blur-sm border border-white/25 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer shadow-xs self-start sm:self-auto"
                    title="Buka Materi & Tugas Pembelajaran"
                  >
                    <span>Buka Materi & Tugas</span>
                    <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
                  </Link>
                </div>
              </div>
            )}

            {/* 2. Linimasa Seluruh Jadwal Pembelajaran Hari Ini (Kronologis Lengkap & Seragam) */}
            <div className="space-y-3 relative pl-4 border-l-2 border-dashed border-blue-200 dark:border-slate-700">
              {blocksWithStatus.map((block) => (
                <div key={block.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div
                    className={`absolute rounded-full ring-4 ring-white dark:ring-slate-900 shadow-sm ${
                      block.isCurrent
                        ? "top-3.5 -left-[23px] h-3.5 w-3.5 bg-blue-600 ring-blue-100 dark:ring-blue-900/60"
                        : "top-3.5 -left-[21px] h-2.5 w-2.5 bg-slate-300 dark:bg-slate-600"
                    }`}
                  />

                  <div
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                      block.isCurrent
                        ? "bg-blue-50/70 hover:bg-blue-50/90 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 border-blue-200/90 dark:border-blue-800/80"
                        : "bg-white/80 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-slate-800"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {block.mataPelajaranNama}
                        </h5>
                        {block.totalJp && block.totalJp > 1 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                            {block.totalJp} JP
                          </span>
                        )}
                        {block.isCurrent && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                            Sedang Berlangsung
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {block.guruNama} • {block.ruangan || "Ruang Kelas"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left sm:text-right font-mono">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                          {block.jamMulai}
                        </span>
                        <span className="text-[10px] text-slate-400">s/d {block.jamSelesai}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/tugas-siswa"
                          className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                          title="Buka Materi & Tugas"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
