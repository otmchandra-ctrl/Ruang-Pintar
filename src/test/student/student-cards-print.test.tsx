import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  StudentCardsPrintView,
  SchoolCardData,
} from "@/modules/student/presentation/print/student-cards-print-view";
import { StudentIdentityDTO } from "@/modules/student/domain/student-types";

describe("StudentCardsPrintView (Kartu Tanda Pelajar A4)", () => {
  const mockSchool: SchoolCardData = {
    nama: "SMK Negeri 1 Jakarta",
    npsn: "20101234",
    jenjang: "SMK",
    alamat: "Jl. Budi Utomo No. 7, Jakarta Pusat",
    telepon: "021-3840000",
    email: "info@smkn1jkt.sch.id",
    kota: "Jakarta",
    kepala_sekolah_nama: "Drs. H. Mulyono, M.Pd.",
    kepala_sekolah_nip: "197204151998031002",
  };

  const mockStudents: StudentIdentityDTO[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `student-${i + 1}`,
    sekolah_id: "school-1",
    pengguna_id: `user-${i + 1}`,
    nis: `202400${i + 1}`,
    nisn: `008123456${i}`,
    nama_lengkap: `Siswa Uji Coba ${i + 1}`,
    jenis_kelamin: i % 2 === 0 ? "L" : "P",
    tempat_lahir: "Jakarta",
    tanggal_lahir: new Date("2008-05-15"),
    agama: "ISLAM",
    nik: `317101234567000${i}`,
    alamat: "Jl. Merdeka No. 10",
    nama_wali: `Wali Siswa ${i + 1}`,
    telepon_wali: "081234567890",
    email_wali: "wali@test.com",
    status_akademik: "AKTIF",
    foto_url: null,
    tanggal_masuk: new Date("2024-07-15"),
    tanggal_keluar: null,
    catatan: null,
    created_at: new Date(),
    updated_at: new Date(),
    active_rombel_nama: "X RPL 1",
  }));

  it("merender kartu tanda pelajar dengan data identitas dan kop sekolah", () => {
    render(
      <StudentCardsPrintView
        students={mockStudents.slice(0, 2)}
        school={mockSchool}
        rombelNama="X RPL 1"
      />
    );

    expect(screen.getAllByText("SMK Negeri 1 Jakarta").length).toBeGreaterThan(0);
    expect(screen.getByText("Siswa Uji Coba 1")).toBeInTheDocument();
    expect(screen.getByText("Siswa Uji Coba 2")).toBeInTheDocument();
    expect(screen.getAllByText(/KARTU TANDA PELAJAR/i).length).toBeGreaterThan(0);
  });

  it("membagi 10 siswa menjadi 2 lembar A4 (maksimal 8 kartu per lembar)", () => {
    render(
      <StudentCardsPrintView students={mockStudents} school={mockSchool} rombelNama="X RPL 1" />
    );

    expect(screen.getByText(/LEMBAR A4 #1/i)).toBeInTheDocument();
    expect(screen.getByText(/LEMBAR A4 #2/i)).toBeInTheDocument();
    expect(screen.getByText(/10 Siswa Terpilih/i)).toBeInTheDocument();
  });

  it("memanggil window.print() ketika tombol cetak diklik", () => {
    const printSpy = vi.fn();
    window.print = printSpy;

    render(<StudentCardsPrintView students={mockStudents.slice(0, 1)} school={mockSchool} />);

    const printBtn = screen.getByRole("button", { name: /Cetak Kartu \(1\)/i });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("beralih ke tampilan tata tertib (tampak belakang) saat tab diklik", () => {
    render(<StudentCardsPrintView students={mockStudents.slice(0, 2)} school={mockSchool} />);

    const backBtn = screen.getByRole("button", { name: /Tata Tertib \(Belakang\)/i });
    fireEvent.click(backBtn);

    expect(screen.getAllByText(/TATA TERTIB & KETENTUAN KARTU/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Wajib dibawa saat kegiatan KBM/i).length).toBeGreaterThan(0);
  });
});
