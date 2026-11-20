"use client";

/**
 * Ruang Pintar — M11 Teacher Classes Workspace (/kelas-saya)
 * Enterprise-Grade Professional Redesign (Flat, Clean, Minimalist, Motion-Driven)
 */

import React, { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Table2,
  Plus,
  Camera,
  Filter,
  Clock,
  Users,
  BookOpen,
  ArrowUpRight,
  DoorOpen,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
  MoreVertical,
  Layers,
} from "lucide-react";
import { motion } from "@/shared/components/motion/motion-elements";
import { TeacherClassCardDTO } from "../domain/learning-types";
import { ManualCreateClassModal } from "./manual-create-class-modal";
import { QuickSetScheduleModal } from "./quick-set-schedule-modal";
import { ManageCurriculumModal } from "./manage-curriculum-modal";
import { Toast, ToastType } from "@/shared/components/ui/toast";
import { deleteRombelAction, updateRombelAction } from "@/app/actions/academic-actions";
import { TeacherHeroActions } from "@/shared/components/dashboard/cockpit/teacher-hero-actions";
import { TeacherTrialPill } from "@/shared/components/dashboard/cockpit/teacher-trial-pill";

export interface TeacherSimpleDTO {
  id: string;
  nama_lengkap: string;
  gelar_depan: string | null;
  gelar_belakang: string | null;
  total_kelas: number;
}

interface TeacherClassesViewProps {
  classes: TeacherClassCardDTO[];
  teacherName?: string;
  isAdmin?: boolean;
  teachersList?: TeacherSimpleDTO[];
  initialSelectedGuruId?: string | null;
  isSubscribed?: boolean;
  isTenantOwner?: boolean;
}

