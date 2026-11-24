"use client";

/**
 * Ruang Pintar — Class Student Academic Directory Tab View (Academic Glass UI v1.2)
 *
 * STAGE UX-04: Student Directory & Academic Health Monitoring
 * Tab Direktori Siswa di Teacher Workspace (/kelas-saya/[id])
 * Memuat: Header, Filter (Semua, Laki-laki, Perempuan, Perlu Perhatian, Sering Alpha),
 * Search, Responsive Grid (1 col mobile, 3 col tablet, 4 col desktop),
 * Student Academic Health Card, Side Sheet 6 Tab, dan Chat Conversation Modal.
 */

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck,
  QrCode,
  Share2,
  X,
  Camera,
} from "lucide-react";
import {
  StudentAcademicDirectoryItemDTO,
  StudentAcademicHealthStatus,
} from "../domain/student-academic-directory-types";
import { StudentAcademicHealthCard } from "./student-academic-health-card";
import { StudentAcademicSideSheet, SideSheetTab } from "./student-academic-side-sheet";
import { StudentChatConversationModal } from "./student-chat-conversation-modal";
import { RombelJoinCodeCard } from "./rombel-join-code-card";
import { SmartPhotoOnboardingModal } from "@/modules/ai-assistant/presentation/smart-photo-onboarding-modal";
import { AiPreviewTableModal } from "@/modules/ai-assistant/presentation/ai-preview-table-modal";
import { ClassExtractionResult } from "@/modules/ai-assistant/domain/ai-types";

type DirectoryFilterType = "SEMUA" | "LAKI_LAKI" | "PEREMPUAN" | "PERLU_PERHATIAN" | "SERING_ALPHA";

interface ClassStudentDirectoryTabViewProps {
  penugasanId: string;
  rombelId: string;
  rombelNama: string;
  mapelNama: string;
  students: StudentAcademicDirectoryItemDTO[];
  canManage: boolean;
  joinCode?: string | null;
}

