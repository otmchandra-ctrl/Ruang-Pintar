"use client";

/**
 * Ruang Pintar — M10 Actual Class Sessions Presentation View
 * Enterprise-Grade Academic Glass UI (Live Cockpit, Audit-First, Motion-Driven)
 *
 * Selaras 1:1 dengan Dashboard, Kelas Saya, dan Jadwal Saya:
 * - 12-Column Hero Section (8-Col Glass Banner + 4-Col 3 Metric Cards)
 * - Live Teaching Spotlight untuk sesi kelas yang sedang berlangsung
 * - Toolbar modern dengan Day/Status Chips, Search, Filter Rombel, dan View Toggle (Card vs Tabel)
 * - Tampilan Kartu visual interaktif & Tampilan Tabel data audit komprehensif
 * - Modal Buka Sesi Kelas & Modal Penyelesaian Sesi Kelas
 */

import React, { useState, useRef, useEffect, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  UserCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  StopCircle,
  Calendar,
  LayoutGrid,
  Table2,
  MapPin,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/shared/components/motion/motion-elements";
import { closeClassSessionAction } from "@/app/actions/class-session-actions";
import { ClassSessionDTO } from "../domain/schedule-types";
import { TeachingAssignmentDTO, TeacherProfileDTO } from "@/modules/teacher/domain/teacher-types";
import { ClassSessionModal } from "./class-session-modal";
import { SessionAttendanceModal } from "@/modules/attendance/presentation/session-attendance-modal";
import { Toast, ToastType } from "@/shared/components/ui/toast";

interface ClassSessionsViewProps {
  initialSessions: ClassSessionDTO[];
  rombels: Array<{ id: string; nama: string; tingkat_nama?: string | null }>;
  assignments: TeachingAssignmentDTO[];
  teachers: TeacherProfileDTO[];
  canManage: boolean;
  schoolName?: string;
  isTeacher?: boolean;
}

export function ClassSessionsView({
  initialSessions,
  rombels,
  assignments,
  teachers,
  canManage,
  schoolName,
  isTeacher = false,
}: ClassSessionsViewProps) {
  const router = useRouter();
  const sessions = initialSessions;

  // Filter, Search & View Mode states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DIMULAI" | "SELESAI" | "DIBATALKAN">(
    "ALL"
  );
  const [rombelFilter, setRombelFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"CARD" | "TABLE">("CARD");
  const [sortBy, setSortBy] = useState("time_desc");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Modals & Action states
  const [attendanceModalSesiId, setAttendanceModalSesiId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<ClassSessionDTO | null>(null);
  const [closeNote, setCloseNote] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Metrik sesi
  const activeSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === "DIMULAI").length,
    [sessions]
  );
  const completedSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === "SELESAI").length,
    [sessions]
  );
  const cancelledSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === "DIBATALKAN").length,
    [sessions]
  );

  // Sesi yang sedang live (untuk spotlight)
  const liveSessions = useMemo(() => sessions.filter((s) => s.status === "DIMULAI"), [sessions]);
  const primaryLiveSession = liveSessions[0] || null;

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.mata_pelajaran_nama.toLowerCase().includes(q) ||
        s.guru_nama.toLowerCase().includes(q) ||
        s.rombel_nama.toLowerCase().includes(q) ||
        (s.topik_pembelajaran && s.topik_pembelajaran.toLowerCase().includes(q)) ||
        (s.guru_pengganti_nama && s.guru_pengganti_nama.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesRombel = rombelFilter === "ALL" || s.rombel_id === rombelFilter;

      return matchesSearch && matchesStatus && matchesRombel;
    });
  }, [sessions, searchQuery, statusFilter, rombelFilter]);

  // Sort sessions
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      switch (sortBy) {
        case "time_desc":
          return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
        case "time_asc":
          return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
        case "mapel_asc":
          return a.mata_pelajaran_nama.localeCompare(b.mata_pelajaran_nama, "id");
        case "guru_asc":
          return a.guru_nama.localeCompare(b.guru_nama, "id");
        default:
          return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      }
    });
  }, [filteredSessions, sortBy]);

  const totalPages = Math.ceil(sortedSessions.length / rowsPerPage) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedSessions.slice(start, start + rowsPerPage);
  }, [sortedSessions, currentPage, rowsPerPage]);

  const handleCloseSessionSubmit = () => {
    if (!sessionToClose) return;
    startTransition(async () => {
      const res = await closeClassSessionAction(sessionToClose.id, closeNote);
      if (res.success) {
        setToast({ message: res.message, type: "success" });
        setSessionToClose(null);
        setCloseNote("");
        router.refresh();
      } else {
        setToast({ message: res.message, type: "error" });
      }
    });
  };

  const handleExportCSV = () => {
    if (sortedSessions.length === 0) {
      setToast({ message: "Tidak ada sesi kelas untuk diekspor.", type: "error" });
      return;
    }

    const headers = [
      "No",
      "Tanggal",
      "Rombongan Belajar",
      "Mata Pelajaran",
      "Guru Pengampu",
      "Guru Pengganti",
      "Jam Mulai Aktual",
      "Jam Selesai Aktual",
      "Status",
      "Topik",
      "Ruangan",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sortedSessions.map((s, idx) => [
      idx + 1,
      escapeCsv(new Date(s.tanggal).toLocaleDateString("id-ID")),
      escapeCsv(s.rombel_nama),
      escapeCsv(s.mata_pelajaran_nama),
      escapeCsv(s.guru_nama),
      escapeCsv(s.guru_pengganti_nama || "-"),
      escapeCsv(
        s.jam_mulai_aktual ? new Date(s.jam_mulai_aktual).toLocaleTimeString("id-ID") : "-"
      ),
      escapeCsv(
        s.jam_selesai_aktual ? new Date(s.jam_selesai_aktual).toLocaleTimeString("id-ID") : "-"
      ),
      escapeCsv(s.status),
      escapeCsv(s.topik_pembelajaran || "-"),
      escapeCsv(s.ruangan_aktual || "-"),
    ]);

    const delimiter = ";";
    const csvContent =
      "\uFEFF" + [headers.join(delimiter), ...rows.map((r) => r.join(delimiter))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `log_sesi_pembelajaran_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      message: `Berhasil mengekspor ${sortedSessions.length} log sesi kelas ke CSV.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 sm:pb-12 w-full">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP HERO SECTION: BANNER KIRI (8 Kolom) + 3 CARD INFORMASI KANAN (4 Kolom)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Sisi Kiri: 3D Isometric Session Hero Banner (Hanya Layar >=768px) */}
        <div className="hidden md:flex xl:col-span-8 rounded-[28px] sm:rounded-[32px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden flex-col md:flex-row md:items-center justify-between gap-5 h-full">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Sisi Kiri Banner: Badge, Judul, Deskripsi & Action Buttons */}
          <div className="space-y-3.5 z-10 max-w-xl flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Teaching Activity Log</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold">
                Semester Aktif
              </span>
              {schoolName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold truncate max-w-[200px]">
                  {schoolName}
                </span>
              )}
            </div>

            <div>
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Log & Audit Sesi KBM
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Log audit sesi pembelajaran kelas aktual, jurnal materi KBM, dan pengawasan
                operasional sekolah. Pantau kelas berlangsung, verifikasi catatan jurnal, dan buka
                sesi mengajar langsung.
              </p>
            </div>

            {/* Action Buttons dengan Efek Bar Hover Glow Terang & Berkilau */}
            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_22px_rgba(59,130,246,0.55)] hover:ring-2 hover:ring-blue-300/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Buka Sesi KBM</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300/70 dark:hover:border-blue-700/70 hover:shadow-[0_0_18px_rgba(59,130,246,0.25)] text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer active:scale-95"
              >
                <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Sisi Kanan Banner: 3D Isometric Lifecycle Illustration */}
          <div className="relative shrink-0 w-48 sm:w-56 md:w-64 h-44 sm:h-52 md:h-56 flex items-center justify-center md:justify-end z-20 pointer-events-none select-none">
            <div className="relative w-44 sm:w-52 md:w-60 h-full">
              <Image
                src="/images/illustrations/student-lifecycle-3d.png"
                alt="Ilustrasi Log Sesi KBM 3D Ruang Pintar"
                fill
                sizes="(max-width: 640px) 200px, 260px"
                priority
                className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.25)]"
              />
            </div>
          </div>
        </div>

        {/* Sisi Kanan: 3 Card Informasi (4 Kolom di XL, tersusun vertikal sejajar dengan tinggi banner di kiri) */}
        <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 xl:flex xl:flex-col xl:justify-between gap-3 sm:gap-3.5 h-full">
          {/* Metric 1: Sesi Berlangsung */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-default flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                Kelas Berlangsung
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs shrink-0">
                <PlayCircle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeSessionsCount}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  {activeSessionsCount > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  Kelas Aktif
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                {activeSessionsCount > 0
                  ? "KBM sedang berjalan tatap muka"
                  : "Belum ada sesi KBM aktif"}
              </span>
            </div>
          </div>

          {/* Metric 2: Sesi Selesai */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-default flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                Selesai Terlaksana
              </span>
              <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 shadow-2xs shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {completedSessionsCount}
                </span>
                <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                  Sesi Tuntas
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                Jurnal & presensi terekam
              </span>
            </div>
          </div>

          {/* Metric 3: Total Riwayat Sesi */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-default flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                Total Riwayat Sesi
              </span>
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {sessions.length}
                </span>
                <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                  Kejadian Kelas
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                {rombels.length} rombel terlayani
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LIVE TEACHING SPOTLIGHT (Card Sesi Aktif Hari Ini)
      ───────────────────────────────────────────────────────────── */}
      {primaryLiveSession && (
        <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 p-4 sm:p-5 shadow-2xs backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-48 h-24 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Sisi Kiri: Sesi Aktif */}
          <div className="space-y-1.5 z-10 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Kelas Sedang Berlangsung</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                Dimulai:{" "}
                {primaryLiveSession.jam_mulai_aktual
                  ? new Date(primaryLiveSession.jam_mulai_aktual).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}{" "}
                WIB
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {primaryLiveSession.rombel_nama}
              </h3>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                {primaryLiveSession.mata_pelajaran_nama}
              </p>
              {primaryLiveSession.ruangan_aktual && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ({primaryLiveSession.ruangan_aktual})
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Guru: <strong className="font-semibold">{primaryLiveSession.guru_nama}</strong>
              {primaryLiveSession.topik_pembelajaran && (
                <span>
                  {" "}
                  — Topik: <span>{primaryLiveSession.topik_pembelajaran}</span>
                </span>
              )}
            </p>
          </div>

          {/* Sisi Kanan: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 z-10">
            <button
              type="button"
              onClick={() => setAttendanceModalSesiId(primaryLiveSession.id)}
              className="h-9.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:ring-2 hover:ring-blue-300/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Presensi Siswa</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => setSessionToClose(primaryLiveSession)}
                className="h-9.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-2xs hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <StopCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Tutup Kelas</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. WORKSPACE TOOLBAR (Status Tabs, Search, Filter & View Toggle)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Sisi Kiri: Status Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none min-w-0">
          {[
            { id: "ALL", label: "Semua", count: sessions.length },
            { id: "DIMULAI", label: "Berlangsung", count: activeSessionsCount, isLive: true },
            { id: "SELESAI", label: "Selesai", count: completedSessionsCount },
            { id: "DIBATALKAN", label: "Dibatalkan", count: cancelledSessionsCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-200/70 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                }`}
              >
                {tab.isLive && tab.count > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] opacity-70">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Sisi Kanan: Search & Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* Search Bar Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari guru, rombel, mapel..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Rombel Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                rombelFilter !== "ALL"
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-[#2563EB] dark:text-blue-400"
                  : "bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Rombel</span>
              {rombelFilter !== "ALL" && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl z-30 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Filter Rombongan Belajar
                  </span>
                  {rombelFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => {
                        setRombelFilter("ALL");
                        setCurrentPage(1);
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <select
                  value={rombelFilter}
                  onChange={(e) => {
                    setRombelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Semua Rombel</option>
                  {rombels.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama} ({r.tingkat_nama || "Kelas"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Toggle View: Card ⊞ vs Table ≡ */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setViewMode("CARD")}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "CARD"
                  ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Tampilan Kartu Sesi"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TABLE"
                  ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Tampilan Tabel Data"
            >
              <Table2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CONTENT PRESENTATION (Mode Kartu & Mode Tabel)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "CARD" ? (
        /* A. KARTU SESI PEMBELAJARAN (Responsive Grid, Academic Glass UI) */
        <div className="space-y-4">
          {paginatedSessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Tidak ada log sesi kelas pembelajaran yang cocok dengan filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {paginatedSessions.map((s) => {
                const isLive = s.status === "DIMULAI";
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border p-4.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group ${
                      isLive
                        ? "border-emerald-300/80 dark:border-emerald-800/80 ring-1 ring-emerald-400/20"
                        : "border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      {/* Top Bar Kartu: Tanggal & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(s.tanggal).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            s.status === "DIMULAI"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : s.status === "SELESAI"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                          }`}
                        >
                          {isLive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          <span>
                            {s.status === "DIMULAI"
                              ? "Berlangsung"
                              : s.status === "SELESAI"
                                ? "Selesai"
                                : s.status}
                          </span>
                        </span>
                      </div>

                      {/* Header Kartu: Rombel & Mapel */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                            {s.rombel_nama}
                          </h4>
                          {s.ruangan_aktual && (
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                              {s.ruangan_aktual}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate"
                          title={s.mata_pelajaran_nama}
                        >
                          {s.mata_pelajaran_nama}
                        </p>
                      </div>

                      {/* Info Guru & Topik */}
                      <div className="space-y-1.5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
                          <span className="text-slate-400">Guru:</span>
                          <strong className="text-slate-800 dark:text-slate-200 truncate">
                            {s.guru_nama}
                          </strong>
                          {s.guru_pengganti_nama && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                              (Ganti: {s.guru_pengganti_nama})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {s.jam_mulai_aktual
                              ? new Date(s.jam_mulai_aktual).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}{" "}
                            -{" "}
                            {s.jam_selesai_aktual
                              ? new Date(s.jam_selesai_aktual).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : isLive
                                ? "(Aktif)"
                                : "-"}
                          </span>
                        </div>

                        {s.topik_pembelajaran && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate pt-0.5">
                            <span className="not-italic text-slate-400 dark:text-slate-500">
                              Topik:{" "}
                            </span>
                            <span>{s.topik_pembelajaran}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Kartu: Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setAttendanceModalSesiId(s.id)}
                        className="h-8.5 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Presensi</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isLive && canManage && (
                          <button
                            type="button"
                            onClick={() => setSessionToClose(s)}
                            className="h-8.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <StopCircle className="h-3.5 w-3.5 text-rose-400" />
                            <span>Tutup Kelas</span>
                          </button>
                        )}

                        {s.penugasan_mengajar_id && (
                          <Link
                            href={`/kelas-saya/${s.penugasan_mengajar_id}`}
                            className="h-8.5 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Kelola Ruang Kelas Digital"
                          >
                            <span>Kelola Kelas</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* B. TABEL SESI PEMBELAJARAN (Audit Data Table, Academic Glass UI) */
        <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tanggal & Waktu Aktual</th>
                  <th className="px-4 py-3.5">Rombel & Mapel</th>
                  <th className="px-4 py-3.5">Guru Pengampu</th>
                  <th className="px-4 py-3.5">Topik / Ruangan</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm"
                    >
                      Tidak ada sesi kelas pembelajaran yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginatedSessions.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {new Date(s.tanggal).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {s.jam_mulai_aktual
                              ? new Date(s.jam_mulai_aktual).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}{" "}
                            -{" "}
                            {s.jam_selesai_aktual
                              ? new Date(s.jam_selesai_aktual).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : " (Aktif)"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {s.mata_pelajaran_nama}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                          {s.rombel_nama}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {s.guru_nama}
                        </span>
                        {s.guru_pengganti_nama && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">
                            Pengganti: {s.guru_pengganti_nama}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.topik_pembelajaran ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {s.topik_pembelajaran}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs block">
                            Tanpa topik khusus
                          </span>
                        )}
                        {s.ruangan_aktual && (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">
                            Ruang: {s.ruangan_aktual}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            s.status === "DIMULAI"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : s.status === "SELESAI"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                          }`}
                        >
                          {s.status === "DIMULAI" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          <span>
                            {s.status === "DIMULAI"
                              ? "Berlangsung"
                              : s.status === "SELESAI"
                                ? "Selesai"
                                : s.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setAttendanceModalSesiId(s.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#2563EB] dark:text-blue-400 font-semibold text-xs border border-blue-200/80 dark:border-blue-900 shadow-2xs transition-all cursor-pointer"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Presensi</span>
                          </button>
                          {s.status === "DIMULAI" && canManage && (
                            <button
                              type="button"
                              onClick={() => setSessionToClose(s)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                            >
                              <StopCircle className="h-3.5 w-3.5 text-rose-400" />
                              <span>Tutup Kelas</span>
                            </button>
                          )}
                          {s.status === "SELESAI" && (
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              Selesai
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {sortedSessions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={5}>5 Sesi</option>
              <option value={10}>10 Sesi</option>
              <option value={20}>20 Sesi</option>
              <option value={50}>50 Sesi</option>
            </select>
            <span>dari {sortedSessions.length} total sesi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-1">
              Halaman{" "}
              <strong className="font-mono font-bold text-slate-900 dark:text-white">
                {currentPage}
              </strong>{" "}
              dari{" "}
              <strong className="font-mono font-bold text-slate-900 dark:text-white">
                {totalPages}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Class Session Modal (Create Session) */}
      {isCreateOpen && (
        <ClassSessionModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          rombels={rombels}
          assignments={assignments}
          teachers={teachers}
          onSuccess={(t) => {
            setToast(t);
            router.refresh();
          }}
        />
      )}

      {/* Close Class Session Confirmation Modal */}
      {sessionToClose &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Selesaikan Sesi Pembelajaran?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sesi kelas {sessionToClose.rombel_nama} ({sessionToClose.mata_pelajaran_nama})
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Penutup Sesi (Opsional)
                </label>
                <textarea
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  rows={2}
                  placeholder="Catatan kemajuan materi, jurnal kelas, atau refleksi belajar..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSessionToClose(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCloseSessionSubmit}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {isPending ? "Menutup..." : "Ya, Selesaikan Kelas"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Class Session Attendance Modal */}
      <SessionAttendanceModal
        sesiId={attendanceModalSesiId}
        isOpen={Boolean(attendanceModalSesiId)}
        onClose={() => setAttendanceModalSesiId(null)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
    </div>
  );
}
