"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Users, Clock, ClipboardCheck, ShieldCheck } from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
  InteractiveCard,
} from "@/shared/components/motion/motion-elements";
import { AnimatedCounter } from "@/shared/components/motion/animated-counter";

export interface TeacherKpiGridProps {
  isOwnerTenant?: boolean;
  totalRombel: number;
  activeAssignmentsCount: number;
  uniqueMapelsCount: number;
  totalSiswaBinaan: number;
  totalJamMinggu: number;
  totalTugasPerluDiperiksa: number;
  totalCbtAktif: number;
}

export function TeacherKpiGrid({
  isOwnerTenant = false,
  totalRombel,
  activeAssignmentsCount,
  uniqueMapelsCount,
  totalSiswaBinaan,
  totalJamMinggu,
  totalTugasPerluDiperiksa,
  totalCbtAktif,
}: TeacherKpiGridProps) {
  return (
    <StaggerContainer
      staggerDelay={0.06}
      delayChildren={0.02}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      {/* 1. Total Rombel & Penugasan Mengajar */}
      <StaggerItem>
        <Link href="/kelas-saya" className="block h-full group">
          <InteractiveCard
            hoverY={-3}
            hoverScale={1.02}
            className="h-full p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md hover:border-white/90 dark:hover:border-white/30 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {isOwnerTenant ? "Total Kelas" : "Rombel Diajar"}
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                <AnimatedCounter value={totalRombel} decimals={0} />
              </div>
              <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                Rombel
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {activeAssignmentsCount} Penugasan • {uniqueMapelsCount} Mapel
              </p>
            </div>
          </InteractiveCard>
        </Link>
      </StaggerItem>

      {/* 2. Total Siswa Riil */}
      <StaggerItem>
        <InteractiveCard
          hoverY={-3}
          hoverScale={1.02}
          className="h-full p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {isOwnerTenant ? "Siswa Workspace" : "Siswa Binaan"}
            </span>
          </div>
          <div className="mt-2.5">
            <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              <AnimatedCounter value={totalSiswaBinaan} decimals={0} />
            </div>
            <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              Siswa
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Total Siswa Aktif
            </p>
          </div>
        </InteractiveCard>
      </StaggerItem>

      {/* 3. Total Beban Mengajar (JP Riil) */}
      <StaggerItem>
        <Link href="/jadwal-saya" className="block h-full group">
          <InteractiveCard
            hoverY={-3}
            hoverScale={1.02}
            className="h-full p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md hover:border-white/90 dark:hover:border-white/30 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Beban KBM
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                <AnimatedCounter value={totalJamMinggu} decimals={0} />
              </div>
              <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                JP / Minggu
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Jam per Minggu
              </p>
            </div>
          </InteractiveCard>
        </Link>
      </StaggerItem>

      {/* 4. Tugas Belum Dinilai */}
      <StaggerItem>
        <Link href="/penilaian" className="block h-full group">
          <InteractiveCard
            hoverY={-3}
            hoverScale={1.02}
            className="h-full p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md hover:border-white/90 dark:hover:border-white/30 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Koreksi Tugas
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                <AnimatedCounter value={totalTugasPerluDiperiksa} decimals={0} />
              </div>
              <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                Tugas
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {totalTugasPerluDiperiksa > 0 ? "Menunggu Penilaian" : "Semua Terkoreksi"}
              </p>
            </div>
          </InteractiveCard>
        </Link>
      </StaggerItem>

      {/* 5. CBT & Ujian Aktif */}
      <StaggerItem className="col-span-2 sm:col-span-1">
        <Link href="/cbt-ujian" className="block h-full group">
          <InteractiveCard
            hoverY={-3}
            hoverScale={1.02}
            className="h-full p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-[16px] border border-white/75 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-md hover:border-white/90 dark:hover:border-white/30 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                CBT Aktif
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                <AnimatedCounter value={totalCbtAktif} decimals={0} />
              </div>
              <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                Ujian CBT
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {totalCbtAktif > 0 ? "Ujian Berlangsung" : "Tidak Ada Ujian Aktif"}
              </p>
            </div>
          </InteractiveCard>
        </Link>
      </StaggerItem>
    </StaggerContainer>
  );
}
