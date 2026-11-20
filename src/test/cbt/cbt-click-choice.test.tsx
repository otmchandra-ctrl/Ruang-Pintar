import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CbtPlayerView } from "@/modules/cbt/presentation/cbt-player-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockAutosave = vi.fn().mockResolvedValue({ success: true, message: "Tersimpan." });

vi.mock("@/app/actions/cbt-actions", () => ({
  autosaveAnswerAction: (...args: any[]) => mockAutosave(...args),
  recordIntegrityEventAction: vi
    .fn()
    .mockResolvedValue({ success: true, data: { isLocked: false } }),
  submitAttemptAction: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

describe("CBT Player Choice Clicking Diagnostic", () => {
  it("should select an option when clicked and update visual state", async () => {
    const mockSession: any = {
      id: "TEST_SESSION_1",
      ujian_cbt_id: "01M4SGCV3H6MNSZB7MK91ARTAJ",
      siswa_id: "01M3B7WK6EQRAVSRDMZA8GVRV0",
      status: "SEDANG_MENGERJAKAN",
      batas_waktu_server: new Date(Date.now() + 3600000),
      token_sesi_aktif: "TOKEN_123",
    };

    const mockManifestItem: any = {
      nomor_urut: 1,
      bank_soal_id: "BS_1",
      versi_soal_id: "VS_1",
      tipe_soal: "PILIHAN_GANDA",
      pertanyaan: "Dalam pengembangan web modern, peran apa yang merancang tampilan antarmuka?",
      gambar_url: null,
      opsi_jawaban: [
        { id: "A", label: "A", teks: "UI Designer", urutan: 1 },
        { id: "B", label: "B", teks: "Programmer", urutan: 2 },
        { id: "C", label: "C", teks: "System Analyst", urutan: 3 },
      ],
      bobot: 1.0,
    };

    render(
      <CbtPlayerView
        initialSession={mockSession}
        manifest={[mockManifestItem]}
        initialTimeRemainingSeconds={3600}
        initialSavedAnswers={{}}
        ujian={{
          judul: "Latihan TKA - Kejuruan Rekayasa Perangkat Lunak",
          deskripsi: "Petunjuk pengerjaan",
          acak_soal: false,
        }}
      />
    );

    // Temukan opsi A
    const optionAButton = screen.getByRole("button", { name: /A UI Designer/i });
    expect(optionAButton).toBeDefined();

    // Pastikan awalnya belum terpilih
    expect(optionAButton.className).not.toContain("border-blue-600");

    // Klik tombol opsi A
    fireEvent.click(optionAButton);

    // Verifikasi apakah tombol sekarang terpilih
    await waitFor(() => {
      expect(optionAButton.className).toContain("border-blue-600");
    });

    // Verifikasi pemanggilan autosaveAnswerAction
    expect(mockAutosave).toHaveBeenCalledWith(
      expect.objectContaining({
        sesi_ujian_siswa_id: "TEST_SESSION_1",
        nomor_urut: 1,
        jawaban_pilihan: "A",
      })
    );
  });
});
