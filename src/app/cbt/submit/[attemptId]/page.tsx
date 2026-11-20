/**
 * Ruang Pintar — Route /cbt/submit/[attemptId] (Submission Review Page)
 *
 * Halaman Konfirmasi & Rekapitulasi Pengumpulan Ujian:
 * - Menampilkan rekap butir soal terisi, ragu-ragu, dan kosong
 * - Countdown server-authoritative
 * - Menangani redirect jika ujian sudah berstatus selesai
 */

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { cbtService } from "@/modules/cbt/application/cbt-service";
import { CbtSubmitReviewView } from "@/modules/cbt/presentation/cbt-submit-review-view";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { attemptId } = await params;
  return {
    title: `Konfirmasi Pengumpulan Ujian CBT — Ruang Pintar`,
    description: `Ringkasan dan penyerahan lembar ujian CBT ${attemptId}`,
  };
}

function computeServerRemainingSeconds(deadlineDate: Date | string): number {
  const deadline = new Date(deadlineDate).getTime();
  return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
}

export default async function CbtSubmitReviewPage({ params }: PageProps) {
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
    }
  }

  if (!siswaId) {
    redirect("/cbt");
  }

  // 2. Fetch Session & Check Status
  const session = await prisma.sesiUjianSiswa.findUnique({
    where: { id: attemptId },
    include: {
      ujian_cbt: {
        include: {
          penugasan_mengajar: {
            include: {
              mata_pelajaran: true,
            },
          },
        },
      },
      snapshot: true,
    },
  });

  if (!session || session.sekolah_id !== user.sekolah_id || session.siswa_id !== siswaId) {
    notFound();
  }

  // If already finished, redirect to finished page
  if (
    session.status === "SELESAI" ||
    session.status === "DIKUMPULKAN" ||
    session.status === "WAKTU_HABIS"
  ) {
    redirect(`/cbt/finished/${attemptId}`);
  }

  // Server Authoritative Deadline Check
  const remainingSeconds = computeServerRemainingSeconds(session.batas_waktu_server);

  if (remainingSeconds <= 0 && session.status === "SEDANG_MENGERJAKAN") {
    // Auto submit on server expiration
    await cbtService.submitAttempt(session.id, user.sekolah_id, siswaId);
    redirect(`/cbt/finished/${attemptId}`);
  }

  // 3. Fetch Saved Answers
  const answers = await prisma.jawabanSiswa.findMany({
    where: { sesi_ujian_id: attemptId },
  });

  const savedAnswers: Record<number, any> = {};
  for (const ans of answers) {
    let parsedText = ans.jawaban_peserta;
    let complexChoice: string[] | null = null;
    let singleChoice: string | null = null;
    let matchingChoice: Record<string, string> | null = null;

    if (parsedText) {
      try {
        const json = JSON.parse(parsedText);
        if (Array.isArray(json)) {
          complexChoice = json;
        } else if (typeof json === "object" && json !== null) {
          matchingChoice = json;
        } else if (typeof json === "string") {
          singleChoice = json;
        }
      } catch {
        singleChoice = parsedText;
      }
    }

    // Nomor urut dicari dari manifest snapshot
    const manifestItems: any[] = JSON.parse(session.snapshot.manifest_soal);
    const matchedItem = manifestItems.find((m) => m.soal_id === ans.soal_id);
    const noUrut = matchedItem ? matchedItem.nomor_urut : 1;

    savedAnswers[noUrut] = {
      jawaban_pilihan: singleChoice,
      jawaban_teks: singleChoice,
      jawaban_kompleks: complexChoice,
      jawaban_menjodohkan: matchingChoice,
      ragu_ragu: ans.ragu_ragu,
    };
  }

  const manifestItems: any[] = JSON.parse(session.snapshot.manifest_soal);

  return (
    <CbtSubmitReviewView
      attemptId={attemptId}
      ujianJudul={session.ujian_cbt.judul}
      mataPelajaran={session.ujian_cbt.penugasan_mengajar.mata_pelajaran.nama}
      durasiMenit={session.ujian_cbt.durasi_menit}
      initialTimeRemainingSeconds={remainingSeconds}
      batasWaktuServer={session.batas_waktu_server}
      manifest={manifestItems}
      savedAnswers={savedAnswers}
    />
  );
}
