"use client";

/**
 * Ruang Pintar — Material Detail Modal (Student Academic Reader UI)
 *
 * Antarmuka Pembaca Materi Digital Mandiri untuk Siswa:
 * - Pembaca PDF In-App Tersemat (Embedded In-App PDF Reader)
 * - Mode Baca Layar Penuh & Opsi Unduh Berkas Offline
 * - Tipografi Artikel Teks Nyaman dengan Pengatur Ukuran Huruf (A-/A+)
 * - Pemutar Video Belajar Tersemat (YouTube / Video Web)
 * - Tautan Sumber Pembelajaran Daring
 */

import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Video,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  X,
  Clock,
  Maximize2,
  FileCode,
  Image as ImageIcon,
} from "lucide-react";
import { StudentMaterialItem } from "../domain/student-experience-types";

export interface MaterialDetailModalProps {
  material: StudentMaterialItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MaterialDetailModal({ material, isOpen, onClose }: MaterialDetailModalProps) {
  const [showEmbeddedDoc, setShowEmbeddedDoc] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  if (!isOpen || !material) return null;

  // Deteksi format berkas
  const isPdf = Boolean(
    material.berkas?.mimeType?.toLowerCase().includes("pdf") ||
    material.berkas?.namaFileAsli?.toLowerCase().endsWith(".pdf")
  );

  const isImage = Boolean(
    material.berkas?.mimeType?.toLowerCase().startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|svg)$/i.test(material.berkas?.namaFileAsli || "")
  );

