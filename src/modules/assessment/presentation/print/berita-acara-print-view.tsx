"use client";

import React from "react";
import { BeritaAcaraPayloadDTO } from "@/modules/assessment/domain/assessment-types";
import { SchoolLetterhead } from "./school-letterhead";
import { formatSnapshotSealCode } from "@/modules/assessment/infrastructure/snapshot-hash-helper";

interface BeritaAcaraPrintViewProps {
  data: BeritaAcaraPayloadDTO;
}

export function BeritaAcaraPrintView({ data }: BeritaAcaraPrintViewProps) {
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
          .ba-table thead {
            display: table-header-group;
          }
          .ba-table tr {
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
          BERITA ACARA PELAKSANAAN ASESMEN / UJIAN
        </h2>
        <p className="text-xs font-semibold text-slate-800 uppercase">
          {data.metadata_ujian.judul_asesmen}
        </p>
      </div>

      {/* Narasi Pembuka Berita Acara Resmi */}
      <div className="text-xs leading-relaxed text-justify mb-4">
        <p>
          Pada hari ini{" "}
          <span className="font-semibold underline">
            {data.metadata_ujian.hari_tanggal || "..................."}
          </span>
          , telah diselenggarakan pelaksanaan asesmen / ujian satuan pendidikan dengan rincian
          kegiatan sebagai berikut:
        </p>
      </div>

      {/* Rincian Pelaksanaan Ujian */}
      <div className="text-xs mb-4 border border-black p-2.5 grid grid-cols-2 gap-1 bg-slate-50/60 print:bg-transparent">
        <div>
          <span className="font-semibold inline-block w-32">Mata Pelajaran:</span>
          <span>{data.metadata_ujian.mata_pelajaran}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Ruang Ujian:</span>
          <span>{data.metadata_ujian.ruang || "Ruang Kelas"}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Kelas / Rombel:</span>
          <span>{data.metadata_ujian.kelas_rombel}</span>
        </div>
        <div>
          <span className="font-semibold inline-block w-32">Waktu Pelaksanaan:</span>
          <span>{data.metadata_ujian.waktu_mulai_selesai}</span>
        </div>
      </div>

      {/* Rincian Statistik Kehadiran */}
      <div className="text-xs mb-4">
        <p className="font-bold uppercase tracking-wider mb-1.5">
          A. REKAPITULASI KEHADIRAN PESERTA:
        </p>
        <div className="border border-black p-2.5 grid grid-cols-3 text-center gap-2 bg-slate-50/40 print:bg-transparent">
          <div className="border-r border-black/40 pr-2">
            <span className="text-[10px] text-slate-600 block uppercase">Jumlah Terdaftar</span>
            <span className="text-base font-bold">
              {data.statistik.jumlah_peserta_seharusnya} Siswa
            </span>
          </div>
          <div className="border-r border-black/40 pr-2">
            <span className="text-[10px] text-slate-600 block uppercase">Jumlah Hadir</span>
            <span className="text-base font-bold text-green-800 print:text-black">
              {data.statistik.jumlah_hadir} Siswa
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 block uppercase">Tidak Hadir</span>
            <span className="text-base font-bold text-red-800 print:text-black">
              {data.statistik.jumlah_tidak_hadir} Siswa
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Peserta yang Tidak Hadir */}
      <div className="text-xs mb-4">
        <p className="font-bold uppercase tracking-wider mb-1.5">B. DAFTAR PESERTA TIDAK HADIR:</p>
        <table className="ba-table w-full border-collapse border border-black text-xs leading-tight">
          <thead>
            <tr className="bg-slate-200 print:bg-slate-200 text-center font-bold">
              <th className="border border-black p-1.5 w-10">No</th>
              <th className="border border-black p-1.5 w-28">NIS</th>
              <th className="border border-black p-1.5 text-left">Nama Peserta Didik</th>
              <th className="border border-black p-1.5 w-32">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {data.siswa_tidak_hadir && data.siswa_tidak_hadir.length > 0 ? (
              data.siswa_tidak_hadir.map((siswa, idx) => (
                <tr key={siswa.nis}>
                  <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{siswa.nis}</td>
                  <td className="border border-black p-1.5 uppercase">{siswa.nama_lengkap}</td>
                  <td className="border border-black p-1.5 text-center font-semibold">
                    {siswa.keterangan}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="border border-black p-2 text-center text-slate-600 italic"
                >
                  Seluruh peserta hadir lengkap (Nihil).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Catatan Pelaksanaan */}
      <div className="text-xs mb-4">
        <p className="font-bold uppercase tracking-wider mb-1">
          C. CATATAN SELAMA PELAKSANAAN UJIAN:
        </p>
        <div className="border border-black p-2.5 min-h-16 leading-relaxed bg-slate-50/30 print:bg-transparent">
          {data.catatan_pelaksanaan || (
            <p className="text-slate-700">
              Ujian berjalan tertib, aman, dan lancar sesuai tata tertib yang berlaku.
            </p>
          )}
        </div>
      </div>

      {/* Penutup Naratif */}
      <div className="text-xs leading-relaxed text-justify mb-4">
        <p>
          Demikian Berita Acara ini dibuat dengan sesungguhnya dan ditandatangani oleh para pengawas
          ruang untuk dapat dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Tanda Tangan Pengawas Ruang */}
      <div className="flex justify-between items-start text-xs pt-4 break-inside-avoid">
        <div className="text-center w-60">
          <p>Pengawas Ruang II,</p>
          <div className="h-16" />
          <p className="font-bold underline">
            {data.pengawas_2?.nama || "___________________________"}
          </p>
          <p className="text-[10px] text-slate-600">
            NIP. {data.pengawas_2?.nip || "......................................."}
          </p>
        </div>

        <div className="text-center w-60">
          <p>Pengawas Ruang I,</p>
          <div className="h-16" />
          <p className="font-bold underline">
            {data.pengawas_1?.nama || "___________________________"}
          </p>
          <p className="text-[10px] text-slate-600">
            NIP. {data.pengawas_1?.nip || "......................................."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-dotted border-slate-400 flex justify-between items-center text-[9px] text-slate-500">
        <span>Ruang Pintar Examination Engine • Berita Acara Resmi Satuan Pendidikan</span>
        <span className="font-mono">Integritas: {sealCode}</span>
      </div>
    </div>
  );
}
