"use client";

/**
 * Ruang Pintar — Edit CBT Exam Settings Modal (Academic Glass UI)
 *
 * Memungkinkan guru menyesuaikan parameter pelaksanaan ujian kapan saja:
 * - Durasi waktu (menit)
 * - Pengacakan ganda (Acak Soal & Acak Opsi)
 * - Visibilitas nilai & pembahasan
 * - Target kelulusan (KKTP/KKM)
 * - Tarik kembali ke status DRAFT jika belum ada siswa yang mengerjakan
 */

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  SlidersHorizontal,
  Clock,
  Shuffle,
  Eye,
  Award,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  HelpCircle,
} from "lucide-react";
import { updateExamSettingsAction, revertExamToDraftAction } from "@/app/actions/cbt-actions";
import { TeacherCbtFlatExamItem } from "./cbt-hub-overview-view";

interface EditExamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: TeacherCbtFlatExamItem | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function EditExamSettingsModal({
  isOpen,
  onClose,
  exam,
  onSuccess,
  onError,
}: EditExamSettingsModalProps) {
  if (!isOpen || !exam) return null;

  return (
    <EditExamSettingsDialog
      key={exam.id}
      exam={exam}
      onClose={onClose}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

interface EditExamSettingsDialogProps {
  exam: TeacherCbtFlatExamItem;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function EditExamSettingsDialog({
  exam,
  onClose,
  onSuccess,
  onError,
}: EditExamSettingsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isReverting, setIsReverting] = useState(false);

  // Form states initialized directly from exam prop
  const [judul, setJudul] = useState(exam.judul || "");
  const [durasiMenit, setDurasiMenit] = useState(exam.durasi_menit || 60);
  const [kkmKktp, setKkmKktp] = useState(exam.kkm_kktp ?? 75);
  const [acakSoal, setAcakSoal] = useState(exam.acak_soal ?? true);
  const [acakOpsi, setAcakOpsi] = useState(exam.acak_opsi ?? true);
  const [tampilkanNilai, setTampilkanNilai] = useState(exam.tampilkan_nilai ?? true);
  const [tampilkanPembahasan, setTampilkanPembahasan] = useState(
    exam.tampilkan_pembahasan ?? false
  );

  const isLive =
    exam.status === "PUBLISHED" ||
    exam.status === "DIPUBLIKASI" ||
    exam.status === "DITERBITKAN" ||
    exam.status === "BERLANGSUNG" ||
    exam.status === "ACTIVE";

  const canRevertToDraft = isLive && (exam.total_peserta || 0) === 0;

  const handleSaveSettings = () => {
    if (!judul.trim()) {
      onError("Judul ujian tidak boleh kosong.");
      return;
    }
    if (durasiMenit <= 0) {
      onError("Durasi ujian minimal 1 menit.");
      return;
    }

    startTransition(async () => {
      const res = await updateExamSettingsAction(exam.id, {
        judul: judul.trim(),
        durasi_menit: durasiMenit,
        kkm_kktp: kkmKktp,
        acak_soal: acakSoal,
        acak_opsi: acakOpsi,
        tampilkan_nilai: tampilkanNilai,
        tampilkan_pembahasan: tampilkanPembahasan,
      });

      if (res.success) {
        onSuccess(res.message || "Pengaturan ujian berhasil diperbarui.");
        onClose();
      } else {
        onError(res.message || "Gagal memperbarui pengaturan ujian.");
      }
    });
  };

  const handleRevertToDraft = () => {
    if (
      !confirm(
        `Tarik kembali ujian "${exam.judul}" ke status DRAFT? Siswa tidak akan dapat mengakses ujian ini sampai Anda menerbitkannya kembali.`
      )
    ) {
      return;
    }

    setIsReverting(true);
    startTransition(async () => {
      const res = await revertExamToDraftAction(exam.id);
      setIsReverting(false);
      if (res.success) {
        onSuccess(res.message || "Ujian berhasil dikembalikan ke status DRAFT.");
        onClose();
      } else {
        onError(res.message || "Gagal mengembalikan ujian ke status DRAFT.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Ujian CBT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelas {exam.rombel_nama} • {exam.mata_pelajaran_nama}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Alert Banner */}
          {isLive && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Ujian Berstatus Diterbitkan / Aktif</p>
                <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                  Perubahan durasi, acak soal/opsi, dan visibilitas nilai di bawah akan langsung
                  disinkronkan ke dalam sistem.
                </p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Judul Ujian */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Judul Ujian <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Latihan TKA Kejuruan RPL"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition shadow-2xs font-medium"
              />
            </div>

            {/* Grid: Durasi & KKTP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Durasi Waktu (Menit)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={durasiMenit}
                  onChange={(e) => setDurasiMenit(parseInt(e.target.value, 10) || 60)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition shadow-2xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span>Target KKTP / KKM</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={kkmKktp}
                  onChange={(e) => setKkmKktp(parseFloat(e.target.value) || 75)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition shadow-2xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Anti-Cheating & Randomization Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shuffle className="h-3.5 w-3.5 text-blue-600" />
                <span>Pengacakan Ganda (Anti-Contek)</span>
              </span>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acakSoal}
                  onChange={(e) => setAcakSoal(e.target.checked)}
                  className="mt-0.5 size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Acak Urutan Soal
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Setiap siswa menerima urutan nomor soal yang berbeda secara acak.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acakOpsi}
                  onChange={(e) => setAcakOpsi(e.target.checked)}
                  className="mt-0.5 size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Acak Urutan Pilihan (Opsi A - E)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilihan jawaban diacak sehingga opsi A pada satu siswa berbeda letaknya di siswa
                    lain.
                  </span>
                </div>
              </label>
            </div>

            {/* Experience & Result Release Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>Pengalaman & Rilis Hasil</span>
              </span>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanNilai}
                  onChange={(e) => setTampilkanNilai(e.target.checked)}
                  className="mt-0.5 size-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Tampilkan Nilai ke Siswa
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Siswa langsung melihat perolehan skor setelah menekan tombol selesai.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanPembahasan}
                  onChange={(e) => setTampilkanPembahasan(e.target.checked)}
                  className="mt-0.5 size-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Tampilkan Pembahasan Kunci Jawaban
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Siswa dapat membaca alasan dan kunci jawaban setelah ujian diselesaikan.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Tarik ke DRAFT Section */}
          {canRevertToDraft && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ingin Mengubah Butir Soal?</span>
                </span>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
                  Tarik ujian ke status DRAFT untuk bebas mengedit butir soal dan kisi-kisi.
                </p>
              </div>
              <button
                type="button"
                disabled={isPending || isReverting}
                onClick={handleRevertToDraft}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition active:scale-[0.98] cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isReverting ? "Menarik..." : "Tarik ke DRAFT"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending || isReverting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isPending || isReverting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isPending ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
