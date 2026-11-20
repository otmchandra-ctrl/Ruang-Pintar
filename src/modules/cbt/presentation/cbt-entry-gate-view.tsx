"use client";

/**
 * Ruang Pintar — CBT Entry Gate View (Academic Glass UI)
 *
 * Gerbang Masuk Ujian Siswa:
 * - Validasi token ujian masuk (jika diaktifkan oleh pengawas).
 * - Menampilkan ringkasan spesifikasi ujian (durasi, jumlah soal, KKM/KKTP).
 * - Panduan integritas & aturan pengerjaan.
 * - Memulai attempt baru dan mengarahkan ke /cbt/attempt/[attemptId].
 */

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Play,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Sparkles,
  User,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { startOrResumeAttemptAction } from "@/app/actions/cbt-actions";

interface CbtEntryGateViewProps {
  ujianId: string;
  judul: string;
  deskripsi?: string | null;
  mataPelajaran: string;
  guruNama: string;
  rombelNama: string;
  durasiMenit: number;
  totalSoal: number;
  kktp: number;
  gunakanToken: boolean;
  siswaNama: string;
  siswaNis: string;
  siswaKelas: string;
}

export function CbtEntryGateView({
  ujianId,
  judul,
  deskripsi,
  mataPelajaran,
  guruNama,
  rombelNama,
  durasiMenit,
  totalSoal,
  kktp,
  gunakanToken,
  siswaNama,
  siswaNis,
  siswaKelas,
}: CbtEntryGateViewProps) {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (gunakanToken && !tokenInput.trim()) {
      setErrorMessage("Token ujian wajib diisi sebelum memulai.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await startOrResumeAttemptAction(
          ujianId,
          undefined,
          gunakanToken ? tokenInput.trim().toUpperCase() : undefined
        );

        if (res.success && res.data?.session?.id) {
          router.push(`/cbt/attempt/${res.data.session.id}`);
        } else {
          setErrorMessage(res.message || "Gagal memulai sesi ujian CBT.");
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Terjadi kendala jaringan saat menghubungi server.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden text-slate-900">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6">
        <Link
          href="/cbt"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs hover:bg-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Portal CBT</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
            Entry Gate CBT
          </span>
        </div>
      </div>

      {/* Center Gate Card */}
      <div className="max-w-4xl w-full mx-auto my-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left / Top Side: Identity & Specs (Col 7) */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                  {mataPelajaran}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                  {rombelNama}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {judul}
              </h1>
              {deskripsi && <p className="text-xs text-slate-500 leading-relaxed">{deskripsi}</p>}
            </div>

            {/* Teacher & Student Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  Guru Pengampu:
                </span>
                <strong className="text-slate-800">{guruNama}</strong>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  Peserta Ujian:
                </span>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{siswaNama}</div>
                  <div className="text-[10px] text-slate-500">
                    NIS: {siswaNis} • {siswaKelas}
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Parameters Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/60">
                <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <div className="text-[10px] font-semibold text-blue-600 uppercase">Durasi</div>
                <div className="text-base font-black font-mono text-slate-900">
                  {durasiMenit} Menit
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                <FileText className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                <div className="text-[10px] font-semibold text-emerald-600 uppercase">
                  Total Soal
                </div>
                <div className="text-base font-black font-mono text-slate-900">
                  {totalSoal} Butir
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                <CheckCircle2 className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <div className="text-[10px] font-semibold text-amber-600 uppercase">KKTP / KKM</div>
                <div className="text-base font-black font-mono text-slate-900">{kktp}</div>
              </div>
            </div>

            {/* Rules and Integrity Guidelines */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Tata Tertib & Ketentuan CBT:</span>
              </div>
              <ul className="text-[11px] text-amber-950/80 space-y-1 list-disc pl-5 leading-relaxed">
                <li>
                  Timer dihitung <strong>authoritative oleh server</strong> sejak tombol Mulai
                  diklik.
                </li>
                <li>
                  Jawaban disimpan secara <strong>otomatis (autosave)</strong> ke server secara
                  berkala.
                </li>
                <li>Dilarang membuka tab baru, aplikasi lain, atau meninggalkan layar ujian.</li>
              </ul>
            </div>
          </div>

          {/* Right / Bottom Side: Token & Action Form (Col 5) */}
          <div className="md:col-span-5 bg-slate-50/70 border-t md:border-t-0 md:border-l border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <form onSubmit={handleStartExam} className="space-y-6 my-auto">
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Masuk Ujian</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pastikan Anda berada di ruang yang tenang dan koneksi internet stabil.
                </p>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Token Input Field */}
              {gunakanToken ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Token Ujian (6 Karakter)
                  </label>
                  <div className="relative">
                    <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-center font-mono text-lg font-black tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase transition placeholder:text-slate-300"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mintalah token 6 karakter kepada pengawas ruang ujian.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <div className="text-xs font-bold text-emerald-700">Ujian Tanpa Token</div>
                  <div className="text-[11px] text-slate-500">
                    Anda dapat langsung memulai ujian ini sekarang.
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menghubungkan Sesi...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Mulai Kerjakan Sekarang</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400 font-medium">
                Ruang Pintar • Secure Delivery Engine v2.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="max-w-4xl w-full mx-auto pt-6 text-center text-xs text-slate-400">
        Hak Cipta © {new Date().getFullYear()} Ruang Pintar. Seluruh hak cipta dilindungi
        undang-undang.
      </div>
    </div>
  );
}
