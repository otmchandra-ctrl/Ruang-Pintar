"use client";

import React from "react";
import Link from "next/link";
import { MonitorPlay, ChevronRight, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { StudentCbtExamItem } from "@/modules/student/domain/student-experience-types";

export interface StudentCbtCardProps {
  exams: StudentCbtExamItem[];
  className?: string;
}

export function StudentCbtCard({ exams, className = "" }: StudentCbtCardProps) {
  return (
    <div
      className={`rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] border border-white/80 dark:border-white/15 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex flex-col justify-between space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900/40">
            <MonitorPlay className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              CBT & Ujian Online
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
              Evaluasi, asesmen, dan kuis akademik
            </p>
          </div>
        </div>

        <Link
          href="/cbt-ujian"
          className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
        >
          <span>Semua Ujian</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* CBT Exam List */}
      {exams.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-blue-500/10 text-center flex flex-col items-center justify-center space-y-2">
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <CheckCircle2 className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs">
            Belum ada agenda ujian CBT aktif atau terjadwal saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-hidden">
          {exams.slice(0, 3).map((cbt) => {
            const isCompleted =
              cbt.statusUjian === "SELESAI" ||
              cbt.attempt?.status === "DIKUMPULKAN" ||
              cbt.attempt?.status === "WAKTU_HABIS";
            const isOngoingAttempt = cbt.attempt?.status === "SEDANG_MENGERJAKAN";

            return (
              <div
                key={cbt.ujianId}
                className="p-3.5 rounded-2xl bg-white/80 hover:bg-blue-50/50 dark:bg-slate-900/80 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-white/10 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {cbt.judul}
                    </h4>
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {cbt.mataPelajaranNama} • Guru: {cbt.guruNama}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 shrink-0">
                    {cbt.durasiMenit} menit
                  </span>
                </div>

                {/* Footer Meta & Conditional Action Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span>KKTP: {cbt.kkmKktp}</span>
                    <span>•</span>
                    <span>{cbt.gunakanToken ? "Token" : "Bebas"}</span>
                  </div>

                  {/* Contextual Action Button */}
                  <div>
                    {cbt.isAvailable ? (
                      <Link
                        href="/cbt-ujian"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <MonitorPlay className="h-3 w-3" />
                        <span>{cbt.actionLabel || "Mulai Ujian Online"}</span>
                      </Link>
                    ) : isCompleted ? (
                      <Link
                        href="/cbt-ujian"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>Lihat Rekap</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[10px] font-bold">
                        <Clock className="h-3 w-3" />
                        <span>Akan Datang</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
