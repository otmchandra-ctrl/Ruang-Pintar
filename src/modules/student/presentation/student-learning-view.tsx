"use client";

/**
 * Ruang Pintar — Student Learning View (Phase 15 / M15)
 *
 * Tampilan Terpadu Aktivitas Belajar Siswa (Academic Glass UI v1.2):
 * - Hero Cockpit: Identitas Rombel, Ringkasan 3-Pilar KBM, Ilustrasi Siswa 3D
 * - Segmented Control: Tab Tugas, Materi, dan Presensi responsif (anti-stack pada mobile)
 * - Tab 1: Tugas & Pengumpulan (Assignment Tracking, Filter Chips, Rich Empty State)
 * - Tab 2: Direktori Modul & Bahan Ajar Guru (Material Search, Subject Filter Chips)
 * - Tab 3: Presensi Kehadiran Kelas (6-KPI Stats, Dual View: Table di Desktop & Card List di Mobile)
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Layers,
  Sparkles,
  AlertCircle,
  FileCheck,
  UserCheck,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  X,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  StudentProfileContext,
  StudentAssignmentItem,
  StudentMaterialItem,
  StudentAttendanceSummary,
} from "../domain/student-experience-types";
import { SubmitAssignmentModal } from "./submit-assignment-modal";
import { MaterialDetailModal } from "./material-detail-modal";

export interface StudentLearningViewProps {
  profile: StudentProfileContext;
  materials: StudentMaterialItem[];
  assignments: StudentAssignmentItem[];
  attendance: StudentAttendanceSummary;
}

export function StudentLearningView({
  profile,
  materials,
  assignments,
  attendance,
}: StudentLearningViewProps) {
  const [activeTab, setActiveTab] = useState<"tugas" | "materi" | "presensi">("tugas");

  // Filter & Search Tugas
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("SEMUA");

  // Filter & Search Materi
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState<string>("SEMUA");

  // Modals state
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState<StudentMaterialItem | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Perhitungan status tugas
  const pendingAssignmentsCount = useMemo(() => {
    return assignments.filter((item) => item.statusPengerjaan !== "SUDAH_DIKUMPULKAN").length;
  }, [assignments]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const matchSearch =
        item.judul.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
        item.mataPelajaranNama.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
        item.guruNama.toLowerCase().includes(assignmentSearch.toLowerCase());

      if (!matchSearch) return false;

      if (assignmentStatusFilter === "PERLU_DIKERJAKAN") {
        return item.statusPengerjaan !== "SUDAH_DIKUMPULKAN";
      }
      if (assignmentStatusFilter === "SUDAH_DIKUMPULKAN") {
        return item.statusPengerjaan === "SUDAH_DIKUMPULKAN";
      }
      if (assignmentStatusFilter === "TERLAMBAT") {
        return item.statusPengerjaan === "TERLAMBAT";
      }

      return true;
    });
  }, [assignments, assignmentSearch, assignmentStatusFilter]);

  // Unique Subjects for Material Filter
  const materialSubjects = useMemo(() => {
    return Array.from(new Set(materials.map((m) => m.mataPelajaranNama)));
  }, [materials]);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchSearch =
        item.judul.toLowerCase().includes(materialSearch.toLowerCase()) ||
        item.mataPelajaranNama.toLowerCase().includes(materialSearch.toLowerCase()) ||
        item.guruNama.toLowerCase().includes(materialSearch.toLowerCase()) ||
        (item.babJudul && item.babJudul.toLowerCase().includes(materialSearch.toLowerCase()));

      if (!matchSearch) return false;

      if (materialSubjectFilter !== "SEMUA") {
        return item.mataPelajaranNama === materialSubjectFilter;
      }

      return true;
    });
  }, [materials, materialSearch, materialSubjectFilter]);

  const handleOpenSubmit = (assignment: StudentAssignmentItem) => {
    setSelectedAssignment(assignment);
    setIsSubmitModalOpen(true);
  };

  const handleOpenMaterial = (material: StudentMaterialItem) => {
    setSelectedMaterial(material);
    setIsMaterialModalOpen(true);
  };

  const tabs = [
    {
      id: "tugas" as const,
      label: `Tugas Kelas (${assignments.length})`,
      shortLabel: `Tugas (${assignments.length})`,
      countBadge: assignments.length,
      icon: BookOpen,
    },
    {
      id: "materi" as const,
      label: `Materi Pelajaran (${materials.length})`,
      shortLabel: `Materi (${materials.length})`,
      countBadge: materials.length,
      icon: FileText,
    },
    {
      id: "presensi" as const,
      label: `Presensi Kelas (${attendance.persentaseKehadiran}%)`,
      shortLabel: `Presensi (${attendance.persentaseKehadiran}%)`,
      countBadge: `${attendance.persentaseKehadiran}%`,
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO COCKPIT BANNER (Academic Glass UI v1.2)
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          1. HERO COCKPIT BANNER (Identik Dashboard, 3D Siswa Pop-Out)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-[32px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden md:overflow-visible flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Soft background glow decoration */}
        <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5 max-w-xl">
          {/* Breadcrumb & Semester Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 flex-wrap">
            <Link
              href="/dashboard"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">Materi & Tugas</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {profile.tahunAjaranNama} ({profile.semesterNama})
            </span>
          </div>

          {/* Main Title & Class Chip */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Materi & Tugas Pembelajaran
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50 shadow-2xs">
                <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{profile.rombelNama}</span>
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg">
              Akses modul pembelajaran resmi, kumpulkan tugas mandiri tepat waktu, dan pantau rekam
              kehadiran kelas Anda secara terpadu.
            </p>
          </div>
        </div>

        {/* Right 3D Astronaut Mascot with Pop-out Effect */}
        <div className="relative shrink-0 w-60 sm:w-72 md:w-80 h-48 sm:h-60 md:h-64 mt-4 sm:-mt-24 md:-mt-28 -mb-6 sm:-mb-7 mx-auto md:mr-0 pointer-events-none select-none flex items-end justify-center z-20">
          <Image
            src="/images/illustrations/astronaut-students-3d.png"
            alt="Ilustrasi Siswa Ruang Pintar 3D"
            fill
            sizes="(max-width: 768px) 240px, 320px"
            priority
            className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.35)]"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN TABS NAVIGATION (Active Royal Blue Pill)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full">
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-1.5 shadow-xs">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#2563EB] hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`}
                  />
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TAB 1: TUGAS KELAS (ASSIGNMENTS)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "tugas" && (
        <div className="space-y-4">
          {/* Toolbar Search & Status Filter Chips */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari tugas berdasarkan judul, mata pelajaran, atau guru..."
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  className="pl-10 pr-9 h-10 rounded-xl border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800/50"
                />
                {assignmentSearch && (
                  <button
                    type="button"
                    onClick={() => setAssignmentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Hapus pencarian"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips (Horizontal Scrollable on Mobile) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 mr-1 hidden sm:flex">
                  <Filter className="h-3.5 w-3.5" /> Filter:
                </span>
                {(
                  [
                    ["SEMUA", "Semua Status"],
                    ["PERLU_DIKERJAKAN", "Perlu Dikerjakan"],
                    ["SUDAH_DIKUMPULKAN", "Sudah Dikumpulkan"],
                    ["TERLAMBAT", "Terlambat"],
                  ] as const
                ).map(([val, label]) => {
                  const isSelected = assignmentStatusFilter === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAssignmentStatusFilter(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                          : "bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid Tugas atau Empty State */}
          {filteredAssignments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs border border-blue-200/60 dark:border-blue-800/60">
                {assignmentSearch || assignmentStatusFilter !== "SEMUA" ? (
                  <Search className="h-8 w-8" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                )}
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {assignmentSearch || assignmentStatusFilter !== "SEMUA"
                    ? "Tidak Ada Tugas yang Sesuai Filter"
                    : "Semua Tugas Sudah Selesai!"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {assignmentSearch || assignmentStatusFilter !== "SEMUA"
                    ? "Tidak ditemukan tugas yang cocok dengan filter atau kata kunci pencarian Anda saat ini."
                    : "Bagus sekali! Tidak ada tugas kelas yang tertunda saat ini. Anda dapat mempelajari modul bahan ajar atau meninjau jadwal pembelajaran."}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                {assignmentSearch || assignmentStatusFilter !== "SEMUA" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAssignmentSearch("");
                      setAssignmentStatusFilter("SEMUA");
                    }}
                    className="rounded-xl text-xs font-semibold cursor-pointer gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Filter & Pencarian</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("materi")}
                      className="rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-1.5 shadow-xs"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Lihat Materi Pelajaran</span>
                    </Button>
                    <Link
                      href="/jadwal-saya"
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Jadwal Pelajaran</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((tugas) => {
                const isSubmitted = tugas.statusPengerjaan === "SUDAH_DIKUMPULKAN";
                const isLate = tugas.statusPengerjaan === "TERLAMBAT";

                return (
                  <div
                    key={tugas.id}
                    className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold truncate max-w-[220px]">
                          {tugas.mataPelajaranNama}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0 ${
                            isSubmitted
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : isLate
                                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {isSubmitted ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Sudah Dikumpulkan</span>
                            </>
                          ) : isLate ? (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                              <span>Terlambat</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span>Perlu Dikerjakan</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Title & Guru */}
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {tugas.judul}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Guru:{" "}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {tugas.guruNama}
                          </strong>
                        </p>
                      </div>

                      {/* Instructions Snippet */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {tugas.petunjuk}
                      </p>

                      {/* Deadline & Attachment info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Batas: {tugas.batasWaktuFormatted}</span>
                        </div>
                        {tugas.lampiranBerkas && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <FileCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>Ada Lampiran Guru</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      {tugas.pengumpulan ? (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Dikumpul:{" "}
                          <span className="font-semibold">
                            {tugas.pengumpulan.tanggalKumpulFormatted}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Belum mengumpulkan
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => handleOpenSubmit(tugas)}
                        className={`rounded-xl text-xs font-semibold cursor-pointer transition-all h-9 px-4 active:scale-[0.98] ${
                          isSubmitted
                            ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        }`}
                      >
                        {isSubmitted ? "Lihat / Edit Jawaban" : "Kerjakan Tugas Sekarang →"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 2: MATERI PEMBELAJARAN
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "materi" && (
        <div className="space-y-4">
          {/* Toolbar Search & Subject Filter Chips */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari materi pembelajaran, BAB, atau nama guru..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="pl-10 pr-9 h-10 rounded-xl border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800/50"
                />
                {materialSearch && (
                  <button
                    type="button"
                    onClick={() => setMaterialSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Hapus pencarian"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Subject Filter Chips (Horizontal Scrollable on Mobile) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 mr-1 hidden sm:flex">
                  <Layers className="h-3.5 w-3.5" /> Mapel:
                </span>
                <button
                  type="button"
                  onClick={() => setMaterialSubjectFilter("SEMUA")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                    materialSubjectFilter === "SEMUA"
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                      : "bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80"
                  }`}
                >
                  Semua Mapel
                </button>
                {materialSubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setMaterialSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      materialSubjectFilter === sub
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                        : "bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Materi atau Empty State */}
          {filteredMaterials.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60">
                <FileText className="h-8 w-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {materialSearch || materialSubjectFilter !== "SEMUA"
                    ? "Tidak Ada Materi yang Cocok"
                    : "Belum Ada Materi Diterbitkan"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {materialSearch || materialSubjectFilter !== "SEMUA"
                    ? "Silakan ubah kata kunci pencarian atau pilih kategori mata pelajaran yang lain."
                    : "Guru pengampu mata pelajaran belum menerbitkan modul bahan ajar untuk kelas Anda saat ini."}
                </p>
              </div>

              {(materialSearch || materialSubjectFilter !== "SEMUA") && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMaterialSearch("");
                      setMaterialSubjectFilter("SEMUA");
                    }}
                    className="rounded-xl text-xs font-semibold cursor-pointer gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Filter Materi</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((materi) => (
                <div
                  key={materi.id}
                  className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold truncate max-w-[170px]">
                        {materi.mataPelajaranNama}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {materi.tipeKonten}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {materi.judul}
                      </h3>
                      {materi.babJudul && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                          {materi.babJudul}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Guru: {materi.guruNama}
                      </p>
                    </div>

                    {materi.deskripsi && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {materi.deskripsi}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {materi.tanggalPublikasiFormatted}
                    </span>

                    <Button
                      type="button"
                      onClick={() => handleOpenMaterial(materi)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer active:scale-[0.98]"
                    >
                      Buka Materi →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 3: PRESENSI KEHADIRAN KELAS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "presensi" && (
        <div className="space-y-6">
          {/* Top 6 Attendance KPI Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3.5">
            {/* 1. Persentase */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Persentase
              </span>
              <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                {attendance.persentaseKehadiran}%
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
                Tingkat Hadir
              </span>
            </div>

            {/* 2. Total Sesi */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Sesi
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {attendance.totalSesi}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                KBM Terjadwal
              </span>
            </div>

            {/* 3. Hadir */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Hadir
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {attendance.hadir}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
                Sesi Diikuti
              </span>
            </div>

            {/* 4. Izin */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                Izin
              </span>
              <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
                {attendance.izin}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block truncate">
                Dispensasi
              </span>
            </div>

            {/* 5. Sakit */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                Sakit
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
                {attendance.sakit}
              </p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block truncate">
                Ket. Medis
              </span>
            </div>

            {/* 6. Alpha */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                Alpha
              </span>
              <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">
                {attendance.alpha}
              </p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block truncate">
                Tanpa Ket.
              </span>
            </div>
          </div>

          {/* Riwayat Presensi Container */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Riwayat Presensi Sesi Kelas Pembelajaran
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {attendance.riwayatPresensi.length} catatan
              </span>
            </div>

            {attendance.riwayatPresensi.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs sm:text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <UserCheck className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>Belum ada data presensi sesi kelas yang tercatat untuk siswa ini.</p>
              </div>
            ) : (
              <>
                {/* Desktop View: Clean Academic Glass Table */}
                <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Mata Pelajaran</th>
                        <th className="py-3 px-4">Guru Pengampu</th>
                        <th className="py-3 px-4 text-center">Status Kehadiran</th>
                        <th className="py-3 px-4">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendance.riwayatPresensi.map((rec) => (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {rec.tanggalFormatted}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {rec.mataPelajaranNama}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {rec.guruNama}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block border ${
                                rec.status === "HADIR"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : rec.status === "IZIN"
                                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                    : rec.status === "SAKIT"
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {rec.catatan || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Card List (No horizontal overflow) */}
                <div className="sm:hidden space-y-3">
                  {attendance.riwayatPresensi.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {rec.tanggalFormatted}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                            rec.status === "HADIR"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                              : rec.status === "IZIN"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200"
                                : rec.status === "SAKIT"
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200"
                                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {rec.mataPelajaranNama}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {rec.guruNama}
                        </p>
                      </div>
                      {rec.catatan && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700">
                          Catatan: {rec.catatan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Penyerahan Tugas */}
      <SubmitAssignmentModal
        assignment={selectedAssignment}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Modal Detail Materi */}
      <MaterialDetailModal
        material={selectedMaterial}
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
      />
    </div>
  );
}
