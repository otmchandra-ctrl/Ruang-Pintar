"use client";

import React from "react";
import { KunciJawabanPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface KunciJawabanPrintViewProps {
  data: KunciJawabanPayloadDTO;
}

export function KunciJawabanPrintView({ data }: KunciJawabanPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    new Date().getFullYear().toString()
  );

  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen relative">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 18mm;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .kunci-table thead {
            display: table-header-group;
          }
          .kunci-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Kop Sekolah Resmi */}
      <SchoolLetterhead kop={data.kop_sekolah} />

      {/* Judul Dokumen Rahasia */}
      <div className="text-center my-3">
        <div className="inline-block border border-red-700 bg-red-50 text-red-700 px-3 py-0.5 text-[10px] font-bold tracking-widest uppercase mb-1 print:border-black print:bg-transparent print:text-black">
          DOKUMEN RAHASIA SEKOLAH
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider">
          KUNCI JAWABAN & PEDOMAN PENSKORAN ASESMEN
        </h2>
        <p className="text-xs font-semibold text-slate-800 uppercase">
          {data.identitas.judul_asesmen}
        </p>
      </div>

      {/* Identitas Ujian */}
      <div className="text-xs mb-4 border border-black p-2.5 grid grid-cols-2 gap-1 bg-slate-50/60 print:bg-transparent">
        <div>
          <span className="font-semibold inline-block w-28">Mata Pelajaran:</span>
          <span>{data.identitas.mata_pelajaran}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kelas / Rombel:</span>
          <span>{data.identitas.kelas_rombel}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Guru Penyusun:</span>
          <span>{data.identitas.guru_nama}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Total Bobot:</span>
          <span className="font-bold">{data.total_bobot} Poin</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Pelaksanaan:</span>
          <span>{data.identitas.tanggal_pelaksanaan}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kode Segel:</span>
          <span className="font-mono font-bold">{sealCode}</span>
        </div>
      </div>

      {/* Tabel Kunci & Rubrik Penskoran */}
      <table className="kunci-table w-full border-collapse border border-black text-xs leading-tight mb-6">
        <thead>
          <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
            <th className="border border-black p-2 w-10">No</th>
            <th className="border border-black p-2 w-28">Bentuk Soal</th>
            <th className="border border-black p-2 w-28">Kunci Jawaban</th>
            <th className="border border-black p-2 w-16">Bobot</th>
            <th className="border border-black p-2">Pedoman Penskoran / Pembahasan</th>
          </tr>
        </thead>
        <tbody>
          {data.kunci_list.map((item) => (
            <tr key={item.nomor} className="align-top">
              <td className="border border-black p-2 text-center font-bold">{item.nomor}</td>
              <td className="border border-black p-2 text-center">{item.bentuk_soal}</td>
              <td className="border border-black p-2 text-center font-mono font-bold text-blue-900 print:text-black">
                {item.kunci_jawaban}
              </td>
              <td className="border border-black p-2 text-center font-semibold">{item.bobot}</td>
              <td className="border border-black p-2 text-justify">
                {item.pembahasan || (
                  <span className="text-slate-500 italic text-[10px]">
                    Sesuai kunci jawaban standar.
                  </span>
                )}
              </td>
            </tr>
          ))}
          {data.kunci_list.length === 0 && (
            <tr>
              <td colSpan={5} className="border border-black p-4 text-center text-slate-500 italic">
                Belum ada butir soal yang dipetakan pada naskah ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tanda Tangan Verifikasi Guru & Waka Kurikulum */}
      <div className="flex justify-between items-start text-xs pt-4 break-inside-avoid">
        <div className="text-center w-60">
          <p>Mengetahui,</p>
          <p className="font-semibold">Waka Kurikulum / Tim Penilai</p>
          <div className="h-16" />
          <p className="font-bold underline">___________________________</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>

        <div className="text-center w-60">
          <p>Dibuat oleh,</p>
          <p className="font-semibold">Guru Pengampu Mata Pelajaran</p>
          <div className="h-16" />
          <p className="font-bold underline">
            {data.identitas.guru_nama || "___________________________"}
          </p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>
      </div>

      {/* Footer Dokumen Rahasia */}
      <div className="mt-8 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Assessment Engine • Dokumen Rahasia Tidak Boleh Disebarluaskan</span>
        <span className="font-mono">Integritas: {sealCode}</span>
      </div>
    </div>
  );
}
