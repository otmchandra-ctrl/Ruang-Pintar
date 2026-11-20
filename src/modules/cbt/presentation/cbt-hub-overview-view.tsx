"use client";

/**
 * Ruang Pintar — CBT Hub Overview View (Academic Glass UI v1.2)
 *
 * Mengusung Harmoni Desain 1:1 dengan Dashboard Guru:
 * - Desktop View (>=768px): Maskot 3D Astronot Ujian (Papan Ujian, Pensil, Penggaris, Kertas Melayang) Pop-out
 * - Mobile View (<768px): Banner tersembunyi, Mobile Compact Header tampil
 * - Kolom Kiri (8/12): Desktop Banner CBT + Workspace Utama
 * - Kolom Kanan (4/12 Desktop, Tampil Paling Atas di Mobile): Card "Perlu Tindakan" (Padanan "Jadwal Mengajar")
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  Plus,
  Layers,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowRight,
  FileEdit,
  Radio,
  Search,
  Printer,
  FileText,
  X,
  ExternalLink,
  StopCircle,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Folder,
  FolderArchive,
  SlidersHorizontal,
} from "lucide-react";
import { QuestionBankModal } from "./question-bank-modal";
import { CreateExamModal } from "./create-exam-modal";
import { EditExamSettingsModal } from "./edit-exam-settings-modal";
import { ActiveExamQuestionModal } from "./active-exam-question-modal";
import { finishExamAction } from "@/app/actions/cbt-actions";

export interface TeacherCbtExamItem {
  id: string;
  judul: string;
  deskripsi?: string | null;
  durasi_menit: number;
  status: string;
  total_peserta: number;
  total_selesai: number;
  total_sedang_mengerjakan?: number;
  total_soal?: number | null;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  created_at?: string;
  asesmen_id?: string | null;
  rata_rata: number | null;
  gunakan_token?: boolean;
  token_masuk?: string | null;
  total_perlu_koreksi?: number;
  kkm_kktp?: number;
  acak_soal?: boolean;
  acak_opsi?: boolean;
  tampilkan_nilai?: boolean;
  tampilkan_pembahasan?: boolean;
}

export interface TeacherCbtClassItem {
  penugasan_id: string;
  rombel_id: string;
  rombel_nama: string;
  mata_pelajaran_id: string;
  mata_pelajaran_nama: string;
  guru_nama: string;
  total_ujian: number;
  total_published: number;
  total_draft: number;
  total_selesai: number;
  exams: TeacherCbtExamItem[];
}

export type TeacherCbtFlatExamItem = TeacherCbtExamItem & {
  rombel_nama: string;
  rombel_id: string;
  mata_pelajaran_nama: string;
  penugasan_id: string;
};

export interface StudentCbtExamItem {
  id: string;
  judul: string;
  deskripsi?: string | null;
  durasi_menit: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_ujian: string;
  mata_pelajaran_nama: string;
  guru_nama: string;
  rombel_nama: string;
  gunakan_token?: boolean;
  attempt_status?: "BELUM_DIKERJAKAN" | "SEDANG_DIKERJAKAN" | "SELESAI" | "TERKUNCI";
  attempt_id?: string;
  nilai_akhir?: number | null;
}

export interface CbtBankSoalFolderItem {
  mapel_id: string;
  mapel_nama: string;
  mapel_kode?: string;
  total_soal: number;
}

export interface CbtHubOverviewViewProps {
  role: "TEACHER" | "SUPER_ADMIN" | "STUDENT";
  sekolahId: string;
  teacherClasses?: TeacherCbtClassItem[];
  studentExams?: StudentCbtExamItem[];
  isSuperAdmin?: boolean;
  bankSoalCount?: number;
  bankSoalFolders?: CbtBankSoalFolderItem[];
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return `${d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}, ${d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "-";
  }
}

export function CbtHubOverviewView({
  role,
  sekolahId,
  teacherClasses = [],
  studentExams = [],
  isSuperAdmin = false,
  bankSoalCount = 0,
  bankSoalFolders = [],
}: CbtHubOverviewViewProps) {
  const isTeacherOrAdmin = role === "TEACHER" || role === "SUPER_ADMIN";
  const router = useRouter();

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankModalMapelId, setBankModalMapelId] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // States untuk Folder Bank Soal Berdasarkan Mapel
  const [folderSearchQuery, setFolderSearchQuery] = useState("");

  // States untuk Cockpit Ujian Sedang Berlangsung & Modal Akhiri Ujian
  const [examToEnd, setExamToEnd] = useState<TeacherCbtFlatExamItem | null>(null);
  const [examToEdit, setExamToEdit] = useState<TeacherCbtFlatExamItem | null>(null);
  const [activeExamToEditId, setActiveExamToEditId] = useState<string | null>(null);
  const [isEndingExam, setIsEndingExam] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // States untuk Filter & Pencarian Daftar Ujian CBT
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT" | "COMPLETED">("ALL");

  // Agregasi Folder Bank Soal Berdasarkan Mata Pelajaran (dengan fallback dari teacherClasses)
  const resolvedFolders = useMemo<CbtBankSoalFolderItem[]>(() => {
    if (bankSoalFolders && bankSoalFolders.length > 0) {
      return bankSoalFolders;
    }
    const map = new Map<string, CbtBankSoalFolderItem>();
    for (const c of teacherClasses) {
      if (!map.has(c.mata_pelajaran_id)) {
        map.set(c.mata_pelajaran_id, {
          mapel_id: c.mata_pelajaran_id,
          mapel_nama: c.mata_pelajaran_nama,
          mapel_kode: "",
          total_soal: 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.mapel_nama.localeCompare(b.mapel_nama));
  }, [bankSoalFolders, teacherClasses]);

  // Filter folder mapel berdasarkan query pencarian
  const filteredFolders = useMemo(() => {
    if (!folderSearchQuery.trim()) return resolvedFolders;
    const q = folderSearchQuery.toLowerCase();
    return resolvedFolders.filter(
      (f) =>
        f.mapel_nama.toLowerCase().includes(q) ||
        (f.mapel_kode && f.mapel_kode.toLowerCase().includes(q))
    );
  }, [resolvedFolders, folderSearchQuery]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard?.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleFinishExam = async () => {
    if (!examToEnd) return;
    setIsEndingExam(true);
    try {
      const res = await finishExamAction(examToEnd.id, examToEnd.penugasan_id);
      if (res.success) {
        showToast(res.message, "success");
        setExamToEnd(null);
        router.refresh();
      } else {
        showToast(res.message || "Gagal mengakhiri ujian.", "error");
      }
    } catch {
      showToast("Terjadi kendala jaringan saat mengakhiri ujian.", "error");
    } finally {
      setIsEndingExam(false);
    }
  };

  // Flat array seluruh ujian guru untuk kalkulasi informasi
  const allTeacherExams = useMemo<TeacherCbtFlatExamItem[]>(() => {
    return teacherClasses.flatMap((c) =>
      c.exams.map((e) => ({
        ...e,
        rombel_nama: c.rombel_nama,
        rombel_id: c.rombel_id,
        mata_pelajaran_nama: c.mata_pelajaran_nama,
        penugasan_id: c.penugasan_id,
      }))
    );
  }, [teacherClasses]);

  // Statistik untuk 4 Card Informasi (Draft, Aktif, Selesai, Bank Soal)
  const stats = useMemo(() => {
    let draft = 0;
    let aktif = 0;
    let selesai = 0;

    for (const e of allTeacherExams) {
      if (e.status === "DRAFT") {
        draft++;
      } else if (
        e.status === "PUBLISHED" ||
        e.status === "DIPUBLIKASI" ||
        e.status === "DITERBITKAN" ||
        e.status === "BERLANGSUNG" ||
        e.status === "ACTIVE"
      ) {
        aktif++;
      } else if (e.status === "SELESAI") {
        selesai++;
      }
    }

    return { draft, aktif, selesai, total: allTeacherExams.length };
  }, [allTeacherExams]);

  // Ujian yang Sedang Berlangsung / Aktif (Live Cockpit Cards)
  const activeExams = useMemo(() => {
    return allTeacherExams.filter(
      (e) =>
        e.status === "PUBLISHED" ||
        e.status === "DIPUBLIKASI" ||
        e.status === "DITERBITKAN" ||
        e.status === "BERLANGSUNG" ||
        e.status === "ACTIVE"
    );
  }, [allTeacherExams]);

  // Filter daftar ujian guru berdasarkan status dan pencarian
  const filteredTeacherExams = useMemo(() => {
    return allTeacherExams.filter((e) => {
      if (statusFilter === "ACTIVE") {
        const isAct =
          e.status === "PUBLISHED" ||
          e.status === "DIPUBLIKASI" ||
          e.status === "DITERBITKAN" ||
          e.status === "BERLANGSUNG" ||
          e.status === "ACTIVE";
        if (!isAct) return false;
      } else if (statusFilter === "DRAFT") {
        if (e.status !== "DRAFT") return false;
      } else if (statusFilter === "COMPLETED") {
        if (e.status !== "SELESAI") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchJudul = e.judul.toLowerCase().includes(q);
        const matchMapel = e.mata_pelajaran_nama.toLowerCase().includes(q);
        const matchRombel = e.rombel_nama.toLowerCase().includes(q);
        if (!matchJudul && !matchMapel && !matchRombel) return false;
      }

      return true;
    });
  }, [allTeacherExams, statusFilter, searchQuery]);

  // Filter untuk ujian siswa
  const filteredStudentExams = useMemo(() => {
    return studentExams.filter((e) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchJudul = e.judul.toLowerCase().includes(q);
        const matchMapel = e.mata_pelajaran_nama.toLowerCase().includes(q);
        const matchGuru = e.guru_nama.toLowerCase().includes(q);
        if (!matchJudul && !matchMapel && !matchGuru) return false;
      }
      return true;
    });
  }, [studentExams, searchQuery]);

  // Derivasi data tindakan yang perlu diselesaikan guru (100% Data Nyata dari DB)
  const pendingActions = useMemo(() => {
    const list: Array<{
      id: string;
      tipe: "ESAI" | "PUBLISH" | "SNAPSHOT";
      judul: string;
      subjudul: string;
      badge: string;
      ctaText: string;
      linkUrl: string;
      isPriority?: boolean;
    }> = [];

    // 1. Periksa ujian yang selesai atau sesi yang butuh koreksi lembar esai
    for (const c of teacherClasses) {
      for (const e of c.exams) {
        const needsScoring =
          (typeof e.total_perlu_koreksi === "number" && e.total_perlu_koreksi > 0) ||
          (e.status === "SELESAI" && e.rata_rata === null);

        if (needsScoring) {
          list.push({
            id: `esai-${e.id}`,
            tipe: "ESAI",
            judul: "Koreksi Lembar Esai Siswa",
            subjudul: `Kelas ${c.rombel_nama} • ${e.judul}`,
            badge: "Prioritas Koreksi",
            ctaText: "Mulai Koreksi",
            linkUrl: e.asesmen_id
              ? `/cbt/administrasi/${e.asesmen_id}`
              : `/kelas-saya/${c.penugasan_id}`,
            isPriority: true,
          });
          break;
        }
      }
      if (list.some((a) => a.tipe === "ESAI")) break;
    }

    // 2. Periksa ujian draf yang siap dipublikasi (sudah ada butir soal)
    for (const c of teacherClasses) {
      const readyDraft = c.exams.find(
        (e) => e.status === "DRAFT" && typeof e.total_soal === "number" && e.total_soal > 0
      );
      if (readyDraft) {
        list.push({
          id: `publish-${readyDraft.id}`,
          tipe: "PUBLISH",
          judul: "Ujian Siap Diterbitkan",
          subjudul: `Kelas ${c.rombel_nama} • ${readyDraft.judul}`,
          badge: "Siap Terbit",
          ctaText: "Terbitkan",
          linkUrl: readyDraft.asesmen_id
            ? `/cbt/administrasi/${readyDraft.asesmen_id}`
            : `/cbt/administrasi/${readyDraft.id}`,
        });
        break;
      }
    }

    // 3. Periksa ujian draf yang belum memiliki snapshot naskah
    for (const c of teacherClasses) {
      const withoutSnapshot = c.exams.find(
        (e) => e.status === "DRAFT" && (!e.total_soal || e.total_soal === 0)
      );
      if (withoutSnapshot) {
        list.push({
          id: `snap-${withoutSnapshot.id}`,
          tipe: "SNAPSHOT",
          judul: "Bekukan Snapshot Naskah",
          subjudul: `Kelas ${c.rombel_nama} • ${withoutSnapshot.judul}`,
          badge: "Perlu Verifikasi",
          ctaText: "Verifikasi",
          linkUrl: withoutSnapshot.asesmen_id
            ? `/cbt/administrasi/${withoutSnapshot.asesmen_id}`
            : `/cbt/administrasi/${withoutSnapshot.id}`,
        });
        break;
      }
    }

    return list;
  }, [teacherClasses]);

  const primaryPending = pendingActions.find((a) => a.isPriority) || pendingActions[0];
  const secondaryPending = pendingActions.filter((a) => a.id !== primaryPending?.id);

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 w-full max-w-7xl mx-auto">
      {/* ===================================================================== */}
      {/* 1. TEACHER / ADMIN VIEW                                               */}
      {/* ===================================================================== */}
      {isTeacherOrAdmin && (
        <>
          {/* MOBILE COMPACT HEADER (< 768px: TAMPIL, >= 768px: TERSEMBUNYI) */}
          <div className="flex md:hidden flex-col gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-50 text-[#2563EB]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  CBT Ujian Online
                </h1>
                <p className="text-[11px] text-slate-500">Evaluasi asesmen & bank soal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Buat Ujian
              </button>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                <Layers className="h-4 w-4 text-slate-500" />
                Bank Soal
              </button>
            </div>
          </div>

          {/* MAIN GRID 12 COLUMNS: HARMONI 1:1 DENGAN DASHBOARD GURU */}
          <div className="pt-1.5 sm:pt-2.5 md:pt-3 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* =============================================================== */}
            {/* LEFT WORKSPACE (8 Columns on XL)                                */}
            {/* Mobile: Order 2, Desktop: Order 1                               */}
            {/* =============================================================== */}
            <div className="order-2 md:order-1 xl:order-1 xl:col-span-8 space-y-4 sm:space-y-5">
              {/* DESKTOP HERO BANNER DENGAN MASKOT 3D ASTRONOT UJIAN POP-OUT */}
              <div className="hidden md:flex rounded-[32px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-visible flex-col md:flex-row md:items-center justify-between gap-5 mt-4">
                {/* Ambient Glow */}
                <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Left Content */}
                <div className="space-y-3.5 z-10 max-w-xl">
                  {/* Badge Capsule Monospace */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Assessment & Exam Cockpit</span>
                  </div>

                  {/* Title & Narrative Subtitle */}
                  <div>
                    <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      CBT Ujian & Evaluasi Akademik
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      Susun bank soal terstandar, terbitkan asesmen aman ke rombel belajar, dan
                      pantau pelaksanaan ujian secara realtime.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Buat Ujian Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBankModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Layers className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Buka Bank Soal
                    </button>
                  </div>
                </div>

                {/* Right 3D Astronaut Mascot: Papan Ujian, Pensil, Penggaris & Kertas Melayang */}
                <div className="relative shrink-0 w-64 md:w-80 h-56 md:h-64 -mt-24 md:-mt-28 -mb-6 md:-mb-7 pointer-events-none select-none flex items-end justify-center z-20">
                  <Image
                    src="/images/illustrations/astronaut-cbt-exam-hero.png"
                    alt="Maskot Astronot Ruang Pintar CBT"
                    fill
                    sizes="(max-width: 768px) 240px, 320px"
                    priority
                    className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.35)]"
                  />
                </div>
              </div>

              {/* =============================================================== */}
              {/* 4 CARD INFORMASI: DRAFT UJIAN, UJIAN AKTIF, SELESAI & BANK SOAL  */}
              {/* =============================================================== */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. DRAFT UJIAN */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                      <FileEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                      Rancangan
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {stats.draft}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      Draft Ujian
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Menunggu verifikasi & publikasi
                    </p>
                  </div>
                </div>

                {/* 2. UJIAN AKTIF */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                      <Radio className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    {stats.aktif > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Standby
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {stats.aktif}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      Ujian Aktif
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Sedang berlangsung di rombel
                    </p>
                  </div>
                </div>

                {/* 3. UJIAN SELESAI */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                      Terekam
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {stats.selesai}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      Ujian Selesai
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Evaluasi & arsip hasil ujian
                    </p>
                  </div>
                </div>

                {/* 4. BANK SOAL */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsBankModalOpen(true)}
                  onKeyDown={(e) => e.key === "Enter" && setIsBankModalOpen(true)}
                  className="p-4 sm:p-5 rounded-3xl bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                      <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/50 group-hover:bg-indigo-100 transition">
                      Buka &rarr;
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {bankSoalCount}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      Bank Soal
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Koleksi butir soal terstandar
                    </p>
                  </div>
                </div>
              </div>

              {/* =============================================================== */}
              {/* 1. SECTION: UJIAN SEDANG BERLANGSUNG (LIVE MONITOR & AKHIRI)    */}
              {/* Cockpit Card Real-time: Monitor Peserta & Akhiri Sesi Ujian     */}
              {/* =============================================================== */}
              <div className="space-y-3 pt-1">
                {activeExams.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Radio className="h-4 w-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            Ujian Sedang Berlangsung
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {activeExams.length} Sesi Live
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Pantau pengerjaan siswa secara realtime dari rombel aktif dan kendalikan
                          pelaksanaan ujian
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DAFTAR CARD UJIAN AKTIF / BERLANGSUNG */}
                {activeExams.length > 0 ? (
                  <div
                    className={`grid gap-4 ${
                      activeExams.length > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {activeExams.map((e) => {
                      const totalPeserta = e.total_peserta || 0;
                      const totalSelesai = e.total_selesai || 0;
                      const totalSedang = e.total_sedang_mengerjakan || 0;
                      const totalBelum = Math.max(0, totalPeserta - totalSelesai - totalSedang);
                      const percentSelesai =
                        totalPeserta > 0 ? Math.round((totalSelesai / totalPeserta) * 100) : 0;
                      const percentSedang =
                        totalPeserta > 0 ? Math.round((totalSedang / totalPeserta) * 100) : 0;

                      return (
                        <div
                          key={e.id}
                          className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/90 dark:border-emerald-900/50 shadow-[0_4px_25px_rgba(16,185,129,0.06)] dark:shadow-[0_4px_25px_rgba(16,185,129,0.15)] p-5 backdrop-blur-md flex flex-col justify-between space-y-4 relative overflow-hidden"
                        >
                          {/* Ambient emerald glow */}
                          <div className="absolute top-0 right-0 w-44 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                          <div className="space-y-3 z-10">
                            {/* Header Kartu: Rombel, Mapel, Live Badge, Token */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                                  Kelas {e.rombel_nama}
                                </span>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  • {e.mata_pelajaran_nama}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  LIVE
                                </span>
                                {e.gunakan_token && e.token_masuk && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToken(e.token_masuk!)}
                                    title="Klik untuk salin token masuk ujian"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 hover:bg-indigo-100 transition cursor-pointer"
                                  >
                                    <span>Token: {e.token_masuk}</span>
                                    {copiedToken === e.token_masuk ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-indigo-500" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Judul Ujian */}
                            <div>
                              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {e.judul}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  {e.durasi_menit} Menit
                                </span>
                                {e.waktu_mulai && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                      Mulai {formatDateTime(e.waktu_mulai)}
                                    </span>
                                  </>
                                )}
                                {e.total_soal && (
                                  <>
                                    <span>•</span>
                                    <span>{e.total_soal} Butir Soal</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Live Participant Tracker */}
                            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  Status Partisipasi Siswa
                                </span>
                                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {totalSelesai} dari {totalPeserta} Selesai ({percentSelesai}%)
                                </span>
                              </div>

                              {/* Segmented Progress Bar */}
                              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden flex">
                                <div
                                  style={{ width: `${percentSelesai}%` }}
                                  className="bg-emerald-500 h-full transition-all duration-500"
                                  title={`${totalSelesai} Siswa Selesai`}
                                />
                                <div
                                  style={{ width: `${percentSedang}%` }}
                                  className="bg-amber-400 h-full transition-all duration-500"
                                  title={`${totalSedang} Siswa Sedang Mengerjakan`}
                                />
                              </div>

                              {/* Mini Badges */}
                              <div className="flex items-center justify-between text-[11px] pt-0.5">
                                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  {totalSelesai} Selesai
                                </span>
                                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                  {totalSedang} Mengerjakan
                                </span>
                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                  {totalBelum} Belum Mulai
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Footer: MONITOR & AKHIRI UJIAN */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 z-10">
                            {/* Tombol MONITOR PROCTOR */}
                            <Link
                              href={`/cbt-ujian/proctor/${e.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              <span>Monitor Proctor Live</span>
                            </Link>

                            {/* Tombol AKHIRI UJIAN */}
                            <button
                              type="button"
                              onClick={() => setExamToEnd(e)}
                              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 text-xs font-bold transition active:scale-[0.98] cursor-pointer"
                            >
                              <StopCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                              <span>Akhiri Ujian</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* STANDBY STATE: TIDAK ADA UJIAN BERLANGSUNG */
                  <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Radio className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Tidak Ada Ujian yang Sedang Berlangsung
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Semua rombel dalam status standby. Terbitkan ujian dari draf di bawah
                          untuk mengaktifkan pemantauan live.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Jadwalkan Ujian</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT ACTION RAIL: CARD "PERLU TINDAKAN" (4 Columns on XL)     */}
            {/* Padanan dari "Jadwal Mengajar" di Dashboard Guru                */}
            {/* Mobile: Order 1 (Tampil Paling Atas), Desktop: Order 2          */}
            {/* =============================================================== */}
            <div className="order-1 md:order-2 xl:order-2 xl:col-span-4 space-y-4">
              <div className="rounded-[32px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] space-y-4">
                {/* Header Card Perlu Tindakan */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-rose-500" />
                      <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        Perlu Tindakan
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pendingActions.length > 0
                        ? `${pendingActions.length} tugas evaluasi mendesak`
                        : "Tidak ada tugas mendesak"}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      pendingActions.length > 0
                        ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    }`}
                  >
                    {pendingActions.length} Aksi
                  </span>
                </div>

                {/* HIGHLIGHT KARTU TINDAKAN UTAMA ATAU EMPTY STATE TUNTAS */}
                {pendingActions.length === 0 ? (
                  <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 text-center space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Semua Evaluasi Tuntas
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Tidak ada lembar esai tertunda atau ujian yang perlu diverifikasi saat ini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Jadwalkan Ujian Baru
                    </button>
                  </div>
                ) : (
                  <>
                    {primaryPending && (
                      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-extrabold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full text-white">
                              {primaryPending.badge}
                            </span>
                            <Clock className="h-3.5 w-3.5 text-blue-200" />
                          </div>
                          <h4 className="text-sm font-bold tracking-tight mt-1">
                            {primaryPending.judul}
                          </h4>
                          <p className="text-xs text-blue-100 line-clamp-1">
                            {primaryPending.subjudul}
                          </p>
                        </div>

                        <Link
                          href={primaryPending.linkUrl}
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <span>{primaryPending.ctaText}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#2563EB]" />
                        </Link>
                      </div>
                    )}

                    {/* DAFTAR TINDAKAN PENDUKUNG LAINNYA */}
                    {secondaryPending.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {secondaryPending.map((act) => (
                          <Link
                            key={act.id}
                            href={act.linkUrl}
                            className="p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between gap-2 block group cursor-pointer"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2563EB] transition-colors truncate">
                                  {act.judul}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {act.subjudul}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-bold text-[#2563EB] shrink-0">
                              <span>{act.ctaText}</span>
                              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* =============================================================== */}
              {/* CARD 2: KUMPULAN FOLDER BANK SOAL BERDASARKAN MATA PELAJARAN    */}
              {/* =============================================================== */}
              <div className="rounded-[32px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[24px] border border-white/80 dark:border-white/10 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] space-y-4">
                {/* Header Card Folder Bank Soal */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <FolderArchive className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        Folder Bank Soal Mapel
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Organisasi butir soal per mata pelajaran
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
                    {resolvedFolders.length} Mapel
                  </span>
                </div>

                {/* Search Mini jika ada lebih dari 3 folder */}
                {resolvedFolders.length > 3 && (
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={folderSearchQuery}
                      onChange={(e) => setFolderSearchQuery(e.target.value)}
                      placeholder="Cari folder mapel..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    {folderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFolderSearchQuery("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* DAFTAR FOLDER MATA PELAJARAN */}
                {filteredFolders.length > 0 ? (
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredFolders.map((folder) => {
                      return (
                        <div
                          key={folder.mapel_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setBankModalMapelId(folder.mapel_id);
                            setIsBankModalOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setBankModalMapelId(folder.mapel_id);
                              setIsBankModalOpen(true);
                            }
                          }}
                          className="group p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
                          title={`Buka Bank Soal ${folder.mapel_nama}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Folder Icon - Netral tanpa border & tanpa warna-warni */}
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 transition-colors group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                              <Folder className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors truncate">
                                {folder.mapel_nama}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-mono font-medium">
                                  {folder.total_soal} Butir Soal
                                </span>
                                {folder.mapel_kode && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      {folder.mapel_kode}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0">
                            <span>Buka</span>
                            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                    <Folder className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {folderSearchQuery
                        ? "Folder mata pelajaran tidak ditemukan."
                        : "Belum ada mata pelajaran terdaftar."}
                    </p>
                  </div>
                )}

                {/* Footer Action Card */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBankModalMapelId(undefined);
                      setIsBankModalOpen(true);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Semua Soal ({bankSoalCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBankModalMapelId(undefined);
                      setIsBankModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Kelola Soal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 2. SECTION: DAFTAR SELURUH UJIAN & ARSIP RIWAYAT (FULL WIDTH)   */}
          {/* =============================================================== */}
          {/* =============================================================== */}
          {/* 2. SECTION: DAFTAR SELURUH UJIAN & ARSIP RIWAYAT                */}
          {/* =============================================================== */}
          <div className="space-y-4 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Daftar Seluruh Ujian CBT
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                    {filteredTeacherExams.length} Berkas
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelola rancangan draf, asesmen aktif, serta arsip hasil evaluasi
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari ujian, rombel, mapel..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 backdrop-blur-md"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                  statusFilter === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10"
                }`}
              >
                Semua ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                  statusFilter === "ACTIVE"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-white/10"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live / Aktif ({stats.aktif})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DRAFT")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                  statusFilter === "DRAFT"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-white/80 dark:bg-slate-800/80 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-white/10"
                }`}
              >
                Draft ({stats.draft})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                  statusFilter === "COMPLETED"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-slate-800/80 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-white/10"
                }`}
              >
                Selesai ({stats.selesai})
              </button>
            </div>

            {/* TABEL SELURUH UJIAN CBT */}
            <div className="rounded-3xl bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Ujian</th>
                      <th className="py-3.5 px-3">Kelas / Pengajar</th>
                      <th className="py-3.5 px-3">Jadwal & Durasi</th>
                      <th className="py-3.5 px-3">Soal & Peserta</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80 text-xs">
                    {filteredTeacherExams.map((e) => {
                      const isLive =
                        e.status === "PUBLISHED" ||
                        e.status === "DIPUBLIKASI" ||
                        e.status === "DITERBITKAN" ||
                        e.status === "BERLANGSUNG" ||
                        e.status === "ACTIVE";
                      const isDraft = e.status === "DRAFT";

                      return (
                        <tr
                          key={e.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. NAMA UJIAN */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  isLive
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                    : isDraft
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                      : "bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400"
                                }`}
                              >
                                {isLive ? (
                                  <Radio className="h-4 w-4" />
                                ) : isDraft ? (
                                  <FileEdit className="h-4 w-4" />
                                ) : (
                                  <FileCheck className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0 max-w-xs sm:max-w-sm">
                                <div
                                  className="font-bold text-slate-900 dark:text-white truncate"
                                  title={e.judul}
                                >
                                  {e.judul}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="truncate">{e.mata_pelajaran_nama}</span>
                                  {e.gunakan_token && e.token_masuk && (
                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 shrink-0">
                                      Token: {e.token_masuk}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. KELAS / PENGAJAR */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                                Kelas {e.rombel_nama}
                              </span>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {teacherClasses.find((tc) => tc.rombel_id === e.rombel_id)
                                  ?.guru_nama || "Guru Pengampu"}
                              </div>
                            </div>
                          </td>

                          {/* 3. JADWAL & DURASI */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>{e.durasi_menit} Menit</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {e.waktu_mulai
                                  ? formatDateTime(e.waktu_mulai)
                                  : formatDate(e.created_at)}
                              </div>
                            </div>
                          </td>

                          {/* 4. SOAL & PESERTA */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                {e.total_soal ?? 0} Butir Soal
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <span>
                                  {e.total_selesai}/{e.total_peserta} Siswa
                                </span>
                                {e.rata_rata !== null && (
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    • Rata {e.rata_rata}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. STATUS */}
                          <td className="py-3.5 px-3">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            ) : isDraft ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                Draft
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                                Selesai
                              </span>
                            )}
                          </td>

                          {/* 6. AKSI */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isLive ? (
                                <>
                                  <Link
                                    href={`/cbt-ujian/proctor/${e.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                                    title="Masuk ke Proctor Cockpit Live"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    <span>Monitor</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setActiveExamToEditId(e.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50 text-[11px] font-bold transition active:scale-[0.98] cursor-pointer"
                                    title="Koreksi Butir Soal Ujian Aktif"
                                  >
                                    <FileEdit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Koreksi</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExamToEnd(e)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 text-[11px] font-bold transition active:scale-[0.98] cursor-pointer"
                                    title="Akhiri Sesi Ujian Ini"
                                  >
                                    <StopCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                    <span>Akhiri</span>
                                  </button>
                                </>
                              ) : isDraft ? (
                                <Link
                                  href={
                                    e.asesmen_id
                                      ? `/cbt/administrasi/${e.asesmen_id}`
                                      : `/cbt/administrasi/${e.id}`
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                                  title="Buka Administrasi & Butir Soal"
                                >
                                  <FileEdit className="h-3.5 w-3.5" />
                                  <span>Edit Soal</span>
                                </Link>
                              ) : (
                                <Link
                                  href={`/cbt-ujian/proctor/${e.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold transition active:scale-[0.98] cursor-pointer"
                                  title="Lihat Hasil & Rekap Nilai"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Hasil</span>
                                </Link>
                              )}

                              {/* Quick Print Icon */}
                              <Link
                                href={`/cbt/cetak/${e.id}`}
                                target="_blank"
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Cetak Naskah Soal A4 & LJM"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Link>

                              {/* Hub Berkas & Supervisi Ujian (10 Dokumen) */}
                              <Link
                                href={
                                  e.asesmen_id
                                    ? `/cbt/administrasi/${e.asesmen_id}`
                                    : `/cbt/administrasi/${e.id}`
                                }
                                className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                                title="Dokumen Supervisi & Akreditasi Ujian (10 Berkas)"
                              >
                                <FolderArchive className="h-3.5 w-3.5" />
                              </Link>

                              {/* Pengaturan Ujian (Durasi, Acak Soal/Opsi, Nilai) */}
                              <button
                                type="button"
                                onClick={() => setExamToEdit(e)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                                title="Pengaturan Ujian (Durasi, Acak Soal/Opsi, Nilai)"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredTeacherExams.length === 0 && (
                <div className="p-10 text-center space-y-2">
                  <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tidak Ada Ujian yang Cocok
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Coba sesuaikan kata kunci pencarian atau reset filter status.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 2. STUDENT VIEW                                                       */}
      {/* ===================================================================== */}
      {!isTeacherOrAdmin && (
        <div className="space-y-5">
          {/* STUDENT HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                <FileCheck className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Portal Ujian Siswa
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar ujian terkomputerisasi yang ditugaskan untuk rombel Anda
                </p>
              </div>
            </div>

            {/* Search Input Siswa */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ujian atau mata pelajaran..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TABLE UJIAN SISWA (GOOGLE DRIVE STYLE) */}
          {filteredStudentExams.length === 0 ? (
            <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 p-12 text-center space-y-2 backdrop-blur-md">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak Ada Ujian Daring Saat Ini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Seluruh asesmen yang ditugaskan kepada rombel Anda telah selesai atau belum
                dijadwalkan oleh guru pengampu.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden">
              {/* DESKTOP TABLE VIEW (sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Ujian</th>
                      <th className="py-3.5 px-3">Mata Pelajaran & Guru</th>
                      <th className="py-3.5 px-3">Durasi</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80 text-xs">
                    {filteredStudentExams.map((exam) => {
                      const isFinished = exam.attempt_status === "SELESAI";
                      const isInProgress = exam.attempt_status === "SEDANG_DIKERJAKAN";
                      const isLocked = exam.attempt_status === "TERKUNCI";

                      return (
                        <tr
                          key={exam.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  isFinished
                                    ? "bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400"
                                    : isInProgress
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isFinished ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : isInProgress ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  <Radio className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {exam.judul}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Kelas {exam.rombel_nama}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                              {exam.mata_pelajaran_nama}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {exam.guru_nama}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{exam.durasi_menit} Menit</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            {isFinished ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                                Selesai {exam.nilai_akhir !== null ? `(${exam.nilai_akhir})` : ""}
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                Sedang Dikerjakan
                              </span>
                            ) : isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                Terkunci
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Siap Dikerjakan
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isFinished ? (
                              <Link
                                href={
                                  exam.attempt_id
                                    ? `/cbt/finished/${exam.attempt_id}`
                                    : `/cbt/start/${exam.id}`
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                              >
                                <span>Lihat Hasil</span>
                              </Link>
                            ) : isInProgress ? (
                              <Link
                                href={`/cbt/attempt/${exam.attempt_id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                              >
                                <span>Lanjutkan</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            ) : isLocked ? (
                              <span className="text-xs text-rose-500 font-bold">
                                Hubungi Pengawas
                              </span>
                            ) : (
                              <Link
                                href={`/cbt/start/${exam.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                              >
                                <span>Mulai Ujian</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD LIST VIEW (sm:hidden) */}
              <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudentExams.map((exam) => {
                  const isFinished = exam.attempt_status === "SELESAI";
                  const isInProgress = exam.attempt_status === "SEDANG_DIKERJAKAN";
                  const isLocked = exam.attempt_status === "TERKUNCI";

                  return (
                    <div key={exam.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                            {exam.mata_pelajaran_nama}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {exam.judul}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Kelas {exam.rombel_nama} • {exam.guru_nama}
                          </p>
                        </div>
                        {isFinished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shrink-0">
                            Selesai {exam.nilai_akhir !== null ? `(${exam.nilai_akhir})` : ""}
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 shrink-0">
                            Sedang Dikerjakan
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shrink-0">
                            Terkunci
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Siap
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{exam.durasi_menit} Menit</span>
                        </div>

                        <div>
                          {isFinished ? (
                            <Link
                              href={
                                exam.attempt_id
                                  ? `/cbt/finished/${exam.attempt_id}`
                                  : `/cbt/start/${exam.id}`
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                            >
                              <span>Lihat Hasil</span>
                            </Link>
                          ) : isInProgress ? (
                            <Link
                              href={`/cbt/attempt/${exam.attempt_id}`}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                            >
                              <span>Lanjutkan Ujian</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : isLocked ? (
                            <span className="text-xs text-rose-500 font-bold">
                              Hubungi Pengawas
                            </span>
                          ) : (
                            <Link
                              href={`/cbt/start/${exam.id}`}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                            >
                              <span>Mulai Ujian</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <QuestionBankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        mapelId={bankModalMapelId || teacherClasses[0]?.mata_pelajaran_id}
        onShowToast={(msg, type) => showToast(msg, type === "error" ? "error" : "success")}
      />

      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        penugasanId={teacherClasses[0]?.penugasan_id || ""}
        mapelId={teacherClasses[0]?.mata_pelajaran_id}
        onSuccess={() => setIsCreateModalOpen(false)}
        onError={() => {}}
      />

      {/* MODAL EDIT PENGATURAN UJIAN */}
      <EditExamSettingsModal
        isOpen={Boolean(examToEdit)}
        onClose={() => setExamToEdit(null)}
        exam={examToEdit}
        onSuccess={(msg) => {
          showToast(msg, "success");
          router.refresh();
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      {/* MODAL KONFIRMASI AKHIRI UJIAN */}
      {examToEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Akhiri Sesi Ujian?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konfirmasi penutupan sesi pelaksanaan ujian
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Ujian:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                  {examToEnd.judul}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rombel:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Kelas {examToEnd.rombel_nama}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sedang Mengerjakan:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {examToEnd.total_sedang_mengerjakan || 0} Siswa
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              Saat diakhiri, seluruh lembar kerja siswa yang masih mengerjakan akan otomatis
              dikumpulkan dan status ujian akan berubah menjadi <strong>SELESAI</strong>. Tindakan
              ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isEndingExam}
                onClick={() => setExamToEnd(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isEndingExam}
                onClick={handleFinishExam}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <StopCircle className="h-4 w-4" />
                <span>{isEndingExam ? "Mengakhiri..." : "Ya, Akhiri Ujian"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KOREKSI SOAL UJIAN AKTIF */}
      {activeExamToEditId && (
        <ActiveExamQuestionModal
          ujianId={activeExamToEditId}
          isOpen={Boolean(activeExamToEditId)}
          onClose={() => setActiveExamToEditId(null)}
          onQuestionUpdated={() => {
            showToast(
              "Butir soal ujian aktif berhasil dikoreksi dan snapshot diperbarui.",
              "success"
            );
            router.refresh();
          }}
        />
      )}

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all animate-in slide-in-from-bottom-5 ${
            toastMessage.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
