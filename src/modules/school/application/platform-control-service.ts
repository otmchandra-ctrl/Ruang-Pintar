import { prisma } from "@/shared/infrastructure/database/prisma";
import { identityService } from "@/shared/infrastructure/auth/identity-service";
import { recordAuditEvent } from "@/shared/infrastructure/audit/audit-logger";
import { SchoolDomainError } from "@/modules/school/domain/school-errors";

export interface PlatformTenantOwnerSummary {
  userId: string;
  nama_lengkap: string;
  username: string;
  email: string | null;
  status_akun: string;
}

export interface PlatformUserAccountItem {
  id: string;
  username: string;
  email: string | null;
  nama_lengkap: string;
  peran_dasar: string;
  status_akun: string;
  harus_ganti_password: boolean;
  percobaan_login_gagal: number;
  dikunci_sampai: string | null;
  terakhir_login: string | null;
  created_at: string;
  sekolah_id: string | null;
  sekolah_nama: string | null;
  sekolah_tipe_lisensi: string | null;
  is_owner: boolean;
  guru_id: string | null;
  guru_penugasan_count: number;
}

export interface ResetPlatformUserPasswordResult {
  userId: string;
  username: string;
  email: string | null;
  nama_lengkap: string;
  temporaryPassword: string;
}

function assertSuperAdmin(actorRole: string) {
  if (actorRole !== "SUPER_ADMIN") {
    throw new SchoolDomainError(
      "Akses ditolak: Hanya Super Admin platform yang berwenang menjalankan operasi ini.",
      "FORBIDDEN",
      403
    );
  }
}

