"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Award,
  ListChecks,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Users,
  FileCheck2,
  BarChart3,
  PieChart,
  Lock,
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  KisiKisiAsesmenDTO,
  KartuSoalPayloadDTO,
  NaskahSoalPayloadDTO,
  KunciJawabanPayloadDTO,
  DaftarHadirPayloadDTO,
  BeritaAcaraPayloadDTO,
  CoverPaketAsesmenPayloadDTO,
  BerkasPengesahanPayloadDTO,
  RekapNilaiAsesmenPayloadDTO,
  AnalisisButirSoalPayloadDTO,
} from "@/modules/assessment/domain/assessment-types";
import { CoverPaketPrintView } from "./cover-paket-print-view";
import { BerkasPengesahanPrintView } from "./berkas-pengesahan-print-view";
import { KisiKisiPrintView } from "./kisi-kisi-print-view";
import { KartuSoalPrintView } from "./kartu-soal-print-view";
import { NaskahSoalPrintView } from "./naskah-soal-print-view";
import { KunciJawabanPrintView } from "./kunci-jawaban-print-view";
import { DaftarHadirPrintView } from "./daftar-hadir-print-view";
import { BeritaAcaraPrintView } from "./berita-acara-print-view";
import { RekapNilaiAsesmenPrintView } from "./rekap-nilai-asesmen-print-view";
import { AnalisisButirSoalPrintView } from "./analisis-butir-soal-print-view";
import {
  freezeKisiKisiAction,
  getKisiKisiDocumentAction,
  getKartuSoalDocumentAction,
  getNaskahSoalDocumentAction,
  getKunciJawabanDocumentAction,
  getDaftarHadirDocumentAction,
  getBeritaAcaraDocumentAction,
  getCoverPaketDocumentAction,
  getBerkasPengesahanDocumentAction,
  getRekapNilaiAsesmenDocumentAction,
  getAnalisisButirSoalDocumentAction,
} from "@/app/actions/assessment-administration-actions";

export type DocumentTab =
  | "cover-paket"
  | "berkas-pengesahan"
  | "kisi-kisi"
  | "kartu-soal"
  | "naskah-soal"
  | "kunci-jawaban"
  | "daftar-hadir"
  | "berita-acara"
  | "rekap-nilai"
  | "analisis-butir";

interface AdministrationHubViewProps {
  asesmenId: string;
  initialCoverPaket?: CoverPaketAsesmenPayloadDTO | null;
  initialBerkasPengesahan?: BerkasPengesahanPayloadDTO | null;
  initialKisiKisi?: KisiKisiAsesmenDTO | null;
  initialKartuSoal?: KartuSoalPayloadDTO | null;
  initialNaskahSoal?: NaskahSoalPayloadDTO | null;
  initialKunciJawaban?: KunciJawabanPayloadDTO | null;
  initialDaftarHadir?: DaftarHadirPayloadDTO | null;
  initialBeritaAcara?: BeritaAcaraPayloadDTO | null;
  initialRekapNilai?: RekapNilaiAsesmenPayloadDTO | null;
  initialAnalisisButir?: AnalisisButirSoalPayloadDTO | null;
}

