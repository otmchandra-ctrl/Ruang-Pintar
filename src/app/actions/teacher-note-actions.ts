"use server";

/**
 * Ruang Pintar — Teacher Internal Note Server Actions
 *
 * STAGE UX-04: Catatan Internal Guru untuk Siswa Kelas
 * Catatan bersifat internal dan rahasia (tidak terlihat oleh siswa).
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { generateUlid } from "@/shared/lib/ulid";

export interface CreateTeacherNoteInput {
  penugasan_mengajar_id: string;
  rombel_id: string;
  siswa_id: string;
  judul: string;
  isi: string;
  kategori?: string;
  tingkat_urgensi?: string;
}

export interface TeacherNoteActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export async function createTeacherClassNoteAction(
  input: CreateTeacherNoteInput
): Promise<TeacherNoteActionResult> {
  try {
    const user = await requireAuth();

    if (!user.sekolah_id) {
      return {
        success: false,
        message: "Konteks sekolah tidak valid.",
      };
    }

    if (!input.judul?.trim() || !input.isi?.trim()) {
      return {
        success: false,
        message: "Judul dan isi catatan wajib diisi.",
      };
    }

    // Pastikan siswa berada di rombel dan sekolah yang sama
    const siswaExists = await prisma.penempatanRombel.findFirst({
      where: {
        rombel_id: input.rombel_id,
        sekolah_id: user.sekolah_id,
        keikutsertaan: {
          siswa_id: input.siswa_id,
        },
      },
    });

    if (!siswaExists) {
      return {
        success: false,
        message: "Siswa tidak ditemukan pada kelas/rombel ini.",
      };
    }

    const noteId = generateUlid();

    const note = await prisma.catatanMonitoring.create({
      data: {
        id: noteId,
        sekolah_id: user.sekolah_id,
        rombel_id: input.rombel_id,
        siswa_id: input.siswa_id,
        penulis_id: user.id,
        judul: input.judul.trim(),
        isi: input.isi.trim(),
        kategori: input.kategori || "AKADEMIK",
        tingkat_urgensi: input.tingkat_urgensi || "SEDANG",
        status: "AKTIF",
      },
      include: {
        penulis: {
          select: {
            id: true,
            nama_lengkap: true,
          },
        },
      },
    });

    revalidatePath(`/kelas-saya/${input.penugasan_mengajar_id}`);

    return {
      success: true,
      message: "Catatan internal guru berhasil disimpan.",
      data: {
        id: note.id,
        judul: note.judul,
        isi: note.isi,
        kategori: note.kategori,
        tingkat_urgensi: note.tingkat_urgensi,
        penulis_id: note.penulis_id,
        penulis_nama: note.penulis.nama_lengkap,
        created_at: note.created_at.toISOString(),
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan catatan internal.";
    return {
      success: false,
      message: msg,
      error: msg,
    };
  }
}
