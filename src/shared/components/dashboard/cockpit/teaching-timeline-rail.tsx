"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  PlayCircle,
  ChevronRight,
  Bell,
  Loader2,
  BookOpen,
  Clock,
} from "lucide-react";
import { MergedScheduleBlock } from "@/modules/schedule/domain/schedule-merger";
import { ClassSessionDTO } from "@/modules/schedule/domain/schedule-types";
import { AnnouncementItem } from "@/modules/communication/domain/communication-types";
import { SessionAttendanceModal } from "@/modules/attendance/presentation/session-attendance-modal";
import { Toast, ToastType } from "@/shared/components/ui/toast";
import { ensureAndGetTodaySessionAction } from "@/app/actions/class-session-actions";
import { TeacherLiveBadge } from "./teacher-live-badge";

export interface UpcomingCalendarEvent {
  id: string;
  judul: string;
  tanggal_mulai: Date | string;
  tipe_event?: string;
}

interface TeachingTimelineRailProps {
  mergedBlocks: MergedScheduleBlock[];
  actualSessions: ClassSessionDTO[];
  announcements?: AnnouncementItem[];
  upcomingEvents?: UpcomingCalendarEvent[];
  badgeOverride?: string;
  currentTimeOverride?: Date;
}

export function TeachingTimelineRail({
  mergedBlocks,
  actualSessions,
  announcements = [],
  upcomingEvents = [],
  badgeOverride,
  currentTimeOverride,
}: TeachingTimelineRailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [attendanceModalSesiId, setAttendanceModalSesiId] = useState<string | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [pendingBlockKey, setPendingBlockKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Status sesi aktif & waktu dinamis (auto-update setiap menit)
  const [currentTime, setCurrentTime] = useState<Date>(() => currentTimeOverride || new Date());

  React.useEffect(() => {
    if (currentTimeOverride) return;

    const update = () => setCurrentTime(new Date());

    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let intervalId: NodeJS.Timeout | undefined;
    const timeoutId = setTimeout(
      () => {
        update();
        intervalId = setInterval(update, 60000);
      },
      Math.max(msToNextMinute, 1000)
    );

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentTimeOverride]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const blocksWithStatus = mergedBlocks.map((block) => {
    const startM = parseTimeToMinutes(block.jam_mulai);
    const endM = parseTimeToMinutes(block.jam_selesai);
    const isCurrent = currentMinutes >= startM && currentMinutes <= endM;
    const isPast = currentMinutes > endM;
    const isFuture = currentMinutes < startM;

    // Cek sesi aktual
    const actual = actualSessions.find(
      (s) => s.rombel_id === block.rombel_id && s.mata_pelajaran_id === block.mata_pelajaran_id
    );

    return {
      ...block,
      isCurrent,
      isPast,
      isFuture,
      actualSessionId: actual?.id,
      actualStatus: actual?.status || (isPast ? "SELESAI" : "TERJADWAL"),
    };
  });

  const handleQuickAttendance = async (
    block: MergedScheduleBlock & { actualSessionId?: string }
  ) => {
    if (block.actualSessionId) {
      setAttendanceModalSesiId(block.actualSessionId);
      setIsAttendanceModalOpen(true);
      return;
    }

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
      setToast({ message: err.message || "Gagal menginisialisasi sesi kelas.", type: "error" });
    } finally {
      setPendingBlockKey(null);
    }
  };

  // Tentukan kartu hero aktif:
  // 1. Jika ada sesi yang sedang berlangsung (isCurrent), jadikan activeBlock.
  // 2. Jika tidak ada yang berlangsung, cari sesi mendatang pertama (isFuture).
  // 3. Jika semua sesi sudah selesai (isPast semua), jadikan sesi pertama sebagai activeBlock dengan badge "SEMUA SESI SELESAI".
  const allPast = blocksWithStatus.length > 0 && blocksWithStatus.every((b) => b.isPast);
  const activeBlock =
    blocksWithStatus.find((b) => b.isCurrent) ||
    blocksWithStatus.find((b) => b.isFuture) ||
    blocksWithStatus[0];
  const otherBlocks = blocksWithStatus.filter((b) => b.key !== activeBlock?.key);

  const getActiveBadgeLabel = () => {
    if (activeBlock?.isCurrent) return "Sedang Berlangsung";
    if (allPast) return "Semua Sesi Selesai";
    if (activeBlock?.isFuture) return "Sesi Berikutnya";
    return "Terjadwal";
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Card Linimasa Jadwal Mengajar Hari Ini (Floating Glass Panel) */}
      <div className="rounded-[28px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/75 dark:border-white/15 p-5 sm:p-6 shadow-[0_20px_50px_rgba(37,99,235,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Jadwal Mengajar
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {mergedBlocks.length > 0
                ? `${mergedBlocks.length} sesi mengajar hari ini`
                : "Tidak ada jadwal hari ini"}
            </span>
          </div>

          <TeacherLiveBadge override={badgeOverride} />
        </div>

        {/* Timeline Items */}
        {mergedBlocks.length === 0 ? (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/30 dark:from-blue-950/40 dark:via-slate-900/70 dark:to-blue-900/30 border border-dashed border-blue-200/80 dark:border-blue-500/30 text-center space-y-2">
            <CalendarIcon className="h-8 w-8 text-blue-500/70 dark:text-blue-400 mx-auto" />
            <h4 className="font-mono text-xs font-bold text-slate-800 dark:text-white">
              Tidak Ada Jadwal Mengajar Hari Ini
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Manfaatkan waktu luang untuk menyusun modul ajar, asesmen formatif, atau evaluasi
              jurnal KBM.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 relative pl-4 border-l-2 border-dashed border-blue-200 dark:border-slate-700">
            {/* Sesi Utama / Aktif (Tampilan Hero Gradient Biru Solid sesuai Mockup & Desain Kanonikal) */}
            {activeBlock && (
              <div className="relative group">
                {/* Timeline Dot Indicator */}
                <div className="absolute -left-[23px] top-4 h-3.5 w-3.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900 shadow-sm" />

                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-blue-500/20 dark:shadow-[0_0_25px_rgba(37,99,235,0.35)] space-y-3 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                        {getActiveBadgeLabel()}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold line-clamp-1 text-white">
                        {activeBlock.mata_pelajaran_nama}
                      </h4>
                      <p className="text-xs text-blue-100 font-medium">
                        Kelas {activeBlock.rombel_nama} • {activeBlock.ruangan || "Ruang Kelas"}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-white shrink-0">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-blue-100 font-mono font-medium text-xs">
                    <Clock className="h-3.5 w-3.5 text-blue-200" />
                    <span>
                      {activeBlock.jam_mulai} - {activeBlock.jam_selesai}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between gap-2">
                    <Link
                      href={`/kelas-saya/${activeBlock.penugasan_mengajar_id}?tab=PRESENSI`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold text-xs transition-all backdrop-blur-sm border border-white/20"
                      title="Masuk Kelas"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
                      <span>Masuk Kelas</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleQuickAttendance(activeBlock)}
                      disabled={pendingBlockKey === activeBlock.key}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 active:bg-blue-100 text-[#2563EB] font-bold text-xs shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Presensi Sesi Ini"
                    >
                      {pendingBlockKey === activeBlock.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5 text-[#2563EB]" />
                      )}
                      <span>Presensi Sesi Ini</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sesi-sesi Lainnya (Tampilan Soft Neutral Card) */}
            {otherBlocks.map((block) => (
              <div key={block.key} className="relative group">
                <div className="absolute -left-[21px] top-3.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900" />

                <div className="p-3.5 rounded-2xl bg-white/80 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 transition-all flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {block.mata_pelajaran_nama}
                      </h5>
                      {block.total_jp && block.total_jp > 1 && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                          {block.total_jp} JP
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Kelas {block.rombel_nama} • {block.ruangan || "Ruang Kelas"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <div className="text-left sm:text-right font-mono">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                        {block.jam_mulai}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        s/d {block.jam_selesai}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/kelas-saya/${block.penugasan_mengajar_id}?tab=PRESENSI`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors"
                        title="Masuk Kelas"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleQuickAttendance(block)}
                        disabled={pendingBlockKey === block.key}
                        className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-300 font-mono font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Presensi Cepat"
                      >
                        {pendingBlockKey === block.key ? (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
                        ) : (
                          <PlayCircle className="h-3 w-3" />
                        )}
                        <span>Presensi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Card Agenda & Pengumuman Sekolah (Glass Surface) */}
      <div className="rounded-[28px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[20px] border border-white/75 dark:border-white/15 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Agenda & Pengumuman
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Kegiatan akademik dan informasi resmi sekolah
            </span>
          </div>

          <Link
            href="/kalender-akademik"
            className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Event Items */}
        {upcomingEvents.length > 0 || announcements.length > 0 ? (
          <div className="space-y-3">
            {/* Real Calendar Events */}
            {upcomingEvents.map((evt) => {
              const evtDate = new Date(evt.tanggal_mulai);
              return (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-blue-50/50 dark:bg-gradient-to-r dark:from-slate-900/80 dark:to-blue-950/40 dark:hover:to-blue-900/50 border border-slate-200/70 dark:border-blue-500/20 transition-all flex items-center gap-3 shadow-2xs"
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs relative overflow-hidden">
                    <CalendarIcon className="h-5 w-5 text-cyan-200" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {evt.judul}
                    </h5>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {evtDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {evt.tipe_event ? ` • ${evt.tipe_event}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Official Announcements */}
            {announcements.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="p-3 rounded-2xl bg-slate-50/80 hover:bg-blue-50/50 dark:bg-gradient-to-r dark:from-slate-900/80 dark:to-blue-950/40 dark:hover:to-blue-900/50 border border-slate-200/70 dark:border-blue-500/20 transition-all flex items-center gap-3 shadow-2xs"
              >
                <div className="h-11 w-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Bell className="h-5 w-5 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {ann.judul}
                  </h5>
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(ann.dipublikasikan_pada || ann.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-7 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-blue-500/10 text-center flex flex-col items-center justify-center space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shadow-2xs">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Belum Ada Agenda Terdekat
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Kalender akademik sekolah belum memiliki jadwal kegiatan mendatang.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Session Attendance Modal (Fast-Track 1-Click Marking) */}
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

      {/* 4. Feedback Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
