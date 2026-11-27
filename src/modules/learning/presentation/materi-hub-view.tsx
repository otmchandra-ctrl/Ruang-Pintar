"use client";

/**
 * Ruang Pintar — Materi Hub View (Academic Glass UI v2.1 - Split Workspace)
 *
 * Menu Mandiri: Materi Pembelajaran (/materi)
 * Tata letak Split Workspace yang ringkas dan fokus untuk guru:
 * - Compact Header Bar: Pemilih kelas/mapel, metrik ringkas 1 baris, dan tombol aksi utama
 * - Sidebar Kiri (Desktop) / Pill Bar (Mobile): Daftar Bab / Lingkup Materi untuk navigasi instan
 * - Panel Kanan: Daftar materi (List View ringkas atau Grid View), TP collapsible, dan filter 1-klik
 * - Modal Pratinjau Lega (max-w-3xl): Nyaman untuk membaca atau menampilkan materi di kelas
 */

import React, { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  BookOpen,
  FolderTree,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Link2,
  AlignLeft,
  Video,
  FolderPlus,
  LayoutList,
  LayoutGrid,
  Layers,
} from "lucide-react";
import {
  TeacherClassCardDTO,
  TeacherClassWorkspaceDTO,
  MateriPembelajaranDTO,
  LingkupMateriDTO,
  TujuanPembelajaranDTO,
} from "../domain/learning-types";
import { Toast, ToastType } from "@/shared/components/ui/toast";
import { CreateMateriModal } from "./create-materi-modal";
import { EditMateriModal } from "./edit-materi-modal";
import { CreateBABModal } from "./create-bab-modal";
import { EditBABModal } from "./edit-bab-modal";
import { CreateTPModal } from "./create-tp-modal";
import { EditTPModal } from "./edit-tp-modal";
import { deleteMateriAction, deleteLingkupMateriAction } from "@/app/actions/learning-actions";

interface MateriHubViewProps {
  classes: TeacherClassCardDTO[];
  selectedPenugasanId: string;
  workspace: TeacherClassWorkspaceDTO;
  canManage: boolean;
  teacherName: string;
  isAdmin: boolean;
}

type MaterialFilterType = "ALL" | "DOKUMEN" | "TAUTAN" | "TEKS" | "VIDEO" | "DRAF";
type MaterialViewMode = "list" | "grid";

