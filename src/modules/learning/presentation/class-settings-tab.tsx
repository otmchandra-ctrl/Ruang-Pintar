"use client";

/**
 * Ruang Pintar — Class Settings Tab (Academic Glass UI)
 *
 * Tab Pengaturan Detail Kelas:
 * 1. Kode Akses & Pendaftaran Mandiri Siswa (RombelJoinCodeCard)
 * 2. Informasi & Konfigurasi SK Penugasan Kurikulum
 * 3. Integrasi Penilaian Akademik (Buku Nilai & Rapor)
 * 4. Batasan Otorisasi & Hak Akses Guru
 */

import React from "react";
import Link from "next/link";
import { Settings, Users, GraduationCap, ShieldCheck, ArrowUpRight, Lock } from "lucide-react";
import { TeacherClassWorkspaceDTO } from "../domain/learning-types";
import { RombelJoinCodeCard } from "@/modules/student/presentation/rombel-join-code-card";

interface ClassSettingsTabProps {
  workspace: TeacherClassWorkspaceDTO;
  canManage: boolean;
}

export function ClassSettingsTab({ workspace, canManage }: ClassSettingsTabProps) {
  const { penugasan } = workspace;

  return (
    <div className="space-y-6">
      {/* 1. KODE AKSES PENDAFTARAN MANDIRI SISWA */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Kode Akses & Pendaftaran Mandiri Murid
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bagikan kode gabung rombel kepada murid untuk otomatisasi pendaftaran akun kelas.
            </p>
          </div>
        </div>

        <RombelJoinCodeCard rombelId={penugasan.rombel_id} rombelNama={penugasan.rombel_nama} />
      </div>

      {/* 2. INFORMASI & KONFIGURASI PENUGASAN RESMI */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Informasi & Konfigurasi Kelas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data kanonikal penugasan mengajar resmi berdasarkan SK kurikulum sekolah.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Rombel / Kelas
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {penugasan.rombel_nama} {penugasan.tingkat_nama ? `(${penugasan.tingkat_nama})` : ""}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Mata Pelajaran
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {penugasan.mata_pelajaran_nama} ({penugasan.mata_pelajaran_kode})
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Guru Pengampu
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {penugasan.guru_nama}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Beban KBM Mingguan
            </span>
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {penugasan.jumlah_jam_minggu} JP / Minggu
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Tahun Ajaran & Semester
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              TA {penugasan.tahun_ajaran_nama} • {penugasan.semester_nama || "Ganjil"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Status KBM
            </span>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{penugasan.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTEGRASI PENILAIAN & BUKU NILAI GLOBAL */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pengelolaan Penilaian Akademik
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pengelolaan penilaian kelas dialihkan ke modul terpusat Buku Nilai & Rapor.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Sesuai arsitektur kurikulum Ruang Pintar, rekapitulasi penilaian formatif, sumatif,
          kisi-kisi asesmen, ujian CBT, serta ekspor buku nilai resmi sekolah dikelola secara
          menyeluruh melalui menu utama <strong>Buku Nilai & Rapor</strong>. Seluruh riwayat asesmen
          dan nilai murid pada kelas ini tersinkronisasi otomatis.
        </p>

        <div className="pt-2">
          <Link
            href={`/penilaian/${penugasan.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Buka Modul Buku Nilai & Rapor Kelas Ini</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 4. BATAS OTORISASI & HAK AKSES GURU */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {canManage ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <Lock className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hak Akses & Otorisasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tingkat kewenangan akun Anda pada ruang kelas ini.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          {canManage ? (
            <div className="space-y-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Akses Penuh Pengampu Kelas</span>
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Anda memiliki hak penuh untuk menambah/mengedit materi, membuat penugasan, mencatat
                jurnal pertemuan KBM, dan mengambil presensi murid.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <span>Akses Supervisi (Hanya Lihat)</span>
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Anda membuka kelas ini dalam mode supervisi akademik. Tindakan mutasi (tambah/edit
                materi dan tugas) dibatasi hanya untuk guru pengampu resmi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
