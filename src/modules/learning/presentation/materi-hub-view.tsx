"use client";

/**
 * Ruang Pintar — Materi Hub View (Academic Glass UI v2.0 - Chapter-Centric Workspace)
 *
 * Menu Mandiri: Materi Pembelajaran (/materi)
 * Menata materi secara terstruktur per Bab / Lingkup Materi Kurikulum Merdeka:
 * - Header Cockpit Terpadu: Ringkasan metrik real-time & pemilih kelas
 * - Filter Cepat 1-Klik: Semua, Dokumen, Tautan, Teks, Draf
 * - Chapter Cards (Bab): Akordeon lapang berisi tujuan pembelajaran (TP) dan modul bahan ajar
 * - Rich Resource Cards: Kartu materi digital modern dengan indikator tipe konten, status terbit, dan aksi kilat
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
  Sparkles,
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
  // 1. FILTER & SEARCH
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MaterialFilterType>("ALL");
  const [collapsedBabs, setCollapsedBabs] = useState<Record<string, boolean>>({});

  const toggleBabCollapse = (babId: string) => {
    setCollapsedBabs((prev) => ({
      ...prev,
      [babId]: !prev[babId],
    }));
  };

  const expandAll = () => setCollapsedBabs({});
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    lingkup_materi.forEach((b) => {
      next[b.id] = true;
    });
    setCollapsedBabs(next);
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
      // 1. Filter Tipe / Status
      if (typeFilter === "DOKUMEN" && m.tipe_konten !== "DOKUMEN") return false;
      if (typeFilter === "TAUTAN" && m.tipe_konten !== "TAUTAN") return false;
      if (typeFilter === "TEKS" && m.tipe_konten !== "TEKS") return false;
      if (typeFilter === "VIDEO" && m.tipe_konten !== "VIDEO") return false;
      if (typeFilter === "DRAF" && (m.is_published || m.status === "PUBLISHED")) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchJudul = m.judul.toLowerCase().includes(q);
        const matchDesc = m.deskripsi && m.deskripsi.toLowerCase().includes(q);
        const matchBab = m.lingkup_materi_judul && m.lingkup_materi_judul.toLowerCase().includes(q);
        return matchJudul || matchDesc || matchBab;
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

  // -------------------------------------------------------------
  // 2. MODAL STATES
  // -------------------------------------------------------------
  const [viewMateriModalTarget, setViewMateriModalTarget] = useState<MateriPembelajaranDTO | null>(
    null
  );
  const [isCreateMateriOpen, setIsCreateMateriOpen] = useState(false);
  const [initialBabIdForCreate, setInitialBabIdForCreate] = useState<string | undefined>(undefined);
  const [editMateriTarget, setEditMateriTarget] = useState<MateriPembelajaranDTO | null>(null);

  // Modals BAB & TP
  const [isBABModalOpen, setIsBABModalOpen] = useState(false);
  const [editBabTarget, setEditBabTarget] = useState<LingkupMateriDTO | null>(null);
  const [tpModalTarget, setTpModalTarget] = useState<{ id: string; judul: string } | null>(null);
  const [editTpTarget, setEditTpTarget] = useState<{
    tp: TujuanPembelajaranDTO;
    babJudul: string;
  } | null>(null);

  // Confirmations
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
        setDeleteBabTarget(null);
        router.refresh();
      } else {
        setToast({ message: res.message || "Gagal menghapus bab.", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-6 pb-24 text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}

      {/* ======================================================== */}
      {/* 1A. HERO COCKPIT: MATERI PEMBELAJARAN (DESKTOP / TABLET) */}
      {/* ======================================================== */}
      <div className="hidden md:flex rounded-[28px] sm:rounded-[32px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard"
              className="hover:text-blue-600 dark:hover:text-blue-400 text-xs font-mono text-slate-500 dark:text-slate-400 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-slate-300 dark:text-slate-600 text-xs">/</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-200/80 dark:border-blue-900/50">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Materi Pembelajaran</span>
            </span>
          </div>

          <div>
            <h1 className="font-mono text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Bank Materi & Modul Ajar</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pusat bahan ajar terstruktur per Bab dan Tujuan Pembelajaran Kurikulum Merdeka untuk{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {penugasan.rombel_nama}
              </strong>{" "}
              • {penugasan.mata_pelajaran_nama}.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-2 pt-1 flex-wrap font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
              <FolderTree className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{stats.totalBab} Bab Kurikulum</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/50 text-[#2563EB] dark:text-blue-300 font-bold shadow-2xs">
              <FileText className="h-3.5 w-3.5" />
              <span>{stats.total} Total Modul</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{stats.terbit} Terbit</span>
            </span>
            {stats.draf > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold shadow-2xs">
                <Clock className="h-3.5 w-3.5" />
                <span>{stats.draf} Draf</span>
              </span>
            )}
          </div>
        </div>

        {/* 3D Astronaut Illustration: Konsep A (The Floating Book Scholar) */}
        <div className="hidden xl:flex items-center justify-center shrink-0 -my-4 pointer-events-none select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/illustrations/astronaut-floating-books-3d.png"
            alt="The Floating Book Scholar - Astronaut Belajar Modul 3D"
            className="w-40 h-40 lg:w-48 lg:h-48 object-contain drop-shadow-[0_12px_24px_rgba(37,99,235,0.18)] hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Pemilih Kelas & Header Action */}
        <div className="z-10 flex flex-col sm:items-end gap-3 shrink-0">
          <div className="space-y-1 sm:text-right">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              PILIH KELAS & MATA PELAJARAN
            </label>
            <div className="relative min-w-[280px]">
              <select
                value={selectedPenugasanId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  router.push(`/materi?penugasanId=${nextId}`);
                }}
                className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.rombel_nama}] {c.mata_pelajaran_nama} ({c.mata_pelajaran_kode})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center sm:justify-end gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>
                Pengampu:{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {penugasan.guru_nama}
                </strong>
              </span>
              <span>•</span>
              <Link
                href={`/kelas-saya/${penugasan.id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Ruang Kelas</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => setIsBABModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <FolderPlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Buat Bab</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInitialBabIdForCreate(undefined);
                  setIsCreateMateriOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Materi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1B. COMPACT MOBILE BAR (MOBILE ONLY - HEMAT RUANG LAYAR) */}
      {/* ======================================================== */}
      <div className="md:hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-[20px] border border-white/80 dark:border-white/10 p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Mobile Class Selector */}
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedPenugasanId}
              onChange={(e) => {
                const nextId = e.target.value;
                router.push(`/materi?penugasanId=${nextId}`);
              }}
              className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 truncate"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.rombel_nama}] {c.mata_pelajaran_nama}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Quick Mobile Action Buttons */}
          {canManage && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsBABModalOpen(true)}
                className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Buat Bab"
              >
                <FolderPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInitialBabIdForCreate(undefined);
                  setIsCreateMateriOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Materi</span>
              </button>
            </div>
          )}
        </div>

        {/* Info Guru & Rombel Ringkas */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
          <span className="truncate">
            {penugasan.rombel_nama} • {stats.total} Modul ({stats.terbit} Terbit)
          </span>
          <Link
            href={`/kelas-saya/${penugasan.id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline shrink-0 font-medium ml-2"
          >
            Ruang Kelas →
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOOLBAR: PENCARIAN & FILTER CEPAT                   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input dengan Clear Button */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi, bab, topik, atau dokumen..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
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
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "ALL"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("DOKUMEN")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "DOKUMEN"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Dokumen ({stats.dokumen})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("TAUTAN")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "TAUTAN"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Tautan ({stats.tautan})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("TEKS")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "TEKS"
                ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                : "bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
            }`}
          >
            Teks ({stats.teks})
          </button>
          {stats.draf > 0 && (
            <button
              type="button"
              onClick={() => setTypeFilter("DRAF")}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === "DRAF"
                  ? "bg-[#2563EB] text-white font-bold shadow-xs shadow-blue-500/20"
                  : "bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-semibold"
              }`}
            >
              Draf ({stats.draf})
            </button>
          )}

          {/* Toggle Expand / Collapse All */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-1 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
            >
              Buka Semua
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2 py-1 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. CHAPTER-CENTRIC WORKSPACE: DAFTAR BAB & MATERI       */}
      {/* ======================================================== */}
      {lingkup_materi.length === 0 ? (
        <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <FolderTree className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Struktur Bab / Lingkup Materi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Mulai atur bahan ajar dengan membuat Bab terlebih dahulu agar modul pembelajaran dan
            capaian TP tersusun rapi.
          </p>
          {canManage && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsBABModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Bab Pertama Sekarang</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {lingkup_materi.map((bab) => {
            const babMaterials = materi_list.filter(
              (m) => m.lingkup_materi_id === bab.id && isMaterialMatching(m)
            );
            const isCollapsed = Boolean(collapsedBabs[bab.id]);

            // Jika sedang ada pencarian dan bab ini tidak punya materi yang cocok, sembunyikan jika nama bab juga tidak cocok
            if (searchQuery.trim() && babMaterials.length === 0) {
              const q = searchQuery.toLowerCase().trim();
              const matchBab =
                bab.judul.toLowerCase().includes(q) ||
                (bab.deskripsi && bab.deskripsi.toLowerCase().includes(q));
              if (!matchBab) return null;
            }

            return (
              <div
                key={bab.id}
                className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-4 relative overflow-hidden transition-all"
              >
                {/* Header Bab */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900 shrink-0">
                      {bab.kode || "BAB"}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                      {bab.judul}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0">
                      ({babMaterials.length} Modul • {bab.tujuan_pembelajaran?.length || 0} TP)
                    </span>
                  </div>

                  {/* Aksi Baris Bab */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setInitialBabIdForCreate(bab.id);
                            setIsCreateMateriOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Materi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTpModalTarget({ id: bab.id, judul: bab.judul })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                          title="Tambah Tujuan Pembelajaran (TP)"
                        >
                          <Plus className="h-3 w-3" />
                          <span>TP</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditBabTarget(bab)}
                          className="p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Bab"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteBabTarget(bab)}
                          className="p-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus Bab"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleBabCollapse(bab.id)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                      title={isCollapsed ? "Buka Materi Bab" : "Tutup Materi Bab"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Konten Bab (Jika tidak dilipat) */}
                {!isCollapsed && (
                  <div className="space-y-4">
                    {bab.deskripsi && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed -mt-1">
                        {bab.deskripsi}
                      </p>
                    )}

                    {/* Tujuan Pembelajaran (TP) Inline Tray */}
                    {bab.tujuan_pembelajaran && bab.tujuan_pembelajaran.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono flex items-center justify-between">
                          <span>TUJUAN PEMBELAJARAN (TP) KURIKULUM MERDEKA:</span>
                          <span className="font-semibold">{bab.tujuan_pembelajaran.length} TP</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {bab.tujuan_pembelajaran.map((tp) => (
                            <span
                              key={tp.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-2xs group"
                            >
                              <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                                {tp.kode || "TP"}
                              </strong>
                              <span>{tp.deskripsi}</span>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => setEditTpTarget({ tp, babJudul: bab.judul })}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 ml-1 transition-colors cursor-pointer"
                                  title="Edit TP"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Daftar Kartu Materi Pembelajaran di Bab Ini */}
                    {babMaterials.length === 0 ? (
                      <div className="py-7 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/20 space-y-2">
                        <FileText className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Belum ada bahan ajar atau modul di bab ini.
                        </p>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setInitialBabIdForCreate(bab.id);
                              setIsCreateMateriOpen(true);
                            }}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Unggah Modul / Tambah Materi Pertama</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                  </div>
                )}
              </div>
            );
          })}

          {/* Seksi Materi Umum / Tanpa Bab (Jika Ada) */}
          {uncategorizedMaterials.length > 0 && (
            <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    UMUM
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Materi Umum & Referensi Tambahan
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    ({uncategorizedMaterials.length} Modul)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PREVIEW / BACA MATERI                          */}
      {/* ======================================================== */}
      {viewMateriModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  {viewMateriModalTarget.tipe_konten} •{" "}
                  {viewMateriModalTarget.lingkup_materi_judul || "Materi Umum"}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
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

            <div className="overflow-y-auto flex-1 space-y-3 text-xs text-slate-700 dark:text-slate-300">
              {viewMateriModalTarget.deskripsi && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Deskripsi Ringkas:
                  </span>
                  <p className="leading-relaxed">{viewMateriModalTarget.deskripsi}</p>
                </div>
              )}

              {viewMateriModalTarget.konten_teks && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Isi Konten Materi:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {viewMateriModalTarget.konten_teks}
                  </div>
                </div>
              )}

              {viewMateriModalTarget.tautan_url && (
                <a
                  href={viewMateriModalTarget.tautan_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
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
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-[#2563EB] dark:text-blue-400 font-semibold hover:underline"
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
                  className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-semibold transition-colors cursor-pointer"
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

// -----------------------------------------------------------------
// SUB-KOMPONEN: RICH RESOURCE CARD
// -----------------------------------------------------------------
interface MaterialCardProps {
  materi: MateriPembelajaranDTO;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MaterialCard({ materi, canManage, onView, onEdit, onDelete }: MaterialCardProps) {
  const isPublished = materi.is_published || materi.status === "PUBLISHED";
  const dateStr = new Date(materi.updated_at || materi.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Tipe Konten Icon & Theme
  const typeConfig = useMemo(() => {
    switch (materi.tipe_konten) {
      case "TAUTAN":
        return {
          icon: <Link2 className="h-4 w-4" />,
          label: "Tautan",
          bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800",
        };
      case "TEKS":
        return {
          icon: <AlignLeft className="h-4 w-4" />,
          label: "Teks Bacaan",
          bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800",
        };
      case "VIDEO":
        return {
          icon: <Video className="h-4 w-4" />,
          label: "Video",
          bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800",
        };
      case "DOKUMEN":
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          label: "Dokumen",
          bg: "bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800",
        };
    }
  }, [materi.tipe_konten]);

  return (
    <div
      onClick={onView}
      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs hover:shadow-md cursor-pointer group flex flex-col justify-between gap-3 relative"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-mono font-bold border ${typeConfig.bg}`}
          >
            {typeConfig.icon}
            <span>{typeConfig.label}</span>
          </span>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              isPublished
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isPublished ? "TERBIT" : "DRAF"}
          </span>
        </div>

        {/* Title & Description */}
        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {materi.judul}
        </h4>

        {materi.deskripsi && (
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {materi.deskripsi}
          </p>
        )}
      </div>

      {/* Bottom Footer Info & Action Buttons */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="truncate">Diperbarui {dateStr}</span>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer"
            title="Lihat Materi"
          >
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Lihat</span>
          </button>

          {canManage && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
