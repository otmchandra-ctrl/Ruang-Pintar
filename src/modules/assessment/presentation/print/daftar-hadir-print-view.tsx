"use client";

import React from "react";
import { DaftarHadirPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface DaftarHadirPrintViewProps {
  data: DaftarHadirPayloadDTO;
}

export function DaftarHadirPrintView({ data }: DaftarHadirPrintViewProps) {
  const sealCode = formatSnapshotSealCode(
    data.snapshot_hash || "DRAFT-PREVIEW-00000000",
    new Date().getFullYear().toString()
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
          .absen-table thead {
            display: table-header-group;
          }
          .absen-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Kop Sekolah Resmi */}
      <SchoolLetterhead kop={data.kop_sekolah} />

      {/* Judul Dokumen */}
      <div className="text-center my-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          DAFTAR HADIR PESERTA ASESMEN / UJIAN
        </h2>
        <p className="text-xs font-semibold text-slate-800 uppercase">
          {data.metadata_ujian.judul_asesmen}
        </p>
      </div>

      {/* Identitas Pelaksanaan */}
      <div className="text-xs mb-3 border border-black p-2.5 grid grid-cols-2 gap-1 bg-slate-50/60 print:bg-transparent">
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
          <span className="font-semibold inline-block w-28">Ruang Ujian:</span>
          <span>{data.metadata_ujian.ruang || "Ruang Kelas"}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kode Segel:</span>
          <span className="font-mono font-bold">{sealCode}</span>
        </div>
      </div>

      {/* Tabel Daftar Hadir Siswa */}
      <table className="absen-table w-full border-collapse border border-black text-xs leading-tight mb-4">
        <thead>
          <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
            <th className="border border-black p-2 w-8">No</th>
            <th className="border border-black p-2 w-24">NIS / NISN</th>
            <th className="border border-black p-2 text-left">Nama Peserta Didik</th>
            <th className="border border-black p-2 w-48 text-center" colSpan={2}>
              Tanda Tangan Peserta
            </th>
            <th className="border border-black p-2 w-20">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {data.siswa_list.map((siswa, idx) => {
            const isGanjil = idx % 2 === 0;
            return (
              <tr key={siswa.siswa_id} className="h-9">
                <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                <td className="border border-black p-1 text-center font-mono text-[10px]">
                  <div>{siswa.nis}</div>
                  {siswa.nisn && <div className="text-slate-500">{siswa.nisn}</div>}
                </td>
                <td className="border border-black p-1 uppercase font-medium">
                  {siswa.nama_lengkap}
                </td>

                {/* Kolom Tanda Tangan Zig-zag (Ganjil di Kiri, Genap di Kanan) */}
                <td className="border border-black p-1 w-24 align-top">
                  {isGanjil ? (
                    <span className="text-[10px] text-slate-700 font-semibold">
                      {idx + 1}. .........
                    </span>
                  ) : (
                    ""
                  )}
                </td>
                <td className="border border-black p-1 w-24 align-top">
                  {!isGanjil ? (
                    <span className="text-[10px] text-slate-700 font-semibold">
                      {idx + 1}. .........
                    </span>
                  ) : (
                    ""
                  )}
                </td>

                <td className="border border-black p-1 text-center text-[10px] text-slate-400">
                  {/* Kosong untuk diisi pengawas */}
                </td>
              </tr>
            );
          })}
          {data.siswa_list.length === 0 && (
            <tr>
              <td colSpan={6} className="border border-black p-4 text-center text-slate-500 italic">
                Tidak ada data peserta didik pada rombongan belajar ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bagian Tanda Tangan Pengawas Ruang */}
      <div className="flex justify-between items-start text-xs pt-4 break-inside-avoid">
        <div className="text-center w-60">
          <p>Pengawas Ruang II,</p>
          <div className="h-16" />
          <p className="font-bold underline">___________________________</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>

        <div className="text-center w-60">
          <p>Pengawas Ruang I,</p>
          <div className="h-16" />
          <p className="font-bold underline">___________________________</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Examination Engine • Lembar Absensi Sah Pelaksanaan Ujian</span>
        <span className="font-mono">Integritas: {sealCode}</span>
      </div>
    </div>
  );
}
