"use client";

/**
 * Ruang Pintar — Class Detail & Management Workspace (/kelas-saya/[id])
 * Academic Glass UI
 *
 * Sesuai Spesifikasi:
 * - Navigasi 3 Tab Resmi: Ringkasan | Siswa | Pengaturan
 * - Tab Penilaian dialihkan ke menu global "Buku Nilai & Rapor" (/penilaian)
 * - Tab Ringkasan: Informasi kelas, Ringkasan Presensi Kelas (6 status dengan modal rincian),
 *   Tabel Materi, Tabel Tugas, dan Tabel Catatan Pertemuan (Jurnal KBM).
 * - Tab Siswa: Tabel murid lengkap dengan ringkasan presensi (H, I, S, A, D, T),
 *   jumlah tugas belum selesai, dan klik nama membuka riwayat presensi & tugas (SideSheet).
 * - Tab Pengaturan: Kode akses siswa, informasi resmi SK kurikulum, integrasi buku nilai, hak akses.
 */

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Sliders, GraduationCap, Clock, Layers } from "lucide-react";
import {
  TeacherClassWorkspaceDTO,
  LingkupMateriDTO,
  TujuanPembelajaranDTO,
  MateriPembelajaranDTO,
  AdministrasiPembelajaranDTO,
} from "../domain/learning-types";
import { Toast, ToastType } from "@/shared/components/ui/toast";
import { ClassSummaryTab } from "./class-summary-tab";
import { ClassStudentsTab } from "./class-students-tab";
import { ClassSettingsTab } from "./class-settings-tab";
import { CreateBABModal } from "./create-bab-modal";
import { EditBABModal } from "./edit-bab-modal";
import { CreateTPModal } from "./create-tp-modal";
import { EditTPModal } from "./edit-tp-modal";
import { CreateMateriModal } from "./create-materi-modal";
import { EditMateriModal } from "./edit-materi-modal";
import { CreateTugasModal } from "./create-tugas-modal";
import { CreateJurnalModal } from "./create-jurnal-modal";
import { EditJurnalModal } from "./edit-jurnal-modal";
import {
  deleteAdministrasiAction,
  deleteLingkupMateriAction,
  deleteMateriAction,
  deleteTugasAction,
  deleteTujuanPembelajaranAction,
} from "@/app/actions/learning-actions";
import {
  ClassAttendanceRecapDTO,
  SessionAttendanceHistoryItemDTO,
} from "@/modules/attendance/domain/attendance-types";
import { SessionAttendanceModal } from "@/modules/attendance/presentation/session-attendance-modal";
import { ensureAndGetTodaySessionAction } from "@/app/actions/class-session-actions";
import {
  DefinisiAsesmenDTO,
  ClassGradebookDTO,
} from "@/modules/assessment/domain/assessment-types";
import { ClassAssessmentTabView } from "@/modules/assessment/presentation/class-assessment-tab-view";
import { UjianCbtDTO } from "@/modules/cbt/domain/cbt-types";
import { ClassCbtTabView } from "@/modules/cbt/presentation/class-cbt-tab-view";
import { StudentAcademicDirectoryItemDTO } from "@/modules/student/domain/student-academic-directory-types";
import {
  StudentAcademicSideSheet,
  SideSheetTab,
} from "@/modules/student/presentation/student-academic-side-sheet";

export type WorkspaceTab =
  | "RINGKASAN"
  | "SISWA"
  | "PENGATURAN"
  // Deep-link / backward compatibility aliases:
  | "OVERVIEW"
  | "MATERI"
  | "TUGAS"
  | "CATATAN_KELAS"
  | "JURNAL"
  | "PRESENSI"
  | "PENILAIAN"
  | "CBT";

interface ClassWorkspaceViewProps {
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
  assessments?: DefinisiAsesmenDTO[];
  gradebook?: ClassGradebookDTO;
  exams?: UjianCbtDTO[];
  studentDirectory?: StudentAcademicDirectoryItemDTO[];
  activityFeed?: any[];
  joinCode?: string | null;
  initialTab?: WorkspaceTab;
}

