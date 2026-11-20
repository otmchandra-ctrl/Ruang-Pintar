"use client";

/**
 * Ruang Pintar — CBT Finished & Result View (Academic Glass UI)
 *
 * Halaman Konfirmasi Selesai & Hasil Ujian:
 * - Menampilkan bukti penyerahan lembar jawaban resmi
 * - Menghormati konfigurasi `tampilkan_nilai` (Zero premature score leak)
 * - Menampilkan metrik ketuntasan KKTP jika nilai dipublikasikan
 */

import React from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  FileCheck,
  GraduationCap,
  Home,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface CbtFinishedViewProps {
  attemptId: string;
  ujianJudul: string;
  mataPelajaran: string;
  guruNama: string;
  siswaNama: string;
  siswaNis: string;
  waktuMulai: string;
  waktuSelesai: string;
  totalSoal: number;
  tampilkanNilai: boolean;
  kktp: number;
  hasil?: {
    nilaiAkhir: number;
    skorMentah: number;
    jumlahBenar: number;
    jumlahSalah: number;
    jumlahKosong: number;
    apakahTuntas: boolean;
    statusPenilaian: string;
  } | null;
}

export function CbtFinishedView({
  attemptId,
  ujianJudul,
  mataPelajaran,
  guruNama,
  siswaNama,
  siswaNis,
  waktuMulai,
  waktuSelesai,
  totalSoal,
  tampilkanNilai,
  kktp,
  hasil,
}: CbtFinishedViewProps) {
  const isPassed = Boolean(hasil?.apakahTuntas);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            RP
          </div>
          <span className="text-xs font-bold text-slate-700">Ruang Pintar CBT</span>
        </div>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Penyerahan Terverifikasi
        </span>
      </header>

      {/* Main Card */}
      <main className="max-w-2xl w-full mx-auto my-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Ujian Berhasil Dikumpulkan
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Seluruh lembar jawaban Anda telah tersimpan dan diamankan secara resmi di server.
            </p>
          </div>

          {/* Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-left space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Mata Pelajaran:</span>
              <strong className="text-slate-800">{mataPelajaran}</strong>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Judul Ujian:</span>
              <strong className="text-slate-800">{ujianJudul}</strong>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Peserta Didik:</span>
              <span className="font-semibold text-slate-800">
                {siswaNama} ({siswaNis})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Waktu Penyerahan:</span>
              <span className="font-mono text-slate-700">{waktuSelesai}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">ID Sesi Ujian:</span>
              <span className="font-mono text-[11px] text-slate-500">{attemptId}</span>
            </div>
          </div>

          {/* Conditional Result Section (Respecting `tampilkanNilai`) */}
          {tampilkanNilai && hasil ? (
            <div className="space-y-4 pt-2">
              <div
                className={`p-6 rounded-3xl border text-center space-y-3 ${
                  isPassed
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                    : "bg-amber-50/70 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Award
                    className={`h-5 w-5 ${isPassed ? "text-emerald-600" : "text-amber-600"}`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isPassed ? "Tuntas KKTP" : "Belum Mencapai KKTP"}
                  </span>
                </div>

                <div className="text-4xl font-black font-mono text-slate-900">
                  {hasil.nilaiAkhir.toFixed(1)}
                </div>

                <div className="text-xs text-slate-600">
                  Target KKTP Satuan Pendidikan: <strong>{kktp}</strong>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="p-2 rounded-xl bg-white/70">
                    <div className="text-[10px] text-slate-400 font-semibold">Benar</div>
                    <div className="font-bold text-emerald-700">{hasil.jumlahBenar}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/70">
                    <div className="text-[10px] text-slate-400 font-semibold">Salah</div>
                    <div className="font-bold text-rose-700">{hasil.jumlahSalah}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/70">
                    <div className="text-[10px] text-slate-400 font-semibold">Kosong</div>
                    <div className="font-bold text-slate-700">{hasil.jumlahKosong}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 text-left flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Pengumuman Nilai Ujian</div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Sesuai kebijakan pelaksanaan ujian ini, nilai akhir tidak ditampilkan langsung
                  kepada peserta. Hasil evaluasi dan nilai rapor akan diumumkan secara resmi oleh
                  guru mata pelajaran <strong>{guruNama}</strong> setelah seluruh proses koreksi
                  selesai.
                </p>
              </div>
            </div>
          )}

          {/* Action Navigation */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/cbt"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>Kembali ke Portal CBT</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
            >
              <Home className="h-4 w-4" />
              <span>Ke Dashboard Utama</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto pt-6 text-center text-xs text-slate-400">
        Ruang Pintar • Integritas Asesmen Digital Terverifikasi
      </footer>
    </div>
  );
}