export function TeacherClassesView({
  classes,
  teacherName,
  isAdmin = false,
  teachersList = [],
  initialSelectedGuruId = null,
  isSubscribed = false,
  isTenantOwner = false,
}: TeacherClassesViewProps) {
  const router = useRouter();

  // 1. Filter, Search & View Mode States
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "TODAY" | "UNSCHEDULED">("ALL");
  const [selectedTingkat, setSelectedTingkat] = useState<string>("ALL");
  const [selectedGuruId, setSelectedGuruId] = useState<string>(initialSelectedGuruId || "ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [openActionMenuRombelId, setOpenActionMenuRombelId] = useState<string | null>(null);

  useEffect(() => {
    if (!openActionMenuRombelId) return;
    const handleClickOutside = () => setOpenActionMenuRombelId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [openActionMenuRombelId]);

  // 2. Modals State
  const [scheduleModalTarget, setScheduleModalTarget] = useState<TeacherClassCardDTO | null>(null);
  const [classActionTarget, setClassActionTarget] = useState<{ id: string; nama: string } | null>(
    null
  );
  const [classActionMode, setClassActionMode] = useState<"rename" | "delete" | null>(null);
  const [isManageCurriculumOpen, setIsManageCurriculumOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [classActionLoading, setClassActionLoading] = useState(false);
  const [classActionError, setClassActionError] = useState<string | null>(null);

  // 3. Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const handleOpenAiPhoto = () => {
    setIsActionsDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("open-ai-photo-modal"));
  };

  const handleOpenManualClass = () => {
    setIsActionsDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("open-manual-class-modal"));
  };

  // Hitung jumlah kelas hari ini & belum terjadwal dari dataset awal
  const todayClassesTotal = useMemo(() => {
    return classes.filter((c) => Boolean(c.jadwal_hari_ini)).length;
  }, [classes]);

  const unscheduledClassesTotal = useMemo(() => {
    return classes.filter((c) => !c.jadwal_ringkas || c.jumlah_jam_minggu === 0).length;
  }, [classes]);

  // Daftar tingkat unik untuk filter dropdown
  const uniqueTingkats = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.tingkat_nama) set.add(c.tingkat_nama);
    });
    return Array.from(set).sort();
  }, [classes]);

  const uniqueRombelsCount = useMemo(() => {
    return new Set(classes.map((c) => c.rombel_id)).size;
  }, [classes]);

  const totalPenugasanCount = classes.length;

  // Filtering data reaktif
  const filtered = useMemo(() => {
    return classes.filter((c) => {
      // Filter status tab operasional
      if (statusTab === "TODAY" && !c.jadwal_hari_ini) {
        return false;
      }
      if (statusTab === "UNSCHEDULED" && c.jadwal_ringkas && c.jumlah_jam_minggu > 0) {
        return false;
      }
      // Filter guru (admin)
      if (isAdmin && selectedGuruId !== "ALL" && c.guru_id !== selectedGuruId) {
        return false;
      }
      // Filter tingkat
      if (selectedTingkat !== "ALL" && c.tingkat_nama !== selectedTingkat) {
        return false;
      }
      // Filter pencarian teks
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchRombel = c.rombel_nama.toLowerCase().includes(query);
        const matchMapel = c.mata_pelajaran_nama.toLowerCase().includes(query);
        const matchKode = c.mata_pelajaran_kode.toLowerCase().includes(query);
        const matchGuru = c.guru_nama && c.guru_nama.toLowerCase().includes(query);
        if (!matchRombel && !matchMapel && !matchKode && !matchGuru) {
          return false;
        }
      }
      return true;
    });
  }, [classes, statusTab, isAdmin, selectedGuruId, selectedTingkat, search]);

  // Paginasi
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pagedClasses = filtered.slice(startIndex, startIndex + pageSize);

  const handleResetFilters = () => {
    setSearch("");
    setStatusTab("ALL");
    setSelectedTingkat("ALL");
    setSelectedGuruId("ALL");
    setCurrentPage(1);
  };

  async function handleRenameRombel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classActionTarget || !isTenantOwner) return;

    setClassActionLoading(true);
    setClassActionError(null);
    const formData = new FormData();
    formData.set("nama", String(new FormData(event.currentTarget).get("nama") ?? ""));
    const response = await updateRombelAction(classActionTarget.id, formData);
    if (response.success) {
      setClassActionTarget(null);
      setClassActionMode(null);
      router.refresh();
    } else {
      setClassActionError(response.error);
    }
    setClassActionLoading(false);
  }

  async function handleDeleteRombel() {
    if (!classActionTarget || !isTenantOwner) return;

    setClassActionLoading(true);
    setClassActionError(null);
    const response = await deleteRombelAction(classActionTarget.id);
    if (response.success) {
      setClassActionTarget(null);
      setClassActionMode(null);
      router.refresh();
    } else {
      setClassActionError(response.error);
    }
    setClassActionLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4 sm:space-y-5 pb-16 w-full"
    >
      {/* Modal Dialogs */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}

      <ManageCurriculumModal
        isOpen={isManageCurriculumOpen}
        onClose={() => setIsManageCurriculumOpen(false)}
        classes={classes}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <ManualCreateClassModal />

      {scheduleModalTarget && (
        <QuickSetScheduleModal
          isOpen={!!scheduleModalTarget}
          onClose={() => setScheduleModalTarget(null)}
          rombelId={scheduleModalTarget.rombel_id}
          penugasanId={scheduleModalTarget.id}
          rombelNama={scheduleModalTarget.rombel_nama}
          mataPelajaranNama={scheduleModalTarget.mata_pelajaran_nama}
        />
      )}

      {/* Alert Banner Jam Mengajar jika ada yang belum diatur */}
      {unscheduledClassesTotal > 0 && (
        <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">
              {unscheduledClassesTotal} Rombel Belum Memiliki Jam Mengajar
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const target = classes.find((c) => !c.jadwal_ringkas || c.jumlah_jam_minggu === 0);
              if (target) setScheduleModalTarget(target);
            }}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            + Atur Jam
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. WORKSPACE TOOLBAR
          Search Bar (Proper input), Semua, Hari Ini, Icon Filter, Icon Grid, Icon Tabel
          Card pembungkus transparan tanpa warna latar
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 w-full">
        {/* A. Search Bar (Tampilan Search Bar yang Jelas, Bersih & Nyata) */}
        <div className="relative flex-1 flex items-center min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder={
              isAdmin ? "Cari rombel, mapel, guru..." : "Cari rombel atau mata pelajaran..."
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* B. Controls Row: Semua | Hari Ini | Icon Filter | Icon Grid | Icon Tabel (Tanpa Warna Card) */}
        <div className="flex items-center justify-between md:justify-end gap-1 sm:gap-1.5 shrink-0">
          {/* Tab: Semua (Tulisan Diperkecil) */}
          <button
            type="button"
            onClick={() => {
              setStatusTab("ALL");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusTab === "ALL"
                ? "text-slate-950 dark:text-white font-bold bg-slate-200/70 dark:bg-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium"
            }`}
          >
            <span>Semua</span>
            <span className="font-mono text-[10px] opacity-70">({classes.length})</span>
          </button>

          {/* Tab: Hari Ini (Tulisan Diperkecil) */}
          <button
            type="button"
            onClick={() => {
              setStatusTab("TODAY");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusTab === "TODAY"
                ? "text-slate-950 dark:text-white font-bold bg-slate-200/70 dark:bg-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium"
            }`}
          >
            <span>Hari Ini</span>
            <span className="font-mono text-[10px] opacity-70">({todayClassesTotal})</span>
          </button>

          {/* Tab: Belum Diatur (jika ada rombel belum diatur jamnya) */}
          {unscheduledClassesTotal > 0 && (
            <button
              type="button"
              onClick={() => {
                setStatusTab("UNSCHEDULED");
                setCurrentPage(1);
              }}
              className={`px-2 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer flex items-center gap-1 text-amber-600 dark:text-amber-400 ${
                statusTab === "UNSCHEDULED"
                  ? "bg-amber-100/80 dark:bg-amber-950/60 font-bold"
                  : "hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium"
              }`}
              title="Rombel belum diatur jam"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono text-[10px]">({unscheduledClassesTotal})</span>
            </button>
          )}

          {/* Icon Filter (Tingkat - Hapus tulisan "Semua Tingkat", Hanya Icon) */}
          {uniqueTingkats.length > 1 ? (
            <div
              className={`relative p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                selectedTingkat !== "ALL"
                  ? "bg-slate-200/70 dark:bg-slate-800 text-slate-950 dark:text-white font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              }`}
              title="Filter Tingkat"
            >
              <Filter className="h-4 w-4 shrink-0 pointer-events-none" />
              {selectedTingkat !== "ALL" && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 pointer-events-none" />
              )}
              <select
                value={selectedTingkat}
                onChange={(e) => {
                  setSelectedTingkat(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter Tingkat"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
              >
                <option value="ALL">Semua Tingkat</option>
                {uniqueTingkats.map((tk) => (
                  <option key={tk} value={tk}>
                    {tk}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              type="button"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
              title="Filter"
              aria-label="Filter"
            >
              <Filter className="h-4 w-4" />
            </button>
          )}

          {/* Khusus Admin: Filter Guru (Hanya Icon Users) */}
          {isAdmin && (
            <div
              className={`relative p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                selectedGuruId !== "ALL"
                  ? "bg-slate-200/70 dark:bg-slate-800 text-slate-950 dark:text-white font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              }`}
              title="Filter Guru"
            >
              <Users className="h-4 w-4 shrink-0 pointer-events-none" />
              {selectedGuruId !== "ALL" && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 pointer-events-none" />
              )}
              <select
                value={selectedGuruId}
                onChange={(e) => {
                  setSelectedGuruId(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter Guru"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
              >
                <option value="ALL">Semua Guru ({teachersList.length})</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.gelar_depan ? `${t.gelar_depan} ` : ""}
                    {t.nama_lengkap}
                    {t.gelar_belakang ? `, ${t.gelar_belakang}` : ""} ({t.total_kelas})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tombol Reset jika ada filter aktif */}
          {(search ||
            statusTab !== "ALL" ||
            selectedTingkat !== "ALL" ||
            selectedGuruId !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset filter"
              aria-label="Reset filter"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Icon Grid */}
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === "GRID"
                ? "text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-800 shadow-2xs"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            }`}
            title="Tampilan Grid"
            aria-label="Tampilan Grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>

          {/* Icon Tabel */}
          <button
            type="button"
            onClick={() => setViewMode("TABLE")}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === "TABLE"
                ? "text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-800 shadow-2xs"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            }`}
            title="Tampilan Tabel"
            aria-label="Tampilan Tabel"
          >
            <Table2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CLASS DIRECTORY WORKSPACE CONTENT (Grid / Table)
      ───────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 font-sans">
          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada kelas yang ditemukan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {search
                ? `Tidak ada kelas yang cocok dengan kata kunci "${search}".`
                : statusTab === "TODAY"
                  ? "Tidak ada jadwal mengajar pada hari ini."
                  : "Belum ada penugasan kelas yang cocok dengan filter yang dipilih."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Tampilkan Semua Kelas</span>
          </button>
        </div>
      ) : viewMode === "GRID" ? (
        /* A. FLAT ENTERPRISE CARD GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 font-sans">
          {pagedClasses.map((c, idx) => {
            const isUnscheduled = !c.jadwal_ringkas || c.jumlah_jam_minggu === 0;
            const hasScheduleToday = !isUnscheduled && Boolean(c.jadwal_hari_ini);

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min((idx % 3) * 0.06, 0.18),
                }}
                whileHover={{
                  scale: 1.018,
                  y: -4,
                  transition: { duration: 0.18, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/kelas-saya/${c.id}`)}
                className="rounded-[26px] border border-slate-200/90 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-2xs hover:shadow-xl hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:ring-1 hover:ring-blue-300/30 transition-all p-5 flex flex-col justify-between gap-4 group relative will-change-transform cursor-pointer"
              >
                <div className="space-y-3.5">
                  {/* Row 1: Nama Rombel Ukuran Besar, Tingkat, Kode Mapel & Titik 3 Control (Owner Only) */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Nama Rombel Ukuran Besar */}
                        <h3 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {c.rombel_nama}
                        </h3>
                        {c.tingkat_nama && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                            {c.tingkat_nama}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs sm:text-sm font-semibold font-sans text-slate-600 dark:text-slate-300 mt-1 truncate"
                        title={c.mata_pelajaran_nama}
                      >
                        {c.mata_pelajaran_nama}
                      </p>
                    </div>

                    {/* Sisi Kanan Atas: Kode Mapel Clean & Titik 3 Control */}
                    <div
                      className="shrink-0 flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 shadow-2xs">
                        {c.mata_pelajaran_kode}
                      </span>

                      {/* Kontrol Titik 3 (Hanya untuk Guru Mandiri / Workspace Owner) */}
                      {isTenantOwner && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuRombelId(
                                openActionMenuRombelId === c.rombel_id ? null : c.rombel_id
                              );
                            }}
                            className="h-8.5 w-8.5 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Menu Kelas"
                            aria-label="Menu Kelas"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu Popover Titik 3 */}
                          <div
                            className={`absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1 z-30 transition-all ${
                              openActionMenuRombelId === c.rombel_id
                                ? "opacity-100 scale-100 pointer-events-auto"
                                : "opacity-0 scale-95 pointer-events-none"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuRombelId(null);
                                setClassActionTarget({ id: c.rombel_id, nama: c.rombel_nama });
                                setClassActionMode("rename");
                                setClassActionError(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-500" />
                              <span>Ubah Nama Kelas</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuRombelId(null);
                                setClassActionTarget({ id: c.rombel_id, nama: c.rombel_nama });
                                setClassActionMode("delete");
                                setClassActionError(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              <span>Hapus Kelas</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Jadwal & Status Operasional KBM */}
                  <div>
                    {isUnscheduled ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-sans shadow-2xs"
                      >
                        <span className="flex items-center gap-1.5 font-sans font-medium">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Jam Belum Diatur</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setScheduleModalTarget(c)}
                          className="text-amber-700 dark:text-amber-300 hover:text-amber-800 font-semibold underline text-xs cursor-pointer"
                        >
                          + Atur Jam
                        </button>
                      </div>
                    ) : hasScheduleToday ? (
                      <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-sans shadow-2xs">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold">Hari Ini:</span>
                        <span className="font-mono font-bold tracking-tight">
                          {c.jadwal_hari_ini}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 font-sans">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs truncate">{c.jadwal_ringkas}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Academic Learning Activity (Kurikulum & Pertemuan KBM) */}
                  <div className="grid grid-cols-2 gap-2 py-2 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] font-sans">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {c.total_bab} BAB • {c.total_materi} Materi
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                      <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{c.total_jurnal} Pertemuan</span>
                    </div>
                  </div>

                  {/* Row 4: Student Roster & Load */}
                  <div className="flex items-center justify-between pt-1 font-sans">
                    <div className="flex items-center gap-2">
                      {/* Avatar Stack Siswa (3 Lingkaran Bertumpuk) */}
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {c.total_siswa > 0 ? (
                          Array.from({ length: Math.min(3, c.total_siswa) }).map((_, i) => {
                            const colors = [
                              "bg-blue-500 text-white",
                              "bg-indigo-500 text-white",
                              "bg-slate-600 text-white",
                            ];
                            return (
                              <div
                                key={i}
                                className={`inline-flex items-center justify-center size-5.5 sm:size-6 rounded-full ring-2 ring-white dark:ring-slate-900 text-[9px] font-bold ${colors[i % colors.length]}`}
                                title={`Siswa ${i + 1}`}
                              >
                                {String.fromCharCode(65 + (i % 26))}
                              </div>
                            );
                          })
                        ) : (
                          <div className="inline-flex items-center justify-center size-5.5 sm:size-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-400 text-[9px]">
                            -
                          </div>
                        )}
                        {c.total_siswa > 3 && (
                          <div className="inline-flex items-center justify-center size-5.5 sm:size-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] font-bold font-mono">
                            +{c.total_siswa - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {c.total_siswa} Siswa
                      </span>
                    </div>

                    {/* Beban JP Mengajar (Clean Mono Text) */}
                    <span className="font-bold font-mono text-xs text-slate-700 dark:text-slate-300">
                      {c.jumlah_jam_minggu} JP
                    </span>
                  </div>
                </div>

                {/* Row 5: Action Footer (Masuk Kelas) - Compact, Minimalis & Elegan */}
                <div
                  className="pt-3 border-t border-slate-100 dark:border-slate-800/80 font-sans flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sisi Kiri: Wali Kelas atau Info Ruang Belajar */}
                  <div className="min-w-0 flex-1">
                    {c.wali_kelas_nama ? (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-sans">
                        Wali:{" "}
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                          {c.wali_kelas_nama}
                        </strong>
                      </div>
                    ) : isAdmin && c.guru_nama ? (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-sans">
                        Guru:{" "}
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                          {c.guru_nama}
                        </strong>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                        <span>Ruang Belajar</span>
                      </div>
                    )}
                  </div>

                  {/* Sisi Kanan: Tombol Compact "Masuk Kelas" (Lingkaran Biru & Morphing Icon Pintu) */}
                  <Link
                    href={`/kelas-saya/${c.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="group/btn inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-semibold font-sans shadow-2xs transition-all duration-300 group-hover/btn:border-blue-400/70 group-hover/btn:bg-blue-50/60 dark:group-hover/btn:bg-blue-950/40 group-hover/btn:shadow-md group-hover/btn:shadow-blue-500/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <span className="transition-colors duration-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400">
                      Masuk Kelas
                    </span>

                    {/* Lingkaran Biru: Berubah jadi Icon Pintu Terbuka saat Mouse Mendekat */}
                    <span className="relative flex items-center justify-center size-6 rounded-full bg-blue-100/90 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 transition-all duration-300 ease-out group-hover/btn:bg-gradient-to-tr group-hover/btn:from-blue-600 group-hover/btn:via-blue-500 group-hover/btn:to-cyan-400 group-hover/btn:text-white group-hover/btn:border-transparent group-hover/btn:shadow-md group-hover/btn:shadow-blue-500/35 group-hover/btn:scale-110">
                      <ArrowUpRight className="h-3.5 w-3.5 transition-all duration-300 ease-out group-hover/btn:opacity-0 group-hover/btn:scale-50 group-hover/btn:rotate-45" />
                      <DoorOpen className="h-3.5 w-3.5 absolute transition-all duration-300 ease-out opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* B. COMPACT DATA TABLE VIEW */
        <div className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] font-sans tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">Rombel</th>
                  <th className="py-2.5 px-4">Mata Pelajaran</th>
                  <th className="py-2.5 px-4">Jadwal Mengajar</th>
                  <th className="py-2.5 px-4 text-center">Beban</th>
                  <th className="py-2.5 px-4 text-center">Siswa</th>
                  {isAdmin && <th className="py-2.5 px-4">Guru</th>}
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {pagedClasses.map((c, index) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {c.rombel_nama}
                      {c.tingkat_nama && (
                        <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                          ({c.tingkat_nama})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.mata_pelajaran_nama}
                      </div>
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {c.mata_pelajaran_kode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {c.jadwal_hari_ini ? (
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                          <span>Hari Ini: {c.jadwal_hari_ini}</span>
                        </span>
                      ) : c.jadwal_ringkas ? (
                        <span className="text-slate-600 dark:text-slate-400">
                          {c.jadwal_ringkas}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setScheduleModalTarget(c)}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold underline cursor-pointer"
                        >
                          + Atur Jam
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {c.jumlah_jam_minggu} JP
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {c.total_siswa} Siswa
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {c.guru_nama}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/kelas-saya/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="group/btn inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-semibold font-sans shadow-2xs transition-all duration-300 hover:border-blue-400/70 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:shadow-md hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
                        >
                          <span className="transition-colors duration-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400">
                            Masuk Kelas
                          </span>

                          {/* Lingkaran Biru dengan Transform Icon Pintu */}
                          <span className="relative flex items-center justify-center size-5.5 rounded-full bg-blue-100/90 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 transition-all duration-300 ease-out group-hover/btn:bg-gradient-to-tr group-hover/btn:from-blue-600 group-hover/btn:via-blue-500 group-hover/btn:to-cyan-400 group-hover/btn:text-white group-hover/btn:border-transparent group-hover/btn:shadow-md group-hover/btn:shadow-blue-500/35 group-hover/btn:scale-110">
                            <ArrowUpRight className="h-3 w-3 transition-all duration-300 ease-out group-hover/btn:opacity-0 group-hover/btn:scale-50 group-hover/btn:rotate-45" />
                            <DoorOpen className="h-3 w-3 absolute transition-all duration-300 ease-out opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100" />
                          </span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. PAGINATION BAR (Minimalist Bottom Controls - Responsive)
      ───────────────────────────────────────────────────────────── */}
      {filtered.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800">
          <span className="text-center sm:text-left">
            Menampilkan{" "}
            <strong className="text-slate-800 dark:text-white font-mono">{startIndex + 1}</strong> -{" "}
            <strong className="text-slate-800 dark:text-white font-mono">
              {Math.min(startIndex + pageSize, filtered.length)}
            </strong>{" "}
            dari{" "}
            <strong className="text-slate-800 dark:text-white font-mono">{filtered.length}</strong>{" "}
            kelas
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs active:scale-95 transition-all"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs active:scale-95 transition-all"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL RENAME & DELETE ROMBEL (Khusus Tenant Owner)
      ───────────────────────────────────────────────────────────── */}
      {classActionTarget && classActionMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-action-title"
            className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="class-action-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {classActionMode === "rename" ? "Ubah Nama Kelas" : "Hapus Kelas?"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{classActionTarget.nama}</p>
              </div>
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => {
                  setClassActionTarget(null);
                  setClassActionMode(null);
                }}
                className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {classActionMode === "rename" ? (
              <form onSubmit={handleRenameRombel} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="rombel-name"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Nama Kelas
                  </label>
                  <input
                    id="rombel-name"
                    name="nama"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue={classActionTarget.nama}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>
                {classActionError && (
                  <p role="alert" className="text-xs text-rose-700">
                    {classActionError}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={classActionLoading}
                    onClick={() => {
                      setClassActionTarget(null);
                      setClassActionMode(null);
                    }}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={classActionLoading}
                    className="rounded-lg bg-[#2563EB] hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {classActionLoading ? "Menyimpan..." : "Simpan Nama Kelas"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Kelas akan dihapus dari workspace aktif. Riwayat presensi, penilaian, dan
                  pembelajaran tetap tersimpan aman di database.
                </p>
                {classActionError && (
                  <p role="alert" className="text-xs text-rose-700">
                    {classActionError}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={classActionLoading}
                    onClick={() => {
                      setClassActionTarget(null);
                      setClassActionMode(null);
                    }}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={classActionLoading}
                    onClick={handleDeleteRombel}
                    className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {classActionLoading ? "Menghapus..." : "Konfirmasi Hapus"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </motion.div>
  );
}
