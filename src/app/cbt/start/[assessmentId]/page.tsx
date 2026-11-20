/**
 * Ruang Pintar — Route /cbt/start/[assessmentId] (Exam Entry Gate)
 *
 * Gerbang Masuk Ujian Berdasarkan ID Ujian atau ID Asesmen:
 * - Memverifikasi pendaftaran siswa pada rombel
 * - Memeriksa status dan jadwal ujian
 * - Menangani redirect jika attempt sudah ada
 * - Menampilkan form token ujian dan spesifikasi pengerjaan
 */

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { CbtEntryGateView } from "@/modules/cbt/presentation/cbt-entry-gate-view";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { assessmentId } = await params;
  return {
    title: `Gerbang Masuk Ujian — Ruang Pintar`,
    description: `Persiapan pengerjaan ujian daring CBT ${assessmentId}`,
  };
}

export default async function ExamStartGatePage({ params }: PageProps) {
  const { assessmentId } = await params;
  const user = await requireAuth();

  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  // 1. Resolve Exam by ID (Direct UjianCbt ID or DefinisiAsesmen ID)
  const exam = await prisma.ujianCbt.findFirst({
    where: {
      sekolah_id: user.sekolah_id,
      OR: [{ id: assessmentId }, { asesmen_id: assessmentId }],
    },
    include: {
      penugasan_mengajar: {
        include: {
          mata_pelajaran: { select: { nama: true } },
          guru: { select: { nama_lengkap: true } },
          rombel: { select: { id: true, nama: true } },
        },
      },
      snapshot_ujian: {
        orderBy: { nomor_snapshot: "desc" },
        take: 1,
      },
    },
  });

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Ujian Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">
            Paket ujian CBT dengan referensi tersebut tidak ditemukan di sekolah Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/cbt"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Portal CBT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Resolve Siswa Identity
  let siswaId: string | null = null;
  if (user.peran_dasar === "STUDENT") {
    const siswa = await prisma.siswa.findFirst({
      where: { sekolah_id: user.sekolah_id, pengguna_id: user.id },
    });
    if (siswa) {
      siswaId = siswa.id;
    }
  } else if (user.peran_dasar === "SUPER_ADMIN") {
    const siswa = await prisma.siswa.findFirst({
      where: { sekolah_id: user.sekolah_id, status_akademik: "AKTIF" },
    });
    if (siswa) {
      siswaId = siswa.id;
    }
  }

  if (!siswaId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Akses Ditolak</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Akun Anda tidak terdaftar sebagai peserta didik aktif di sekolah ini.
          </p>
          <div className="pt-2">
            <Link
              href="/cbt"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Portal CBT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Verify Student Enrollment & Rombel Placement (Domain Invariant: Student ≠ Enrollment ≠ Placement)
  const student = await prisma.siswa.findUnique({
    where: { id: siswaId },
  });

  const activePlacement = await prisma.penempatanRombel.findFirst({
    where: {
      sekolah_id: user.sekolah_id,
      keikutsertaan: {
        siswa_id: siswaId,
        status: "AKTIF",
      },
      status: "AKTIF",
    },
    include: { rombel: true },
  });

  const requiredRombelId = exam.penugasan_mengajar.rombel.id;

  if (
    activePlacement &&
    activePlacement.rombel_id !== requiredRombelId &&
    user.peran_dasar !== "SUPER_ADMIN"
  ) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Bukan Peserta Ujian Rombel Ini</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ujian ini ditujukan khusus untuk rombel{" "}
            <strong>{exam.penugasan_mengajar.rombel.nama}</strong>. Rombel aktif Anda adalah{" "}
            <strong>{activePlacement.rombel.nama}</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/cbt"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Portal CBT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Check Existing Student Attempt (Enforce One Active Attempt Rule)
  const existingAttempt = await prisma.sesiUjianSiswa.findFirst({
    where: {
      ujian_cbt_id: exam.id,
      siswa_id: siswaId,
    },
    orderBy: { attempt_ke: "desc" },
  });

  if (existingAttempt) {
    if (
      existingAttempt.status === "SELESAI" ||
      existingAttempt.status === "DIKUMPULKAN" ||
      existingAttempt.status === "WAKTU_HABIS"
    ) {
      redirect(`/cbt/finished/${existingAttempt.id}`);
    }

    if (existingAttempt.status === "SEDANG_MENGERJAKAN") {
      redirect(`/cbt/attempt/${existingAttempt.id}`);
    }
  }

  // 5. Render Entry Gate View
  return (
    <CbtEntryGateView
      ujianId={exam.id}
      judul={exam.judul}
      deskripsi={exam.deskripsi}
      mataPelajaran={exam.penugasan_mengajar.mata_pelajaran.nama}
      guruNama={exam.penugasan_mengajar.guru.nama_lengkap}
      rombelNama={exam.penugasan_mengajar.rombel.nama}
      durasiMenit={exam.durasi_menit}
      totalSoal={exam.snapshot_ujian[0]?.total_soal || 0}
      kktp={exam.kkm_kktp}
      gunakanToken={exam.gunakan_token}
      siswaNama={student?.nama_lengkap || "Peserta Didik"}
      siswaNis={student?.nis || "-"}
      siswaKelas={activePlacement?.rombel.nama || exam.penugasan_mengajar.rombel.nama}
    />
  );
}
