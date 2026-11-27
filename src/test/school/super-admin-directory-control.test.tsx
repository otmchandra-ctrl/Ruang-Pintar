import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SuperAdminSchoolDirectoryView,
  SchoolTenantItem,
} from "@/modules/school/presentation/super-admin-school-directory-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/actions/tenant-actions", () => ({
  switchActiveTenantAction: vi.fn().mockResolvedValue({ success: true }),
  clearActiveTenantAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/app/actions/school-actions", () => ({
  toggleSchoolActiveStatusAction: vi.fn().mockResolvedValue({ success: true }),
  createSchoolAction: vi.fn().mockResolvedValue({ success: true }),
  updateSchoolLicenseAction: vi.fn().mockResolvedValue({ success: true }),
}));

const mockResetAction = vi.fn().mockResolvedValue({
  success: true,
  data: {
    userId: "usr_guru_1",
    username: "budi_guru",
    email: "budi@gmail.com",
    nama_lengkap: "Budi Trial",
    temporaryPassword: "Password123#",
  },
});

const mockDeleteTenantAction = vi.fn().mockResolvedValue({
  success: true,
  message: "Tenant berhasil dihapus.",
});

const mockDeleteUserAction = vi.fn().mockResolvedValue({
  success: true,
  message: "Akun berhasil dihapus.",
});

vi.mock("@/app/actions/platform-admin-actions", () => ({
  resetPlatformUserPasswordAction: (...args: unknown[]) => mockResetAction(...args),
  deleteFreemiumTenantAction: (...args: unknown[]) => mockDeleteTenantAction(...args),
  deletePlatformUserAction: (...args: unknown[]) => mockDeleteUserAction(...args),
}));

describe("SuperAdminSchoolDirectoryView — Tenant & User Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSchools: SchoolTenantItem[] = [
    {
      id: "sch_free_1",
      nama: "Guru Mandiri",
      npsn: null,
      jenjang: "UMUM",
      tipe_lisensi: "FREEMIUM",
      trial_berakhir_pada: new Date(Date.now() + 28 * 86400000).toISOString(),
      status_aktif: true,
      alamat: null,
      telepon: null,
      email: null,
      created_at: new Date().toISOString(),
      _count: { siswa: 0, guru: 1, rombel: 0, ujian_cbt: 0, pengguna: 1 },
      ownerSummary: {
        userId: "usr_guru_1",
        nama_lengkap: "Budi Trial",
        username: "budi_guru",
        email: "budi@gmail.com",
        status_akun: "AKTIF",
      },
    },
    {
      id: "sch_paid_1",
      nama: "SMK Otomindo",
      npsn: "20103704",
      jenjang: "SMK",
      tipe_lisensi: "SEKOLAH",
      trial_berakhir_pada: null,
      status_aktif: true,
      alamat: "Jakarta Timur",
      telepon: null,
      email: "smkotomindo@sch.id",
      created_at: new Date().toISOString(),
      _count: { siswa: 700, guru: 40, rombel: 23, ujian_cbt: 3, pengguna: 740 },
      ownerSummary: null,
    },
  ];

  const mockPlatformUsers = [
    {
      id: "usr_guru_1",
      username: "budi_guru",
      email: "budi@gmail.com",
      nama_lengkap: "Budi Trial",
      peran_dasar: "TEACHER",
      status_akun: "AKTIF",
      harus_ganti_password: false,
      percobaan_login_gagal: 0,
      dikunci_sampai: null,
      terakhir_login: null,
      created_at: new Date().toISOString(),
      sekolah_id: "sch_free_1",
      sekolah_nama: "Guru Mandiri",
      sekolah_tipe_lisensi: "FREEMIUM",
      is_owner: true,
      guru_id: "guru_1",
      guru_penugasan_count: 0,
    },
  ];

  it("shows tenant owner identity and only exposes delete button for FREEMIUM tenants", () => {
    render(
      <SuperAdminSchoolDirectoryView
        schools={mockSchools}
        platformUsers={mockPlatformUsers}
        currentUser={{
          id: "usr_super",
          nama_lengkap: "Super Admin",
          peran_dasar: "SUPER_ADMIN",
          sekolah_id: null,
        }}
      />
    );

    expect(screen.getAllByText(/Budi Trial/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/budi@gmail\.com/i).length).toBeGreaterThan(0);

    // Only 1 FREEMIUM delete button should exist (desktop + mobile render; check by aria-label/title)
    const deleteButtons = screen.getAllByTitle(/Hapus Permanen Tenant Trial/i);
    expect(deleteButtons.length).toBeGreaterThan(0);
    // Paid SMK Otomindo must not have delete trial button
    expect(
      screen.queryByRole("button", { name: /Hapus Trial SMK Otomindo/i })
    ).not.toBeInTheDocument();
  });

  it("switches to Akun Guru Mandiri & Pengguna tab and opens reset password modal", () => {
    render(
      <SuperAdminSchoolDirectoryView
        schools={mockSchools}
        platformUsers={mockPlatformUsers}
        currentUser={{
          id: "usr_super",
          nama_lengkap: "Super Admin",
          peran_dasar: "SUPER_ADMIN",
          sekolah_id: null,
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Akun Guru Mandiri/i }));

    expect(screen.getAllByText("budi_guru").length).toBeGreaterThan(0);
    const resetBtn = screen.getAllByRole("button", { name: /Reset Sandi/i })[0];
    fireEvent.click(resetBtn);

    expect(screen.getByText(/Reset Kata Sandi Pengguna/i)).toBeInTheDocument();
  });
});
