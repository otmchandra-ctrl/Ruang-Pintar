/**
 * Ruang Pintar — Route /cbt/attempt/[attemptId] (Secure CBT Exam Player)
 *
 * Player Ujian CBT Siswa:
 * - Mengambil soal dari SnapshotUjian yang immutable (Zero Answer Key Leakage)
 * - Timer Authoritative dihitung berdasarkan batas_waktu_server
 * - Idempotent Autosave
 * - Jika sesi sudah berstatus selesai atau waktu habis, redirect ke /cbt/finished/[attemptId]
 */

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { cbtService } from "@/modules/cbt/application/cbt-service";
import { CbtPlayerView } from "@/modules/cbt/presentation/cbt-player-view";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { attemptId } = await params;
  return {
    title: `Lembar Ujian CBT — Ruang Pintar`,
    description: `Sesi pengerjaan ujian daring CBT ${attemptId}`,
  };
}

export default async function CbtAttemptPlayerPage({ params }: PageProps) {
  const { attemptId } = await params;
  const user = await requireAuth();

  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  // 1. Resolve Siswa
  let siswaId: string | null = null;
  if (user.peran_dasar === "STUDENT") {
    const siswa = await prisma.siswa.findFirst({
      where: { sekolah_id: user.sekolah_id, pengguna_id: user.id },
    });
    if (siswa) {
      siswaId = siswa.id;
    }
  } else if (user.peran_dasar === "SUPER_ADMIN") {
    const session = await prisma.sesiUjianSiswa.findUnique({
      where: { id: attemptId },
      select: { siswa_id: true },
    });
    if (session) {
      siswaId = session.siswa_id;
    } else {
      const fallbackSiswa = await prisma.siswa.findFirst({
        where: { sekolah_id: user.sekolah_id, status_akademik: "AKTIF" },
      });
      if (fallbackSiswa) {
        siswaId = fallbackSiswa.id;
      }
    }
  }

  if (!siswaId) {
    redirect("/cbt");
  }

  // 2. Load Player Data from Snapshot
  let payload;
  try {
    payload = await cbtService.getAttemptPlayer(attemptId, user.sekolah_id, siswaId);
  } catch (err: any) {
    // If exam was completed or timer expired, redirect to finished route
    if (
      err?.name === "CbtAttemptClosedError" ||
      err?.name === "CbtTimerExpiredError" ||
      err?.message?.includes("telah selesai") ||
      err?.message?.includes("berakhir")
    ) {
      redirect(`/cbt/finished/${attemptId}`);
    }
    notFound();
  }

  // Check if session status is already finished
  if (
    payload.session.status === "SELESAI" ||
    payload.session.status === "DIKUMPULKAN" ||
    payload.session.status === "WAKTU_HABIS"
  ) {
    redirect(`/cbt/finished/${attemptId}`);
  }

  return (
    <CbtPlayerView
      initialSession={payload.session}
      manifest={payload.manifest}
      initialTimeRemainingSeconds={payload.timeRemainingSeconds}
      initialSavedAnswers={payload.savedAnswers}
      ujian={payload.ujian}
    />
  );
}
