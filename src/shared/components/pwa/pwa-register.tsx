"use client";

import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { Download, Wifi, WifiOff, X } from "lucide-react";

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

  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    // If transitioning from offline -> online, show brief toast
    if (!prevOnlineRef.current && isOnline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3500);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            if (process.env.NODE_ENV !== "production") {
              console.log("[PWA] Service Worker terdaftar dengan scope:", registration.scope);
            }
          })
          .catch((error) => {
            console.warn("[PWA] Registrasi Service Worker gagal:", error);
          });
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
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

      {/* 3. Subtle Academic Glass Install Prompt */}
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
