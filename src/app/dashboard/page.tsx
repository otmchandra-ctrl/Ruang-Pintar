import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { staffCapabilityService } from "@/shared/infrastructure/authorization/staff-capability-service";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { AcademicShell } from "@/shared/components/shell/academic-shell";
import { TeacherDashboard } from "@/shared/components/dashboard/role-views/teacher-dashboard";
import { StudentDashboard } from "@/shared/components/dashboard/role-views/student-dashboard";
import { GuardianDashboard } from "@/shared/components/dashboard/role-views/guardian-dashboard";
import { StaffDashboard } from "@/shared/components/dashboard/role-views/staff-dashboard";
import { SuperAdminDashboard } from "@/shared/components/dashboard/role-views/super-admin-dashboard";
import { CapabilityBundle } from "@/shared/infrastructure/authorization/types";

export const metadata = {
  title: "Dashboard — Ruang Pintar",
  description: "Portal operasional dan pembelajaran Ruang Pintar",
};

export default async function DashboardPage() {
  const user = await requireAuth();

  let capabilities: CapabilityBundle[] = [];
  if (user.peran_dasar === "SCHOOL_STAFF" || user.peran_dasar === "TEACHER") {
    capabilities = await staffCapabilityService.getUserCapabilities(user.id);
  }

  let activeSchoolName: string | null = null;
  if (user.peran_dasar === "SUPER_ADMIN" && user.sekolah_id) {
    const school = await prisma.sekolah.findUnique({
      where: { id: user.sekolah_id },
      select: { nama: true },
    });
    activeSchoolName = school?.nama ?? null;
  }

  const breadcrumbItems = [{ label: "Dashboard", href: "/dashboard", isCurrent: true }];

  return (
    <AcademicShell
      user={user}
      userCapabilities={capabilities}
      breadcrumbItems={breadcrumbItems}
      activeSchoolName={activeSchoolName}
    >
      {user.peran_dasar === "TEACHER" && <TeacherDashboard user={user} />}
      {user.peran_dasar === "STUDENT" && <StudentDashboard user={user} />}
      {user.peran_dasar === "GUARDIAN" && <GuardianDashboard user={user} />}
      {user.peran_dasar === "SCHOOL_STAFF" && (
        <StaffDashboard user={user} capabilities={capabilities} />
      )}
      {user.peran_dasar === "SUPER_ADMIN" && (
        <SuperAdminDashboard user={user} activeSchoolName={activeSchoolName} />
      )}
    </AcademicShell>
  );
}
