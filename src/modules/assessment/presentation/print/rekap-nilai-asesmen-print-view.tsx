"use client";

import React from "react";
import { RekapNilaiAsesmenPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface RekapNilaiAsesmenPrintViewProps {
  data: RekapNilaiAsesmenPayloadDTO;
}

export function RekapNilaiAsesmenPrintView({ data }: RekapNilaiAsesmenPrintViewProps) {
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
          .rekap-table thead {
            display: table-header-group;
          }
          .rekap-table tr {
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
          REKAPITULASI NILAI ASESMEN & KETUNTASAN KKTP
        </h2>
        <p className="text-xs font-semibold text-slate-800 uppercase">
          {data.identitas.judul_asesmen}
        </p>
      </div>

      {/* Identitas Asesmen & KKTP */}
      <div className="text-xs mb-3 border border-black p-2.5 grid grid-cols-2 gap-1 bg-slate-50/60 print:bg-transparent">
        <div>
          <span className="font-semibold inline-block w-28">Mata Pelajaran:</span>
          <span>{data.identitas.mata_pelajaran}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kriteria KKTP:</span>
          <span className="font-bold">{data.identitas.kkm_kktp} Poin</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kelas / Rombel:</span>
          <span>{data.identitas.kelas_rombel}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Guru Pengampu:</span>
          <span>{data.identitas.guru_nama}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Tahun Ajaran:</span>
          <span>
            {data.identitas.tahun_ajaran} • Semester {data.identitas.semester.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="font-semibold inline-block w-28">Kode Segel:</span>
          <span className="font-mono font-bold">{sealCode}</span>
        </div>
      </div>

      {/* Kotak Rekapitulasi Statistik Kelas */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs border border-black p-2 mb-4 bg-slate-100/50 print:bg-transparent">
        <div className="border-r border-black/30 pr-1">
          <p className="text-[10px] text-slate-600 uppercase">Rata-Rata Kelas</p>
          <p className="font-bold text-sm text-slate-900">
            {data.statistik.rata_rata_kelas ?? "-"}
          </p>
        </div>
        <div className="border-r border-black/30 pr-1">
          <p className="text-[10px] text-slate-600 uppercase">Nilai Tertinggi / Terendah</p>
          <p className="font-bold text-sm text-slate-900">
            {data.statistik.nilai_tertinggi ?? "-"} / {data.statistik.nilai_terendah ?? "-"}
          </p>
        </div>
        <div className="border-r border-black/30 pr-1">
          <p className="text-[10px] text-slate-600 uppercase">Ketuntasan KKTP</p>
          <p className="font-bold text-sm text-emerald-800 print:text-black">
            {data.statistik.jumlah_tuntas} Siswa ({data.statistik.persentase_tuntas}%)
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 uppercase">Perlu Remedial</p>
          <p className="font-bold text-sm text-amber-800 print:text-black">
            {data.statistik.jumlah_remedial} Siswa
          </p>
        </div>
      </div>

      {/* Tabel Peserta Nilai & Status KKTP */}
      <table className="rekap-table w-full border-collapse border border-black text-xs leading-tight mb-4">
        <thead>
          <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
            <th className="border border-black p-1.5 w-8">No</th>
            <th className="border border-black p-1.5 w-24">NIS</th>
            <th className="border border-black p-1.5 text-left">Nama Peserta Didik</th>
            <th className="border border-black p-1.5 w-16">Nilai</th>
            <th className="border border-black p-1.5 w-12">Predikat</th>
            <th className="border border-black p-1.5 w-24">Status KKTP</th>
            <th className="border border-black p-1.5 w-24">Tindak Lanjut</th>
          </tr>
        </thead>
        <tbody>
          {data.peserta_nilai.map((peserta) => (
            <tr key={peserta.siswa_id} className="h-7">
              <td className="border border-black p-1 text-center font-bold">{peserta.nomor}</td>
              <td className="border border-black p-1 text-center font-mono text-[11px]">
                {peserta.nis}
              </td>
              <td className="border border-black p-1 uppercase font-medium">
                {peserta.nama_lengkap}
              </td>
              <td className="border border-black p-1 text-center font-bold">
                {peserta.nilai_angka !== null ? peserta.nilai_angka : "-"}
              </td>
              <td className="border border-black p-1 text-center font-semibold">
                {peserta.predikat}
              </td>
              <td
                className={`border border-black p-1 text-center font-bold text-[10.5px] ${
                  peserta.status_tuntas === "TUNTAS"
                    ? "text-emerald-800 print:text-black"
                    : "text-rose-800 print:text-black"
                }`}
              >
                {peserta.status_tuntas}
              </td>
              <td className="border border-black p-1 text-center text-[10px] font-medium">
                {peserta.status_tindak_lanjut}
              </td>
            </tr>
          ))}
          {data.peserta_nilai.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-black p-4 text-center text-slate-500 italic">
                Belum ada data nilai peserta didik untuk asesmen ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Kolom Tanda Tangan Pengesahan */}
      <div className="flex justify-between items-start text-xs pt-4 break-inside-avoid">
        <div className="text-center w-60">
          <p>Mengetahui,</p>
          <p className="font-semibold">Waka Kurikulum</p>
          <div className="h-16" />
          <p className="font-bold underline">___________________________</p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>

        <div className="text-center w-60">
          <p>Guru Mata Pelajaran,</p>
          <div className="h-16" />
          <p className="font-bold underline">
            {data.identitas.guru_nama || "___________________________"}
          </p>
          <p className="text-[10px] text-slate-600">
            NIP. ........................................
          </p>
        </div>
      </div>

      {/* Footer Dokumen */}
      <div className="mt-8 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Academic Ledger • Rekapitulasi Sah Nilai Pembelajaran</span>
        <span className="font-mono">Integritas: {sealCode}</span>
      </div>
    </div>
  );
}
