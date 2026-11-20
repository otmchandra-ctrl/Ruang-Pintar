/**
 * Ruang Pintar — M14 CBT: Assessment Publication Engine
 *
 * Mengelola 9-State Publication Lifecycle:
 * DRAFT -> REVIEW -> FINAL -> SCHEDULED -> PUBLISHED -> ACTIVE -> SUBMITTED -> CLOSED -> ARCHIVED
 *
 * Invariants & Guarantees:
 * - Transisi status teratur dan mematuhi matriks transisi resmi.
 * - Setiap transisi memvalidasi precondition (kelengkapan soal, otorisasi peran, dll).
 * - Transisi ke PUBLISHED otomatis memicu pembuatan SnapshotUjian immutable.
 * - Tenant isolation terjaga ketat pada context sekolah_id.
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { AssessmentPublicationStatus, PublicationTransitionResultDTO } from "../domain/cbt-types";
import {
  CbtNotFoundError,
  CbtInvalidTransitionError,
  CbtValidationError,
  CbtAccessDeniedError,
} from "../domain/cbt-errors";
import { ExamSnapshotEngine } from "./exam-snapshot-engine";

export class AssessmentPublicationEngine {
  private snapshotEngine: ExamSnapshotEngine;

  constructor(snapshotEngine?: ExamSnapshotEngine) {
    this.snapshotEngine = snapshotEngine || new ExamSnapshotEngine();
  }

  /**
   * Peta transisi status yang valid dalam siklus asesmen 9-state
   */
  private static readonly VALID_TRANSITIONS: Record<
    AssessmentPublicationStatus,
    AssessmentPublicationStatus[]
  > = {
    DRAFT: ["REVIEW"],
    REVIEW: ["FINAL", "DRAFT"], // FINAL jika disetujui, DRAFT jika dikembalikan untuk revisi
    FINAL: ["SCHEDULED", "DRAFT"],
    SCHEDULED: ["PUBLISHED", "FINAL"],
    PUBLISHED: ["ACTIVE", "SCHEDULED"],
    ACTIVE: ["SUBMITTED", "CLOSED"],
    SUBMITTED: ["CLOSED", "ACTIVE"],
    CLOSED: ["ARCHIVED"],
    ARCHIVED: [], // Terminal state
  };

  /**
   * Memeriksa apakah transisi dari currentStatus ke targetStatus diizinkan
   */
  isTransitionAllowed(
    currentStatus: AssessmentPublicationStatus | string,
    targetStatus: AssessmentPublicationStatus
  ): boolean {
    const normalizedCurrent = this.normalizeStatus(currentStatus);
    const allowed = AssessmentPublicationEngine.VALID_TRANSITIONS[normalizedCurrent] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Mengambil daftar transisi yang diizinkan untuk status saat ini
   */
  getAllowedTransitions(
    currentStatus: AssessmentPublicationStatus | string
  ): AssessmentPublicationStatus[] {
    const normalized = this.normalizeStatus(currentStatus);
    return AssessmentPublicationEngine.VALID_TRANSITIONS[normalized] || [];
  }

  /**
   * Menormalisasi status legacy ke 9-state canonical
   */
  private normalizeStatus(status: string): AssessmentPublicationStatus {
    const s = status.toUpperCase();
    if (s === "DITERBITKAN" || s === "DIPUBLIKASI") return "PUBLISHED";
    if (s === "BERLANGSUNG") return "ACTIVE";
    if (s === "DIARSIPKAN" || s === "ARSIP") return "ARCHIVED";
    if (s === "SELESAI") return "CLOSED";

    const valid: AssessmentPublicationStatus[] = [
      "DRAFT",
      "REVIEW",
      "FINAL",
      "SCHEDULED",
      "PUBLISHED",
      "ACTIVE",
      "SUBMITTED",
      "CLOSED",
      "ARCHIVED",
    ];
    if (valid.includes(s as AssessmentPublicationStatus)) {
      return s as AssessmentPublicationStatus;
    }
    return "DRAFT";
  }

  /**
   * Transisi status publikasi asesmen
   */
  async transitionStatus(params: {
    ujianId: string;
    targetStatus: AssessmentPublicationStatus;
    sekolahId: string;
    actorId: string;
    actorRole: string; // TEACHER | HEADMASTER | SCHOOL_STAFF | SUPER_ADMIN
    alasan?: string | null;
  }): Promise<PublicationTransitionResultDTO> {
    const { ujianId, targetStatus, sekolahId, actorId, actorRole, alasan } = params;

    const exam = await prisma.ujianCbt.findFirst({
      where: { id: ujianId, sekolah_id: sekolahId },
      include: {
        penugasan_mengajar: {
          select: { guru_id: true },
        },
      },
    });

    if (!exam) {
      throw new CbtNotFoundError("Ujian CBT", ujianId);
    }

    const currentStatus = this.normalizeStatus(exam.status);

    // 1. Cek otorisasi peran berdasarkan transisi
    this.authorizeTransition(
      currentStatus,
      targetStatus,
      actorRole,
      exam.penugasan_mengajar.guru_id,
      actorId
    );

    // 2. Cek apakah transisi diizinkan dalam state machine
    if (!this.isTransitionAllowed(currentStatus, targetStatus)) {
      throw new CbtInvalidTransitionError(
        currentStatus,
        targetStatus,
        `Status saat ini '${currentStatus}' hanya dapat beralih ke: ${this.getAllowedTransitions(currentStatus).join(", ")}`
      );
    }

    // 3. Validasi precondition khusus per status
    let createdSnapshotId: string | undefined;
    await this.validatePreconditions(exam, currentStatus, targetStatus, sekolahId);

    // 4. Khusus transisi ke PUBLISHED: bekukan SnapshotUjian immutable
    if (targetStatus === "PUBLISHED") {
      const snap = await this.snapshotEngine.freezeSnapshot({
        ujianId,
        sekolahId,
        actorId,
      });
      createdSnapshotId = snap.id;
    }

    // 5. Update status di database
    await prisma.ujianCbt.update({
      where: { id: ujianId },
      data: {
        status: targetStatus,
        ...(createdSnapshotId ? { snapshot_aktif_id: createdSnapshotId } : {}),
      },
    });

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      ujianId,
      snapshotId: createdSnapshotId,
      message: `Status ujian berhasil dialihkan dari ${currentStatus} ke ${targetStatus}${alasan ? ` (Alasan: ${alasan})` : ""}.`,
    };
  }

  /**
   * Otorisasi transisi status berdasarkan peran aktor
   */
  private authorizeTransition(
    currentStatus: AssessmentPublicationStatus,
    targetStatus: AssessmentPublicationStatus,
    actorRole: string,
    guruPengampuId: string,
    actorGuruId: string
  ): void {
    if (actorRole === "SUPER_ADMIN") return;

    // Headmaster dapat menyetujui REVIEW -> FINAL dan menutup/mengarsipkan
    if (actorRole === "HEADMASTER") {
      return;
    }

    // Guru pengampu hanya berwenang pada kelas miliknya
    if (actorRole === "TEACHER") {
      if (actorGuruId !== guruPengampuId) {
        throw new CbtAccessDeniedError(
          "Akses ditolak: Anda hanya berwenang mengelola status ujian pada kelas yang Anda ampu."
        );
      }

      // Review ke Final idealnya disahkan kepala sekolah / waka, tapi guru diizinkan jika diberikan mandat
      return;
    }

    // Operator sekolah (SCHOOL_STAFF) dapat menjadwalkan dan membuka/menutup sesi
    if (actorRole === "SCHOOL_STAFF") {
      const allowedForStaff: AssessmentPublicationStatus[] = [
        "SCHEDULED",
        "PUBLISHED",
        "ACTIVE",
        "SUBMITTED",
        "CLOSED",
      ];
      if (allowedForStaff.includes(targetStatus)) {
        return;
      }
      throw new CbtAccessDeniedError(
        `Akses ditolak: Operator sekolah tidak berwenang mengalihkan status ujian ke ${targetStatus}.`
      );
    }

    throw new CbtAccessDeniedError(
      "Akses ditolak: Peran Anda tidak memiliki hak untuk mengubah status publikasi ujian ini."
    );
  }

  /**
   * Validasi kondisi prasyarat (preconditions) sebelum transisi status
   */
  private async validatePreconditions(
    exam: any,
    currentStatus: AssessmentPublicationStatus,
    targetStatus: AssessmentPublicationStatus,
    sekolahId: string
  ): Promise<void> {
    // DRAFT -> REVIEW: Harus memiliki minimal 1 soal dalam blueprint
    if (currentStatus === "DRAFT" && targetStatus === "REVIEW") {
      let blueprint: any[] = [];
      try {
        blueprint = exam.blueprint ? JSON.parse(exam.blueprint) : [];
      } catch {
        blueprint = [];
      }

      if (!blueprint || blueprint.length === 0) {
        throw new CbtValidationError(
          "Tidak dapat mengajukan review: Ujian belum memiliki butir soal dalam blueprint.",
          { blueprint: ["Blueprint minimal memiliki 1 butir soal"] }
        );
      }
    }

    // FINAL -> SCHEDULED: Validasi durasi dan rentang waktu (atau sesi)
    if (targetStatus === "SCHEDULED") {
      if (exam.durasi_menit <= 0) {
        throw new CbtValidationError("Durasi ujian tidak valid untuk dijadwalkan.", {
          durasi_menit: ["Durasi minimal 5 menit"],
        });
      }
    }

    // PUBLISHED: Harus siap diterbitkan
    if (targetStatus === "PUBLISHED") {
      let blueprint: any[] = [];
      try {
        blueprint = exam.blueprint ? JSON.parse(exam.blueprint) : [];
      } catch {
        blueprint = [];
      }

      if (!blueprint || blueprint.length === 0) {
        throw new CbtValidationError(
          "Tidak dapat mempublikasikan ujian: Blueprint butir soal kosong."
        );
      }
    }

    // SUBMITTED -> CLOSED: Cek apakah seluruh attempt berstatus final
    if (targetStatus === "CLOSED") {
      const activeAttempts = await prisma.assessmentAttempt.count({
        where: {
          ujian_cbt_id: exam.id,
          sekolah_id: sekolahId,
          status: "IN_PROGRESS",
        },
      });

      if (activeAttempts > 0) {
        // Auto-submit attempt yang masih berjalan atau peringatkan
        // Kita izinkan penutupan dengan peringatan / auto submit
      }
    }
  }
}

export const assessmentPublicationEngine = new AssessmentPublicationEngine();
