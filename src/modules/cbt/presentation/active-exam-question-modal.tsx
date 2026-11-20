"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  X,
  FileEdit,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  getActiveExamQuestionsForEditAction,
  updateActiveExamQuestionAction,
} from "@/app/actions/cbt-actions";
import { MathRenderer } from "@/shared/components/cbt/math-renderer";

interface ActiveExamQuestionModalProps {
  ujianId: string;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated?: () => void;
}

export function ActiveExamQuestionModal({
  ujianId,
  isOpen,
  onClose,
  onQuestionUpdated,
}: ActiveExamQuestionModalProps) {
  const [loading, setLoading] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);

  // Edit fields
  const [editPertanyaan, setEditPertanyaan] = useState("");
  const [editGambarUrl, setEditGambarUrl] = useState("");
  const [editOpsiList, setEditOpsiList] = useState<any[]>([]);
  const [editKunci, setEditKunci] = useState<string>("");
  const [editBobot, setEditBobot] = useState<number>(1);
  const [recalculateScores, setRecalculateScores] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSaving, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActiveExamQuestionsForEditAction(ujianId);
      if (res.success && res.data) {
        setExamTitle(res.data.ujian.judul);
        setQuestions(res.data.questions || []);
      } else {
        setToastMessage({ text: res.message || "Gagal memuat soal.", type: "error" });
      }
    } catch (e: any) {
      setToastMessage({ text: e?.message || "Terjadi kendala jaringan.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [ujianId]);

  useEffect(() => {
    if (!isOpen || !ujianId) return;
    let ignore = false;

    getActiveExamQuestionsForEditAction(ujianId)
      .then((res) => {
        if (ignore) return;
        if (res.success && res.data) {
          setExamTitle(res.data.ujian.judul);
          setQuestions(res.data.questions || []);
        } else {
          setToastMessage({ text: res.message || "Gagal memuat soal.", type: "error" });
        }
      })
      .catch((e: any) => {
        if (ignore) return;
        setToastMessage({ text: e?.message || "Terjadi kendala jaringan.", type: "error" });
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, ujianId]);

  const handleCloseModal = () => {
    setSelectedQuestion(null);
    onClose();
  };

  const handleSelectQuestion = (q: any) => {
    setSelectedQuestion(q);
    setEditPertanyaan(q.pertanyaan || "");
    setEditGambarUrl(q.gambar_url || "");
    setEditBobot(q.bobot || 1);

    // Parse options
    let parsedOpsi: any[] = [];
    if (Array.isArray(q.opsi_jawaban)) {
      parsedOpsi = q.opsi_jawaban;
    } else if (q.opsi_jawaban && Array.isArray(q.opsi_jawaban.opsi)) {
      parsedOpsi = q.opsi_jawaban.opsi;
    }
    setEditOpsiList(parsedOpsi);

    // Parse key
    let kStr = "";
    if (Array.isArray(q.kunci_jawaban)) {
      kStr = String(q.kunci_jawaban[0] || "");
    } else if (typeof q.kunci_jawaban === "object" && q.kunci_jawaban !== null) {
      kStr = String(q.kunci_jawaban.pilihan_benar || "");
    } else if (q.kunci_jawaban) {
      kStr = String(q.kunci_jawaban);
    }
    setEditKunci(kStr);
  };

  const handleSave = () => {
    if (!selectedQuestion) return;
    startTransition(async () => {
      try {
        const res = await updateActiveExamQuestionAction({
          ujianId,
          bankSoalId: selectedQuestion.bank_soal_id,
          nomorUrut: selectedQuestion.nomor_urut,
          pertanyaan: editPertanyaan,
          gambar_url: editGambarUrl.trim() || null,
          opsi: editOpsiList.length > 0 ? editOpsiList : undefined,
          kunci_jawaban: editKunci ? [editKunci] : undefined,
          bobot: Number(editBobot) || 1,
          recalculateScores,
        });

        if (res.success) {
          setToastMessage({ text: res.message, type: "success" });
          await loadData();
          setSelectedQuestion(null);
          if (onQuestionUpdated) onQuestionUpdated();
        } else {
          setToastMessage({ text: res.message || "Gagal menyimpan perubahan.", type: "error" });
        }
      } catch (err: any) {
        setToastMessage({ text: err?.message || "Terjadi kegagalan jaringan.", type: "error" });
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Koreksi & Edit Soal Ujian Aktif
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {examTitle || "Memuat paket ujian..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
              toastMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500">Memuat butir soal ujian...</p>
            </div>
          ) : selectedQuestion ? (
            /* Question Edit Form */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar Soal
                </button>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  Soal Nomor {selectedQuestion.nomor_urut} ({selectedQuestion.tipe_soal})
                </span>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teks Pertanyaan / Soal:
                </label>
                <textarea
                  rows={4}
                  value={editPertanyaan}
                  onChange={(e) => setEditPertanyaan(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>

              {/* Image URL if any */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL / Path Gambar Stimulus (Opsional):
                </label>
                <input
                  type="text"
                  value={editGambarUrl}
                  onChange={(e) => setEditGambarUrl(e.target.value)}
                  placeholder="/images/soal/contoh.png"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              {/* Options & Correct Key */}
              {editOpsiList.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Opsi Pilihan Jawaban & Kunci Benar:
                  </label>
                  <div className="space-y-2">
                    {editOpsiList.map((op, idx) => {
                      const label = op.label || op.id || String.fromCharCode(65 + idx);
                      const isCorrect =
                        String(editKunci).trim().toUpperCase() === label.toUpperCase();

                      return (
                        <div
                          key={label}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                            isCorrect
                              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setEditKunci(label)}
                            className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 transition ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                            title="Jadikan Kunci Jawaban Benar"
                          >
                            {label}
                          </button>
                          <input
                            type="text"
                            value={op.teks}
                            onChange={(e) => {
                              const updated = [...editOpsiList];
                              updated[idx] = { ...updated[idx], teks: e.target.value };
                              setEditOpsiList(updated);
                            }}
                            className="flex-1 text-xs bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-hidden"
                          />
                          {isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              Kunci Benar
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recalculate Option */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="recalc"
                  checked={recalculateScores}
                  onChange={(e) => setRecalculateScores(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="recalc"
                  className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed cursor-pointer"
                >
                  <strong>Hitung Ulang Nilai Peserta yang Telah Dikumpulkan</strong>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Jika kunci jawaban diubah, server akan otomatis menilai ulang lembar ujian siswa
                    yang telah dikumpulkan agar nilainya langsung terbarukan secara adil.
                  </p>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan & Sinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Simpan & Sinkronkan ke Ujian Aktif</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Question List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ditemukan <strong>{questions.length} butir soal</strong> dalam snapshot ujian
                  aktif ini. Klik tombol <strong>Koreksi</strong> pada soal yang ingin diperbaiki.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {questions.map((q) => (
                  <div
                    key={q.nomor_urut}
                    className="py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 p-2.5 rounded-2xl transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {q.nomor_urut}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {q.tipe_soal}
                          </span>
                          {q.kunci_jawaban && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              Kunci:{" "}
                              {Array.isArray(q.kunci_jawaban)
                                ? q.kunci_jawaban.join(", ")
                                : String(q.kunci_jawaban)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-normal">
                          {q.pertanyaan?.replace(/```[\s\S]*?```/g, "[Blok Kode]")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectQuestion(q)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition shrink-0"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>Koreksi</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
