import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CbtPlayerView } from "@/modules/cbt/presentation/cbt-player-view";
import { CbtRepository } from "@/modules/cbt/infrastructure/cbt-repository";
import { prisma } from "@/shared/infrastructure/database/prisma";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockSingleAutosave = vi.fn().mockResolvedValue({ success: true, message: "Tersimpan." });
const mockBatchAutosave = vi.fn().mockResolvedValue({
  success: true,
  message: "Batch tersimpan.",
  data: { savedAt: new Date(), savedCount: 2 },
});
const mockSubmitAttempt = vi.fn().mockResolvedValue({
  success: true,
  data: { id: "HASIL_1", nilai_akhir: 100 },
});

vi.mock("@/app/actions/cbt-actions", () => ({
  autosaveAnswerAction: (...args: any[]) => mockSingleAutosave(...args),
  batchAutosaveAnswersAction: (...args: any[]) => mockBatchAutosave(...args),
  recordIntegrityEventAction: vi
    .fn()
    .mockResolvedValue({ success: true, data: { isLocked: false } }),
  submitAttemptAction: (...args: any[]) => mockSubmitAttempt(...args),
}));

describe("CBT Batch Autosave Pipeline (D1 & High-Concurrency Optimization)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("batches multiple answers into a single batchAutosaveAnswersAction call after debounce delay", async () => {
    vi.useFakeTimers();

    const mockSession: any = {
      id: "SESS_BATCH_1",
      ujian_cbt_id: "UJIAN_1",
      siswa_id: "SISWA_1",
      status: "SEDANG_MENGERJAKAN",
      batas_waktu_server: new Date(Date.now() + 3600000),
      token_sesi_aktif: "TOK_1",
    };

    const mockManifest: any[] = [
      {
        nomor_urut: 1,
        bank_soal_id: "BS_1",
        versi_soal_id: "VS_1",
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Soal nomor 1?",
        opsi_jawaban: [
          { id: "A", label: "A", teks: "Opsi Satu A", urutan: 1 },
          { id: "B", label: "B", teks: "Opsi Satu B", urutan: 2 },
        ],
        bobot: 1,
      },
      {
        nomor_urut: 2,
        bank_soal_id: "BS_2",
        versi_soal_id: "VS_2",
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Soal nomor 2?",
        opsi_jawaban: [
          { id: "A", label: "A", teks: "Opsi Dua A", urutan: 1 },
          { id: "B", label: "B", teks: "Opsi Dua B", urutan: 2 },
        ],
        bobot: 1,
      },
    ];

    render(
      <CbtPlayerView
        initialSession={mockSession}
        manifest={mockManifest}
        initialTimeRemainingSeconds={3600}
        initialSavedAnswers={{}}
        autosaveBatchDelayMs={8000}
        ujian={{ judul: "Simulasi 600 Siswa", deskripsi: null, acak_soal: false }}
      />
    );

    // Jawab soal 1 lalu ganti jawaban di soal 1, lalu pindah ke soal 2 dan jawab soal 2
    fireEvent.click(screen.getByRole("button", { name: /A Opsi Satu A/i }));
    fireEvent.click(screen.getByRole("button", { name: /B Opsi Satu B/i }));
    fireEvent.click(screen.getByText("Berikutnya"));
    fireEvent.click(screen.getByRole("button", { name: /A Opsi Dua A/i }));

    // Sebelum 8 detik berlalu, server belum dipukul sama sekali
    expect(mockBatchAutosave).not.toHaveBeenCalled();
    expect(mockSingleAutosave).not.toHaveBeenCalled();

    // Majukan timer 8 detik -> flush 1 batch berisi 2 soal terbaru
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    expect(mockBatchAutosave).toHaveBeenCalledTimes(1);
    expect(mockBatchAutosave).toHaveBeenCalledWith(
      expect.objectContaining({
        sesi_ujian_siswa_id: "SESS_BATCH_1",
        session_token: "TOK_1",
        items: expect.arrayContaining([
          expect.objectContaining({ soal_id: "BS_1", jawaban_pilihan: "B" }),
          expect.objectContaining({ soal_id: "BS_2", jawaban_pilihan: "A" }),
        ]),
      })
    );
  });

  it("flushes pending answers before submitAttemptAction is called", async () => {
    vi.useFakeTimers();

    const mockSession: any = {
      id: "SESS_BATCH_2",
      ujian_cbt_id: "UJIAN_1",
      siswa_id: "SISWA_1",
      status: "SEDANG_MENGERJAKAN",
      batas_waktu_server: new Date(Date.now() + 3600000),
      token_sesi_aktif: "TOK_2",
    };

    const mockManifest: any[] = [
      {
        nomor_urut: 1,
        bank_soal_id: "BS_1",
        versi_soal_id: "VS_1",
        tipe_soal: "PILIHAN_GANDA",
        pertanyaan: "Soal terakhir?",
        opsi_jawaban: [{ id: "A", label: "A", teks: "Jawaban Benar", urutan: 1 }],
        bobot: 1,
      },
    ];

    render(
      <CbtPlayerView
        initialSession={mockSession}
        manifest={mockManifest}
        initialTimeRemainingSeconds={3600}
        initialSavedAnswers={{}}
        autosaveBatchDelayMs={15000}
        ujian={{ judul: "Ujian Akhir", deskripsi: null, acak_soal: false }}
      />
    );

    // Pilih jawaban tapi jangan tunggu timer 15 detik
    fireEvent.click(screen.getByRole("button", { name: /A Jawaban Benar/i }));
    expect(mockBatchAutosave).not.toHaveBeenCalled();

    // Buka modal konfirmasi kumpulkan ujian
    fireEvent.click(screen.getByRole("button", { name: /^Selesai$/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ya, Kumpulkan Sekarang/i }));
    });

    // Pastikan batch flush dijalankan sebelum submit
    expect(mockBatchAutosave).toHaveBeenCalledTimes(1);
    expect(mockSubmitAttempt).toHaveBeenCalledTimes(1);
  });

  it("saveAnswersBatchOptimized deduplicates items and uses native array $transaction", async () => {
    const repo = new CbtRepository();

    const findUniqueSpy = vi.spyOn(prisma.sesiUjianSiswa, "findUnique").mockResolvedValue({
      id: "SESS_1",
      sekolah_id: "SCH_1",
      siswa_id: "SISWA_1",
      status: "SEDANG_MENGERJAKAN",
      batas_waktu_server: new Date(Date.now() + 600000),
      token_sesi_aktif: "TOK_1",
    } as any);

    const upsertSpy = vi
      .spyOn(prisma.jawabanSiswa, "upsert")
      .mockImplementation(((args: any) => Promise.resolve(args)) as any);

    const txSpy = vi.spyOn(prisma, "$transaction").mockResolvedValue([] as any);

    const res = await repo.saveAnswersBatchOptimized({
      sesi_ujian_id: "SESS_1",
      siswa_id: "SISWA_1",
      session_token: "TOK_1",
      items: [
        { soal_id: "SOAL_1", jawaban_pilihan: "A" },
        { soal_id: "SOAL_1", jawaban_pilihan: "C" }, // duplicate -> should keep C
        { soal_id: "SOAL_2", jawaban_pilihan: "B" },
      ],
    });

    expect(res.savedCount).toBe(2);
    expect(findUniqueSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledTimes(2);
    expect(txSpy).toHaveBeenCalledTimes(1);
    const txArgs = txSpy.mock.calls[0][0] as unknown;
    expect(Array.isArray(txArgs)).toBe(true);
    expect((txArgs as unknown[]).length).toBe(2);
  });
});
