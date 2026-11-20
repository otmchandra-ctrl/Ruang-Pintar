"use client";

/**
 * Ruang Pintar — Class Summary Tab (Academic Glass UI)
 *
 * Komposisi Seimbang (Grid 2 Kolom Sejajar: 7 Kolom Kiri & 5 Kolom Kanan):
 * - KIRI ATAS: 2 Card Metrik:
 *   1. Kepatuhan Tugas Guru (% penyerahan, progress bar biru)
 *   2. Tingkat Kehadiran KBM dengan Light Neon Glass Segmented Bar (multi-segment glow + pill glass interaktif)
 * - KIRI BAWAH: Tabel Siswa Perlu Perhatian Khusus (Deteksi >= 3x Tidak Hadir agar ternotis)
 * - KANAN (DI SAMPING): Widget Kartu Daftar Siswa (Bersih tanpa ikon, Pencarian, Filter ♂ ♀, Avatar, Nama & NIS bertumpuk, Paginasi)
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  ClipboardCheck,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { TeacherClassWorkspaceDTO, MateriPembelajaranDTO } from "../domain/learning-types";
import {
  ClassAttendanceRecapDTO,
  SessionAttendanceHistoryItemDTO,
} from "@/modules/attendance/domain/attendance-types";
import { StudentAcademicDirectoryItemDTO } from "@/modules/student/domain/student-academic-directory-types";

export interface ClassSummaryTabProps {
  workspace: TeacherClassWorkspaceDTO;
  canManage: boolean;
  attendanceHistory?: SessionAttendanceHistoryItemDTO[];
  attendanceStats?: {
    total_sesi_terjadwal: number;
    total_sesi_selesai: number;
    total_presensi_diambil: number;
    rata_rata_kehadiran: number;
  };
  attendanceRecap?: ClassAttendanceRecapDTO | null;
  studentDirectory?: StudentAcademicDirectoryItemDTO[];
  onOpenCreateMateri?: () => void;
  onOpenEditMateri?: (materi: MateriPembelajaranDTO) => void;
  onOpenCreateTugas?: () => void;
  onOpenCreateJurnal?: () => void;
  onOpenSessionAttendance?: (sesiId?: string) => void;
  isOpeningAttendance?: boolean;
  onSelectStudent?: (student: StudentAcademicDirectoryItemDTO) => void;
  onSwitchToStudentsTab?: () => void;
}

const ITEMS_PER_PAGE = 6;

// ========================================================
// KOMPONEN LIGHT NEON GLASS SEGMENTED BAR (INTERAKTIF)
// ========================================================
interface AttendanceLightNeonGlassSegmentedBarProps {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  terlambat: number;
  rate: number;
}

function AttendanceLightNeonGlassSegmentedBar({
  hadir,
  sakit,
  izin,
  alfa,
  terlambat,
  rate,
}: AttendanceLightNeonGlassSegmentedBarProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const rawTotal = hadir + sakit + izin + alfa + terlambat;

  const segments = useMemo(() => {
    return [
      {
        key: "HADIR",
        code: "H",
        label: "Hadir",
        count: hadir,
        percent: rawTotal > 0 ? Math.round((hadir / rawTotal) * 100) : 100,
        widthPct: rawTotal > 0 ? (hadir / rawTotal) * 100 : 100,
        gradient: "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500",
        neonGlow: "shadow-[0_0_12px_rgba(37,99,235,0.45)]",
        activeGlow: "shadow-[0_0_18px_rgba(37,99,235,0.85)] brightness-110",
        dotGlow: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.85)]",
        textColor: "text-[#2563EB] dark:text-blue-400",
        borderColor: "border-blue-200/90 dark:border-blue-800/80",
        badgeBg: "bg-blue-50/80 dark:bg-blue-950/60",
      },
      {
        key: "SAKIT",
        code: "S",
        label: "Sakit",
        count: sakit,
        percent: rawTotal > 0 ? Math.round((sakit / rawTotal) * 100) : 0,
        widthPct: rawTotal > 0 ? (sakit / rawTotal) * 100 : 0,
        gradient: "bg-gradient-to-r from-slate-400 to-slate-500",
        neonGlow: "shadow-[0_0_8px_rgba(148,163,184,0.35)]",
        activeGlow: "shadow-[0_0_14px_rgba(148,163,184,0.7)] brightness-110",
        dotGlow: "bg-slate-400 shadow-[0_0_4px_rgba(148,163,184,0.6)]",
        textColor: "text-slate-600 dark:text-slate-300",
        borderColor: "border-slate-200/90 dark:border-slate-700/80",
        badgeBg: "bg-slate-50/80 dark:bg-slate-800/60",
      },
      {
        key: "IZIN",
        code: "I",
        label: "Izin",
        count: izin,
        percent: rawTotal > 0 ? Math.round((izin / rawTotal) * 100) : 0,
        widthPct: rawTotal > 0 ? (izin / rawTotal) * 100 : 0,
        gradient: "bg-gradient-to-r from-sky-400 to-cyan-500",
        neonGlow: "shadow-[0_0_10px_rgba(14,165,233,0.45)]",
        activeGlow: "shadow-[0_0_16px_rgba(14,165,233,0.8)] brightness-110",
        dotGlow: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.85)]",
        textColor: "text-sky-600 dark:text-sky-400",
        borderColor: "border-sky-200/90 dark:border-sky-800/80",
        badgeBg: "bg-sky-50/80 dark:bg-sky-950/60",
      },
      {
        key: "ALFA",
        code: "A",
        label: "Alfa",
        count: alfa,
        percent: rawTotal > 0 ? Math.round((alfa / rawTotal) * 100) : 0,
        widthPct: rawTotal > 0 ? (alfa / rawTotal) * 100 : 0,
        gradient: "bg-gradient-to-r from-rose-500 to-pink-600",
        neonGlow: "shadow-[0_0_10px_rgba(244,63,94,0.5)]",
        activeGlow: "shadow-[0_0_16px_rgba(244,63,94,0.85)] brightness-110",
        dotGlow: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]",
        textColor: "text-rose-600 dark:text-rose-400",
        borderColor: "border-rose-200/90 dark:border-rose-800/80",
        badgeBg: "bg-rose-50/80 dark:bg-rose-950/60",
      },
      {
        key: "TERLAMBAT",
        code: "T",
        label: "Terlambat",
        count: terlambat,
        percent: rawTotal > 0 ? Math.round((terlambat / rawTotal) * 100) : 0,
        widthPct: rawTotal > 0 ? (terlambat / rawTotal) * 100 : 0,
        gradient: "bg-gradient-to-r from-amber-400 to-amber-500",
        neonGlow: "shadow-[0_0_10px_rgba(245,158,11,0.5)]",
        activeGlow: "shadow-[0_0_16px_rgba(245,158,11,0.85)] brightness-110",
        dotGlow: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200/90 dark:border-amber-800/80",
        badgeBg: "bg-amber-50/80 dark:bg-amber-950/60",
      },
    ];
  }, [hadir, sakit, izin, alfa, terlambat, rawTotal]);

  const visibleSegments = segments.filter((s) => s.widthPct > 0);

  return (
    <div className="space-y-2.5 select-none">
      {/* Light Neon Glass Track & Multi-Segment Bar */}
      <div className="relative w-full h-2.5 sm:h-3 rounded-full bg-slate-100/90 dark:bg-slate-800/90 p-[2px] backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.02)] flex items-center overflow-hidden">
        {/* Glass reflection gloss overlay (top highlight) */}
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-20 rounded-t-full" />

        {/* Multi-segment fills */}
        {visibleSegments.length === 0 ? (
          <div className="h-full w-full rounded-full bg-slate-200/50 dark:bg-slate-700/50" />
        ) : (
          visibleSegments.map((segment, index) => {
            const isHovered = hoveredKey === segment.key;
            const isFirst = index === 0;
            const isLast = index === visibleSegments.length - 1;

            return (
              <div
                key={segment.key}
                onMouseEnter={() => setHoveredKey(segment.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`h-full relative cursor-pointer transition-all duration-300 ease-out border-r border-white/40 dark:border-slate-900/40 last:border-r-0 ${
                  segment.gradient
                } ${isHovered ? segment.activeGlow : segment.neonGlow} ${
                  isFirst ? "rounded-l-full" : ""
                } ${isLast ? "rounded-r-full" : ""}`}
                style={{
                  width: `${Math.max(2, segment.widthPct)}%`,
                }}
                title={`${segment.label}: ${segment.count} Siswa (${segment.percent}%)`}
              />
            );
          })
        )}
      </div>

      {/* Pill Badges Glass & Neon Dots */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap text-[10px] font-mono">
        {segments.map((item) => {
          const isHovered = hoveredKey === item.key;
          const hasCount = item.count > 0;

          return (
            <button
              type="button"
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all duration-200 backdrop-blur-md text-[10.5px] cursor-pointer ${
                isHovered
                  ? `${item.badgeBg} ${item.borderColor} ${item.textColor} scale-105 shadow-sm font-bold`
                  : hasCount
                    ? `bg-white/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 ${item.textColor} font-semibold`
                    : "bg-white/30 dark:bg-slate-900/20 border-slate-200/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 opacity-60"
              }`}
            >
              <span className={`size-1.5 rounded-full shrink-0 ${item.dotGlow}`} />
              <span>
                {item.code}:{item.count}
              </span>
              {isHovered && (
                <span className="text-[9.5px] font-normal opacity-85">({item.percent}%)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ClassSummaryTab({
  workspace,
  canManage,
  attendanceHistory = [],
  attendanceStats,
  attendanceRecap,
  studentDirectory = [],
  onOpenCreateTugas,
  onOpenSessionAttendance,
  isOpeningAttendance = false,
  onSelectStudent,
  onSwitchToStudentsTab,
}: ClassSummaryTabProps) {
  const { total_siswa, tugas_list = [] } = workspace;
  const totalSiswaCount = studentDirectory.length > 0 ? studentDirectory.length : total_siswa;

  // State untuk Widget Daftar Siswa di Sisi Kanan
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "L" | "P">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // ========================================================
  // 1. DATA KEPATUHAN TUGAS GURU
  // ========================================================
  const latestTugas = tugas_list.length > 0 ? tugas_list[0] : null;

  const taskStats = useMemo(() => {
    if (studentDirectory.length === 0) {
      const submissionCount = latestTugas?.publikasi_aktif?.submission_count ?? 0;
      const percent =
        totalSiswaCount > 0 ? Math.round((submissionCount / totalSiswaCount) * 100) : 0;
      return {
        percent,
        sudahMengerjakan: submissionCount,
        belumMengerjakan: Math.max(0, totalSiswaCount - submissionCount),
        totalTugasDiterbitkan: tugas_list.length,
      };
    }

    const totalTugasAssigned = studentDirectory.reduce((sum, s) => sum + s.tugas_total, 0);
    const totalTugasCompleted = studentDirectory.reduce((sum, s) => sum + s.tugas_selesai, 0);

    let percent = 0;
    if (totalTugasAssigned > 0) {
      percent = Math.round((totalTugasCompleted / totalTugasAssigned) * 100);
    } else if (
      latestTugas?.publikasi_aktif?.submission_count !== undefined &&
      totalSiswaCount > 0
    ) {
      percent = Math.round((latestTugas.publikasi_aktif.submission_count / totalSiswaCount) * 100);
    }

    const sudahMengerjakan = studentDirectory.filter(
      (s) => s.tugas_total === 0 || s.tugas_selesai >= s.tugas_total
    ).length;
    const belumMengerjakan = Math.max(0, totalSiswaCount - sudahMengerjakan);

    return {
      percent,
      sudahMengerjakan,
      belumMengerjakan,
      totalTugasDiterbitkan: tugas_list.length,
    };
  }, [studentDirectory, totalSiswaCount, tugas_list, latestTugas]);

  // ========================================================
  // 2. DATA TINGKAT KEHADIRAN KBM PER PERTEMUAN
  // ========================================================
  const attendanceRate = useMemo(() => {
    if (attendanceRecap?.rerata_kehadiran_kelas !== undefined) {
      return Math.round(attendanceRecap.rerata_kehadiran_kelas * 10) / 10;
    }
    if (attendanceStats?.rata_rata_kehadiran !== undefined) {
      return Math.round(attendanceStats.rata_rata_kehadiran * 10) / 10;
    }
    return 100;
  }, [attendanceRecap, attendanceStats]);

  const totalSesiTercatat = useMemo(() => {
    return (
      attendanceRecap?.total_sesi_tercatat ??
      attendanceStats?.total_sesi_selesai ??
      attendanceHistory.length ??
      0
    );
  }, [attendanceRecap, attendanceStats, attendanceHistory]);

  const attendanceTotals = useMemo(() => {
    if (attendanceRecap?.daftar_siswa && attendanceRecap.daftar_siswa.length > 0) {
      return attendanceRecap.daftar_siswa.reduce(
        (acc, curr) => ({
          hadir: acc.hadir + (curr.hadir || 0),
          sakit: acc.sakit + (curr.sakit || 0),
          izin: acc.izin + (curr.izin || 0),
          alfa: acc.alfa + (curr.alpha || 0),
          terlambat: acc.terlambat + (curr.terlambat || 0),
          dispensasi: acc.dispensasi + (curr.dispensasi || 0),
        }),
        { hadir: 0, sakit: 0, izin: 0, alfa: 0, terlambat: 0, dispensasi: 0 }
      );
    }

    return {
      hadir: attendanceStats?.total_presensi_diambil || 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      terlambat: 0,
      dispensasi: 0,
    };
  }, [attendanceRecap, attendanceStats]);

  const attendanceTotalEntries = useMemo(() => {
    return (
      attendanceTotals.hadir +
      attendanceTotals.sakit +
      attendanceTotals.izin +
      attendanceTotals.alfa +
      attendanceTotals.terlambat +
      attendanceTotals.dispensasi
    );
  }, [attendanceTotals]);

  // ========================================================
  // 3. DATA SISWA ENRICHED (PROFIL + ABSEN + TUGAS)
  // ========================================================
  const enrichedStudents = useMemo(() => {
    return studentDirectory.map((s, idx) => {
      const recap = attendanceRecap?.daftar_siswa.find((d) => d.siswa_id === s.siswa_id);

      const hadir = recap?.hadir ?? s.kehadiran_stats?.hadir ?? 0;
      const izin = recap?.izin ?? s.kehadiran_stats?.izin ?? 0;
      const sakit = recap?.sakit ?? s.kehadiran_stats?.sakit ?? 0;
      const alfa = recap?.alpha ?? s.kehadiran_stats?.alpha ?? 0;
      const dispensasi = recap?.dispensasi ?? 0;
      const terlambat = recap?.terlambat ?? 0;

      const totalTidakHadir = sakit + izin + alfa + terlambat;
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
        totalTidakHadir,
        tugasBelumSelesai,
      };
    });
  }, [studentDirectory, attendanceRecap]);

  // Siswa yang perlu perhatian khusus (akumulasi ketidakhadiran >= 3 kali)
  const studentsNeedingAttention = useMemo(() => {
    return enrichedStudents
      .filter((s) => s.totalTidakHadir >= 3)
      .sort((a, b) => b.totalTidakHadir - a.totalTidakHadir || b.alfa - a.alfa);
  }, [enrichedStudents]);

  // ========================================================
  // 4. FILTER & PAGINASI UNTUK WIDGET DAFTAR SISWA (DI SAMPING)
  // ========================================================
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter((student) => {
      // Filter Gender
      if (genderFilter !== "ALL") {
        if (student.jenis_kelamin !== genderFilter) {
          return false;
        }
      }

      // Filter Pencarian Nama / NIS
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = student.nama_lengkap.toLowerCase().includes(q);
        const matchNis = student.nis && student.nis.toLowerCase().includes(q);
        const matchNisn = student.nisn && student.nisn.toLowerCase().includes(q);
        return matchName || matchNis || matchNisn;
      }

      return true;
    });
  }, [enrichedStudents, genderFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* ======================================================== */}
      {/* SISI KIRI (7 Kolom): 2 Card Metrik + Tabel Siswa Perhatian */}
      {/* ======================================================== */}
      <div className="lg:col-span-7 xl:col-span-7 space-y-5 sm:space-y-6">
        {/* BARIS ATAS KIRI: 2 CARD METRIK BERDAMPINGAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Card 1: Kepatuhan Tugas */}
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-5.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header Card Tugas */}
            <div className="flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 text-[#2563EB] dark:text-blue-400 shrink-0">
                  <ClipboardCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                    Kepatuhan Tugas Kelas
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {taskStats.totalTugasDiterbitkan > 0
                      ? `${taskStats.totalTugasDiterbitkan} Tugas Aktif`
                      : "Belum Ada Tugas"}
                  </p>
                </div>
              </div>

              {canManage && onOpenCreateTugas && (
                <button
                  type="button"
                  onClick={onOpenCreateTugas}
                  title="Buat Tugas Baru"
                  className="p-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 text-[#2563EB] dark:text-blue-400 border border-blue-200/80 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Angka & Progress Bar Biru */}
            <div className="space-y-2 relative z-10">
              <div className="flex items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {taskStats.percent}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Tingkat Penyerahan
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#2563EB] dark:text-blue-400">
                  {taskStats.sudahMengerjakan}/{totalSiswaCount}
                </span>
              </div>

              {/* Light Neon Glass Progress Bar */}
              <div className="relative w-full h-2.5 sm:h-3 rounded-full bg-slate-100/90 dark:bg-slate-800/90 p-[2px] backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.02)] flex items-center overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-20 rounded-t-full" />
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(37,99,235,0.45)] transition-all duration-700 relative z-10"
                  style={{
                    width: `${Math.min(100, Math.max(0, taskStats.percent))}%`,
                  }}
                />
              </div>
            </div>

            {/* Sub-info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 relative z-10">
              <span className="text-[#2563EB] dark:text-blue-400 font-bold">
                ● {taskStats.sudahMengerjakan} Tuntas
              </span>
              <span className="text-slate-400">● {taskStats.belumMengerjakan} Belum</span>
            </div>
          </div>

          {/* Card 2: Tingkat Kehadiran dengan Light Neon Glass Segmented Bar */}
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-5.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header Card Kehadiran */}
            <div className="flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 text-[#2563EB] dark:text-blue-400 shrink-0">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                    Tingkat Kehadiran KBM
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {totalSesiTercatat} Sesi Pertemuan
                  </p>
                </div>
              </div>

              {canManage && onOpenSessionAttendance && (
                <button
                  type="button"
                  disabled={isOpeningAttendance}
                  onClick={() => onOpenSessionAttendance()}
                  title="Ambil Presensi Sesi"
                  className="p-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 text-[#2563EB] dark:text-blue-400 border border-blue-200/80 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[28px] min-h-[28px]"
                >
                  {isOpeningAttendance ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Angka & Light Neon Glass Segmented Bar */}
            <div className="space-y-2 relative z-10">
              <div className="flex items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {attendanceRate}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Rata-rata Presensi
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  <span className="text-[#2563EB] dark:text-blue-400 font-extrabold">
                    {attendanceTotals.hadir}
                  </span>
                  /{attendanceTotalEntries > 0 ? attendanceTotalEntries : totalSiswaCount} Hadir
                </span>
              </div>

              {/* Light Neon Glass Multi-Segment Bar & Glowing Pills */}
              <AttendanceLightNeonGlassSegmentedBar
                hadir={attendanceTotals.hadir}
                sakit={attendanceTotals.sakit}
                izin={attendanceTotals.izin}
                alfa={attendanceTotals.alfa}
                terlambat={attendanceTotals.terlambat}
                rate={attendanceRate}
              />
            </div>

            {/* Footer Sub-info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 relative z-10">
              <span className="text-[#2563EB] dark:text-blue-400 font-semibold">
                ● Status: KBM Aktif
              </span>
              <span>{totalSesiTercatat} Sesi Tercatat</span>
            </div>
          </div>
        </div>

        {/* BARIS BAWAH KIRI: TABEL SISWA PERLU PERHATIAN KHUSUS (>= 3x) */}
        <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                    Siswa Perlu Perhatian Khusus
                  </h3>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {studentsNeedingAttention.length} Siswa Terdeteksi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Akumulasi ketidakhadiran (Sakit, Izin, Alfa, Terlambat) ≥ 3x semester ini.
                </p>
              </div>
            </div>
          </div>

          {/* Konten Tabel Perhatian */}
          {studentsNeedingAttention.length === 0 ? (
            <div className="py-7 px-4 text-center rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 flex items-center justify-center gap-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Kondisi kehadiran kelas terpantau sangat tertib. Belum ada siswa yang mencapai batas
                peringatan (≥ 3 kali tidak hadir).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Murid & Identitas</th>
                    <th className="py-2.5 px-2 text-center">Total Absen</th>
                    <th className="py-2.5 px-2">Rincian</th>
                    <th className="py-2.5 px-2 text-center">Tugas</th>
                    <th className="py-2.5 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {studentsNeedingAttention.map((s) => {
                    const initial = s.nama_lengkap.trim().charAt(0).toUpperCase() || "S";

                    return (
                      <tr
                        key={s.siswa_id}
                        onClick={() => onSelectStudent && onSelectStudent(s)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Foto + Nama & NIS Bertumpuk */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900 text-[#2563EB] dark:text-blue-400 font-bold text-xs select-none">
                              {s.foto_url ? (
                                <Image
                                  src={s.foto_url}
                                  alt={s.nama_lengkap}
                                  width={32}
                                  height={32}
                                  className="object-cover size-full rounded-full"
                                />
                              ) : (
                                <span>{initial}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs truncate">
                                {s.nama_lengkap}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                NIS: {s.nis || "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Absen */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            {s.totalTidakHadir}x Tidak Hadir
                          </span>
                        </td>

                        {/* Rincian Absen */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono font-semibold">
                            {s.alfa > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                {s.alfa} Alfa
                              </span>
                            )}
                            {s.sakit > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {s.sakit} Sakit
                              </span>
                            )}
                            {s.izin > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                {s.izin} Izin
                              </span>
                            )}
                            {s.terlambat > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                {s.terlambat} Terlambat
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tugas Nunggak */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          {s.tugasBelumSelesai > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              {s.tugasBelumSelesai} Tugas Nunggak
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#2563EB] dark:text-blue-400 font-semibold">
                              Tuntas
                            </span>
                          )}
                        </td>

                        {/* Aksi Periksa */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudent && onSelectStudent(s);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                          >
                            <span>Periksa</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SISI KANAN (5 Kolom): DI SAMPING — KARTU DAFTAR SISWA     */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 xl:col-span-5">
        <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-4">
          {/* Header Widget: Judul "Daftar Siswa" dan Badge Jumlah (IKON DIHILANGKAN SESUAI INSTRUKSI) */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Daftar Siswa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direktori murid terdaftar pada rombel ini.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50/80 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              {totalSiswaCount} Siswa
            </span>
          </div>

          {/* Toolbar: Input Pencarian & Filter Gender (♂ / ♀) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama atau NIS siswa..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all font-sans"
              />
            </div>

            {/* Filter Laki-laki ♂ */}
            <button
              type="button"
              title="Filter Laki-laki"
              onClick={() => {
                setGenderFilter(genderFilter === "L" ? "ALL" : "L");
                setCurrentPage(1);
              }}
              className={`h-8 w-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                genderFilter === "L"
                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>♂</span>
            </button>

            {/* Filter Perempuan ♀ */}
            <button
              type="button"
              title="Filter Perempuan"
              onClick={() => {
                setGenderFilter(genderFilter === "P" ? "ALL" : "P");
                setCurrentPage(1);
              }}
              className={`h-8 w-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                genderFilter === "P"
                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>♀</span>
            </button>
          </div>

          {/* List Murid Vertikal di Sisi Kanan (6 Siswa per Halaman) */}
          <div className="space-y-1.5 pt-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
                Tidak ada siswa yang sesuai pencarian.
              </div>
            ) : (
              paginatedStudents.map((s) => {
                const initial = s.nama_lengkap.trim().charAt(0).toUpperCase() || "S";
                const genderLabel =
                  s.jenis_kelamin === "L"
                    ? "Laki-laki"
                    : s.jenis_kelamin === "P"
                      ? "Perempuan"
                      : "Laki-laki";

                return (
                  <div
                    key={s.siswa_id}
                    onClick={() => onSelectStudent && onSelectStudent(s)}
                    className="flex items-center justify-between pt-2 pb-1.5 px-1 rounded-2xl hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Inisial Bulat Biru */}
                      <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900 text-[#2563EB] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs select-none">
                        {s.foto_url ? (
                          <Image
                            src={s.foto_url}
                            alt={s.nama_lengkap}
                            width={36}
                            height={36}
                            className="object-cover size-full rounded-full"
                          />
                        ) : (
                          <span>{s.nama_lengkap.slice(0, 2).toUpperCase() || initial}</span>
                        )}
                      </div>

                      {/* Informasi Siswa: Nama & NIS Bertumpuk */}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {s.nama_lengkap}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
                          NIS {s.nis || "—"} • {genderLabel}
                        </div>
                      </div>
                    </div>

                    {/* Badge Status Kehadiran (Pill Biru Lembut) */}
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold select-none shrink-0 bg-blue-50/80 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                      Hadir
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginasi: Hal X dari Y & Tombol Nomor Halaman */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                Hal. {safeCurrentPage} dari {totalPages}
              </span>

              <div className="flex items-center gap-1">
                {/* Tombol < */}
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-6 w-6 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>

                {/* Nomor-nomor Halaman */}
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-6 w-6 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      page === safeCurrentPage
                        ? "bg-[#2563EB] text-white shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Tombol > */}
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-6 w-6 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Tombol Buka Tab Siswa Lengkap */}
          {onSwitchToStudentsTab && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={onSwitchToStudentsTab}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-xs font-mono font-semibold transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer"
              >
                <span>Buka Tab Siswa Lengkap ({totalSiswaCount} Murid)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
