/**
 * Ruang Pintar — Route /cbt (Student Exam Portal)
 *
 * Portal Ujian Siswa:
 * - Menampilkan daftar ujian aktif yang relevan dengan rombel siswa.
 * - Memverifikasi status pengerjaan (belum mulai, sedang mengerjakan, selesai).
 * - Memberikan navigasi yang tepat ke /cbt/start/[assessmentId], /cbt/attempt/[attemptId], atau /cbt/finished/[attemptId].
 */

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Play,
  RotateCcw,
  Sparkles,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Portal Ujian CBT — Ruang Pintar",
  description: "Daftar ujian dan asesmen digital terintegrasi untuk peserta didik",
};

export default async function StudentCbtPortalPage() {
  const user = await requireAuth();

  if (!user.sekolah_id) {
    redirect("/dashboard");
  }

  // 1. Resolve Siswa Identity
  let siswaId: string | null = null;
  let isPreviewMode = false;

  if (user.peran_dasar === "STUDENT") {
    const siswa = await prisma.siswa.findFirst({
      where: { sekolah_id: user.sekolah_id, pengguna_id: user.id },
    });
    if (siswa) {
      siswaId = siswa.id;
    }
  } else if (user.peran_dasar === "SUPER_ADMIN") {
    // Mode Super Admin preview: gunakan siswa aktif pertama
    const siswa = await prisma.siswa.findFirst({
      where: { sekolah_id: user.sekolah_id, status_akademik: "AKTIF" },
    });
    if (siswa) {
      siswaId = siswa.id;
      isPreviewMode = true;
    }
  }

  if (!siswaId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Bukan Akun Peserta Didik</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Portal ini khusus untuk peserta didik yang terdaftar aktif dalam rombel ujian. Anda
            login sebagai <strong>{user.peran_dasar}</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch Siswa Profile, Sekolah & Penempatan Rombel (Domain Invariant: Student ≠ Enrollment ≠ Placement)
  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
  });

  const sekolah = await prisma.sekolah.findUnique({
    where: { id: user.sekolah_id },
    select: { nama: true },
  });

  const activePenempatan = await prisma.penempatanRombel.findFirst({
    where: {
      sekolah_id: user.sekolah_id,
      keikutsertaan: {
        siswa_id: siswaId,
        status: "AKTIF",
      },
      status: "AKTIF",
    },
    include: {
      rombel: {
        include: {
          tahun_ajaran: true,
          tingkat: true,
        },
      },
    },
  });
  const activeRombelId = activePenempatan?.rombel_id;

  // 3. Fetch Exams assigned to the student's rombel (or all school exams if no rombel assigned yet)
  const exams = await prisma.ujianCbt.findMany({
    where: {
      sekolah_id: user.sekolah_id,
      ...(activeRombelId
        ? {
            penugasan_mengajar: {
              rombel_id: activeRombelId,
            },
          }
        : {}),
      status: {
        in: ["DIPUBLIKASI", "DITERBITKAN", "BERLANGSUNG", "SELESAI", "PUBLISHED", "ACTIVE"],
      },
    },
    include: {
      penugasan_mengajar: {
        include: {
          mata_pelajaran: { select: { nama: true, kode: true } },
          guru: { select: { nama_lengkap: true } },
          rombel: { select: { nama: true } },
        },
      },
      snapshot_ujian: {
        orderBy: { nomor_snapshot: "desc" },
        take: 1,
      },
      sesi_ujian_siswa: {
        where: { siswa_id: siswaId },
        include: { hasil: true },
        orderBy: { attempt_ke: "desc" },
        take: 1,
      },
    },
    orderBy: { created_at: "desc" },
  });

  // 4. Categorize Exams
  const activeExams: typeof exams = [];
  const completedExams: typeof exams = [];

  for (const exam of exams) {
    const session = exam.sesi_ujian_siswa[0];
    const isFinished =
      session &&
      (session.status === "SELESAI" ||
        session.status === "DIKUMPULKAN" ||
        session.status === "WAKTU_HABIS");

    if (isFinished) {
      completedExams.push(exam);
    } else {
      activeExams.push(exam);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-xs shadow-blue-500/20">
              RP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900">Ruang Pintar CBT</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Student Portal
                </span>
                {isPreviewMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Preview Mode (Super Admin)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{sekolah?.nama || "Sekolah Digital"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Student Profile Cockpit Card */}
        <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl text-white shadow-inner">
                {siswa?.nama_lengkap.charAt(0) || "S"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {siswa?.nama_lengkap}
                  </h2>
                  <span className="p-1 rounded-full bg-emerald-400/20 text-emerald-300">
                    <UserCheck className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-blue-100 font-medium">
                  <span>NIS: {siswa?.nis || "-"}</span>
                  <span>•</span>
                  <span>NISN: {siswa?.nisn || "-"}</span>
                  <span>•</span>
                  <span>
                    Kelas: <strong>{activePenempatan?.rombel.nama || "Belum ada Rombel"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                <div className="text-xl font-black font-mono">{activeExams.length}</div>
                <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">
                  Ujian Aktif
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                <div className="text-xl font-black font-mono">{completedExams.length}</div>
                <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">
                  Telah Selesai
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: UJIAN SIAP DIKERJAKAN */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Ujian Siap Dikerjakan</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {activeExams.length}
              </span>
            </div>
          </div>

          {activeExams.length === 0 ? (
            <div className="bg-white/80 rounded-3xl p-10 text-center space-y-3 border border-slate-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200/60">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Ujian Aktif</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Saat ini belum ada jadwal ujian CBT yang diterbitkan untuk kelas Anda. Silakan
                hubungi guru mata pelajaran jika ada asesmen yang dijadwalkan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeExams.map((exam) => {
                const session = exam.sesi_ujian_siswa[0];
                const isUnderway = session && session.status === "SEDANG_MENGERJAKAN";
                const isLocked = session && session.status === "TERKUNCI_PELANGGARAN";
                const totalSoal = exam.snapshot_ujian[0]?.total_soal || 0;

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                          {exam.penugasan_mengajar.mata_pelajaran.nama}
                        </span>
                        {exam.gunakan_token ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <KeyRound className="h-3 w-3" />
                            Butuh Token
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Tanpa Token
                          </span>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                          {exam.judul}
                        </h3>
                        {exam.deskripsi && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {exam.deskripsi}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Guru: {exam.penugasan_mengajar.guru.nama_lengkap}
                        </p>
                      </div>

                      {/* Specs Grid */}
                      <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{exam.durasi_menit} Menit</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{totalSoal > 0 ? `${totalSoal} Soal` : "Siap"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-5 mt-4 border-t border-slate-100">
                      {isLocked ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                          Terkunci Pelanggaran
                        </div>
                      ) : isUnderway ? (
                        <Link
                          href={`/cbt/attempt/${session.id}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Lanjutkan Ujian
                        </Link>
                      ) : (
                        <Link
                          href={`/cbt/start/${exam.id}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Masuk Ujian
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION: RIWAYAT UJIAN SELESAI */}
        {completedExams.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Riwayat Ujian Telah Selesai</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  {completedExams.length}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {completedExams.map((exam) => {
                  const session = exam.sesi_ujian_siswa[0];
                  const hasil = session?.hasil;

                  return (
                    <div
                      key={exam.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                            {exam.penugasan_mengajar.mata_pelajaran.nama}
                          </span>
                          <span className="text-xs text-slate-400">
                            {session?.waktu_selesai
                              ? new Date(session.waktu_selesai).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "-"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{exam.judul}</h4>
                        <p className="text-xs text-slate-500">
                          Guru: {exam.penugasan_mengajar.guru.nama_lengkap}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {exam.tampilkan_nilai && hasil ? (
                          <div className="text-right">
                            <div className="text-xs text-slate-500 font-medium">Nilai Akhir</div>
                            <div className="text-base font-black font-mono text-blue-700">
                              {hasil.nilai_akhir.toFixed(1)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">
                            Menunggu Penilaian
                          </span>
                        )}

                        <Link
                          href={`/cbt/finished/${session?.id}`}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
                        >
                          Lihat Bukti
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
