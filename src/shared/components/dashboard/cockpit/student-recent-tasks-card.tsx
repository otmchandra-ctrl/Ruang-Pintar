"use client";

import React from "react";
import Link from "next/link";
import { ClipboardList, ChevronRight, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StudentAssignmentItem } from "@/modules/student/domain/student-experience-types";

export interface StudentRecentTasksCardProps {
  tasks: StudentAssignmentItem[];
  className?: string;
}

export function StudentRecentTasksCard({ tasks, className = "" }: StudentRecentTasksCardProps) {
  const [nowMs] = React.useState(() => Date.now());

  // Urutkan tugas: yang belum dikumpulkan ditaruh paling atas, prioritaskan tenggat paling dekat
  const sortedTasks = [...tasks].sort((a, b) => {
    const aSubmitted = a.statusPengerjaan === "SUDAH_DIKUMPULKAN";
    const bSubmitted = b.statusPengerjaan === "SUDAH_DIKUMPULKAN";
    if (aSubmitted !== bSubmitted) {
      return aSubmitted ? 1 : -1;
    }
    const aTime = a.batasWaktu ? new Date(a.batasWaktu).getTime() : Infinity;
    const bTime = b.batasWaktu ? new Date(b.batasWaktu).getTime() : Infinity;
    return aTime - bTime;
  });

  return (
    <div
      className={`rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] border border-white/80 dark:border-white/15 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex flex-col justify-between space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
            <ClipboardList className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tugas Terbaru
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
              Penugasan aktif & tenggat pengumpulan
            </p>
          </div>
        </div>

        <Link
          href="/tugas-siswa"
          className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-blue-500/10 text-center flex flex-col items-center justify-center space-y-2">
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs">
            Semua tugas tuntas! Belum ada tugas baru yang perlu dikerjakan.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-hidden">
          {sortedTasks.slice(0, 4).map((task) => {
            const isSubmitted = task.statusPengerjaan === "SUDAH_DIKUMPULKAN";
            const isLate =
              task.statusPengerjaan === "TERLAMBAT" || (task.isPastDeadline && !isSubmitted);

            // Cek apakah tenggat mendekati (dalam 48 jam)
            let isUrgent = false;
            if (!isSubmitted && task.batasWaktu) {
              const diffMs = new Date(task.batasWaktu).getTime() - nowMs;
              isUrgent = diffMs > 0 && diffMs < 48 * 60 * 60 * 1000;
            }

            return (
              <Link
                key={task.id}
                href="/tugas-siswa"
                className={`p-3 rounded-2xl border transition-all flex flex-col gap-1.5 shadow-2xs hover:shadow-xs group ${
                  isUrgent
                    ? "bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/30 dark:hover:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60"
                    : isSubmitted
                      ? "bg-slate-50/50 hover:bg-slate-50/80 dark:bg-slate-900/50 dark:hover:bg-slate-900/70 border-slate-200/60 dark:border-white/10 opacity-80"
                      : "bg-white/80 hover:bg-blue-50/50 dark:bg-slate-900/80 dark:hover:bg-blue-950/40 border-slate-200/70 dark:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {task.judul}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-sans">
                      {task.mataPelajaranNama} • Guru: {task.guruNama}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Selesai</span>
                      </span>
                    ) : isLate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Terlambat</span>
                      </span>
                    ) : isUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 animate-pulse">
                        <Clock className="h-3 w-3" />
                        <span>Mendesak</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60">
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Deadline Info */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>
                    Batas:{" "}
                    {task.batasWaktuFormatted ? task.batasWaktuFormatted : "Tidak ada batas waktu"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
