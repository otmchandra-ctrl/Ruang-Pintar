import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockIdentityService, mockRecordAuditEvent } = vi.hoisted(() => {
  const txMock = {
    eventIntegritasUjian: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    jawabanSiswa: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    hasilUjianCbt: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    sesiUjianSiswa: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    assessmentAttempt: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    examSession: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    snapshotUjian: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    ujianCbt: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    itemKisiKisi: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    kisiKisiAsesmen: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    versiSoal: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    bankSoal: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    folderBankSoal: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    tindakLanjutMonitoring: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    catatanMonitoring: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    raporSiswa: {
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    riwayatEksporLaporan: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    publikasiNilaiAsesmen: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    nilaiSiswa: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    definisiAsesmen: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    presensiSesiKelas: {
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    administrasiTujuanPembelajaran: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    administrasiPembelajaran: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    pengumpulanTugas: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    publikasiTugas: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    definisiTugas: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    publikasiMateri: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    materiPembelajaran: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    kriteriaKetercapaianTp: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    tujuanPembelajaran: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    lingkupMateri: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    capaianPembelajaran: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    sesiKelasAktual: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    jadwalPelajaran: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    versiJadwal: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    slotWaktu: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    kalenderAkademik: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    penugasanWaliKelas: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    penugasanMengajar: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    penugasanJabatan: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    jabatan: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    unitOrganisasi: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    pengajuanWali: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    hubunganWaliSiswa: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    waliMurid: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    penempatanRombel: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    keikutsertaanSiswa: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    siswa: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    rombel: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    programKeahlian: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    tingkatKelas: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    fase: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    semester: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    tahunAjaran: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    mataPelajaran: {
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    guru: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    sasaranPengumuman: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    pengumuman: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    notifikasiPengguna: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    preferensiNotifikasi: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    permintaanSetupKelasAi: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    preferensiOnboardingGuru: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    logPengirimanIntegrasi: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    endpointWebhook: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    konfigurasiIntegrasi: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    konfigurasiSistem: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    metadataBerkas: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    transaksiLangganan: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    langgananTenant: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    keanggotaanSekolah: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    sesiPengguna: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    identitasProvider: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    kemampuanStaff: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    logPercobaanLogin: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    logAudit: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    pengguna: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({}),
    },
    sekolah: { delete: vi.fn().mockResolvedValue({}) },
  };

  return {
    mockPrisma: {
      ...txMock,
      sekolah: {
        ...txMock.sekolah,
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      pengguna: {
        ...txMock.pengguna,
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      guru: {
        ...txMock.guru,
        findMany: vi.fn(),
      },
      penugasanMengajar: {
        ...txMock.penugasanMengajar,
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
    },
    mockIdentityService: {
      adminResetPassword: vi.fn(),
    },
    mockRecordAuditEvent: vi.fn(),
  };
});

vi.mock("@/shared/infrastructure/database/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/shared/infrastructure/auth/identity-service", () => ({
  identityService: mockIdentityService,
}));

vi.mock("@/shared/infrastructure/audit/audit-logger", () => ({
  recordAuditEvent: mockRecordAuditEvent,
}));

import { platformControlService } from "@/modules/school/application/platform-control-service";

describe("PlatformControlService (SUPER_ADMIN Tenant & Account Control)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects password reset from non-SUPER_ADMIN actor", async () => {
    await expect(
      platformControlService.resetPlatformUserPassword({
        targetUserId: "usr_trial_1",
        actorId: "usr_teacher",
        actorRole: "TEACHER",
      })
    ).rejects.toThrow(/Super Admin/i);
  });

  it("resets password and revokes active user sessions for SUPER_ADMIN", async () => {
    mockPrisma.pengguna.findUnique.mockResolvedValue({
      id: "usr_trial_1",
      username: "guru_trial",
      email: "guru@trial.id",
      nama_lengkap: "Budi Trial",
      peran_dasar: "TEACHER",
    });
    mockIdentityService.adminResetPassword.mockResolvedValue({
      success: true,
      temporaryPassword: "TempPass99#",
    });

    const result = await platformControlService.resetPlatformUserPassword({
      targetUserId: "usr_trial_1",
      customPassword: "TempPass99#",
      actorId: "usr_super",
      actorRole: "SUPER_ADMIN",
    });

    expect(mockIdentityService.adminResetPassword).toHaveBeenCalledWith(
      "usr_trial_1",
      "TempPass99#",
      "usr_super",
      "SUPER_ADMIN",
      undefined,
      undefined
    );
    expect(mockPrisma.sesiPengguna.deleteMany).toHaveBeenCalledWith({
      where: { pengguna_id: "usr_trial_1" },
    });
    expect(result.temporaryPassword).toBe("TempPass99#");
    expect(result.username).toBe("guru_trial");
  });

  it("blocks deleting a paid SEKOLAH tenant", async () => {
    mockPrisma.sekolah.findUnique.mockResolvedValue({
      id: "sch_paid",
      nama: "SMK Otomindo",
      tipe_lisensi: "SEKOLAH",
    });

    await expect(
      platformControlService.deleteFreemiumTenant({
        sekolahId: "sch_paid",
        confirmName: "SMK Otomindo",
        actorId: "usr_super",
        actorRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow(/FREEMIUM/i);
  });

  it("blocks deleting a FREEMIUM tenant when confirmation name mismatches", async () => {
    mockPrisma.sekolah.findUnique.mockResolvedValue({
      id: "sch_free_1",
      nama: "Guru Mandiri",
      tipe_lisensi: "FREEMIUM",
    });

    await expect(
      platformControlService.deleteFreemiumTenant({
        sekolahId: "sch_free_1",
        confirmName: "Salah Nama",
        actorId: "usr_super",
        actorRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow(/konfirmasi/i);
  });

  it("deletes a FREEMIUM tenant atomically when confirmed and not active impersonated", async () => {
    mockPrisma.sekolah.findUnique.mockResolvedValue({
      id: "sch_free_1",
      nama: "Guru Mandiri",
      tipe_lisensi: "FREEMIUM",
    });

    const res = await platformControlService.deleteFreemiumTenant({
      sekolahId: "sch_free_1",
      confirmName: "Guru Mandiri",
      actorId: "usr_super",
      actorRole: "SUPER_ADMIN",
      actorActiveSekolahId: null,
    });

    expect(res.deletedSekolahId).toBe("sch_free_1");
    expect(mockPrisma.sekolah.delete).toHaveBeenCalledWith({
      where: { id: "sch_free_1" },
    });
    expect(mockRecordAuditEvent).toHaveBeenCalled();
  });

  it("rejects deleting a SUPER_ADMIN user or user with teacher academic history", async () => {
    mockPrisma.pengguna.findUnique.mockResolvedValueOnce({
      id: "usr_other_admin",
      username: "admin2",
      email: "admin2@rp.id",
      nama_lengkap: "Admin 2",
      peran_dasar: "SUPER_ADMIN",
      transaksi_langganan: [],
      ekspor_laporan: [],
      guru: null,
    });

    await expect(
      platformControlService.deletePlatformUser({
        targetUserId: "usr_other_admin",
        actorId: "usr_super",
        actorRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow(/Super Admin/i);

    mockPrisma.pengguna.findUnique.mockResolvedValueOnce({
      id: "usr_teacher_hist",
      username: "guru_lama",
      email: "guru@lama.id",
      nama_lengkap: "Guru Lama",
      peran_dasar: "TEACHER",
      transaksi_langganan: [],
      ekspor_laporan: [],
      guru: {
        id: "guru_1",
        sekolah_id: "sch_1",
        _count: {
          penugasan_mengajar: 2,
          sesi_kelas_aktual: 0,
          materi_dibuat: 0,
          tugas_dibuat: 0,
          administrasi_pembelajaran: 0,
          bank_soal: 0,
        },
      },
    });

    await expect(
      platformControlService.deletePlatformUser({
        targetUserId: "usr_teacher_hist",
        actorId: "usr_super",
        actorRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow(/histori akademik/i);
  });

  it("aggregates real KBM weekday distribution and attendance rates for /sekolah analytics", async () => {
    mockPrisma.sesiKelasAktual.findMany.mockResolvedValueOnce([
      { tanggal: new Date("2026-11-23T08:00:00.000Z"), created_at: new Date() }, // Senin
      { tanggal: new Date("2026-11-26T08:00:00.000Z"), created_at: new Date() }, // Kamis
      { tanggal: new Date("2026-11-26T10:00:00.000Z"), created_at: new Date() }, // Kamis
    ]);
    mockPrisma.presensiSesiKelas.count
      .mockResolvedValueOnce(187)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(6);
    mockPrisma.raporSiswa.count.mockResolvedValueOnce(12);
    mockPrisma.mataPelajaran.count.mockResolvedValueOnce(58);

    const analytics = await platformControlService.getPlatformActivityAnalytics();

    expect(analytics.activityDays).toEqual({
      SENIN: 1,
      SELASA: 0,
      RABU: 0,
      KAMIS: 2,
      JUMAT: 0,
      SABTU: 0,
    });
    expect(analytics.totalSesiAktual).toBe(3);
    expect(analytics.attendance.hadirPct).toBe(92.6);
    expect(analytics.attendance.izinSakitPct).toBe(4.5);
    expect(analytics.attendance.alphaPct).toBe(3.0);
    expect(analytics.totalRapor).toBe(12);
    expect(analytics.totalMataPelajaran).toBe(58);
  });

  it("loads directory data using flat scalar queries without relation IN joins (D1 safe)", async () => {
    mockPrisma.sekolah.findMany.mockResolvedValueOnce([
      { id: "sch_1", nama: "Guru Mandiri", tipe_lisensi: "FREEMIUM" },
    ]);
    mockPrisma.keanggotaanSekolah.findMany.mockResolvedValueOnce([
      {
        sekolah_id: "sch_1",
        pengguna_id: "usr_1",
        is_owner: true,
        created_at: "2026-11-27T01:00:00.000Z",
      },
    ]);
    mockPrisma.pengguna.findMany.mockResolvedValueOnce([
      {
        id: "usr_1",
        username: "budi_trial",
        email: "budi@gmail.com",
        nama_lengkap: "Budi Trial",
        peran_dasar: "TEACHER",
        status_akun: "AKTIF",
        harus_ganti_password: false,
        percobaan_login_gagal: 0,
        dikunci_sampai: null,
        terakhir_login_pada: null,
        created_at: "2026-11-27T01:00:00.000Z",
        sekolah_id: "sch_1",
      },
    ]);
    mockPrisma.guru.findMany.mockResolvedValueOnce([{ id: "guru_1", pengguna_id: "usr_1" }]);
    mockPrisma.penugasanMengajar.findMany.mockResolvedValueOnce([
      { guru_id: "guru_1" },
      { guru_id: "guru_1" },
    ]);

    const res = await platformControlService.listPlatformDirectoryData();

    expect(res.ownerBySchoolId["sch_1"]?.username).toBe("budi_trial");
    expect(res.platformUsers[0]).toMatchObject({
      id: "usr_1",
      sekolah_nama: "Guru Mandiri",
      sekolah_tipe_lisensi: "FREEMIUM",
      is_owner: true,
      guru_id: "guru_1",
      guru_penugasan_count: 2,
    });
  });
});
