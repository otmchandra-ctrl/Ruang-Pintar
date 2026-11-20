"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { getTeacherTrialStatusAction } from "@/app/actions/smart-onboarding-actions";
import { TeacherTrialStatusDTO } from "@/modules/ai-assistant/domain/ai-types";

export function TeacherTrialPill() {
  const [trialStatus, setTrialStatus] = useState<TeacherTrialStatusDTO | null>(null);

  useEffect(() => {
    getTeacherTrialStatusAction().then((res) => {
      if (res.success && res.data) {
        setTrialStatus(res.data as TeacherTrialStatusDTO);
      }
    });
  }, []);

  if (!trialStatus) return null;

  if (!trialStatus.is_trial) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs"
        title="Sekolah Anda telah terdaftar dan memiliki lisensi aktif penuh"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Lisensi Sekolah Aktif</span>
      </div>
    );
  }

  const handleOpenUpgrade = () => {
    window.dispatchEvent(new CustomEvent("open-subscription-modal"));
  };

  return (
    <button
      type="button"
      onClick={handleOpenUpgrade}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-[#2563EB] dark:text-blue-400 text-xs font-mono font-bold border border-blue-200/80 dark:border-blue-800/60 shadow-2xs transition-all cursor-pointer group"
      title="Klik untuk melihat status lisensi atau upgrade ke Guru Pro"
    >
      <Clock className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
      <span>Uji Coba: {trialStatus.days_remaining} Hari</span>
      <span className="hidden sm:inline text-[10px] text-blue-500/80 dark:text-blue-400/80 font-normal">
        (Upgrade)
      </span>
    </button>
  );
}
