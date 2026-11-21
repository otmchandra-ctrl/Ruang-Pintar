"use client";

/**
 * Ruang Pintar — M10 Personal Teacher / Student Schedule View
 * Enterprise-Grade Academic Glass UI (Timeline-First, Live Cockpit, Motion-Driven)
 *
 * Menggabungkan slot berurutan menjadi 1 Card Sesi Pembelajaran Terpadu.
 * Desain bersih, konsisten, profesional, dan nyaman di mata (selaras dengan dashboard):
 * - Live Teaching Spotlight untuk jadwal hari ini
 * - Timeline alur waktu kronologis (pagi s/d siang) dengan opsi Grid switch
 * - Tipografi rapih dan monokromatik tanpa warna neon
 * - Tombol aksi glowing blue gradient hover
 */

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  Sparkles,
  PlayCircle,
  Download,
  CalendarClock,
  ChevronRight,
  Loader2,
  CalendarDays,
  LayoutGrid,
  ListOrdered,
  MapPin,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "@/shared/components/motion/motion-elements";
import {
  openClassSessionAction,
  ensureAndGetTodaySessionAction,
} from "@/app/actions/class-session-actions";
import { HariBelajar, ScheduleEntryDTO } from "../domain/schedule-types";
import { Toast, ToastType } from "@/shared/components/ui/toast";
import { SessionAttendanceModal } from "@/modules/attendance/presentation/session-attendance-modal";
import { MergedScheduleBlock, mergeConsecutiveScheduleEntries } from "../domain/schedule-merger";
import { AnimatedCounter } from "@/shared/components/motion/animated-counter";
import { getHariBelajarInTimezone } from "@/shared/lib/date-utils";

export type { MergedScheduleBlock };
export { mergeConsecutiveScheduleEntries };

interface MyScheduleViewProps {
  entries: ScheduleEntryDTO[];
  teacherName?: string;
  isTeacher: boolean;
  initialScheduleRombelId?: string;
  schoolName?: string;
}

