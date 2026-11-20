"use client";

/**
 * Ruang Pintar — M14 Create CBT Exam Modal (Academic Glass UI v1.2)
 *
 * Multi-Tab Setting Cockpit:
 * 1. Informasi & Jadwal (Judul, Durasi, KKM/KKTP, Jendela Waktu)
 * 2. Integritas & Anti-Contek (Double Randomization, Token ANBK, Fullscreen, Deteksi Split HP)
 * 3. Format & Pengalaman Siswa (Navigasi Bebas/Sekuensial, Ragu-ragu, Rilis Nilai & Pembahasan)
 * 4. Komposisi Soal & Bobot (Pencarian Bank Soal, Filter Kesulitan/Tipe, Input Bobot per Soal)
 */

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Clock,
  Award,
  Shuffle,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Key,
  RefreshCw,
  ShieldCheck,
  Lock,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Info,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { BankSoalDTO } from "../domain/cbt-types";
import { getQuestionsAction, createExamAction } from "@/app/actions/cbt-actions";
import { DateTimePicker24H } from "@/shared/components/ui/datetime-24h-picker";

type TabId = "INFO" | "SECURITY" | "EXPERIENCE" | "BLUEPRINT";

interface TabMeta {
  id: TabId;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
}

const TABS: TabMeta[] = [
  {
    id: "INFO",
    number: 1,
    title: "Informasi & Jadwal",
    shortTitle: "Info & Jadwal",
    description: "Judul, durasi & target kelulusan",
  },
  {
    id: "SECURITY",
    number: 2,
    title: "Integritas & Anti-Contek",
    shortTitle: "Anti-Contek",
    description: "Acak soal/opsi, token & lockdown",
  },
  {
    id: "EXPERIENCE",
    number: 3,
    title: "Format & Pengalaman Siswa",
    shortTitle: "Pengalaman Siswa",
    description: "Navigasi, rilis nilai & pembahasan",
  },
  {
    id: "BLUEPRINT",
    number: 4,
    title: "Komposisi Soal & Bobot",
    shortTitle: "Butir Soal",
    description: "Pilih soal bank & skor penilaian",
  },
];

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  penugasanId: string;
  mapelId?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CreateExamModal({
  isOpen,
  onClose,
  penugasanId,
  mapelId,
  onSuccess,
  onError,
}: CreateExamModalProps) {
  const [isPending, startTransition] = useTransition();
  const [bankSoalList, setBankSoalList] = useState<BankSoalDTO[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabId>("INFO");

  // Tab 1: Informasi & Jadwal
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [kktp, setKktp] = useState(75);
  const [maksimalAttempt, setMaksimalAttempt] = useState(1);
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");

  // Tab 2: Integritas & Anti-Contek
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(true);
  const [gunakanToken, setGunakanToken] = useState(false);
  const [tokenMasuk, setTokenMasuk] = useState("");
  const [forceFullscreen, setForceFullscreen] = useState(true);
  const [toleransiPelanggaran, setToleransiPelanggaran] = useState(3);
  const [mobileSplitGuard, setMobileSplitGuard] = useState(true);
  const [screenWakeLock, setScreenWakeLock] = useState(true);

  // Tab 3: Format & Pengalaman Siswa
  const [modeNavigasi, setModeNavigasi] = useState<"BEBAS" | "SEKUENSIAL">("BEBAS");
  const [izinkanRaguRagu, setIzinkanRaguRagu] = useState(true);
  const [tampilkanNilai, setTampilkanNilai] = useState(true);
  const [tampilkanPembahasan, setTampilkanPembahasan] = useState(false);

  // Tab 4: Komposisi Soal (Blueprint)
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { selected: boolean; bobot: number }>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipe, setFilterTipe] = useState("SEMUA");
  const [filterKesulitan, setFilterKesulitan] = useState("SEMUA");

  const generateRandomToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let t = "";
    for (let i = 0; i < 6; i++) {
      t += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTokenMasuk(t);
  };

  const resetForm = () => {
    setActiveTab("INFO");
    setJudul("");
    setDeskripsi("");
    setDurasiMenit(60);
    setKktp(75);
    setMaksimalAttempt(1);
    setWaktuMulai("");
    setWaktuSelesai("");
    setAcakSoal(true);
    setAcakOpsi(true);
    setGunakanToken(false);
    setTokenMasuk("");
    setForceFullscreen(true);
    setToleransiPelanggaran(3);
    setMobileSplitGuard(true);
    setScreenWakeLock(true);
    setModeNavigasi("BEBAS");
    setIzinkanRaguRagu(true);
    setTampilkanNilai(true);
    setTampilkanPembahasan(false);
    setSearchQuery("");
    setFilterTipe("SEMUA");
    setFilterKesulitan("SEMUA");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Load Bank Soal saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    getQuestionsAction({ mapelId })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setBankSoalList(res.data);
          const initMap: Record<string, { selected: boolean; bobot: number }> = {};
          res.data.forEach((q: BankSoalDTO) => {
            const calculatedBobot =
              (typeof q.versi_aktif === "object" && q.versi_aktif !== null
                ? (q.versi_aktif as { bobot?: number }).bobot
                : undefined) ??
              q.bobot_default ??
              1;
            initMap[q.id] = {
              selected: true,
              bobot: calculatedBobot,
            };
          });
          setSelectedItems(initMap);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingBank(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, mapelId]);

  // Handler seleksi butir soal
  const toggleSelect = (questionId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selected: !prev[questionId]?.selected,
      },
    }));
  };

  const handleBobotChange = (questionId: string, bobot: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        bobot: Math.max(1, bobot),
      },
    }));
  };

  // Filter butir soal
  const filteredQuestions = useMemo(() => {
    return bankSoalList.filter((q) => {
      const activeVer =
        (typeof q.versi_aktif === "object" ? q.versi_aktif : null) ||
        (Array.isArray(q.versi) ? q.versi[0] : null);
      const text = (
        (activeVer?.pertanyaan || q.pertanyaan || q.judul || "") +
        " " +
        (q.kode || "")
      ).toLowerCase();

      if (searchQuery.trim() && !text.includes(searchQuery.toLowerCase().trim())) {
        return false;
      }

      const jenis = q.jenis_soal || q.tipe_soal || "";
      if (filterTipe !== "SEMUA" && jenis !== filterTipe) {
        return false;
      }

      if (filterKesulitan !== "SEMUA" && q.tingkat_kesulitan !== filterKesulitan) {
        return false;
      }

      return true;
    });
  }, [bankSoalList, searchQuery, filterTipe, filterKesulitan]);

  // Bulk seleksi
  const selectAllFiltered = () => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      filteredQuestions.forEach((q) => {
        if (next[q.id]) {
          next[q.id] = { ...next[q.id], selected: true };
        }
      });
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      filteredQuestions.forEach((q) => {
        if (next[q.id]) {
          next[q.id] = { ...next[q.id], selected: false };
        }
      });
      return next;
    });
  };

  const setUniformBobot = (val: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], bobot: val };
      });
      return next;
    });
  };

  // Ringkasan butir soal
  const selectedQuestionsCount = Object.values(selectedItems).filter((i) => i.selected).length;
  const totalBobot = Object.values(selectedItems)
    .filter((i) => i.selected)
    .reduce((acc, curr) => acc + curr.bobot, 0);

  const estimasiDetikPerSoal =
    selectedQuestionsCount > 0 ? Math.round((durasiMenit * 60) / selectedQuestionsCount) : 0;

  // Navigasi langkah tab
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);
  const isFirstTab = tabIndex === 0;
  const isLastTab = tabIndex === TABS.length - 1;

  const handleNextTab = () => {
    if (!isLastTab) {
      setActiveTab(TABS[tabIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (!isFirstTab) {
      setActiveTab(TABS[tabIndex - 1].id);
    }
  };

  // Form Submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!judul.trim()) {
      onError("Judul ujian wajib diisi. Silakan lengkapi pada Tab Informasi & Jadwal.");
      setActiveTab("INFO");
      return;
    }
    if (selectedQuestionsCount === 0) {
      onError(
        "Pilih minimal satu butir soal untuk menyusun ujian. Silakan pilih pada Tab Komposisi Soal."
      );
      setActiveTab("BLUEPRINT");
      return;
    }

    startTransition(async () => {
      let nomor = 1;
      const blueprintItems = bankSoalList
        .filter((q) => selectedItems[q.id]?.selected)
        .map((q) => ({
          bank_soal_id: q.id,
          nomor_urut: nomor++,
          bobot_kustom: selectedItems[q.id]?.bobot ?? 1,
        }));

      const payload = {
        penugasan_mengajar_id: penugasanId,
        judul: judul.trim(),
        deskripsi: deskripsi.trim() || undefined,
        durasi_menit: Number(durasiMenit),
        kktp: Number(kktp),
        acak_soal: acakSoal,
        acak_opsi: acakOpsi,
        gunakan_token: gunakanToken,
        token_masuk:
          gunakanToken && tokenMasuk.trim() ? tokenMasuk.trim().toUpperCase() : undefined,
        tampilkan_nilai: tampilkanNilai,
        tampilkan_pembahasan: tampilkanPembahasan,
        maksimal_attempt: Number(maksimalAttempt),
        waktu_mulai: waktuMulai ? new Date(waktuMulai) : undefined,
        waktu_selesai: waktuSelesai ? new Date(waktuSelesai) : undefined,
        blueprint_soal: blueprintItems,
      };

      const res = await createExamAction(payload);
      if (res.success) {
        onSuccess(res.message);
        handleClose();
      } else {
        onError(res.message);
      }
    });
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-[90vh] max-w-5xl flex flex-col bg-white sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800">
        {/* ==================================================================== */}
        {/* HEADER MODAL */}
        {/* ==================================================================== */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pengaturan Ujian CBT
                </h2>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200/80">
                  Mode Draft
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Atur jadwal, parameter anti-contek Pusmendik/ANBK, dan blueprint soal
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            title="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB NAVIGATION STRIP (Responsive & Glassy) */}
        {/* ==================================================================== */}
        <div className="shrink-0 px-3 sm:px-6 pt-2 bg-slate-50/50 border-b border-slate-200/70 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max pb-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-white text-blue-700 shadow-xs border border-blue-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.number}
                  </span>
                  <span className="hidden md:inline">{tab.title}</span>
                  <span className="md:hidden">{tab.shortTitle}</span>
                  {tab.id === "BLUEPRINT" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        selectedQuestionsCount > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {selectedQuestionsCount} Soal
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MODAL BODY (Active Tab Content) */}
        {/* ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
          {/* TAB 1: INFORMASI & JADWAL */}
          {activeTab === "INFO" && (
            <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-150">
              {/* Header Tab Context */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">Langkah 1:</span> Tentukan identitas ujian, durasi
                  pengerjaan, dan standar kelulusan KKTP. Jadwal waktu mulai dan selesai bersifat
                  opsional jika ujian diadakan langsung di kelas.
                </div>
              </div>

              {/* Judul Ujian */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Judul Ujian CBT <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Penilaian Tengah Semester (PTS) Genap Matematika"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Petunjuk / Tata Tertib Pengerjaan
                  </label>
                  <textarea
                    rows={3}
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Contoh: Bacalah doa sebelum memulai. Kerjakan butir soal yang mudah terlebih dahulu. Dilarang membuka catatan atau tab browser lain."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Parameter Waktu & KKM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Durasi */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Durasi Pengerjaan <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={360}
                      required
                      value={durasiMenit}
                      onChange={(e) => setDurasiMenit(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <span className="text-xs font-medium text-slate-500 shrink-0">Menit</span>
                  </div>
                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[30, 45, 60, 90, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurasiMenit(m)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                          durasiMenit === m
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* KKTP */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-blue-600" />
                    KKTP Kelulusan <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={kktp}
                      onChange={(e) => setKktp(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <span className="text-xs font-medium text-slate-500 shrink-0">Poin</span>
                  </div>
                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[65, 70, 75, 80].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setKktp(v)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                          kktp === v
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Maksimal Percobaan */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                    Batas Percobaan
                  </label>
                  <select
                    value={maksimalAttempt}
                    onChange={(e) => setMaksimalAttempt(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value={1}>1 Kali (Ujian Resmi)</option>
                    <option value={2}>2 Kali (Ujian + Remedial)</option>
                    <option value={3}>3 Kali (Latihan / Drill)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Siswa tidak dapat memulai ujian lagi jika kuota pengerjaan habis.
                  </p>
                </div>
              </div>

              {/* Jendela Jadwal Pelaksanaan */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800">
                    Jendela Waktu Pelaksanaan (Opsional)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kosongkan jika waktu pelaksanaan fleksibel dan diaktifkan langsung oleh guru saat
                  jam pelajaran.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <DateTimePicker24H
                    label="Waktu Mulai Buka Ujian"
                    value={waktuMulai}
                    onChange={setWaktuMulai}
                    helperText="Otomatis aktif pada tanggal & jam ini (Format 24 Jam WIB)."
                  />
                  <DateTimePicker24H
                    label="Waktu Batas Akhir Submit"
                    value={waktuSelesai}
                    onChange={setWaktuSelesai}
                    minDate={waktuMulai ? waktuMulai.split("T")[0] : undefined}
                    helperText="Batas penutupan lembar ujian (Format 24 Jam WIB)."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTEGRITAS & ANTI-CONTEK */}
          {activeTab === "SECURITY" && (
            <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-150">
              {/* Header Tab Context */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Langkah 2:</span> Konfigurasi perlindungan integritas
                  ujian standar ANBK & Pusmendik. Sistem meminimalkan potensi contek melalui
                  pengacakan ganda dan deteksi keluar aplikasi.
                </div>
              </div>

              {/* 1. Pengacakan Ganda (Double Randomization) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800">
                    Pengacakan Algoritmik Ganda (Double Randomization)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      acakSoal ? "bg-blue-50/40 border-blue-200" : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={acakSoal}
                      onChange={(e) => setAcakSoal(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Acak Urutan Butir Soal
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Setiap siswa menerima urutan nomor soal yang berlainan secara algoritmik.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      acakOpsi ? "bg-blue-50/40 border-blue-200" : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={acakOpsi}
                      onChange={(e) => setAcakOpsi(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Acak Urutan Pilihan (A/B/C/D)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Posisi opsi jawaban pilihan ganda diacak lokal sehingga tidak bisa melirik
                        huruf.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Token Ujian Masuk (ANBK Style) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gunakanToken}
                      onChange={(e) => {
                        setGunakanToken(e.target.checked);
                        if (e.target.checked && !tokenMasuk) generateRandomToken();
                      }}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-blue-600" />
                        Wajibkan Token Ujian Masuk (Sinkronisasi Pengawas)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Siswa tidak dapat memulai ujian sebelum memasukkan token resmi dari guru di
                        kelas.
                      </span>
                    </div>
                  </label>
                  {gunakanToken && (
                    <button
                      type="button"
                      onClick={generateRandomToken}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Acak Baru
                    </button>
                  )}
                </div>

                {gunakanToken && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 shrink-0">
                      Token Ujian Aktif:
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={tokenMasuk}
                      onChange={(e) => setTokenMasuk(e.target.value.toUpperCase())}
                      placeholder="Misal: KRYZQA"
                      className="w-36 text-center font-mono font-bold text-sm tracking-widest px-3 py-1.5 rounded-xl border border-blue-300 bg-white text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                    />
                    <span className="text-[11px] text-slate-500">
                      Tuliskan 6 digit kode ini di papan tulis kelas saat ujian serentak dimulai.
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Lockdown Layar & Deteksi Pelanggaran */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800">
                    Kunci Layar Penuh & Deteksi Pindah Tab (Desktop/Laptop)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      forceFullscreen
                        ? "bg-blue-50/40 border-blue-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={forceFullscreen}
                      onChange={(e) => setForceFullscreen(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Paksa Mode Fullscreen
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Siswa wajib berada dalam layar penuh. Jika keluar, waktu pengerjaan terkunci
                        sementara.
                      </span>
                    </div>
                  </label>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      Toleransi Peringatan Keluar Tab
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 3, 5].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setToleransiPelanggaran(cnt)}
                          className={`flex-1 text-xs font-bold py-1.5 rounded-xl border transition ${
                            toleransiPelanggaran === cnt
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {cnt === 1 ? "1x (Ketat)" : `${cnt}x Toleransi`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Bila melampaui toleransi, ujian akan otomatis di-freeze atau disubmit paksa.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Guard Khusus Ujian Smartphone (HP) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-800">
                    Proteksi Khusus Ujian Berbasis HP (Smartphone)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      mobileSplitGuard
                        ? "bg-indigo-50/40 border-indigo-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={mobileSplitGuard}
                      onChange={(e) => setMobileSplitGuard(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Deteksi Split-Screen / Floating App
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Mendeteksi siswa yang membagi layar Android/iOS untuk membuka browser atau
                        AI solver.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      screenWakeLock
                        ? "bg-indigo-50/40 border-indigo-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={screenWakeLock}
                      onChange={(e) => setScreenWakeLock(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Screen Wake Lock (Layar Selalu Menyala)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Mencegah layar HP siswa padam otomatis saat sedang membaca stimulus soal
                        panjang.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORMAT & PENGALAMAN SISWA */}
          {activeTab === "EXPERIENCE" && (
            <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-150">
              {/* Header Tab Context */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex items-start gap-3">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <span className="font-bold">Langkah 3:</span> Tentukan alur pengerjaan siswa dan
                  kebijakan transparansi hasil ujian.
                </div>
              </div>

              {/* 1. Mode Navigasi Soal */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800">
                  Mode Navigasi Pengerjaan Butir Soal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setModeNavigasi("BEBAS")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      modeNavigasi === "BEBAS"
                        ? "border-blue-600 bg-blue-50/30 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">
                        Navigasi Bebas (Standar)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Rekomendasi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Siswa bebas melompat antar nomor soal, meninjau kembali jawaban yang belum
                      yakin, dan memperbaiki jawaban sebelum submit akhir.
                    </p>
                  </div>

                  <div
                    onClick={() => setModeNavigasi("SEKUENSIAL")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      modeNavigasi === "SEKUENSIAL"
                        ? "border-blue-600 bg-blue-50/30 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Sekuensial Ketat</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        CAT Style
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Siswa harus menjawab nomor demi nomor secara berurutan dan tidak bisa kembali
                      ke soal sebelumnya setelah lanjut ke nomor berikutnya.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Fitur Ragu-ragu */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={izinkanRaguRagu}
                    onChange={(e) => setIzinkanRaguRagu(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Aktifkan Penanda &quot;Ragu-Ragu&quot; (Doubt Flag)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Siswa dapat menandai soal dengan warna kuning pada grid navigasi untuk
                      mempermudah review sebelum submit.
                    </span>
                  </div>
                </label>
              </div>

              {/* 3. Kebijakan Rilis Nilai & Pembahasan */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800">
                  Transparansi Nilai & Pembahasan Pasca Ujian
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      tampilkanNilai ? "bg-blue-50/40 border-blue-200" : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tampilkanNilai}
                      onChange={(e) => setTampilkanNilai(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                        Rilis Skor Nilai Instan
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Siswa langsung melihat nilai dan persentase kelulusan KKTP begitu klik
                        Selesai Ujian.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      tampilkanPembahasan
                        ? "bg-blue-50/40 border-blue-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tampilkanPembahasan}
                      onChange={(e) => setTampilkanPembahasan(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        Tampilkan Kunci & Pembahasan
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Membuka ulasan soal dan kunci jawaban untuk sarana refleksi mandiri siswa.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KOMPOSISI SOAL (BLUEPRINT) */}
          {activeTab === "BLUEPRINT" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Header Tab Context & Counter Banner */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Penyusunan Blueprint Ujian
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pilih butir soal dari Bank Soal dan sesuaikan bobot skor per soal
                    </p>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700">
                    {selectedQuestionsCount} Soal Dipilih
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 font-bold text-blue-700">
                    Total Bobot: {totalBobot}
                  </div>
                  {selectedQuestionsCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-700">
                      ±{estimasiDetikPerSoal} dtk/soal
                    </div>
                  )}
                </div>
              </div>

              {/* Warning jika belum ada butir soal yang dipilih */}
              {selectedQuestionsCount === 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Peringatan:</strong> Ujian tidak dapat dibuat tanpa butir soal. Silakan
                    centang minimal satu butir soal di bawah ini.
                  </span>
                </div>
              )}

              {/* Toolbar Pencarian, Filter & Bulk Actions */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1">
                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari teks pertanyaan..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Filter Jenis */}
                  <select
                    value={filterTipe}
                    onChange={(e) => setFilterTipe(e.target.value)}
                    className="w-full sm:w-auto text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="SEMUA">Semua Jenis Soal</option>
                    <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                    <option value="PILIHAN_GANDA_KOMPLEKS">Pilihan Ganda Kompleks</option>
                    <option value="BENAR_SALAH">Benar / Salah</option>
                    <option value="MENJODOHKAN">Menjodohkan</option>
                    <option value="ISIAN_SINGKAT">Isian Singkat</option>
                    <option value="URAIAN_ESAI">Uraian / Esai</option>
                  </select>

                  {/* Filter Kesulitan */}
                  <select
                    value={filterKesulitan}
                    onChange={(e) => setFilterKesulitan(e.target.value)}
                    className="w-full sm:w-auto text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="SEMUA">Semua Kesulitan</option>
                    <option value="MUDAH">Mudah</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="SULIT">Sulit</option>
                    <option value="HOTS">HOTS</option>
                  </select>
                </div>

                {/* Bulk Select Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <CheckSquare className="h-3 w-3 text-blue-600" />
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Square className="h-3 w-3 text-slate-400" />
                    Batal Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setUniformBobot(1)}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                    title="Set bobot setiap soal menjadi 1"
                  >
                    Reset Bobot = 1
                  </button>
                </div>
              </div>

              {/* Question List Display */}
              {isLoadingBank ? (
                <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p>Memuat butir soal dari bank soal...</p>
                </div>
              ) : bankSoalList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-500 space-y-2">
                  <Layers className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">Bank Soal Masih Kosong</p>
                  <p>
                    Mata pelajaran ini belum memiliki butir soal di Bank Soal. Silakan buat butir
                    soal terlebih dahulu.
                  </p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-200 bg-white text-xs text-slate-500">
                  Tidak ada butir soal yang sesuai dengan filter pencarian saat ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                  {filteredQuestions.map((q, idx) => {
                    const isChecked = selectedItems[q.id]?.selected ?? false;
                    const currentBobot = selectedItems[q.id]?.bobot ?? q.bobot_default ?? 1;
                    const activeVer =
                      (typeof q.versi_aktif === "object" ? q.versi_aktif : null) ||
                      (Array.isArray(q.versi) ? q.versi[0] : null);

                    const kesulitanBadge =
                      q.tingkat_kesulitan === "MUDAH"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : q.tingkat_kesulitan === "SEDANG"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : q.tingkat_kesulitan === "SULIT"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200";

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isChecked
                            ? "bg-blue-50/30 border-blue-200 shadow-2xs"
                            : "bg-white border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(q.id)}
                            className="mt-1 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                #{idx + 1}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/80">
                                {(q.jenis_soal || q.tipe_soal || "").replace(/_/g, " ")}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${kesulitanBadge}`}
                              >
                                {q.tingkat_kesulitan}
                              </span>
                              {q.kode && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  [{q.kode}]
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-800 font-medium line-clamp-2">
                              {activeVer?.pertanyaan || q.pertanyaan || q.judul || "Butir Soal"}
                            </p>
                          </div>
                        </div>

                        {/* Bobot Score Input */}
                        <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-[11px] font-medium text-slate-500">Bobot:</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            disabled={!isChecked}
                            value={currentBobot}
                            onChange={(e) => handleBobotChange(q.id, Number(e.target.value))}
                            className="w-16 text-center text-xs font-bold px-2 py-1 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40 disabled:bg-slate-100"
                          />
                          <span className="text-[11px] text-slate-400">poin</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* STICKY FOOTER ACTION BAR */}
        {/* ==================================================================== */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-md">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Langkah {tabIndex + 1} dari 4</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-xs text-slate-500">
              {selectedQuestionsCount} Soal • {durasiMenit} Menit
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>

            {!isFirstTab && (
              <button
                type="button"
                onClick={handlePrevTab}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </button>
            )}

            {!isLastTab && (
              <button
                type="button"
                onClick={handleNextTab}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-2xs"
              >
                Lanjut
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Submit button selalu aktif atau di tab terakhir */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isPending || selectedQuestionsCount === 0 || !judul.trim()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                "Menyimpan..."
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Buat Ujian CBT (Draft)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