export class PlatformControlService {
  /**
   * Memuat data direktori tenant beserta ringkasan pemilik & daftar pengguna platform non-SUPER_ADMIN.
   */
  async listPlatformDirectoryData(): Promise<{
    ownerBySchoolId: Record<string, PlatformTenantOwnerSummary | null>;
    platformUsers: PlatformUserAccountItem[];
  }> {
    const [memberships, rawUsers] = await Promise.all([
      prisma.keanggotaanSekolah.findMany({
        where: {
          status_keanggotaan: { in: ["ACTIVE", "PENDING", "SUSPENDED"] },
        },
        include: {
          pengguna: {
            select: {
              id: true,
              nama_lengkap: true,
              username: true,
              email: true,
              peran_dasar: true,
              status_akun: true,
            },
          },
        },
        orderBy: [{ is_owner: "desc" }, { created_at: "asc" }],
      }),
      prisma.pengguna.findMany({
        where: {
          peran_dasar: { not: "SUPER_ADMIN" },
        },
        include: {
          sekolah: {
            select: {
              id: true,
              nama: true,
              tipe_lisensi: true,
            },
          },
          keanggotaan_sekolah: {
            where: { is_owner: true },
            select: { sekolah_id: true },
          },
          guru: {
            select: {
              id: true,
              _count: {
                select: {
                  penugasan_mengajar: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

    const ownerBySchoolId: Record<string, PlatformTenantOwnerSummary | null> = {};
    for (const m of memberships) {
      if (!m.pengguna || m.pengguna.peran_dasar === "SUPER_ADMIN") continue;
      if (!ownerBySchoolId[m.sekolah_id]) {
        ownerBySchoolId[m.sekolah_id] = {
          userId: m.pengguna.id,
          nama_lengkap: m.pengguna.nama_lengkap,
          username: m.pengguna.username,
          email: m.pengguna.email,
          status_akun: m.pengguna.status_akun,
        };
      }
    }

    // Fallback: jika tenant punya Pengguna langsung (tanpa KeanggotaanSekolah)
    for (const u of rawUsers) {
      if (u.sekolah_id && !ownerBySchoolId[u.sekolah_id] && u.peran_dasar === "TEACHER") {
        ownerBySchoolId[u.sekolah_id] = {
          userId: u.id,
          nama_lengkap: u.nama_lengkap,
          username: u.username,
          email: u.email,
          status_akun: u.status_akun,
        };
      }
    }

    const platformUsers: PlatformUserAccountItem[] = rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      nama_lengkap: u.nama_lengkap,
      peran_dasar: u.peran_dasar,
      status_akun: u.status_akun,
      harus_ganti_password: u.harus_ganti_password,
      percobaan_login_gagal: u.percobaan_login_gagal,
      dikunci_sampai: u.dikunci_sampai ? u.dikunci_sampai.toISOString() : null,
      terakhir_login: u.terakhir_login_pada ? u.terakhir_login_pada.toISOString() : null,
      created_at: u.created_at.toISOString(),
      sekolah_id: u.sekolah?.id ?? u.sekolah_id ?? null,
      sekolah_nama: u.sekolah?.nama ?? null,
      sekolah_tipe_lisensi: u.sekolah?.tipe_lisensi ?? null,
      is_owner: u.keanggotaan_sekolah.length > 0,
      guru_id: u.guru?.id ?? null,
      guru_penugasan_count: u.guru?._count?.penugasan_mengajar ?? 0,
    }));

    return { ownerBySchoolId, platformUsers };
  }

  /**
   * Reset kata sandi pengguna lintas-tenant oleh Super Admin + cabut sesi aktif.
   */
  async resetPlatformUserPassword(input: {
    targetUserId: string;
    customPassword?: string;
    actorId: string;
    actorRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ResetPlatformUserPasswordResult> {
    assertSuperAdmin(input.actorRole);

    const target = await prisma.pengguna.findUnique({
      where: { id: input.targetUserId },
      select: {
        id: true,
        username: true,
        email: true,
        nama_lengkap: true,
        peran_dasar: true,
      },
    });

    if (!target) {
      throw new SchoolDomainError("Akun pengguna tidak ditemukan.", "NOT_FOUND", 404);
    }

    if (target.peran_dasar === "SUPER_ADMIN" && target.id !== input.actorId) {
      throw new SchoolDomainError(
        "Demi keamanan, Super Admin tidak dapat mereset kata sandi akun Super Admin lain.",
        "FORBIDDEN",
        403
      );
    }

    const res = await identityService.adminResetPassword(
      target.id,
      input.customPassword,
      input.actorId,
      input.actorRole,
      input.ipAddress,
      input.userAgent
    );

    if (!res.success || !res.temporaryPassword) {
      throw new SchoolDomainError(
        res.error || "Gagal mereset kata sandi pengguna.",
        "RESET_PASSWORD_FAILED",
        400
      );
    }

    await prisma.sesiPengguna.deleteMany({
      where: { pengguna_id: target.id },
    });

    return {
      userId: target.id,
      username: target.username,
      email: target.email,
      nama_lengkap: target.nama_lengkap,
      temporaryPassword: res.temporaryPassword,
    };
  }

  /**
   * Hapus permanen tenant uji coba / FREEMIUM beserta seluruh data turunannya secara atomik.
   */
  async deleteFreemiumTenant(input: {
    sekolahId: string;
    confirmName: string;
    actorId: string;
    actorRole: string;
    actorActiveSekolahId?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ deletedSekolahId: string; nama: string; deletedUsersCount: number }> {
    assertSuperAdmin(input.actorRole);

    if (input.actorActiveSekolahId && input.actorActiveSekolahId === input.sekolahId) {
      throw new SchoolDomainError(
        "Keluar dari mode impersonasi sekolah ini terlebih dahulu sebelum menghapus tenant.",
        "ACTIVE_TENANT_CONFLICT",
        409
      );
    }

    const sekolah = await prisma.sekolah.findUnique({
      where: { id: input.sekolahId },
      select: { id: true, nama: true, tipe_lisensi: true },
    });

    if (!sekolah) {
      throw new SchoolDomainError("Tenant sekolah tidak ditemukan.", "NOT_FOUND", 404);
    }

    if (sekolah.tipe_lisensi !== "FREEMIUM") {
      throw new SchoolDomainError(
        "Penghapusan permanen hanya diizinkan untuk tenant FREEMIUM / Trial. Gunakan Suspend untuk tenant berlisensi penuh.",
        "PAID_TENANT_PROTECTED",
        403
      );
    }

    if (input.confirmName.trim().toLowerCase() !== sekolah.nama.trim().toLowerCase()) {
      throw new SchoolDomainError(
        `Konfirmasi nama tenant tidak sesuai. Ketik persis "${sekolah.nama}" untuk melanjutkan.`,
        "CONFIRMATION_MISMATCH",
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sekolahId = sekolah.id;

      // Identifikasi kandidat pengguna yang terkait langsung dengan tenant ini
      const [directUsers, memberships] = await Promise.all([
        tx.pengguna.findMany({
          where: { sekolah_id: sekolahId },
          select: { id: true, username: true, email: true, peran_dasar: true },
        }),
        tx.keanggotaanSekolah.findMany({
          where: { sekolah_id: sekolahId },
          include: {
            pengguna: {
              select: { id: true, username: true, email: true, peran_dasar: true },
            },
          },
        }),
      ]);

      const candidateMap = new Map<
        string,
        { id: string; username: string; email: string | null; peran_dasar: string }
      >();
      for (const u of directUsers) candidateMap.set(u.id, u);
      for (const m of memberships) {
        if (m.pengguna) candidateMap.set(m.pengguna.id, m.pengguna);
      }

      const candidateIds = Array.from(candidateMap.keys());
      const exclusiveUsers: Array<{ id: string; username: string; email: string | null }> = [];

      if (candidateIds.length > 0) {
        const [otherMemberships, otherGurus, otherStudents, otherGuardians, paidTx] =
          await Promise.all([
            tx.keanggotaanSekolah.findMany({
              where: { pengguna_id: { in: candidateIds }, sekolah_id: { not: sekolahId } },
              select: { pengguna_id: true },
            }),
            tx.guru.findMany({
              where: { pengguna_id: { in: candidateIds }, sekolah_id: { not: sekolahId } },
              select: { pengguna_id: true },
            }),
            tx.siswa.findMany({
              where: { pengguna_id: { in: candidateIds }, sekolah_id: { not: sekolahId } },
              select: { pengguna_id: true },
            }),
            tx.waliMurid.findMany({
              where: { pengguna_id: { in: candidateIds }, sekolah_id: { not: sekolahId } },
              select: { pengguna_id: true },
            }),
            tx.transaksiLangganan.findMany({
              where: { pengguna_id: { in: candidateIds }, status: "PAID" },
              select: { pengguna_id: true },
            }),
          ]);

        const protectedIds = new Set<string>();
        for (const r of otherMemberships) protectedIds.add(r.pengguna_id);
        for (const r of otherGurus) if (r.pengguna_id) protectedIds.add(r.pengguna_id);
        for (const r of otherStudents) if (r.pengguna_id) protectedIds.add(r.pengguna_id);
        for (const r of otherGuardians) if (r.pengguna_id) protectedIds.add(r.pengguna_id);
        for (const r of paidTx) protectedIds.add(r.pengguna_id);

        for (const u of candidateMap.values()) {
          if (u.peran_dasar !== "SUPER_ADMIN" && !protectedIds.has(u.id)) {
            exclusiveUsers.push({ id: u.id, username: u.username, email: u.email });
          }
        }
      }

      // 1. CBT & Kisi-kisi
      await tx.eventIntegritasUjian.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.jawabanSiswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.hasilUjianCbt.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.sesiUjianSiswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.assessmentAttempt.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.examSession.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.snapshotUjian.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.ujianCbt.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.itemKisiKisi.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.kisiKisiAsesmen.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.versiSoal.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.bankSoal.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.folderBankSoal.updateMany({
        where: { sekolah_id: sekolahId },
        data: { parent_id: null },
      });
      await tx.folderBankSoal.deleteMany({ where: { sekolah_id: sekolahId } });

      // 2. Monitoring & Rapor
      const catatanList = await tx.catatanMonitoring.findMany({
        where: { sekolah_id: sekolahId },
        select: { id: true },
      });
      if (catatanList.length > 0) {
        await tx.tindakLanjutMonitoring.deleteMany({
          where: { catatan_id: { in: catatanList.map((c) => c.id) } },
        });
      }
      await tx.catatanMonitoring.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.raporSiswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.riwayatEksporLaporan.deleteMany({ where: { sekolah_id: sekolahId } });

      // 3. Asesmen, Pembelajaran & Presensi
      await tx.publikasiNilaiAsesmen.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.nilaiSiswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.definisiAsesmen.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.presensiSesiKelas.deleteMany({ where: { sekolah_id: sekolahId } });

      const admList = await tx.administrasiPembelajaran.findMany({
        where: { sekolah_id: sekolahId },
        select: { id: true },
      });
      if (admList.length > 0) {
        await tx.administrasiTujuanPembelajaran.deleteMany({
          where: { administrasi_id: { in: admList.map((a) => a.id) } },
        });
      }
      await tx.administrasiPembelajaran.deleteMany({ where: { sekolah_id: sekolahId } });

      await tx.pengumpulanTugas.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.publikasiTugas.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.definisiTugas.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.publikasiMateri.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.materiPembelajaran.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.kriteriaKetercapaianTp.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.tujuanPembelajaran.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.lingkupMateri.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.capaianPembelajaran.deleteMany({ where: { sekolah_id: sekolahId } });

      // 4. Jadwal & Sesi
      await tx.sesiKelasAktual.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.jadwalPelajaran.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.versiJadwal.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.slotWaktu.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.kalenderAkademik.deleteMany({ where: { sekolah_id: sekolahId } });

      // 5. Penugasan & Struktur Organisasi
      await tx.penugasanWaliKelas.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.penugasanMengajar.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.penugasanJabatan.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.jabatan.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.unitOrganisasi.updateMany({
        where: { sekolah_id: sekolahId },
        data: { induk_unit_id: null },
      });
      await tx.unitOrganisasi.deleteMany({ where: { sekolah_id: sekolahId } });

      // 6. Wali, Siswa & Rombel
      await tx.pengajuanWali.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.hubunganWaliSiswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.waliMurid.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.penempatanRombel.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.keikutsertaanSiswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.siswa.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.rombel.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.programKeahlian.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.tingkatKelas.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.fase.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.semester.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.tahunAjaran.deleteMany({ where: { sekolah_id: sekolahId } });

      // 7. Guru & Mapel
      await tx.mataPelajaran.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.guru.deleteMany({ where: { sekolah_id: sekolahId } });

      // 8. Komunikasi, Integrasi, AI & Onboarding
      const pengumumanList = await tx.pengumuman.findMany({
        where: { sekolah_id: sekolahId },
        select: { id: true },
      });
      if (pengumumanList.length > 0) {
        await tx.sasaranPengumuman.deleteMany({
          where: { pengumuman_id: { in: pengumumanList.map((p) => p.id) } },
        });
      }
      await tx.pengumuman.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.notifikasiPengguna.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.permintaanSetupKelasAi.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.preferensiOnboardingGuru.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.logPengirimanIntegrasi.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.endpointWebhook.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.konfigurasiIntegrasi.deleteMany({ where: { sekolah_id: sekolahId } });

      // 9. Konfigurasi, Berkas, Billing, Keanggotaan, Sesi, Audit
      await tx.konfigurasiSistem.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.metadataBerkas.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.transaksiLangganan.deleteMany({
        where: { sekolah_id: sekolahId, status: { not: "PAID" } },
      });
      await tx.transaksiLangganan.updateMany({
        where: { sekolah_id: sekolahId },
        data: { sekolah_id: null },
      });
      await tx.langgananTenant.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.keanggotaanSekolah.deleteMany({ where: { sekolah_id: sekolahId } });
      await tx.sesiPengguna.updateMany({
        where: { sekolah_aktif_id: sekolahId },
        data: { sekolah_aktif_id: null },
      });
      await tx.logAudit.updateMany({
        where: { sekolah_id: sekolahId },
        data: { sekolah_id: null },
      });

      // 10. Hapus akun pengguna eksklusif milik tenant trial ini
      let deletedUsersCount = 0;
      if (exclusiveUsers.length > 0) {
        const exclusiveIds = exclusiveUsers.map((u) => u.id);
        const loginIdentifiers = exclusiveUsers
          .flatMap((u) => [u.username, u.email])
          .filter((v): v is string => Boolean(v));

        await tx.sesiPengguna.deleteMany({ where: { pengguna_id: { in: exclusiveIds } } });
        await tx.identitasProvider.deleteMany({ where: { pengguna_id: { in: exclusiveIds } } });
        await tx.kemampuanStaff.deleteMany({ where: { pengguna_id: { in: exclusiveIds } } });
        await tx.preferensiNotifikasi.deleteMany({ where: { pengguna_id: { in: exclusiveIds } } });
        await tx.notifikasiPengguna.deleteMany({ where: { pengguna_id: { in: exclusiveIds } } });
        await tx.preferensiOnboardingGuru.deleteMany({
          where: { pengguna_id: { in: exclusiveIds } },
        });
        await tx.permintaanSetupKelasAi.deleteMany({
          where: { pengguna_id: { in: exclusiveIds } },
        });
        await tx.tindakLanjutMonitoring.updateMany({
          where: { penanggung_jawab_id: { in: exclusiveIds } },
          data: { penanggung_jawab_id: null },
        });
        await tx.riwayatEksporLaporan.deleteMany({
          where: { dibuat_oleh_id: { in: exclusiveIds } },
        });
        await tx.transaksiLangganan.deleteMany({
          where: { pengguna_id: { in: exclusiveIds }, status: { not: "PAID" } },
        });
        if (loginIdentifiers.length > 0) {
          await tx.logPercobaanLogin.deleteMany({
            where: { identifier: { in: loginIdentifiers } },
          });
        }
        const delU = await tx.pengguna.deleteMany({
          where: { id: { in: exclusiveIds } },
        });
        deletedUsersCount = delU.count;
      }

      // 11. Hapus entitas Sekolah
      await tx.sekolah.delete({
        where: { id: sekolahId },
      });

      return { deletedUsersCount };
    });

    await recordAuditEvent({
      sekolah_id: null,
      aktor_id: input.actorId,
      aktor_role: input.actorRole,
      aksi: "FREEMIUM_TENANT_DELETED",
      tipe_sumber: "SEKOLAH",
      id_sumber: sekolah.id,
      payload_sebelum: {
        nama: sekolah.nama,
        tipe_lisensi: sekolah.tipe_lisensi,
        deletedUsersCount: result.deletedUsersCount,
      },
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

    return {
      deletedSekolahId: sekolah.id,
      nama: sekolah.nama,
      deletedUsersCount: result.deletedUsersCount,
    };
  }

  /**
   * Hapus akun Pengguna non-SUPER_ADMIN jika tidak memiliki histori akademik/transaksi yang memblokir.
   */
  async deletePlatformUser(input: {
    targetUserId: string;
    actorId: string;
    actorRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ deletedUserId: string; username: string; nama_lengkap: string }> {
    assertSuperAdmin(input.actorRole);

    if (input.targetUserId === input.actorId) {
      throw new SchoolDomainError(
        "Anda tidak dapat menghapus akun Super Admin Anda sendiri.",
        "FORBIDDEN",
        403
      );
    }

    const user = await prisma.pengguna.findUnique({
      where: { id: input.targetUserId },
      include: {
        transaksi_langganan: {
          where: { status: "PAID" },
          select: { id: true },
        },
        ekspor_laporan: {
          select: { id: true },
          take: 1,
        },
        guru: {
          select: {
            id: true,
            sekolah_id: true,
            _count: {
              select: {
                penugasan_mengajar: true,
                sesi_kelas_aktual: true,
                materi_dibuat: true,
                tugas_dibuat: true,
                administrasi_pembelajaran: true,
                bank_soal: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new SchoolDomainError("Akun pengguna tidak ditemukan.", "NOT_FOUND", 404);
    }

    if (user.peran_dasar === "SUPER_ADMIN") {
      throw new SchoolDomainError(
        "Akun Super Admin tidak boleh dihapus melalui direktori pengguna.",
        "FORBIDDEN",
        403
      );
    }

    if (user.transaksi_langganan.length > 0) {
      throw new SchoolDomainError(
        "Akun ini memiliki riwayat transaksi pembayaran lunas (PAID) dan tidak dapat dihapus permanen.",
        "USER_HAS_PAID_TRANSACTIONS",
        409
      );
    }

    if (user.ekspor_laporan.length > 0) {
      throw new SchoolDomainError(
        "Akun ini memiliki riwayat ekspor laporan resmi. Hapus melalui tenant trial terkait atau nonaktifkan akun.",
        "USER_HAS_EXPORT_HISTORY",
        409
      );
    }

    const hasTeacherHistory = user.guru
      ? user.guru._count.penugasan_mengajar +
          user.guru._count.sesi_kelas_aktual +
          user.guru._count.materi_dibuat +
          user.guru._count.tugas_dibuat +
          user.guru._count.administrasi_pembelajaran +
          user.guru._count.bank_soal >
        0
      : false;

    if (hasTeacherHistory) {
      throw new SchoolDomainError(
        "Guru ini sudah memiliki histori akademik (kelas, jadwal, materi, atau bank soal). Gunakan Hapus Tenant Trial pada direktori sekolah jika ingin membersihkan seluruh workspace trial-nya.",
        "USER_HAS_ACADEMIC_HISTORY",
        409
      );
    }

    await prisma.$transaction(async (tx) => {
      const loginIdentifiers = [user.username, user.email].filter((v): v is string => Boolean(v));

      await tx.sesiPengguna.deleteMany({ where: { pengguna_id: user.id } });
      await tx.identitasProvider.deleteMany({ where: { pengguna_id: user.id } });
      await tx.kemampuanStaff.deleteMany({ where: { pengguna_id: user.id } });
      await tx.preferensiOnboardingGuru.deleteMany({ where: { pengguna_id: user.id } });
      await tx.preferensiNotifikasi.deleteMany({ where: { pengguna_id: user.id } });
      await tx.notifikasiPengguna.deleteMany({ where: { pengguna_id: user.id } });
      await tx.permintaanSetupKelasAi.deleteMany({ where: { pengguna_id: user.id } });
      await tx.keanggotaanSekolah.deleteMany({ where: { pengguna_id: user.id } });
      await tx.tindakLanjutMonitoring.updateMany({
        where: { penanggung_jawab_id: user.id },
        data: { penanggung_jawab_id: null },
      });
      const authoredNotes = await tx.catatanMonitoring.findMany({
        where: { penulis_id: user.id },
        select: { id: true },
      });
      if (authoredNotes.length > 0) {
        await tx.tindakLanjutMonitoring.deleteMany({
          where: { catatan_id: { in: authoredNotes.map((n) => n.id) } },
        });
      }
      await tx.catatanMonitoring.deleteMany({ where: { penulis_id: user.id } });

      const authoredAnnouncements = await tx.pengumuman.findMany({
        where: { penulis_id: user.id },
        select: { id: true },
      });
      if (authoredAnnouncements.length > 0) {
        await tx.sasaranPengumuman.deleteMany({
          where: { pengumuman_id: { in: authoredAnnouncements.map((p) => p.id) } },
        });
      }
      await tx.pengumuman.deleteMany({ where: { penulis_id: user.id } });
      await tx.transaksiLangganan.deleteMany({
        where: { pengguna_id: user.id, status: { not: "PAID" } },
      });

      if (user.guru) {
        const guruId = user.guru.id;
        await tx.penugasanWaliKelas.deleteMany({ where: { guru_id: guruId } });
        await tx.folderBankSoal.updateMany({
          where: { guru_id: guruId },
          data: { parent_id: null },
        });
        await tx.folderBankSoal.deleteMany({ where: { guru_id: guruId } });
        await tx.guru.delete({ where: { id: guruId } });
      }

      await tx.siswa.updateMany({
        where: { pengguna_id: user.id },
        data: { pengguna_id: null },
      });
      await tx.waliMurid.updateMany({
        where: { pengguna_id: user.id },
        data: { pengguna_id: null },
      });

      if (loginIdentifiers.length > 0) {
        await tx.logPercobaanLogin.deleteMany({
          where: { identifier: { in: loginIdentifiers } },
        });
      }

      await tx.pengguna.delete({ where: { id: user.id } });
    });

    await recordAuditEvent({
      sekolah_id: user.sekolah_id ?? null,
      aktor_id: input.actorId,
      aktor_role: input.actorRole,
      aksi: "PLATFORM_USER_DELETED",
      tipe_sumber: "PENGGUNA",
      id_sumber: user.id,
      payload_sebelum: {
        username: user.username,
        email: user.email,
        nama_lengkap: user.nama_lengkap,
        peran_dasar: user.peran_dasar,
      },
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

    return {
      deletedUserId: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
    };
  }
}

export const platformControlService = new PlatformControlService();
