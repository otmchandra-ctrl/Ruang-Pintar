"use client";

import React from "react";
import { KartuSoalPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface KartuSoalPrintViewProps {
  data: KartuSoalPayloadDTO;
}

export function KartuSoalPrintView({ data }: KartuSoalPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    data.identitas.tahun_ajaran
  );

  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 18mm 18mm;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .kartu-soal-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>

      {/* Kop Sekolah */}
      <SchoolLetterhead kop={data.kop_sekolah} />

      <div className="text-center my-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">KARTU SOAL ASESMEN RESMI</h2>
        <p className="text-xs text-slate-700">
          Tahun Ajaran {data.identitas.tahun_ajaran} • Semester{" "}
          {data.identitas.semester.toUpperCase()}
        </p>
      </div>

      {/* Identitas Ujian */}
      <div className="text-xs mb-4 border border-black/40 p-2 rounded-xs grid grid-cols-2 gap-1 bg-slate-50 print:bg-transparent">
        <div>
          <span className="font-semibold inline-block w-28">Mata Pelajaran:</span>
          <span>{data.identitas.mata_pelajaran}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Nama Asesmen:</span>
          <span>{data.identitas.nama_asesmen}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Penyusun:</span>
          <span>{data.identitas.penyusun_nama}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kode Segel:</span>
          <span className="font-mono font-bold">{sealCode}</span>
        </div>
      </div>

      {/* Daftar Kartu Soal */}
      <div className="space-y-6">
        {data.kartu_list.map((kartu) => (
          <div
            key={kartu.nomor_soal}
            className="kartu-soal-card border border-black text-xs leading-relaxed"
          >
            {/* Header Kartu */}
            <div className="bg-slate-200 print:bg-slate-200 border-b border-black p-2 flex justify-between items-center font-bold">
              <span>KARTU SOAL NOMOR {kartu.nomor_soal}</span>
              <div className="flex gap-4 text-[11px]">
                <span>Bentuk: {kartu.bentuk_soal}</span>
                <span>Level Kognitif: {kartu.level_kognitif}</span>
              </div>
            </div>

            {/* Pemetaan Kurikulum */}
            <div className="grid grid-cols-1 border-b border-black divide-y divide-black/30 bg-slate-50/50 print:bg-transparent">
              <div className="p-2">
                <span className="font-semibold inline-block w-36">Tujuan Pembelajaran (TP):</span>
                <span>{kartu.kompetensi_tp}</span>
              </div>
              <div className="p-2">
                <span className="font-semibold inline-block w-36">Materi Pokok:</span>
                <span>{kartu.materi_pokok}</span>
              </div>
              <div className="p-2">
                <span className="font-semibold inline-block w-36">Indikator Soal:</span>
                <span className="font-medium text-slate-800">{kartu.indikator_soal}</span>
              </div>
            </div>

            {/* Stimulus & Butir Soal */}
            <div className="p-3 border-b border-black">
              <p className="font-bold text-[11px] mb-1.5 uppercase text-slate-700">
                Butir Pertanyaan:
              </p>
              {kartu.stimulus_gambar_url && (
                <div className="my-2 max-w-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={kartu.stimulus_gambar_url}
                    alt={`Stimulus Soal ${kartu.nomor_soal}`}
                    className="max-h-48 border border-slate-300 rounded-xs"
                  />
                </div>
              )}
              <div className="whitespace-pre-wrap font-sans text-justify text-slate-900">
                {kartu.teks_soal}
              </div>
            </div>

            {/* Kunci Jawaban & Pedoman Penskoran */}
            <div className="grid grid-cols-2 divide-x divide-black bg-slate-100/60 print:bg-transparent text-[11px]">
              <div className="p-2.5">
                <p className="font-bold uppercase text-slate-800 mb-0.5">Kunci Jawaban:</p>
                <p className="font-bold text-sm text-blue-900 print:text-black font-mono">
                  {kartu.kunci_jawaban}
                </p>
              </div>
              <div className="p-2.5">
                <p className="font-bold uppercase text-slate-800 mb-0.5">Pedoman Penskoran:</p>
                <p className="text-slate-800 whitespace-pre-wrap">{kartu.pedoman_penskoran}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Dokumen */}
      <div className="mt-8 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Academic Assessment Engine • Dokumen Sah Administrasi Guru</span>
        <span className="font-mono">Hash: {data.snapshot_hash || "DRAFT"}</span>
      </div>
    </div>
  );
}
