"use client";

/**
 * Ruang Pintar — Student Academic Side Sheet (Academic Glass UI v1.2)
 *
 * STAGE UX-04: Student Academic Directory & Academic Health Monitoring
 * Slide-over Right Side Sheet (Fernly inspired) berukuran 420px Desktop / 380px Tablet
 * Memuat 6 Tab: Overview, Presensi, Tugas, Nilai, TP, Catatan Internal Guru.
 */

import React, { useState, useTransition } from "react";
import {
  X,
  Calendar,
  ClipboardList,
  Target,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  FileText,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Plus,
} from "lucide-react";
import {
  StudentAcademicDirectoryItemDTO,
  StudentAcademicHealthStatus,
} from "../domain/student-academic-directory-types";
import { createTeacherClassNoteAction } from "@/app/actions/teacher-note-actions";

export type SideSheetTab = "Overview" | "Presensi" | "Tugas" | "Nilai" | "TP" | "Catatan";

interface StudentAcademicSideSheetProps {
  student: StudentAcademicDirectoryItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SideSheetTab;
  penugasanId: string;
  rombelId: string;
}

export function StudentAcademicSideSheet({
  student,
  isOpen,
  onClose,
  initialTab = "Overview",
  penugasanId,
  rombelId,
}: StudentAcademicSideSheetProps) {
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [activeTab, setActiveTab] = useState<SideSheetTab>(initialTab);

  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  // Form state Catatan Internal
  const [noteJudul, setNoteJudul] = useState("");
  const [noteIsi, setNoteIsi] = useState("");
  const [noteKategori, setNoteKategori] = useState("AKADEMIK");
  const [noteUrgensi, setNoteUrgensi] = useState("SEDANG");
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [isPendingNote, startNoteTransition] = useTransition();
  const [noteFeedback, setNoteFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  if (!isOpen || !student) return null;

  // Preset quick note templates
  const quickTemplates = [
    "Belum mengumpulkan TP3",
    "Perlu pendampingan remedial",
    "Sering terlambat hadir",
    "Peningkatan nilai sangat signifikan",
  ];

  // Submit catatan internal guru
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteJudul.trim() || !noteIsi.trim()) return;

    startNoteTransition(async () => {
      const res = await createTeacherClassNoteAction({
        penugasan_mengajar_id: penugasanId,
        rombel_id: rombelId,
        siswa_id: student.siswa_id,
        judul: noteJudul.trim(),
        isi: noteIsi.trim(),
        kategori: noteKategori,
        tingkat_urgensi: noteUrgensi,
      });

      if (res.success) {
        setNoteFeedback({ success: true, message: res.message });
        student.catatan_list.unshift(res.data);
        setNoteJudul("");
        setNoteIsi("");
        setShowAddNoteForm(false);
      } else {
        setNoteFeedback({ success: false, message: res.message });
      }
    });
  };

  const tabs: SideSheetTab[] = ["Overview", "Presensi", "Tugas", "Nilai", "TP", "Catatan"];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <aside
          role="complementary"
          aria-label="Detail Siswa"
          className="w-screen max-w-[420px] sm:w-[380px] lg:w-[420px] pointer-events-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        >
          {/* Header Profil Siswa (Fernly Inspired) */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-mono font-bold text-base flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 overflow-hidden">
                  {student.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.foto_url}
                      alt={student.nama_lengkap}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {student.nama_lengkap
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {student.nama_lengkap}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>
                      {student.nisn
                        ? `NISN: ${student.nisn}`
                        : student.nis
                          ? `NIS: ${student.nis}`
                          : "Siswa"}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {student.rombel_nama}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup Panel Siswa"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Akademik Health Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl backdrop-blur-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Status Akademik
              </span>

              {student.health_status === "AMAN" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>🟢 Aman</span>
                </span>
              )}
              {student.health_status === "PERLU_PERHATIAN" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>🟡 Perlu Perhatian</span>
                </span>
              )}
              {student.health_status === "RISIKO_AKADEMIK" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span>🔴 Risiko Akademik</span>
                </span>
              )}
            </div>

            {/* Glass Segmented Tab Bar (6 Tabs) */}
            <div
              role="tablist"
              className="grid grid-cols-6 gap-1 p-1 rounded-xl backdrop-blur-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60"
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-label={`Tab ${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-400 shadow-xs scale-[1.02]"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content Tab */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW                                           */}
            {/* ========================================================= */}
            {activeTab === "Overview" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Indikator Pembelajaran
                </h4>

                <div className="space-y-3">
                  {/* Attendance Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Kehadiran Kelas
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                        {student.kehadiran_persen}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${student.kehadiran_persen}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                      <span>Hadir: {student.kehadiran_stats.hadir}</span>
                      <span>Sakit: {student.kehadiran_stats.sakit}</span>
                      <span>Izin: {student.kehadiran_stats.izin}</span>
                      <span className="text-rose-600 font-bold">
                        Alpha: {student.kehadiran_stats.alpha}
                      </span>
                    </div>
                  </div>

                  {/* Average Score Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-purple-500" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Rata-rata Nilai Asesmen
                        </span>
                      </div>
                      <span className="text-base font-mono font-bold text-purple-600 dark:text-purple-400">
                        {student.nilai_rata_rata || "-"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      Berdasarkan {student.nilai_detail.length} instrumen asesmen yang telah
                      dilaksanakan.
                    </p>
                  </div>

                  {/* Task Completion Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Penyelesaian Tugas
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                        {student.tugas_selesai} / {student.tugas_total} ({student.tugas_persen}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${student.tugas_persen}%` }}
                      />
                    </div>
                  </div>

                  {/* TP Completion Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Target Capaian TP
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {student.tp_selesai} / {student.tp_total} ({student.tp_persen}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${student.tp_persen}%` }}
                      />
                    </div>
                  </div>

                  {/* CBT Performance Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Performa Ujian CBT
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {student.cbt_stats.diikuti} / {student.cbt_stats.total_ujian} Ujian
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      Rata-rata Skor:{" "}
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {student.cbt_stats.rata_rata || "-"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: PRESENSI                                           */}
            {/* ========================================================= */}
            {activeTab === "Presensi" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Riwayat Kehadiran Sesi
                  </h4>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {student.presensi_detail.length} Sesi Tercatat
                  </span>
                </div>

                {student.presensi_detail.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <Calendar className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>Belum ada rekaman sesi presensi untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {student.presensi_detail.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {new Date(p.tanggal).toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {p.catatan ? (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
                              Alasan: {p.catatan}
                            </p>
                          ) : (
                            <p className="text-[10px] font-mono text-slate-400">
                              Presensi Sesi KBM
                            </p>
                          )}
                        </div>

                        <span
                          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full shrink-0 ${
                            p.status === "HADIR"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : p.status === "SAKIT"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                : p.status === "IZIN"
                                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: TUGAS                                              */}
            {/* ========================================================= */}
            {activeTab === "Tugas" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Daftar Tugas & Penyerahan
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {student.tugas_selesai}/{student.tugas_total} Selesai
                  </span>
                </div>

                {student.tugas_detail.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <ClipboardList className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>Belum ada tugas pembelajaran terbit di kelas ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {student.tugas_detail.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {t.tp_kode ? `Target: ${t.tp_kode}` : `Tugas #${idx + 1}`}
                            </span>
                            <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {t.judul}
                            </h5>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              t.status === "DIKUMPULKAN"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : t.status === "TERLAMBAT"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {t.status === "DIKUMPULKAN"
                              ? "Dikumpulkan"
                              : t.status === "TERLAMBAT"
                                ? "Terlambat"
                                : "Belum Kumpul"}
                          </span>
                        </div>

                        {t.tanggal_kumpul && (
                          <p className="text-[10px] font-mono text-slate-400">
                            Dikumpulkan:{" "}
                            {new Date(t.tanggal_kumpul).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: NILAI                                              */}
            {/* ========================================================= */}
            {activeTab === "Nilai" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Buku Nilai & Asesmen
                  </h4>
                  <span className="text-xs font-mono font-bold text-purple-600">
                    Rerata: {student.nilai_rata_rata || "-"}
                  </span>
                </div>

                {student.nilai_detail.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <Trophy className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>Belum ada asesmen yang dinilai untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {student.nilai_detail.map((n, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {n.kategori} • KKM {n.kkm}
                          </span>
                          <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {n.judul}
                          </h5>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-mono font-bold block ${
                              n.nilai !== null && n.nilai >= n.kkm
                                ? "text-emerald-600 dark:text-emerald-400"
                                : n.nilai !== null
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {n.nilai !== null ? n.nilai : "—"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {n.tercapai
                              ? "Tercapai"
                              : n.nilai !== null
                                ? "Remedial"
                                : "Belum dinilai"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: TP (TUJUAN PEMBELAJARAN MATRIX)                    */}
            {/* ========================================================= */}
            {activeTab === "TP" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Matriks Penguasaan TP
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    {student.tp_selesai}/{student.tp_total} Tercapai
                  </span>
                </div>

                {student.tp_matrix.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <Target className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>Belum ada Tujuan Pembelajaran yang dikonfigurasi.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {student.tp_matrix.map((tp, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
                          tp.tercapai
                            ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30"
                            : "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-[#2563EB] dark:text-blue-400">
                            {tp.kode}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              tp.tercapai
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {tp.tercapai ? "Tercapai ✓" : "Belum Tercapai"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {tp.deskripsi}
                        </p>

                        {tp.bukti && (
                          <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-0.5">
                            Bukti: {tp.bukti}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 6: CATATAN (TEACHER INTERNAL NOTES TIMELINE)          */}
            {/* ========================================================= */}
            {activeTab === "Catatan" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Catatan Internal Guru
                    </h4>
                    <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                      🔒 Rahasia • Tidak terlihat oleh siswa
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddNoteForm((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 text-xs font-mono font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Catatan Baru</span>
                  </button>
                </div>

                {/* Form Tambah Catatan Internal Baru */}
                {showAddNoteForm && (
                  <form
                    onSubmit={handleAddNote}
                    className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Tulis Catatan Pembinaan
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddNoteForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Batal
                      </button>
                    </div>

                    {/* Quick Template Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {quickTemplates.map((tpl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setNoteJudul(tpl);
                            setNoteIsi(`Siswa ${tpl}. Perlu koordinasi lebih lanjut.`);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-colors cursor-pointer"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Judul catatan (misal: Belum mengumpulkan TP3)..."
                        value={noteJudul}
                        onChange={(e) => setNoteJudul(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={noteKategori}
                        onChange={(e) => setNoteKategori(e.target.value)}
                        className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <option value="AKADEMIK">Akademik</option>
                        <option value="KEHADIRAN">Kehadiran</option>
                        <option value="PERILAKU">Perilaku</option>
                        <option value="UMUM">Umum</option>
                      </select>

                      <select
                        value={noteUrgensi}
                        onChange={(e) => setNoteUrgensi(e.target.value)}
                        className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <option value="RENDAH">Urgensi: Rendah</option>
                        <option value="SEDANG">Urgensi: Sedang</option>
                        <option value="TINGGI">Urgensi: Tinggi</option>
                        <option value="KRITIS">Urgensi: Kritis</option>
                      </select>
                    </div>

                    <div>
                      <textarea
                        rows={3}
                        placeholder="Rincian catatan dan rekomendasi tindakan..."
                        value={noteIsi}
                        onChange={(e) => setNoteIsi(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPendingNote}
                      className="w-full h-9 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isPendingNote ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Simpan Catatan Internal</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Timeline Catatan yang Ada */}
                {student.catatan_list.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <FileText className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>Belum ada catatan pembinaan internal untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {student.catatan_list.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {note.judul}
                          </h5>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              note.tingkat_urgensi === "KRITIS" || note.tingkat_urgensi === "TINGGI"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {note.tingkat_urgensi}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {note.isi}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                          <span>Oleh: {note.penulis_nama}</span>
                          <span>
                            {new Date(note.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
