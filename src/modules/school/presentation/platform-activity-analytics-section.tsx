"use client";

import * as React from "react";
import { BarChart3, FileCheck } from "lucide-react";
import { ConcentricRingGauge } from "@/shared/components/motion/concentric-ring-gauge";
import type { PlatformActivityAnalyticsData } from "@/modules/school/application/platform-control-service";

interface PlatformActivityAnalyticsSectionProps {
  analytics: PlatformActivityAnalyticsData;
}

export function PlatformActivityAnalyticsSection({
  analytics,
}: PlatformActivityAnalyticsSectionProps) {
  const [hoveredDay, setHoveredDay] = React.useState<number | null>(null);
  const { activityDays, totalSesiAktual, attendance, totalRapor, totalMataPelajaran } = analytics;

  const daysActivity = React.useMemo(() => {
    const dayKeys: Array<{
      label: string;
      key: keyof PlatformActivityAnalyticsData["activityDays"];
    }> = [
      { label: "Senin", key: "SENIN" },
      { label: "Selasa", key: "SELASA" },
      { label: "Rabu", key: "RABU" },
      { label: "Kamis", key: "KAMIS" },
      { label: "Jumat", key: "JUMAT" },
      { label: "Sabtu", key: "SABTU" },
    ];

    return dayKeys.map(({ label, key }) => {
      const count = activityDays?.[key] ?? 0;
      return {
        day: label,
        count,
        pct: totalSesiAktual > 0 ? Math.round((count / totalSesiAktual) * 100) : 0,
      };
    });
  }, [activityDays, totalSesiAktual]);

  const chartPoints = React.useMemo(() => {
    const xCoords = [35, 120, 205, 295, 385, 465];
    const maxVal = Math.max(...daysActivity.map((d) => d.count), 1);

    return daysActivity.map((d, i) => {
      const y = Math.round(105 - (d.count / maxVal) * 80);
      return {
        x: xCoords[i],
        y,
        day: d.day,
        count: d.count,
        pct: d.pct,
      };
    });
  }, [daysActivity]);

  const { linePath, areaPath } = React.useMemo(() => {
    if (chartPoints.length === 0) return { linePath: "", areaPath: "" };

    let line = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      const prev = chartPoints[i - 1];
      const curr = chartPoints[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const firstX = chartPoints[0].x;
    const lastX = chartPoints[chartPoints.length - 1].x;
    const area = `${line} L ${lastX} 115 L ${firstX} 115 Z`;

    return { linePath: line, areaPath: area };
  }, [chartPoints]);

  const peakDayInfo = React.useMemo(() => {
    let max = -1;
    let peakDays: string[] = [];
    for (const d of daysActivity) {
      if (d.count > max) {
        max = d.count;
        peakDays = [d.day];
      } else if (d.count === max && max > 0) {
        peakDays.push(d.day);
      }
    }
    if (max <= 0) return "Belum Ada Sesi";
    return peakDays.join(" & ");
  }, [daysActivity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      {/* Left 6 Cols: Ringkasan Aktivitas Pembelajaran (Grafik Garis KBM) */}
      <div className="lg:col-span-6 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-blue-400/40">
        <div>
          <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-lato">
                  Ringkasan Aktivitas Pembelajaran
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring frekuensi pelaksanaan sesi Kegiatan Belajar Mengajar (KBM) harian oleh
                guru di kelas
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px] font-bold">
              <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Live KBM Sync</span>
            </div>
          </div>

          {/* Interactive Dynamic Wave & Data Points */}
          <div className="pt-4 relative">
            <svg className="w-full h-36 overflow-visible" viewBox="0 0 500 120">
              <defs>
                <linearGradient id="platformSchoolWaveGradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line
                x1="0"
                y1="25"
                x2="500"
                y2="25"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="65"
                x2="500"
                y2="65"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="105"
                x2="500"
                y2="105"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="3 3"
              />

              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#platformSchoolWaveGradBlue)"
                  className="transition-all duration-500 ease-out"
                />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500 ease-out"
                />
              )}

              {chartPoints.map((pt, i) => (
                <g
                  key={pt.day}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="cursor-pointer group"
                >
                  {hoveredDay === i && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={10}
                      className="fill-blue-500/20 stroke-blue-500/40 stroke-1 animate-pulse"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredDay === i ? 6.5 : 4.5}
                    className={`stroke-white dark:stroke-slate-900 stroke-2 transition-all duration-200 ${
                      pt.count > 0 ? "fill-blue-600" : "fill-slate-400 dark:fill-slate-600"
                    }`}
                  />
                  {hoveredDay === i && (
                    <g className="pointer-events-none transition-all">
                      <rect
                        x={Math.max(8, Math.min(410, pt.x - 42))}
                        y={Math.max(4, pt.y - 28)}
                        width="84"
                        height="20"
                        rx="5"
                        className="fill-slate-900/90 dark:fill-slate-800/95 stroke-slate-700/50 stroke-1 shadow-sm"
                      />
                      <text
                        x={Math.max(8, Math.min(410, pt.x - 42)) + 42}
                        y={Math.max(4, pt.y - 28) + 14}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-white font-mono"
                      >
                        {pt.day}: {pt.count} sesi
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>

            <div className="grid grid-cols-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 px-1">
              {daysActivity.map((d, i) => (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`py-1 rounded-xl transition-all cursor-pointer ${
                    hoveredDay === i
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-extrabold shadow-2xs"
                      : "hover:text-blue-600"
                  }`}
                >
                  <span className="block text-[11px]">{d.day}</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {d.count} Sesi
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Hari Teraktif
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5 block">
              {peakDayInfo}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Sesi KBM
            </span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
              {totalSesiAktual} Sesi Terdata
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Status KBM</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block">
              {totalSesiAktual > 0 ? "Sesi Berjalan" : "Terkoneksi"}
            </span>
          </div>
        </div>
      </div>

      {/* Right 6 Cols: Learner Engagement Ring Gauge + Penyampaian Nilai Akademik */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
        <div className="rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 transition-all duration-300 hover:shadow-lg hover:border-blue-400/40">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-lato">
              Learner Engagement
            </h2>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Keaktifan Siswa
            </span>
          </div>

          <div className="pt-2">
            <ConcentricRingGauge
              title=""
              subtitle=""
              centerValue={attendance.hadirPct}
              centerLabel={
                attendance.totalPresensiRecorded > 0 ? "Rata-rata Kehadiran" : "0 Sesi Masuk"
              }
              segments={[
                {
                  id: "hadir",
                  label: "Siswa Hadir Tepat Waktu",
                  count: attendance.totalPresensiHadir,
                  percentage: attendance.hadirPct,
                  color: "#2563EB",
                  strokeColor: "#2563EB",
                  bgColor: "bg-blue-500",
                },
                {
                  id: "izinsakit",
                  label: "Izin & Sakit Terverifikasi",
                  count: attendance.totalPresensiIzinSakit,
                  percentage: attendance.izinSakitPct,
                  color: "#F59E0B",
                  strokeColor: "#F59E0B",
                  bgColor: "bg-amber-500",
                },
                {
                  id: "alpha",
                  label: "Alpha / Perlu Perhatian",
                  count: attendance.totalPresensiAlpha,
                  percentage: attendance.alphaPct,
                  color: "#F43F5E",
                  strokeColor: "#F43F5E",
                  bgColor: "bg-rose-500",
                },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white p-5 sm:p-6 shadow-lg shadow-blue-600/20 border border-blue-400/40 space-y-3 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
              Penyampaian Nilai Akademik
            </span>
            <FileCheck className="size-4 text-emerald-300" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1 font-mono">
            <div>
              <span className="text-2xl font-black text-white">{totalRapor}</span>
              <span className="text-[11px] text-blue-200 block font-lato font-normal">
                e-Rapor Dicetak
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-white">{totalMataPelajaran}</span>
              <span className="text-[11px] text-blue-200 block font-lato font-normal">
                Mata Pelajaran Aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
