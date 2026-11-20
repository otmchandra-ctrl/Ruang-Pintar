/**
 * Ruang Pintar — Route /materi (Materi Pembelajaran & Bahan Ajar Guru)
 *
 * Menu Mandiri untuk Mengelola Bank Materi, Modul Digital, dan Bahan Ajar
 * terstruktur per Bab dan Tujuan Pembelajaran Kurikulum Merdeka.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/shared/infrastructure/authorization/authz-guard";
import { staffCapabilityService } from "@/shared/infrastructure/authorization/staff-capability-service";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { learningService } from "@/modules/learning/application/learning-service";
import { MateriHubView } from "@/modules/learning/presentation/materi-hub-view";
import { AcademicShell } from "@/shared/components/shell/academic-shell";
import { getTenantEntitlement } from "@/shared/infrastructure/tenant/tenant-entitlement-service";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams?: Promise<{ penugasanId?: string }>;
}

export const metadata: Metadata = {
  title: "Materi Pembelajaran — Ruang Pintar",
  description: "Bank modul digital, dokumen bahan ajar, dan referensi belajar per mata pelajaran",
};

export default async function MateriPage({ searchParams }: PageProps) {
  const user = await requirePermission("learning.material.view");

  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  const isSuperAdmin = user.peran_dasar === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || user.peran_dasar === "SCHOOL_STAFF";

  const staffCapabilities =
    user.peran_dasar === "SCHOOL_STAFF" || user.peran_dasar === "TEACHER"
      ? await staffCapabilityService.getUserCapabilities(user.id)
      : [];

  let guruId: string | null = null;
  let teacherName = user.nama_lengkap;

  if (user.peran_dasar === "TEACHER") {
    const guru = await prisma.guru.findFirst({
      where: {
        sekolah_id: user.sekolah_id,
        pengguna_id: user.id,
      },
    });

    if (guru) {
      guruId = guru.id;
      teacherName = guru.nama_lengkap;
    }
  }

  // Ambil daftar kelas yang diampu guru (atau seluruh kelas untuk supervisi admin)
  const classes = await learningService.listTeacherClasses(
    user.sekolah_id,
    isAdmin ? null : guruId
  );

  const school = await prisma.sekolah.findUnique({
    where: { id: user.sekolah_id },
    select: { id: true, nama: true, tipe_lisensi: true },
  });

  const entitlement = await getTenantEntitlement(user.sekolah_id);
  const isSubscribed = entitlement.status === "ACTIVE" || school?.tipe_lisensi === "SEKOLAH";

  // Tangani jika belum ada kelas yang diampu
  if (!classes || classes.length === 0) {
    return (
      <AcademicShell
        user={user}
        userCapabilities={staffCapabilities}
        isSubscribed={isSubscribed}
        breadcrumbItems={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Materi Pembelajaran" },
        ]}
      >
        <div className="pt-4 max-w-4xl mx-auto">
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[20px] border border-white/80 dark:border-white/10 p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Belum Ada Kelas Pengajaran
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Anda belum terdaftar dalam penugasan mengajar aktif semester ini. Hubungi staf
              kurikulum untuk pendaftaran jadwal dan kelas.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AcademicShell>
    );
  }

  // Resolusi penugasanId yang dipilih
  const searchParamsObj = searchParams ? await searchParams : undefined;
  const requestedPenugasanId = searchParamsObj?.penugasanId;
  const activeClass =
    (requestedPenugasanId && classes.find((c) => c.id === requestedPenugasanId)) || classes[0];
  const selectedPenugasanId = activeClass.id;

  // Ambil workspace materi kelas terpilih
  const workspace = await learningService.getClassWorkspace(
    selectedPenugasanId,
    user.sekolah_id,
    guruId,
    isSuperAdmin
  );

  const canManage = isSuperAdmin || (guruId !== null && workspace.penugasan.guru_id === guruId);

  return (
    <AcademicShell
      user={user}
      userCapabilities={staffCapabilities}
      isSubscribed={isSubscribed}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Materi Pembelajaran" },
      ]}
    >
      <div className="pt-2 sm:pt-4 w-full max-w-7xl mx-auto">
        <MateriHubView
          classes={classes}
          selectedPenugasanId={selectedPenugasanId}
          workspace={workspace}
          canManage={canManage}
          teacherName={teacherName}
          isAdmin={isAdmin}
        />
      </div>
    </AcademicShell>
  );
}
