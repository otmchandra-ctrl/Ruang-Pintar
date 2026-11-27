"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, Users, Clock, BookOpen, ExternalLink } from "lucide-react";
import { Toast, ToastType } from "@/shared/components/ui/toast";
import { TeacherClassWorkspaceDTO } from "@/modules/learning/domain/learning-types";
import {
  DefinisiAsesmenDTO,
  ClassGradebookDTO,
} from "@/modules/assessment/domain/assessment-types";
import { ClassAttendanceRecapDTO } from "@/modules/attendance/domain/attendance-types";
import { ClassAssessmentTabView } from "./class-assessment-tab-view";

export interface GradebookClassDetailViewProps {
  workspace: TeacherClassWorkspaceDTO;
  canManage: boolean;
  assessments: DefinisiAsesmenDTO[];
  gradebook: ClassGradebookDTO;
  attendanceRecap?: ClassAttendanceRecapDTO | null;
}

/**
 * Tampilan detail Buku Nilai & Penilaian TP untuk satu penugasan kelas di bawah rute /penilaian/[id].
 */
export function GradebookClassDetailView({
  workspace,
  canManage,
  assessments,
  gradebook,
  attendanceRecap,
}: GradebookClassDetailViewProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { penugasan, total_siswa, lingkup_materi } = workspace;

  return (
    <div className="space-y-5 pb-16">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Kelas Buku Nilai */}
      <div className="rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/penilaian"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Buku Nilai &amp; Rapor</span>
          </Link>

          <Link
            href={`/kelas-saya/${penugasan.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Buka Ruang Kelas</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 text-xs font-bold">
              <GraduationCap className="h-3.5 w-3.5" />
              Buku Nilai &amp; Penilaian TP
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black">
              {penugasan.rombel_nama}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {penugasan.mata_pelajaran_nama}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Guru:{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {penugasan.guru_nama}
              </strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-[#2563EB]" />
              {total_siswa} Siswa
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              {penugasan.jumlah_jam_minggu > 0 ? `${penugasan.jumlah_jam_minggu} JP` : "0 JP"}
            </span>
            <span>•</span>
            <span>
              {penugasan.semester_nama?.toLowerCase().startsWith("semester")
                ? penugasan.semester_nama
                : `Semester ${penugasan.semester_nama || "Ganjil"}`}{" "}
              • TA {penugasan.tahun_ajaran_nama}
            </span>
          </div>
        </div>
      </div>

      {/* Matriks Leger Terpadu & Daftar Asesmen */}
      <ClassAssessmentTabView
        penugasanId={penugasan.id}
        canManage={canManage}
        assessments={assessments}
        gradebook={gradebook}
        lingkupMateriList={lingkup_materi}
        attendanceRecap={attendanceRecap}
        onRefresh={() => router.refresh()}
        onShowToast={(message, type) => setToast({ message, type })}
      />
    </div>
  );
}
