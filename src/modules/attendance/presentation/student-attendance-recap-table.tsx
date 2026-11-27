"use client";

/**
 * Ruang Pintar — M12 Student Attendance Recap Table Component
 *
 * Menampilkan tabel matriks rekapitulasi kehadiran seluruh siswa dalam rombel:
 * - Ringkasan KPI kehadiran kelas (Total siswa, total sesi terekam, rerata kehadiran, siswa perlu perhatian)
 * - Pencarian nama / NISN dan filter status kehadiran
 * - Tabel roster siswa lengkap: Hadir, Sakit, Izin, Alpha, Dispensasi, Terlambat, %, Status Evaluasi
 * - Ekspor berkas CSV rekapitulasi kelas instan dan tombol cetak A4
 */

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { exportAttendanceRecapExcelAction } from "@/app/actions/attendance-actions";
import { ClassAttendanceRecapDTO } from "../domain/attendance-types";
import {
  extractAvailableMonths,
  filterClassAttendanceRecapByMonth,
  mapAttendanceStatusToCode,
} from "../domain/attendance-recap-helper";

interface StudentAttendanceRecapTableProps {
  recap: ClassAttendanceRecapDTO;
  title?: string;
  showExportButtons?: boolean;
}

export function StudentAttendanceRecapTable({
  recap,
  showExportButtons = true,
}: StudentAttendanceRecapTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ATTENTION" | "GOOD">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  const availableMonths = useMemo(
    () => extractAvailableMonths(recap.sesi_pertemuan),
    [recap.sesi_pertemuan]
  );

  const activeRecap = useMemo(
    () => filterClassAttendanceRecapByMonth(recap, selectedMonth),
    [recap, selectedMonth]
  );

  const sessionDates = useMemo(
    () => activeRecap.sesi_pertemuan ?? [],
    [activeRecap.sesi_pertemuan]
  );

  // Filter siswa
  const filteredStudents = useMemo(() => {
    return activeRecap.daftar_siswa.filter((s) => {
      // Filter teks
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Filter status
      if (statusFilter === "ATTENTION") {
        return (
          s.status_evaluasi === "Perlu Perhatian" || s.alpha > 0 || s.persentase_kehadiran < 75
        );
      }
      if (statusFilter === "GOOD") {
        return s.status_evaluasi === "Sangat Baik" || s.status_evaluasi === "Baik";
      }

      return true;
    });
  }, [activeRecap.daftar_siswa, searchQuery, statusFilter]);

  // Statistik ringkasan
  const totalAlphaCases = useMemo(
    () => activeRecap.daftar_siswa.reduce((acc, s) => acc + s.alpha, 0),
    [activeRecap.daftar_siswa]
  );
  const totalSakitCases = useMemo(
    () => activeRecap.daftar_siswa.reduce((acc, s) => acc + s.sakit, 0),
    [activeRecap.daftar_siswa]
  );
  const totalIzinCases = useMemo(
    () => activeRecap.daftar_siswa.reduce((acc, s) => acc + s.izin, 0),
    [activeRecap.daftar_siswa]
  );

  // Ekspor CSV
  const handleExportCsv = () => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(now);

    const totalHadir = activeRecap.daftar_siswa.reduce((acc, s) => acc + s.hadir, 0);
    const totalSakit = activeRecap.daftar_siswa.reduce((acc, s) => acc + s.sakit, 0);
    const totalIzin = activeRecap.daftar_siswa.reduce((acc, s) => acc + s.izin, 0);
    const totalAlpha = activeRecap.daftar_siswa.reduce((acc, s) => acc + s.alpha, 0);
    const totalDispensasi = activeRecap.daftar_siswa.reduce((acc, s) => acc + s.dispensasi, 0);
    const totalTerlambat = activeRecap.daftar_siswa.reduce((acc, s) => acc + s.terlambat, 0);

    const hasRecordedSessions = activeRecap.total_sesi_tercatat > 0;

    const lines: string[] = [
      `"REKAPITULASI PRESENSI PEMBELAJARAN KELAS — RUANG PINTAR"`,
      `"Kelas / Rombel","${activeRecap.rombel_nama}"`,
      `"Mata Pelajaran","${activeRecap.mata_pelajaran_nama} (${activeRecap.mata_pelajaran_kode})"`,
      `"Guru Pengampu","${activeRecap.guru_nama || "-"}"`,
      `"Periode Rekap","${activeRecap.periode_label || "Semua Periode"}"`,
      `"Total Siswa","${activeRecap.total_siswa} Siswa"`,
      `"Sesi Diabsen","${activeRecap.total_sesi_tercatat} dari ${activeRecap.total_sesi_terjadwal} Sesi Terjadwal"`,
      `"Rerata Kehadiran Kelas","${hasRecordedSessions ? `${activeRecap.rerata_kehadiran_kelas}%` : "Belum Ada Sesi Tercatat"}"`,
      `"Tanggal Unduh","${formattedDate}"`,
      "",
      [
        "No",
        "No. Absen",
        "NISN",
        "NIS",
        "Nama Siswa",
        ...sessionDates.map((sd) => `"${sd.label_tanggal}"`),
        "Hadir (H)",
        "Sakit (S)",
        "Izin (I)",
        "Alpha (A)",
        "Dispensasi (D)",
        "Terlambat (T)",
        "Total Sesi",
        "Persentase Kehadiran",
        "Status Capaian",
      ].join(","),
    ];

    activeRecap.daftar_siswa.forEach((s, idx) => {
      const dateCodes = sessionDates.map(
        (sd) => `"${mapAttendanceStatusToCode(sd.status_per_siswa[s.siswa_id])}"`
      );
      const line = [
        idx + 1,
        s.nomor_absen ?? "-",
        `"${s.nisn ?? "-"}"`,
        `"${s.nis ?? "-"}"`,
        `"${s.nama_lengkap.replace(/"/g, '""')}"`,
        ...dateCodes,
        s.hadir,
        s.sakit,
        s.izin,
        s.alpha,
        s.dispensasi,
        s.terlambat,
        s.total_sesi_tercatat,
        `"${s.total_sesi_tercatat > 0 ? `${s.persentase_kehadiran}%` : "-"}"`,
        `"${s.total_sesi_tercatat > 0 ? s.status_evaluasi : "Belum Ada Sesi"}"`,
      ];
      lines.push(line.join(","));
    });

    lines.push("");
    lines.push(
      [
        `"TOTAL AKUMULASI KELAS"`,
        `""`,
        `""`,
        `""`,
        `"${activeRecap.daftar_siswa.length} Siswa"`,
        ...sessionDates.map(() => `""`),
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpha,
        totalDispensasi,
        totalTerlambat,
        activeRecap.total_sesi_tercatat,
        `"${hasRecordedSessions ? `${activeRecap.rerata_kehadiran_kelas}%` : "-"}"`,
        `"${hasRecordedSessions ? (activeRecap.rerata_kehadiran_kelas >= 85 ? "Baik / Sangat Baik" : "Perlu Perhatian") : "Belum Ada Sesi"}"`,
      ].join(",")
    );

    // Sertakan UTF-8 BOM (\uFEFF) dan sep=, agar Microsoft Excel di Windows otomatis membuka dengan format kolom yang benar
    const csvContent = "\uFEFFsep=,\r\n" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const monthSuffix = selectedMonth !== "ALL" ? `_${selectedMonth}` : "";
    const filename = `Rekap_Presensi_${activeRecap.rombel_nama.replace(/\s+/g, "_")}_${activeRecap.mata_pelajaran_kode}${monthSuffix}_${Date.now()}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ekspor Excel (.xlsx) Resmi (Multi-Kolom, Berwarna, Auto-Width)
  const [isExportingExcel, startExportExcelTransition] = useTransition();

  const handleExportExcel = () => {
    startExportExcelTransition(async () => {
      try {
        const res = await exportAttendanceRecapExcelAction(recap.penugasan_id, selectedMonth);
        if (res.success && res.data) {
          const binaryString = window.atob(res.data.base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes.buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = res.data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          alert(res.message || "Gagal mengunduh file Excel.");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh berkas Excel.";
        alert(msg);
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getEvaluationBadge = (status: string) => {
    switch (status) {
      case "Sangat Baik":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800";
      case "Baik":
        return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800";
      case "Cukup":
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800";
      case "Perlu Perhatian":
        return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800 font-bold";
      case "Belum Ada Sesi":
        return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const getStatusCodeBadge = (code: string) => {
    switch (code) {
      case "H":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/70";
      case "S":
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/70";
      case "I":
        return "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/70";
      case "A":
        return "bg-rose-600 text-white border-rose-600";
      case "D":
        return "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/70";
      case "T":
        return "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/70 dark:border-orange-800/70";
      default:
        return "text-slate-300 dark:text-slate-600 border-transparent";
    }
  };

  return (
    <div className="space-y-4">
      {/* KOP RESMI CETAK PRESENSI (HANYA MUNCUL DI PRINT / PDF) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-3">
        <h2 className="text-lg font-black uppercase text-center tracking-wide text-slate-900">
          REKAPITULASI PRESENSI PEMBELAJARAN
        </h2>
        <div className="grid grid-cols-2 text-xs mt-3 text-slate-800">
          <div className="space-y-0.5">
            <p>
              <strong>Kelas / Rombel:</strong> {activeRecap.rombel_nama}
            </p>
            <p>
              <strong>Mata Pelajaran:</strong> {activeRecap.mata_pelajaran_nama} (
              {activeRecap.mata_pelajaran_kode})
            </p>
            <p>
              <strong>Guru Pengampu:</strong> {activeRecap.guru_nama || "-"}
            </p>
            <p>
              <strong>Periode Rekap:</strong> {activeRecap.periode_label || "Semua Periode"}
            </p>
          </div>
          <div className="text-right space-y-0.5">
            <p>
              <strong>Total Siswa:</strong> {activeRecap.total_siswa} Siswa
            </p>
            <p>
              <strong>Sesi Diabsen:</strong> {activeRecap.total_sesi_tercatat} dari{" "}
              {activeRecap.total_sesi_terjadwal} Sesi Terjadwal
            </p>
            <p>
              <strong>Rerata Kehadiran:</strong>{" "}
              {activeRecap.total_sesi_tercatat > 0
                ? `${activeRecap.rerata_kehadiran_kelas}%`
                : "Belum Ada Sesi"}
            </p>
          </div>
        </div>
      </div>

      {/* 1. KPI Metrik Ringkasan Rekapitulasi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        {/* Total Siswa */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Siswa
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {activeRecap.total_siswa} Siswa
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Rombel: {activeRecap.rombel_nama}
          </p>
        </div>

        {/* Total Sesi Tercatat */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sesi Diabsen
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {activeRecap.total_sesi_tercatat}{" "}
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              / {activeRecap.total_sesi_terjadwal} sesi
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {activeRecap.total_sesi_tercatat > 0
              ? `Periode: ${activeRecap.periode_label || "Semua Periode"}`
              : "Belum ada sesi KBM"}
          </p>
        </div>

        {/* Rerata Kehadiran Kelas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rerata Kehadiran
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2563EB] dark:text-blue-400">
            {activeRecap.total_sesi_tercatat > 0 ? `${activeRecap.rerata_kehadiran_kelas}%` : "-"}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {activeRecap.total_sesi_tercatat > 0
              ? "Kehadiran seluruh siswa"
              : "Belum ada sesi KBM tercatat"}
          </p>
        </div>

        {/* Perlu Perhatian */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Perlu Perhatian
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">
            {activeRecap.jumlah_perlu_perhatian} Siswa
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Kehadiran &lt; 75% atau Alpha &ge; 3
          </p>
        </div>
      </div>

      {/* 2. Toolbar Kontrol, Filter & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/75 dark:backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 shadow-2xs print:hidden">
        {/* Search & Month Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau NISN..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {availableMonths.length > 0 && (
            <div className="relative">
              <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter Periode Bulan"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">
                  Semua Periode ({recap.sesi_pertemuan?.length ?? recap.total_sesi_tercatat} sesi)
                </option>
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.sessionCount} sesi)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Semua ({activeRecap.daftar_siswa.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ATTENTION")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "ATTENTION"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
            >
              Perhatian ({activeRecap.jumlah_perlu_perhatian})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("GOOD")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "GOOD"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              }`}
            >
              Baik
            </button>
          </div>

          {/* Export Buttons & Print */}
          {showExportButtons && (
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0 flex-wrap">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                title="Unduh Rekapitulasi Presensi Format Microsoft Excel (.xlsx)"
              >
                {isExportingExcel ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                title="Unduh Rekapitulasi Presensi Format CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
                title="Cetak Rekapitulasi Presensi Kelas"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Tabel Matriks Rekapitulasi Presensi Siswa */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/85 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 text-center w-16">Absen</th>
                <th className="py-3 px-4 min-w-[200px]">Identitas Siswa</th>
                {sessionDates.map((sd) => (
                  <th
                    key={sd.sesi_id}
                    className="py-3 px-2 text-center text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/30 min-w-[48px] font-mono"
                    title={`Pertemuan ${sd.tanggal_iso}`}
                  >
                    {sd.label_tanggal}
                  </th>
                ))}
                <th
                  className="py-3 px-2 text-center text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/40 w-12"
                  title="Hadir"
                >
                  H
                </th>
                <th
                  className="py-3 px-2 text-center text-amber-700 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/40 w-12"
                  title="Sakit"
                >
                  S
                </th>
                <th
                  className="py-3 px-2 text-center text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/40 w-12"
                  title="Izin"
                >
                  I
                </th>
                <th
                  className="py-3 px-2 text-center text-rose-700 dark:text-rose-300 bg-rose-50/40 dark:bg-rose-950/40 w-12"
                  title="Alpha (Tanpa Keterangan)"
                >
                  A
                </th>
                <th
                  className="py-3 px-2 text-center text-purple-700 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/40 w-12"
                  title="Dispensasi"
                >
                  D
                </th>
                <th
                  className="py-3 px-2 text-center text-orange-700 dark:text-orange-300 bg-orange-50/40 dark:bg-orange-950/40 w-12"
                  title="Terlambat"
                >
                  T
                </th>
                <th className="py-3 px-3 text-center w-16">Total Sesi</th>
                <th className="py-3 px-4 text-center min-w-[120px]">% Kehadiran</th>
                <th className="py-3 px-3 text-center w-28">Status Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={12 + sessionDates.length}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    Tidak ada data siswa yang cocok dengan kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const initial = s.nama_lengkap.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={s.siswa_id}
                      className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors ${
                        s.alpha >= 3 ? "bg-rose-50/30 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      {/* Nomor Urut */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Nomor Absen */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {s.nomor_absen ?? "-"}
                      </td>

                      {/* Identitas Siswa */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {s.foto_url ? (
                            <Image
                              src={s.foto_url}
                              alt={s.nama_lengkap}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-full object-cover shrink-0 aspect-square border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                              {s.nama_lengkap}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block">
                              NISN: {s.nisn || "-"} {s.nis ? `• NIS: ${s.nis}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Detail Kehadiran Per Tanggal Pertemuan */}
                      {sessionDates.map((sd) => {
                        const code = mapAttendanceStatusToCode(sd.status_per_siswa[s.siswa_id]);
                        return (
                          <td key={sd.sesi_id} className="py-3 px-1.5 text-center font-mono">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold border ${getStatusCodeBadge(code)}`}
                            >
                              {code}
                            </span>
                          </td>
                        );
                      })}

                      {/* Hadir (H) */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20">
                        {s.hadir}
                      </td>

                      {/* Sakit (S) */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20">
                        {s.sakit > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            {s.sakit}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Izin (I) */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50/20 dark:bg-sky-950/20">
                        {s.izin > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
                            {s.izin}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Alpha (A) */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20">
                        {s.alpha > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black animate-pulse">
                            {s.alpha}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Dispensasi (D) */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50/20 dark:bg-purple-950/20">
                        {s.dispensasi > 0 ? (
                          s.dispensasi
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Terlambat (T) */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-orange-700 dark:text-orange-400 bg-orange-50/20 dark:bg-orange-950/20">
                        {s.terlambat > 0 ? (
                          s.terlambat
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Total Sesi */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400 text-xs">
                        {s.total_sesi_tercatat}
                      </td>

                      {/* Persentase Kehadiran */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                            {s.total_sesi_tercatat > 0 ? (
                              <span
                                className={
                                  s.persentase_kehadiran >= 85
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : s.persentase_kehadiran >= 75
                                      ? "text-amber-700 dark:text-amber-400"
                                      : "text-rose-700 dark:text-rose-400"
                                }
                              >
                                {s.persentase_kehadiran}%
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-normal">
                                -
                              </span>
                            )}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                s.total_sesi_tercatat > 0
                                  ? s.persentase_kehadiran >= 85
                                    ? "bg-emerald-500"
                                    : s.persentase_kehadiran >= 75
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  : "bg-transparent"
                              }`}
                              style={{
                                width:
                                  s.total_sesi_tercatat > 0 ? `${s.persentase_kehadiran}%` : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Capaian */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${getEvaluationBadge(
                            s.status_evaluasi
                          )}`}
                        >
                          {s.status_evaluasi}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer: Rangkuman */}
            {activeRecap.daftar_siswa.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/90 dark:bg-slate-850 border-t-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  <td
                    colSpan={3 + sessionDates.length}
                    className="py-3 px-4 text-slate-800 dark:text-slate-200"
                  >
                    Rangkuman Akumulasi Kelas ({activeRecap.daftar_siswa.length} Siswa)
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-700 dark:text-emerald-400 font-mono">
                    {activeRecap.daftar_siswa.reduce((acc, s) => acc + s.hadir, 0)}
                  </td>
                  <td className="py-3 px-2 text-center text-amber-700 dark:text-amber-400 font-mono">
                    {totalSakitCases}
                  </td>
                  <td className="py-3 px-2 text-center text-sky-700 dark:text-sky-400 font-mono">
                    {totalIzinCases}
                  </td>
                  <td className="py-3 px-2 text-center text-rose-700 dark:text-rose-400 font-mono">
                    {totalAlphaCases}
                  </td>
                  <td className="py-3 px-2 text-center text-purple-700 dark:text-purple-400 font-mono">
                    {activeRecap.daftar_siswa.reduce((acc, s) => acc + s.dispensasi, 0)}
                  </td>
                  <td className="py-3 px-2 text-center text-orange-700 dark:text-orange-400 font-mono">
                    {activeRecap.daftar_siswa.reduce((acc, s) => acc + s.terlambat, 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 font-mono">
                    {activeRecap.total_sesi_tercatat}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[#2563EB] dark:text-blue-400">
                    Rerata:{" "}
                    {activeRecap.total_sesi_tercatat > 0
                      ? `${activeRecap.rerata_kehadiran_kelas}%`
                      : "-"}
                  </td>
                  <td className="py-3 px-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    {activeRecap.jumlah_perlu_perhatian} Perhatian
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {sessionDates.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Keterangan:</span>
            <span>
              <strong className="text-emerald-700 dark:text-emerald-400">H</strong> = Hadir
            </span>
            <span>
              <strong className="text-amber-700 dark:text-amber-400">S</strong> = Sakit
            </span>
            <span>
              <strong className="text-sky-700 dark:text-sky-400">I</strong> = Izin
            </span>
            <span>
              <strong className="text-rose-700 dark:text-rose-400">A</strong> = Alpha
            </span>
            <span>
              <strong className="text-purple-700 dark:text-purple-400">D</strong> = Dispensasi
            </span>
            <span>
              <strong className="text-orange-700 dark:text-orange-400">T</strong> = Terlambat
            </span>
          </div>
        )}
      </div>

      {/* TANDA TANGAN PENGESAHAN CETAK (HANYA MUNCUL DI PRINT / PDF) */}
      <div className="hidden print:grid grid-cols-2 gap-8 mt-10 text-xs text-center text-slate-900">
        <div>
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala Sekolah</p>
          <div className="h-20" />
          <p className="font-bold underline">( ............................................ )</p>
        </div>
        <div>
          <p>Guru Mata Pelajaran,</p>
          <p className="font-semibold">{recap.mata_pelajaran_nama}</p>
          <div className="h-20" />
          <p className="font-bold underline">
            ( {recap.guru_nama || "............................................"} )
          </p>
        </div>
      </div>
    </div>
  );
}
