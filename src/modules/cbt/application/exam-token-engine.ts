/**
 * Ruang Pintar — M14 CBT: Exam Token Engine (MVP ONLY)
 *
 * Bertanggung jawab mengelola token masuk ujian CBT sederhana:
 * - Format token 6-karakter: ABC123 (Uppercase Alphanumeric)
 * - Fungsi: generate, regenerate, expire, validate
 *
 * Batasan Mutlak:
 * - DILARANG mengimplementasikan rolling token / dynamic token switching.
 * - Sederhana, deterministik, dan aman.
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import crypto from "crypto";
import { CbtNotFoundError, CbtInvalidTokenError, CbtAccessDeniedError } from "../domain/cbt-errors";
import { ExamTokenDTO } from "../domain/cbt-types";

// Karakter tanpa huruf/angka ambigu (menghindari I, O, 0, 1)
const TOKEN_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class ExamTokenEngine {
  /**
   * Menghasilkan string acak token 6 karakter (misal: "ABC123")
   */
  generateTokenCode(): string {
    const bytes = crypto.randomBytes(6);
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += TOKEN_CHARSET[bytes[i] % TOKEN_CHARSET.length];
    }
    return result;
  }

  /**
   * Men-generate token untuk suatu sesi ujian
   */
  async generateToken(params: {
    sessionId: string;
    sekolahId: string;
    actorId: string;
    actorRole: string;
    expiryMinutes?: number;
  }): Promise<ExamTokenDTO> {
    const { sessionId, sekolahId, actorId, actorRole, expiryMinutes = 120 } = params;

    const session = await prisma.examSession.findFirst({
      where: { id: sessionId, sekolah_id: sekolahId },
      include: {
        ujian_cbt: {
          include: { penugasan_mengajar: { select: { guru_id: true } } },
        },
      },
    });

    if (!session) {
      throw new CbtNotFoundError("Sesi Ujian", sessionId);
    }

    // Role Guard: Guru pengampu, Operator, atau Super Admin
    if (actorRole === "TEACHER" && session.ujian_cbt.penugasan_mengajar.guru_id !== actorId) {
      throw new CbtAccessDeniedError(
        "Akses ditolak: Anda tidak memiliki wewenang mengelola token sesi ujian ini."
      );
    }

    const token = this.generateTokenCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        token,
        token_aktif: true,
        token_expired_at: expiresAt,
      },
    });

    return {
      token: updated.token!,
      session_id: updated.id,
      is_active: updated.token_aktif,
      expires_at: updated.token_expired_at,
      generated_at: new Date(),
    };
  }

  /**
   * Me-regenerate token baru (menggantikan token lama)
   */
  async regenerateToken(params: {
    sessionId: string;
    sekolahId: string;
    actorId: string;
    actorRole: string;
    expiryMinutes?: number;
  }): Promise<ExamTokenDTO> {
    // Regenerate adalah generate dengan token baru
    return this.generateToken(params);
  }

  /**
   * Meng-expire token secara manual (token dinonaktifkan seketika)
   */
  async expireToken(params: {
    sessionId: string;
    sekolahId: string;
    actorId: string;
    actorRole: string;
  }): Promise<void> {
    const { sessionId, sekolahId, actorId, actorRole } = params;

    const session = await prisma.examSession.findFirst({
      where: { id: sessionId, sekolah_id: sekolahId },
      include: {
        ujian_cbt: {
          include: { penugasan_mengajar: { select: { guru_id: true } } },
        },
      },
    });

    if (!session) {
      throw new CbtNotFoundError("Sesi Ujian", sessionId);
    }

    if (actorRole === "TEACHER" && session.ujian_cbt.penugasan_mengajar.guru_id !== actorId) {
      throw new CbtAccessDeniedError("Akses ditolak: Anda tidak berwenang meng-expire token ini.");
    }

    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        token_aktif: false,
        token_expired_at: new Date(),
      },
    });
  }

  /**
   * Memvalidasi token masuk yang dimasukkan siswa
   */
  async validateToken(params: {
    sessionId: string;
    tokenInput: string;
    sekolahId: string;
  }): Promise<{ isValid: boolean; reason?: string }> {
    const { sessionId, tokenInput, sekolahId } = params;

    const session = await prisma.examSession.findFirst({
      where: { id: sessionId, sekolah_id: sekolahId },
    });

    if (!session) {
      return { isValid: false, reason: "Sesi ujian tidak ditemukan." };
    }

    if (!session.token || !session.token_aktif) {
      return { isValid: false, reason: "Token untuk sesi ujian ini tidak aktif." };
    }

    // Validasi masa berlaku token
    if (session.token_expired_at && new Date() > session.token_expired_at) {
      return {
        isValid: false,
        reason: "Token ujian telah kedaluwarsa. Minta token baru ke pengawas.",
      };
    }

    // Perbandingan case-insensitive dan trimmed
    const cleanExpected = session.token.trim().toUpperCase();
    const cleanActual = tokenInput.trim().toUpperCase();

    if (cleanExpected !== cleanActual) {
      return { isValid: false, reason: "Token ujian yang Anda masukkan salah." };
    }

    return { isValid: true };
  }
}

export const examTokenEngine = new ExamTokenEngine();
