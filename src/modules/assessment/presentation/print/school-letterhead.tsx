"use client";

import React from "react";
import { KopSekolahDTO } from "@/modules/assessment/domain/assessment-types";

interface SchoolLetterheadProps {
  kop: KopSekolahDTO;
  className?: string;
}

export function SchoolLetterhead({ kop, className = "" }: SchoolLetterheadProps) {
  return (
    <div className={`w-full text-center pb-2 select-none ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Logo Kiri (Pemprov / Dinas / Yayasan / Kemenag) */}
        <div className="w-20 h-20 shrink-0 flex items-center justify-center">
          {kop.logo_kiri_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kop.logo_kiri_url}
              alt="Logo Instansi Kiri"
              className="max-h-20 max-w-20 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 print:hidden">
              Logo Dinas
            </div>
          )}
        </div>

        {/* Teks Kop Bertingkat Resmi */}
        <div className="flex-1 px-2 text-center text-black">
          {kop.baris_instansi_1 && (
            <p className="text-[11pt] font-semibold uppercase tracking-wider leading-tight">
              {kop.baris_instansi_1}
            </p>
          )}
          {kop.baris_instansi_2 && (
            <p className="text-[11pt] font-bold uppercase tracking-wider leading-tight">
              {kop.baris_instansi_2}
            </p>
          )}
          {kop.baris_instansi_3 && (
            <p className="text-[10pt] font-medium uppercase tracking-wide leading-tight">
              {kop.baris_instansi_3}
            </p>
          )}
          <h1 className="text-[14pt] sm:text-[15pt] font-black uppercase tracking-normal leading-tight mt-0.5 font-serif">
            {kop.nama_sekolah}
          </h1>
          <p className="text-[8.5pt] leading-tight text-slate-700 mt-1">
            {kop.alamat || "Alamat Sekolah"}
            {kop.telepon ? ` • Telp: ${kop.telepon}` : ""}
            {kop.email ? ` • Email: ${kop.email}` : ""}
          </p>
          {kop.npsn && (
            <p className="text-[8pt] font-semibold leading-tight text-slate-800 tracking-wider">
              NPSN: {kop.npsn}
              {kop.website ? ` | Website: ${kop.website}` : ""}
            </p>
          )}
        </div>

        {/* Logo Kanan (Sekolah / Tut Wuri Handayani) */}
        <div className="w-20 h-20 shrink-0 flex items-center justify-center">
          {kop.logo_kanan_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kop.logo_kanan_url}
              alt="Logo Sekolah Kanan"
              className="max-h-20 max-w-20 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 print:hidden">
              Logo Sekolah
            </div>
          )}
        </div>
      </div>

      {/* Garis Pembatas Kop Resmi (Double Rule Line) */}
      <div className="mt-2.5">
        <div className="h-[2px] bg-black w-full" />
        <div className="h-[0.75px] bg-black w-full mt-[2px]" />
      </div>
    </div>
  );
}
