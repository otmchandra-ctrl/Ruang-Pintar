"use client";

/**
 * Ruang Pintar — CBT Submit Review View (Academic Glass UI)
 *
 * Halaman Konfirmasi & Rekapitulasi Pengumpulan Ujian:
 * - Menampilkan status setiap butir soal (Terjawab, Ragu-ragu, Belum Dijawab)
 * - Authoritative Server Countdown
 * - Validasi & Peringatan soal kosong sebelum submit permanen
 * - Mengirimkan perintah submit authoritative ke server
 */

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  HelpCircle,
  FileText,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { submitAttemptAction } from "@/app/actions/cbt-actions";

interface CbtSubmitReviewViewProps {
  attemptId: string;
  ujianJudul: string;
  mataPelajaran: string;
  durasiMenit: number;
  initialTimeRemainingSeconds: number;
  batasWaktuServer?: string | Date;
  manifest: Array<{ nomor_urut: number; tipe_soal: string; bobot: number }>;
  savedAnswers: Record<
    number,
    {
      jawaban_pilihan?: string | null;
      jawaban_teks?: string | null;
      jawaban_kompleks?: string[] | null;
      jawaban_menjodohkan?: Record<string, string> | null;
      ragu_ragu?: boolean;
    }
  >;
}

export function CbtSubmitReviewView({
  attemptId,
  ujianJudul,
  mataPelajaran,
  durasiMenit,
  initialTimeRemainingSeconds,
  batasWaktuServer,
  manifest,
  savedAnswers,
}: CbtSubmitReviewViewProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(initialTimeRemainingSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-submit saat server timer habis
  const handleAutoSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await submitAttemptAction(attemptId);
      if (res.success) {
        router.push(`/cbt/finished/${attemptId}`);
      }
    } catch {
      router.push(`/cbt/finished/${attemptId}`);
    }
  }, [attemptId, router]);

  // HIGH-RISK-03: Absolute timestamp countdown sync
  useEffect(() => {
    const targetMs = batasWaktuServer
      ? new Date(batasWaktuServer).getTime()
      : Date.now() + initialTimeRemainingSeconds * 1000;

    const syncTick = () => {
      const remaining = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        handleAutoSubmit();
      }
    };

    syncTick();
    const timer = setInterval(syncTick, 1000);

    const handleSync = () => {
      if (!document.hidden) {
        syncTick();
      }
    };
    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [batasWaktuServer, handleAutoSubmit, initialTimeRemainingSeconds]);

  // Format time
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${hours > 0 ? `${hours.toString().padStart(2, "0")}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Tally status per nomor soal
  const questionStatusMap: Record<number, { status: "ANSWERED" | "UNANSWERED" | "DOUBTFUL" }> = {};

  let answeredCount = 0;
  let doubtfulCount = 0;
  let unansweredCount = 0;

  for (const q of manifest) {
    const ans = savedAnswers[q.nomor_urut];
    const isAnswered = Boolean(
      ans &&
      (ans.jawaban_pilihan !== undefined ||
        (ans.jawaban_teks && ans.jawaban_teks.trim() !== "") ||
        (ans.jawaban_kompleks && ans.jawaban_kompleks.length > 0) ||
        (ans.jawaban_menjodohkan && Object.keys(ans.jawaban_menjodohkan).length > 0))
    );

    const isDoubtful = Boolean(ans?.ragu_ragu);

    if (isDoubtful) {
      questionStatusMap[q.nomor_urut] = { status: "DOUBTFUL" };
      doubtfulCount++;
      if (isAnswered) answeredCount++;
      else unansweredCount++;
    } else if (isAnswered) {
      questionStatusMap[q.nomor_urut] = { status: "ANSWERED" };
      answeredCount++;
    } else {
      questionStatusMap[q.nomor_urut] = { status: "UNANSWERED" };
      unansweredCount++;
    }
  }

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitAttemptAction(attemptId);
      if (res.success) {
        // Clear local storage if any
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem(`rp_cbt_answers_${attemptId}`);
          }
        } catch {}
        router.push(`/cbt/finished/${attemptId}`);
      } else {
        setErrorMessage(res.message || "Gagal mengumpulkan lembar ujian ke server.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kendala jaringan saat menghubungi server.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6">
        <Link
          href={`/cbt/attempt/${attemptId}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Lembar Soal</span>
        </Link>

        {/* Server Authoritative Timer Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-xs sm:text-sm font-bold shadow-xs ${
            secondsLeft < 300
              ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Sisa Waktu: {formattedTime}</span>
        </div>
      </header>

      {/* Main Review Card */}
      <main className="max-w-4xl w-full mx-auto my-auto space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Title & Subject */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                {mataPelajaran}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                Konfirmasi Pengumpulan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {ujianJudul}
            </h1>
            <p className="text-xs text-slate-500">
              Periksa ringkasan jawaban Anda sebelum melakukan penyerahan lembar ujian permanen.
            </p>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Soal
              </div>
              <div className="text-2xl font-black font-mono text-slate-800 mt-1">
                {manifest.length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-center">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Sudah Dijawab
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                {answeredCount}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/60 text-center">
              <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Belum Dijawab
              </div>
              <div className="text-2xl font-black font-mono text-rose-700 mt-1">
                {unansweredCount}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Ragu-Ragu
              </div>
              <div className="text-2xl font-black font-mono text-amber-700 mt-1">
                {doubtfulCount}
              </div>
            </div>
          </div>

          {/* Warning or Success Notice */}
          {unansweredCount > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">
                  Masih terdapat {unansweredCount} butir soal yang belum Anda jawab!
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Soal yang tidak diisi akan secara otomatis dihitung bernilai 0 poin. Anda dapat
                  kembali ke lembar ujian untuk melengkapi jawaban selagi sisa waktu masih ada.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">Luar biasa! Seluruh butir soal telah terisi.</div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Semua jawaban Anda telah tersimpan dengan aman pada server. Klik tombol di bawah
                  untuk menyerahkan lembar ujian secara resmi.
                </p>
              </div>
            </div>
          )}

          {/* Question Grid Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Peta Lembar Jawaban:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Dijawab
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Ragu-ragu
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300" />{" "}
                  Kosong
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {manifest.map((q) => {
                  const state = questionStatusMap[q.nomor_urut]?.status;
                  return (
                    <Link
                      key={q.nomor_urut}
                      href={`/cbt/attempt/${attemptId}`}
                      title={`Soal No. ${q.nomor_urut} (${state})`}
                      className={`h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition border ${
                        state === "DOUBTFUL"
                          ? "bg-amber-400 text-slate-900 border-amber-500 shadow-2xs hover:brightness-105"
                          : state === "ANSWERED"
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs hover:bg-emerald-700"
                            : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {q.nomor_urut}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions Button Group */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <Link
              href={`/cbt/attempt/${attemptId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Periksa Kembali Jawaban</span>
            </Link>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengumpulkan Lembar Ujian...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kumpulkan Ujian Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl w-full mx-auto pt-6 text-center text-xs text-slate-400">
        Ruang Pintar CBT Delivery Engine • Penyerahan Lembar Jawaban Bersifat Final
      </footer>
    </div>
  );
}