export function MyScheduleView({
  entries,
  teacherName: _teacherName,
  isTeacher,
  initialScheduleRombelId,
  schoolName,
}: MyScheduleViewProps) {
  const router = useRouter();
  const [selectedHari, setSelectedHari] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"TIMELINE" | "GRID">("TIMELINE");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [, startTransition] = useTransition();
  const [attendanceModalSesiId, setAttendanceModalSesiId] = useState<string | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [pendingBlockKey, setPendingBlockKey] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Map hari ini
  const todayDayName = getHariBelajarInTimezone(new Date(), "Asia/Jakarta");

  const isBlockLive = (block: MergedScheduleBlock) => {
    if (block.hari !== todayDayName || !currentTimeStr) return false;
    return currentTimeStr >= block.jam_mulai && currentTimeStr <= block.jam_selesai;
  };

  // Data gabungan per blok
  const allMergedBlocks = mergeConsecutiveScheduleEntries(entries);

  // Filter berdasarkan hari
  const filteredBlocks = allMergedBlocks.filter(
    (b) => selectedHari === "ALL" || b.hari === selectedHari
  );

  // Metrik Hari Ini
  const todayEntries = entries.filter((e) => e.hari === todayDayName);
  const todayBlocks = allMergedBlocks.filter((b) => b.hari === todayDayName);
  const uniqueRombels = new Set(entries.map((e) => e.rombel_id));

  // Spotlight sesi hari ini (sesi live atau sesi terdekat berikutnya)
  const liveBlock = todayBlocks.find((b) => isBlockLive(b));
  const upcomingBlock = todayBlocks.find((b) => currentTimeStr < b.jam_mulai);
  const spotlightBlock = liveBlock || upcomingBlock || todayBlocks[0] || null;

  const handleQuickAttendance = async (block: MergedScheduleBlock) => {
    setPendingBlockKey(block.key);
    try {
      const res = await ensureAndGetTodaySessionAction({
        penugasan_mengajar_id: block.penugasan_mengajar_id,
        jadwal_pelajaran_id: block.primary_entry?.id || null,
        rombel_id: block.rombel_id,
        mata_pelajaran_id: block.mata_pelajaran_id,
        ruangan_aktual: block.ruangan || null,
      });

      if (res.success && res.data?.sessionId) {
        setAttendanceModalSesiId(res.data.sessionId);
        setIsAttendanceModalOpen(true);
      } else {
        setToast({ message: res.message, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message || "Gagal membuka sesi kelas.", type: "error" });
    } finally {
      setPendingBlockKey(null);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      setToast({ message: "Tidak ada jadwal untuk diekspor.", type: "error" });
      return;
    }

    const headers = [
      "No",
      "Hari",
      "Jam Mulai",
      "Jam Selesai",
      "Durasi JP",
      "Rombel",
      "Mata Pelajaran",
      "Ruangan",
      "Catatan",
    ];
    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = allMergedBlocks.map((b, idx) => [
      idx + 1,
      escapeCsv(b.hari),
      escapeCsv(b.jam_mulai),
      escapeCsv(b.jam_selesai),
      escapeCsv(`${b.total_jp} JP`),
      escapeCsv(b.rombel_nama),
      escapeCsv(b.mata_pelajaran_nama),
      escapeCsv(b.ruangan || "-"),
      escapeCsv(b.slot_range_label),
    ]);

    const delimiter = ";";
    const csvContent =
      "\uFEFF" + [headers.join(delimiter), ...rows.map((r) => r.join(delimiter))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jadwal_mengajar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      message: `Berhasil mengekspor ${allMergedBlocks.length} blok jadwal mengajar ke CSV.`,
      type: "success",
    });
  };

  const daysList: HariBelajar[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

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
        {/* Sisi Kiri: 3D Isometric Schedule Hero Banner (Hanya Layar >=768px, ukuran & styling persis seperti Dashboard & Kelas Saya) */}
        <div className="hidden md:flex xl:col-span-8 rounded-[28px] sm:rounded-[32px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden flex-col md:flex-row md:items-center justify-between gap-5 h-full">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Sisi Kiri Banner: Badge, Judul, Deskripsi, & Action Buttons */}
          <div className="space-y-3.5 z-10 max-w-xl flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Teaching Schedule Center</span>
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
                {isTeacher ? "Jadwal Mengajar Saya" : "Jadwal Pelajaran Saya"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {isTeacher
                  ? entries.length > 0
                    ? `Alokasi tatap muka resmi: ${entries.length} JP mingguan (${uniqueRombels.size} rombel). Pantau alur mengajar dan kelola kehadiran siswa.`
                    : "Daftar alokasi waktu mengajar mingguan resmi belum diterbitkan oleh bagian kurikulum sekolah."
                  : "Jadwal mata pelajaran mingguan rombel belajar Anda berdasarkan publikasi kurikulum resmi sekolah."}
              </p>
            </div>

            {/* Action Buttons dengan Efek Bar Hover Glow Terang & Berkilau */}
            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              {isTeacher && (
                <Link
                  href="/sesi-pembelajaran"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_22px_rgba(59,130,246,0.55)] hover:ring-2 hover:ring-blue-300/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Buka Sesi KBM</span>
                </Link>
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

          {/* Sisi Kanan Banner: 3D Isometric Illustration */}
          <div className="relative shrink-0 w-48 sm:w-56 md:w-64 h-44 sm:h-52 md:h-56 flex items-center justify-center md:justify-end z-20 pointer-events-none select-none">
            <div className="relative w-44 sm:w-52 md:w-60 h-full">
              <Image
                src="/images/illustrations/academic-structure-3d.png"
                alt="Ilustrasi Jadwal Akademik 3D Ruang Pintar"
                fill
                sizes="(max-width: 640px) 200px, 260px"
                priority
                className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.25)]"
              />
            </div>
          </div>
        </div>

        {/* Sisi Kanan: 3 Card Informasi (4 Kolom di XL, tersusun vertikal sejajar dengan tinggi banner di sebelah kiri) */}
        <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 xl:flex xl:flex-col xl:justify-between gap-3 sm:gap-3.5 h-full">
          {/* Metric 1: Total JP / Minggu */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-default flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                Total Mengajar
              </span>
              <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 shadow-2xs shrink-0">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="my-1.5">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight block">
                {entries.length > 0 ? `${entries.length} JP / Minggu` : "0 JP / Minggu"}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                Beban tatap muka resmi
              </span>
            </div>
          </div>

          {/* Metric 2: Kelas Hari Ini */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-default flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                Hari Ini ({todayDayName})
              </span>
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {todayBlocks.length > 0 ? todayBlocks.length : 0}
                </span>
                <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                  Sesi Terjadwal
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                {todayEntries.length > 0
                  ? `${todayEntries.length} JP pembelajaran`
                  : "Tidak ada jadwal KBM"}
              </span>
            </div>
          </div>

          {/* Metric 3: Rombel Terampu */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-default flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                Rombel Binaan
              </span>
              <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {uniqueRombels.size}
                </span>
                <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                  Rombel
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                {allMergedBlocks.length} blok sesi mingguan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LIVE TEACHING SPOTLIGHT (Card Sesi Aktif / Terdekat Hari Ini)
      ───────────────────────────────────────────────────────────── */}
      {isTeacher && spotlightBlock && (
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 p-4 sm:p-5 shadow-2xs backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-48 h-24 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Left: Info Sesi Hari Ini */}
          <div className="space-y-1.5 z-10 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isBlockLive(spotlightBlock) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 font-mono text-[11px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Sedang Berlangsung</span>
                </span>
              ) : currentTimeStr && currentTimeStr < spotlightBlock.jam_mulai ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 font-mono text-[11px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span>Sesi Terdekat Hari Ini</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                  <span>Sesi Hari Ini</span>
                </span>
              )}

              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                {spotlightBlock.jam_mulai} - {spotlightBlock.jam_selesai} •{" "}
                {spotlightBlock.total_jp} JP ({spotlightBlock.slot_range_label})
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {spotlightBlock.rombel_nama}
              </h3>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                {spotlightBlock.mata_pelajaran_nama}
              </p>
              {spotlightBlock.ruangan && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ({spotlightBlock.ruangan})
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 z-10">
            <button
              type="button"
              onClick={() => handleQuickAttendance(spotlightBlock)}
              disabled={pendingBlockKey === spotlightBlock.key}
              className="h-9.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:ring-2 hover:ring-blue-300/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Buka form presensi kilat langsung"
            >
              {pendingBlockKey === spotlightBlock.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              <span>Presensi Kilat 15 Detik</span>
            </button>

            {isTeacher ? (
              <Link
                href={`/kelas-saya/${spotlightBlock.penugasan_mengajar_id}`}
                className="h-9.5 px-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 text-xs font-semibold shadow-2xs hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Kelola Kelas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/tugas-siswa"
                className="h-9.5 px-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 text-xs font-semibold shadow-2xs hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Materi & Tugas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. WORKSPACE TOOLBAR (Day Switcher, View Switcher & CSV Export)
          Mengadopsi filosofi: 1 single card tanpa border dan warna
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
        {/* Sisi Kiri: Day Switcher Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none min-w-0">
          <button
            type="button"
            onClick={() => setSelectedHari("ALL")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedHari === "ALL"
                ? "bg-slate-200/70 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            }`}
          >
            <span>Semua</span>
            <span className="font-mono text-[10px] opacity-70">({entries.length} JP)</span>
          </button>

          {daysList.map((d) => {
            const dayEntries = entries.filter((e) => e.hari === d);
            const isToday = d === todayDayName;
            const isSelected = selectedHari === d;
            if (dayEntries.length === 0) return null;

            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedHari(d)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-200/70 dark:bg-slate-800 text-slate-950 dark:text-white font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                }`}
              >
                {isToday && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />}
                <span>{d}</span>
                <span className="font-mono text-[10px] opacity-70">({dayEntries.length} JP)</span>
              </button>
            );
          })}
        </div>

        {/* Sisi Kanan: Toggle Timeline vs Grid & Ekspor CSV */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
          {/* Toggle View: Timeline ⏱️ vs Grid ⊞ */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setViewMode("TIMELINE")}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TIMELINE"
                  ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Tampilan Alur Waktu Kronologis"
              aria-label="Tampilan Timeline"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "GRID"
                  ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Tampilan Kartu Grid"
              aria-label="Tampilan Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Tombol Ekspor CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Ekspor Jadwal ke CSV"
            className="h-8 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SCHEDULE DIRECTORY CONTENT (Timeline vs Grid)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {filteredBlocks.length === 0 ? (
          /* Empty State */
          <motion.div
            key="empty-schedule-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="p-10 sm:p-12 text-center rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center mx-auto shadow-2xs">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tidak ada jadwal pembelajaran
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {selectedHari === "ALL"
                  ? "Anda belum memiliki jadwal mengajar pada versi kurikulum resmi yang aktif."
                  : `Tidak ada jadwal mengajar pada hari ${selectedHari}.`}
              </p>
            </div>
            {isTeacher && initialScheduleRombelId && selectedHari === "ALL" && (
              <Link
                href="/dashboard#persiapan-mengajar"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all cursor-pointer"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Atur Jadwal di Persiapan Mengajar</span>
              </Link>
            )}
          </motion.div>
        ) : viewMode === "TIMELINE" ? (
          /* A. TIMELINE VIEW: KRONOLOGIS ALUR WAKTU HARIAN */
          <div className="relative pl-4 sm:pl-6 space-y-4 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80 dark:before:bg-slate-800">
            {filteredBlocks.map((block, idx) => {
              const isToday = block.hari === todayDayName;
              const isLive = isBlockLive(block);

              return (
                <motion.div
                  key={block.key}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.04, 0.2),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`relative rounded-2xl border ${
                    isLive
                      ? "border-emerald-300 dark:border-emerald-700 bg-white/95 dark:bg-slate-900/95 ring-2 ring-emerald-500/20"
                      : isToday
                        ? "border-blue-200/90 dark:border-blue-800/80 bg-white/90 dark:bg-slate-900/90"
                        : "border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
                  } backdrop-blur-md p-4 sm:p-5 shadow-2xs hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group`}
                >
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[21px] sm:-left-[29px] top-6 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      isLive
                        ? "bg-emerald-500 ring-4 ring-emerald-400/20"
                        : isToday
                          ? "bg-blue-600 ring-4 ring-blue-400/20"
                          : "bg-slate-400 dark:bg-slate-600"
                    }`}
                  />

                  {/* Sisi Kiri: Waktu, Durasi & Hari */}
                  <div className="flex items-center gap-4 min-w-[190px]">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {block.jam_mulai} - {block.jam_selesai}
                      </div>
                      <div className="text-[11px] font-semibold font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {block.total_jp} JP ({block.slot_range_label})
                      </div>
                      {selectedHari === "ALL" && (
                        <span className="inline-block mt-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {block.hari}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sisi Tengah: Rombel & Mata Pelajaran */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                        {block.rombel_nama}
                      </h4>
                      {block.ruangan && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <MapPin className="h-3 w-3" />
                          <span>{block.ruangan}</span>
                        </span>
                      )}
                      {isLive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Sedang Aktif
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate"
                      title={block.mata_pelajaran_nama}
                    >
                      {block.mata_pelajaran_nama}
                    </p>
                  </div>

                  {/* Sisi Kanan: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto justify-end">
                    {isTeacher ? (
                      <Link
                        href={`/kelas-saya/${block.penugasan_mengajar_id}`}
                        className="h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <span>Kelola Kelas</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/tugas-siswa"
                        className="h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <span>Materi & Tugas</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}

                    {isTeacher && isToday && (
                      <button
                        type="button"
                        onClick={() => handleQuickAttendance(block)}
                        disabled={pendingBlockKey === block.key}
                        className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_18px_rgba(59,130,246,0.5)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        title="Buka presensi kelas"
                      >
                        {pendingBlockKey === block.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5" />
                        )}
                        <span>Presensi</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* B. GRID VIEW: KARTU 3 KOLOM SEJAJAR */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredBlocks.map((block, idx) => {
              const isToday = block.hari === todayDayName;
              const isLive = isBlockLive(block);

              return (
                <motion.div
                  key={block.key}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.04, 0.2),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ scale: 1.018, y: -4 }}
                  className={`rounded-2xl border ${
                    isLive
                      ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                      : isToday
                        ? "border-blue-200 dark:border-blue-800"
                        : "border-slate-200/80 dark:border-slate-800"
                  } bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between gap-3 group`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Hari + Jam */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {block.hari}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold font-mono text-slate-600 dark:text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {block.jam_mulai} - {block.jam_selesai}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Rombel & Mapel */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                          {block.rombel_nama}
                        </h4>
                        <span className="text-[11px] font-semibold font-mono text-slate-500 dark:text-slate-400">
                          {block.total_jp} JP ({block.slot_range_label})
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate"
                        title={block.mata_pelajaran_nama}
                      >
                        {block.mata_pelajaran_nama}
                      </p>
                      {block.ruangan && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Ruang: {block.ruangan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    {isTeacher ? (
                      <Link
                        href={`/kelas-saya/${block.penugasan_mengajar_id}`}
                        className="h-8.5 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 flex items-center gap-1 transition-all"
                      >
                        <span>Kelola Kelas</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/tugas-siswa"
                        className="h-8.5 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 flex items-center gap-1 transition-all"
                      >
                        <span>Materi & Tugas</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}

                    {isTeacher && isToday && (
                      <button
                        type="button"
                        onClick={() => handleQuickAttendance(block)}
                        disabled={pendingBlockKey === block.key}
                        className="h-8.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 text-white text-xs font-semibold shadow-xs hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                      >
                        {pendingBlockKey === block.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5" />
                        )}
                        <span>Presensi</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Session Attendance Modal (Fast-Track 1-Click Marking) */}
      {isAttendanceModalOpen && attendanceModalSesiId && (
        <SessionAttendanceModal
          sesiId={attendanceModalSesiId}
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setAttendanceModalSesiId(null);
          }}
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            startTransition(() => {
              router.refresh();
            });
          }}
          onError={(msg) => {
            setToast({ message: msg, type: "error" });
          }}
        />
      )}
    </div>
  );
}
