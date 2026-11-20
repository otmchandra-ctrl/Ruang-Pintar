/**
 * Ruang Pintar — MaterialDetailModal (Student Academic Reader UI) Unit Tests
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MaterialDetailModal } from "@/modules/student/presentation/material-detail-modal";
import { StudentMaterialItem } from "@/modules/student/domain/student-experience-types";

describe("MaterialDetailModal (Student Academic Reader UI)", () => {
  const onClose = vi.fn();

  const mockPdfMaterial: StudentMaterialItem = {
    id: "PUB_01",
    materiId: "MAT_01",
    judul: "Modul Algoritma & Pemrograman Dasar",
    deskripsi: "Pelajari konsep algoritma sekuensial dan percabangan.",
    tipeKonten: "DOKUMEN",
    kontenTeks: null,
    tautanUrl: null,
    berkas: {
      id: "BERKAS_PDF_01",
      namaFileAsli: "modul-algoritma.pdf",
      ukuranByte: 204800, // 200 KB
      mimeType: "application/pdf",
    },
    tanggalPublikasi: new Date("2026-10-10"),
    tanggalPublikasiFormatted: "10 Okt 2026",
    mataPelajaranNama: "Informatika",
    guruNama: "Budi Santoso, M.Kom.",
    babJudul: "BAB 1: Berpikir Komputasional",
    penugasanMengajarId: "PEN_01",
  };

  const mockTextMaterial: StudentMaterialItem = {
    id: "PUB_02",
    materiId: "MAT_02",
    judul: "Rangkuman Teori Gerak Lurus Beraturan",
    deskripsi: "Konsep GLB, kecepatan tetap, dan grafik v-t.",
    tipeKonten: "TEKS",
    kontenTeks:
      "Gerak Lurus Beraturan (GLB) adalah gerak suatu benda pada lintasan lurus dengan kecepatan yang konstan.",
    tautanUrl: null,
    berkas: null,
    tanggalPublikasi: new Date("2026-10-11"),
    tanggalPublikasiFormatted: "11 Okt 2026",
    mataPelajaranNama: "Fisika",
    guruNama: "Siti Rahma, S.Pd.",
    babJudul: "BAB 2: Kinematika Gerak",
    penugasanMengajarId: "PEN_02",
  };

  const mockVideoMaterial: StudentMaterialItem = {
    id: "PUB_03",
    materiId: "MAT_03",
    judul: "Video Pembahasan Soal Vektor Fisika",
    deskripsi: "Tonton video penjelasan rumus resultan gaya dan trigonometri.",
    tipeKonten: "VIDEO",
    kontenTeks: null,
    tautanUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    berkas: null,
    tanggalPublikasi: new Date("2026-10-12"),
    tanggalPublikasiFormatted: "12 Okt 2026",
    mataPelajaranNama: "Fisika",
    guruNama: "Siti Rahma, S.Pd.",
    babJudul: null,
    penugasanMengajarId: "PEN_02",
  };

  it("renders PDF document with in-app reader, read in new tab, and download options", () => {
    render(<MaterialDetailModal material={mockPdfMaterial} isOpen={true} onClose={onClose} />);

    expect(screen.getByText("Modul Algoritma & Pemrograman Dasar")).toBeInTheDocument();
    expect(screen.getByText("Informatika")).toBeInTheDocument();
    expect(screen.getByText("BAB 1: Berpikir Komputasional")).toBeInTheDocument();

    // Dual action buttons: Baca di Tab Baru & Unduh
    expect(screen.getByRole("link", { name: /Baca di Tab Baru/i })).toHaveAttribute(
      "href",
      "/api/berkas/BERKAS_PDF_01"
    );
    expect(screen.getByRole("link", { name: /Unduh/i })).toHaveAttribute(
      "href",
      "/api/berkas/BERKAS_PDF_01"
    );

    // In-app embedded iframe
    const iframe = screen.getByTitle("modul-algoritma.pdf");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "/api/berkas/BERKAS_PDF_01#view=FitH");
  });

  it("toggles the embedded PDF reader visibility", () => {
    render(<MaterialDetailModal material={mockPdfMaterial} isOpen={true} onClose={onClose} />);

    // Initially open
    expect(screen.getByTitle("modul-algoritma.pdf")).toBeInTheDocument();

    // Click toggle button to hide
    const toggleBtn = screen.getByRole("button", { name: /Sembunyikan Pratinjau/i });
    fireEvent.click(toggleBtn);

    expect(screen.queryByTitle("modul-algoritma.pdf")).not.toBeInTheDocument();

    // Click again to show
    const showBtn = screen.getByRole("button", { name: /Tampilkan Pratinjau/i });
    fireEvent.click(showBtn);

    expect(screen.getByTitle("modul-algoritma.pdf")).toBeInTheDocument();
  });

  it("renders text article reading mode with font size adjusters", () => {
    render(<MaterialDetailModal material={mockTextMaterial} isOpen={true} onClose={onClose} />);

    expect(screen.getByText("Rangkuman Teori Gerak Lurus Beraturan")).toBeInTheDocument();
    expect(screen.getByText("Modul Bacaan Artikel")).toBeInTheDocument();
    expect(screen.getByText(/menit baca/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Gerak Lurus Beraturan \(GLB\) adalah gerak suatu benda/i)
    ).toBeInTheDocument();

    // Font size controls
    expect(screen.getByRole("button", { name: "A-" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A+" })).toBeInTheDocument();

    // Test clicking A+
    fireEvent.click(screen.getByRole("button", { name: "A+" }));
  });

  it("renders embedded YouTube video player for video content", () => {
    render(<MaterialDetailModal material={mockVideoMaterial} isOpen={true} onClose={onClose} />);

    expect(screen.getByText("Video Pembahasan Soal Vektor Fisika")).toBeInTheDocument();
    expect(screen.getByText(/Pemutar Video Pembelajaran/i)).toBeInTheDocument();

    // Check embedded iframe with nocookie youtube URL
    const iframe = screen.getByTitle("Video Pembahasan Soal Vektor Fisika");
    expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
});
