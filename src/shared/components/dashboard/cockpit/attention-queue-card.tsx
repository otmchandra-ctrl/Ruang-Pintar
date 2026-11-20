"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, CheckCircle2, ChevronRight } from "lucide-react";

export interface StudentAttentionItem {
  id: string;
  nama: string;
  rombel: string;
  kategori: "REMEDIAL" | "ABSENSI" | "TUGAS";
  keterangan: string;
  nomorWaOrangTua?: string;
  avatarUrl?: string;
}

interface AttentionQueueCardProps {
  items?: StudentAttentionItem[];
}

export function AttentionQueueCard({ items = [] }: AttentionQueueCardProps) {
  const hasItems = items.length > 0;

  return (
    <div className="rounded-[28px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[20px] border border-white/75 dark:border-white/15 p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Siswa Perlu Perhatian
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
              Tindak lanjut kendala akademik, tugas, dan absensi rombel
            </span>
          </div>
        </div>

        <Link
          href="/data-siswa"
          className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content: List or Smart Action Priority Queue */}
      {hasItems ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {items.map((item) => {
            const badgeStyle =
              item.kategori === "ABSENSI"
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60"
                : item.kategori === "REMEDIAL"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60"
                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60";

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-blue-500/20 p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="space-y-2">
                  {/* Header: Avatar + Name + Class Badge */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-2xs">
                      {item.nama.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.nama}
                      </h4>
                      <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                        {item.rombel}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold border shrink-0 ${badgeStyle}`}
                    >
                      {item.kategori}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                    {item.keterangan}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Hubungi Orang Tua
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.nomorWaOrangTua && (
                      <a
                        href={`https://wa.me/${item.nomorWaOrangTua}?text=Halo%20Bapak%2FIbu%20Wali%20Murid%20dari%20${encodeURIComponent(
                          item.nama
                        )},%20kami%20dari%20sekolah%20ingin%20menginformasikan%20terkait%20${encodeURIComponent(
                          item.keterangan
                        )}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Kirim Pesan WhatsApp ke Orang Tua"
                        className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <Link
                      href={`/penilaian`}
                      title="Buka Buku Nilai Siswa"
                      className="h-7 w-7 rounded-lg bg-slate-200/70 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Status banner */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                Seluruh siswa dalam batas aman akademik & kehadiran.
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
              Tidak ada catatan remedial aktif
            </span>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/jadwal-saya"
              className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Jadwal & Sesi KBM
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Mulai Sesi Mengajar
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Buka presensi kelas & catat jurnal pembelajaran hari ini
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                <span>Buka Jadwal</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/penilaian"
              className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Buku Nilai & Tugas
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Input Nilai Harian
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Catat nilai formatif, periksa tugas, atau publikasikan asesmen
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                <span>Buka Penilaian</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/cbt-ujian"
              className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  CBT & Bank Soal
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Kelola Ujian Online
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Susun bank soal atau terbitkan token ujian online kelas
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                <span>Buka CBT</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/data-siswa"
              className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Direktori Siswa
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Bina Profil Siswa
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Pantau riwayat absensi, rekap nilai, dan kontak wali murid
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                <span>Buka Siswa</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
