"use client";

/**
 * Ruang Pintar — Class Students Tab (Academic Glass UI)
 *
 * Tab Siswa Detail Kelas:
 * - Tabel Presensi Akademik Lengkap & Eksekutif (10 Kolom: NO, NAMA MURID & NIS, HADIR, IZIN, SAKIT, ALFA, DISP., TERLAMBAT, TUGAS BELUM SELESAI, AKSI)
 * - Paginasi Cerdas: Maksimal 10 data per halaman dengan tombol Sebelumnya / Berikutnya dan nomor halaman
 * - Toolbar: Pencarian real-time (Nama / NIS / NISN) dan Filter Pills 1-Klik (Semua, L, P, Tugas, Absen)
 * - Interaktif: Baris dan tombol aksi langsung membuka StudentAcademicSideSheet
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { TeacherClassWorkspaceDTO } from "../domain/learning-types";
import { StudentAcademicDirectoryItemDTO } from "@/modules/student/domain/student-academic-directory-types";
import { ClassAttendanceRecapDTO } from "@/modules/attendance/domain/attendance-types";

interface ClassStudentsTabProps {
  workspace: TeacherClassWorkspaceDTO;
  studentDirectory: StudentAcademicDirectoryItemDTO[];
  attendanceRecap?: ClassAttendanceRecapDTO | null;
  canManage: boolean;
  onSelectStudent: (student: StudentAcademicDirectoryItemDTO) => void;
}

type StudentFilterType = "SEMUA" | "LAKI_LAKI" | "PEREMPUAN" | "TUGAS_TERTUNDA" | "PERNAH_ABSEN";

const PAGE_SIZE = 10;

export function ClassStudentsTab({
  workspace,
  studentDirectory = [],
  attendanceRecap,
  canManage: _canManage,
  onSelectStudent,
}: ClassStudentsTabProps) {
  const { penugasan, total_siswa } = workspace;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<StudentFilterType>("SEMUA");
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (type: StudentFilterType) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Gabungkan data profil siswa dengan data agregat presensi & tugas
  const enrichedStudents = useMemo(() => {
    return studentDirectory.map((s, idx) => {
      const recap = attendanceRecap?.daftar_siswa.find((d) => d.siswa_id === s.siswa_id);

      const hadir = recap?.hadir ?? s.kehadiran_stats?.hadir ?? 0;
      const izin = recap?.izin ?? s.kehadiran_stats?.izin ?? 0;
      const sakit = recap?.sakit ?? s.kehadiran_stats?.sakit ?? 0;
      const alfa = recap?.alpha ?? s.kehadiran_stats?.alpha ?? 0;
      const dispensasi = recap?.dispensasi ?? 0;
      const terlambat = recap?.terlambat ?? 0;

      const tugasBelumSelesai = Math.max(0, (s.tugas_total || 0) - (s.tugas_selesai || 0));

      return {
        ...s,
        displayNo: s.nomor_absen ?? idx + 1,
        hadir,
        izin,
        sakit,
        alfa,
        dispensasi,
        terlambat,
        tugasBelumSelesai,
      };
    });
  }, [studentDirectory, attendanceRecap]);

  // Statistik Ringkas untuk Toolbar Filter & Header Ratio
  const stats = useMemo(() => {
    const total = enrichedStudents.length;
    const laki = enrichedStudents.filter((s) => s.jenis_kelamin === "L").length;
    const perempuan = enrichedStudents.filter((s) => s.jenis_kelamin === "P").length;
    const pendingTasks = enrichedStudents.filter((s) => s.tugasBelumSelesai > 0).length;
    const pernahAbsen = enrichedStudents.filter(
      (s) => s.sakit + s.izin + s.alfa + s.terlambat + s.dispensasi > 0
    ).length;
    return { total, laki, perempuan, pendingTasks, pernahAbsen };
  }, [enrichedStudents]);

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter((s) => {
      // 1. Filter Kategori
      if (filterType === "LAKI_LAKI" && s.jenis_kelamin !== "L") return false;
      if (filterType === "PEREMPUAN" && s.jenis_kelamin !== "P") return false;
      if (filterType === "TUGAS_TERTUNDA" && s.tugasBelumSelesai <= 0) return false;
      if (
        filterType === "PERNAH_ABSEN" &&
        s.izin + s.sakit + s.alfa + s.terlambat + s.dispensasi <= 0
      )
        return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.nama_lengkap.toLowerCase().includes(q);
        const matchNis = s.nis && s.nis.toLowerCase().includes(q);
        const matchNisn = s.nisn && s.nisn.toLowerCase().includes(q);
        return matchName || matchNis || matchNisn;
      }

      return true;
    });
  }, [enrichedStudents, filterType, searchQuery]);

  // Pagination Logic (10 data per halaman)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredStudents, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (safeCurrentPage > 3) {
      pages.push("...");
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push("...");
    }
    pages.push(totalPages);
    return pages;
  }, [totalPages, safeCurrentPage]);

  const startItem = filteredStudents.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filteredStudents.length);

  return (
    <div className="rounded-[28px] sm:rounded-[32px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden space-y-4 sm:space-y-5">
      {/* Ambient Blue Radial Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Informasi Rombel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Daftar Murid Kelas
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-[#2563EB] dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900">
              {stats.total || total_siswa} Murid Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoring kehadiran per murid dan kepatuhan penyelesaian tugas pembelajaran.
          </p>
        </div>

        {/* Quick Gender Ratio Pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 shadow-2xs">
            <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.laki} L</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-pink-600 dark:text-pink-400 font-bold">{stats.perempuan} P</span>
          </span>
        </div>
      </div>

      {/* Toolbar: Search & Filter Pills 1-Klik */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
        {/* Search Input dengan Clear Button */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari murid berdasarkan nama atau NIS..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/50 backdrop-blur-md text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills 1-Klik */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleFilterChange("SEMUA")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filterType === "SEMUA"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("LAKI_LAKI")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filterType === "LAKI_LAKI"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            L ({stats.laki})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("PEREMPUAN")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filterType === "PEREMPUAN"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            P ({stats.perempuan})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("TUGAS_TERTUNDA")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filterType === "TUGAS_TERTUNDA"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Tugas ({stats.pendingTasks})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("PERNAH_ABSEN")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filterType === "PERNAH_ABSEN"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Absen ({stats.pernahAbsen})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TABEL PRESENSI SISWA (BENTUK TABEL SEBELUMNYA)           */}
      {/* ======================================================== */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xs relative z-10">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-3.5 text-center w-12">NO</th>
              <th className="py-3 px-4 min-w-[200px]">NAMA MURID & NIS</th>
              <th className="py-3 px-3 text-center">HADIR</th>
              <th className="py-3 px-3 text-center">IZIN</th>
              <th className="py-3 px-3 text-center">SAKIT</th>
              <th className="py-3 px-3 text-center">ALFA</th>
              <th className="py-3 px-3 text-center">DISP.</th>
              <th className="py-3 px-3 text-center">TERLAMBAT</th>
              <th className="py-3 px-4 text-center">TUGAS BELUM SELESAI</th>
              <th className="py-3 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90 dark:divide-slate-800/80">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 px-4 text-center text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Tidak ada murid yang cocok dengan pencarian atau filter.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s) => {
                const initial = s.nama_lengkap.trim().slice(0, 2).toUpperCase() || "S";

                return (
                  <tr
                    key={s.siswa_id}
                    onClick={() => onSelectStudent(s)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* No */}
                    <td className="py-3.5 px-3.5 text-center font-mono font-medium text-slate-400 dark:text-slate-500">
                      {s.displayNo}
                    </td>

                    {/* Nama Murid & NIS */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900 text-[#2563EB] dark:text-blue-400 font-bold text-xs select-none">
                          {s.foto_url ? (
                            <Image
                              src={s.foto_url}
                              alt={s.nama_lengkap}
                              width={36}
                              height={36}
                              className="object-cover size-full rounded-full"
                            />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs">
                            {s.nama_lengkap}
                          </div>
                          <div className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>NIS: {s.nis || "—"}</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                s.jenis_kelamin === "L"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-pink-600 dark:text-pink-400"
                              }`}
                            >
                              {s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hadir */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                        {s.hadir}
                      </span>
                    </td>

                    {/* Izin */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs">
                      {s.izin > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {s.izin}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">0</span>
                      )}
                    </td>

                    {/* Sakit */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs">
                      {s.sakit > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {s.sakit}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">0</span>
                      )}
                    </td>

                    {/* Alfa */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs">
                      {s.alfa > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {s.alfa}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">0</span>
                      )}
                    </td>

                    {/* Disp. */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs">
                      {s.dispensasi > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {s.dispensasi}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">0</span>
                      )}
                    </td>

                    {/* Terlambat */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs">
                      {s.terlambat > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {s.terlambat}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">0</span>
                      )}
                    </td>

                    {/* Tugas Belum Selesai */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {s.tugasBelumSelesai > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{s.tugasBelumSelesai} Tertunda</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Tuntas (0)</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(s);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs group-hover:border-blue-300"
                      >
                        <span>Riwayat</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================== */}
      {/* FOOTER: INFO COUNTER & PAGINATION (10 DATA PER HALAMAN)  */}
      {/* ======================================================== */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 relative z-10">
        {/* Info Counter */}
        <div className="flex items-center gap-2 text-[11.5px] w-full sm:w-auto justify-between sm:justify-start">
          <span>
            Menampilkan{" "}
            <strong className="text-slate-800 dark:text-white font-bold">
              {startItem}-{endItem}
            </strong>{" "}
            dari{" "}
            <strong className="text-slate-800 dark:text-white font-bold">
              {filteredStudents.length}
            </strong>{" "}
            Murid
          </span>
          <span className="text-slate-400 text-[10.5px] hidden md:inline">
            • Klik baris untuk riwayat lengkap
          </span>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Tombol Sebelumnya */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-blue-50 hover:text-[#2563EB] dark:hover:bg-blue-950/50 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Sebelumnya</span>
            </button>

            {/* Page Numbers (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((page, idx) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-slate-400 font-mono text-xs select-none"
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = Number(page);
                const isActive = safeCurrentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-xs shadow-blue-500/20"
                        : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Mobile Indicator Pill */}
            <div className="sm:hidden px-3 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 font-mono font-bold text-xs text-slate-700 dark:text-slate-200">
              Hal {safeCurrentPage} dari {totalPages}
            </div>

            {/* Tombol Berikutnya */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-blue-50 hover:text-[#2563EB] dark:hover:bg-blue-950/50 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/70 disabled:hover:text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
