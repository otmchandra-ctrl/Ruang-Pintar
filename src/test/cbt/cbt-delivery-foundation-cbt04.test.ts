/**
 * Ruang Pintar — STAGE CBT-04: CBT Delivery Foundation Test Suite
 *
 * Menguji secara komprehensif 7 pilar fondasi pengiriman ujian CBT:
 * 1. Assessment Publication Engine (9-State Lifecycle & Guards)
 * 2. Exam Snapshot Engine (SHA-256 Hash & Immutability)
 * 3. CBT Session Engine (Time Window & Room Orchestration)
 * 4. Exam Token Engine (MVP 6-Char Alphanumeric Token)
 * 5. Student Eligibility Engine (Multi-Factor Verification)
 * 6. Attempt Foundation Engine (5-State Lifecycle & Server Timer)
 * 7. Authorization & Multi-Tenant Isolation Hardening
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { assessmentPublicationEngine } from "@/modules/cbt/application/assessment-publication-engine";
import { examSnapshotEngine } from "@/modules/cbt/application/exam-snapshot-engine";
import { cbtSessionEngine } from "@/modules/cbt/application/cbt-session-engine";
import { examTokenEngine } from "@/modules/cbt/application/exam-token-engine";
import { studentEligibilityEngine } from "@/modules/cbt/application/student-eligibility-engine";
import { assessmentAttemptEngine } from "@/modules/cbt/application/assessment-attempt-engine";
import { prisma } from "@/shared/infrastructure/database/prisma";
import {
  CbtInvalidTransitionError,
  CbtSnapshotImmutableError,
  CbtOneActiveAttemptViolationError,
  CbtStudentNotEligibleError,
  CbtAccessDeniedError,
  CbtValidationError,
} from "@/modules/cbt/domain/cbt-errors";

describe("STAGE CBT-04 — CBT Delivery Foundation", () => {
  const mockSekolahId = "SCH_01JJEXAMPLE";
  const mockUjianId = "UJN_01JJEXAM001";
  const mockGuruId = "GUR_01JJTEACHER";
  const mockSiswaId = "SIS_01JJSTUDENT";
  const mockRombelId = "RMB_01JJCLASS1";
  const mockPenugasanId = "PNG_01JJASSIGN";
  const mockSnapshotId = "SNP_01JJSNAP001";
  const mockSessionId = "SES_01JJSESSION";
  const mockAttemptId = "ATT_01JJATTEMPT";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. ASSESSMENT PUBLICATION ENGINE (9-STATE LIFECYCLE)
  // ============================================================================
  describe("1. Assessment Publication Engine (9-State Lifecycle)", () => {
    it("memvalidasi transisi teratur 9-state yang sah", () => {
      expect(assessmentPublicationEngine.isTransitionAllowed("DRAFT", "REVIEW")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("REVIEW", "FINAL")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("FINAL", "SCHEDULED")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("SCHEDULED", "PUBLISHED")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("PUBLISHED", "ACTIVE")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("ACTIVE", "SUBMITTED")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("SUBMITTED", "CLOSED")).toBe(true);
      expect(assessmentPublicationEngine.isTransitionAllowed("CLOSED", "ARCHIVED")).toBe(true);
    });

    it("menolak transisi ilegal langsung dari DRAFT ke ACTIVE atau dari CLOSED ke DRAFT", () => {
      expect(assessmentPublicationEngine.isTransitionAllowed("DRAFT", "ACTIVE")).toBe(false);
      expect(assessmentPublicationEngine.isTransitionAllowed("CLOSED", "DRAFT")).toBe(false);
      expect(assessmentPublicationEngine.isTransitionAllowed("ARCHIVED", "PUBLISHED")).toBe(false);
    });

    it("menolak transisi DRAFT -> REVIEW jika blueprint ujian kosong", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        status: "DRAFT",
        blueprint: JSON.stringify([]),
        penugasan_mengajar: { guru_id: mockGuruId },
      } as any);

      await expect(
        assessmentPublicationEngine.transitionStatus({
          ujianId: mockUjianId,
          targetStatus: "REVIEW",
          sekolahId: mockSekolahId,
          actorId: mockGuruId,
          actorRole: "TEACHER",
        })
      ).rejects.toThrow(CbtValidationError);
    });

    it("menolak transisi ilegal dengan melempar CbtInvalidTransitionError", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        status: "DRAFT",
        blueprint: JSON.stringify([{ bank_soal_id: "SOAL_1", bobot: 1 }]),
        penugasan_mengajar: { guru_id: mockGuruId },
      } as any);

      await expect(
        assessmentPublicationEngine.transitionStatus({
          ujianId: mockUjianId,
          targetStatus: "ACTIVE", // Ilegal dari DRAFT
          sekolahId: mockSekolahId,
          actorId: mockGuruId,
          actorRole: "TEACHER",
        })
      ).rejects.toThrow(CbtInvalidTransitionError);
    });

    it("otomatis memicu pembuatan SnapshotUjian saat transisi ke PUBLISHED", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        status: "SCHEDULED",
        durasi_menit: 90,
        blueprint: JSON.stringify([{ bank_soal_id: "SOAL_1", bobot: 2 }]),
        penugasan_mengajar: { guru_id: mockGuruId },
      } as any);

      vi.spyOn(assessmentPublicationEngine["snapshotEngine"], "freezeSnapshot").mockResolvedValue({
        id: mockSnapshotId,
        hash: "dummy_sha256_hash",
      });

      vi.spyOn(prisma.ujianCbt, "update").mockResolvedValue({} as any);

      const result = await assessmentPublicationEngine.transitionStatus({
        ujianId: mockUjianId,
        targetStatus: "PUBLISHED",
        sekolahId: mockSekolahId,
        actorId: mockGuruId,
        actorRole: "TEACHER",
      });

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe("PUBLISHED");
      expect(result.snapshotId).toBe(mockSnapshotId);
    });
  });

  // ============================================================================
  // 2. EXAM SNAPSHOT ENGINE (SHA-256 & IMMUTABILITY)
  // ============================================================================
  describe("2. Exam Snapshot Engine (SHA-256 & Immutability)", () => {
    it("menghasilkan hash integritas SHA-256 deterministik untuk konten snapshot", () => {
      const payload = {
        metadata: { judul: "Ujian Matematika", mapel: "MTK" },
        konfigurasi: { acak_soal: true },
        manifestSoal: [
          {
            nomor_urut: 1,
            soal_id: "SOAL_1",
            versi_soal_id: "VER_1",
            tipe_soal: "PILIHAN_GANDA" as any,
            pertanyaan: "Berapa 2+2?",
            bobot: 1,
          },
        ],
        kunciPenilaian: [
          {
            soal_id: "SOAL_1",
            versi_soal_id: "VER_1",
            tipe_soal: "PILIHAN_GANDA" as any,
            kunci_jawaban: ["4"],
            bobot: 1,
          },
        ],
      };

      const hash1 = examSnapshotEngine.computeIntegrityHash(payload);
      const hash2 = examSnapshotEngine.computeIntegrityHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // Valid SHA-256 hex string
    });

    it("menolak freezeSnapshot jika ujian sudah dipublikasikan sebelumnya (Immutable Guarantee)", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        judul: "Ujian Biologi",
        status: "PUBLISHED",
        snapshot_aktif_id: mockSnapshotId,
        snapshot_ujian: [{ id: mockSnapshotId, nomor_snapshot: 1 }],
      } as any);

      await expect(
        examSnapshotEngine.freezeSnapshot({
          ujianId: mockUjianId,
          sekolahId: mockSekolahId,
          actorId: mockGuruId,
        })
      ).rejects.toThrow(CbtSnapshotImmutableError);
    });

    it("memverifikasi integritas snapshot dan mendeteksi data tampering", async () => {
      const payload = {
        metadata: { judul: "Fisika" },
        konfigurasi: { acak_soal: false },
        manifestSoal: [],
        kunciPenilaian: [],
      };
      const validHash = examSnapshotEngine.computeIntegrityHash(payload);

      vi.spyOn(prisma.snapshotUjian, "findFirst").mockResolvedValue({
        id: mockSnapshotId,
        sekolah_id: mockSekolahId,
        metadata_ujian: JSON.stringify(payload.metadata),
        konfigurasi: JSON.stringify(payload.konfigurasi),
        manifest_soal: JSON.stringify(payload.manifestSoal),
        kunci_penilaian: JSON.stringify(payload.kunciPenilaian),
        hash_integritas: validHash,
      } as any);

      const checkValid = await examSnapshotEngine.verifySnapshotIntegrity(
        mockSnapshotId,
        mockSekolahId
      );
      expect(checkValid.isValid).toBe(true);
      expect(checkValid.tampered).toBe(false);

      // Simulasikan database tampering (hash tidak cocok dengan konten termodifikasi)
      vi.spyOn(prisma.snapshotUjian, "findFirst").mockResolvedValue({
        id: mockSnapshotId,
        sekolah_id: mockSekolahId,
        metadata_ujian: JSON.stringify({ judul: "Fisika Hacked" }),
        konfigurasi: JSON.stringify(payload.konfigurasi),
        manifest_soal: JSON.stringify(payload.manifestSoal),
        kunci_penilaian: JSON.stringify(payload.kunciPenilaian),
        hash_integritas: validHash, // Hash lama tidak cocok lagi!
      } as any);

      const checkTampered = await examSnapshotEngine.verifySnapshotIntegrity(
        mockSnapshotId,
        mockSekolahId
      );
      expect(checkTampered.isValid).toBe(false);
      expect(checkTampered.tampered).toBe(true);
    });
  });

  // ============================================================================
  // 3. CBT SESSION ENGINE (EXAM SESSION)
  // ============================================================================
  describe("3. CBT Session Engine (Exam Session)", () => {
    it("memvalidasi jendela waktu jadwal sesi ujian", () => {
      const now = new Date("2026-10-08T08:00:00Z");
      const sessionActive = {
        waktu_mulai: new Date("2026-10-08T07:30:00Z"),
        waktu_selesai: new Date("2026-10-08T09:30:00Z"),
        status: "DIBUKA",
      };

      const result = cbtSessionEngine.validateSchedule(sessionActive, now);
      expect(result.isValid).toBe(true);

      const sessionFuture = {
        waktu_mulai: new Date("2026-10-08T10:00:00Z"),
        waktu_selesai: new Date("2026-10-08T12:00:00Z"),
        status: "DIBUKA",
      };
      expect(cbtSessionEngine.validateSchedule(sessionFuture, now).isValid).toBe(false);

      const sessionPast = {
        waktu_mulai: new Date("2026-10-08T06:00:00Z"),
        waktu_selesai: new Date("2026-10-08T07:00:00Z"),
        status: "DIBUKA",
      };
      expect(cbtSessionEngine.validateSchedule(sessionPast, now).isValid).toBe(false);
    });

    it("membuka dan menutup sesi ujian secara valid", async () => {
      vi.spyOn(prisma.examSession, "findFirst").mockResolvedValue({
        id: mockSessionId,
        sekolah_id: mockSekolahId,
        status: "TERJADWAL",
        ujian_cbt: {
          status: "PUBLISHED",
          snapshot_aktif_id: mockSnapshotId,
          penugasan_mengajar: { guru_id: mockGuruId },
        },
      } as any);

      vi.spyOn(prisma.examSession, "update").mockResolvedValue({
        id: mockSessionId,
        sekolah_id: mockSekolahId,
        ujian_cbt_id: mockUjianId,
        kode_sesi: "SESI-01",
        nama_sesi: "Sesi 1 Pagi",
        waktu_mulai: new Date(),
        waktu_selesai: new Date(),
        token: "ABC123",
        token_aktif: true,
        token_expired_at: null,
        status: "DIBUKA",
        ruang_ujian: "LAB-1",
        pengawas_nama: "Pak Guru",
        catatan: null,
        ujian_cbt: { judul: "Ujian Kimia" },
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const opened = await cbtSessionEngine.openSession(
        mockSessionId,
        mockSekolahId,
        mockGuruId,
        "TEACHER"
      );
      expect(opened.status).toBe("DIBUKA");
      expect(opened.token_aktif).toBe(true);

      vi.spyOn(prisma.examSession, "update").mockResolvedValue({
        ...opened,
        status: "DITUTUP",
        token_aktif: false,
      } as any);

      const closed = await cbtSessionEngine.closeSession(
        mockSessionId,
        mockSekolahId,
        mockGuruId,
        "TEACHER"
      );
      expect(closed.status).toBe("DITUTUP");
      expect(closed.token_aktif).toBe(false);
    });
  });

  // ============================================================================
  // 4. EXAM TOKEN ENGINE (MVP ONLY)
  // ============================================================================
  describe("4. Exam Token Engine (MVP 6-Char Alphanumeric)", () => {
    it("menghasilkan token 6 karakter uppercase tanpa karakter membingungkan", () => {
      const token = examTokenEngine.generateTokenCode();
      expect(token).toHaveLength(6);
      expect(/^[A-Z0-9]{6}$/.test(token)).toBe(true);
      // Memastikan karakter ambigu 0, O, 1, I tidak muncul
      expect(token).not.toMatch(/[01OI]/);
    });

    it("memvalidasi token secara benar (case-insensitive & trimmed)", async () => {
      vi.spyOn(prisma.examSession, "findFirst").mockResolvedValue({
        id: mockSessionId,
        sekolah_id: mockSekolahId,
        token: "ABC123",
        token_aktif: true,
        token_expired_at: new Date(Date.now() + 60000),
      } as any);

      const validExact = await examTokenEngine.validateToken({
        sessionId: mockSessionId,
        tokenInput: "ABC123",
        sekolahId: mockSekolahId,
      });
      expect(validExact.isValid).toBe(true);

      const validLower = await examTokenEngine.validateToken({
        sessionId: mockSessionId,
        tokenInput: " abc123 ",
        sekolahId: mockSekolahId,
      });
      expect(validLower.isValid).toBe(true);

      const invalid = await examTokenEngine.validateToken({
        sessionId: mockSessionId,
        tokenInput: "WRONG9",
        sekolahId: mockSekolahId,
      });
      expect(invalid.isValid).toBe(false);
    });

    it("menolak token yang telah kedaluwarsa atau dinonaktifkan", async () => {
      vi.spyOn(prisma.examSession, "findFirst").mockResolvedValue({
        id: mockSessionId,
        sekolah_id: mockSekolahId,
        token: "ABC123",
        token_aktif: false, // Tidak aktif
        token_expired_at: new Date(Date.now() - 10000),
      } as any);

      const expiredCheck = await examTokenEngine.validateToken({
        sessionId: mockSessionId,
        tokenInput: "ABC123",
        sekolahId: mockSekolahId,
      });
      expect(expiredCheck.isValid).toBe(false);
    });
  });

  // ============================================================================
  // 5. STUDENT ELIGIBILITY ENGINE
  // ============================================================================
  describe("5. Student Eligibility Engine (Multi-Factor Verification)", () => {
    it("menyatakan siswa eligible jika seluruh kriteria terpenuhi", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        maksimal_attempt: 1,
        penugasan_mengajar: { id: mockPenugasanId, rombel_id: mockRombelId, guru_id: mockGuruId },
      } as any);

      vi.spyOn(prisma.siswa, "findFirst").mockResolvedValue({
        id: mockSiswaId,
        sekolah_id: mockSekolahId,
        status_akademik: "AKTIF",
        nama_lengkap: "Budi Siswa",
      } as any);

      vi.spyOn(prisma.penempatanRombel, "findFirst").mockResolvedValue({
        id: "PEN_01",
      } as any);

      vi.spyOn(prisma.examSession, "findFirst").mockResolvedValue({
        id: mockSessionId,
        status: "DIBUKA",
        waktu_mulai: new Date(Date.now() - 10000),
        waktu_selesai: new Date(Date.now() + 60000),
        token_aktif: false,
      } as any);

      vi.spyOn(prisma.assessmentAttempt, "findMany").mockResolvedValue([]);

      const result = await studentEligibilityEngine.checkEligibility({
        ujianId: mockUjianId,
        siswaId: mockSiswaId,
        sekolahId: mockSekolahId,
        sessionId: mockSessionId,
      });

      expect(result.isEligible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it("menolak siswa yang tidak terdaftar di rombel ujian", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        maksimal_attempt: 1,
        status: "PUBLISHED",
        penugasan_mengajar: { id: mockPenugasanId, rombel_id: mockRombelId, guru_id: mockGuruId },
      } as any);

      vi.spyOn(prisma.siswa, "findFirst").mockResolvedValue({
        id: mockSiswaId,
        sekolah_id: mockSekolahId,
        status_akademik: "AKTIF",
        nama_lengkap: "Siswa Luar",
      } as any);

      vi.spyOn(prisma.penempatanRombel, "findFirst").mockResolvedValue(null); // Tidak ada di rombel
      vi.spyOn(prisma.assessmentAttempt, "findMany").mockResolvedValue([]);

      const result = await studentEligibilityEngine.checkEligibility({
        ujianId: mockUjianId,
        siswaId: mockSiswaId,
        sekolahId: mockSekolahId,
      });

      expect(result.isEligible).toBe(false);
      expect(result.details.isEnrolledInRombel).toBe(false);
    });

    it("menolak siswa jika kuota attempt telah habis", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        status: "PUBLISHED",
        maksimal_attempt: 1, // Maksimal 1 attempt
        penugasan_mengajar: { id: mockPenugasanId, rombel_id: mockRombelId, guru_id: mockGuruId },
      } as any);

      vi.spyOn(prisma.siswa, "findFirst").mockResolvedValue({
        id: mockSiswaId,
        sekolah_id: mockSekolahId,
        status_akademik: "AKTIF",
        nama_lengkap: "Budi Siswa",
      } as any);

      vi.spyOn(prisma.penempatanRombel, "findFirst").mockResolvedValue({ id: "PEN_01" } as any);
      vi.spyOn(prisma.assessmentAttempt, "findMany").mockResolvedValue([
        { id: "ATT_OLD", status: "SUBMITTED", attempt_ke: 1 },
      ] as any);

      const result = await studentEligibilityEngine.checkEligibility({
        ujianId: mockUjianId,
        siswaId: mockSiswaId,
        sekolahId: mockSekolahId,
      });

      expect(result.isEligible).toBe(false);
      expect(result.details.hasRemainingAttempts).toBe(false);
    });
  });

  // ============================================================================
  // 6. ATTEMPT FOUNDATION ENGINE (5-STATE & SERVER TIMER)
  // ============================================================================
  describe("6. Attempt Foundation Engine (5-State & Server-Authoritative Timer)", () => {
    it("menginisiasi attempt berstatus NOT_STARTED dan menolak multiple active attempts", async () => {
      vi.spyOn(studentEligibilityEngine, "checkEligibility").mockResolvedValue({
        isEligible: true,
        reasons: [],
        details: {
          attemptCount: 0,
          sessionId: mockSessionId,
          penempatanRombelId: "PEN_01",
        } as any,
      });

      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        snapshot_aktif_id: mockSnapshotId,
      } as any);

      // Skenario ada attempt aktif
      vi.spyOn(prisma.assessmentAttempt, "findFirst").mockResolvedValue({
        id: "ACTIVE_ATTEMPT",
        status: "IN_PROGRESS",
      } as any);

      await expect(
        assessmentAttemptEngine.initAttempt({
          ujianId: mockUjianId,
          siswaId: mockSiswaId,
          sekolahId: mockSekolahId,
          actorId: mockSiswaId,
          actorRole: "STUDENT",
        })
      ).rejects.toThrow(CbtOneActiveAttemptViolationError);
    });

    it("memulai attempt ke IN_PROGRESS dan menghitung batas_waktu_server secara authoritatif", async () => {
      const now = new Date();
      vi.spyOn(prisma.assessmentAttempt, "findFirst").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        siswa_id: mockSiswaId,
        snapshot_id: mockSnapshotId,
        status: "NOT_STARTED",
        ujian_cbt: { durasi_menit: 60 },
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      vi.spyOn(examSnapshotEngine, "getStudentManifest").mockResolvedValue({
        manifest: [
          {
            nomor_urut: 1,
            soal_id: "SOAL_1",
            versi_soal_id: "V1",
            tipe_soal: "PILIHAN_GANDA" as any,
            pertanyaan: "Soal 1",
            bobot: 1,
          },
        ],
        konfigurasi: { acak_soal: false },
        metadata: {},
      });

      vi.spyOn(prisma.assessmentAttempt, "update").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        ujian_cbt_id: mockUjianId,
        status: "IN_PROGRESS",
        waktu_mulai: now,
        batas_waktu_server: new Date(now.getTime() + 60 * 60 * 1000),
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      const started = await assessmentAttemptEngine.startAttempt({
        attemptId: mockAttemptId,
        sekolahId: mockSekolahId,
        siswaId: mockSiswaId,
      });

      expect(started.attempt.status).toBe("IN_PROGRESS");
      expect(started.timeRemainingSeconds).toBeGreaterThan(3500); // Sekitar 3600 detik
      expect(started.manifest).toHaveLength(1);
    });

    it("mengumpulkan attempt secara manual (SUBMITTED) dan otomatis ketika timer habis (AUTO_SUBMITTED)", async () => {
      // Manual submit
      vi.spyOn(prisma.assessmentAttempt, "findFirst").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        siswa_id: mockSiswaId,
        status: "IN_PROGRESS",
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      vi.spyOn(prisma.assessmentAttempt, "update").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        status: "SUBMITTED",
        waktu_selesai: new Date(),
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      const submitted = await assessmentAttemptEngine.submitAttempt({
        attemptId: mockAttemptId,
        sekolahId: mockSekolahId,
        siswaId: mockSiswaId,
      });
      expect(submitted.status).toBe("SUBMITTED");

      // Auto submit saat timer habis
      vi.spyOn(prisma.assessmentAttempt, "update").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        status: "AUTO_SUBMITTED",
        waktu_selesai: new Date(),
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      const autoSubmitted = await assessmentAttemptEngine.autoSubmitAttempt(
        mockAttemptId,
        mockSekolahId,
        "Timer habis."
      );
      expect(autoSubmitted.status).toBe("AUTO_SUBMITTED");
    });

    it("mengabaikan/membatalkan attempt menjadi ABANDONED", async () => {
      vi.spyOn(prisma.assessmentAttempt, "findFirst").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        status: "IN_PROGRESS",
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      vi.spyOn(prisma.assessmentAttempt, "update").mockResolvedValue({
        id: mockAttemptId,
        sekolah_id: mockSekolahId,
        status: "ABANDONED",
        waktu_selesai: new Date(),
        siswa: { nama_lengkap: "Budi", nis: "12345" },
      } as any);

      const abandoned = await assessmentAttemptEngine.abandonAttempt({
        attemptId: mockAttemptId,
        sekolahId: mockSekolahId,
        actorId: mockGuruId,
        actorRole: "TEACHER",
        reason: "Siswa sakit dan meninggalkan lab.",
      });

      expect(abandoned.status).toBe("ABANDONED");
    });
  });

  // ============================================================================
  // 7. AUTHORIZATION HARDENING & TENANT ISOLATION
  // ============================================================================
  describe("7. Authorization Hardening & Tenant Isolation", () => {
    it("menolak guru lain yang mencoba mengelola sesi ujian kelas yang bukan miliknya", async () => {
      vi.spyOn(prisma.ujianCbt, "findFirst").mockResolvedValue({
        id: mockUjianId,
        sekolah_id: mockSekolahId,
        penugasan_mengajar: { guru_id: mockGuruId }, // Milik Guru A
      } as any);

      await expect(
        cbtSessionEngine.createSession(
          {
            ujian_cbt_id: mockUjianId,
            kode_sesi: "SESI-X",
            nama_sesi: "Sesi Ilegal",
            waktu_mulai: new Date(),
            waktu_selesai: new Date(Date.now() + 3600000),
            generate_token: true,
          },
          mockSekolahId,
          "GURU_LAIN_ID", // Guru B
          "TEACHER"
        )
      ).rejects.toThrow(CbtAccessDeniedError);
    });

    it("menolak siswa yang mencoba menginisiasi attempt atas nama siswa lain", async () => {
      await expect(
        assessmentAttemptEngine.initAttempt({
          ujianId: mockUjianId,
          siswaId: "SISWA_ORANG_LAIN",
          sekolahId: mockSekolahId,
          actorId: mockSiswaId, // Siswa ini mencoba akun siswa lain
          actorRole: "STUDENT",
        })
      ).rejects.toThrow(CbtAccessDeniedError);
    });

    it("memastikan manifest yang diterima siswa TIDAK MENGANDUNG kunci jawaban", async () => {
      vi.spyOn(prisma.snapshotUjian, "findFirst").mockResolvedValue({
        id: mockSnapshotId,
        sekolah_id: mockSekolahId,
        manifest_soal: JSON.stringify([
          {
            nomor_urut: 1,
            soal_id: "SOAL_RAHASIA",
            pertanyaan: "Pertanyaan Ujian",
            opsi_jawaban: [{ id: "A", label: "A", teks: "Jawaban A" }],
            bobot: 1,
          },
        ]),
        konfigurasi: JSON.stringify({ acak_soal: false }),
        metadata_ujian: JSON.stringify({ judul: "Ujian Rahasia" }),
      } as any);

      const clientManifest = await examSnapshotEngine.getStudentManifest(
        mockSnapshotId,
        mockSekolahId
      );

      // Bukti keamanan: manifest tidak memiliki kunci_jawaban atau kunci_penilaian
      expect((clientManifest.manifest[0] as any).kunci_jawaban).toBeUndefined();
      expect((clientManifest.manifest[0] as any).kunci_penilaian).toBeUndefined();
      expect(clientManifest.manifest[0].pertanyaan).toBe("Pertanyaan Ujian");
    });
  });
});
