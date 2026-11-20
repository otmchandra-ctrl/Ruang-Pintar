"use client";

/**
 * Ruang Pintar — M11 Create Tugas Pembelajaran Modal (Academic Glass UI)
 */

import React, { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, ClipboardList, Loader2 } from "lucide-react";
import { createTugasAction } from "@/app/actions/learning-actions";
import { LingkupMateriDTO } from "../domain/learning-types";
import { DateTimePicker24H } from "@/shared/components/ui/datetime-24h-picker";

interface CreateTugasModalProps {
  penugasanId: string;
  guruId: string;
  mapelId: string;
  lingkupMateriList: LingkupMateriDTO[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CreateTugasModal({
  penugasanId,
  guruId,
  mapelId,
  lingkupMateriList,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: CreateTugasModalProps) {
  const [isPending, startTransition] = useTransition();
  const [batasWaktu, setBatasWaktu] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("penugasan_mengajar_id", penugasanId);
    formData.set("guru_id", guruId);
    formData.set("mata_pelajaran_id", mapelId);

    startTransition(async () => {
      const res = await createTugasAction(null, formData);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        onError(res.message);
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Terbitkan Tugas Kelas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berikan instruksi penugasan mandiri / kelompok bagi siswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-4 overflow-y-auto overflow-x-hidden flex-1"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kaitkan ke BAB / Lingkup Materi
            </label>
            <select
              name="lingkup_materi_id"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition"
            >
              <option value="">Umum / Tidak terikat BAB tertentu</option>
              {lingkupMateriList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.kode ? `${b.kode}: ` : ""}
                  {b.judul}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="judul"
              required
              minLength={2}
              maxLength={200}
              placeholder="Contoh: Tugas Mandiri Analisis Algoritma Sorting"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Metode Pengumpulan
            </label>
            <select
              name="tipe_penyerahan"
              defaultValue="FILE"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition"
            >
              <option value="FILE">Unggah Berkas / Dokumen</option>
              <option value="TEKS">Ketik Teks Jawaban Langsung</option>
              <option value="DARING">Tautan Daring / Repository</option>
            </select>
          </div>

          <div>
            <DateTimePicker24H
              name="batas_waktu"
              label="Tenggat Batas Waktu"
              value={batasWaktu}
              onChange={setBatasWaktu}
              helperText="Batas akhir pengumpulan tugas siswa (24 Jam WIB)."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Petunjuk & Kriteria Tugas <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="petunjuk"
              rows={4}
              required
              minLength={5}
              placeholder="Tuliskan petunjuk teknis pengerjaan, format berkas, serta kriteria penilaian tugas..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="izinkan_terlambat"
              value="true"
              className="h-4 w-4 rounded text-[#2563EB] border-slate-300 dark:border-slate-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Izinkan pengumpulan melewati batas waktu (ditandai Terlambat)
            </span>
          </label>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Terbitkan Tugas</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