export function ClassStudentDirectoryTabView({
  penugasanId,
  rombelId,
  rombelNama,
  mapelNama,
  students,
  canManage,
  joinCode,
}: ClassStudentDirectoryTabViewProps) {
  // State Filter & Search
  const [activeFilter, setActiveFilter] = useState<DirectoryFilterType>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");

  // State Side Sheet
  const [selectedStudent, setSelectedStudent] = useState<StudentAcademicDirectoryItemDTO | null>(
    null
  );
  const [sideSheetTab, setSideSheetTab] = useState<SideSheetTab>("Overview");
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  // State Chat Modal
  const [chatStudent, setChatStudent] = useState<StudentAcademicDirectoryItemDTO | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // State Modal Tambah Siswa / Kode Undangan
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const router = useRouter();

  // AI Vision Scan states
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [isAiPreviewOpen, setIsAiPreviewOpen] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ClassExtractionResult | null>(null);

  const handleExtractionComplete = (res: ClassExtractionResult) => {
    setIsAiScanOpen(false);
    setExtractionResult(res);
    setIsAiPreviewOpen(true);
  };

  const handleClassCreated = () => {
    setIsAiPreviewOpen(false);
    setExtractionResult(null);
    router.refresh();
  };

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Filter Kategori
      if (activeFilter === "LAKI_LAKI" && s.jenis_kelamin !== "L") return false;
      if (activeFilter === "PEREMPUAN" && s.jenis_kelamin !== "P") return false;
      if (activeFilter === "PERLU_PERHATIAN" && s.health_status === "AMAN") return false;
      if (activeFilter === "SERING_ALPHA" && s.kehadiran_stats.alpha <= 0) return false;

      // 2. Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.nama_lengkap.toLowerCase().includes(q);
        const matchesNis = s.nis && s.nis.toLowerCase().includes(q);
        const matchesNisn = s.nisn && s.nisn.toLowerCase().includes(q);
        return matchesName || matchesNis || matchesNisn;
      }

      return true;
    });
  }, [students, activeFilter, searchQuery]);

  // Statistik Filter Counts
  const counts = useMemo(() => {
    const total = students.length;
    const laki = students.filter((s) => s.jenis_kelamin === "L").length;
    const perempuan = students.filter((s) => s.jenis_kelamin === "P").length;
    const perluPerhatian = students.filter((s) => s.health_status !== "AMAN").length;
    const seringAlpha = students.filter((s) => s.kehadiran_stats.alpha > 0).length;

    return { total, laki, perempuan, perluPerhatian, seringAlpha };
  }, [students]);

  // Handlers
  const handleSelectStudent = (
    student: StudentAcademicDirectoryItemDTO,
    initialTab: SideSheetTab = "Overview"
  ) => {
    setSelectedStudent(student);
    setSideSheetTab(initialTab);
    setIsSideSheetOpen(true);
  };

  const handleOpenChat = (student: StudentAcademicDirectoryItemDTO) => {
    setChatStudent(student);
    setIsChatOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ========================================================= */}
      {/* HEADER: Siswa, X Siswa Aktif, [Tambah Siswa]              */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
              Direktori Akademik
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {rombelNama}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Siswa
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 text-xs font-mono font-bold">
              <Users className="h-3 w-3" />
              <span>{students.length} Siswa Aktif</span>
            </span>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsAddStudentOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-mono font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Siswa</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* FILTER & SEARCH BAR                                       */}
      {/* ========================================================= */}
      <div className="space-y-3">
        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Semua */}
          <button
            type="button"
            onClick={() => setActiveFilter("SEMUA")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "SEMUA"
                ? "bg-[#2563EB] text-white shadow-xs scale-[1.02]"
                : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-slate-800 text-[10px]">
              {counts.total}
            </span>
          </button>

          {/* Laki-laki */}
          <button
            type="button"
            onClick={() => setActiveFilter("LAKI_LAKI")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "LAKI_LAKI"
                ? "bg-[#2563EB] text-white shadow-xs scale-[1.02]"
                : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <span>Laki-laki</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-slate-800 text-[10px]">
              {counts.laki}
            </span>
          </button>

          {/* Perempuan */}
          <button
            type="button"
            onClick={() => setActiveFilter("PEREMPUAN")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "PEREMPUAN"
                ? "bg-[#2563EB] text-white shadow-xs scale-[1.02]"
                : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <span>Perempuan</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-slate-800 text-[10px]">
              {counts.perempuan}
            </span>
          </button>

          {/* Perlu Perhatian */}
          <button
            type="button"
            onClick={() => setActiveFilter("PERLU_PERHATIAN")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "PERLU_PERHATIAN"
                ? "bg-amber-600 text-white shadow-xs scale-[1.02]"
                : "bg-white/70 dark:bg-slate-900/70 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Perlu Perhatian</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-slate-800 text-[10px]">
              {counts.perluPerhatian}
            </span>
          </button>

          {/* Sering Alpha */}
          <button
            type="button"
            onClick={() => setActiveFilter("SERING_ALPHA")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "SERING_ALPHA"
                ? "bg-rose-600 text-white shadow-xs scale-[1.02]"
                : "bg-white/70 dark:bg-slate-900/70 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60"
            }`}
          >
            <Flame className="h-3 w-3" />
            <span>Sering Alpha</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-slate-800 text-[10px]">
              {counts.seringAlpha}
            </span>
          </button>
        </div>

        {/* Sticky Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa"
            className="w-full h-11 pl-11 pr-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] shadow-xs"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* STUDENT CARDS GRID: 4 col Desktop, 3 col Tablet, 1 col Mobile */}
      {/* ========================================================= */}
      {filteredStudents.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3">
          <Users className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Tidak ada siswa yang sesuai
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coba sesuaikan kata kunci pencarian atau ubah filter status di atas.
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-mono font-bold text-[#2563EB] hover:underline"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredStudents.map((student) => (
            <StudentAcademicHealthCard
              key={student.siswa_id}
              student={student}
              onSelectStudent={handleSelectStudent}
              onOpenChat={handleOpenChat}
            />
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* SLIDE-OVER RIGHT SIDE SHEET (Fernly Inspired)             */}
      {/* ========================================================= */}
      <StudentAcademicSideSheet
        student={selectedStudent}
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        initialTab={sideSheetTab}
        penugasanId={penugasanId}
        rombelId={rombelId}
      />

      {/* ========================================================= */}
      {/* CHAT CONVERSATION MODAL (Future Ready)                     */}
      {/* ========================================================= */}
      <StudentChatConversationModal
        student={chatStudent}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* ========================================================= */}
      {/* MODAL TAMBAH SISWA / KODE GABUNG ROMBEL                   */}
      {/* ========================================================= */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tambah Siswa ke {rombelNama}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    Undang siswa bergabung menggunakan kode rombel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Actions: Scan AI Foto Absensi vs Kode Rombel */}
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => {
                  setIsAddStudentOpen(false);
                  setIsAiScanOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Camera className="h-4 w-4" />
                <span>Pindai Foto Lembar Absensi (AI)</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  atau undang via kode
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <RombelJoinCodeCard rombelId={rombelId} rombelNama={rombelNama} />
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Vision Photo Scanner & Preview Modals */}
      <SmartPhotoOnboardingModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        onExtractionComplete={handleExtractionComplete}
      />

      <AiPreviewTableModal
        isOpen={isAiPreviewOpen}
        onClose={() => setIsAiPreviewOpen(false)}
        onSuccess={handleClassCreated}
        extractionData={extractionResult}
      />
    </div>
  );
}
