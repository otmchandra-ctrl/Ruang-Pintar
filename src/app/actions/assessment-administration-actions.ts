"use server";

/**
 * Ruang Pintar — M13 Assessment Administration Server Actions
 *
 * Mengelola pemanggilan dokumen cetak resmi sekolah (A4 Portrait / Landscape):
 * 1. Kisi-Kisi Asesmen (A4 Landscape)
 * 2. Kartu Soal (A4 Portrait Modular)
 * 3. Naskah Soal Ujian (A4 Portrait 2 Kolom)
 * 4. Kunci Jawaban & Pedoman Penskoran (A4 Portrait Rahasia)
 * 5. Daftar Hadir Peserta Ujian (A4 Portrait)
 * 6. Berita Acara Pelaksanaan Ujian (A4 Portrait)
 *
 * Strict Server Boundaries:
 * - Wajib requireAuth() & requirePermission("cbt.exam.manage" atau peran guru/admin)
 * - Semua payload berasal dari Snapshot data
 * - Menyertakan SHA-256 seal verification
 */

import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { assessmentService } from "@/modules/assessment/application/assessment-service";
import { prisma } from "@/shared/infrastructure/database/prisma";

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

function getSafeErrorMessage(error: any): string {
  if (error?.message) return error.message;
  return "Terjadi kendala pada pemrosesan dokumen administrasi asesmen.";
}

async function resolveTeacherActor(userId: string, role: string, sekolahId: string) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  let guruId: string | null = null;

  if (role === "TEACHER") {
    const guru = await prisma.guru.findFirst({
      where: { sekolah_id: sekolahId, pengguna_id: userId },
    });
    if (guru) guruId = guru.id;
  }

  return { isSuperAdmin, guruId };
}

export async function getKisiKisiDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getKisiKisi(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Kisi-kisi asesmen berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getKartuSoalDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getKartuSoal(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Kartu soal berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getNaskahSoalDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getNaskahSoal(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Naskah soal ujian berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getKunciJawabanDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getKunciJawaban(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Kunci jawaban berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getDaftarHadirDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getDaftarHadir(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Daftar hadir peserta berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getBeritaAcaraDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getBeritaAcara(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Berita acara ujian berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function freezeKisiKisiAction(kisiKisiId: string): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const frozen = await assessmentService.freezeKisiKisi(
      kisiKisiId,
      user.sekolah_id,
      guruId,
      isSuperAdmin,
      user.id
    );

    return {
      success: true,
      message: "Snapshot kisi-kisi dan naskah asesmen berhasil dibekukan secara permanen.",
      data: frozen,
    };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getAnalisisButirSoalDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getAnalisisButirSoal(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Laporan analisis butir soal berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getRekapNilaiAsesmenDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getRekapNilaiAsesmen(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Rekapitulasi nilai asesmen berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getBerkasPengesahanDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getBerkasPengesahan(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Berkas pengesahan asesmen berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}

export async function getCoverPaketDocumentAction(
  definisiAsesmenId: string
): Promise<ActionResult<any>> {
  try {
    const user = await requireAuth();
    if (!user.sekolah_id) return { success: false, message: "Sekolah tidak teridentifikasi." };

    const { isSuperAdmin, guruId } = await resolveTeacherActor(
      user.id,
      user.peran_dasar,
      user.sekolah_id
    );

    const data = await assessmentService.getCoverPaket(
      definisiAsesmenId,
      user.sekolah_id,
      guruId,
      isSuperAdmin
    );

    return { success: true, message: "Halaman sampul paket asesmen berhasil dimuat.", data };
  } catch (err) {
    return { success: false, message: getSafeErrorMessage(err) };
  }
}
