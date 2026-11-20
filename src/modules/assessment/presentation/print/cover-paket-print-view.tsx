"use client";

import React from "react";
import { CoverPaketAsesmenPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";

interface CoverPaketPrintViewProps {
  data: CoverPaketAsesmenPayloadDTO;
}

export function CoverPaketPrintView({ data }: CoverPaketPrintViewProps) {
  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen flex flex-col justify-between">
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
          .cover-border-box {
            border: 2px solid #000000 !important;
          }
        }
      `}</style>

      {/* Header Kop Resmi */}
      <div>
        <SchoolLetterhead kop={data.kop_sekolah} />

        {/* Bingkai Judul Sampul Portofolio */}
        <div className="cover-border-box border-2 border-black p-6 my-6 text-center rounded-xs bg-slate-50/50 print:bg-transparent">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-700 mb-1">
            DOKUMEN PORTOFOLIO RESMI GURU & SATUAN PENDIDIKAN
          </p>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-serif mb-2 leading-tight">
            PAKET PERANGKAT ADMINISTRASI ASESMEN
          </h1>
          <div className="h-0.5 bg-black w-24 mx-auto my-2" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 mt-2">
            {data.identitas.judul_asesmen}
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            TAHUN AJARAN {data.identitas.tahun_ajaran} • SEMESTER{" "}
            {data.identitas.semester.toUpperCase()}
          </p>
        </div>

        {/* Metadata Identitas Ujian */}
        <div className="max-w-lg mx-auto text-xs border border-black p-4 space-y-2 bg-white mb-6">
          <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5">
            <span className="font-semibold text-slate-700">Mata Pelajaran:</span>
            <span className="font-bold text-slate-900">{data.identitas.mata_pelajaran}</span>
          </div>
          <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5">
            <span className="font-semibold text-slate-700">Kelas / Rombel:</span>
            <span className="font-bold text-slate-900">{data.identitas.kelas_rombel}</span>
          </div>
          <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5">
            <span className="font-semibold text-slate-700">Guru Pengampu:</span>
            <span className="font-bold text-slate-900">{data.identitas.guru_pengampu}</span>
          </div>
          {data.identitas.nip_guru && (
            <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5">
              <span className="font-semibold text-slate-700">NIP Guru:</span>
              <span className="font-mono text-slate-900">{data.identitas.nip_guru}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-dotted border-slate-400 pb-1.5">
            <span className="font-semibold text-slate-700">Tanggal Dokumen:</span>
            <span className="text-slate-900">{data.identitas.tanggal_penyusunan}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Status Versi:</span>
            <span className="font-bold uppercase text-slate-900">
              {data.status_dokumen === "FINAL" ? "FINAL (TERSEGEL)" : "DRAF (PREVIEW)"}
            </span>
          </div>
        </div>

        {/* Kotak Segel Kriptografis & Snapshot Hash */}
        <div className="max-w-lg mx-auto border border-black p-3.5 bg-slate-50 print:bg-transparent text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Segel Integritas Kriptografis:
            </span>
            <span className="font-mono font-black text-sm bg-black text-white px-2 py-0.5 rounded-xs">
              {data.kode_segel}
            </span>
          </div>
          <div className="text-[9px] text-slate-600 font-mono break-all mt-1">
            SHA-256: {data.snapshot_hash || "UNFROZEN-DRAFT-PREVIEW"}
          </div>
          {data.tanggal_dibekukan && (
            <p className="text-[9px] text-emerald-800 font-medium mt-1">
              Dibekukan secara permanen pada:{" "}
              {new Date(data.tanggal_dibekukan).toLocaleString("id-ID")}
            </p>
          )}
        </div>

        {/* Tabel Ringkasan Dokumen dalam Paket */}
        <div className="text-xs">
          <p className="font-bold uppercase tracking-wider text-slate-800 mb-2">
            DAFTAR BERKAS DALAM BUNDEL ADMINISTRASI ({data.total_lampiran} DOKUMEN):
          </p>
          <table className="w-full border-collapse border border-black text-[10.5px] leading-tight">
            <thead>
              <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
                <th className="border border-black p-1.5 w-8">No</th>
                <th className="border border-black p-1.5 text-left">Nama Berkas Administrasi</th>
                <th className="border border-black p-1.5 w-24">Orientasi</th>
                <th className="border border-black p-1.5 w-24">Status</th>
                <th className="border border-black p-1.5 text-left">Fungsi / Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {data.daftar_dokumen_lampiran.map((doc) => (
                <tr key={doc.no}>
                  <td className="border border-black p-1.5 text-center font-bold">{doc.no}</td>
                  <td className="border border-black p-1.5 font-medium">{doc.nama_dokumen}</td>
                  <td className="border border-black p-1.5 text-center">{doc.orientasi}</td>
                  <td className="border border-black p-1.5 text-center font-semibold text-emerald-800 print:text-black">
                    {doc.status}
                  </td>
                  <td className="border border-black p-1.5 text-slate-600">
                    {doc.keterangan || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Cover */}
      <div className="mt-8 pt-3 border-t border-black flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Examination & Academic Quality System</span>
        <span>Halaman 1 dari Bundel Administrasi Lengkap</span>
      </div>
    </div>
  );
}
