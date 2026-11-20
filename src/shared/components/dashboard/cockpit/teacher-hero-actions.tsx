"use client";

import React from "react";
import Link from "next/link";
import { ClipboardCheck, BookOpen } from "lucide-react";
import { motion } from "@/shared/components/motion/motion-elements";

export function TeacherHeroActions() {
  return (
    <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
      {/* 1. Presensi Kilat (Primary Blue Glass Gradient) */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href="/presensi-kelas"
          className="px-4 py-2.5 rounded-xl text-white text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-sky-400 shadow-[0_12px_30px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:ring-2 hover:ring-blue-300/40"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>Presensi Kilat 15 Detik</span>
        </Link>
      </motion.div>

      {/* 2. Perangkat Ajar (Secondary Soft Glass with subtle blue glow on hover) */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href="/sesi-pembelajaran"
          className="px-4 py-2.5 rounded-xl bg-white/65 hover:bg-blue-50/70 dark:bg-slate-900/65 dark:hover:bg-blue-950/40 backdrop-blur-[12px] text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 border border-white/75 hover:border-blue-300/70 dark:border-white/20 dark:hover:border-blue-700/70 text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-[0_0_18px_rgba(59,130,246,0.25)]"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Perangkat Ajar</span>
        </Link>
      </motion.div>
    </div>
  );
}
