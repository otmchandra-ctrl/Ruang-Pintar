"use client";

import React from "react";
import { AnalisisButirSoalPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface AnalisisButirSoalPrintViewProps {
  data: AnalisisButirSoalPayloadDTO;
}

export function AnalisisButirSoalPrintView({ data }: AnalisisButirSoalPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    data.identitas.tahun_ajaran
  );

  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen">
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 15mm 15mm 15mm 22mm;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .analisis-table thead {
            display: table-header-group;
          }
          .analisis-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Kop Sekolah */}
      <SchoolLetterhead kop={data.kop_sekolah} />

      {/* Judul Dokumen */}
      <div className="text-center my-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          LAPORAN ANALISIS BUTIR SOAL & METRIK PSIKOMETRI
        </h2>
        <p className="text-xs font-semibold text-slate-800 uppercase">
          {data.identitas.judul_asesmen} • TAHUN AJARAN {data.identitas.tahun_ajaran}
        </p>
      </div>

      {/* Metadata & Ringkasan Kualitas Butir */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        {/* Kolom Kiri: Metadata Ujian */}
        <div className="border border-black p-2.5 space-y-1 bg-slate-50/50 print:bg-transparent">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Mata Pelajaran:</span>
            <span>{data.identitas.mata_pelajaran}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Kelas / Rombel:</span>
            <span>{data.identitas.kelas_rombel}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Guru Pengampu:</span>
            <span>{data.identitas.guru_nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Jumlah Soal / Peserta:</span>
            <span>
              {data.identitas.total_butir_soal} Butir / {data.identitas.total_peserta} Siswa
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Psikometri */}
        <div className="border border-black p-2.5 grid grid-cols-4 gap-1 text-center bg-slate-50/50 print:bg-transparent">
          <div className="border-r border-black/30 pr-1">
            <p className="text-[10px] text-slate-600 uppercase">Diterima</p>
            <p className="font-bold text-base text-emerald-800 print:text-black">
              {data.ringkasan.butir_diterima}
            </p>
          </div>
          <div className="border-r border-black/30 pr-1">
            <p className="text-[10px] text-slate-600 uppercase">Direvisi</p>
            <p className="font-bold text-base text-amber-800 print:text-black">
              {data.ringkasan.butir_direvisi}
            </p>
          </div>
          <div className="border-r border-black/30 pr-1">
            <p className="text-[10px] text-slate-600 uppercase">Ditolak</p>
            <p className="font-bold text-base text-rose-800 print:text-black">
              {data.ringkasan.butir_ditolak}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-600 uppercase">Daya Serap</p>
            <p className="font-bold text-base text-blue-900 print:text-black">
              {data.ringkasan.daya_serap_rata_rata}%
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Rincian Analisis Butir Soal */}
      <table className="analisis-table w-full border-collapse border border-black text-[10px] leading-tight mb-4">
        <thead>
          <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
            <th className="border border-black p-1.5 w-8">No</th>
            <th className="border border-black p-1.5 w-16">Bentuk</th>
            <th className="border border-black p-1.5 w-28">Tingkat Kesukaran (P)</th>
            <th className="border border-black p-1.5 w-28">Daya Pembeda (D)</th>
            <th className="border border-black p-1.5">Efektivitas Distraktor (Pengecoh)</th>
            <th className="border border-black p-1.5 w-16">Daya Serap</th>
            <th className="border border-black p-1.5 w-20">Kualitas</th>
            <th className="border border-black p-1.5 w-48 text-left">Rekomendasi Tindak Lanjut</th>
          </tr>
        </thead>
        <tbody>
          {data.butir_analisis.map((item) => (
            <tr key={item.nomor} className="align-middle">
              <td className="border border-black p-1.5 text-center font-bold">{item.nomor}</td>
              <td className="border border-black p-1.5 text-center">{item.bentuk_soal}</td>
              <td className="border border-black p-1.5 text-center">
                <span className="font-mono font-bold">{item.tingkat_kesukaran.toFixed(2)}</span>
                <span className="text-[9px] text-slate-600 block">({item.kategori_kesukaran})</span>
              </td>
              <td className="border border-black p-1.5 text-center">
                <span className="font-mono font-bold">{item.daya_pembeda.toFixed(2)}</span>
                <span className="text-[9px] text-slate-600 block">
                  ({item.kategori_daya_pembeda})
                </span>
              </td>
              <td className="border border-black p-1.5 text-center font-mono text-[9px]">
                {item.efektivitas_distraktor && item.efektivitas_distraktor.length > 0 ? (
                  <div className="flex justify-center gap-2">
                    {item.efektivitas_distraktor.map((d) => (
                      <span
                        key={d.opsi}
                        className={
                          d.status === "KUNCI"
                            ? "font-bold text-blue-900 print:text-black underline"
                            : ""
                        }
                      >
                        {d.opsi}:{d.persentase}%
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic font-sans">[Non-PG]</span>
                )}
              </td>
              <td className="border border-black p-1.5 text-center font-semibold">
                {item.daya_serap_persen}%
              </td>
              <td
                className={`border border-black p-1.5 text-center font-bold text-[9.5px] ${
                  item.status_kualitas === "DITERIMA"
                    ? "text-emerald-800 print:text-black"
                    : item.status_kualitas === "DIREVISI"
                      ? "text-amber-800 print:text-black"
                      : "text-rose-800 print:text-black"
                }`}
              >
                {item.status_kualitas}
              </td>
              <td className="border border-black p-1.5 text-slate-700">
                {item.rekomendasi_tindak_lanjut}
              </td>
            </tr>
          ))}
          {data.butir_analisis.length === 0 && (
            <tr>
              <td colSpan={8} className="border border-black p-4 text-center text-slate-500 italic">
                Belum ada butir soal pada instrumen ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tanda Tangan */}
      <div className="flex justify-between items-start text-xs pt-3 break-inside-avoid">
        <div className="text-center w-60">
          <p>Mengetahui,</p>
          <p className="font-semibold">Waka Kurikulum / Tim Penilai</p>
          <div className="h-14" />
          <p className="font-bold underline">___________________________</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>

        <div className="text-center w-60">
          <p>Guru Mata Pelajaran,</p>
          <div className="h-14" />
          <p className="font-bold underline">
            {data.identitas.guru_nama || "___________________________"}
          </p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Psychometrics Engine • Analisis Validitas & Reliabilitas Instrumen</span>
        <span className="font-mono">Integritas: {sealCode}</span>
      </div>
    </div>
  );
}
