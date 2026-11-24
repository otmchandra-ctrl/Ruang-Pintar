"use client";

/**
 * Ruang Pintar — M12 Class Session Attendance Modal (Academic Glass UI v1.2)
 *
 * STAGE UX-04.1: Attendance Workflow Optimization
 * Architecture:
 * - LIST VIEW = Lihat status (Compact rows 56px–72px max, 5-6 visible per mobile viewport)
 * - DETAIL VIEW = Ubah status (Bottom Sheet Editor, Mobile First)
 * - Quick Attendance: 1-Click "Tandai Semua Hadir"
 * - Compact Summary: Minimalist status counters (Hadir 25, Sakit 1, Izin 1, Alpha 1)
 * - Real Apple Glass Radio Buttons (backdrop-blur-xl, scale 1.02, 150ms transition)
 * - Sticky Search: [ Cari Nama / NISN ]
 * - Sticky Footer: "X siswa selesai", [Tutup], [Simpan Presensi]
 */

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Check, Search, Loader2, FileText, ChevronRight, MessageCircle } from "lucide-react";
import {
  getSessionAttendanceAction,
  saveSessionAttendanceAction,
} from "@/app/actions/attendance-actions";
import {
  AttendanceStatus,
  ClassSessionAttendanceDTO,
  SaveAttendanceItemInput,
  StudentAttendanceItemDTO,
} from "../domain/attendance-types";

