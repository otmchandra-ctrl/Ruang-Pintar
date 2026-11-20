/**
 * Ruang Pintar — M14 CBT: Exam Snapshot Engine
 *
 * Bertanggung jawab membuat dan memvalidasi SnapshotUjian Immutable:
 * - Metadata Ujian
 * - Konfigurasi Ujian
 * - Manifest Soal (Tanpa Kunci Jawaban! Aman untuk didistribusikan ke klien)
 * - Opsi Jawaban
 * - Aturan Penilaian (Rahasia di server boundary)
 * - Hash Integritas Kriptografis SHA-256
 *
 * Invariants & Guarantees:
 * - Snapshot tidak dapat diubah setelah publish (Immutable Guarantee).
 * - Kunci jawaban strictly server boundary only.
 * - Hash integritas mendeteksi modifikasi atau data tampering secara instan.
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import crypto from "crypto";
import { generateUlid } from "@/shared/lib/ulid";
import {
  CbtNotFoundError,
  CbtValidationError,
  CbtSnapshotImmutableError,
} from "../domain/cbt-errors";
import { ManifestItemSoal, KunciPenilaianItem, TipeSoal } from "../domain/cbt-types";

export interface FreezeSnapshotParams {
  ujianId: string;
  sekolahId: string;
  actorId: string;
}

export interface VerifySnapshotResult {
  isValid: boolean;
  snapshotId: string;
  recordedHash: string | null;
  calculatedHash: string;
  tampered: boolean;
  tamperReason?: string;
}

export class ExamSnapshotEngine {
  /**
   * Menghitung hash integritas SHA-256 secara deterministik
   */
  computeIntegrityHash(payload: {
    metadata: Record<string, any>;
    konfigurasi: Record<string, any>;
    manifestSoal: ManifestItemSoal[];
    kunciPenilaian: KunciPenilaianItem[];
  }): string {
    const canonicalString = JSON.stringify({
      metadata: payload.metadata,
      konfigurasi: payload.konfigurasi,
      manifestSoal: payload.manifestSoal,
      kunciPenilaian: payload.kunciPenilaian,
    });

    return crypto.createHash("sha256").update(canonicalString).digest("hex");
  }

  /**
   * Membekukan snapshot ujian menjadi immutable
   */
  async freezeSnapshot(params: FreezeSnapshotParams): Promise<{ id: string; hash: string }> {
    const { ujianId, sekolahId, actorId } = params;

    // 1. Ambil data Ujian lengkap dengan relasi
    const exam = await prisma.ujianCbt.findFirst({
      where: { id: ujianId, sekolah_id: sekolahId },
      include: {
        penugasan_mengajar: {
          include: {
            guru: { select: { id: true, nama_lengkap: true } },
            mata_pelajaran: { select: { id: true, nama: true, kode: true } },
            rombel: { select: { id: true, nama: true } },
          },
        },
        snapshot_ujian: {
          orderBy: { nomor_snapshot: "desc" },
          take: 1,
        },
      },
    });

    if (!exam) {
      throw new CbtNotFoundError("Ujian CBT", ujianId);
    }

    // 2. Jika snapshot sudah ada dan ujian sudah dipublikasi/aktif, tolak mutasi
    if (exam.snapshot_aktif_id && exam.snapshot_ujian.length > 0) {
      const activeSnapshot = exam.snapshot_ujian[0];
      const publishedStatuses = [
        "PUBLISHED",
        "DITERBITKAN",
        "DIPUBLIKASI",
        "ACTIVE",
        "BERLANGSUNG",
        "CLOSED",
        "ARCHIVED",
      ];
      if (publishedStatuses.includes(exam.status.toUpperCase())) {
        throw new CbtSnapshotImmutableError(
          `Ujian '${exam.judul}' telah dipublikasikan dengan Snapshot ID ${activeSnapshot.id}. Snapshot bersifat immutable.`
        );
      }
    }

    // 3. Parse blueprint soal
    let blueprint: any[] = [];
    try {
      blueprint = exam.blueprint ? JSON.parse(exam.blueprint) : [];
    } catch {
      blueprint = [];
    }

    if (!blueprint || blueprint.length === 0) {
      throw new CbtValidationError("Gagal membuat snapshot: Blueprint soal kosong.");
    }

    // 4. Susun manifest soal (tanpa kunci) dan kunci penilaian (rahasia)
    const manifestItems: ManifestItemSoal[] = [];
    const scoringKeys: KunciPenilaianItem[] = [];
    let totalBobot = 0;

    for (let i = 0; i < blueprint.length; i++) {
      const bp = blueprint[i];
      const bankSoal = await prisma.bankSoal.findFirst({
        where: { id: bp.bank_soal_id, sekolah_id: sekolahId },
        include: {
          versi_soal: {
            where: bp.versi_soal_id ? { id: bp.versi_soal_id } : undefined,
            orderBy: { nomor_versi: "desc" },
            take: 1,
          },
        },
      });

      if (!bankSoal || bankSoal.versi_soal.length === 0) {
        throw new CbtValidationError(
          `Butir soal ID '${bp.bank_soal_id}' tidak memiliki versi aktif yang valid.`
        );
      }

      const activeVersion = bankSoal.versi_soal[0];
      const bobotItem = Number(bp.bobot_kustom || bp.bobot || activeVersion.bobot_default || 1.0);
      totalBobot += bobotItem;

      // Opsi jawaban yang aman (isCorrect dibersihkan untuk manifest siswa)
      let parsedOpsi: any[] | null = null;
      if (activeVersion.opsi_jawaban) {
        try {
          const rawOpsi = JSON.parse(activeVersion.opsi_jawaban);
          if (Array.isArray(rawOpsi)) {
            parsedOpsi = rawOpsi.map((o: any, idx: number) => ({
              id: o.id || String.fromCharCode(65 + idx),
              label: o.label || String.fromCharCode(65 + idx),
              teks: o.teks || "",
              urutan: o.urutan !== undefined ? o.urutan : idx + 1,
            }));
          }
        } catch {
          parsedOpsi = null;
        }
      }

      // Kunci jawaban (SECRET - SERVER ONLY)
      let rawKunci: string[] = [];
      if (activeVersion.kunci_jawaban) {
        try {
          const k = JSON.parse(activeVersion.kunci_jawaban);
          rawKunci = Array.isArray(k) ? k : [String(k)];
        } catch {
          rawKunci = [String(activeVersion.kunci_jawaban)];
        }
      }

      // 4a. Manifest Soal untuk Klien
      manifestItems.push({
        nomor_urut: bp.nomor_urut || i + 1,
        soal_id: bankSoal.id,
        versi_soal_id: activeVersion.id,
        tipe_soal: bankSoal.tipe_soal as TipeSoal,
        pertanyaan: activeVersion.pertanyaan,
        gambar_url: activeVersion.gambar_url,
        opsi_jawaban: parsedOpsi,
        bobot: bobotItem,
      });

      // 4b. Kunci Penilaian Rahasia
      scoringKeys.push({
        soal_id: bankSoal.id,
        versi_soal_id: activeVersion.id,
        tipe_soal: bankSoal.tipe_soal as TipeSoal,
        kunci_jawaban: rawKunci,
        bobot: bobotItem,
      });
    }

    // 5. Susun metadata ujian
    const metadata = {
      ujian_id: exam.id,
      judul: exam.judul,
      deskripsi: exam.deskripsi,
      durasi_menit: exam.durasi_menit,
      kkm_kktp: exam.kkm_kktp,
      mata_pelajaran: exam.penugasan_mengajar.mata_pelajaran.nama,
      mata_pelajaran_kode: exam.penugasan_mengajar.mata_pelajaran.kode,
      guru_pengampu: exam.penugasan_mengajar.guru.nama_lengkap,
      rombel: exam.penugasan_mengajar.rombel.nama,
      dibekukan_pada: new Date().toISOString(),
      dibekukan_oleh: actorId,
    };

    // 6. Susun konfigurasi pelaksanaan ujian
    const konfigurasi = {
      acak_soal: exam.acak_soal,
      acak_opsi: exam.acak_opsi,
      gunakan_token: exam.gunakan_token,
      tampilkan_nilai: exam.tampilkan_nilai,
      tampilkan_pembahasan: exam.tampilkan_pembahasan,
      maksimal_attempt: exam.maksimal_attempt,
    };

    // 7. Hitung hash integritas deterministik SHA-256
    const hashIntegritas = this.computeIntegrityHash({
      metadata,
      konfigurasi,
      manifestSoal: manifestItems,
      kunciPenilaian: scoringKeys,
    });

    const snapshotId = generateUlid();
    const nomorSnapshot = (exam.snapshot_ujian[0]?.nomor_snapshot || 0) + 1;

    // 8. Simpan SnapshotUjian ke database
    await prisma.snapshotUjian.create({
      data: {
        id: snapshotId,
        sekolah_id: sekolahId,
        ujian_cbt_id: ujianId,
        nomor_snapshot: nomorSnapshot,
        total_soal: manifestItems.length,
        total_bobot: totalBobot,
        durasi_menit: exam.durasi_menit,
        konfigurasi: JSON.stringify(konfigurasi),
        manifest_soal: JSON.stringify(manifestItems),
        kunci_penilaian: JSON.stringify(scoringKeys),
        metadata_ujian: JSON.stringify(metadata),
        hash_integritas: hashIntegritas,
        dibekukan_oleh: actorId,
      },
    });

    // 9. Kaitkan snapshot_aktif_id ke UjianCbt
    await prisma.ujianCbt.update({
      where: { id: ujianId },
      data: { snapshot_aktif_id: snapshotId },
    });

    return { id: snapshotId, hash: hashIntegritas };
  }

  /**
   * Verifikasi integritas kriptografis snapshot
   */
  async verifySnapshotIntegrity(
    snapshotId: string,
    sekolahId: string
  ): Promise<VerifySnapshotResult> {
    const snapshot = await prisma.snapshotUjian.findFirst({
      where: { id: snapshotId, sekolah_id: sekolahId },
    });

    if (!snapshot) {
      throw new CbtNotFoundError("Snapshot Ujian", snapshotId);
    }

    let metadata: Record<string, any> = {};
    let konfigurasi: Record<string, any> = {};
    let manifestSoal: ManifestItemSoal[] = [];
    let kunciPenilaian: KunciPenilaianItem[] = [];

    try {
      metadata = snapshot.metadata_ujian ? JSON.parse(snapshot.metadata_ujian) : {};
      konfigurasi = snapshot.konfigurasi ? JSON.parse(snapshot.konfigurasi) : {};
      manifestSoal = snapshot.manifest_soal ? JSON.parse(snapshot.manifest_soal) : [];
      kunciPenilaian = snapshot.kunci_penilaian ? JSON.parse(snapshot.kunci_penilaian) : [];
    } catch {
      return {
        isValid: false,
        snapshotId,
        recordedHash: snapshot.hash_integritas,
        calculatedHash: "",
        tampered: true,
        tamperReason: "Gagal mem-parse format JSON data snapshot di database.",
      };
    }

    const calculatedHash = this.computeIntegrityHash({
      metadata,
      konfigurasi,
      manifestSoal,
      kunciPenilaian,
    });

    const isMatch = snapshot.hash_integritas === calculatedHash;

    return {
      isValid: isMatch,
      snapshotId,
      recordedHash: snapshot.hash_integritas,
      calculatedHash,
      tampered: !isMatch,
      tamperReason: isMatch ? undefined : "Hash integritas tidak cocok dengan hash konten aktual.",
    };
  }

  /**
   * Mengambil manifest soal aman untuk siswa (Strictly without answer keys)
   */
  async getStudentManifest(
    snapshotId: string,
    sekolahId: string
  ): Promise<{
    manifest: ManifestItemSoal[];
    konfigurasi: Record<string, any>;
    metadata: Record<string, any>;
  }> {
    const snapshot = await prisma.snapshotUjian.findFirst({
      where: { id: snapshotId, sekolah_id: sekolahId },
    });

    if (!snapshot) {
      throw new CbtNotFoundError("Snapshot Ujian", snapshotId);
    }

    const manifest: ManifestItemSoal[] = JSON.parse(snapshot.manifest_soal);
    const konfigurasi = JSON.parse(snapshot.konfigurasi);
    const metadata = snapshot.metadata_ujian ? JSON.parse(snapshot.metadata_ujian) : {};

    return {
      manifest,
      konfigurasi,
      metadata,
    };
  }
}

export const examSnapshotEngine = new ExamSnapshotEngine();
