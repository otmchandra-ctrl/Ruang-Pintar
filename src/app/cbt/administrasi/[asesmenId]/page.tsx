import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { assessmentService } from "@/modules/assessment/application/assessment-service";
import { resolveOrCreateAssessmentForCbt } from "@/modules/assessment/application/assessment-cbt-sync-helper";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { staffCapabilityService } from "@/shared/infrastructure/authorization/staff-capability-service";
import { AcademicShell } from "@/shared/components/shell/academic-shell";
import { AdministrationHubView } from "@/modules/assessment/presentation/print/administration-hub-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hub Administrasi & Dokumen Supervisi Asesmen — Ruang Pintar",
  description:
    "Portal cetak dan supervisi 10 dokumen resmi administrasi asesmen kurikulum sekolah Indonesia",
};

interface PageProps {
  params: Promise<{ asesmenId: string }>;
}

export default async function AssessmentAdministrationPage({ params }: PageProps) {
  const user = await requireAuth();
  if (!user) {
    redirect("/login");
  }

  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  const role = user.peran_dasar;
  if (role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_STAFF") {
    redirect("/cbt-ujian");
  }

  const { asesmenId: rawParamId } = await params;

  // Resolve actor guru & otorisasi
  const isSuperAdmin = role === "SUPER_ADMIN";
  let guruId: string | null = null;

  if (role === "TEACHER") {
    const guru = await prisma.guru.findFirst({
      where: { sekolah_id: user.sekolah_id, pengguna_id: user.id },
    });
    if (guru) guruId = guru.id;
  }

  const staffCapabilities =
    role === "SCHOOL_STAFF" || role === "TEACHER"
      ? await staffCapabilityService.getUserCapabilities(user.id)
      : [];

  const sekolah = await prisma.sekolah.findUnique({
    where: { id: user.sekolah_id },
    select: { tipe_lisensi: true },
  });
  const isSubscribed = sekolah?.tipe_lisensi === "SEKOLAH";

  let resolvedAsesmenId = rawParamId;
  let fetchError: string | null = null;

  try {
    resolvedAsesmenId = await resolveOrCreateAssessmentForCbt(rawParamId, user.sekolah_id);
  } catch (err: any) {
    console.error("Gagal menyelaraskan asesmen CBT:", err);
    fetchError = err?.message || "Data asesmen atau ujian tidak ditemukan.";
  }

  let coverPaket = null;
  let berkasPengesahan = null;
  let kisiKisi = null;
  let kartuSoal = null;
  let naskahSoal = null;
  let kunciJawaban = null;
  let daftarHadir = null;
  let beritaAcara = null;
  let rekapNilai = null;
  let analisisButir = null;

  if (!fetchError && resolvedAsesmenId) {
    try {
      const results = await Promise.all([
        assessmentService
          .getCoverPaket(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error coverPaket:", e);
            return null;
          }),
        assessmentService
          .getBerkasPengesahan(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error pengesahan:", e);
            return null;
          }),
        assessmentService
          .getKisiKisi(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error kisiKisi:", e);
            return null;
          }),
        assessmentService
          .getKartuSoal(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error kartuSoal:", e);
            return null;
          }),
        assessmentService
          .getNaskahSoal(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error naskahSoal:", e);
            return null;
          }),
        assessmentService
          .getKunciJawaban(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error kunciJawaban:", e);
            return null;
          }),
        assessmentService
          .getDaftarHadir(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error daftarHadir:", e);
            return null;
          }),
        assessmentService
          .getBeritaAcara(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error beritaAcara:", e);
            return null;
          }),
        assessmentService
          .getRekapNilaiAsesmen(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error rekapNilai:", e);
            return null;
          }),
        assessmentService
          .getAnalisisButirSoal(resolvedAsesmenId, user.sekolah_id, guruId, isSuperAdmin)
          .catch((e) => {
            console.error("Error analisisButir:", e);
            return null;
          }),
      ]);

      coverPaket = results[0];
      berkasPengesahan = results[1];
      kisiKisi = results[2];
      kartuSoal = results[3];
      naskahSoal = results[4];
      kunciJawaban = results[5];
      daftarHadir = results[6];
      beritaAcara = results[7];
      rekapNilai = results[8];
      analisisButir = results[9];
    } catch (err: any) {
      fetchError = err?.message || "Gagal memuat dokumen administrasi ujian.";
    }
  }

  return (
    <AcademicShell
      user={user}
      userCapabilities={staffCapabilities}
      isSubscribed={isSubscribed}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "CBT Ujian Online", href: "/cbt-ujian" },
        {
          label: "Administrasi Supervisi Asesmen",
          href: `/cbt/administrasi/${rawParamId}`,
          isCurrent: true,
        },
      ]}
    >
      {fetchError ? (
        <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-lg">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Gagal Memuat Administrasi Ujian
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{fetchError}</p>
        </div>
      ) : (
        <AdministrationHubView
          asesmenId={resolvedAsesmenId}
          initialCoverPaket={coverPaket}
          initialBerkasPengesahan={berkasPengesahan}
          initialKisiKisi={kisiKisi}
          initialKartuSoal={kartuSoal}
          initialNaskahSoal={naskahSoal}
          initialKunciJawaban={kunciJawaban}
          initialDaftarHadir={daftarHadir}
          initialBeritaAcara={beritaAcara}
          initialRekapNilai={rekapNilai}
          initialAnalisisButir={analisisButir}
        />
      )}
    </AcademicShell>
  );
}