export function MateriHubView({
  classes,
  selectedPenugasanId,
  workspace,
  canManage,
  teacherName: _teacherName,
  isAdmin: _isAdmin,
}: MateriHubViewProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isPending, startTransition] = useTransition();

  const { penugasan, lingkup_materi, materi_list } = workspace;

  // -------------------------------------------------------------
  // 1. FILTER, SEARCH, ACTIVE CHAPTER & VIEW MODE
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MaterialFilterType>("ALL");
  const [selectedBabId, setSelectedBabId] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<MaterialViewMode>("list");
  const [expandedTpBabs, setExpandedTpBabs] = useState<Record<string, boolean>>({});

  const toggleTpTray = (babId: string) => {
    setExpandedTpBabs((prev) => ({
      ...prev,
      [babId]: !prev[babId],
    }));
  };

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = materi_list.length;
    const terbit = materi_list.filter((m) => m.is_published || m.status === "PUBLISHED").length;
    const draf = total - terbit;
    const dokumen = materi_list.filter((m) => m.tipe_konten === "DOKUMEN").length;
    const tautan = materi_list.filter((m) => m.tipe_konten === "TAUTAN").length;
    const teks = materi_list.filter((m) => m.tipe_konten === "TEKS").length;
    const video = materi_list.filter((m) => m.tipe_konten === "VIDEO").length;
    const totalBab = lingkup_materi.length;
    return { total, terbit, draf, dokumen, tautan, teks, video, totalBab };
  }, [materi_list, lingkup_materi]);

  // Filter Materi
  const isMaterialMatching = useCallback(
    (m: MateriPembelajaranDTO) => {
      if (typeFilter === "DOKUMEN" && m.tipe_konten !== "DOKUMEN") return false;
      if (typeFilter === "TAUTAN" && m.tipe_konten !== "TAUTAN") return false;
      if (typeFilter === "TEKS" && m.tipe_konten !== "TEKS") return false;
      if (typeFilter === "VIDEO" && m.tipe_konten !== "VIDEO") return false;
      if (typeFilter === "DRAF" && (m.is_published || m.status === "PUBLISHED")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchJudul = m.judul.toLowerCase().includes(q);
        const matchDesc = m.deskripsi && m.deskripsi.toLowerCase().includes(q);
        const matchBab = m.lingkup_materi_judul && m.lingkup_materi_judul.toLowerCase().includes(q);
        return Boolean(matchJudul || matchDesc || matchBab);
      }

      return true;
    },
    [typeFilter, searchQuery]
  );

  // Materi tanpa bab (umum)
  const uncategorizedMaterials = useMemo(() => {
    return materi_list.filter((m) => {
      const hasValidBab = lingkup_materi.some((lm) => lm.id === m.lingkup_materi_id);
      return !hasValidBab && isMaterialMatching(m);
    });
  }, [materi_list, lingkup_materi, isMaterialMatching]);

  // Bab yang ditampilkan pada panel kanan berdasarkan pilihan sidebar
  const visibleBabs = useMemo(() => {
    if (selectedBabId === "ALL") return lingkup_materi;
    if (selectedBabId === "UMUM") return [];
    return lingkup_materi.filter((b) => b.id === selectedBabId);
  }, [lingkup_materi, selectedBabId]);

  const showUncategorized =
    uncategorizedMaterials.length > 0 && (selectedBabId === "ALL" || selectedBabId === "UMUM");

  // -------------------------------------------------------------
  // 2. MODAL STATES
  // -------------------------------------------------------------
  const [viewMateriModalTarget, setViewMateriModalTarget] = useState<MateriPembelajaranDTO | null>(
    null
  );
  const [isCreateMateriOpen, setIsCreateMateriOpen] = useState(false);
  const [initialBabIdForCreate, setInitialBabIdForCreate] = useState<string | undefined>(undefined);
  const [editMateriTarget, setEditMateriTarget] = useState<MateriPembelajaranDTO | null>(null);

  const [isBABModalOpen, setIsBABModalOpen] = useState(false);
  const [editBabTarget, setEditBabTarget] = useState<LingkupMateriDTO | null>(null);
  const [tpModalTarget, setTpModalTarget] = useState<{ id: string; judul: string } | null>(null);
  const [editTpTarget, setEditTpTarget] = useState<{
    tp: TujuanPembelajaranDTO;
    babJudul: string;
  } | null>(null);

  const [deleteMateriTarget, setDeleteMateriTarget] = useState<MateriPembelajaranDTO | null>(null);
  const [deleteBabTarget, setDeleteBabTarget] = useState<LingkupMateriDTO | null>(null);

  const handleDeleteMateri = (materi: MateriPembelajaranDTO) => {
    startTransition(async () => {
      const res = await deleteMateriAction(materi.id, penugasan.id);
      if (res.success) {
        setToast({ message: res.message || "Materi berhasil dihapus.", type: "success" });
        setDeleteMateriTarget(null);
        router.refresh();
      } else {
        setToast({ message: res.message || "Gagal menghapus materi.", type: "error" });
      }
    });
  };

  const handleDeleteBab = (bab: LingkupMateriDTO) => {
    startTransition(async () => {
      const res = await deleteLingkupMateriAction(bab.id, penugasan.id);
      if (res.success) {
        setToast({ message: res.message || "Bab berhasil dihapus.", type: "success" });
        if (selectedBabId === bab.id) {
          setSelectedBabId("ALL");
        }
        setDeleteBabTarget(null);
        router.refresh();
      } else {
        setToast({ message: res.message || "Gagal menghapus bab.", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-4 pb-20 text-slate-900 dark:text-slate-100">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}

      {/* ======================================================== */}
      {/* 1. COMPACT COMMAND BAR (HEADER RINGKAS & BERBOBOT)       */}
      {/* ======================================================== */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-[20px] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Kiri: Judul + Info Kelas + Strip Metrik Ringkas */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Link
                href="/dashboard"
                className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#2563EB] dark:text-blue-400">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Materi Pembelajaran</span>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Bank Materi & Modul Ajar
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {penugasan.rombel_nama} • {penugasan.mata_pelajaran_nama}
              </span>
            </div>

            {/* Strip Metrik Ringkas 1 Baris */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <FolderTree className="h-3 w-3 text-[#2563EB] dark:text-blue-400" />
                <span>{stats.totalBab} Bab Kurikulum</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 whitespace-nowrap">
                <FileText className="h-3 w-3" />
                <span>{stats.total} Total Modul</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                <CheckCircle2 className="h-3 w-3" />
                <span>{stats.terbit} Terbit</span>
              </span>
              {stats.draf > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  <span>{stats.draf} Draf</span>
                </span>
              )}
              <Link
                href={`/kelas-saya/${penugasan.id}`}
                className="inline-flex items-center gap-1 text-[#2563EB] dark:text-blue-400 hover:underline ml-1 whitespace-nowrap"
              >
                <span>Buka Ruang Kelas</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Kanan: Pemilih Kelas & Tombol Aksi Utama */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="relative min-w-[230px] sm:max-w-[280px]">
              <select
                aria-label="Pilih Kelas dan Mata Pelajaran"
                value={selectedPenugasanId}
                onChange={(e) => router.push(`/materi?penugasanId=${e.target.value}`)}
                className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer truncate"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.rombel_nama}] {c.mata_pelajaran_nama} ({c.mata_pelajaran_kode})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBABModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" />
                  <span>Buat Bab</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInitialBabIdForCreate(
                      selectedBabId !== "ALL" && selectedBabId !== "UMUM"
                        ? selectedBabId
                        : undefined
                    );
                    setIsCreateMateriOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Materi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SPLIT WORKSPACE: OUTLINE BAB (KIRI) + MATERI (KANAN)  */}
      {/* ======================================================== */}
      {lingkup_materi.length === 0 && materi_list.length === 0 ? (
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <FolderTree className="h-9 w-9 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Struktur Bab / Lingkup Materi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Mulai atur bahan ajar dengan membuat Bab terlebih dahulu agar modul pembelajaran dan
            capaian TP tersusun rapi.
          </p>
          {canManage && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsBABModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Bab Pertama Sekarang</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ------------------------------------------------------ */}
          {/* PANEL KIRI: DAFTAR BAB / OUTLINE KURIKULUM             */}
          {/* ------------------------------------------------------ */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-4 space-y-2">
            {/* Mobile Horizontal Pill Strip */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedBabId("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBabId === "ALL"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                Semua Bab ({stats.total})
              </button>
              {lingkup_materi.map((bab) => {
                const count = materi_list.filter((m) => m.lingkup_materi_id === bab.id).length;
                return (
                  <button
                    key={bab.id}
                    type="button"
                    onClick={() => setSelectedBabId(bab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedBabId === bab.id
                        ? "bg-[#2563EB] text-white font-bold shadow-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {bab.kode || "BAB"} ({count})
                  </button>
                );
              })}
            </div>

            {/* Desktop Sidebar Card */}
            <div className="hidden lg:block rounded-2xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs space-y-1.5">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Daftar Bab ({lingkup_materi.length})
                </span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsBABModalOpen(true)}
                    className="text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + Bab
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBabId("ALL")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                  selectedBabId === "ALL"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/60"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-semibold border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Semua Bab</span>
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {stats.total}
                </span>
              </button>

              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-0.5">
                {lingkup_materi.map((bab) => {
                  const babCount = materi_list.filter((m) => m.lingkup_materi_id === bab.id).length;
                  const isActive = selectedBabId === bab.id;
                  return (
                    <button
                      key={bab.id}
                      type="button"
                      onClick={() => setSelectedBabId(bab.id)}
                      className={`w-full flex items-start justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75 block">
                          {bab.kode || "BAB"}
                        </span>
                        <span
                          className={`text-xs block truncate ${isActive ? "font-bold" : "font-semibold"}`}
                        >
                          {bab.judul}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                        {babCount}
                      </span>
                    </button>
                  );
                })}

                {uncategorizedMaterials.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBabId("UMUM")}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      selectedBabId === "UMUM"
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/60"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium border border-transparent"
                    }`}
                  >
                    <span className="truncate">Materi Umum</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {uncategorizedMaterials.length}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* ------------------------------------------------------ */}
          {/* PANEL KANAN: TOOLBAR FILTER + DAFTAR MATERI            */}
          {/* ------------------------------------------------------ */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Search, Filter Tipe & Switch List/Grid */}
            <div className="rounded-2xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari materi, bab, topik, atau dokumen..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle (List vs Grid) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    }`}
                    title="Tampilan Daftar Ringkas"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Daftar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                    }`}
                    title="Tampilan Kartu Grid"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Kartu</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { key: "ALL", label: `Semua (${stats.total})` },
                    { key: "DOKUMEN", label: `Dokumen (${stats.dokumen})` },
                    { key: "TAUTAN", label: `Tautan (${stats.tautan})` },
                    { key: "TEKS", label: `Teks (${stats.teks})` },
                    ...(stats.video > 0 ? [{ key: "VIDEO", label: `Video (${stats.video})` }] : []),
                    ...(stats.draf > 0 ? [{ key: "DRAF", label: `Draf (${stats.draf})` }] : []),
                  ] as Array<{ key: MaterialFilterType; label: string }>
                ).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setTypeFilter(pill.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === pill.key
                        ? "bg-[#2563EB] text-white shadow-2xs"
                        : "bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daftar Bab & Materi */}
            <div className="space-y-4">
              {visibleBabs.map((bab) => {
                const babMaterials = materi_list.filter(
                  (m) => m.lingkup_materi_id === bab.id && isMaterialMatching(m)
                );

                if (searchQuery.trim() && babMaterials.length === 0) {
                  const q = searchQuery.toLowerCase().trim();
                  const matchBab =
                    bab.judul.toLowerCase().includes(q) ||
                    (bab.deskripsi && bab.deskripsi.toLowerCase().includes(q));
                  if (!matchBab) return null;
                }

                const tpList = bab.tujuan_pembelajaran || [];
                const isTpExpanded =
                  expandedTpBabs[bab.id] ?? (selectedBabId === bab.id || tpList.length <= 2);

                return (
                  <section
                    key={bab.id}
                    className="rounded-2xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5"
                  >
                    {/* Header Bab */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400">
                            {bab.kode || "BAB"}
                          </span>
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            {bab.judul}
                          </h2>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            ({babMaterials.length} Modul • {tpList.length} TP)
                          </span>
                        </div>
                        {bab.deskripsi && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {bab.deskripsi}
                          </p>
                        )}
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setInitialBabIdForCreate(bab.id);
                              setIsCreateMateriOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Materi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTpModalTarget({ id: bab.id, judul: bab.judul })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                            title="Tambah Tujuan Pembelajaran (TP)"
                          >
                            <Plus className="h-3 w-3" />
                            <span>TP</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditBabTarget(bab)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Bab"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteBabTarget(bab)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Bab"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tujuan Pembelajaran (TP) Ringkas & Dapat Dilipat */}
                    {tpList.length > 0 && (
                      <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleTpTray(bab.id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                        >
                          <span>Tujuan Pembelajaran ({tpList.length} TP)</span>
                          {isTpExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {isTpExpanded && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-2">
                            {tpList.map((tp) => (
                              <span
                                key={tp.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                              >
                                <strong className="font-mono text-[#2563EB] dark:text-blue-400">
                                  {tp.kode || "TP"}
                                </strong>
                                <span>{tp.deskripsi}</span>
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => setEditTpTarget({ tp, babJudul: bab.judul })}
                                    className="text-slate-400 hover:text-[#2563EB] p-0.5 transition-colors cursor-pointer"
                                    title="Edit TP"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Daftar Materi Pembelajaran */}
                    {babMaterials.length === 0 ? (
                      <div className="py-6 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Belum ada materi yang cocok pada bab ini.
                        </p>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setInitialBabIdForCreate(bab.id);
                              setIsCreateMateriOpen(true);
                            }}
                            className="text-xs font-bold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Materi di Bab Ini</span>
                          </button>
                        )}
                      </div>
                    ) : viewMode === "list" ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden">
                        {babMaterials.map((m) => (
                          <MaterialRowItem
                            key={m.id}
                            materi={m}
                            canManage={canManage}
                            onView={() => setViewMateriModalTarget(m)}
                            onEdit={() => setEditMateriTarget(m)}
                            onDelete={() => setDeleteMateriTarget(m)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {babMaterials.map((m) => (
                          <MaterialCard
                            key={m.id}
                            materi={m}
                            canManage={canManage}
                            onView={() => setViewMateriModalTarget(m)}
                            onEdit={() => setEditMateriTarget(m)}
                            onDelete={() => setDeleteMateriTarget(m)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {showUncategorized && (
                <section className="rounded-2xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      UMUM
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Materi Umum & Referensi Tambahan
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({uncategorizedMaterials.length} Modul)
                    </span>
                  </div>

                  {viewMode === "list" ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden">
                      {uncategorizedMaterials.map((m) => (
                        <MaterialRowItem
                          key={m.id}
                          materi={m}
                          canManage={canManage}
                          onView={() => setViewMateriModalTarget(m)}
                          onEdit={() => setEditMateriTarget(m)}
                          onDelete={() => setDeleteMateriTarget(m)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {uncategorizedMaterials.map((m) => (
                        <MaterialCard
                          key={m.id}
                          materi={m}
                          canManage={canManage}
                          onView={() => setViewMateriModalTarget(m)}
                          onEdit={() => setEditMateriTarget(m)}
                          onDelete={() => setDeleteMateriTarget(m)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PREVIEW / BACA MATERI (LEBIH LEGA: max-w-3xl)   */}
      {/* ======================================================== */}
      {viewMateriModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider block">
                  {viewMateriModalTarget.tipe_konten} •{" "}
                  {viewMateriModalTarget.lingkup_materi_judul || "Materi Umum"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewMateriModalTarget.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewMateriModalTarget(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {viewMateriModalTarget.deskripsi && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1 text-xs">
                    Deskripsi Ringkas:
                  </span>
                  <p className="leading-relaxed max-w-[65ch]">{viewMateriModalTarget.deskripsi}</p>
                </div>
              )}

              {viewMateriModalTarget.konten_teks && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                    Isi Konten Materi:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-w-[65ch]">
                    {viewMateriModalTarget.konten_teks}
                  </div>
                </div>
              )}

              {viewMateriModalTarget.tautan_url && (
                <a
                  href={viewMateriModalTarget.tautan_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-[#2563EB] dark:text-blue-400 font-semibold hover:underline text-xs sm:text-sm"
                >
                  <span>Buka Tautan Pembelajaran Eksternal</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {viewMateriModalTarget.berkas_id && (
                <a
                  href={`/api/berkas/${viewMateriModalTarget.berkas_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-[#2563EB] dark:text-blue-400 font-semibold hover:underline text-xs sm:text-sm"
                >
                  <span>Unduh / Buka Dokumen Modul Terlampir</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    const t = viewMateriModalTarget;
                    setViewMateriModalTarget(null);
                    setEditMateriTarget(t);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Edit Materi
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMateriModalTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ml-auto cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: KONFIRMASI HAPUS MATERI                        */}
      {/* ======================================================== */}
      {deleteMateriTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hapus Materi Pembelajaran?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Materi <strong>&ldquo;{deleteMateriTarget.judul}&rdquo;</strong> akan dihapus
                  permanen dari kelas ini. Tindakan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteMateriTarget(null)}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMateri(deleteMateriTarget)}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shadow-rose-500/20"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Materi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS BAB (LINGKUP MATERI)          */}
      {/* ======================================================== */}
      {deleteBabTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hapus Bab / Lingkup Materi?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Bab <strong>&ldquo;{deleteBabTarget.judul}&rdquo;</strong> beserta seluruh Tujuan
                  Pembelajaran (TP) di dalamnya akan dihapus permanen.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteBabTarget(null)}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBab(deleteBabTarget)}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shadow-rose-500/20"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Bab"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODALS PENDAFTARAN (MATERI, BAB, TP)                 */}
      {/* ======================================================== */}
      <CreateMateriModal
        penugasanId={penugasan.id}
        guruId={penugasan.guru_id}
        mapelId={penugasan.mata_pelajaran_id}
        lingkupMateriList={lingkup_materi}
        initialBabId={initialBabIdForCreate}
        isOpen={isCreateMateriOpen}
        onClose={() => {
          setIsCreateMateriOpen(false);
          setInitialBabIdForCreate(undefined);
        }}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <EditMateriModal
        penugasanId={penugasan.id}
        materi={editMateriTarget}
        lingkupMateriList={lingkup_materi}
        isOpen={!!editMateriTarget}
        onClose={() => setEditMateriTarget(null)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <CreateBABModal
        penugasanId={penugasan.id}
        isOpen={isBABModalOpen}
        onClose={() => setIsBABModalOpen(false)}
        nextUrutan={lingkup_materi.length + 1}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <EditBABModal
        penugasanId={penugasan.id}
        bab={editBabTarget}
        isOpen={!!editBabTarget}
        onClose={() => setEditBabTarget(null)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {tpModalTarget && (
        <CreateTPModal
          penugasanId={penugasan.id}
          lingkupMateriId={tpModalTarget.id}
          babJudul={tpModalTarget.judul}
          isOpen={true}
          onClose={() => setTpModalTarget(null)}
          nextUrutan={
            (lingkup_materi.find((lm) => lm.id === tpModalTarget.id)?.tujuan_pembelajaran.length ||
              0) + 1
          }
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            router.refresh();
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {editTpTarget && (
        <EditTPModal
          penugasanId={penugasan.id}
          babJudul={editTpTarget.babJudul || ""}
          tp={editTpTarget.tp}
          isOpen={true}
          onClose={() => setEditTpTarget(null)}
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            router.refresh();
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}
    </div>
  );
}

function getContentTypeMeta(tipeKonten: string) {
  switch (tipeKonten) {
    case "TAUTAN":
      return {
        icon: <Link2 className="h-4 w-4" />,
        label: "Tautan",
        badgeClass:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800",
      };
    case "TEKS":
      return {
        icon: <AlignLeft className="h-4 w-4" />,
        label: "Teks Bacaan",
        badgeClass:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800",
      };
    case "VIDEO":
      return {
        icon: <Video className="h-4 w-4" />,
        label: "Video",
        badgeClass:
          "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800",
      };
    case "DOKUMEN":
    default:
      return {
        icon: <FileText className="h-4 w-4" />,
        label: "Dokumen",
        badgeClass:
          "bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800",
      };
  }
}

interface MaterialItemProps {
  materi: MateriPembelajaranDTO;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MaterialRowItem({ materi, canManage, onView, onEdit, onDelete }: MaterialItemProps) {
  const isPublished = materi.is_published || materi.status === "PUBLISHED";
  const dateStr = new Date(materi.updated_at || materi.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const typeMeta = getContentTypeMeta(materi.tipe_konten);

  return (
    <div
      onClick={onView}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${typeMeta.badgeClass}`}>
          {typeMeta.icon}
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors truncate">
              {materi.judul}
            </h4>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap ${
                isPublished
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {isPublished ? "TERBIT" : "DRAF"}
            </span>
          </div>
          {materi.deskripsi && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {materi.deskripsi}
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span>{typeMeta.label}</span>
            <span>•</span>
            <span>Diperbarui {dateStr}</span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-1 self-end sm:self-center shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          title="Lihat Materi"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Lihat</span>
        </button>

        {canManage && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit Materi"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Materi"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MaterialCard({ materi, canManage, onView, onEdit, onDelete }: MaterialItemProps) {
  const isPublished = materi.is_published || materi.status === "PUBLISHED";
  const dateStr = new Date(materi.updated_at || materi.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const typeConfig = getContentTypeMeta(materi.tipe_konten);

  return (
    <div
      onClick={onView}
      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs cursor-pointer group flex flex-col justify-between gap-3"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold border ${typeConfig.badgeClass}`}
          >
            {typeConfig.icon}
            <span>{typeConfig.label}</span>
          </span>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
              isPublished
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {isPublished ? "TERBIT" : "DRAF"}
          </span>
        </div>

        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {materi.judul}
        </h4>

        {materi.deskripsi && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {materi.deskripsi}
          </p>
        )}
      </div>

      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="truncate">Diperbarui {dateStr}</span>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            title="Lihat Materi"
          >
            <Eye className="h-3 w-3" />
            <span>Lihat</span>
          </button>

          {canManage && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="p-1 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Materi"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Hapus Materi"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
