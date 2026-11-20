/**
 * Ruang Pintar — Route /cbt/finished/[attemptId] (Exam Finished & Result Page)
 *
 * Halaman Konfirmasi Penyelesaian Ujian:
 * - Menampilkan bukti penyerahan lembar ujian
 * - Menampilkan skor jika tampilkan_nilai diaktifkan
 * - Menjaga kerahasiaan skor jika tampilkan_nilai dimatikan (domain invariant: raw score ≠ published score)
 */

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { cbtService } from "@/modules/cbt/application/cbt-service";
import { CbtFinishedView } from "@/modules/cbt/presentation/cbt-finished-view";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { attemptId } = await params;
  return {
    title: `Ujian Selesai — Ruang Pintar CBT`,
    description: `Bukti penyerahan dan hasil ujian CBT ${attemptId}`,
  };
}

function computeServerRemainingSeconds(deadlineDate: Date | string): number {
  const deadline = new Date(deadlineDate).getTime();
  return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
}

export default async function CbtFinishedPage({ params }: PageProps) {
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

  // 2. Load Session & Result
  let session = await prisma.sesiUjianSiswa.findUnique({
    where: { id: attemptId },
    include: {
      ujian_cbt: {
        include: {
          penugasan_mengajar: {
            include: {
              mata_pelajaran: true,
              guru: true,
            },
          },
        },
      },
      siswa: true,
      snapshot: true,
      hasil: true,
    },
  });

  if (!session || session.sekolah_id !== user.sekolah_id || session.siswa_id !== siswaId) {
    notFound();
  }

  // If still in progress, check timer
  if (session.status === "SEDANG_MENGERJAKAN") {
    const remainingSeconds = computeServerRemainingSeconds(session.batas_waktu_server);

    if (remainingSeconds > 0) {
      redirect(`/cbt/attempt/${attemptId}`);
    } else {
      // Auto submit expired attempt
      await cbtService.submitAttempt(session.id, user.sekolah_id, siswaId);
      // Reload session with hasil
      const reloaded = await prisma.sesiUjianSiswa.findUnique({
        where: { id: attemptId },
        include: {
          ujian_cbt: {
            include: {
              penugasan_mengajar: {
                include: {
                  mata_pelajaran: true,
                  guru: true,
                },
              },
            },
          },
          siswa: true,
          snapshot: true,
          hasil: true,
        },
      });
      if (reloaded) {
        session = reloaded;
      }
    }
  }

  const hasilData = session.hasil
    ? {
        nilaiAkhir: session.hasil.nilai_akhir,
        skorMentah: session.hasil.skor_mentah,
        jumlahBenar: session.hasil.jumlah_benar,
        jumlahSalah: session.hasil.jumlah_salah,
        jumlahKosong: session.hasil.jumlah_kosong,
        apakahTuntas: session.hasil.apakah_tuntas,
        statusPenilaian: session.hasil.status_penilaian,
      }
    : null;

  const waktuSelesaiFormatted = session.waktu_selesai
    ? new Date(session.waktu_selesai).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const waktuMulaiFormatted = new Date(session.waktu_mulai).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <CbtFinishedView
      attemptId={attemptId}
      ujianJudul={session.ujian_cbt.judul}
      mataPelajaran={session.ujian_cbt.penugasan_mengajar.mata_pelajaran.nama}
      guruNama={session.ujian_cbt.penugasan_mengajar.guru.nama_lengkap}
      siswaNama={session.siswa.nama_lengkap}
      siswaNis={session.siswa.nis || "-"}
      waktuMulai={waktuMulaiFormatted}
      waktuSelesai={waktuSelesaiFormatted}
      totalSoal={session.snapshot.total_soal}
      tampilkanNilai={session.ujian_cbt.tampilkan_nilai}
      kktp={session.ujian_cbt.kkm_kktp}
      hasil={hasilData}
    />
  );
}
