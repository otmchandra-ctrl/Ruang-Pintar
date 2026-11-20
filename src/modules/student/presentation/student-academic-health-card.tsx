"use client";

/**
 * Ruang Pintar — Student Academic Health Card (Academic Glass UI v1.2)
 *
 * STAGE UX-04: Student Directory & Academic Health Monitoring
 * Kartu profil akademik siswa dengan 4 indikator glass, status kesehatan otomatis,
 * aksi Chat, dan Catatan Internal Guru.
 */

import React from "react";
import {
  Calendar,
  ClipboardList,
  Target,
  Trophy,
  MessageSquare,
  AlertTriangle,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { StudentAcademicDirectoryItemDTO } from "../domain/student-academic-directory-types";

interface StudentAcademicHealthCardProps {
  student: StudentAcademicDirectoryItemDTO;
  onSelectStudent: (
    student: StudentAcademicDirectoryItemDTO,
    initialTab?: "Overview" | "Presensi" | "Tugas" | "Nilai" | "TP" | "Catatan"
  ) => void;
  onOpenChat: (student: StudentAcademicDirectoryItemDTO) => void;
}

export function StudentAcademicHealthCard({
  student,
  onSelectStudent,
  onOpenChat,
}: StudentAcademicHealthCardProps) {
  // Resolusi badge status kesehatan akademik
  const renderHealthBadge = () => {
    switch (student.health_status) {
      case "AMAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Aman</span>
          </span>
        );
      case "PERLU_PERHATIAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Perlu Perhatian</span>
          </span>
        );
      case "RISIKO_AKADEMIK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Risiko Akademik</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelectStudent(student, "Overview")}
      className="group relative rounded-2xl backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-xl hover:border-blue-400/50 dark:hover:border-blue-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
    >
      {/* Header Kartu: Avatar, Nama, NISN & Health Badge */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 overflow-hidden">
              {student.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.foto_url}
                  alt={student.nama_lengkap}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {student.nama_lengkap
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {student.nama_lengkap}
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {student.nisn
                  ? `NISN: ${student.nisn}`
                  : student.nis
                    ? `NIS: ${student.nis}`
                    : "Siswa"}
              </p>
            </div>
          </div>
        </div>

        {/* Status Akademik */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Status Akademik
          </span>
          {renderHealthBadge()}
        </div>
      </div>

      {/* 4 Academic Health Indicator Boxes (Glass Mini Matrix) */}
      <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        {/* Kehadiran */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2 shadow-2xs">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-none">
              Kehadiran
            </span>
            <span className="block text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {student.kehadiran_persen}%
            </span>
          </div>
        </div>

        {/* Tugas */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2 shadow-2xs">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <ClipboardList className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-none">
              Tugas
            </span>
            <span className="block text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {student.tugas_selesai} / {student.tugas_total}
            </span>
          </div>
        </div>

        {/* TP (Tujuan Pembelajaran) */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2 shadow-2xs">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-none">
              TP
            </span>
            <span className="block text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {student.tp_selesai} / {student.tp_total}
            </span>
          </div>
        </div>

        {/* Nilai Rata-rata */}
        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2 shadow-2xs">
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-none">
              Nilai
            </span>
            <span className="block text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {student.nilai_rata_rata || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar: [💬 Chat] & [⚠ Catatan] */}
      <div className="pt-1 flex items-center gap-2">
        {/* Tombol Chat */}
        <button
          type="button"
          aria-label={`Chat ${student.nama_lengkap}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenChat(student);
          }}
          className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          <span>Chat</span>
        </button>

        {/* Tombol Catatan Internal */}
        <button
          type="button"
          aria-label={`Catatan Internal ${student.nama_lengkap}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectStudent(student, "Catatan");
          }}
          className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>Catatan</span>
        </button>
      </div>
    </div>
  );
}
