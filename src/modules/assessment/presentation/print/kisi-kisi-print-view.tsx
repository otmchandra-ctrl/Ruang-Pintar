"use client";

import React from "react";
import { KisiKisiAsesmenDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface KisiKisiPrintViewProps {
  data: KisiKisiAsesmenDTO;
  kopSekolah?: any;
}

export function KisiKisiPrintView({ data, kopSekolah }: KisiKisiPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    data.tahun_ajaran
  );

  const defaultKop = kopSekolah || {
    nama_sekolah: "Ruang Pintar School",
    npsn: "12345678",
    alamat: "Jl. Pendidikan Nasional No. 1",
    baris_instansi_2: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
  };

  return (
    <div className="bg-white text-black p-6 sm:p-10 font-sans print:p-0 print:m-0 min-h-screen">
      {/* Print Page Styles */}
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
          .kisi-kisi-table thead {
            display: table-header-group;
          }
          .kisi-kisi-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Kop Sekolah */}
      <SchoolLetterhead kop={defaultKop} />

      {/* Judul Dokumen */}
      <div className="text-center my-4">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          KISI-KISI PENULISAN SOAL ASESMEN
        </h2>
        <p className="text-xs font-semibold text-slate-800">
          TAHUN AJARAN {data.tahun_ajaran} • SEMESTER {data.semester.toUpperCase()}
        </p>
      </div>

      {/* Metadata Singkat */}
      <div className="grid grid-cols-2 text-xs mb-4 border border-black/40 p-2.5 rounded-xs gap-1 bg-slate-50/50 print:bg-transparent">
        <div>
          <span className="font-semibold inline-block w-32">Mata Pelajaran:</span>
          <span>{data.mata_pelajaran_nama || "-"}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Alokasi Waktu:</span>
          <span>{data.alokasi_waktu_menit} Menit</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Kelas / Rombel:</span>
          <span>{data.rombel_nama || "-"}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Jumlah Butir Soal:</span>
          <span>{data.items.length} Butir</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Penyusun / Guru:</span>
          <span>{data.guru_nama || "-"}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Status Dokumen:</span>
          <span className="font-bold">{data.status}</span>
        </div>
      </div>

      {/* Tabel Matriks Kisi-Kisi */}
      <table className="kisi-kisi-table w-full border-collapse border border-black text-[10px] leading-tight mb-6">
        <thead>
          <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
            <th className="border border-black p-1.5 w-8">No</th>
            <th className="border border-black p-1.5 w-24">Kode TP</th>
            <th className="border border-black p-1.5 w-44">Tujuan Pembelajaran (TP)</th>
            <th className="border border-black p-1.5 w-32">Lingkup Materi</th>
            <th className="border border-black p-1.5">Indikator Soal</th>
            <th className="border border-black p-1.5 w-16">Level Kognitif</th>
            <th className="border border-black p-1.5 w-20">Bentuk Soal</th>
            <th className="border border-black p-1.5 w-12">No. Soal</th>
            <th className="border border-black p-1.5 w-12">Bobot</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={item.id} className="align-top">
              <td className="border border-black p-1.5 text-center">{idx + 1}</td>
              <td className="border border-black p-1.5 font-mono font-medium">
                {item.tp_kode || "-"}
              </td>
              <td className="border border-black p-1.5">{item.tp_deskripsi || "-"}</td>
              <td className="border border-black p-1.5">{item.lingkup_materi_judul || "-"}</td>
              <td className="border border-black p-1.5 text-justify">{item.indikator_soal}</td>
              <td className="border border-black p-1.5 text-center font-bold">
                {item.level_kognitif}
              </td>
              <td className="border border-black p-1.5 text-center">{item.bentuk_soal}</td>
              <td className="border border-black p-1.5 text-center font-semibold">
                {item.nomor_urut}
              </td>
              <td className="border border-black p-1.5 text-center">{item.bobot_skor}</td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={9} className="border border-black p-4 text-center text-slate-500 italic">
                Belum ada butir matriks kisi-kisi yang ditambahkan.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bagian Tanda Tangan Resmi */}
      <div className="flex justify-between items-start text-xs pt-4 break-inside-avoid">
        <div className="text-center w-64">
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala Sekolah / Waka Kurikulum</p>
          <div className="h-16" />
          <p className="font-bold underline">___________________________</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>

        <div className="text-center w-64">
          <p>Dibuat di tempat,</p>
          <p className="font-semibold">Guru Mata Pelajaran</p>
          <div className="h-16" />
          <p className="font-bold underline">{data.guru_nama || "___________________________"}</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>
      </div>

      {/* Verification Seal Footer */}
      <div className="mt-8 pt-2 border-t border-dotted border-slate-400 flex items-center justify-between text-[9px] text-slate-600">
        <div>
          <span>Segel Integritas Dokumen: </span>
          <span className="font-mono font-bold text-slate-900">{sealCode}</span>
        </div>
        <div>
          <span>SHA-256: </span>
          <span className="font-mono text-[8px] text-slate-500 truncate max-w-xs inline-block align-bottom">
            {data.snapshot_hash || "UNFROZEN-DRAFT"}
          </span>
        </div>
      </div>
    </div>
  );
}
