"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError Boundary]", error);
  }, [error]);

  return (
    <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#E7EEFA] text-[#0F172A] font-sans">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 sm:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-4">
            <AlertCircle className="size-6" />
          </div>

          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A]">
            Terjadi Kendala Memuat Halaman
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Sistem mengalami kendala sementara saat memproses permintaan. Data akun Anda tetap aman.
          </p>

          {error.digest && (
            <p className="mt-2 font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Kode Diagnostik: {error.digest}
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E293B] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#26364B] active:scale-[0.99] transition-all cursor-pointer"
            >
              <RefreshCw className="size-4" />
              Coba Lagi
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              <Home className="size-4" />
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
