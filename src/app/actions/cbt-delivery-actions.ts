"use server";

/**
 * Ruang Pintar — M14 CBT Delivery Server Actions
 *
 * Mengakomodasi operasi delivery CBT dengan Server Boundary & Multi-Tenant Isolation ketat:
 * - Publication Engine (9-state transition)
 * - Snapshot Engine (Freeze & SHA-256 integrity check)
 * - Session Engine (Buka/Tutup sesi & jadwal)
 * - Token Engine (Generate, expire, validate ABC123)
 * - Student Eligibility Engine (Multi-faktor validasi)
 * - Attempt Foundation Engine (Init, start, submit)
 */

import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { cbtDeliveryFacade } from "@/modules/cbt/application/cbt-delivery-facade";
import {
  AssessmentPublicationStatus,
  ExamSessionDTO,
  AssessmentAttemptDTO,
  StudentEligibilityResultDTO,
  ExamTokenDTO,
  PublicationTransitionResultDTO,
} from "@/modules/cbt/domain/cbt-types";
import {
  CreateExamSessionSchema,
  TransitionPublicationStatusSchema,
} from "@/modules/cbt/domain/cbt-validation";

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

async function resolveActorContext() {
  const user = await requireAuth();
  const sekolahId = user.sekolah_id;
  if (!sekolahId) throw new Error("Konteks sekolah pengguna tidak ditemukan.");

  let profileId = user.id;
  if (user.peran_dasar === "TEACHER") {
    const guru = await prisma.guru.findFirst({
      where: { pengguna_id: user.id, sekolah_id: sekolahId },
      select: { id: true },
    });
    if (guru) profileId = guru.id;
  } else if (user.peran_dasar === "STUDENT") {
    const siswa = await prisma.siswa.findFirst({
      where: { pengguna_id: user.id, sekolah_id: sekolahId },
      select: { id: true },
    });
    if (siswa) profileId = siswa.id;
  }

  return {
    userId: user.id,
    profileId,
    sekolahId,
    role: user.peran_dasar,
  };
}

// ============================================================================
// 1. PUBLICATION LIFECYCLE ACTIONS
// ============================================================================

