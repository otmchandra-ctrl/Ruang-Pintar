"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, BarChart2 } from "lucide-react";
import { motion } from "@/shared/components/motion/motion-elements";

export interface SubjectProgressItem {
  id: string;
  nama: string;
  kode?: string;
  guruNama?: string;
  persentase: number; // 0 - 100
  totalTugas?: number;
  tugasSelesai?: number;
}

export interface StudentProgressCardProps {
  items: SubjectProgressItem[];
  className?: string;
}

function getMapelCode(nama: string, kode?: string): string {
  if (kode && kode.trim()) {
    return kode.trim().length > 6 ? kode.trim().substring(0, 6) : kode.trim().toUpperCase();
  }
  const clean = nama.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return clean.substring(0, 3).toUpperCase();
}

export function StudentProgressCard({ items = [], className = "" }: StudentProgressCardProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const hasData = items.length > 0;
  const chartData = hasData ? items.slice(0, 6) : [];

  const highestProgress = hasData ? Math.max(...chartData.map((d) => d.persentase), 0) : 0;
  const bestItem = hasData
    ? chartData.find((d) => d.persentase === highestProgress) || chartData[0]
    : null;
  const hoveredItem = hoveredId ? chartData.find((d) => d.id === hoveredId) : null;
  const activeDisplay = hoveredItem || bestItem;

  return (
    <div
      className={`rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] border border-white/80 dark:border-white/15 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex flex-col justify-between h-full ${className}`}
    >
      {/* Header Row */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Progres Belajar
            </h3>
          </div>
          <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Semester Ini
          </span>
        </div>

        {hasData && activeDisplay ? (
          /* Top Highlight & Action Button */
          <div className="flex items-end justify-between gap-3 mt-4">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block truncate">
                {hoveredItem ? "Mata Pelajaran Terpilih" : "Ketuntasan Tertinggi"}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeDisplay.persentase}%
                </span>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold leading-tight min-w-0">
                  <span
                    className="truncate block max-w-[150px] sm:max-w-[200px]"
                    title={activeDisplay.nama}
                  >
                    {activeDisplay.nama}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {activeDisplay.totalTugas && activeDisplay.totalTugas > 0
                      ? `${activeDisplay.tugasSelesai ?? 0}/${activeDisplay.totalTugas} Tugas Selesai`
                      : "Belum Ada Tugas"}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/materi-tugas"
              className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-mono font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>Lihat Detail</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
              Ketuntasan Belajar Siswa
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                -
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Belum Ada Mata Pelajaran Aktif
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area: Animated Blue Stick Bars */}
      {hasData ? (
        <div className="pt-5 pb-1 relative" onMouseLeave={() => setHoveredId(null)}>
          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-32 sm:h-36 px-1 relative z-10">
            {chartData.map((item, idx) => {
              const isTop = item.persentase === highestProgress && highestProgress > 0;
              const isHovered = hoveredId === item.id;
              const isDimmed = hoveredId !== null && !isHovered;
              // Tinggi bar minimal 10% agar bentuk kapsul tetap tampak proporsional
              const heightPercent = Math.min(100, Math.max(10, item.persentase));
              const displayCode = getMapelCode(item.nama, item.kode);

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer transition-all duration-300"
                >
                  {/* Score percentage floating above bar */}
                  <span
                    className={`font-mono transition-all duration-300 mb-1.5 text-center ${
                      isHovered
                        ? "text-blue-600 dark:text-blue-400 font-black text-xs sm:text-sm scale-110 drop-shadow-sm"
                        : isDimmed
                          ? "opacity-30 blur-[0.3px] text-[10px] sm:text-[11px] font-bold text-slate-400"
                          : isTop
                            ? "text-blue-600 dark:text-blue-400 font-extrabold text-[10px] sm:text-[11px]"
                            : "text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold"
                    }`}
                  >
                    {item.persentase}%
                  </span>

                  {/* Pill Track Bar Container */}
                  <div
                    className={`w-full max-w-[28px] sm:max-w-[34px] h-24 sm:h-28 rounded-full p-1 flex flex-col justify-end overflow-hidden transition-all duration-300 ${
                      isHovered
                        ? "bg-blue-100/80 dark:bg-blue-900/40 ring-2 ring-blue-500/50 scale-105 shadow-lg shadow-blue-500/25"
                        : isDimmed
                          ? "bg-slate-100/50 dark:bg-slate-800/40 opacity-40 blur-[0.5px] scale-95"
                          : "bg-slate-100 dark:bg-slate-800/80"
                    }`}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{
                        duration: 0.7,
                        delay: idx * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`w-full rounded-full transition-all duration-300 ${
                        isHovered
                          ? "bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 shadow-md shadow-blue-500/40"
                          : isDimmed
                            ? "bg-gradient-to-t from-blue-300/60 to-blue-200/50 dark:from-blue-800/40 dark:to-blue-700/30"
                            : isTop
                              ? "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-sm shadow-blue-500/30"
                              : "bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500"
                      }`}
                    />
                  </div>

                  {/* Subject Code Label Underneath */}
                  <div className="mt-2 w-full flex items-center justify-center min-h-[26px]">
                    <span
                      title={item.nama}
                      className={`text-[9px] sm:text-[10px] font-mono leading-[1.15] text-center max-w-full break-words transition-all duration-300 ${
                        isHovered
                          ? "text-blue-600 dark:text-blue-400 font-black scale-105"
                          : isDimmed
                            ? "opacity-40 text-slate-400"
                            : isTop
                              ? "text-blue-600 dark:text-blue-400 font-extrabold"
                              : "text-slate-600 dark:text-slate-400 font-bold"
                      }`}
                    >
                      {displayCode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sub context footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-slate-500 font-mono truncate max-w-[200px]">
              {hoveredItem?.guruNama
                ? `Pengampu: ${hoveredItem.guruNama}`
                : `Total ${items.length} Mapel Aktif`}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-bold font-mono shrink-0">
              {hoveredItem
                ? hoveredItem.totalTugas && hoveredItem.totalTugas > 0
                  ? `${hoveredItem.tugasSelesai ?? 0}/${hoveredItem.totalTugas} tugas diselesaikan`
                  : "Belum ada tugas"
                : "Sorot bar untuk detail"}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-6 px-4 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#2563EB] dark:text-blue-400 shadow-xs">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Mata Pelajaran
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Data mata pelajaran dan penugasan Anda akan ditampilkan di sini begitu rombel aktif
              berjalan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
