"use client";

/**
 * Ruang Pintar — Resizable Image Stimulus Editor
 * Komponen editor gambar interaktif dengan drag corner handles di 4 sudut,
 * memungkinkan guru memperbesar / memperkecil ukuran stimulus gambar secara visual & intuitif.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ImageIcon, Maximize2, Trash2, Move, RotateCcw, Check, Sparkles } from "lucide-react";

export type ImageSizeMode = "SM" | "MD" | "LG" | "FULL";

export interface ResizableImageEditorProps {
  src: string;
  onUpdate: (newSrcWithMetadata: string, sizeMode: ImageSizeMode) => void;
  onRemove: () => void;
  currentSizeMode?: ImageSizeMode;
  className?: string;
  caption?: string;
}

export function ResizableImageEditor({
  src,
  onUpdate,
  onRemove,
  currentSizeMode = "MD",
  className = "",
  caption,
}: ResizableImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);

  // Parsing URL bersih dan metadata hash (misal #size=MD&w=420)
  const [cleanSrc, hash = ""] = src.split("#");
  const initialWidthParam = hash.match(/(?:width|w)=(\d+)/i)?.[1];
  const initialSizeParam = hash.match(/size=([a-zA-Z]+)/i)?.[1]?.toUpperCase() as ImageSizeMode;

  const defaultWidthFromMode = (mode: ImageSizeMode, maxContainerWidth: number): number => {
    switch (mode) {
      case "SM":
        return Math.min(220, maxContainerWidth);
      case "MD":
        return Math.min(380, maxContainerWidth);
      case "LG":
        return Math.min(560, maxContainerWidth);
      case "FULL":
      default:
        return maxContainerWidth;
    }
  };

  const [sizeMode, setSizeMode] = useState<ImageSizeMode>(
    initialSizeParam || currentSizeMode || "MD"
  );
  const [widthPx, setWidthPx] = useState<number>(() => {
    if (initialWidthParam) return parseInt(initialWidthParam, 10);
    return 380;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(700);

  // Ukur lebar container luar untuk pembatasan responsif
  useEffect(() => {
    const updateContainerW = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateContainerW();
    window.addEventListener("resize", updateContainerW);
    return () => window.removeEventListener("resize", updateContainerW);
  }, []);

  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    if (initialWidthParam) {
      setWidthPx(parseInt(initialWidthParam, 10));
      if (initialSizeParam) {
        setSizeMode(initialSizeParam);
      }
    } else if (currentSizeMode) {
      setSizeMode(currentSizeMode);
      setWidthPx(defaultWidthFromMode(currentSizeMode, containerWidth || 700));
    }
  }

  // Fungsi simpan perubahan ukuran ke parent
  const commitChanges = useCallback(
    (newWidth: number, newMode: ImageSizeMode) => {
      const clampedWidth = Math.round(newWidth);
      const newUrl = `${cleanSrc}#size=${newMode}&w=${clampedWidth}`;
      onUpdate(newUrl, newMode);
    },
    [cleanSrc, onUpdate]
  );

  // Deteksi mode perkiraan berdasarkan persentase lebar
  const inferModeFromWidth = (width: number, maxW: number): ImageSizeMode => {
    const ratio = width / (maxW || 1);
    if (ratio <= 0.35) return "SM";
    if (ratio <= 0.6) return "MD";
    if (ratio <= 0.85) return "LG";
    return "FULL";
  };

  // Handler Pointer Drag pada Corner Handles
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "right" | "bottom"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setActiveHandle(handle);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = imageBoxRef.current?.offsetWidth || widthPx;
    const maxW = containerRef.current?.offsetWidth || 700;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let calculatedW = initialWidth;

      if (handle === "bottom-right" || handle === "top-right" || handle === "right") {
        calculatedW = initialWidth + deltaX;
      } else if (handle === "bottom-left" || handle === "top-left") {
        calculatedW = initialWidth - deltaX;
      } else if (handle === "bottom") {
        const deltaY = moveEvent.clientY - startY;
        calculatedW = initialWidth + deltaY * 1.3;
      }

      const clamped = Math.max(140, Math.min(calculatedW, maxW));
      setWidthPx(Math.round(clamped));
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);
      setActiveHandle(null);

      const deltaX = upEvent.clientX - startX;
      let finalW = initialWidth;
      if (handle === "bottom-right" || handle === "top-right" || handle === "right") {
        finalW = initialWidth + deltaX;
      } else if (handle === "bottom-left" || handle === "top-left") {
        finalW = initialWidth - deltaX;
      } else if (handle === "bottom") {
        const deltaY = upEvent.clientY - startY;
        finalW = initialWidth + deltaY * 1.3;
      }
      const finalClamped = Math.max(140, Math.min(finalW, maxW));
      const nextMode = inferModeFromWidth(finalClamped, maxW);
      setSizeMode(nextMode);
      commitChanges(finalClamped, nextMode);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Preset Buttons (25%, 50%, 75%, 100%)
  const handleApplyPreset = (mode: ImageSizeMode) => {
    const maxW = containerRef.current?.offsetWidth || 700;
    const targetW = defaultWidthFromMode(mode, maxW);
    setSizeMode(mode);
    setWidthPx(targetW);
    commitChanges(targetW, mode);
  };

  const percentage = Math.min(
    100,
    Math.max(15, Math.round((widthPx / (containerWidth || 700)) * 100))
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border-2 border-blue-400/80 dark:border-blue-600/80 bg-blue-50/40 dark:bg-slate-900/50 p-4 space-y-3 transition-all ${className}`}
    >
      {/* 1. Header Toolbar Pengaturan Ukuran Gambar */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2 border-b border-blue-200/70 dark:border-blue-900/60">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ImageIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
              Gambar Stimulus Tersemat
            </span>
            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
              Tarik salah satu sudut bulat biru untuk memperbesar / memperkecil
            </span>
          </div>
        </div>

        {/* Quick Presets & Remove Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Ukuran:
          </span>
          {(
            [
              { key: "SM", label: "25% (Kecil)" },
              { key: "MD", label: "50% (Sedang)" },
              { key: "LG", label: "75% (Besar)" },
              { key: "FULL", label: "100% (Penuh)" },
            ] as const
          ).map((preset) => (
            <button
              type="button"
              key={preset.key}
              onClick={() => handleApplyPreset(preset.key)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                sizeMode === preset.key && !isDragging
                  ? "bg-blue-600 text-white shadow-xs scale-105"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-all cursor-pointer ml-1"
            title="Hapus gambar ini dari stimulus soal"
          >
            <Trash2 className="h-3 w-3" />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Resizable Image Canvas */}
      <div className="flex justify-center py-2 select-none">
        <div
          ref={imageBoxRef}
          style={{ width: `${widthPx}px`, maxWidth: "100%" }}
          className={`relative group rounded-2xl transition-[width] duration-75 ${
            isDragging
              ? "ring-3 ring-blue-500 ring-offset-2 ring-offset-blue-50 shadow-xl"
              : "hover:ring-2 hover:ring-blue-400/80 ring-offset-2 ring-offset-blue-50/50"
          }`}
        >
          {/* Badge Indikator Ukuran Live saat Drag / Hover */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-md transition-all ${
                isDragging
                  ? "bg-blue-600 text-white scale-110"
                  : "bg-slate-900/85 text-white/90 backdrop-blur-xs opacity-80 group-hover:opacity-100"
              }`}
            >
              📐 {widthPx}px ({percentage}%)
            </span>
          </div>

          {/* Gambar Stimulus */}
          <div className="overflow-hidden rounded-2xl border-2 border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cleanSrc}
              alt="Stimulus Soal"
              draggable={false}
              className="w-full h-auto object-contain max-h-[480px] rounded-2xl select-none"
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. SUDUT-SUDUT RESIZE HANDLES (CORNER & EDGE HANDLES)
          ───────────────────────────────────────────────────────────── */}
          {/* Sudut Kiri Atas */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "top-left")}
            className="absolute -top-2.5 -left-2.5 size-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-md cursor-nwse-resize z-30 hover:scale-125 hover:bg-blue-700 active:scale-150 transition-transform flex items-center justify-center touch-none"
            title="Tarik sudut untuk mengubah ukuran"
          />

          {/* Sudut Kanan Atas */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "top-right")}
            className="absolute -top-2.5 -right-2.5 size-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-md cursor-nesw-resize z-30 hover:scale-125 hover:bg-blue-700 active:scale-150 transition-transform flex items-center justify-center touch-none"
            title="Tarik sudut untuk mengubah ukuran"
          />

          {/* Sudut Kiri Bawah */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "bottom-left")}
            className="absolute -bottom-2.5 -left-2.5 size-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-md cursor-nesw-resize z-30 hover:scale-125 hover:bg-blue-700 active:scale-150 transition-transform flex items-center justify-center touch-none"
            title="Tarik sudut untuk mengubah ukuran"
          />

          {/* Sudut Kanan Bawah (Handle Utama Terpaling Nyaman) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "bottom-right")}
            className="absolute -bottom-2.5 -right-2.5 size-6 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-lg cursor-nwse-resize z-30 hover:scale-125 hover:bg-blue-700 active:scale-150 transition-transform flex items-center justify-center touch-none"
            title="Tarik sudut kanan-bawah untuk memperbesar / memperkecil"
          >
            <div className="size-2 rounded-full bg-white opacity-80" />
          </div>

          {/* Handle Kanan Tengah (Edge Handle Horizontal) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "right")}
            className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-7 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 shadow-md cursor-ew-resize z-30 hover:scale-125 hover:bg-blue-600 transition-transform touch-none"
            title="Tarik tepi kanan"
          />

          {/* Handle Bawah Tengah (Edge Handle Vertikal) */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "bottom")}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-3.5 w-7 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 shadow-md cursor-ns-resize z-30 hover:scale-125 hover:bg-blue-600 transition-transform touch-none"
            title="Tarik tepi bawah"
          />
        </div>
      </div>

      {caption && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center italic">
          {caption}
        </p>
      )}
    </div>
  );
}
