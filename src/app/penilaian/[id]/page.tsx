import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/shared/infrastructure/authorization/authz-guard";
import { staffCapabilityService } from "@/shared/infrastructure/authorization/staff-capability-service";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { learningService } from "@/modules/learning/application/learning-service";
import { attendanceService } from "@/modules/attendance/application/attendance-service";
import { assessmentService } from "@/modules/assessment/application/assessment-service";
import { GradebookClassDetailView } from "@/modules/assessment/presentation/gradebook-class-detail-view";
import { AcademicShell } from "@/shared/components/shell/academic-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Buku Nilai Kelas — Ruang Pintar",
    description: `Pengelolaan penilaian dan leger nilai kelas penugasan ${id}`,
  };
}

export default async function PenilaianClassDetailPage({ params }: PageProps) {
  const { id: penugasanId } = await params;
  const user = await requirePermission("assessment.grades.manage");

  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  const isSuperAdmin = user.peran_dasar === "SUPER_ADMIN";

  const staffCapabilities =
    user.peran_dasar === "SCHOOL_STAFF" || user.peran_dasar === "TEACHER"
      ? await staffCapabilityService.getUserCapabilities(user.id)
      : [];

  let guruId: string | null = null;
  if (user.peran_dasar === "TEACHER") {
    const guru = await prisma.guru.findFirst({
      where: {
        sekolah_id: user.sekolah_id,
        pengguna_id: user.id,
      },
    });
    if (guru) {
      guruId = guru.id;
    }
  }

  let workspace;
  try {
    workspace = await learningService.getClassWorkspace(
      penugasanId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TeacherClassAccessDeniedError") {
      redirect("/penilaian");
    }
    notFound();
  }

  const [assessments, gradebook, attendanceRecap] = await Promise.all([
    assessmentService.getAssessments(penugasanId, user.sekolah_id, guruId, isSuperAdmin),
    assessmentService.getGradebook(penugasanId, user.sekolah_id, guruId, isSuperAdmin),
    attendanceService.getClassAttendanceRecap(penugasanId, user.sekolah_id, guruId, isSuperAdmin),
  ]);

  const canManage = isSuperAdmin || (guruId !== null && workspace.penugasan.guru_id === guruId);

  return (
    <AcademicShell
      user={user}
      userCapabilities={staffCapabilities}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Buku Nilai & Rapor", href: "/penilaian" },
        {
          label: `${workspace.penugasan.rombel_nama} - ${workspace.penugasan.mata_pelajaran_nama}`,
          isCurrent: true,
        },
      ]}
    >
      <div className="pt-2 sm:pt-4 w-full max-w-7xl mx-auto">
        <GradebookClassDetailView
          workspace={workspace}
          canManage={Boolean(canManage)}
          assessments={assessments}
          gradebook={gradebook}
          attendanceRecap={attendanceRecap}
        />
      </div>
    </AcademicShell>
  );
}