export function ClassWorkspaceView({
  workspace,
  canManage,
  attendanceHistory = [],
  attendanceStats = {
    total_sesi_terjadwal: 0,
    total_sesi_selesai: 0,
    total_presensi_diambil: 0,
    rata_rata_kehadiran: 0,
  },
  attendanceRecap,
  assessments = [],
  gradebook,
  exams = [],
  studentDirectory = [],
  initialTab,
}: ClassWorkspaceViewProps) {
  const router = useRouter();

  // Normalisasi tab awal
  const rawTab = initialTab ? String(initialTab).toUpperCase() : "";
  const normalizedInitialTab: WorkspaceTab =
    rawTab === "SISWA"
      ? "SISWA"
      : rawTab === "PENGATURAN"
        ? "PENGATURAN"
        : rawTab === "PENILAIAN"
          ? "PENILAIAN"
          : rawTab === "CBT"
            ? "CBT"
            : "RINGKASAN";

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(normalizedInitialTab);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [, startTransition] = useTransition();

  const handleTabChange = (tabId: WorkspaceTab) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Modals state
  const [attendanceModalSesiId, setAttendanceModalSesiId] = useState<string | null>(null);
  const [isBABModalOpen, setIsBABModalOpen] = useState(false);
  const [tpModalTarget, setTpModalTarget] = useState<{ id: string; judul: string } | null>(null);
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [isTugasModalOpen, setIsTugasModalOpen] = useState(false);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [editBabTarget, setEditBabTarget] = useState<LingkupMateriDTO | null>(null);
  const [editTpTarget, setEditTpTarget] = useState<{
    tp: TujuanPembelajaranDTO;
    babJudul: string;
  } | null>(null);
  const [editMateriTarget, setEditMateriTarget] = useState<MateriPembelajaranDTO | null>(null);
  const [editJurnalTarget, setEditJurnalTarget] = useState<AdministrasiPembelajaranDTO | null>(
    null
  );

  // Student Side Sheet State
  const [selectedStudent, setSelectedStudent] = useState<StudentAcademicDirectoryItemDTO | null>(
    null
  );
  const [sideSheetTab, setSideSheetTab] = useState<SideSheetTab>("Overview");
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);

  const handleOpenStudentDetail = (
    student: StudentAcademicDirectoryItemDTO,
    tab: SideSheetTab = "Overview"
  ) => {
    setSelectedStudent(student);
    setSideSheetTab(tab);
    setIsSideSheetOpen(true);
  };

  const { penugasan, total_siswa, lingkup_materi } = workspace;

  const [isOpeningAttendance, setIsOpeningAttendance] = useState(false);

  const handleOpenSessionAttendance = async (sesiId?: string) => {
    if (sesiId && sesiId !== "NEW") {
      setAttendanceModalSesiId(sesiId);
      return;
    }

    setIsOpeningAttendance(true);
    try {
      const res = await ensureAndGetTodaySessionAction({
        penugasan_mengajar_id: penugasan.id,
        rombel_id: penugasan.rombel_id,
        mata_pelajaran_id: penugasan.mata_pelajaran_id,
      });

      if (res.success && res.data?.sessionId) {
        setAttendanceModalSesiId(res.data.sessionId);
        setToast({
          message: res.data.isNew
            ? "Sesi KBM hari ini berhasil dibuka. Silakan catat presensi siswa."
            : "Membuka presensi sesi KBM aktif.",
          type: "success",
        });
      } else if (attendanceHistory.length > 0) {
        setAttendanceModalSesiId(attendanceHistory[0].sesi_id);
        setToast({
          message: "Membuka presensi sesi pembelajaran terakhir.",
          type: "info",
        });
      } else {
        setToast({
          message: res.message || "Belum ada sesi pembelajaran yang dapat diabsen.",
          type: "error",
        });
      }
    } catch (err: any) {
      setToast({
        message: err.message || "Terjadi kesalahan saat membuka presensi sesi.",
        type: "error",
      });
    } finally {
      setIsOpeningAttendance(false);
    }
  };

  // HANYA TIGA TAB RESMI SESUAI SPESIFIKASI: Ringkasan | Siswa | Pengaturan
  const navTabs = [
    {
      id: "RINGKASAN" as const,
      label: "Ringkasan",
      icon: LayoutDashboard,
    },
    {
      id: "SISWA" as const,
      label: "Siswa",
      count: studentDirectory.length > 0 ? studentDirectory.length : total_siswa,
      icon: Users,
    },
    {
      id: "PENGATURAN" as const,
      label: "Pengaturan",
      icon: Sliders,
    },
  ];

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
      {/* 1. HERO CLASS BANNER                                     */}
      {/* ======================================================== */}
      <div className="rounded-[32px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden md:overflow-visible flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Sisi Kiri: Informasi Kelas */}
        <div className="space-y-3.5 z-10 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard"
              className="hover:text-blue-600 dark:hover:text-blue-400 text-xs font-mono text-slate-500 dark:text-slate-400 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-slate-300 dark:text-slate-600 text-xs">/</span>
            <Link
              href="/kelas-saya"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100/80 transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Kelas Saya</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>KBM Aktif</span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {penugasan.mata_pelajaran_nama}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/60 text-[#2563EB] dark:text-blue-400 font-mono font-bold text-xs">
                {penugasan.mata_pelajaran_kode}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-mono flex items-center flex-wrap gap-2 leading-relaxed">
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {penugasan.rombel_nama}
              </span>
              {penugasan.tingkat_nama && (
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  ({penugasan.tingkat_nama})
                </span>
              )}
              <span className="text-slate-400">•</span>
              <span>
                Guru:{" "}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {penugasan.guru_nama}
                </strong>
              </span>
              <span className="text-slate-400">•</span>
              <button
                type="button"
                onClick={() => handleTabChange("SISWA")}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>{total_siswa} Siswa</span>
              </button>
              <span className="text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {penugasan.jumlah_jam_minggu > 0 ? `${penugasan.jumlah_jam_minggu} JP` : "0 JP"}
                </span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {penugasan.semester_nama?.toLowerCase().startsWith("semester")
                  ? penugasan.semester_nama
                  : `Semester ${penugasan.semester_nama || "Ganjil"}`}{" "}
                • TA {penugasan.tahun_ajaran_nama}
              </span>
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Maskot Siswa 3D Pop-out */}
        <div className="relative shrink-0 w-60 sm:w-72 md:w-80 h-48 sm:h-60 md:h-64 mt-4 sm:-mt-24 md:-mt-28 -mb-6 sm:-mb-7 mx-auto md:mr-0 pointer-events-none select-none flex items-end justify-center z-20">
          <Image
            src="/images/illustrations/astronaut-students-3d.png"
            alt="Maskot Siswa Ruang Pintar 3D"
            fill
            sizes="(max-width: 768px) 240px, 320px"
            priority
            className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.35)]"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. NAVIGASI 3 TAB RESMI (Ringkasan | Siswa | Pengaturan)  */}
      {/* ======================================================== */}
      <div className="rounded-2xl sm:rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-blue-500/20 p-1.5 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              (tab.id === "RINGKASAN" &&
                (activeTab === "RINGKASAN" ||
                  activeTab === "OVERVIEW" ||
                  activeTab === "MATERI" ||
                  activeTab === "TUGAS" ||
                  activeTab === "CATATAN_KELAS" ||
                  activeTab === "JURNAL" ||
                  activeTab === "PRESENSI")) ||
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-mono tracking-tight transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm shadow-blue-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. KONTEN TAB                                            */}
      {/* ======================================================== */}

      {/* A. TAB RINGKASAN */}
      {(activeTab === "RINGKASAN" ||
        activeTab === "OVERVIEW" ||
        activeTab === "MATERI" ||
        activeTab === "TUGAS" ||
        activeTab === "CATATAN_KELAS" ||
        activeTab === "JURNAL" ||
        activeTab === "PRESENSI") && (
        <div className="animate-fade-up">
          <ClassSummaryTab
            workspace={workspace}
            canManage={canManage}
            attendanceHistory={attendanceHistory}
            attendanceStats={attendanceStats}
            attendanceRecap={attendanceRecap}
            studentDirectory={studentDirectory}
            onOpenCreateMateri={() => setIsMateriModalOpen(true)}
            onOpenEditMateri={(m) => setEditMateriTarget(m)}
            onOpenCreateTugas={() => setIsTugasModalOpen(true)}
            onOpenCreateJurnal={() => setIsJurnalModalOpen(true)}
            onOpenSessionAttendance={handleOpenSessionAttendance}
            isOpeningAttendance={isOpeningAttendance}
            onSelectStudent={(s) => handleOpenStudentDetail(s)}
            onSwitchToStudentsTab={() => handleTabChange("SISWA")}
          />
        </div>
      )}

      {/* B. TAB SISWA */}
      {activeTab === "SISWA" && (
        <div className="animate-fade-up">
          <ClassStudentsTab
            workspace={workspace}
            studentDirectory={studentDirectory}
            attendanceRecap={attendanceRecap}
            canManage={canManage}
            onSelectStudent={(s) => handleOpenStudentDetail(s)}
          />
        </div>
      )}

      {/* C. TAB PENGATURAN */}
      {activeTab === "PENGATURAN" && (
        <div className="animate-fade-up">
          <ClassSettingsTab workspace={workspace} canManage={canManage} />
        </div>
      )}

      {/* D. BACKWARD COMPATIBILITY: PENILAIAN (DEEP-LINK ONLY) */}
      {activeTab === "PENILAIAN" && gradebook && (
        <div className="animate-fade-up space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <span>
              Akses penilaian kelas telah dialihkan ke menu global{" "}
              <strong>Buku Nilai & Rapor</strong>.
            </span>
            <Link
              href={`/penilaian?penugasanId=${penugasan.id}`}
              className="font-bold underline ml-2"
            >
              Buka Modul Buku Nilai &rarr;
            </Link>
          </div>
          <ClassAssessmentTabView
            penugasanId={penugasan.id}
            canManage={canManage}
            assessments={assessments}
            gradebook={gradebook}
            lingkupMateriList={lingkup_materi}
            attendanceRecap={attendanceRecap}
            onRefresh={() => router.refresh()}
            onShowToast={(msg, type) => setToast({ message: msg, type })}
          />
        </div>
      )}

      {/* E. BACKWARD COMPATIBILITY: CBT (DEEP-LINK ONLY) */}
      {activeTab === "CBT" && (
        <div className="animate-fade-up">
          <ClassCbtTabView
            penugasanId={penugasan.id}
            sekolahId={penugasan.sekolah_id}
            mapelId={penugasan.mata_pelajaran_id}
            canManage={canManage}
            exams={exams}
            onRefresh={() => router.refresh()}
            onShowToast={(msg, type) => setToast({ message: msg, type })}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODALS & SHEETS REGISTRATION                          */}
      {/* ======================================================== */}
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

      <EditTPModal
        penugasanId={penugasan.id}
        babJudul={editTpTarget?.babJudul || ""}
        tp={editTpTarget?.tp || null}
        isOpen={!!editTpTarget}
        onClose={() => setEditTpTarget(null)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <CreateMateriModal
        penugasanId={penugasan.id}
        guruId={penugasan.guru_id}
        mapelId={penugasan.mata_pelajaran_id}
        lingkupMateriList={lingkup_materi}
        isOpen={isMateriModalOpen}
        onClose={() => setIsMateriModalOpen(false)}
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

      <CreateTugasModal
        penugasanId={penugasan.id}
        guruId={penugasan.guru_id}
        mapelId={penugasan.mata_pelajaran_id}
        lingkupMateriList={lingkup_materi}
        isOpen={isTugasModalOpen}
        onClose={() => setIsTugasModalOpen(false)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <CreateJurnalModal
        penugasanId={penugasan.id}
        guruId={penugasan.guru_id}
        isOpen={isJurnalModalOpen}
        onClose={() => setIsJurnalModalOpen(false)}
        nextPertemuan={workspace.administrasi_list.length + 1}
        lingkupMateriList={lingkup_materi}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      <EditJurnalModal
        penugasanId={penugasan.id}
        administrasi={editJurnalTarget}
        isOpen={!!editJurnalTarget}
        onClose={() => setEditJurnalTarget(null)}
        lingkupMateriList={lingkup_materi}
        onSuccess={(msg) => {
          setToast({ message: msg, type: "success" });
          router.refresh();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {attendanceModalSesiId && (
        <SessionAttendanceModal
          isOpen={true}
          onClose={() => setAttendanceModalSesiId(null)}
          sesiId={attendanceModalSesiId}
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            router.refresh();
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {/* Slide-over Right Side Sheet Murid (Riwayat Presensi & Tugas) */}
      <StudentAcademicSideSheet
        student={selectedStudent}
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        initialTab={sideSheetTab}
        penugasanId={penugasan.id}
        rombelId={penugasan.rombel_id}
      />
    </div>
  );
}