export function AdministrationHubView({
  asesmenId,
  initialCoverPaket,
  initialBerkasPengesahan,
  initialKisiKisi,
  initialKartuSoal,
  initialNaskahSoal,
  initialKunciJawaban,
  initialDaftarHadir,
  initialBeritaAcara,
  initialRekapNilai,
  initialAnalisisButir,
}: AdministrationHubViewProps) {
  const [activeTab, setActiveTab] = useState<DocumentTab>("cover-paket");
  const [coverPaket, setCoverPaket] = useState<CoverPaketAsesmenPayloadDTO | null>(
    initialCoverPaket || null
  );
  const [berkasPengesahan, setBerkasPengesahan] = useState<BerkasPengesahanPayloadDTO | null>(
    initialBerkasPengesahan || null
  );
  const [kisiKisi, setKisiKisi] = useState<KisiKisiAsesmenDTO | null>(initialKisiKisi || null);
  const [kartuSoal, setKartuSoal] = useState<KartuSoalPayloadDTO | null>(initialKartuSoal || null);
  const [naskahSoal, setNaskahSoal] = useState<NaskahSoalPayloadDTO | null>(
    initialNaskahSoal || null
  );
  const [kunciJawaban, setKunciJawaban] = useState<KunciJawabanPayloadDTO | null>(
    initialKunciJawaban || null
  );
  const [daftarHadir, setDaftarHadir] = useState<DaftarHadirPayloadDTO | null>(
    initialDaftarHadir || null
  );
  const [beritaAcara, setBeritaAcara] = useState<BeritaAcaraPayloadDTO | null>(
    initialBeritaAcara || null
  );
  const [rekapNilai, setRekapNilai] = useState<RekapNilaiAsesmenPayloadDTO | null>(
    initialRekapNilai || null
  );
  const [analisisButir, setAnalisisButir] = useState<AnalisisButirSoalPayloadDTO | null>(
    initialAnalisisButir || null
  );

  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isFrozen = kisiKisi?.status === "FINAL" && !!kisiKisi?.snapshot_hash;
  const snapshotHash = kisiKisi?.snapshot_hash || coverPaket?.snapshot_hash;

  // Handler Tab Switcher dengan On-Demand Fetch 1-Klik
  const handleTabChange = async (tab: DocumentTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setActionSuccessMessage(null);

    if (tab === "cover-paket" && !coverPaket) {
      setIsLoadingTab(true);
      const res = await getCoverPaketDocumentAction(asesmenId);
      if (res.success && res.data) setCoverPaket(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "berkas-pengesahan" && !berkasPengesahan) {
      setIsLoadingTab(true);
      const res = await getBerkasPengesahanDocumentAction(asesmenId);
      if (res.success && res.data) setBerkasPengesahan(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "kisi-kisi" && !kisiKisi) {
      setIsLoadingTab(true);
      const res = await getKisiKisiDocumentAction(asesmenId);
      if (res.success && res.data) setKisiKisi(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "kartu-soal" && !kartuSoal) {
      setIsLoadingTab(true);
      const res = await getKartuSoalDocumentAction(asesmenId);
      if (res.success && res.data) setKartuSoal(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "naskah-soal" && !naskahSoal) {
      setIsLoadingTab(true);
      const res = await getNaskahSoalDocumentAction(asesmenId);
      if (res.success && res.data) setNaskahSoal(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "kunci-jawaban" && !kunciJawaban) {
      setIsLoadingTab(true);
      const res = await getKunciJawabanDocumentAction(asesmenId);
      if (res.success && res.data) setKunciJawaban(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "daftar-hadir" && !daftarHadir) {
      setIsLoadingTab(true);
      const res = await getDaftarHadirDocumentAction(asesmenId);
      if (res.success && res.data) setDaftarHadir(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "berita-acara" && !beritaAcara) {
      setIsLoadingTab(true);
      const res = await getBeritaAcaraDocumentAction(asesmenId);
      if (res.success && res.data) setBeritaAcara(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "rekap-nilai" && !rekapNilai) {
      setIsLoadingTab(true);
      const res = await getRekapNilaiAsesmenDocumentAction(asesmenId);
      if (res.success && res.data) setRekapNilai(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    } else if (tab === "analisis-butir" && !analisisButir) {
      setIsLoadingTab(true);
      const res = await getAnalisisButirSoalDocumentAction(asesmenId);
      if (res.success && res.data) setAnalisisButir(res.data);
      else setErrorMessage(res.message);
      setIsLoadingTab(false);
    }
  };

  // Handler Pembekuan Snapshot Permanen
  const handleFreezeSnapshot = () => {
    const targetKisiKisiId = kisiKisi?.id;
    if (!targetKisiKisiId) {
      setErrorMessage("Data kisi-kisi asesmen belum dimuat untuk dibekukan.");
      return;
    }

    const confirmFreeze = window.confirm(
      "Apakah Anda yakin ingin menyegel seluruh berkas administrasi asesmen ini?\n\n" +
        "Setelah disegel, butir soal, kunci, dan seluruh dokumen supervisi akan dikunci permanen " +
        "dengan hash SHA-256 untuk keperluan arsip supervisi dan akreditasi sekolah."
    );

    if (!confirmFreeze) return;

    startTransition(async () => {
      setErrorMessage(null);
      setActionSuccessMessage(null);

      const res = await freezeKisiKisiAction(targetKisiKisiId);
      if (res.success && res.data) {
        setKisiKisi(res.data);
        setActionSuccessMessage("Seluruh paket administrasi asesmen berhasil disegel permanen.");
        const [coverRes, pengesahanRes, kartuRes, naskahRes, kunciRes] = await Promise.all([
          getCoverPaketDocumentAction(asesmenId),
          getBerkasPengesahanDocumentAction(asesmenId),
          getKartuSoalDocumentAction(asesmenId),
          getNaskahSoalDocumentAction(asesmenId),
          getKunciJawabanDocumentAction(asesmenId),
        ]);
        if (coverRes.success) setCoverPaket(coverRes.data);
        if (pengesahanRes.success) setBerkasPengesahan(pengesahanRes.data);
        if (kartuRes.success) setKartuSoal(kartuRes.data);
        if (naskahRes.success) setNaskahSoal(naskahRes.data);
        if (kunciRes.success) setKunciJawaban(kunciRes.data);
      } else {
        setErrorMessage(res.message || "Gagal menyegel snapshot asesmen.");
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: Array<{
    id: DocumentTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: "cover-paket", label: "Cover Paket", icon: BookOpen },
    { id: "berkas-pengesahan", label: "Pengesahan", icon: Award },
    { id: "kisi-kisi", label: "Kisi-Kisi", icon: ListChecks, badge: "Landscape" },
    { id: "kartu-soal", label: "Kartu Soal", icon: FileSpreadsheet },
    { id: "naskah-soal", label: "Naskah Soal", icon: FileText, badge: "2 Kolom" },
    { id: "kunci-jawaban", label: "Kunci Jawaban", icon: KeyRound, badge: "Rahasia" },
    { id: "daftar-hadir", label: "Daftar Hadir", icon: Users },
    { id: "berita-acara", label: "Berita Acara", icon: FileCheck2 },
    { id: "rekap-nilai", label: "Rekap Nilai", icon: BarChart3, badge: "KKTP" },
    { id: "analisis-butir", label: "Analisis Butir", icon: PieChart, badge: "Landscape" },
  ];

  const isLandscapeView = activeTab === "kisi-kisi" || activeTab === "analisis-butir";

  return (
    <div className="space-y-6 pb-20 font-lato">
      {/* Top Glass Control Card (Hidden on Print) */}
      <div className="rounded-3xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left Title & Back Nav */}
          <div className="flex items-center gap-3">
            <Link
              href="/cbt-ujian"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke CBT</span>
            </Link>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Hub Dokumen Supervisi & Akreditasi Asesmen</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Standar Portofolio 10 Dokumen Resmi Kurikulum & Evaluasi Pembelajaran Sekolah
              </p>
            </div>
          </div>

          {/* Center & Right Status and Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
            {isFrozen ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Dokumen Tersegel</span>
                <span className="font-mono text-[10px] bg-emerald-200/70 dark:bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-200">
                  {snapshotHash?.slice(0, 8)}...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Mode Draf (Dapat Diedit)</span>
              </div>
            )}

            {!isFrozen && (
              <button
                type="button"
                onClick={handleFreezeSnapshot}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Kunci butir soal dan dokumen secara permanen dengan hash SHA-256"
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>{isPending ? "Menyegel..." : "Segel Dokumen"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              title="Cetak atau unduh dokumen sebagai PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* 10 Document Switcher Navigation Pills */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-2 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <TabIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive
                        ? "bg-blue-700 text-blue-100"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Messages (Hidden on Print) */}
      <div className="max-w-6xl mx-auto w-full px-2 print:hidden">
        {errorMessage && (
          <div className="mb-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold text-rose-600 dark:text-rose-400 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {actionSuccessMessage && (
          <div className="mb-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="font-bold text-emerald-600 dark:text-emerald-400 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Document Preview Paper Canvas */}
      <main className="flex justify-center print:p-0 print:m-0">
        {isLoadingTab ? (
          <div className="py-24 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold">Menyiapkan berkas dokumen resmi...</p>
          </div>
        ) : (
          <div
            className={`w-full bg-white dark:bg-white text-slate-900 shadow-xl border border-slate-200/90 rounded-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none transition-all ${
              isLandscapeView ? "max-w-6xl" : "max-w-4xl"
            }`}
          >
            {activeTab === "cover-paket" && coverPaket && <CoverPaketPrintView data={coverPaket} />}

            {activeTab === "berkas-pengesahan" && berkasPengesahan && (
              <BerkasPengesahanPrintView data={berkasPengesahan} />
            )}

            {activeTab === "kisi-kisi" && kisiKisi && <KisiKisiPrintView data={kisiKisi} />}

            {activeTab === "kartu-soal" && kartuSoal && <KartuSoalPrintView data={kartuSoal} />}

            {activeTab === "naskah-soal" && naskahSoal && <NaskahSoalPrintView data={naskahSoal} />}

            {activeTab === "kunci-jawaban" && kunciJawaban && (
              <KunciJawabanPrintView data={kunciJawaban} />
            )}

            {activeTab === "daftar-hadir" && daftarHadir && (
              <DaftarHadirPrintView data={daftarHadir} />
            )}

            {activeTab === "berita-acara" && beritaAcara && (
              <BeritaAcaraPrintView data={beritaAcara} />
            )}

            {activeTab === "rekap-nilai" && rekapNilai && (
              <RekapNilaiAsesmenPrintView data={rekapNilai} />
            )}

            {activeTab === "analisis-butir" && analisisButir && (
              <AnalisisButirSoalPrintView data={analisisButir} />
            )}

            {/* Empty Fallback */}
            {!isLoadingTab &&
              ((activeTab === "cover-paket" && !coverPaket) ||
                (activeTab === "berkas-pengesahan" && !berkasPengesahan) ||
                (activeTab === "kisi-kisi" && !kisiKisi) ||
                (activeTab === "kartu-soal" && !kartuSoal) ||
                (activeTab === "naskah-soal" && !naskahSoal) ||
                (activeTab === "kunci-jawaban" && !kunciJawaban) ||
                (activeTab === "daftar-hadir" && !daftarHadir) ||
                (activeTab === "berita-acara" && !beritaAcara) ||
                (activeTab === "rekap-nilai" && !rekapNilai) ||
                (activeTab === "analisis-butir" && !analisisButir)) && (
                <div className="py-24 text-center text-slate-500 text-xs space-y-2">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">
                    Dokumen ini belum memiliki data atau sedang diproses.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Silakan periksa kisi-kisi asesmen atau status butir soal pada ujian ini.
                  </p>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
