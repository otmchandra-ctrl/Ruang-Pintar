"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Check } from "lucide-react";
import { DonutGauge } from "./donut-gauge";
import { TeacherLiveBadge } from "./teacher-live-badge";
import { AnimatedCounter } from "@/shared/components/motion/animated-counter";

export interface RombelOption {
  id: string;
  nama: string;
}

export interface PresensiItem {
  status: string;
  sesi_kelas_id: string;
  rombel_id?: string;
}

export interface TeacherAttendanceCardProps {
  hasSessionsToday: boolean;
  totalSessionsToday: number;
  completedSessionsToday: number;
  completedJournalsCount: number;
  rombelOptions: RombelOption[];
  presensiRecords: PresensiItem[];
}

export function TeacherAttendanceCard({
  hasSessionsToday,
  totalSessionsToday,
  completedSessionsToday,
  completedJournalsCount,
  rombelOptions = [],
  presensiRecords = [],
}: TeacherAttendanceCardProps) {
  const [selectedRombelId, setSelectedRombelId] = useState<string>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter presensi records based on selected rombel
  const filteredRecords =
    selectedRombelId === "ALL"
      ? presensiRecords
      : presensiRecords.filter((p) => p.rombel_id === selectedRombelId);

  const totalPresensi = filteredRecords.length;
  const totalHadir = filteredRecords.filter((p) => p.status === "HADIR").length;
  const totalTerlambat = filteredRecords.filter((p) => p.status === "TERLAMBAT").length;
  const totalSakitIzin = filteredRecords.filter(
    (p) => p.status === "SAKIT" || p.status === "IZIN"
  ).length;

  const hadirPercent = totalPresensi > 0 ? Math.round((totalHadir / totalPresensi) * 100) : 0;
  const terlambatPercent =
    totalPresensi > 0 ? Math.round((totalTerlambat / totalPresensi) * 100) : 0;
  const sakitIzinPercent =
    totalPresensi > 0 ? Math.round((totalSakitIzin / totalPresensi) * 100) : 0;
  const kbmProgressPercent = hasSessionsToday
    ? Math.round((completedSessionsToday / totalSessionsToday) * 100)
    : 0;
  const journalPercent =
    completedSessionsToday > 0
      ? Math.round((completedJournalsCount / completedSessionsToday) * 100)
      : 0;

  const currentRombelLabel =
    selectedRombelId === "ALL"
      ? "Semua Rombel"
      : rombelOptions.find((r) => r.id === selectedRombelId)?.nama || "Rombel Terpilih";

  return (
    <div className="rounded-[28px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[20px] border border-white/75 dark:border-white/15 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full">
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  hasSessionsToday ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <h3 className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Rekap Presensi
              </h3>
            </div>

            {/* Filter Rombel - Clean Borderless Inline */}
            <div className="relative inline-flex items-center" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="inline-flex items-center gap-1.5 py-0.5 px-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-mono font-semibold transition-colors cursor-pointer group"
                title="Filter berdasarkan rombel"
              >
                <Filter className="h-3 w-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="max-w-[120px] truncate underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 group-hover:decoration-blue-500">
                  {currentRombelLabel}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 sm:right-auto top-full mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Pilih Rombel
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRombelId("ALL");
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono font-semibold flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors ${
                      selectedRombelId === "ALL"
                        ? "text-blue-600 dark:text-blue-400 font-bold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>Semua Rombel</span>
                    {selectedRombelId === "ALL" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>

                  {rombelOptions.map((rombel) => {
                    const isSelected = selectedRombelId === rombel.id;
                    return (
                      <button
                        key={rombel.id}
                        type="button"
                        onClick={() => {
                          setSelectedRombelId(rombel.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-mono font-semibold flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors ${
                          isSelected
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate">{rombel.nama}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Live Time - Clean Borderless Minimalist */}
          <TeacherLiveBadge className="font-mono text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0" />
        </div>

        {/* Counter Summary */}
        <div className="mt-4">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
            {totalPresensi > 0 ? "Kehadiran Siswa Hari Ini" : "Progres KBM Hari Ini"}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalPresensi > 0 ? (
                <AnimatedCounter value={hadirPercent} decimals={0} suffix="%" duration={1.2} />
              ) : hasSessionsToday ? (
                <AnimatedCounter
                  value={kbmProgressPercent}
                  decimals={0}
                  suffix="%"
                  duration={1.2}
                />
              ) : (
                "-"
              )}
            </span>
            <span
              className={`text-xs font-bold ${
                totalPresensi > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : hasSessionsToday
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {totalPresensi > 0
                ? `${totalHadir} Hadir • ${totalTerlambat} Terlambat (${totalPresensi} Siswa)`
                : hasSessionsToday
                  ? `${completedSessionsToday} dari ${totalSessionsToday} Sesi Tuntas`
                  : "Belum Ada Jadwal KBM Hari Ini"}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Donut Gauges in a clean 4-col row */}
      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
        <DonutGauge
          percentage={totalPresensi > 0 ? hadirPercent : 0}
          displayValue={totalPresensi > 0 ? `${hadirPercent}%` : "-"}
          label="Siswa Hadir"
          color="emerald"
          size={62}
        />
        <DonutGauge
          percentage={totalPresensi > 0 ? terlambatPercent : 0}
          displayValue={totalPresensi > 0 ? `${terlambatPercent}%` : "-"}
          label="Terlambat"
          color="amber"
          size={62}
        />
        <DonutGauge
          percentage={totalPresensi > 0 ? sakitIzinPercent : 0}
          displayValue={totalPresensi > 0 ? `${sakitIzinPercent}%` : "-"}
          label="Sakit/Izin"
          color="blue"
          size={62}
        />
        <DonutGauge
          percentage={completedSessionsToday > 0 ? journalPercent : 0}
          displayValue={completedSessionsToday > 0 ? `${journalPercent}%` : "-"}
          label="Jurnal Diisi"
          color="indigo"
          size={62}
        />
      </div>
    </div>
  );
}
