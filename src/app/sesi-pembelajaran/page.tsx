/**
 * Ruang Pintar — M10 Sesi Pembelajaran Route Page (/sesi-pembelajaran)
 *
 * Server Component yang dilindungi requireAuth() dan otorisasi M02/M10.
 */

import React from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { checkPermission } from "@/shared/infrastructure/authorization/authz-guard";
import { staffCapabilityService } from "@/shared/infrastructure/authorization/staff-capability-service";
import { AcademicShell } from "@/shared/components/shell/academic-shell";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { TeachingAssignmentService } from "@/modules/teacher/application/teaching-assignment-service";
import { TeacherProfileService } from "@/modules/teacher/application/teacher-profile-service";
import { classSessionService } from "@/modules/schedule/application/class-session-service";
import { ClassSessionsView } from "@/modules/schedule/presentation/class-sessions-view";
import { schoolProfileService } from "@/modules/school/application/school-profile-service";

export const metadata = {
  title: "Log & Audit Sesi KBM — Ruang Pintar",
  description:
    "Log audit riwayat sesi pembelajaran kelas, jurnal KBM, dan pengawasan operasional sekolah.",
};

export const dynamic = "force-dynamic";

export default async function SesiPembelajaranPage() {
  const user = await requireAuth();
  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  // Capability bundle if SCHOOL_STAFF or TEACHER
  const staffCapabilities =
    user.peran_dasar === "SCHOOL_STAFF" || user.peran_dasar === "TEACHER"
      ? await staffCapabilityService.getUserCapabilities(user.id)
      : [];

  const isTeacher = user.peran_dasar === "TEACHER";
  const canViewClass = await checkPermission("schedule.class.view", {
    sekolah_id: user.sekolah_id,
  });
  const canManageSchedule = await checkPermission("schedule.master.manage", {
    sekolah_id: user.sekolah_id,
  });

  const canManage = isTeacher || canViewClass || canManageSchedule;

  // Fetch teacher profile if teacher
  let teacherId: string | undefined;
  if (isTeacher) {
    const teacherProfile = await prisma.guru.findFirst({
      where: {
        sekolah_id: user.sekolah_id,
        OR: [{ pengguna_id: user.id }, { email: user.email }],
      },
    });
    teacherId = teacherProfile?.id;
  }

  // Fetch sessions, schoolProfile in parallel
  const [sessions, schoolProfile, rombelsData, assignments, teachers] = await Promise.all([
    classSessionService.listSessions(user.sekolah_id, {
      guru_id: isTeacher ? teacherId : undefined,
    }),
    schoolProfileService.getProfile(user.sekolah_id),
    prisma.rombel.findMany({
      where: { sekolah_id: user.sekolah_id, status: "AKTIF" },
      include: { tingkat: true },
      orderBy: { nama: "asc" },
    }),
    TeachingAssignmentService.getTeachingAssignments(user.sekolah_id, {
      status: "AKTIF",
      guru_id: isTeacher ? teacherId : undefined,
    }),
    TeacherProfileService.getTeachers(user.sekolah_id, {
      status_aktif: true,
    }),
  ]);

  const activeSessionsCount = sessions.filter((s) => s.status === "DIMULAI").length;
  const completedSessionsCount = sessions.filter((s) => s.status === "SELESAI").length;

  return (
    <AcademicShell
      user={user}
      userCapabilities={staffCapabilities}
      breadcrumbItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Log Sesi KBM" }]}
    >
      <div className="pt-2 sm:pt-4 w-full max-w-7xl mx-auto relative space-y-4 sm:space-y-5 pb-10">
        {/* Ambient Backlight Orbs for Academic Glass Refraction */}
        <div className="absolute -top-20 left-1/4 w-[520px] h-[520px] bg-gradient-to-br from-blue-500/15 via-sky-400/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 -right-20 w-[480px] h-[480px] bg-gradient-to-bl from-indigo-500/15 via-purple-400/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Class Sessions View Component (Unified Hero & Log Cockpit) */}
        <ClassSessionsView
          initialSessions={sessions}
          rombels={rombelsData.map((r) => ({
            id: r.id,
            nama: r.nama,
            tingkat_nama: r.tingkat?.nama ?? null,
          }))}
          assignments={assignments}
          teachers={teachers}
          canManage={canManage}
          schoolName={schoolProfile.nama}
          isTeacher={isTeacher}
        />
      </div>
    </AcademicShell>
  );
}
