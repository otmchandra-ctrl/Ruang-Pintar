"use client";

import { useEffect, useState, useSyncExternalStore, useRef, useCallback } from "react";
import { Download, Wifi, WifiOff, X, Share, Smartphone, RefreshCw } from "lucide-react";
import { listOfflineMutations, OFFLINE_QUEUE_CHANGED_EVENT } from "@/shared/lib/offline-sync-queue";
import { syncOfflineMutations } from "@/shared/lib/offline-sync-runner";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function subscribeToOnlineStatus(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getOnlineServerSnapshot() {
  return true;
}

export function PwaRegister() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  const isOffline = !isOnline;

  const [showBackOnline, setShowBackOnline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const prevOnlineRef = useRef(isOnline);

  const runOfflineSync = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    queueMicrotask(() => setIsSyncingQueue(true));
    try {
      const result = await syncOfflineMutations();
      const items = await listOfflineMutations();
      setPendingSyncCount(items.length);
      if (result.syncedCount > 0) {
        setSyncSuccessMsg(`${result.syncedCount} data offline berhasil disinkronkan.`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } finally {
      setIsSyncingQueue(false);
    }
  }, []);

  useEffect(() => {
    // Check if app is already running in installed standalone mode
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        const isStandalone =
          (typeof window.matchMedia === "function" &&
            window.matchMedia("(display-mode: standalone)").matches) ||
          (navigator as any).standalone === true;
        if (isStandalone) {
          setIsInstalled(true);
        }

        const ua = navigator.userAgent || "";
        const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        setIsIos(isIosDevice);

        const inApp = /WhatsApp|FBAN|FBAV|Instagram|Line|Telegram/i.test(ua);
        setIsInAppBrowser(inApp);
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncCount = () => {
      listOfflineMutations()
        .then((items) => {
          if (!isMounted) return;
          setPendingSyncCount(items.length);
          if (items.length > 0 && isOnline) {
            void runOfflineSync();
          }
        })
        .catch(() => {});
    };

    syncCount();

    const handleQueueChanged = () => {
      listOfflineMutations()
        .then((items) => {
          if (isMounted) setPendingSyncCount(items.length);
        })
        .catch(() => {});
    };

    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChanged);
    return () => {
      isMounted = false;
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChanged);
    };
  }, [runOfflineSync, isOnline]);

  useEffect(() => {
    let backOnlineTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOffline = () => {
      prevOnlineRef.current = false;
      setShowBackOnline(false);
      if (backOnlineTimer) {
        clearTimeout(backOnlineTimer);
        backOnlineTimer = null;
      }
    };

    const handleOnline = () => {
      if (!prevOnlineRef.current) {
        setShowBackOnline(true);
        void runOfflineSync();
        if (backOnlineTimer) clearTimeout(backOnlineTimer);
        backOnlineTimer = setTimeout(() => setShowBackOnline(false), 3500);
      }
      prevOnlineRef.current = true;
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (backOnlineTimer) clearTimeout(backOnlineTimer);
    };
  }, [runOfflineSync]);

  useEffect(() => {
    // 1. Service Worker: Hanya didaftarkan di production/test, dilarang di development lokal
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        // Di mode development (npm run dev), unregister semua service worker aktif dan bersihkan cache
        // agar Turbopack Fast Refresh / HMR tidak crash akibat chunk module lama yang tersimpan
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      } else {
        const registerServiceWorker = () => {
          navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
            console.warn("[PWA] Registrasi Service Worker gagal:", error);
          });
        };

        if (document.readyState === "complete") {
          registerServiceWorker();
        } else {
          window.addEventListener("load", registerServiceWorker);
        }
      }
    }

    // 2. PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
  };

  return (
    <>
      {/* 1. Offline Floating Pill */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Pemberitahuan status koneksi offline"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-full border border-amber-500/40 bg-slate-900/90 px-4 py-2 text-xs font-medium text-amber-300 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Koneksi offline &bull; Mode cadangan aktif</span>
        </aside>
      )}

      {/* 2. Back Online Toast */}
      {showBackOnline && !isOffline && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Pemberitahuan koneksi internet pulih"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-slate-900/90 px-4 py-2 text-xs font-medium text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Koneksi internet terhubung kembali</span>
        </aside>
      )}

      {/* 2b. Offline Sync Queue Status / Success Toast */}
      {syncSuccessMsg && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Status sinkronisasi offline"
          className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-full border border-cyan-500/40 bg-slate-900/95 px-4 py-2 text-xs font-medium text-cyan-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span>{syncSuccessMsg}</span>
        </aside>
      )}

      {pendingSyncCount > 0 && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Antrean sinkronisasi offline"
          className="fixed bottom-16 left-4 z-50 flex items-center gap-2.5 rounded-full border border-amber-500/40 bg-slate-900/95 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 shrink-0 text-amber-400 ${isSyncingQueue ? "animate-spin" : ""}`}
          />
          <span>
            {isSyncingQueue
              ? `Menyinkronkan ${pendingSyncCount} data...`
              : isOffline
                ? `${pendingSyncCount} data tersimpan offline`
                : `${pendingSyncCount} data menunggu sinkronisasi`}
          </span>
          {!isOffline && !isSyncingQueue && (
            <button
              type="button"
              onClick={runOfflineSync}
              className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              Sinkronkan
            </button>
          )}
        </aside>
      )}

      {/* 3. In-App Browser Warning (WhatsApp / Social Media Webview) */}
      {isInAppBrowser && !isBannerDismissed && (
        <aside
          role="region"
          aria-label="Petunjuk Buka Browser Asli"
          className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-white">Buka di Browser Asli</h2>
            <p className="line-clamp-2 text-[11px] text-slate-400">
              Ketuk menu ⋮ lalu pilih &quot;Buka di Chrome/Safari&quot; agar dapat memasang aplikasi
              ke HP Anda.
            </p>
          </div>

          <button
            onClick={handleDismissBanner}
            type="button"
            aria-label="Tutup petunjuk"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </aside>
      )}

      {/* 4. iOS Safari Add to Home Screen Hint */}
      {isIos && !isInstalled && !isBannerDismissed && !isInAppBrowser && !installPrompt && (
        <aside
          role="region"
          aria-label="Pemasangan Aplikasi di iPhone"
          className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Share className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-white">Pasang di iPhone / iPad</h2>
            <p className="line-clamp-2 text-[11px] text-slate-400">
              Ketuk tombol <strong>Bagikan (Share)</strong> di Safari, lalu pilih{" "}
              <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
            </p>
          </div>

          <button
            onClick={handleDismissBanner}
            type="button"
            aria-label="Tutup petunjuk"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </aside>
      )}

      {/* 5. Standard Browser PWA Install Prompt (Chrome / Edge / Android) */}
      {installPrompt && !isInstalled && !isBannerDismissed && (
        <aside
          role="region"
          aria-label="Pemasangan Aplikasi Ruang Pintar"
          className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Download className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-white">Pasang Ruang Pintar</h2>
            <p className="line-clamp-1 text-[11px] text-slate-400">
              Akses cepat tanpa browser dari layar utama Anda.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              type="button"
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-500 active:scale-95 transition-all"
            >
              Pasang
            </button>
            <button
              onClick={handleDismissBanner}
              type="button"
              aria-label="Tutup saran pemasangan"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