interface SessionAttendanceModalProps {
  sesiId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function SessionAttendanceModal({
  sesiId,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: SessionAttendanceModalProps) {
  if (!isOpen || !sesiId) return null;

  return (
    <SessionAttendanceModalContent
      sesiId={sesiId}
      onClose={onClose}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

function SessionAttendanceModalContent({
  sesiId,
  onClose,
  onSuccess,
  onError,
}: {
  sesiId: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}) {
  const [sessionData, setSessionData] = useState<ClassSessionAttendanceDTO | null>(null);
  const [items, setItems] = useState<Record<string, { status: AttendanceStatus; catatan: string }>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [alasanKoreksi, setAlasanKoreksi] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Bottom Sheet Editor State (Detail View)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<AttendanceStatus>("HADIR");
  const [draftCatatan, setDraftCatatan] = useState<string>("");

  // Ambil data sesi dan daftar siswa saat modal dibuka
  useEffect(() => {
    let isMounted = true;

    getSessionAttendanceAction(sesiId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setSessionData(res.data);
          const initialMap: Record<string, { status: AttendanceStatus; catatan: string }> = {};
          res.data.daftar_siswa.forEach((s) => {
            initialMap[s.siswa_id] = {
              status: s.status,
              catatan: s.catatan || "",
            };
          });
          setItems(initialMap);
        } else {
          onError?.(res.message);
          onClose();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        onError?.(err instanceof Error ? err.message : "Gagal memuat data presensi sesi.");
        onClose();
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sesiId, onClose, onError]);

  // Buka Bottom Sheet Editor untuk siswa terpilih
  const handleOpenEditor = (siswaId: string) => {
    setEditingStudentId(siswaId);
    setDraftStatus(items[siswaId]?.status || "HADIR");
    setDraftCatatan(items[siswaId]?.catatan || "");
  };

  // Simpan perubahan dari Bottom Sheet Editor
  const handleSaveEditor = () => {
    if (!editingStudentId) return;
    setItems((prev) => ({
      ...prev,
      [editingStudentId]: {
        status: draftStatus,
        catatan: draftCatatan,
      },
    }));
    setEditingStudentId(null);
  };

  // Quick Action: Tandai Semua Hadir (1-Click)
  const handleMarkAllPresent = () => {
    if (!sessionData) return;
    setItems((prev) => {
      const updated = { ...prev };
      sessionData.daftar_siswa.forEach((s) => {
        updated[s.siswa_id] = {
          ...updated[s.siswa_id],
          status: "HADIR",
        };
      });
      return updated;
    });
  };

  const totalSiswa = sessionData?.daftar_siswa.length || 0;

  // Penghitung Status Ringkas (Attendance Summary)
  const summaryCounts = useMemo(() => {
    const counts = {
      HADIR: 0,
      SAKIT: 0,
      IZIN: 0,
      ALPHA: 0,
      DISPENSASI: 0,
      TERLAMBAT: 0,
    };
    if (!sessionData) return counts;
    sessionData.daftar_siswa.forEach((s) => {
      const st = items[s.siswa_id]?.status || "HADIR";
      if (st in counts) {
        counts[st as keyof typeof counts]++;
      }
    });
    return counts;
  }, [sessionData, items]);

  // Status Toggle Semua Hadir (State ON jika seluruh siswa HADIR, OFF jika ada minimal 1 siswa tidak HADIR)
  const isAllPresent = useMemo(() => {
    return totalSiswa > 0 && summaryCounts.HADIR === totalSiswa;
  }, [totalSiswa, summaryCounts]);

  const handleToggleAllPresent = () => {
    if (!sessionData) return;
    if (!isAllPresent) {
      handleMarkAllPresent();
    }
  };

  // Filter siswa berdasarkan input pencarian
  const filteredStudents = useMemo(() => {
    if (!sessionData) return [];

    const q = searchQuery.toLowerCase().trim();
    const list = sessionData.daftar_siswa.filter((s) => {
      if (!q) return true;
      return (
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
      );
    });

    list.sort((a, b) => (a.nomor_absen || 999) - (b.nomor_absen || 999));
    return list;
  }, [sessionData, searchQuery]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData) return;

    const payloadItems: SaveAttendanceItemInput[] = sessionData.daftar_siswa.map((s) => ({
      siswa_id: s.siswa_id,
      penempatan_rombel_id: s.penempatan_rombel_id,
      status: items[s.siswa_id]?.status || "HADIR",
      catatan: items[s.siswa_id]?.catatan || null,
    }));

    startTransition(async () => {
      const res = await saveSessionAttendanceAction({
        sesi_kelas_id: sessionData.sesi_id,
        sekolah_id: sessionData.sekolah_id,
        items: payloadItems,
        alasan_koreksi: alasanKoreksi.trim() || undefined,
      });

      if (res.success) {
        onSuccess?.(res.message);
        onClose();
      } else {
        onError?.(res.message);
      }
    });
  };

  // Format tanggal lengkap: "Selasa, 06 Oktober 2026"
  const formattedDateFull = useMemo(() => {
    if (!sessionData) return "";
    const d = new Date(sessionData.tanggal);
    const dayName = d.toLocaleDateString("id-ID", { weekday: "long" });
    const dayNum = String(d.getDate()).padStart(2, "0");
    const monthLong = d.toLocaleDateString("id-ID", { month: "long" });
    const year = d.getFullYear();
    const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const capMonth = monthLong.charAt(0).toUpperCase() + monthLong.slice(1);
    return `${capDay}, ${dayNum} ${capMonth} ${year}`;
  }, [sessionData]);

  // Data siswa yang sedang diedit di Bottom Sheet
  const activeStudent = useMemo(() => {
    if (!editingStudentId || !sessionData) return null;
    return sessionData.daftar_siswa.find((s) => s.siswa_id === editingStudentId) || null;
  }, [editingStudentId, sessionData]);

  // Bagikan Rekap Presensi ke WhatsApp (Grup Kelas / Wali Murid)
  const handleShareWhatsAppRecap = () => {
    if (!sessionData) return;
    const absentees = sessionData.daftar_siswa
      .filter((s) => (items[s.siswa_id]?.status || "HADIR") !== "HADIR")
      .map((s) => ({
        nama: s.nama_lengkap,
        status: items[s.siswa_id]?.status || "HADIR",
        catatan: items[s.siswa_id]?.catatan || undefined,
      }));

    let msg = `📋 *LAPORAN PRESENSI KELAS*\n`;
    msg += `─────────────────────────\n`;
    msg += `🏫 Kelas: *${sessionData.rombel_nama}*\n`;
    msg += `📚 Mapel: *${sessionData.mata_pelajaran_nama}*\n`;
    msg += `📅 Tanggal: *${formattedDateFull}*\n`;
    if (sessionData.guru_nama) msg += `👨‍🏫 Guru: *${sessionData.guru_nama}*\n`;
    msg += `─────────────────────────\n`;
    msg += `📊 *Ringkasan Kehadiran:*\n`;
    msg += `• Total: *${totalSiswa} Siswa*\n`;
    msg += `• Hadir: *${summaryCounts.HADIR}*\n`;
    if (summaryCounts.SAKIT > 0) msg += `• Sakit: *${summaryCounts.SAKIT}*\n`;
    if (summaryCounts.IZIN > 0) msg += `• Izin: *${summaryCounts.IZIN}*\n`;
    if (summaryCounts.ALPHA > 0) msg += `• Alpha: *${summaryCounts.ALPHA}*\n`;
    if (summaryCounts.DISPENSASI > 0) msg += `• Dispensasi: *${summaryCounts.DISPENSASI}*\n`;
    if (summaryCounts.TERLAMBAT > 0) msg += `• Terlambat: *${summaryCounts.TERLAMBAT}*\n`;

    if (absentees.length > 0) {
      msg += `\n⚠️ *Daftar Siswa Tidak Hadir / Keterangan:*\n`;
      absentees.forEach((a, i) => {
        const note = a.catatan ? ` (${a.catatan})` : "";
        msg += `${i + 1}. *${a.nama}* — ${a.status}${note}\n`;
      });
    } else {
      msg += `\n✨ *Alhamdulillah, seluruh siswa hadir lengkap.*\n`;
    }

    msg += `\n_Dicatat resmi via Ruang Pintar_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Kirim Pengingat WhatsApp Langsung ke Wali Siswa
  const handleSendStudentWa = (
    student: StudentAttendanceItemDTO,
    overrideStatus?: AttendanceStatus,
    overrideCatatan?: string
  ) => {
    if (!sessionData) return;
    const st = overrideStatus || items[student.siswa_id]?.status || "HADIR";
    const cat =
      overrideCatatan !== undefined ? overrideCatatan : items[student.siswa_id]?.catatan || "";

    const greeting = student.nama_wali ? `Bapak/Ibu ${student.nama_wali}` : "Bapak/Ibu Wali Murid";
    let msg = `Assalamu'alaikum Wr. Wb. / Salam Sejahtera,\n`;
    msg += `Yth. ${greeting} dari ananda *${student.nama_lengkap}*,\n\n`;
    msg += `Menginformasikan bahwa pada pembelajaran hari ini:\n`;
    msg += `📅 *${formattedDateFull}*\n`;
    msg += `🏫 Kelas: *${sessionData.rombel_nama}*\n`;
    msg += `📚 Mapel: *${sessionData.mata_pelajaran_nama}*\n`;
    msg += `📌 Status Kehadiran: *${st}*${cat ? ` (${cat})` : ""}\n\n`;
    msg += `Mohon konfirmasi atau hubungi guru jika terdapat kendala atau surat keterangan. Terima kasih atas kerja samanya.\n\n`;
    msg += `Wassalamu'alaikum Wr. Wb.\n`;
    if (sessionData.guru_nama) {
      msg += `— *${sessionData.guru_nama}* (Guru Pengampu)`;
    }

    let url = "";
    if (student.telepon_wali) {
      let clean = student.telepon_wali.replace(/[^0-9]/g, "");
      if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
      } else if (!clean.startsWith("62") && clean.length >= 9) {
        clean = "62" + clean;
      }
      url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    }

    window.open(url, "_blank");
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden max-w-xl h-[92vh] sm:h-auto sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* ========================================================= */}
        {/* HEADER: Presensi Kelas, Mapel, Rombel • Tanggal, Tutup     */}
        {/* ========================================================= */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 block">
              Presensi Kelas
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight truncate">
              {sessionData ? sessionData.mata_pelajaran_nama : "Memuat Sesi..."}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {sessionData?.rombel_nama || "Kelas"}
              </span>
              <span>•</span>
              <span>{formattedDateFull}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-16 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#2563EB] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Memuat lembar presensi siswa...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* ========================================================= */}
            {/* AREA RINGKASAN PRESENSI (MOBILE UX REFINEMENT)           */}
            {/* Baris 1: Total Siswa                                      */}
            {/* Baris 2: [ Toggle Semua Hadir ]  •  H S I A di sampingnya  */}
            {/* Tinggi ultra-kompak ~46px, density efisien                */}
            {/* ========================================================= */}
            <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-1.5 shrink-0">
              {/* Baris 1: Total Siswa & Aksi WhatsApp */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 leading-tight">
                  {totalSiswa} Siswa
                </div>
                <button
                  type="button"
                  onClick={handleShareWhatsAppRecap}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Bagikan Ringkasan Presensi ke Grup WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Kirim Rekap WA</span>
                </button>
              </div>

              {/* Baris 2: [ Toggle Semua Hadir ] di samping H S I A */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAllPresent}
                  aria-label="Toggle Semua Hadir"
                  onClick={handleToggleAllPresent}
                  className="inline-flex items-center gap-2 cursor-pointer group select-none shrink-0"
                >
                  <div
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAllPresent ? "bg-[#2563EB]" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isAllPresent ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                    Semua Hadir
                  </span>
                </button>

                {/* Counter H • S • I • A • D • T di samping kanan */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono leading-tight shrink-0 flex-wrap justify-end">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    H{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {summaryCounts.HADIR}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-sans">•</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    S{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {summaryCounts.SAKIT}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-sans">•</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    I{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {summaryCounts.IZIN}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-sans">•</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    A{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {summaryCounts.ALPHA}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-sans">•</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    D{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {summaryCounts.DISPENSASI}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 font-sans">•</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    T{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {summaryCounts.TERLAMBAT}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* STEP 6: STICKY SEARCH: [ Cari Nama / NISN ]               */}
            {/* ========================================================= */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-5 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Nama / NISN"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* STEP 2 & STEP 8: COMPACT STUDENT ROWS (56px–72px max)      */}
            {/* LIST VIEW = Lihat Status                                  */}
            {/* ========================================================= */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-2.5">
              {filteredStudents.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Tidak ada siswa yang sesuai pencarian.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 pb-2">
                  {filteredStudents.map((s) => {
                    const currentStatus = items[s.siswa_id]?.status || "HADIR";
                    const currentCatatan = items[s.siswa_id]?.catatan || "";
                    const isAbsent = currentStatus !== "HADIR";

                    return (
                      <div
                        key={s.siswa_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenEditor(s.siswa_id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleOpenEditor(s.siswa_id);
                          }
                        }}
                        aria-label={`Ubah presensi ${s.nama_lengkap}`}
                        className={`w-full text-left h-[60px] px-3.5 py-2 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group select-none ${
                          isAbsent
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/50 hover:bg-amber-100/60 dark:hover:bg-amber-950/30"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {/* Siswa Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-slate-400 w-5 shrink-0">
                              {s.nomor_absen ? String(s.nomor_absen).padStart(2, "0") : "—"}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {s.nama_lengkap}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 ml-7 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {s.nisn || s.nis || "Siswa"}
                            </span>
                            {currentCatatan && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 truncate max-w-[140px] italic">
                                • {currentCatatan}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Pill & WA & Chevron */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAbsent && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendStudentWa(s);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                              title={
                                s.telepon_wali
                                  ? `Kirim WA ke Wali (${s.telepon_wali})`
                                  : "Kirim WA ke Wali Murid"
                              }
                              aria-label={`Kirim WA ke Wali ${s.nama_lengkap}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {currentStatus === "HADIR" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-semibold">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓
                              </span>
                              <span>Hadir</span>
                            </span>
                          )}
                          {currentStatus === "SAKIT" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-mono font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>Sakit</span>
                            </span>
                          )}
                          {currentStatus === "IZIN" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-mono font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>Izin</span>
                            </span>
                          )}
                          {currentStatus === "ALPHA" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-mono font-semibold">
                              <span className="text-rose-600 dark:text-rose-400 font-bold">✕</span>
                              <span>Alpha</span>
                            </span>
                          )}
                          {currentStatus === "DISPENSASI" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-mono font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span>Dispensasi</span>
                            </span>
                          )}
                          {currentStatus === "TERLAMBAT" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-mono font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                              <span>Terlambat</span>
                            </span>
                          )}

                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* STEP 7: STICKY FOOTER: 27 siswa selesai | [Tutup] | [Simpan] */}
            {/* ========================================================= */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky bottom-0 z-20 space-y-2 shrink-0">
              {/* Alasan Koreksi jika sesi sudah pernah diabsen sebelumnya */}
              {sessionData?.sudah_diabsen && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    value={alasanKoreksi}
                    onChange={(e) => setAlasanKoreksi(e.target.value)}
                    placeholder="Alasan koreksi (opsional)..."
                    className="w-full h-8 px-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {totalSiswa} siswa selesai
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    aria-label="Simpan Presensi Kelas"
                    className="h-11 px-5 rounded-xl bg-[#2563EB] hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] text-white text-xs sm:text-sm font-mono font-bold shadow-[0_4px_14px_rgba(37,99,235,0.10)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.16)] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Simpan Presensi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3 & STEP 4: BOTTOM SHEET EDITOR (Detail View)        */}
        {/* Real Apple Glass Radio Buttons & Catatan                   */}
        {/* ========================================================= */}
        {editingStudentId && activeStudent && (
          <div className="absolute inset-0 z-30 bg-slate-950/40 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
            <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl border-t border-x border-slate-200/80 dark:border-slate-800 p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-4 max-h-[90%] overflow-y-auto">
              {/* Handle Bar */}
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />

              {/* Header Bottom Sheet */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                    {activeStudent.nama_lengkap}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeStudent.nisn || activeStudent.nis || "Siswa"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingStudentId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Tutup Editor"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status Presensi Title */}
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status Presensi
              </div>

              {/* REAL GLASS RADIO BUTTONS (Apple Glass Style, backdrop-blur-xl, scale 1.02, 150ms) */}
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                role="radiogroup"
                aria-label="Status Presensi"
              >
                {/* HADIR */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={draftStatus === "HADIR"}
                  onClick={() => setDraftStatus("HADIR")}
                  className={`h-13 px-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 backdrop-blur-xl cursor-pointer ${
                    draftStatus === "HADIR"
                      ? "bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/50 dark:border-emerald-400/50 text-emerald-900 dark:text-emerald-200 shadow-[0_4px_16px_rgba(16,185,129,0.18)] scale-[1.02]"
                      : "bg-white/45 dark:bg-slate-800/45 border border-white/60 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono">Hadir</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      draftStatus === "HADIR"
                        ? "border-emerald-600 dark:border-emerald-400 bg-emerald-600 dark:bg-emerald-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {draftStatus === "HADIR" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* SAKIT */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={draftStatus === "SAKIT"}
                  onClick={() => setDraftStatus("SAKIT")}
                  className={`h-13 px-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 backdrop-blur-xl cursor-pointer ${
                    draftStatus === "SAKIT"
                      ? "bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/50 dark:border-amber-400/50 text-amber-900 dark:text-amber-200 shadow-[0_4px_16px_rgba(245,158,11,0.18)] scale-[1.02]"
                      : "bg-white/45 dark:bg-slate-800/45 border border-white/60 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono">Sakit</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      draftStatus === "SAKIT"
                        ? "border-amber-600 dark:border-amber-400 bg-amber-600 dark:bg-amber-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {draftStatus === "SAKIT" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* IZIN */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={draftStatus === "IZIN"}
                  onClick={() => setDraftStatus("IZIN")}
                  className={`h-13 px-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 backdrop-blur-xl cursor-pointer ${
                    draftStatus === "IZIN"
                      ? "bg-blue-500/15 dark:bg-blue-500/25 border border-blue-500/50 dark:border-blue-400/50 text-blue-900 dark:text-blue-200 shadow-[0_4px_16px_rgba(59,130,246,0.18)] scale-[1.02]"
                      : "bg-white/45 dark:bg-slate-800/45 border border-white/60 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono">Izin</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      draftStatus === "IZIN"
                        ? "border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {draftStatus === "IZIN" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* ALPHA */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={draftStatus === "ALPHA"}
                  onClick={() => setDraftStatus("ALPHA")}
                  className={`h-13 px-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 backdrop-blur-xl cursor-pointer ${
                    draftStatus === "ALPHA"
                      ? "bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/50 dark:border-rose-400/50 text-rose-900 dark:text-rose-200 shadow-[0_4px_16px_rgba(244,63,94,0.18)] scale-[1.02]"
                      : "bg-white/45 dark:bg-slate-800/45 border border-white/60 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono">Alpha</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      draftStatus === "ALPHA"
                        ? "border-rose-600 dark:border-rose-400 bg-rose-600 dark:bg-rose-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {draftStatus === "ALPHA" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* DISPENSASI */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={draftStatus === "DISPENSASI"}
                  onClick={() => setDraftStatus("DISPENSASI")}
                  className={`h-13 px-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 backdrop-blur-xl cursor-pointer ${
                    draftStatus === "DISPENSASI"
                      ? "bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/50 dark:border-purple-400/50 text-purple-900 dark:text-purple-200 shadow-[0_4px_16px_rgba(168,85,247,0.18)] scale-[1.02]"
                      : "bg-white/45 dark:bg-slate-800/45 border border-white/60 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono">Dispensasi</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      draftStatus === "DISPENSASI"
                        ? "border-purple-600 dark:border-purple-400 bg-purple-600 dark:bg-purple-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {draftStatus === "DISPENSASI" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>

                {/* TERLAMBAT */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={draftStatus === "TERLAMBAT"}
                  onClick={() => setDraftStatus("TERLAMBAT")}
                  className={`h-13 px-3.5 rounded-2xl flex items-center justify-between transition-all duration-150 backdrop-blur-xl cursor-pointer ${
                    draftStatus === "TERLAMBAT"
                      ? "bg-orange-500/15 dark:bg-orange-500/25 border border-orange-500/50 dark:border-orange-400/50 text-orange-900 dark:text-orange-200 shadow-[0_4px_16px_rgba(249,115,22,0.18)] scale-[1.02]"
                      : "bg-white/45 dark:bg-slate-800/45 border border-white/60 dark:border-white/10 shadow-xs text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono">Terlambat</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      draftStatus === "TERLAMBAT"
                        ? "border-orange-600 dark:border-orange-400 bg-orange-600 dark:bg-orange-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {draftStatus === "TERLAMBAT" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              </div>

              {/* CATATAN / ALASAN */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  Catatan
                </label>
                <textarea
                  rows={2}
                  value={draftCatatan}
                  onChange={(e) => setDraftCatatan(e.target.value)}
                  placeholder="Tulis alasan..."
                  className="w-full min-h-[50px] p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] resize-none"
                />
              </div>

              {/* NOTIFIKASI WALI VIA WHATSAPP (JIKA TIDAK HADIR) */}
              {draftStatus !== "HADIR" && (
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                      Hubungi Wali Murid
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                      {activeStudent.nama_wali ? `Wali: ${activeStudent.nama_wali}` : "Wali Murid"}{" "}
                      • {activeStudent.telepon_wali || "Nomor belum tersimpan"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendStudentWa(activeStudent, draftStatus, draftCatatan)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              )}

              {/* BOTTOM SHEET FOOTER: [Simpan] */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  className="w-full h-11 sm:h-12 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-mono font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
