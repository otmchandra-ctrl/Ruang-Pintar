import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  MonitorPlay,
  AlertCircle,
  BookOpen,
  School,
  UserCheck,
  ClipboardList,
  Award,
} from "lucide-react";
import { AuthenticatedUser } from "@/shared/infrastructure/auth/auth-service";
import { studentExperienceService } from "@/modules/student/application/student-experience-service";
import { StudentDashboardData } from "@/modules/student/domain/student-experience-types";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { StudentTimelineRail } from "@/shared/components/dashboard/cockpit/student-timeline-rail";
import {
  StudentProgressCard,
  SubjectProgressItem,
} from "@/shared/components/dashboard/cockpit/student-progress-card";
import { StudentRecentTasksCard } from "@/shared/components/dashboard/cockpit/student-recent-tasks-card";
import { StudentCbtCard } from "@/shared/components/dashboard/cockpit/student-cbt-card";

export interface StudentDashboardProps {
  user: AuthenticatedUser;
  initialData?: StudentDashboardData;
}

export async function StudentDashboard({ user, initialData }: StudentDashboardProps) {
  const dashboardData =
    initialData ||
    (await studentExperienceService.getDashboardData(user.id, user.sekolah_id || ""));

  const { profile, statCards, jadwalHariIni, tugasMendatang, cbtMendatang } = dashboardData;

  const hasAttendanceData = statCards.totalHadir + statCards.totalAlpha > 0;
  const activeCbt =
    cbtMendatang.find((c) => c.isAvailable) || (cbtMendatang.length > 0 ? cbtMendatang[0] : null);

  // Hitung progres belajar per mata pelajaran dari data aktual sistem
  let subjectProgressItems: SubjectProgressItem[] = [];

  try {
    if (profile?.rombelId) {
      const activeSubjects = await prisma.penugasanMengajar.findMany({
        where: {
          rombel_id: profile.rombelId,
          status: "AKTIF",
        },
        include: {
          mata_pelajaran: true,
          guru: true,
        },
        orderBy: {
          mata_pelajaran: { nama: "asc" },
        },
      });

      if (activeSubjects.length > 0) {
        subjectProgressItems = activeSubjects.map((s) => {
          const sAssignments = tugasMendatang.filter(
            (t) => t.mataPelajaranNama.toLowerCase() === s.mata_pelajaran.nama.toLowerCase()
          );
          const totalT = sAssignments.length;
          const selesaiT = sAssignments.filter(
            (t) => t.statusPengerjaan === "SUDAH_DIKUMPULKAN"
          ).length;
          const guruNama = s.guru
            ? `${s.guru.gelar_depan ? s.guru.gelar_depan + " " : ""}${s.guru.nama_lengkap}${s.guru.gelar_belakang ? ", " + s.guru.gelar_belakang : ""}`
            : undefined;

          return {
            id: s.id,
            nama: s.mata_pelajaran.nama,
            kode: s.mata_pelajaran.kode,
            guruNama,
            persentase: totalT > 0 ? Math.round((selesaiT / totalT) * 100) : 0,
            totalTugas: totalT,
            tugasSelesai: selesaiT,
          };
        });
      }
    }
  } catch {
    // Fallback jika pemanggilan database terisolasi atau di test runner
  }

  // Fallback ke jadwal hari ini jika data penugasan rombel belum dimuat
  if (subjectProgressItems.length === 0 && jadwalHariIni.length > 0) {
    const uniqueMapels = Array.from(new Set(jadwalHariIni.map((j) => j.mataPelajaranNama)));
    subjectProgressItems = uniqueMapels.map((nama, idx) => {
      const sAssignments = tugasMendatang.filter(
        (t) => t.mataPelajaranNama.toLowerCase() === nama.toLowerCase()
      );
      const totalT = sAssignments.length;
      const selesaiT = sAssignments.filter(
        (t) => t.statusPengerjaan === "SUDAH_DIKUMPULKAN"
      ).length;
      const jItem = jadwalHariIni.find((j) => j.mataPelajaranNama === nama);

      return {
        id: `mapel-${idx}`,
        nama,
        kode: jItem?.mataPelajaranKode,
        guruNama: jItem?.guruNama,
        persentase: totalT > 0 ? Math.round((selesaiT / totalT) * 100) : 0,
        totalTugas: totalT,
        tugasSelesai: selesaiT,
      };
    });
  }

  return (
    <div className="w-full">
      <div className="space-y-5 sm:space-y-6 pb-12 w-full max-w-7xl mx-auto">
        {/* Fallback jika siswa belum terdaftar pada rombel aktif */}
        {!profile && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Pendaftaran Kelas Belum Ditemukan</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Akun siswa Anda belum memiliki penempatan rombongan belajar aktif pada periode
                  akademik saat ini. Silakan hubungi bagian Tata Usaha atau Operator Akademik
                  sekolah Anda untuk verifikasi keikutsertaan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TOP SECTION: HERO & STATS (LEFT COL 8) + JADWAL HARI INI (RIGHT COL 4)
        ───────────────────────────────────────────────────────────── */}
        <div className="pt-1.5 sm:pt-2.5 md:pt-4 grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* ── SISI KIRI (Col 8): Hero Welcome Banner & 4 Ringkasan Akademik ── */}
          <div className="order-2 md:order-1 xl:order-1 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* A. HERO GREETING BANNER */}
            <div className="rounded-[32px] bg-white/75 dark:bg-slate-900/75 backdrop-blur-[24px] border border-white/80 dark:border-white/20 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden md:overflow-visible flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-1/4 w-72 h-44 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Left Content */}
              <div className="space-y-3.5 z-10 max-w-md sm:max-w-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/50">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Siswa Aktif</span>
                  </span>
                  {profile && (
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {profile.rombelNama} • {profile.semesterNama}
                    </span>
                  )}
                  {profile?.nis && (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      NIS: {profile.nis}
                    </span>
                  )}
                  {statCards.cbtAktifCount > 0 && (
                    <Link
                      href="/cbt-ujian"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>{statCards.cbtAktifCount} Ujian CBT Aktif</span>
                    </Link>
                  )}
                </div>

                <div>
                  <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Halo, {profile ? profile.namaLengkap : user.nama_lengkap}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {statCards.cbtAktifCount > 0 ? (
                      <>
                        Kamu memiliki{" "}
                        <strong className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {statCards.cbtAktifCount} ujian CBT aktif siap dikerjakan
                        </strong>
                        ,{" "}
                        <strong className="font-mono font-bold text-slate-900 dark:text-white">
                          {statCards.tugasPerluDikerjakan} tugas
                        </strong>
                        , dan{" "}
                        <strong className="font-mono font-bold text-slate-900 dark:text-white">
                          {jadwalHariIni.length} sesi KBM
                        </strong>{" "}
                        hari ini. Selesaikan evaluasi tepat waktu!
                      </>
                    ) : (
                      <>
                        Kamu memiliki{" "}
                        <strong className="font-mono font-bold text-slate-900 dark:text-white">
                          {statCards.tugasPerluDikerjakan} tugas aktif
                        </strong>{" "}
                        dan{" "}
                        <strong className="font-mono font-bold text-slate-900 dark:text-white">
                          {jadwalHariIni.length} sesi pembelajaran KBM
                        </strong>{" "}
                        hari ini. Ayo mulai belajar dan capai hasil terbaik!
                      </>
                    )}
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <Link
                    href="/tugas-siswa"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Periksa Tugas & Materi →</span>
                  </Link>

                  {statCards.cbtAktifCount > 0 && activeCbt && activeCbt.isAvailable && (
                    <Link
                      href="/cbt-ujian"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <MonitorPlay className="h-3.5 w-3.5" />
                      <span>{activeCbt.actionLabel} →</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right 3D Astronaut Mascot (Pop-out Desk Hero) */}
              <div className="relative shrink-0 w-60 sm:w-72 md:w-80 h-48 sm:h-56 md:h-64 mt-3 sm:-mt-20 md:-mt-24 -mb-6 sm:-mb-7 mx-auto md:mr-0 pointer-events-none select-none flex items-end justify-center z-20">
                <Image
                  src="/images/illustrations/astronaut-desk-hero.png"
                  alt="Maskot Astronot Siswa Ruang Pintar"
                  fill
                  sizes="(max-width: 768px) 240px, 320px"
                  priority
                  className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_35px_rgba(37,99,235,0.35)]"
                />
              </div>
            </div>

            {/* B. 4 RINGKASAN AKADEMIK (Uniform, Outline Icons, Clean Typography) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Card 1: Kelas Terdaftar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Kelas Terdaftar
                  </span>
                  <School className="h-4 w-4 text-blue-500/80 shrink-0" />
                </div>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {statCards.rombelNama}
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                    Wali: {statCards.waliKelasNama}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Rombel Siswa Aktif
                  </p>
                </div>
              </div>

              {/* Card 2: Kehadiran Saya */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Kehadiran Saya
                  </span>
                  <UserCheck className="h-4 w-4 text-emerald-500/80 shrink-0" />
                </div>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {hasAttendanceData ? `${statCards.persentaseKehadiran}%` : "-"}
                  </div>
                  <div className="font-mono text-xs font-bold text-[#2563EB] dark:text-blue-400 mt-1 truncate">
                    {hasAttendanceData
                      ? `${statCards.totalHadir} Hadir • ${statCards.totalAlpha} Alpa`
                      : "Belum Ada Presensi"}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Tingkat Kehadiran KBM
                  </p>
                </div>
              </div>

              {/* Card 3: Tugas Aktif */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Tugas Aktif
                  </span>
                  <ClipboardList className="h-4 w-4 text-indigo-500/80 shrink-0" />
                </div>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {statCards.tugasPerluDikerjakan}
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                    Tugas Perlu Dikerjakan
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    dari {statCards.totalTugasAktif} total tugas diterbitkan
                  </p>
                </div>
              </div>

              {/* Card 4: Nilai Rata-rata */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Nilai Rata-Rata
                  </span>
                  <Award className="h-4 w-4 text-amber-500/80 shrink-0" />
                </div>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {statCards.nilaiRataRata !== null ? statCards.nilaiRataRata : "-"}
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                    {statCards.nilaiRataRata !== null
                      ? "Asesmen Resmi Terpublikasi"
                      : "Belum Ada Penilaian"}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {statCards.nilaiRataRata !== null
                      ? "Kompilasi Buku Nilai Siswa"
                      : "Belum Ada Data Penilaian"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── SISI KANAN (Col 4): Jadwal Pelajaran Hari Ini (Timeline Ringkas) ── */}
          <div className="order-1 md:order-2 xl:order-2 xl:col-span-4">
            <StudentTimelineRail jadwalHariIni={jadwalHariIni} rombelNama={profile?.rombelNama} />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MAIN CONTENT ROW (3 CARDS): Progres Belajar | Tugas Terbaru | CBT & Ujian Online
            Desktop XL: 30% / 38% / 32% (4 Col / 4 Col / 4 Col)
            Tablet MD: 2 Kolom
            Mobile: Stack Vertikal Rapi
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Card 1: Progres Belajar (~30%) */}
          <div className="md:col-span-1 xl:col-span-4 flex">
            <StudentProgressCard items={subjectProgressItems} className="w-full" />
          </div>

          {/* Card 2: Tugas Terbaru (~38%) */}
          <div className="md:col-span-1 xl:col-span-4 flex">
            <StudentRecentTasksCard tasks={tugasMendatang} className="w-full" />
          </div>

          {/* Card 3: CBT & Ujian Online (~32%) */}
          <div className="md:col-span-2 xl:col-span-4 flex">
            <StudentCbtCard exams={cbtMendatang} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