  // Helper parsing YouTube embed
  const getYouTubeEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      } else if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.slice(1);
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const videoEmbedUrl =
    material.tipeKonten === "VIDEO" || material.tautanUrl
      ? getYouTubeEmbedUrl(material.tautanUrl)
      : null;

  // Estimasi waktu baca untuk materi teks
  const readTimeMinutes = material.kontenTeks
    ? Math.max(1, Math.ceil(material.kontenTeks.trim().split(/\s+/).length / 180))
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl max-h-[94vh] rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ======================================================== */}
        {/* HEADER MODAL                                            */}
        {/* ======================================================== */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="space-y-1.5 max-w-2xl">
            {/* Context Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[#2563EB] dark:text-blue-300 text-xs font-bold">
                {material.mataPelajaranNama}
              </span>
              {material.babJudul && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  {material.babJudul}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                {material.tipeKonten}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-snug">
              {material.judul}
            </h2>

            {/* Metadata */}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diterbitkan oleh:{" "}
              <strong className="text-slate-700 dark:text-slate-200">{material.guruNama}</strong> •{" "}
              {material.tanggalPublikasiFormatted}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* BODY MODAL (SCROLLABLE)                                 */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Deskripsi / Pengantar Guru */}
          {material.deskripsi && (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-[#2563EB] dark:text-blue-400 block mb-0.5">
                Pengantar Belajar:
              </span>
              {material.deskripsi}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* 1. MATERI BERKAS DOKUMEN / PDF                         */}
          {/* ------------------------------------------------------ */}
          {material.berkas && (
            <div className="space-y-4">
              {/* Document Banner & Actions Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/60 dark:from-slate-800/80 dark:to-slate-800/50 border border-blue-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm">
                    {isPdf ? (
                      <FileText className="h-6 w-6" />
                    ) : isImage ? (
                      <ImageIcon className="h-6 w-6" />
                    ) : (
                      <FileCode className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {material.berkas.namaFileAsli}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isPdf ? "Dokumen PDF Siap Baca" : "Berkas Lampiran Pembelajaran"} •{" "}
                      {Math.round(material.berkas.ukuranByte / 1024)} KB
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Pembaca Dokumen */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Buka Layar Penuh / Tab Baru */}
                  <a
                    href={`/api/berkas/${material.berkas.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    title="Buka dokumen di tab baru peramban untuk membaca layar penuh"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Baca di Tab Baru</span>
                  </a>

                  {/* Toggle Pratinjau Tersemat (Khusus PDF/Image) */}
                  {(isPdf || isImage) && (
                    <button
                      type="button"
                      onClick={() => setShowEmbeddedDoc((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      {showEmbeddedDoc ? (
                        <>
                          <EyeOff className="h-4 w-4 text-slate-400" />
                          <span className="hidden sm:inline">Sembunyikan Pratinjau</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 text-[#2563EB]" />
                          <span className="hidden sm:inline">Tampilkan Pratinjau</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Unduh Berkas Offline */}
                  <a
                    href={`/api/berkas/${material.berkas.id}`}
                    download={material.berkas.namaFileAsli}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    title="Simpan berkas materi ke perangkat Anda"
                  >
                    <Download className="h-4 w-4 text-slate-500" />
                    <span>Unduh</span>
                  </a>
                </div>
              </div>

              {/* In-App Embedded PDF Viewer */}
              {isPdf && showEmbeddedDoc && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#2563EB]" />
                      Pratinjau Dokumen Langsung (In-App Reader):
                    </span>
                    <a
                      href={`/api/berkas/${material.berkas.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="h-3 w-3" />
                      Layar Penuh
                    </a>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 relative shadow-inner">
                    <iframe
                      src={`/api/berkas/${material.berkas.id}#view=FitH`}
                      className="w-full h-[450px] sm:h-[580px] border-0"
                      title={material.berkas.namaFileAsli}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                    Gunakan scroll untuk membaca lembar dokumen, atau klik{" "}
                    <strong>Baca di Tab Baru</strong> jika peramban perangkat Anda membatasi
                    tampilan tersemat.
                  </p>
                </div>
              )}

              {/* In-App Image Viewer */}
              {isImage && showEmbeddedDoc && (
                <div className="space-y-2">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/berkas/${material.berkas.id}`}
                      alt={material.berkas.namaFileAsli}
                      className="max-h-[500px] w-auto object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* 2. MATERI TEKS ARTIKEL / MODUL RINGKASAN               */}
          {/* ------------------------------------------------------ */}
          {material.tipeKonten === "TEKS" && material.kontenTeks && (
            <div className="space-y-3">
              {/* Reading Controls Toolbar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <BookOpen className="h-4 w-4 text-[#2563EB]" />
                  <span>Modul Bacaan Artikel</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <Clock className="h-3.5 w-3.5" />± {readTimeMinutes} menit baca
                  </span>
                </div>

                {/* Font Size Adjuster */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Ukuran:</span>
                  <button
                    type="button"
                    onClick={() => setFontSize("sm")}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fontSize === "sm"
                        ? "bg-[#2563EB] text-white"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize("base")}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fontSize === "base"
                        ? "bg-[#2563EB] text-white"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize("lg")}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fontSize === "lg"
                        ? "bg-[#2563EB] text-white"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Article Content Container */}
              <div
                className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line font-sans shadow-xs ${
                  fontSize === "sm"
                    ? "text-xs sm:text-sm"
                    : fontSize === "lg"
                      ? "text-base sm:text-lg leading-loose"
                      : "text-sm sm:text-base"
                }`}
              >
                {material.kontenTeks}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* 3. MATERI VIDEO BELAJAR (YOUTUBE / EMBED)              */}
          {/* ------------------------------------------------------ */}
          {videoEmbedUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Video className="h-4 w-4 text-[#2563EB]" />
                  Pemutar Video Pembelajaran:
                </span>
                {material.tautanUrl && (
                  <a
                    href={material.tautanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Buka di YouTube
                  </a>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video relative shadow-md">
                <iframe
                  src={videoEmbedUrl}
                  title={material.judul}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* 4. TAUTAN SUMBER BELAJAR DARING                        */}
          {/* ------------------------------------------------------ */}
          {material.tautanUrl && !videoEmbedUrl && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Tautan Sumber Belajar Daring:
                </span>
                <p className="text-xs sm:text-sm text-[#2563EB] dark:text-blue-400 font-semibold truncate">
                  {material.tautanUrl}
                </p>
                <p className="text-[11px] text-slate-400">
                  Klik tombol di samping untuk membuka modul digital pada peramban web Anda.
                </p>
              </div>

              <a
                href={material.tautanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 text-[#2563EB]" />
                <span>Buka Tautan Eksternal</span>
              </a>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FOOTER MODAL                                            */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
            Ruang Pintar • Pembaca Materi Digital Siswa
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            Tutup Pembaca
          </button>
        </div>
      </div>
    </div>
  );
}
