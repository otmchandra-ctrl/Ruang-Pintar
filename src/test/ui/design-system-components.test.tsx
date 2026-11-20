import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

describe("Design System Component Standardisation (Pillars 3, 4, 5, 6)", () => {
  describe("Pillar 6: Button System", () => {
    it("renders primary button with minimum 44px touch target by default", () => {
      render(<Button>Simpan Data</Button>);
      const btn = screen.getByRole("button", { name: "Simpan Data" });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain("min-h-[44px]");
      expect(btn.className).toContain("bg-[#1E293B]");
      expect(btn.className).toContain("dark:bg-slate-100");
    });

    it("renders cobalt button with dark mode support", () => {
      render(<Button variant="cobalt">Aksi Khusus</Button>);
      const btn = screen.getByRole("button", { name: "Aksi Khusus" });
      expect(btn.className).toContain("bg-blue-600");
      expect(btn.className).toContain("dark:hover:bg-blue-500");
    });

    it("renders icon button with 44px x 44px minimum touch target", () => {
      render(
        <Button variant="ghost" size="icon" aria-label="Tutup Panel">
          X
        </Button>
      );
      const btn = screen.getByRole("button", { name: "Tutup Panel" });
      expect(btn.className).toContain("min-h-[44px]");
      expect(btn.className).toContain("min-w-[44px]");
    });

    it("handles loading state with spinner and disabled behavior", () => {
      render(<Button isLoading>Kirim Formulir</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(screen.getByText("Memproses...")).toBeInTheDocument();
    });
  });

  describe("Pillar 5: Badge System", () => {
    it("renders all canonical variants with dark mode classes", () => {
      const { rerender } = render(<Badge variant="neutral">Draft</Badge>);
      expect(screen.getByText("Draft").className).toContain("dark:bg-slate-800");

      rerender(<Badge variant="success">Aktif</Badge>);
      expect(screen.getByText("Aktif").className).toContain("dark:bg-emerald-950/60");

      rerender(<Badge variant="cobalt">Terverifikasi</Badge>);
      expect(screen.getByText("Terverifikasi").className).toContain("dark:bg-blue-950/60");

      rerender(<Badge variant="academic">Kepala Sekolah</Badge>);
      expect(screen.getByText("Kepala Sekolah").className).toContain("dark:bg-slate-800");
    });

    it("renders size variants correctly", () => {
      const { rerender } = render(<Badge size="sm">Mini</Badge>);
      expect(screen.getByText("Mini").className).toContain("text-[11px]");

      rerender(<Badge size="default">Standar</Badge>);
      expect(screen.getByText("Standar").className).toContain("text-xs");
    });

    it("renders status indicator dot when hasDot is true", () => {
      const { container } = render(
        <Badge variant="success" hasDot>
          Selesai
        </Badge>
      );
      const dot = container.querySelector(".rounded-full.size-1\\.5");
      expect(dot).toBeInTheDocument();
      expect(dot?.className).toContain("bg-emerald-500");
    });
  });

  describe("Pillar 3: Card System", () => {
    it("renders all canonical surface tiers with dark mode support", () => {
      const { rerender, container } = render(<Card variant="solid">Konten Solid</Card>);
      expect(container.firstChild).toHaveClass("dark:bg-slate-900");
      expect(container.firstChild).toHaveClass("dark:border-slate-800");

      rerender(<Card variant="glassSoft">Konten Soft</Card>);
      expect(container.firstChild).toHaveClass("dark:bg-slate-900/60");

      rerender(<Card variant="glassElevated">Konten Elevated</Card>);
      expect(container.firstChild).toHaveClass("dark:bg-slate-900/80");

      rerender(<Card variant="statCard">Konten Stat</Card>);
      expect(container.firstChild).toHaveClass("hover:border-blue-300");
      expect(container.firstChild).toHaveClass("dark:hover:border-blue-600");
    });

    it("renders CardHeader, CardTitle, CardDescription, and CardContent with correct typography tokens", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan KBM</CardTitle>
            <CardDescription>Aktivitas semester ganjil</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Rincian data</p>
          </CardContent>
          <CardFooter>
            <span>Footer Info</span>
          </CardFooter>
        </Card>
      );

      const title = screen.getByText("Ringkasan KBM");
      expect(title.tagName).toBe("H3");
      expect(title.className).toContain("dark:text-slate-100");

      const desc = screen.getByText("Aktivitas semester ganjil");
      expect(desc.tagName).toBe("P");
      expect(desc.className).toContain("dark:text-slate-400");
    });
  });

  describe("Pillar 4: Form System", () => {
    it("renders Input with size variants and error styling", () => {
      const { rerender } = render(<Input placeholder="Masukkan nama" inputSize="default" />);
      const input = screen.getByPlaceholderText("Masukkan nama");
      expect(input.className).toContain("h-11");
      expect(input.className).toContain("dark:bg-slate-900");

      rerender(<Input placeholder="Masukkan nama" inputSize="sm" isError />);
      expect(input.className).toContain("h-9");
      expect(input.className).toContain("border-rose-400");
      expect(input.className).toContain("dark:border-rose-600");
    });

    it("renders Select with chevron and standardized size styles", () => {
      render(
        <Select defaultValue="10" aria-label="Tingkat Kelas" selectSize="default">
          <option value="10">Kelas 10</option>
          <option value="11">Kelas 11</option>
        </Select>
      );
      const select = screen.getByLabelText("Tingkat Kelas");
      expect(select).toBeInTheDocument();
      expect(select.className).toContain("h-11");
      expect(select.className).toContain("dark:bg-slate-900");
    });

    it("renders Textarea with standardized padding and error handling", () => {
      const { rerender } = render(<Textarea placeholder="Catatan pengajar" rows={4} />);
      const textarea = screen.getByPlaceholderText("Catatan pengajar");
      expect(textarea).toBeInTheDocument();
      expect(textarea.getAttribute("rows")).toBe("4");
      expect(textarea.className).toContain("dark:bg-slate-900");

      rerender(<Textarea placeholder="Catatan pengajar" isError />);
      expect(textarea.className).toContain("border-rose-400");
    });
  });
});
