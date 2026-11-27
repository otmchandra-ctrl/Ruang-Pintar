import * as React from "react";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { AuthenticatedUser } from "@/shared/infrastructure/auth/auth-service";
import { BaseRole } from "@/shared/infrastructure/authorization/types";
import { TeacherDashboardData, TeacherFacade } from "@/modules/teacher/application/teacher-facade";
import { scheduleService } from "@/modules/schedule/application/schedule-service";
import { classSessionService } from "@/modules/schedule/application/class-session-service";
import { CommunicationService } from "@/modules/communication/application/communication-service";
import { AnnouncementItem } from "@/modules/communication/domain/communication-types";
import {
  ClassSessionDTO,
  HariBelajar,
  ScheduleEntryDTO,
} from "@/modules/schedule/domain/schedule-types";
import {
  mergeConsecutiveScheduleEntries,
  MergedScheduleBlock,
} from "@/modules/schedule/domain/schedule-merger";
import { assessmentService } from "@/modules/assessment/application/assessment-service";
import { TrialBanner } from "@/modules/ai-assistant/presentation/trial-banner";
import { ManualCreateClassModal } from "@/modules/learning/presentation/manual-create-class-modal";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { PerformanceBarChart, ClassPerformanceItem } from "../cockpit/performance-bar-chart";
import { TeachingTimelineRail, UpcomingCalendarEvent } from "../cockpit/teaching-timeline-rail";
import { TeacherHeroActions } from "../cockpit/teacher-hero-actions";
import { TeacherTrialPill } from "../cockpit/teacher-trial-pill";
import { TeacherKpiGrid } from "../cockpit/teacher-kpi-grid";
import { TeacherOnboardingWizard } from "../cockpit/teacher-onboarding-wizard";
import { TeacherFirstClassSetupModal } from "../cockpit/teacher-first-class-setup-modal";
import { checkPermission } from "@/shared/infrastructure/authorization/authz-guard";
import { teacherOnboardingService } from "@/modules/teacher/application/teacher-onboarding-service";
import { TeacherCompactHeader } from "../cockpit/teacher-compact-header";
import { TeacherAttendanceCard } from "../cockpit/teacher-attendance-card";
import {
  getHariBelajarInTimezone,
  getCurrentHHMMInTimezone,
  getStartOfDayInTimezone,
} from "@/shared/lib/date-utils";

export interface TeacherDashboardProps {
  user: AuthenticatedUser;
  initialData?: TeacherDashboardData;
  initialAnnouncements?: AnnouncementItem[];
}

