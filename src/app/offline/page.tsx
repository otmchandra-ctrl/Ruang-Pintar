"use client";

import Image from "next/image";
import Link from "next/link";
import { WifiOff, RotateCcw, Home, ShieldCheck } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-md">
        {/* Academic Glass Card */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Brand & Mascot */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shadow-inner">
              <Image
                src="/brand/ruang-pintar-mark.png"
                alt="Ruang Pintar Logo"
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
                priority
              />
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-rose-500/50 bg-rose-500/90 text-white shadow-sm">
                <WifiOff className="h-3.5 w-3.5 animate-pulse" />
              </span>
            </div>

            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              Mode Offline Terdeteksi
            </span>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Koneksi Internet Terputus
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Aplikasi Ruang Pintar tetap aman di perangkat Anda. Sambungkan kembali perangkat ke
              Wi-Fi atau data seluler untuk melanjutkan.
            </p>
          </div>

          {/* Data Protection Guarantee Notice */}
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 text-xs text-emerald-300">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <p className="leading-relaxed">
                <strong className="font-semibold text-emerald-200">Data Anda Terlindungi:</strong>{" "}
                Status ujian CBT dan presensi Anda tidak hilang dan akan tersinkronisasi saat
                koneksi stabil kembali.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-600/25 transition-all hover:bg-cyan-500 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              Coba Hubungkan Kembali
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Footer Brand watermark */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Ruang Pintar &bull; School Digital Operating Platform
        </p>
      </main>
    </div>
  );
}
