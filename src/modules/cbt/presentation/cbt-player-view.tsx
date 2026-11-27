"use client";

/**
 * Ruang Pintar — M14 CBT Secure Player View (Professional High-Taste Academic CBT)
 *
 * Invariant & Security Principles:
 * - Server Authoritative Timer: countdown sinkron dengan batas_waktu_server.
 * - Zero Answer Key Leakage: Hanya manifest_soal tanpa flag is_correct atau kunci_jawaban.
 * - Idempotent Autosave: Jawaban disimpan otomatis per pilihan / debounce teks.
 * - Safe Reload Guarantee: F5 / browser reload TIDAK dianggap curang.
 * - Fullscreen Enforcement Gate: Membuka layar penuh dengan transisi anggun tanpa lockout instan.
 * - High-Contrast Typography: Font terbaca sempurna 100% pada light dan dark theme.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";

const subscribeFullscreen = (callback: () => void) => {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
};
const getFullscreenSnapshot = () =>
  Boolean(typeof document !== "undefined" && document.fullscreenElement);
const getFullscreenServerSnapshot = () => false;
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Maximize2,
  Minimize2,
  Send,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Award,
  Check,
  RotateCcw,
  Volume2,
  X,
  Image as ImageIcon,
  ArrowRight,
  WifiOff,
  RefreshCw,
  LayoutGrid,
  ZoomIn,
  Flag,
  Filter,
} from "lucide-react";
import { SesiUjianSiswaDTO, ManifestItemSoal, HasilUjianCbtDTO } from "../domain/cbt-types";
import {
  autosaveAnswerAction,
  recordIntegrityEventAction,
  submitAttemptAction,
} from "@/app/actions/cbt-actions";
import * as cbtActions from "@/app/actions/cbt-actions";
import { MathRenderer } from "@/shared/components/cbt/math-renderer";
import { ImageStimulus } from "@/shared/components/cbt/image-stimulus";
import { AudioStimulusPlayer } from "@/shared/components/cbt/audio-stimulus-player";

function getAnswerDetails(ans: any): { isAnswered: boolean; label: string | null } {
  if (!ans) return { isAnswered: false, label: null };
  const hasChoice =
    ans.jawaban_pilihan !== undefined && ans.jawaban_pilihan !== null && ans.jawaban_pilihan !== "";
  if (hasChoice) {
    return { isAnswered: true, label: String(ans.jawaban_pilihan) };
  }
  const hasComplex = Array.isArray(ans.jawaban_kompleks) && ans.jawaban_kompleks.length > 0;
  if (hasComplex) {
    return { isAnswered: true, label: ans.jawaban_kompleks.join(",") };
  }
  const hasMatch =
    ans.jawaban_menjodohkan &&
    typeof ans.jawaban_menjodohkan === "object" &&
    Object.keys(ans.jawaban_menjodohkan).length > 0;
  if (hasMatch) {
    return { isAnswered: true, label: "✓" };
  }
  const hasText = typeof ans.jawaban_teks === "string" && ans.jawaban_teks.trim() !== "";
  if (hasText) {
    return { isAnswered: true, label: "✓" };
  }
  return { isAnswered: false, label: null };
}

interface CbtPlayerViewProps {
  initialSession: SesiUjianSiswaDTO;
  manifest: ManifestItemSoal[];
  initialTimeRemainingSeconds: number;
  initialSavedAnswers: Record<
    string,
    {
      jawaban_pilihan?: string | null;
      jawaban_teks?: string | null;
      jawaban_kompleks?: string[] | null;
      jawaban_menjodohkan?: Record<string, string> | null;
      ragu_ragu?: boolean;
    }
  >;
  ujian: {
    judul: string;
    deskripsi: string | null;
    acak_soal: boolean;
  };
  autosaveBatchDelayMs?: number;
}

export function CbtPlayerView({
  initialSession,
  manifest,
  initialTimeRemainingSeconds,
  initialSavedAnswers,
  ujian,
  autosaveBatchDelayMs = 8000,
}: CbtPlayerViewProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [currentIndex, setCurrentIndex] = useState(0);
  const STORAGE_KEY = `rp_cbt_answers_${session.id}`;

  // Font size scaler
  const [fontSize, setFontSize] = useState<"NORMAL" | "LARGE" | "XLARGE">("NORMAL");

  // Exam Recovery: Restore answers from local cache on mount
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`rp_cbt_answers_${initialSession.id}`);
        if (cached) {
          const localAnswers = JSON.parse(cached);
          if (localAnswers && typeof localAnswers === "object") {
            return { ...initialSavedAnswers, ...localAnswers };
          }
        }
      } catch {
        // LocalStorage fallback
      }
    }
    return initialSavedAnswers;
  });

  const sessionTokenRef = useRef<string | null>(initialSession.token_sesi_aktif || null);
  const [isSessionInvalidated, setIsSessionInvalidated] = useState(false);

  // Pre-Submit Synchronization Barrier & Batch Autosave Queue
  const pendingSyncMap = useRef<Map<number, any>>(new Map());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const lastInputBlurTimeRef = useRef<number>(0);
  const batchFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef<boolean>(false);

  // Safe Reload & Mount tracker: suppress false blur strikes during page reload / first 3s
  const isUnloadingRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
    };
    const handlePageHide = () => {
      isUnloadingRef.current = true;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  // Server Authoritative Countdown Timer
  const calculateRemainingSeconds = useCallback(() => {
    const deadline = new Date(session.batas_waktu_server).getTime();
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  }, [session.batas_waktu_server]);

  const [secondsLeft, setSecondsLeft] = useState<number>(initialTimeRemainingSeconds);

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return true;
  });
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "OFFLINE" | "ERROR">(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return "OFFLINE";
    }
    return "SAVED";
  });

  // Fullscreen management via useSyncExternalStore
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getFullscreenServerSnapshot
  );
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [showFullscreenPromptModal, setShowFullscreenPromptModal] = useState(false);

  // Show gate modal until student explicitly enters fullscreen or fullscreen is active
  const showFullscreenGate = !hasEnteredFullscreen && !isFullscreen;

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDaftarSoalModal, setShowDaftarSoalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<HasilUjianCbtDTO | null>(null);

  // Batch Flush Engine: mengirim seluruh jawaban tertunda dalam 1 request transaksi
  const flushPendingAutosaves = useCallback(async () => {
    if (batchFlushTimerRef.current) {
      clearTimeout(batchFlushTimerRef.current);
      batchFlushTimerRef.current = null;
    }

    if (pendingSyncMap.current.size === 0 || isFlushingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSaveStatus("OFFLINE");
      return;
    }

    isFlushingRef.current = true;
    setSaveStatus("SAVING");

    const entries = Array.from(pendingSyncMap.current.entries());
    const batchable = entries.filter(([, payload]) => Boolean(payload.soal_id));
    const legacy = entries.filter(([, payload]) => !payload.soal_id);

    try {
      let hasFailure = false;

      if (batchable.length > 0) {
        const hasBatchAction = Object.keys(cbtActions).includes("batchAutosaveAnswersAction");
        const batchFn = hasBatchAction
          ? ((cbtActions as Record<string, any>).batchAutosaveAnswersAction as
              ((input: any) => Promise<any>) | undefined)
          : undefined;
        if (typeof batchFn === "function" && (autosaveBatchDelayMs > 0 || batchable.length > 1)) {
          const res = await batchFn({
            sesi_ujian_siswa_id: session.id,
            session_token: sessionTokenRef.current,
            items: batchable.map(([, payload]) => payload),
          });
          if (res.success) {
            for (const [nomorUrut, sentPayload] of batchable) {
              if (pendingSyncMap.current.get(nomorUrut) === sentPayload) {
                pendingSyncMap.current.delete(nomorUrut);
              }
            }
          } else {
            if (res.message?.includes("perangkat lain")) {
              setIsSessionInvalidated(true);
              return;
            }
            hasFailure = true;
          }
        } else {
          for (const [nomorUrut, sentPayload] of batchable) {
            const res = await autosaveAnswerAction(sentPayload);
            if (res.success) {
              if (pendingSyncMap.current.get(nomorUrut) === sentPayload) {
                pendingSyncMap.current.delete(nomorUrut);
              }
            } else {
              if (res.message?.includes("perangkat lain")) {
                setIsSessionInvalidated(true);
                return;
              }
              hasFailure = true;
            }
          }
        }
      }

      for (const [nomorUrut, sentPayload] of legacy) {
        const res = await autosaveAnswerAction(sentPayload);
        if (res.success) {
          if (pendingSyncMap.current.get(nomorUrut) === sentPayload) {
            pendingSyncMap.current.delete(nomorUrut);
          }
        } else {
          if (res.message?.includes("perangkat lain")) {
            setIsSessionInvalidated(true);
            return;
          }
          hasFailure = true;
        }
      }

      setPendingSyncCount(pendingSyncMap.current.size);
      if (hasFailure) {
        setSaveStatus("OFFLINE");
      } else {
        setSaveStatus(pendingSyncMap.current.size === 0 ? "SAVED" : "SAVING");
      }
    } catch (err: any) {
      if (err?.message?.includes("perangkat lain")) {
        setIsSessionInvalidated(true);
        return;
      }
      setSaveStatus("OFFLINE");
    } finally {
      isFlushingRef.current = false;
      // Jika ada jawaban baru yang masuk saat request berjalan, jadwalkan ulang
      if (
        pendingSyncMap.current.size > 0 &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        batchFlushTimerRef.current = setTimeout(
          () => {
            void flushPendingAutosaves();
          },
          Math.max(0, autosaveBatchDelayMs)
        );
      }
    }
  }, [autosaveBatchDelayMs, session.id]);

  // Network connection listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      if (pendingSyncMap.current.size > 0) {
        setSaveStatus("SAVING");
        void flushPendingAutosaves();
      } else {
        setSaveStatus("SAVED");
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("OFFLINE");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (batchFlushTimerRef.current) {
        clearTimeout(batchFlushTimerRef.current);
      }
    };
  }, [flushPendingAutosaves]);

  // Anti-Cheat Strike State
  const [strikeCount, setStrikeCount] = useState(0);
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
  const [strikeMessage, setStrikeMessage] = useState("");
  const [internalLocked, setInternalLocked] = useState(false);
  const isLocked = internalLocked || session.status === "TERKUNCI_PELANGGARAN";

  const [isPending, startTransition] = useTransition();
  const activeQuestion = manifest[currentIndex] || manifest[0];

  // AUDIO SYNTHESIS ALERT INDICATOR
  const playAlertSound = useCallback(() => {
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(500, audioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Ignore audio failure
    }
  }, []);

  const handleForceSubmit = useCallback(
    async (_reason: string) => {
      setIsSubmitting(true);
      try {
        await flushPendingAutosaves();
        const res = await submitAttemptAction(session.id, sessionTokenRef.current);
        if (res.success && res.data) {
          setFinalResult(res.data);
          router.push(`/cbt/finished/${session.id}`);
        } else if (res.message?.includes("perangkat lain")) {
          setIsSessionInvalidated(true);
        }
      } catch (err: any) {
        if (err?.message?.includes("perangkat lain")) {
          setIsSessionInvalidated(true);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [flushPendingAutosaves, router, session.id]
  );

  useEffect(() => {
    if (finalResult || isLocked || isSessionInvalidated) return;

    const syncTick = () => {
      const remaining = calculateRemainingSeconds();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        handleForceSubmit("Waktu ujian telah berakhir");
      }
    };

    syncTick();
    const timer = setInterval(syncTick, 1000);

    const handleResumeSync = () => {
      if (!document.hidden) {
        syncTick();
      }
    };

    document.addEventListener("visibilitychange", handleResumeSync);
    window.addEventListener("focus", handleResumeSync);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleResumeSync);
      window.removeEventListener("focus", handleResumeSync);
    };
  }, [calculateRemainingSeconds, finalResult, handleForceSubmit, isLocked, isSessionInvalidated]);

  useEffect(() => {
    if (strikeCount > 0) {
      playAlertSound();
    }
  }, [strikeCount, playAlertSound]);

  // INTEGRITY MONITORING & AUDIT EVENT DISPATCH
  const triggerIntegrityViolation = useCallback(
    async (type: "PINDAH_TAB_ATAU_WINDOW" | "KELUAR_LAYAR_PENUH", desc: string) => {
      if (finalResult || isLocked || isUnloadingRef.current || isInitialMountRef.current) return;

      try {
        const res = await recordIntegrityEventAction({
          sesi_ujian_siswa_id: session.id,
          nomor_urut_soal: activeQuestion?.nomor_urut || null,
          tipe_event: type,
          deskripsi: desc,
        });

        if (res.success && res.data) {
          const newStrike = strikeCount + 1;
          setStrikeCount(newStrike);
          setStrikeMessage(desc);

          if (res.data.isLocked || newStrike >= 2) {
            setInternalLocked(true);
            setIsStrikeModalOpen(false);
          } else {
            setIsStrikeModalOpen(true);
          }
        }
      } catch {
        // Fail-safe
      }
    },
    [activeQuestion, finalResult, isLocked, session.id, strikeCount]
  );

  useEffect(() => {
    if (finalResult || isLocked) return;

    const handleVisibilityChange = () => {
      if (isUnloadingRef.current || isInitialMountRef.current) return;
      if (document.hidden) {
        triggerIntegrityViolation(
          "PINDAH_TAB_ATAU_WINDOW",
          "Terdeteksi meninggalkan lembar ujian (pindah tab atau aplikasi lain)."
        );
      }
    };

    const handleBlur = () => {
      if (isUnloadingRef.current || isInitialMountRef.current) return;
      if (!isStrikeModalOpen && !showSubmitModal && !showFullscreenGate) {
        triggerIntegrityViolation(
          "PINDAH_TAB_ATAU_WINDOW",
          "Fokus jendela ujian terlepas (membuka jendela / notifikasi eksternal)."
        );
      }
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      if (
        !isFull &&
        !isUnloadingRef.current &&
        !isInitialMountRef.current &&
        !isStrikeModalOpen &&
        !showSubmitModal
      ) {
        setShowFullscreenPromptModal(true);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (["c", "v", "x", "a", "u", "p", "s"].includes(key)) {
          e.preventDefault();
        }
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };

    const handleCopyCutPaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        lastInputBlurTimeRef.current = Date.now();
      }
    };

    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopyCutPaste);
    document.addEventListener("cut", handleCopyCutPaste);
    document.addEventListener("paste", handleCopyCutPaste);

    return () => {
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopyCutPaste);
      document.removeEventListener("cut", handleCopyCutPaste);
      document.removeEventListener("paste", handleCopyCutPaste);
    };
  }, [
    finalResult,
    isLocked,
    isStrikeModalOpen,
    showSubmitModal,
    showFullscreenGate,
    triggerIntegrityViolation,
  ]);

  const requestFullscreenSafe = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
      setHasEnteredFullscreen(true);
      setShowFullscreenPromptModal(false);
    } catch {
      // In mobile or restricted browser where fullscreen API is unavailable, permit continuation
      setHasEnteredFullscreen(true);
      setShowFullscreenPromptModal(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      requestFullscreenSafe();
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // AUTOSAVE LOGIC WITH WRITE-AHEAD CACHE
  const handleSavePatch = async (
    nomorUrut: number,
    patch: {
      jawaban_pilihan?: string | null;
      jawaban_teks?: string | null;
      jawaban_kompleks?: string[] | null;
      jawaban_menjodohkan?: Record<string, string> | null;
      ragu_ragu?: boolean;
    }
  ) => {
    const current = answers[nomorUrut] || {};
    const merged = { ...current, ...patch };

    // 1. Write-Ahead Cache to LocalStorage
    setAnswers((prev) => {
      const updated = { ...prev, [nomorUrut]: merged };
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    const qItem = manifest.find((m) => m.nomor_urut === nomorUrut);
    const resolvedSoalId = qItem?.soal_id || (qItem as any)?.bank_soal_id;
    const payload = {
      sesi_ujian_siswa_id: session.id,
      nomor_urut: nomorUrut,
      soal_id: resolvedSoalId,
      versi_soal_id: qItem?.versi_soal_id,
      session_token: sessionTokenRef.current,
      jawaban_pilihan: merged.jawaban_pilihan,
      jawaban_teks: merged.jawaban_teks,
      jawaban_kompleks: merged.jawaban_kompleks,
      jawaban_menjodohkan: merged.jawaban_menjodohkan,
      ragu_ragu: merged.ragu_ragu,
    };

    pendingSyncMap.current.set(nomorUrut, payload);
    setPendingSyncCount(pendingSyncMap.current.size);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSaveStatus("OFFLINE");
      return;
    }

    setSaveStatus("SAVING");

    if (autosaveBatchDelayMs <= 0 || pendingSyncMap.current.size >= 5) {
      void flushPendingAutosaves();
      return;
    }

    if (batchFlushTimerRef.current) {
      clearTimeout(batchFlushTimerRef.current);
    }
    batchFlushTimerRef.current = setTimeout(() => {
      void flushPendingAutosaves();
    }, autosaveBatchDelayMs);
  };

  const handleSelectChoice = (label: string) => {
    if (isLocked) return;
    handleSavePatch(activeQuestion.nomor_urut, { jawaban_pilihan: label });
  };

  const handleToggleComplexChoice = (label: string) => {
    if (isLocked) return;
    const current = answers[activeQuestion.nomor_urut]?.jawaban_kompleks || [];
    const next = current.includes(label)
      ? current.filter((item: string) => item !== label)
      : [...current, label].sort();
    handleSavePatch(activeQuestion.nomor_urut, { jawaban_kompleks: next });
  };

  const handleToggleRagu = () => {
    if (isLocked) return;
    const current = Boolean(answers[activeQuestion.nomor_urut]?.ragu_ragu);
    handleSavePatch(activeQuestion.nomor_urut, { ragu_ragu: !current });
  };

  const textDebounceTimer = useRef<any>(null);
  const handleTextChange = (value: string) => {
    if (isLocked) return;
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.nomor_urut]: {
        ...(prev[activeQuestion.nomor_urut] || {}),
        jawaban_teks: value,
      },
    }));

    clearTimeout(textDebounceTimer.current);
    textDebounceTimer.current = setTimeout(() => {
      handleSavePatch(activeQuestion.nomor_urut, { jawaban_teks: value });
    }, 600);
  };

  // Submit Final
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await flushPendingAutosaves();
      const res = await submitAttemptAction(session.id, sessionTokenRef.current);
      if (res.success && res.data) {
        setFinalResult(res.data);
        router.push(`/cbt/finished/${session.id}`);
      } else {
        alert(res.message || "Gagal mengumpulkan lembar ujian.");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kendala jaringan saat mengumpulkan.");
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Formatted timer
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const [gridFilter, setGridFilter] = useState<"ALL" | "UNANSWERED" | "RAGU" | "ANSWERED">("ALL");

  const answeredCount = manifest.filter((item) => {
    const ans = answers[item.nomor_urut] || answers[String(item.nomor_urut)];
    return getAnswerDetails(ans).isAnswered;
  }).length;

  const raguCount = manifest.filter((item) => {
    const ans = answers[item.nomor_urut] || answers[String(item.nomor_urut)];
    return Boolean(ans?.ragu_ragu);
  }).length;

  const belumCount = Math.max(0, manifest.length - answeredCount);

  const filteredManifest = manifest.filter((item) => {
    const ans = answers[item.nomor_urut] || answers[String(item.nomor_urut)];
    const details = getAnswerDetails(ans);
    if (gridFilter === "UNANSWERED") return !details.isAnswered;
    if (gridFilter === "RAGU") return Boolean(ans?.ragu_ragu);
    if (gridFilter === "ANSWERED") return details.isAnswered;
    return true;
  });

  const fontSizeClass =
    fontSize === "XLARGE"
      ? "text-lg sm:text-xl"
      : fontSize === "LARGE"
        ? "text-base sm:text-lg"
        : "text-sm sm:text-base";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col select-none relative font-sans antialiased">
      {/* FULLSCREEN ENTRY GATE MODAL */}
      {showFullscreenGate && !finalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 text-center space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Maximize2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                Mode Layar Penuh Ujian CBT
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {ujian.judul}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Untuk menjaga ketertiban, keadilan, dan fokus selama ujian berlangsung, lembar soal
                hanya dapat diakses dalam mode Layar Penuh (Fullscreen).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Timer berjalan sinkron dengan server sekolah.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Jawaban Anda tersimpan otomatis (autosave) secara berkala.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Dilarang berpindah tab atau membuka aplikasi lain.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={requestFullscreenSafe}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Masuk Layar Penuh & Buka Lembar Ujian</span>
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN EXIT PROMPT MODAL */}
      {showFullscreenPromptModal && !showFullscreenGate && !finalResult && !isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-4 shadow-2xl border-2 border-amber-500">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Perhatian: Layar Penuh Terlepas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Anda terdeteksi keluar dari mode layar penuh. Klik tombol di bawah untuk kembali ke
              mode layar penuh dan melanjutkan ujian.
            </p>
            <button
              type="button"
              onClick={requestFullscreenSafe}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              Kembali ke Layar Penuh Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              RP
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {ujian.judul}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Soal {currentIndex + 1} dari {manifest.length}
                </span>
                <span>•</span>
                {/* Autosave status pill */}
                <span className="flex items-center gap-1 font-medium">
                  {saveStatus === "SAVING" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                      <span className="text-amber-600 font-semibold">Menyimpan...</span>
                    </>
                  ) : saveStatus === "SAVED" ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Tersimpan
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-600 font-semibold">Tersimpan Lokal</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Font Scaler, Timer, Navigator Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-0.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setFontSize("NORMAL")}
                className={`px-2 py-1 rounded-lg transition ${
                  fontSize === "NORMAL"
                    ? "bg-white dark:bg-slate-700 text-blue-600 shadow-2xs font-black"
                    : "hover:text-slate-900"
                }`}
                title="Ukuran Huruf Standar"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("LARGE")}
                className={`px-2 py-1 rounded-lg transition ${
                  fontSize === "LARGE"
                    ? "bg-white dark:bg-slate-700 text-blue-600 shadow-2xs font-black"
                    : "hover:text-slate-900"
                }`}
                title="Ukuran Huruf Sedang"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize("XLARGE")}
                className={`px-2 py-1 rounded-lg transition ${
                  fontSize === "XLARGE"
                    ? "bg-white dark:bg-slate-700 text-blue-600 shadow-2xs font-black"
                    : "hover:text-slate-900"
                }`}
                title="Ukuran Huruf Besar"
              >
                A++
              </button>
            </div>

            {/* Authoritative Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-mono text-xs sm:text-sm font-bold shadow-2xs transition ${
                secondsLeft < 300
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 animate-pulse"
                  : secondsLeft < 900
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>{formattedTime}</span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition hidden sm:flex"
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Open Question Grid Drawer Button */}
            <button
              type="button"
              onClick={() => setShowDaftarSoalModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Daftar Soal</span>
              <span className="font-mono text-[11px] text-blue-600 font-bold">
                ({answeredCount}/{manifest.length})
              </span>
            </button>

            {/* Finish Button */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Active Question Card (3 Columns on desktop) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px] overflow-hidden">
          {(() => {
            const currentQuestionType =
              activeQuestion.jenis_soal || activeQuestion.tipe_soal || "PILIHAN_GANDA";
            const currentQuestionOptions: Array<{ label: string; teks: string; urutan?: number }> =
              activeQuestion.opsi || (activeQuestion.opsi_jawaban as any) || [];

            return (
              <>
                {/* Question Card Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-2xs">
                      {activeQuestion.nomor_urut}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {currentQuestionType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Bobot:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {activeQuestion.bobot}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleRagu}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      answers[activeQuestion.nomor_urut]?.ragu_ragu
                        ? "bg-amber-400 text-slate-950 shadow-2xs ring-2 ring-amber-400/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>Ragu-ragu</span>
                  </button>
                </div>

                {/* Question Card Body */}
                <div className="p-6 sm:p-8 flex-1 space-y-6">
                  {/* Stimulus Gambar if present */}
                  {activeQuestion.gambar_url &&
                    !/\.(mp3|wav|ogg|m4a)/i.test(activeQuestion.gambar_url) && (
                      <div className="flex justify-center my-2">
                        <ImageStimulus
                          src={activeQuestion.gambar_url}
                          alt="Ilustrasi Soal"
                          caption="Klik gambar untuk memperbesar tampilan"
                        />
                      </div>
                    )}

                  {/* Question Text with MathRenderer */}
                  <div
                    className={`font-normal leading-relaxed text-slate-900 dark:text-slate-100 ${fontSizeClass}`}
                  >
                    <MathRenderer content={activeQuestion.pertanyaan || ""} />
                  </div>

                  {/* Pilihan Ganda & Benar Salah */}
                  {(currentQuestionType === "PILIHAN_GANDA" ||
                    currentQuestionType === "BENAR_SALAH") &&
                    currentQuestionOptions.length > 0 && (
                      <div className="space-y-3 pt-3">
                        {currentQuestionOptions.map((op: any, opIdx: number) => {
                          const choiceLabel = op.label || op.id || String.fromCharCode(65 + opIdx);
                          const isSelected = Boolean(
                            answers[activeQuestion.nomor_urut]?.jawaban_pilihan &&
                            answers[activeQuestion.nomor_urut]?.jawaban_pilihan === choiceLabel
                          );

                          return (
                            <button
                              key={choiceLabel}
                              type="button"
                              onClick={() => handleSelectChoice(choiceLabel)}
                              className={`w-full text-left p-4 rounded-2xl border transition flex items-center gap-4 ${
                                isSelected
                                  ? "bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 shadow-sm"
                                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              <span
                                className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 transition ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {choiceLabel}
                              </span>
                              <div
                                className={`flex-1 text-slate-900 dark:text-slate-100 ${fontSizeClass}`}
                              >
                                <MathRenderer content={op.teks} />
                              </div>
                              {isSelected && (
                                <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Pilihan Ganda Kompleks */}
                  {currentQuestionType === "PILIHAN_GANDA_KOMPLEKS" &&
                    currentQuestionOptions.length > 0 && (
                      <div className="space-y-3 pt-3">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          * Pilih satu atau lebih opsi jawaban yang menurut Anda benar.
                        </p>
                        {currentQuestionOptions.map((op: any, opIdx: number) => {
                          const choiceLabel = op.label || op.id || String.fromCharCode(65 + opIdx);
                          const currentComplex =
                            answers[activeQuestion.nomor_urut]?.jawaban_kompleks || [];
                          const isChecked = Boolean(
                            currentComplex && currentComplex.includes(choiceLabel)
                          );

                          return (
                            <button
                              key={choiceLabel}
                              type="button"
                              onClick={() => handleToggleComplexChoice(choiceLabel)}
                              className={`w-full text-left p-4 rounded-2xl border transition flex items-center gap-4 ${
                                isChecked
                                  ? "bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 shadow-sm"
                                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              <span
                                className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 transition ${
                                  isChecked
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {choiceLabel}
                              </span>
                              <div
                                className={`flex-1 text-slate-900 dark:text-slate-100 ${fontSizeClass}`}
                              >
                                <MathRenderer content={op.teks} />
                              </div>
                              {isChecked && (
                                <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Isian Singkat */}
                  {currentQuestionType === "ISIAN_SINGKAT" && (
                    <div className="pt-3 space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ketikkan Jawaban Singkat Anda:
                      </label>
                      <input
                        type="text"
                        value={answers[activeQuestion.nomor_urut]?.jawaban_teks || ""}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder="Tuliskan jawaban Anda di sini..."
                        className="w-full text-sm sm:text-base px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  )}

                  {/* Uraian / Esai */}
                  {(currentQuestionType === "URAIAN_ESAI" || currentQuestionType === "ESAI") && (
                    <div className="pt-3 space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tuliskan Uraian / Penjelasan Lengkap Anda:
                      </label>
                      <textarea
                        rows={6}
                        value={answers[activeQuestion.nomor_urut]?.jawaban_teks || ""}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder="Tuliskan penjelasan jawaban secara runut..."
                        className="w-full text-sm sm:text-base px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed transition"
                      />
                    </div>
                  )}
                </div>

                {/* Question Footer Navigation */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Sebelumnya</span>
                  </button>

                  {/* Mobile Quick Jump Button to Open Daftar Soal */}
                  <button
                    type="button"
                    onClick={() => setShowDaftarSoalModal(true)}
                    className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>
                      Soal {currentIndex + 1}/{manifest.length}
                    </span>
                  </button>

                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
                    Nomor {currentIndex + 1} dari {manifest.length}
                  </div>

                  {currentIndex < manifest.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => Math.min(manifest.length - 1, prev + 1))
                      }
                      className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Selesaikan Ujian</span>
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Right 1 Column: Question Navigator Grid (Desktop) */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-blue-600" />
              <span>Daftar Soal</span>
            </h3>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {answeredCount}/{manifest.length} Dijawab
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${manifest.length > 0 ? (answeredCount / manifest.length) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setGridFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                gridFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Semua ({manifest.length})
            </button>
            <button
              type="button"
              onClick={() => setGridFilter("UNANSWERED")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                gridFilter === "UNANSWERED"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Belum ({belumCount})
            </button>
            <button
              type="button"
              onClick={() => setGridFilter("RAGU")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                gridFilter === "RAGU"
                  ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
              }`}
            >
              Ragu ({raguCount})
            </button>
            <button
              type="button"
              onClick={() => setGridFilter("ANSWERED")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                gridFilter === "ANSWERED"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100"
              }`}
            >
              Dijawab ({answeredCount})
            </button>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span>Dijawab</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span>Ragu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
              <span>Belum</span>
            </div>
          </div>

          {/* Grid Buttons */}
          {filteredManifest.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <p>Tidak ada butir soal dalam filter ini.</p>
              <button
                type="button"
                onClick={() => setGridFilter("ALL")}
                className="text-blue-600 hover:underline font-bold"
              >
                Tampilkan Semua Soal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
              {filteredManifest.map((item) => {
                const ans = answers[item.nomor_urut] || answers[String(item.nomor_urut)];
                const details = getAnswerDetails(ans);
                const isAnswered = details.isAnswered;
                const isRagu = Boolean(ans?.ragu_ragu);
                const originalIdx = manifest.findIndex((m) => m.nomor_urut === item.nomor_urut);
                const isActive = originalIdx === currentIndex;

                return (
                  <button
                    key={item.nomor_urut}
                    type="button"
                    onClick={() => setCurrentIndex(originalIdx)}
                    className={`group relative h-11 rounded-xl transition-all flex flex-col items-center justify-center p-1 cursor-pointer select-none ${
                      isActive
                        ? "ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-900 shadow-md font-black scale-105 z-10"
                        : "hover:scale-102"
                    } ${
                      isRagu
                        ? "bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-2xs border border-amber-500"
                        : isAnswered
                          ? "bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs border border-blue-700"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700"
                    }`}
                    title={`Soal #${item.nomor_urut}${isAnswered ? ` • Jawaban: ${details.label}` : " • Belum dijawab"}${isRagu ? " (Ragu-ragu)" : ""}`}
                  >
                    <span className="font-mono text-xs leading-none font-bold">
                      {item.nomor_urut}
                    </span>
                    {details.label && (
                      <span
                        className={`text-[9px] font-mono font-black mt-0.5 px-1 rounded-xs leading-tight max-w-full truncate ${
                          isRagu
                            ? "bg-amber-600 text-white"
                            : isAnswered
                              ? "bg-white/25 text-white"
                              : "text-slate-500"
                        }`}
                      >
                        {details.label}
                      </span>
                    )}
                    {isRagu && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[8px] font-black shadow-xs">
                        ?
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Kumpulkan Ujian Sekarang
          </button>
        </div>
      </main>

      {/* DAFTAR SOAL MODAL (Mobile Drawer) */}
      {showDaftarSoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Daftar Soal Ujian
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {answeredCount} dari {manifest.length} butir telah dijawab
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDaftarSoalModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${manifest.length > 0 ? (answeredCount / manifest.length) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Quick Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGridFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  gridFilter === "ALL"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Semua ({manifest.length})
              </button>
              <button
                type="button"
                onClick={() => setGridFilter("UNANSWERED")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  gridFilter === "UNANSWERED"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Belum ({belumCount})
              </button>
              <button
                type="button"
                onClick={() => setGridFilter("RAGU")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  gridFilter === "RAGU"
                    ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                }`}
              >
                Ragu ({raguCount})
              </button>
              <button
                type="button"
                onClick={() => setGridFilter("ANSWERED")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  gridFilter === "ANSWERED"
                    ? "bg-blue-600 text-white shadow-2xs font-bold"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100"
                }`}
              >
                Dijawab ({answeredCount})
              </button>
            </div>

            {/* Grid Buttons */}
            {filteredManifest.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <p>Tidak ada butir soal dalam kategori ini.</p>
                <button
                  type="button"
                  onClick={() => setGridFilter("ALL")}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition"
                >
                  Lihat Semua Soal
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-5 gap-2">
                  {filteredManifest.map((item) => {
                    const ans = answers[item.nomor_urut] || answers[String(item.nomor_urut)];
                    const details = getAnswerDetails(ans);
                    const isAnswered = details.isAnswered;
                    const isRagu = Boolean(ans?.ragu_ragu);
                    const originalIdx = manifest.findIndex((m) => m.nomor_urut === item.nomor_urut);
                    const isActive = originalIdx === currentIndex;

                    return (
                      <button
                        key={item.nomor_urut}
                        type="button"
                        onClick={() => {
                          setCurrentIndex(originalIdx);
                          setShowDaftarSoalModal(false);
                        }}
                        className={`group relative h-12 rounded-xl font-mono transition-all flex flex-col items-center justify-center p-1 cursor-pointer select-none ${
                          isActive
                            ? "ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-900 shadow-md font-black scale-105 z-10"
                            : "active:scale-95"
                        } ${
                          isRagu
                            ? "bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-2xs border border-amber-500"
                            : isAnswered
                              ? "bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs border border-blue-700"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700"
                        }`}
                        title={`Soal #${item.nomor_urut}${isAnswered ? ` • Jawaban: ${details.label}` : " • Belum dijawab"}${isRagu ? " (Ragu-ragu)" : ""}`}
                      >
                        <span className="text-xs leading-none font-bold">{item.nomor_urut}</span>
                        {details.label && (
                          <span
                            className={`text-[9px] font-mono font-black mt-0.5 px-1 rounded-xs leading-tight max-w-full truncate ${
                              isRagu
                                ? "bg-amber-600 text-white"
                                : isAnswered
                                  ? "bg-white/25 text-white"
                                  : "text-slate-500"
                            }`}
                          >
                            {details.label}
                          </span>
                        )}
                        {isRagu && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[8px] font-black shadow-xs">
                            ?
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend & Action */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span>Dijawab</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Ragu</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <span>Belum</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDaftarSoalModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Kumpulkan Lembar Ujian?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pastikan seluruh soal telah Anda jawab dengan teliti.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Butir Soal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {manifest.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Sudah Dijawab:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {answeredCount}
                </span>
              </div>
              {raguCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Masih Ragu-ragu:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{raguCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Belum Dijawab:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {manifest.length - answeredCount}
                </span>
              </div>
            </div>

            {manifest.length - answeredCount > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                Masih terdapat {manifest.length - answeredCount} butir soal yang belum dijawab.
                Lembar ujian yang dikumpulkan tidak dapat diubah kembali.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cek Kembali
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengumpulkan...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Ya, Kumpulkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRIKE / INTEGRITY WARNING MODAL */}
      {isStrikeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-4 shadow-2xl border-2 border-rose-500">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isLocked ? "SESI UJIAN TERKUNCI!" : "PERINGATAN INTEGRITAS UJIAN"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {strikeMessage}
            </p>
            {isLocked ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 font-bold">
                Status: TERKUNCI_PELANGGARAN. Silakan lapor kepada pengawas ujian untuk membuka
                kunci sesi Anda.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsStrikeModalOpen(false);
                  requestFullscreenSafe();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition"
              >
                Saya Mengerti & Kembali ke Ujian
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
