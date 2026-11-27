"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, X, LogIn, LogOut, Loader2, ArrowUpRight } from "lucide-react";
import { AnimatedCounter } from "@/shared/components/motion/animated-counter";
import { switchActiveTenantAction, clearActiveTenantAction } from "@/app/actions/tenant-actions";

export interface SuperAdminDashboardViewProps {
  user: {
    nama_lengkap: string;
    peran_dasar: string;
    username: string;
  };
  activeTenant?: {
    id: string;
    nama: string;
  } | null;
  stats: {
    totalSiswa: number;
    totalGuru: number;
    totalSekolah: number;
    totalSekolahFreemium: number;
    totalSekolahInstitusi: number;
    totalSekolahSuspended: number;
    expiringTrialsCount: number;
    totalRombel: number;
    totalSesiAktual: number;
    totalMataPelajaran: number;
    totalRapor: number;
  };
  telemetry: {
    concurrencyActive: number;
    cbtTotal: number;
    cbtActive: number;
    cbtRunningSessions: number;
    cbtCompletedSessions: number;
    storageFilesCount: number;
    storageTotalMb: number;
    aiRequestsCount: number;
    failedLoginLast24h: number;
    estimatedMrr: number;
  };
  attendance: {
    totalPresensiRecorded: number;
    totalPresensiHadir: number;
    totalPresensiIzinSakit: number;
    totalPresensiAlpha: number;
    hadirPct: number;
    izinSakitPct: number;
    alphaPct: number;
  };
  rombelList: Array<{
    id: string;
    nama: string;
    siswaCount: number;
    mapelNama: string;
    guruNama: string;
    completion: number;
    sessionCount: number;
  }>;
  sekolahList: Array<{
    id: string;
    nama: string;
    npsn: string | null;
    jenjang: string;
    tipe_lisensi: string;
    trialDaysLeft: number | null;
    statusAktif: boolean;
    rombelCount: number;
    siswaCount: number;
    guruCount: number;
    cbtCount: number;
    guruKontak: string;
  }>;
  guruList: Array<{
    id: string;
    nama_lengkap: string;
    email: string | null;
    sekolahNama: string;
    penugasanCount: number;
  }>;
  auditLogs: Array<{
    id: string;
    aktor_role: string;
    aksi: string;
    tipe_sumber: string;
    id_sumber: string;
    dibuat_pada: string;
    timeAgo: string;
    payload_sebelum?: string | null;
    payload_sesudah?: string | null;
    ip_address?: string | null;
  }>;
  deviceStats: {
    mobilePct: number;
    desktopPct: number;
    sesiList: Array<{
      id: string;
      nama: string;
      sekolah: string;
      deviceType: "mobile" | "tablet" | "desktop";
      deviceBrand: string;
      presenceLabel: string;
      presenceBadgeClass: string;
      presenceDotClass: string;
    }>;
  };
  activityDays?: {
    SENIN?: number;
    SELASA?: number;
    RABU?: number;
    KAMIS?: number;
    JUMAT?: number;
    SABTU?: number;
  };
}

function formatCompactRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)}Rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function SuperAdminDashboardView({
  user,
  activeTenant = null,
  stats,
  telemetry,
  attendance,
  sekolahList,
  auditLogs,
  activityDays,
}: SuperAdminDashboardViewProps) {
  const router = useRouter();
  const [switchingSchoolId, setSwitchingSchoolId] = React.useState<string | null>(null);
  const [isClearingTenant, setIsClearingTenant] = React.useState(false);
  const [tenantActionError, setTenantActionError] = React.useState<string | null>(null);

  const handleEnterTenant = async (schoolId: string) => {
    setSwitchingSchoolId(schoolId);
    setTenantActionError(null);
    try {
      const res = await switchActiveTenantAction(schoolId);
      if (!res.success) {
        setTenantActionError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setTenantActionError("Gagal masuk ke konteks sekolah tersebut.");
    } finally {
      setSwitchingSchoolId(null);
    }
  };

  const handleExitTenant = async () => {
    setIsClearingTenant(true);
    setTenantActionError(null);
    try {
      const res = await clearActiveTenantAction();
      if (!res.success) {
        setTenantActionError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setTenantActionError("Gagal keluar kembali ke Mode Platform.");
    } finally {
      setIsClearingTenant(false);
    }
  };

  // Audit Log Filter & Pagination
  const [auditFilterAksi, setAuditFilterAksi] = React.useState<string>("ALL");
  const [auditPage, setAuditPage] = React.useState(1);
  const AUDIT_PAGE_SIZE = 5;

  const filteredAuditLogs = React.useMemo(() => {
    if (auditFilterAksi === "ALL") return auditLogs;
    return auditLogs.filter((log) => log.aksi === auditFilterAksi);
  }, [auditLogs, auditFilterAksi]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE));
  const paginatedAuditLogs = React.useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredAuditLogs.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredAuditLogs, auditPage]);

  // Modal detail audit log
  const [selectedLog, setSelectedLog] = React.useState<(typeof auditLogs)[0] | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedLog) {
        setSelectedLog(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLog]);

  // Sebaran Hari KBM (Senin - Sabtu)
  const daysActivity = React.useMemo(() => {
    const dayKeys: Array<{ label: string; key: keyof NonNullable<typeof activityDays> }> = [
      { label: "Sen", key: "SENIN" },
      { label: "Sel", key: "SELASA" },
      { label: "Rab", key: "RABU" },
      { label: "Kam", key: "KAMIS" },
      { label: "Jum", key: "JUMAT" },
      { label: "Sab", key: "SABTU" },
    ];
    const items = dayKeys.map(({ label, key }) => ({
      day: label,
      count: activityDays?.[key] ?? 0,
    }));
    const maxCount = Math.max(...items.map((i) => i.count), 1);
    return items.map((i) => ({
      ...i,
      heightPct: i.count > 0 ? Math.max(14, Math.round((i.count / maxCount) * 100)) : 6,
    }));
  }, [activityDays]);

  const attentionCount = stats.expiringTrialsCount + stats.totalSekolahSuspended;

  const renderLicenseLabel = (school: SuperAdminDashboardViewProps["sekolahList"][number]) => {
    if (school.tipe_lisensi === "SEKOLAH") {
      return (
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
          Lisensi Penuh
        </span>
      );
    }
    if (school.trialDaysLeft !== null) {
      if (school.trialDaysLeft < 0) {
        return (
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
            Trial Kadaluarsa
          </span>
        );
      }
      if (school.trialDaysLeft <= 7) {
        return (
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
            Trial • Sisa {school.trialDaysLeft}h
          </span>
        );
      }
      return (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
          Freemium • {school.trialDaysLeft}h
        </span>
      );
    }
    return (
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
        Freemium
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="space-y-4 sm:space-y-5 pb-10 w-full max-w-7xl mx-auto">
        {tenantActionError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {tenantActionError}
          </div>
        )}

        <div className="pt-1.5 sm:pt-2.5 md:pt-4 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* ─────────────────────────────────────────────────────────
              LEFT WORKSPACE (8 Columns) — Mirip Teacher Dashboard
          ───────────────────────────────────────────────────────── */}
          <div className="xl:col-span-8 space-y-4 sm:space-y-5">
            {/* 1. Calm Minimalist Hero */}
            <section className="rounded-[28px] bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/15 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-100 dark:border-blue-900/60">
                  {activeTenant
                    ? `Mode Dukungan Sekolah • ${activeTenant.nama}`
                    : "Platform Control • SaaS"}
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {telemetry.concurrencyActive} sesi aktif saat ini
                </span>
              </div>

              <div className="space-y-1.5">
                <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Halo, {user.nama_lengkap}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-[65ch]">
                  {activeTenant
                    ? `Anda sedang memeriksa ruang kerja ${activeTenant.nama}. Menu operasional sekolah kini tersedia di sidebar; keluar kapan saja untuk kembali ke tampilan global.`
                    : attentionCount > 0
                      ? `Terdapat ${stats.totalSekolah} sekolah terdaftar dengan ${attentionCount} tenant butuh perhatian (${stats.expiringTrialsCount} trial hampir habis/kadaluarsa, ${stats.totalSekolahSuspended} nonaktif).`
                      : `Seluruh ${stats.totalSekolah} sekolah aktif berjalan normal dengan ${stats.totalSiswa} siswa dan ${stats.totalGuru} guru. Pilih sekolah di bawah untuk masuk ke mode dukungan.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <Link
                  href={activeTenant ? `/sekolah?sekolahId=${activeTenant.id}` : "/sekolah"}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <span>{activeTenant ? "Profil & Unit Sekolah" : "Kelola Sekolah & Lisensi"}</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>

                {activeTenant ? (
                  <button
                    type="button"
                    onClick={handleExitTenant}
                    disabled={isClearingTenant}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {isClearingTenant ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <LogOut className="size-3.5" />
                    )}
                    <span>Keluar ke Mode Platform</span>
                  </button>
                ) : (
                  <a
                    href="#audit-trail"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all whitespace-nowrap"
                  >
                    <span>Riwayat Audit ({auditLogs.length})</span>
                  </a>
                )}
              </div>

              {activeTenant && (
                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  {[
                    { label: "Kurikulum", href: "/struktur-akademik" },
                    { label: "Data Siswa", href: "/data-siswa" },
                    { label: "Guru & Penugasan", href: "/guru-pengajaran" },
                    { label: "CBT", href: "/cbt-ujian" },
                    { label: "Integrasi", href: "/integrasi" },
                    { label: "Laporan", href: "/pimpinan" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-blue-300 text-[11px] font-semibold transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Minimalist 4-Card KPI Strip (Tanpa kotak ikon, tanpa gradient wall) */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/sekolah"
                className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-[16px] border border-slate-200/80 dark:border-white/15 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Sekolah
                </span>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    <AnimatedCounter value={stats.totalSekolah} decimals={0} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                    {stats.totalSekolahInstitusi} Lisensi • {stats.totalSekolahFreemium} Trial
                  </p>
                </div>
              </Link>

              <div className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-[16px] border border-slate-200/80 dark:border-white/15 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Siswa
                </span>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    <AnimatedCounter value={stats.totalSiswa} decimals={0} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                    {stats.totalGuru} Guru • {stats.totalRombel} Rombel
                  </p>
                </div>
              </div>

              <Link
                href="/sekolah"
                className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-[16px] border border-slate-200/80 dark:border-white/15 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Perlu Tindak Lanjut
                </span>
                <div className="mt-2.5">
                  <div
                    className={`font-mono text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                      attentionCount > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    <AnimatedCounter value={attentionCount} decimals={0} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                    {stats.expiringTrialsCount} Trial • {stats.totalSekolahSuspended} Nonaktif
                  </p>
                </div>
              </Link>

              <div className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-[16px] border border-slate-200/80 dark:border-white/15 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estimasi MRR
                </span>
                <div className="mt-2.5">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                    {formatCompactRupiah(telemetry.estimatedMrr)}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                    {telemetry.cbtRunningSessions} CBT Live • {telemetry.storageTotalMb} MB
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Daftar Sekolah (Minimalis & Langsung Bisa Aksi) */}
            <section className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/15 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Daftar Sekolah
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih &ldquo;Masuk&rdquo; untuk inspeksi sekolah atau &ldquo;Kelola&rdquo; untuk
                    mengatur lisensi
                  </p>
                </div>
                <Link
                  href="/sekolah"
                  className="text-xs font-mono font-bold text-[#2563EB] dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <span>Kelola Semua</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-2.5 pr-3 font-semibold">Sekolah</th>
                      <th className="pb-2.5 pr-3 font-semibold">Lisensi</th>
                      <th className="pb-2.5 pr-3 font-semibold">Skala</th>
                      <th className="pb-2.5 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {sekolahList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                          Belum ada sekolah terdaftar.
                        </td>
                      </tr>
                    ) : (
                      sekolahList.map((sch) => {
                        const isCurrentActive = activeTenant?.id === sch.id;
                        const isSwitching = switchingSchoolId === sch.id;

                        return (
                          <tr
                            key={sch.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {sch.nama}
                                </span>
                                {!sch.statusAktif && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                                    Nonaktif
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {sch.jenjang} • NPSN: {sch.npsn || "-"}
                              </div>
                            </td>
                            <td className="py-3 pr-3">{renderLicenseLabel(sch)}</td>
                            <td className="py-3 pr-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {sch.siswaCount} siswa • {sch.guruCount} guru
                            </td>
                            <td className="py-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {isCurrentActive ? (
                                  <button
                                    type="button"
                                    onClick={handleExitTenant}
                                    disabled={isClearingTenant}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
                                  >
                                    {isClearingTenant ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <LogOut className="size-3" />
                                    )}
                                    <span>Keluar</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleEnterTenant(sch.id)}
                                    disabled={isSwitching || !sch.statusAktif}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
                                  >
                                    {isSwitching ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <LogIn className="size-3" />
                                    )}
                                    <span>Masuk</span>
                                  </button>
                                )}
                                <Link
                                  href={`/sekolah?sekolahId=${sch.id}`}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition"
                                >
                                  Kelola
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT RAIL (4 Columns) — Ringkasan Sistem & Log Audit
          ───────────────────────────────────────────────────────── */}
          <div className="xl:col-span-4 space-y-4 sm:space-y-5">
            {/* Ringkasan Ekosistem */}
            <section className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/15 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ringkasan Platform
                </h2>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  Data Riil
                </span>
              </div>

              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Sesi KBM Tercatat</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white">
                    {stats.totalSesiAktual}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Kehadiran Tercatat</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white">
                    {attendance.totalPresensiRecorded > 0 ? `${attendance.hadirPct}%` : "Belum ada"}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Ujian CBT</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white">
                    {telemetry.cbtRunningSessions} berjalan / {telemetry.cbtTotal}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Login Gagal (24 Jam)</dt>
                  <dd
                    className={`font-mono font-bold ${
                      telemetry.failedLoginLast24h > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {telemetry.failedLoginLast24h}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">Berkas &amp; AI</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white">
                    {telemetry.storageTotalMb} MB • {telemetry.aiRequestsCount} AI
                  </dd>
                </div>
              </dl>

              {/* Mini Sebaran KBM 6 Hari */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Aktivitas KBM Mingguan</span>
                  <span className="font-mono">{stats.totalSesiAktual} sesi</span>
                </div>
                <div className="grid grid-cols-6 gap-2 items-end h-14 pt-1">
                  {daysActivity.map((d) => (
                    <div
                      key={d.day}
                      className="flex flex-col items-center gap-1 h-full justify-end"
                    >
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          d.count > 0
                            ? "bg-[#2563EB] dark:bg-blue-500"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                        style={{ height: `${d.heightPct}%` }}
                        title={`${d.day}: ${d.count} sesi`}
                      />
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {d.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Log Audit Terbaru */}
            <section
              id="audit-trail"
              className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/15 p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Log Audit</h2>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  {[
                    { id: "ALL", label: "Semua" },
                    { id: "CREATE", label: "Buat" },
                    { id: "UPDATE", label: "Ubah" },
                    { id: "DELETE", label: "Hapus" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAuditFilterAksi(item.id);
                        setAuditPage(1);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                        auditFilterAksi === item.id
                          ? "bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-300 shadow-2xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedAuditLogs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    Belum ada rekaman audit.
                  </p>
                ) : (
                  paginatedAuditLogs.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="w-full py-2.5 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-lg px-1.5 -mx-1.5 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-[#2563EB] dark:text-blue-400">
                            {log.aksi}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {log.tipe_sumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                          {log.aktor_role} • {log.timeAgo}
                        </div>
                      </div>
                      <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>

              {totalAuditPages > 1 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono">
                    {auditPage} / {totalAuditPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      disabled={auditPage === 1}
                      aria-label="Halaman audit sebelumnya"
                      className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                      disabled={auditPage === totalAuditPages}
                      aria-label="Halaman audit berikutnya"
                      className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Modal Detail Audit Log */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detail Audit Mutasi Data
                </h4>
                <span className="text-[11px] font-mono text-slate-400">ID: {selectedLog.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Tutup detail audit"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Aktor
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedLog.aktor_role}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Aksi</span>
                  <span className="font-bold text-[#2563EB] dark:text-blue-400 mt-0.5 block font-mono">
                    {selectedLog.aksi}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Modul
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedLog.tipe_sumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Waktu
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block text-[11px]">
                    {selectedLog.dibuat_pada}
                  </span>
                </div>
              </div>

              {selectedLog.payload_sesudah ? (
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                    Snapshot Data (JSON):
                  </span>
                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                    {selectedLog.payload_sesudah}
                  </pre>
                </div>
              ) : (
                <p className="py-4 text-center text-slate-400">
                  Tidak ada snapshot payload tersimpan.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