export async function TeacherDashboard({
  user,
  initialData,
  initialAnnouncements,
}: TeacherDashboardProps) {
  const dashboardData =
    initialData ||
    (await TeacherFacade.getTeacherDashboardData(
      user.id,
      user.sekolah_id,
      user.is_owner_tenant ?? false
    ));

  let onboardingSnapshot = null;
  if (user.sekolah_id) {
    try {
      const canCreateClass = await checkPermission("academic.classes.manage", {
        sekolah_id: user.sekolah_id,
      });
      const canManageSubjects = await checkPermission("academic.structure.manage", {
        sekolah_id: user.sekolah_id,
      });
      onboardingSnapshot = await teacherOnboardingService.getSnapshot({
        userId: user.id,
        sekolahId: user.sekolah_id,
        isTenantOwner: user.is_owner_tenant ?? false,
        canCreateClass,
        canManageSubjects,
      });
    } catch {
      onboardingSnapshot = null;
    }
  }

  const {
    hasProfile,
    teacher,
    activeAssignments,
    activeHomeroom,
    totalJamMinggu,
    totalRombel,
    totalMataPelajaran = 0,
    pendingTasks = [],
    totalTugasPerluDiperiksa = 0,
    totalSiswaBinaan = 0,
  } = dashboardData;

  const uniqueMapelsCount =
    totalMataPelajaran || new Set(activeAssignments.map((a) => a.mata_pelajaran_id)).size;

  const namaGelar = teacher?.nama_dengan_gelar || user.nama_lengkap;

  const todayHari = getHariBelajarInTimezone(new Date(), "Asia/Jakarta");

  let teacherSchedules: ScheduleEntryDTO[] = [];
  let todaySchedules: ScheduleEntryDTO[] = [];
  let actualSessions: ClassSessionDTO[] = [];
  let announcements: AnnouncementItem[] = initialAnnouncements || [];
  let upcomingEvents: UpcomingCalendarEvent[] = [];
  let classPerformanceItems: ClassPerformanceItem[] = [];
  let averageScore: number | null = null;
  let bestClass: { name: string; score: number } | null = null;
  let presensiRecords: { status: string; sesi_kelas_id: string; rombel_id?: string }[] = [];
  let completedJournalsCount = 0;
  let totalCbtAktif = 0;

  if (user.sekolah_id) {
    const sekolahId = user.sekolah_id;
    try {
      const todayStart = getStartOfDayInTimezone(new Date(), "Asia/Jakarta");

      const [schedulesRes, sessionsRes, overviewsRes, eventsRes, announcementsRes, cbtCountRes] =
        await Promise.all([
          teacher
            ? scheduleService.listTeacherSchedule(teacher.id, sekolahId, true)
            : Promise.resolve([]),
          teacher
            ? classSessionService.listSessions(sekolahId, {
                guru_id: teacher.id,
                tanggal: new Date(),
              })
            : Promise.resolve([]),
          teacher
            ? assessmentService.getTeacherOverview(sekolahId, teacher.id, false)
            : Promise.resolve([]),
          prisma.kalenderAkademik.findMany({
            where: {
              sekolah_id: sekolahId,
              tanggal_selesai: { gte: todayStart },
            },
            orderBy: { tanggal_mulai: "asc" },
            take: 3,
            select: {
              id: true,
              judul: true,
              tanggal_mulai: true,
              tipe_event: true,
            },
          }),
          initialAnnouncements
            ? Promise.resolve(initialAnnouncements)
            : new CommunicationService().getAnnouncementsForUser(sekolahId, {
                id: user.id,
                peran_dasar: user.peran_dasar as BaseRole,
              }),
          teacher
            ? prisma.ujianCbt.count({
                where: {
                  sekolah_id: sekolahId,
                  penugasan_mengajar: {
                    guru_id: teacher.id,
                  },
                  status: {
                    in: ["PUBLISHED", "DIPUBLIKASI", "DITERBITKAN", "BERLANGSUNG", "ACTIVE"],
                  },
                },
              })
            : Promise.resolve(0),
        ]);

      teacherSchedules = schedulesRes;
      todaySchedules = teacherSchedules.filter((s) => s.hari === todayHari);
      actualSessions = sessionsRes;
      announcements = announcementsRes;
      upcomingEvents = eventsRes;
      totalCbtAktif = cbtCountRes;

      if (actualSessions.length > 0) {
        const sessionIds = actualSessions.map((s) => s.id);
        const [presensi, journals] = await Promise.all([
          prisma.presensiSesiKelas.findMany({
            where: {
              sekolah_id: sekolahId,
              sesi_kelas_id: { in: sessionIds },
            },
            select: { status: true, sesi_kelas_id: true },
          }),
          prisma.administrasiPembelajaran.count({
            where: {
              sekolah_id: sekolahId,
              sesi_kelas_aktual_id: { in: sessionIds },
            },
          }),
        ]);
        const sessionRombelMap = new Map(actualSessions.map((s) => [s.id, s.rombel_id]));
        presensiRecords = presensi.map((p) => ({
          status: p.status,
          sesi_kelas_id: p.sesi_kelas_id,
          rombel_id: sessionRombelMap.get(p.sesi_kelas_id) || "",
        }));
        completedJournalsCount = journals;
      }

      if (overviewsRes && overviewsRes.length > 0) {
        const scoredOverviews = overviewsRes.filter(
          (o) =>
            o.rata_rata_kelas !== null &&
            o.rata_rata_kelas !== undefined &&
            Number(o.rata_rata_kelas) > 0
        );
        if (scoredOverviews.length > 0) {
          classPerformanceItems = scoredOverviews.map((o) => ({
            id: o.rombel_id,
            name: o.rombel_nama,
            score: Number(o.rata_rata_kelas),
            subject: o.mata_pelajaran_nama,
          }));
          const validScores = classPerformanceItems.map((c) => c.score).filter((s) => s > 0);
          if (validScores.length > 0) {
            averageScore = Number(
              (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
            );
            const maxItem = classPerformanceItems.reduce(
              (prev, curr) => (curr.score > prev.score ? curr : prev),
              classPerformanceItems[0]
            );
            bestClass = { name: maxItem.name, score: maxItem.score };
          }
        }
      }
    } catch {
      // Graceful fallback for partial or disconnected data
    }
  }

  // Gabungkan jam pelajaran berurutan untuk jadwal hari ini
  const mergedTodayBlocks = mergeConsecutiveScheduleEntries(todaySchedules);
  const nextSession = mergedTodayBlocks[0];

  // Tentukan sesi KBM aktif / terdekat untuk mobile cockpit
  let mobileActiveSession: {
    rombel_nama: string;
    mata_pelajaran_nama: string;
    jam_mulai: string;
    jam_selesai: string;
    ruangan?: string;
    status: "BERLANGSUNG" | "AKAN_DATANG" | "SELESAI";
    sesi_id?: string;
    rombel_id?: string;
  } | null = null;

  if (mergedTodayBlocks.length > 0) {
    const now = new Date();
    const currentHHMM = getCurrentHHMMInTimezone(now, "Asia/Jakarta");

    const ongoingBlock = mergedTodayBlocks.find(
      (b) => currentHHMM >= b.jam_mulai && currentHHMM <= b.jam_selesai
    );

    if (ongoingBlock) {
      const matchSession = actualSessions.find(
        (s) =>
          s.rombel_id === ongoingBlock.rombel_id &&
          s.mata_pelajaran_id === ongoingBlock.mata_pelajaran_id
      );
      mobileActiveSession = {
        rombel_nama: ongoingBlock.rombel_nama,
        mata_pelajaran_nama: ongoingBlock.mata_pelajaran_nama,
        jam_mulai: ongoingBlock.jam_mulai,
        jam_selesai: ongoingBlock.jam_selesai,
        ruangan: ongoingBlock.ruangan || undefined,
        status: "BERLANGSUNG",
        sesi_id: matchSession?.id,
        rombel_id: ongoingBlock.rombel_id,
      };
    } else {
      const upcomingBlock = mergedTodayBlocks.find((b) => b.jam_mulai > currentHHMM);
      if (upcomingBlock) {
        const matchSession = actualSessions.find(
          (s) =>
            s.rombel_id === upcomingBlock.rombel_id &&
            s.mata_pelajaran_id === upcomingBlock.mata_pelajaran_id
        );
        mobileActiveSession = {
          rombel_nama: upcomingBlock.rombel_nama,
          mata_pelajaran_nama: upcomingBlock.mata_pelajaran_nama,
          jam_mulai: upcomingBlock.jam_mulai,
          jam_selesai: upcomingBlock.jam_selesai,
          ruangan: upcomingBlock.ruangan || undefined,
          status: "AKAN_DATANG",
          sesi_id: matchSession?.id,
          rombel_id: upcomingBlock.rombel_id,
        };
      } else {
        const lastBlock = mergedTodayBlocks[mergedTodayBlocks.length - 1];
        mobileActiveSession = {
          rombel_nama: lastBlock.rombel_nama,
          mata_pelajaran_nama: lastBlock.mata_pelajaran_nama,
          jam_mulai: lastBlock.jam_mulai,
          jam_selesai: lastBlock.jam_selesai,
          ruangan: lastBlock.ruangan || undefined,
          status: "SELESAI",
          rombel_id: lastBlock.rombel_id,
        };
      }
    }
  }

  // Siapkan daftar rombel yang diajar untuk filter presensi interaktif
  const rombelMap = new Map<string, string>();
  activeAssignments.forEach((a) => {
    if (a.rombel_id && a.rombel_nama) {
      rombelMap.set(a.rombel_id, a.rombel_nama);
    }
  });
  actualSessions.forEach((s) => {
    if (s.rombel_id && s.rombel_nama) {
      rombelMap.set(s.rombel_id, s.rombel_nama);
    }
  });
  const rombelOptions = Array.from(rombelMap.entries()).map(([id, nama]) => ({ id, nama }));

  // Hitung metrik sesi KBM riil (strictly genuine, no fake data)
  const totalSessionsToday = actualSessions.length;
  const completedSessionsToday = actualSessions.filter((s) => s.status === "SELESAI").length;
  const hasSessionsToday = totalSessionsToday > 0;

  return (
    <div className="w-full">
      <div className="space-y-4 sm:space-y-5 pb-10 w-full max-w-7xl mx-auto">
        {/* 1. Modal Managers (Invisibly mounted, only opens on demand) */}
        <TrialBanner />
        <ManualCreateClassModal />
        <TeacherFirstClassSetupModal shouldOpen={false} teacherName={user.nama_lengkap} />
        {onboardingSnapshot?.onboardingEligible && !onboardingSnapshot.onboardingCompleted && (
          <TeacherOnboardingWizard
            key={`${user.id}:${user.sekolah_id}`}
            initialSnapshot={onboardingSnapshot}
          />
        )}

        {/* 2. Mobile Compact Header Contract (Hidden per user request: Jadwal Mengajar timeline is the primary rail) */}
        <TeacherCompactHeader activeSession={mobileActiveSession} className="!hidden" />

        {/* 3. Main Teaching Cockpit Grid: 12 Columns (8 Col Workspace, 4 Col Right Rail) */}
        {/* Mobile (<768px): Priority content (Jadwal Mengajar, Sesi Aktif, Agenda) renders first */}
        {/* Tablet/Desktop (>=768px): Hero banner and Workspace render first */}
        <div className="pt-1.5 sm:pt-2.5 md:pt-4 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* LEFT WORKSPACE (8 Columns on XL) */}
          <div className="order-2 md:order-1 xl:order-1 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* A. Hero Greeting Banner (Premium Glass Hero: Astronaut Mascot Pop-Out + Sapaan + Aksi Cepat) */}
            {/* Responsive Rule: Hidden on mobile (<768px), Visible on tablet/desktop (>=768px) */}
            <div className="hidden md:flex rounded-[32px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden md:overflow-visible flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Ambient Glow in dark mode */}
              <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Left Content */}
              <div className="space-y-3.5 z-10 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Teaching Command Center</span>
                  </div>
                  <TeacherTrialPill />
                </div>

                <div>
                  <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Halo, {namaGelar}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {mergedTodayBlocks.length === 0
                      ? totalRombel === 0
                        ? user.is_owner_tenant
                          ? "Katalog mata pelajaran sekolah sudah disiapkan. Buat kelas pertama untuk mulai mengatur konteks belajar; penugasan dan jadwal resmi tetap dibuat terpisah."
                          : "Akun Anda siap digunakan. Minta sekolah menyiapkan kelas dan penugasan mengajar agar jadwal pertama dapat ditampilkan."
                        : "Tidak ada jadwal mengajar untuk hari ini. Jadwal resmi semester aktif belum diterbitkan oleh bagian kurikulum sekolah."
                      : completedSessionsToday >= mergedTodayBlocks.length
                        ? `Semua sesi mengajar hari ini telah selesai dilaksanakan (${completedSessionsToday} sesi). Selamat beristirahat atau persiapkan materi berikutnya.`
                        : nextSession
                          ? `Anda memiliki ${mergedTodayBlocks.length} sesi mengajar hari ini. Sesi terdekat: Kelas ${nextSession.rombel_nama} • ${nextSession.mata_pelajaran_nama} (${nextSession.jam_mulai} WIB).`
                          : `Anda memiliki ${mergedTodayBlocks.length} sesi mengajar hari ini.`}
                  </p>
                </div>

                <TeacherHeroActions />
              </div>

              {/* Right 3D Astronaut Mascot with Pop-out Effect */}
              <div className="relative shrink-0 w-60 sm:w-72 md:w-80 h-48 sm:h-60 md:h-64 mt-4 sm:-mt-24 md:-mt-28 -mb-6 sm:-mb-7 mx-auto md:mr-0 pointer-events-none select-none flex items-end justify-center z-20">
                <Image
                  src="/images/illustrations/astronaut-desk-hero.png"
                  alt="Maskot Astronot Ruang Pintar"
                  fill
                  sizes="(max-width: 768px) 240px, 320px"
                  priority
                  className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.35)]"
                />
              </div>
            </div>

            {/* B. Academic Reality KPI Stat Grid (100% Real Canonical Data with Motion Stagger & Interactive Physics) */}
            <TeacherKpiGrid
              isOwnerTenant={user.is_owner_tenant}
              totalRombel={totalRombel}
              activeAssignmentsCount={activeAssignments.length}
              uniqueMapelsCount={uniqueMapelsCount}
              totalSiswaBinaan={totalSiswaBinaan}
              totalJamMinggu={totalJamMinggu}
              totalTugasPerluDiperiksa={totalTugasPerluDiperiksa}
              totalCbtAktif={totalCbtAktif}
            />

            {/* C. Dual-Metric Cards (2 Columns: Performance Bar Chart + Attendance Donut Gauges) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              {/* Card 1: Performance / Ketuntasan Penilaian */}
              <PerformanceBarChart
                items={classPerformanceItems}
                averageScore={averageScore}
                bestClass={bestClass}
              />

              {/* Card 2: Attendance / Rekap Presensi Siswa with Rombel Filter & Terlambat Metric */}
              <TeacherAttendanceCard
                hasSessionsToday={hasSessionsToday}
                totalSessionsToday={totalSessionsToday}
                completedSessionsToday={completedSessionsToday}
                completedJournalsCount={completedJournalsCount}
                rombelOptions={rombelOptions}
                presensiRecords={presensiRecords}
              />
            </div>
          </div>

          {/* RIGHT RAIL (4 Columns on XL) - Priority Content on Mobile */}
          <div className="order-1 md:order-2 xl:order-2 xl:col-span-4">
            <TeachingTimelineRail
              mergedBlocks={mergedTodayBlocks}
              actualSessions={actualSessions}
              announcements={announcements}
              upcomingEvents={upcomingEvents}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
