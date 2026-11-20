"use client";

import React from "react";
import { BerkasPengesahanPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface BerkasPengesahanPrintViewProps {
  data: BerkasPengesahanPayloadDTO;
}

export function BerkasPengesahanPrintView({ data }: BerkasPengesahanPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    data.identitas.tahun_ajaran
  );

  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen">
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
          .pengesahan-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Kop Sekolah */}
      <SchoolLetterhead kop={data.kop_sekolah} />

      {/* Judul Dokumen Pengesahan */}
      <div className="text-center my-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          LEMBAR VERIFIKASI & PENGESAHAN PERANGKAT ASESMEN
        </h2>
        <p className="text-xs font-semibold text-slate-800">
          NOMOR DOKUMEN: <span className="font-mono">{data.identitas.nomor_dokumen}</span>
        </p>
      </div>

      {/* Narasi Pengantar */}
      <div className="text-xs leading-relaxed text-justify mb-3">
        <p>
          Berdasarkan hasil telaah substantif dan penjaminan mutu instrumen evaluasi pembelajaran
          pada Satuan Pendidikan, maka perangkat asesmen berikut ini:
        </p>
      </div>

      {/* Identitas Asesmen */}
      <div className="text-xs mb-4 border border-black p-2.5 grid grid-cols-2 gap-1 bg-slate-50/60 print:bg-transparent">
        <div>
          <span className="font-semibold inline-block w-28">Nama Asesmen:</span>
          <span>{data.identitas.judul_asesmen}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Mata Pelajaran:</span>
          <span>{data.identitas.mata_pelajaran}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kelas / Rombel:</span>
          <span>{data.identitas.kelas_rombel}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Tahun Ajaran:</span>
          <span>
            {data.identitas.tahun_ajaran} ({data.identitas.semester.toUpperCase()})
          </span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Tanggal Telaah:</span>
          <span>{data.identitas.tanggal_pengesahan}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Segel Kriptografis:</span>
          <span className="font-mono font-bold">{sealCode}</span>
        </div>
      </div>

      {/* Tabel Telaah Kualitas & Aspek Verifikasi */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider mb-1.5">
          A. HASIL VERIFIKASI & PENELAAHAN INSTRUMEN:
        </p>
        <table className="pengesahan-table w-full border-collapse border border-black text-xs leading-tight">
          <thead>
            <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
              <th className="border border-black p-1.5 w-8">No</th>
              <th className="border border-black p-1.5 w-48 text-left">Aspek Penelaahan</th>
              <th className="border border-black p-1.5 text-left">Indikator / Kriteria Telaah</th>
              <th className="border border-black p-1.5 w-24">Hasil Telaah</th>
              <th className="border border-black p-1.5 w-40 text-left">Catatan Penelaah</th>
            </tr>
          </thead>
          <tbody>
            {data.aspek_verifikasi.map((item) => (
              <tr key={item.no} className="align-top">
                <td className="border border-black p-1.5 text-center font-bold">{item.no}</td>
                <td className="border border-black p-1.5 font-medium">{item.aspek}</td>
                <td className="border border-black p-1.5 text-slate-700">{item.kriteria}</td>
                <td className="border border-black p-1.5 text-center font-bold text-emerald-800 print:text-black">
                  {item.hasil_telaah}
                </td>
                <td className="border border-black p-1.5 text-[11px] text-slate-600">
                  {item.catatan || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rekomendasi Tim Supervisi */}
      <div className="text-xs mb-6 border border-black p-2.5 bg-slate-50/50 print:bg-transparent">
        <p className="font-bold uppercase tracking-wider mb-1">B. KEPUTUSAN & REKOMENDASI MUTU:</p>
        <p className="font-medium text-slate-900">
          Status:{" "}
          <span className="font-bold underline uppercase text-emerald-900 print:text-black">
            {data.rekomendasi.replace(/_/g, " ")}
          </span>
        </p>
        <p className="text-[11px] text-slate-700 mt-1 italic">
          &ldquo;
          {data.catatan_supervisor ||
            "Perangkat instrumen asesmen memenuhi seluruh standar kurikulum."}
          &rdquo;
        </p>
      </div>

      {/* Kolom Tanda Tangan 3 Pihak Resmi Bertingkat */}
      <div className="pt-2 break-inside-avoid">
        <p className="text-xs text-right mb-4">
          Ditetapkan di sekolah, {data.identitas.tanggal_pengesahan}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {/* 1. Guru Penyusun */}
          <div className="flex flex-col justify-between h-40 border border-transparent">
            <div>
              <p className="font-semibold text-slate-700">Penyusun,</p>
              <p className="text-[10px] text-slate-600">Guru Mata Pelajaran</p>
            </div>
            <div>
              <p className="font-bold underline">{data.pihak_pengesah.guru_penyusun.nama}</p>
              <p className="text-[10px] text-slate-600">
                NIP.{" "}
                {data.pihak_pengesah.guru_penyusun.nip ||
                  "........................................"}
              </p>
            </div>
          </div>

          {/* 2. Penelaah Kurikulum */}
          <div className="flex flex-col justify-between h-40 border border-transparent">
            <div>
              <p className="font-semibold text-slate-700">Penelaah / Verifikator,</p>
              <p className="text-[10px] text-slate-600">
                {data.pihak_pengesah.penelaah_kurikulum.jabatan}
              </p>
            </div>
            <div>
              <p className="font-bold underline">{data.pihak_pengesah.penelaah_kurikulum.nama}</p>
              <p className="text-[10px] text-slate-600">
                NIP.{" "}
                {data.pihak_pengesah.penelaah_kurikulum.nip ||
                  "........................................"}
              </p>
            </div>
          </div>

          {/* 3. Kepala Sekolah */}
          <div className="flex flex-col justify-between h-40 border border-transparent">
            <div>
              <p className="font-semibold text-slate-700">Mengesahkan,</p>
              <p className="text-[10px] text-slate-600">
                {data.pihak_pengesah.kepala_sekolah.jabatan}
              </p>
            </div>
            <div>
              <p className="font-bold underline">{data.pihak_pengesah.kepala_sekolah.nama}</p>
              <p className="text-[10px] text-slate-600">
                NIP.{" "}
                {data.pihak_pengesah.kepala_sekolah.nip ||
                  "........................................"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Academic Ledger • Berkas Resmi Supervisi Pendidikan</span>
        <span className="font-mono">Integritas: {sealCode}</span>
      </div>
    </div>
  );
}
