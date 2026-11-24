"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  ShieldCheck,
  School as SchoolIcon,
  User,
} from "lucide-react";
import { StudentIdentityDTO } from "../../domain/student-types";

export interface SchoolCardData {
  nama: string;
  npsn?: string | null;
  jenjang?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  email?: string | null;
  logo_url?: string | null;
  kota?: string;
  kepala_sekolah_nama?: string;
  kepala_sekolah_nip?: string | null;
}

interface StudentCardsPrintViewProps {
  students: StudentIdentityDTO[];
  school: SchoolCardData;
  rombelNama?: string;
}

/**
 * Komponen Barcode SVG Sederhana & Efisien berbasis ID/NISN
 */
function CardBarcode({ code }: { code: string }) {
  // Buat pola garis konsisten berdasarkan karakter kode
  const pattern = (code || "1234567890").split("").map((c, i) => {
    const codeVal = c.charCodeAt(0);
    const isThick = codeVal % 2 === 0;
    const isGap = i % 3 === 0;
    return { isThick, isGap };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end h-5 gap-[1.5px] px-1 bg-white">
        {pattern.slice(0, 24).map((p, idx) => (
          <div
            key={idx}
            className={`h-full bg-black ${p.isThick ? "w-[2.5px]" : "w-[1px]"} ${
              p.isGap ? "mr-[1px]" : ""
            }`}
          />
        ))}
      </div>
      <span className="text-[6.5pt] font-mono tracking-widest text-slate-700 leading-none mt-0.5">
        {code || "RP-STUDENT"}
      </span>
    </div>
  );
}

/**
 * Komponen QR Code SVG Standar ID Card
 */
function CardQrCode({ value }: { value: string }) {
  return (
    <div className="w-10 h-10 p-0.5 bg-white border border-slate-300 rounded shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
        {/* Sudut Kiri Atas */}
        <rect x="0" y="0" width="28" height="28" fill="currentColor" />
        <rect x="4" y="4" width="20" height="20" fill="white" />
        <rect x="8" y="8" width="12" height="12" fill="currentColor" />

        {/* Sudut Kanan Atas */}
        <rect x="72" y="0" width="28" height="28" fill="currentColor" />
        <rect x="76" y="4" width="20" height="20" fill="white" />
        <rect x="80" y="8" width="12" height="12" fill="currentColor" />

        {/* Sudut Kiri Bawah */}
        <rect x="0" y="72" width="28" height="28" fill="currentColor" />
        <rect x="4" y="76" width="20" height="20" fill="white" />
        <rect x="8" y="80" width="12" height="12" fill="currentColor" />

        {/* Titik-titik pola verifikasi */}
        <rect x="36" y="8" width="8" height="8" />
        <rect x="52" y="12" width="10" height="6" />
        <rect x="40" y="24" width="8" height="8" />
        <rect x="12" y="38" width="8" height="8" />
        <rect x="26" y="46" width="6" height="8" />
        <rect x="36" y="40" width="16" height="16" />
        <rect x="58" y="36" width="10" height="8" />
        <rect x="76" y="44" width="12" height="6" />
        <rect x="38" y="64" width="8" height="8" />
        <rect x="54" y="60" width="10" height="6" />
        <rect x="70" y="64" width="8" height="12" />
        <rect x="40" y="80" width="12" height="8" />
        <rect x="60" y="78" width="8" height="10" />
        <rect x="76" y="82" width="12" height="6" />
      </svg>
    </div>
  );
}

/**
 * Komponen 1 Kartu Pelajar Fisik (Ukuran CR80: 85.6mm x 54mm)
 */
function SingleStudentCard({
  student,
  school,
  showRulesBack = false,
}: {
  student: StudentIdentityDTO;
  school: SchoolCardData;
  showRulesBack?: boolean;
}) {
  const formattedTtl = React.useMemo(() => {
    const parts: string[] = [];
    if (student.tempat_lahir) parts.push(student.tempat_lahir);
    if (student.tanggal_lahir) {
      const d = new Date(student.tanggal_lahir);
      parts.push(
        d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    }
    return parts.length > 0 ? parts.join(", ") : "—";
  }, [student.tempat_lahir, student.tanggal_lahir]);

  const identifierCode = student.nisn || student.nis || student.id.slice(-8);

  // Bagian Belakang Kartu (Tata Tertib & Ketentuan)
  if (showRulesBack) {
    return (
      <div className="card-item w-[85.6mm] h-[54mm] bg-white border border-dashed border-slate-300 rounded-lg p-2.5 flex flex-col justify-between text-slate-800 select-none overflow-hidden box-border shadow-xs print:shadow-none print:border-slate-400">
        <div className="border-b border-slate-200 pb-1 text-center">
          <h4 className="text-[7.5pt] font-black uppercase tracking-wider text-slate-900">
            TATA TERTIB &amp; KETENTUAN KARTU
          </h4>
          <p className="text-[5.5pt] text-slate-500">{school.nama}</p>
        </div>

        <ol className="text-[5.8pt] leading-tight space-y-1 text-slate-700 pl-3.5 list-decimal font-medium">
          <li>Kartu ini adalah identitas resmi siswa {school.nama}.</li>
          <li>Wajib dibawa saat kegiatan KBM, Asesmen/CBT, dan perpustakaan.</li>
          <li>Dilarang mencoret, merusak, atau meminjamkan kartu ini ke pihak lain.</li>
          <li>Jika menemukan kartu ini, harap dikembalikan ke ruang Tata Usaha sekolah.</li>
          <li>Berlaku selama pemilik masih berstatus siswa aktif.</li>
        </ol>

        <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[5.5pt] text-slate-500 font-mono">
          <span>Ruang Pintar Academic OS</span>
          <span>ID: {identifierCode}</span>
        </div>
      </div>
    );
  }

  // Bagian Depan Kartu
  return (
    <div className="card-item w-[85.6mm] h-[54mm] bg-white border border-dashed border-slate-300 rounded-lg p-2 flex flex-col justify-between text-slate-900 select-none overflow-hidden box-border shadow-xs print:shadow-none print:border-slate-400 relative">
      {/* Background Accent Decorative Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

      {/* 1. KOP KARTU */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-1.5 pt-0.5">
        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded bg-slate-50 border border-slate-200 overflow-hidden">
          {school.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logo_url} alt="Logo" className="w-full h-full object-contain p-0.5" />
          ) : (
            <SchoolIcon className="w-5 h-5 text-blue-700" />
          )}
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <h3 className="text-[7.5pt] font-black uppercase text-slate-900 truncate">
            {school.nama}
          </h3>
          <p className="text-[5.5pt] text-slate-600 truncate leading-none">
            {school.alamat || "Indonesia"} {school.npsn ? `• NPSN: ${school.npsn}` : ""}
          </p>
          <div className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-black text-[5pt] tracking-widest uppercase">
            KARTU TANDA PELAJAR
          </div>
        </div>
      </div>

      {/* 2. BODY: Foto Siswa + Identitas */}
      <div className="flex gap-2 my-auto items-center">
        {/* Pas Foto 3x4 Proporsional */}
        <div className="w-[18mm] h-[24mm] shrink-0 rounded border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center relative">
          {student.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.foto_url}
              alt={student.nama_lengkap}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center">
              <User className="w-7 h-7 mb-0.5" />
              <span className="text-[4.5pt] font-bold">FOTO 3×4</span>
            </div>
          )}
        </div>

        {/* Data Siswa */}
        <div className="flex-1 min-w-0 text-[6.2pt] leading-tight space-y-0.5 text-slate-800">
          <div className="flex">
            <span className="w-12 shrink-0 text-slate-500 font-medium">Nama</span>
            <span className="mr-1">:</span>
            <span className="font-bold text-slate-900 truncate uppercase text-[6.8pt]">
              {student.nama_lengkap}
            </span>
          </div>
          <div className="flex">
            <span className="w-12 shrink-0 text-slate-500 font-medium">NIS / NISN</span>
            <span className="mr-1">:</span>
            <span className="font-mono font-semibold text-slate-900">
              {student.nis || "—"} / {student.nisn || "—"}
            </span>
          </div>
          <div className="flex">
            <span className="w-12 shrink-0 text-slate-500 font-medium">Kelas</span>
            <span className="mr-1">:</span>
            <span className="font-semibold text-blue-800">{student.active_rombel_nama || "—"}</span>
          </div>
          <div className="flex">
            <span className="w-12 shrink-0 text-slate-500 font-medium">TTL</span>
            <span className="mr-1">:</span>
            <span className="truncate">{formattedTtl}</span>
          </div>
          <div className="flex">
            <span className="w-12 shrink-0 text-slate-500 font-medium">Jenis Kel.</span>
            <span className="mr-1">:</span>
            <span>{student.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</span>
          </div>
          <div className="flex">
            <span className="w-12 shrink-0 text-slate-500 font-medium">Berlaku</span>
            <span className="mr-1">:</span>
            <span className="font-semibold text-emerald-700">Selama Menjadi Siswa</span>
          </div>
        </div>
      </div>

      {/* 3. FOOTER: Barcode / QR & TTD Kepala Sekolah */}
      <div className="flex items-end justify-between border-t border-slate-200/90 pt-1">
        {/* Kode Barcode & Identitas Siswa */}
        <div className="flex items-center gap-1.5">
          <CardQrCode value={identifierCode} />
          <CardBarcode code={identifierCode} />
        </div>

        {/* Kolom Tanda Tangan Kepala Sekolah */}
        <div className="text-right text-[5.5pt] leading-tight pr-1">
          <p className="text-slate-600">
            {school.kota || "Sekolah"}, {new Date().getFullYear()}
          </p>
          <p className="font-semibold text-slate-800">Kepala Sekolah,</p>
          <div className="h-4 flex items-center justify-end">
            <span className="text-[5pt] text-slate-300 italic font-serif">[TTD / STEMPEL]</span>
          </div>
          <p className="font-bold underline text-slate-900">
            {school.kepala_sekolah_nama || "Kepala Sekolah"}
          </p>
          {school.kepala_sekolah_nip && (
            <p className="font-mono text-slate-600">NIP. {school.kepala_sekolah_nip}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentCardsPrintView({
  students,
  school,
  rombelNama,
}: StudentCardsPrintViewProps) {
  const [viewMode, setViewMode] = useState<"front" | "back">("front");

  // Setiap halaman A4 memuat maksimal 8 kartu (2 kolom x 4 baris)
  const CARDS_PER_PAGE = 8;
  const chunkedPages = React.useMemo(() => {
    const pages: StudentIdentityDTO[][] = [];
    for (let i = 0; i < students.length; i += CARDS_PER_PAGE) {
      pages.push(students.slice(i, i + CARDS_PER_PAGE));
    }
    return pages;
  }, [students]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 pb-16 print:p-0 print:m-0 print:bg-white">
      {/* Print Stylesheet W3C Paged Media */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          html,
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-toolbar {
            display: none !important;
          }
          .a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          .card-item {
            break-inside: avoid;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* TOOLBAR KONTROL CETAK (Disembunyikan saat print)          */}
      {/* ========================================================= */}
      <header className="print-toolbar sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/data-siswa"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Data Siswa</span>
          </Link>
          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>Cetak Kartu Tanda Pelajar (KTS)</span>
              {rombelNama && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-mono">
                  {rombelNama}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format Standar A4 (8 Kartu / Lembar) • {students.length} Siswa Terpilih (
              {chunkedPages.length} Lembar)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode Switcher: Tampak Depan vs Tata Tertib Belakang */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("front")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "front"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tampak Depan
            </button>
            <button
              type="button"
              onClick={() => setViewMode("back")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "back"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tata Tertib (Belakang)
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Kartu ({students.length})</span>
          </button>
        </div>
      </header>

      {/* Petunjuk Penggunaan bagi Guru/Staff */}
      <div className="print-toolbar max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Petunjuk Cetak Presisi Kertas A4:</p>
            <p className="text-[11px] text-blue-800 dark:text-blue-300">
              Gunakan kertas tebal (Brief Card / Art Carton 230–260 gsm) atau kertas stiker PVC.
              Pada dialog cetak browser, pastikan ukuran kertas disetel ke <strong>A4</strong>,
              margin <strong>None / Default</strong>, dan centang opsi{" "}
              <strong>Background graphics</strong> agar warna aksen kartu tercetak tajam.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LEMBAR CETAK A4 (GRID 2 KOLOM × 4 BARIS PER HALAMAN)       */}
      {/* ========================================================= */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 print:p-0 print:m-0 print:space-y-0">
        {chunkedPages.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Tidak Ada Siswa Terpilih
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan kembali ke direktori Data Siswa dan pilih siswa atau rombel yang ingin dicetak
              kartu pelajarnya.
            </p>
          </div>
        ) : (
          chunkedPages.map((pageStudents, pageIndex) => (
            <div
              key={pageIndex}
              className="a4-page bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-lg mx-auto print:border-none print:shadow-none"
              style={{
                width: "210mm",
                minHeight: "297mm",
                boxSizing: "border-box",
              }}
            >
              {/* Header Info Halaman (Layar Saja) */}
              <div className="print:hidden flex items-center justify-between text-[11px] font-mono text-slate-400 mb-4 pb-2 border-b border-slate-100">
                <span>LEMBAR A4 #{pageIndex + 1}</span>
                <span>
                  {pageStudents.length} KARTU (
                  {viewMode === "front" ? "Tampak Depan" : "Tata Tertib"})
                </span>
              </div>

              {/* Grid 2 Kolom x 4 Baris */}
              <div
                className="grid grid-cols-2 gap-x-[6mm] gap-y-[4.5mm] justify-items-center"
                style={{ width: "100%" }}
              >
                {pageStudents.map((student) => (
                  <SingleStudentCard
                    key={student.id}
                    student={student}
                    school={school}
                    showRulesBack={viewMode === "back"}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