export async function transitionPublicationStatusAction(
  ujianId: string,
  targetStatus: AssessmentPublicationStatus,
  alasan?: string | null
): Promise<ActionResponse<PublicationTransitionResultDTO>> {
  try {
    const actor = await resolveActorContext();

    const parsed = TransitionPublicationStatusSchema.safeParse({
      target_status: targetStatus,
      alasan,
    });
    if (!parsed.success) {
      return { success: false, error: "Validasi parameter transisi status gagal." };
    }

    const result = await cbtDeliveryFacade.publication.transitionStatus({
      ujianId,
      targetStatus,
      sekolahId: actor.sekolahId,
      actorId: actor.profileId,
      actorRole: actor.role,
      alasan,
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengubah status publikasi ujian." };
  }
}

// ============================================================================
// 2. SNAPSHOT ENGINE ACTIONS
// ============================================================================

export async function verifySnapshotIntegrityAction(snapshotId: string): Promise<
  ActionResponse<{
    isValid: boolean;
    recordedHash: string | null;
    calculatedHash: string;
    tampered: boolean;
  }>
> {
  try {
    const actor = await resolveActorContext();

    const result = await cbtDeliveryFacade.snapshot.verifySnapshotIntegrity(
      snapshotId,
      actor.sekolahId
    );

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memverifikasi integritas snapshot." };
  }
}

// ============================================================================
// 3. CBT SESSION ACTIONS
// ============================================================================

export async function createExamSessionAction(
  rawInput: unknown
): Promise<ActionResponse<ExamSessionDTO>> {
  try {
    const actor = await resolveActorContext();

    const parsed = CreateExamSessionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validasi sesi ujian gagal.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const created = await cbtDeliveryFacade.session.createSession(
      parsed.data,
      actor.sekolahId,
      actor.profileId,
      actor.role
    );

    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuat sesi ujian." };
  }
}

export async function openExamSessionAction(
  sessionId: string
): Promise<ActionResponse<ExamSessionDTO>> {
  try {
    const actor = await resolveActorContext();

    const opened = await cbtDeliveryFacade.session.openSession(
      sessionId,
      actor.sekolahId,
      actor.profileId,
      actor.role
    );

    return { success: true, data: opened };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuka sesi ujian." };
  }
}

export async function closeExamSessionAction(
  sessionId: string
): Promise<ActionResponse<ExamSessionDTO>> {
  try {
    const actor = await resolveActorContext();

    const closed = await cbtDeliveryFacade.session.closeSession(
      sessionId,
      actor.sekolahId,
      actor.profileId,
      actor.role
    );

    return { success: true, data: closed };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menutup sesi ujian." };
  }
}

export async function getExamSessionsAction(
  ujianId: string
): Promise<ActionResponse<ExamSessionDTO[]>> {
  try {
    const actor = await resolveActorContext();

    const sessions = await cbtDeliveryFacade.session.getSessionsByExam(ujianId, actor.sekolahId);
    return { success: true, data: sessions };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengambil daftar sesi ujian." };
  }
}

// ============================================================================
// 4. EXAM TOKEN ACTIONS (MVP ONLY)
// ============================================================================

export async function generateExamTokenAction(
  sessionId: string,
  expiryMinutes?: number
): Promise<ActionResponse<ExamTokenDTO>> {
  try {
    const actor = await resolveActorContext();

    const token = await cbtDeliveryFacade.token.generateToken({
      sessionId,
      sekolahId: actor.sekolahId,
      actorId: actor.profileId,
      actorRole: actor.role,
      expiryMinutes,
    });

    return { success: true, data: token };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghasilkan token ujian." };
  }
}

export async function expireExamTokenAction(
  sessionId: string
): Promise<ActionResponse<{ expired: boolean }>> {
  try {
    const actor = await resolveActorContext();

    await cbtDeliveryFacade.token.expireToken({
      sessionId,
      sekolahId: actor.sekolahId,
      actorId: actor.profileId,
      actorRole: actor.role,
    });

    return { success: true, data: { expired: true } };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menonaktifkan token ujian." };
  }
}

export async function validateExamTokenAction(
  sessionId: string,
  tokenInput: string
): Promise<ActionResponse<{ isValid: boolean; reason?: string }>> {
  try {
    const actor = await resolveActorContext();

    const result = await cbtDeliveryFacade.token.validateToken({
      sessionId,
      tokenInput,
      sekolahId: actor.sekolahId,
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memvalidasi token ujian." };
  }
}

// ============================================================================
// 5. STUDENT ELIGIBILITY ACTIONS
// ============================================================================

export async function checkStudentEligibilityAction(
  ujianId: string,
  sessionId?: string | null,
  tokenInput?: string | null
): Promise<ActionResponse<StudentEligibilityResultDTO>> {
  try {
    const actor = await resolveActorContext();

    // ID siswa adalah profileId jika siswa
    const siswaId = actor.profileId;

    const result = await cbtDeliveryFacade.eligibility.checkEligibility({
      ujianId,
      siswaId,
      sekolahId: actor.sekolahId,
      sessionId,
      tokenInput,
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memeriksa kelayakan peserta ujian." };
  }
}

// ============================================================================
// 6. ATTEMPT FOUNDATION ACTIONS
// ============================================================================

export async function initStudentAttemptAction(
  ujianId: string,
  sessionId?: string | null,
  tokenInput?: string | null
): Promise<ActionResponse<AssessmentAttemptDTO>> {
  try {
    const actor = await resolveActorContext();

    const attempt = await cbtDeliveryFacade.attempt.initAttempt({
      ujianId,
      siswaId: actor.profileId,
      sekolahId: actor.sekolahId,
      sessionId,
      tokenInput,
      actorId: actor.profileId,
      actorRole: actor.role,
    });

    return { success: true, data: attempt };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menginisiasi attempt ujian." };
  }
}

export async function startStudentAttemptAction(
  attemptId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<ActionResponse<{ attempt: AssessmentAttemptDTO; timeRemainingSeconds: number }>> {
  try {
    const actor = await resolveActorContext();

    const result = await cbtDeliveryFacade.attempt.startAttempt({
      attemptId,
      sekolahId: actor.sekolahId,
      siswaId: actor.profileId,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      data: {
        attempt: result.attempt,
        timeRemainingSeconds: result.timeRemainingSeconds,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memulai pengerjaan ujian." };
  }
}

export async function submitStudentAttemptAction(
  attemptId: string,
  catatan?: string | null
): Promise<ActionResponse<AssessmentAttemptDTO>> {
  try {
    const actor = await resolveActorContext();

    const result = await cbtDeliveryFacade.attempt.submitAttempt({
      attemptId,
      sekolahId: actor.sekolahId,
      siswaId: actor.profileId,
      catatan,
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengumpulkan attempt ujian." };
  }
}
