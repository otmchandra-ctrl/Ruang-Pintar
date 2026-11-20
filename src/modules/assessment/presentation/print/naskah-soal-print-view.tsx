"use client";

import React from "react";
import { NaskahSoalPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface NaskahSoalPrintViewProps {
  data: NaskahSoalPayloadDTO;
}

export function NaskahSoalPrintView({ data }: NaskahSoalPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    new Date().getFullYear().toString()
  );

  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 15mm 12mm 15mm 15mm;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .naskah-two-columns {
            column-count: 2 !important;
            column-gap: 8mm !important;
            column-rule: 0.5px solid #000000 !important;
          }
          .naskah-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12px !important;
          }
        }
      `}</style>

      {/* Kop Sekolah Resmi */}
      <SchoolLetterhead kop={data.kop_sekolah} />

      {/* Judul & Header Naskah Ujian */}
      <div className="text-center my-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">NASKAH SOAL ASESMEN / UJIAN</h2>
        <p className="text-xs font-semibold text-slate-800 uppercase">
          {data.metadata_ujian.judul_asesmen}
        </p>
      </div>

      {/* Metadata Jadwal & Identitas Ujian */}
      <div className="text-[11px] mb-3 border border-black p-2.5 grid grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/60 print:bg-transparent leading-tight">
        <div>
          <span className="font-semibold inline-block w-28">Mata Pelajaran:</span>
          <span>{data.metadata_ujian.mata_pelajaran}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Hari, Tanggal:</span>
          <span>{data.metadata_ujian.hari_tanggal}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kelas / Rombel:</span>
          <span>{data.metadata_ujian.kelas_rombel}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Alokasi Waktu:</span>
          <span>{data.metadata_ujian.alokasi_waktu}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kategori:</span>
          <span className="capitalize">{data.metadata_ujian.kategori.toLowerCase()}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Segel Naskah:</span>
          <span className="font-mono font-bold">{sealCode}</span>
        </div>
      </div>

      {/* Petunjuk Umum */}
      {data.petunjuk_umum && data.petunjuk_umum.length > 0 && (
        <div className="text-[10px] mb-4 p-2 border-b border-black/50 leading-normal bg-amber-50/30 print:bg-transparent">
          <p className="font-bold uppercase tracking-wider text-slate-800 mb-1">PETUNJUK UMUM:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
            {data.petunjuk_umum.map((ptj, idx) => (
              <li key={idx}>{ptj}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Naskah Soal 2 Kolom Berstandar A4 */}
      <div className="naskah-two-columns columns-1 sm:columns-2 gap-8 text-[11px] leading-relaxed">
        {data.butir_soal.map((butir) => (
          <div
            key={butir.nomor}
            className="naskah-item break-inside-avoid mb-4 pb-2 border-b border-dashed border-slate-200 print:border-none"
          >
            {/* Butir Pertanyaan */}
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-slate-900 w-5 shrink-0 text-right">
                {butir.nomor}.
              </span>
              <div className="flex-1">
                {/* Stimulus jika ada */}
                {butir.stimulus && (
                  <p className="text-slate-700 italic text-[10.5px] mb-1.5 bg-slate-50 print:bg-transparent p-1 rounded-xs">
                    {butir.stimulus}
                  </p>
                )}

                {/* Gambar Stimulus jika ada */}
                {butir.gambar_url && (
                  <div className="my-1.5 max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={butir.gambar_url}
                      alt={`Gambar Stimulus Soal ${butir.nomor}`}
                      className="max-h-40 rounded-xs border border-slate-300"
                    />
                  </div>
                )}

                {/* Teks Pertanyaan */}
                <div className="text-slate-900 whitespace-pre-wrap text-justify">
                  {butir.pertanyaan}
                </div>

                {/* Opsi Pilihan Ganda (jika ada) */}
                {butir.opsi_jawaban && butir.opsi_jawaban.length > 0 ? (
                  <div className="mt-2 space-y-1 pl-1">
                    {butir.opsi_jawaban.map((opsi) => (
                      <div key={opsi.label} className="flex items-start gap-2">
                        <span className="font-bold text-slate-800">{opsi.label}.</span>
                        <span className="text-slate-900 flex-1">{opsi.teks}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Placeholder jawaban esai/uraian
                  <div className="mt-3 pt-6 border-b border-dotted border-slate-400 print:block">
                    <span className="text-[9px] text-slate-400 italic">
                      [ Lembar Jawaban Uraian / Isian ]
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Integritas Ujian */}
      <div className="mt-8 pt-3 border-t border-black flex justify-between items-center text-[9px] text-slate-600 break-inside-avoid">
        <div>
          <span>Ruang Pintar Examination Engine • Dokumen Rahasia Negara/Sekolah</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Integritas:</span>
          <span className="font-mono font-bold text-black">{sealCode}</span>
        </div>
      </div>
    </div>
  );
}
