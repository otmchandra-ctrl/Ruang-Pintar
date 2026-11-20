/**
 * Ruang Pintar — STAGE CBT-04: CBT Delivery Server Actions Test Suite
 *
 * Menguji seluruh endpoint Server Action delivery CBT:
 * - transitionPublicationStatusAction
 * - verifySnapshotIntegrityAction
 * - createExamSessionAction
 * - openExamSessionAction
 * - closeExamSessionAction
 * - getExamSessionsAction
 * - generateExamTokenAction
 * - expireExamTokenAction
 * - validateExamTokenAction
 * - checkStudentEligibilityAction
 * - initStudentAttemptAction
 * - startStudentAttemptAction
 * - submitStudentAttemptAction
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authGuard from "@/shared/infrastructure/auth/auth-guard";
import { cbtDeliveryFacade } from "@/modules/cbt/application/cbt-delivery-facade";
import {
  transitionPublicationStatusAction,
  verifySnapshotIntegrityAction,
  createExamSessionAction,
  openExamSessionAction,
  closeExamSessionAction,
  getExamSessionsAction,
  generateExamTokenAction,
  expireExamTokenAction,
  validateExamTokenAction,
  checkStudentEligibilityAction,
  initStudentAttemptAction,
  startStudentAttemptAction,
  submitStudentAttemptAction,
} from "@/app/actions/cbt-delivery-actions";

describe("STAGE CBT-04 — CBT Delivery Server Actions", () => {
  const mockUserTeacher = {
    id: "USR_TEACHER_1",
    sekolah_id: "SCH_01JJEXAMPLE",
    username: "guru_ani",
    email: "ani@sekolah.id",
    nama_lengkap: "Ani Wijaya, S.Pd.",
    peran_dasar: "TEACHER",
    status_akun: "AKTIF",
    harus_ganti_password: false,
  };

  const mockUserStudent = {
    id: "USR_STUDENT_1",
    sekolah_id: "SCH_01JJEXAMPLE",
    username: "siswa_budi",
    email: "budi@sekolah.id",
    nama_lengkap: "Budi Siswa",
    peran_dasar: "STUDENT",
    status_akun: "AKTIF",
    harus_ganti_password: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transitionPublicationStatusAction memanggil publication engine dengan actor context", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserTeacher as any);
    vi.spyOn(cbtDeliveryFacade.publication, "transitionStatus").mockResolvedValue({
      success: true,
      previousStatus: "DRAFT",
      newStatus: "REVIEW",
      ujianId: "UJN_1",
      message: "Sukses",
    });

    const res = await transitionPublicationStatusAction("UJN_1", "REVIEW", "Siap direview");
    expect(res.success).toBe(true);
    expect(res.data?.newStatus).toBe("REVIEW");
  });

  it("verifySnapshotIntegrityAction memverifikasi integritas snapshot", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserTeacher as any);
    vi.spyOn(cbtDeliveryFacade.snapshot, "verifySnapshotIntegrity").mockResolvedValue({
      isValid: true,
      snapshotId: "SNAP_1",
      recordedHash: "abc",
      calculatedHash: "abc",
      tampered: false,
    });

    const res = await verifySnapshotIntegrityAction("SNAP_1");
    expect(res.success).toBe(true);
    expect(res.data?.isValid).toBe(true);
  });

  it("createExamSessionAction memvalidasi input dan membuat sesi ujian", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserTeacher as any);
    vi.spyOn(cbtDeliveryFacade.session, "createSession").mockResolvedValue({
      id: "SES_1",
      sekolah_id: "SCH_01JJEXAMPLE",
      ujian_cbt_id: "UJN_1",
      kode_sesi: "SESI-01",
      nama_sesi: "Sesi Pagi",
      waktu_mulai: new Date(),
      waktu_selesai: new Date(),
      token: "ABC123",
      token_aktif: true,
      token_expired_at: null,
      status: "TERJADWAL",
      ruang_ujian: null,
      pengawas_nama: null,
      catatan: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await createExamSessionAction({
      ujian_cbt_id: "UJN_1",
      kode_sesi: "SESI-01",
      nama_sesi: "Sesi Pagi",
      waktu_mulai: "2026-10-08T08:00:00Z",
      waktu_selesai: "2026-10-08T10:00:00Z",
      generate_token: true,
    });

    expect(res.success).toBe(true);
    expect(res.data?.kode_sesi).toBe("SESI-01");
  });

  it("openExamSessionAction dan closeExamSessionAction mengontrol status sesi", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserTeacher as any);
    vi.spyOn(cbtDeliveryFacade.session, "openSession").mockResolvedValue({
      id: "SES_1",
      status: "DIBUKA",
    } as any);

    const openRes = await openExamSessionAction("SES_1");
    expect(openRes.success).toBe(true);
    expect(openRes.data?.status).toBe("DIBUKA");

    vi.spyOn(cbtDeliveryFacade.session, "closeSession").mockResolvedValue({
      id: "SES_1",
      status: "DITUTUP",
    } as any);

    const closeRes = await closeExamSessionAction("SES_1");
    expect(closeRes.success).toBe(true);
    expect(closeRes.data?.status).toBe("DITUTUP");
  });

  it("generateExamTokenAction dan validateExamTokenAction memproses token", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserTeacher as any);
    vi.spyOn(cbtDeliveryFacade.token, "generateToken").mockResolvedValue({
      token: "XYZ789",
      session_id: "SES_1",
      is_active: true,
      expires_at: null,
      generated_at: new Date(),
    });

    const genRes = await generateExamTokenAction("SES_1", 60);
    expect(genRes.success).toBe(true);
    expect(genRes.data?.token).toBe("XYZ789");

    vi.spyOn(cbtDeliveryFacade.token, "validateToken").mockResolvedValue({
      isValid: true,
    });

    const valRes = await validateExamTokenAction("SES_1", "XYZ789");
    expect(valRes.success).toBe(true);
    expect(valRes.data?.isValid).toBe(true);
  });

  it("initStudentAttemptAction dan startStudentAttemptAction mengalirkan attempt lifecycle", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserStudent as any);
    vi.spyOn(cbtDeliveryFacade.attempt, "initAttempt").mockResolvedValue({
      id: "ATT_1",
      status: "NOT_STARTED",
      attempt_ke: 1,
    } as any);

    const initRes = await initStudentAttemptAction("UJN_1", "SES_1", "XYZ789");
    expect(initRes.success).toBe(true);
    expect(initRes.data?.status).toBe("NOT_STARTED");

    vi.spyOn(cbtDeliveryFacade.attempt, "startAttempt").mockResolvedValue({
      attempt: { id: "ATT_1", status: "IN_PROGRESS" } as any,
      manifest: [],
      timeRemainingSeconds: 3600,
    });

    const startRes = await startStudentAttemptAction("ATT_1");
    expect(startRes.success).toBe(true);
    expect(startRes.data?.attempt.status).toBe("IN_PROGRESS");
    expect(startRes.data?.timeRemainingSeconds).toBe(3600);
  });

  it("submitStudentAttemptAction mengumpulkan attempt pengerjaan", async () => {
    vi.spyOn(authGuard, "requireAuth").mockResolvedValue(mockUserStudent as any);
    vi.spyOn(cbtDeliveryFacade.attempt, "submitAttempt").mockResolvedValue({
      id: "ATT_1",
      status: "SUBMITTED",
    } as any);

    const subRes = await submitStudentAttemptAction("ATT_1", "Selesai pengerjaan");
    expect(subRes.success).toBe(true);
    expect(subRes.data?.status).toBe("SUBMITTED");
  });
});
