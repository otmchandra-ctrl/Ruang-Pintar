import { prisma } from "@/shared/infrastructure/database/prisma";
import { generateUlid } from "@/shared/lib/ulid";
import { AssessmentNotFoundError } from "../domain/assessment-errors";

/**
 * Resolves or automatically links a CBT exam to an Assessment Definition & Blueprint.
 * Ensures seamless bridging between M14 (CBT) and M13 (Assessment Administration).
 */
export async function resolveOrCreateAssessmentForCbt(
  targetId: string,
  sekolahId: string
): Promise<string> {
  // 1. Cek apakah targetId adalah DefinisiAsesmen yang valid
  const existingDef = await prisma.definisiAsesmen.findFirst({
    where: { id: targetId, sekolah_id: sekolahId },
    select: { id: true },
  });
  if (existingDef) return existingDef.id;

  // 2. Jika bukan DefinisiAsesmen, cek apakah targetId adalah UjianCbt
  const ujian = await prisma.ujianCbt.findFirst({
    where: { id: targetId, sekolah_id: sekolahId },
    include: {
      penugasan_mengajar: {
        include: {
          mata_pelajaran: true,
          rombel: true,
          lingkup_materi: {
            include: {
              tujuan_pembelajaran: true,
            },
          },
        },
      },
    },
  });

  if (!ujian) {
    throw new AssessmentNotFoundError(
      `Asesmen atau Ujian CBT dengan ID '${targetId}' tidak ditemukan.`
    );
  }

  // Jika ujian sudah tertaut ke asesmen_id yang valid
  if (ujian.asesmen_id) {
    const linkedDef = await prisma.definisiAsesmen.findFirst({
      where: { id: ujian.asesmen_id, sekolah_id: sekolahId },
      select: { id: true },
    });
    if (linkedDef) return linkedDef.id;
  }

  // Jika belum tertaut, buat DefinisiAsesmen dan KisiKisiAsesmen otomatis dari data ujian CBT
  let targetTpId: string | null = null;
  let targetLmId: string | null = null;

  if (ujian.penugasan_mengajar?.lingkup_materi) {
    for (const lm of ujian.penugasan_mengajar.lingkup_materi) {
      if (lm.tujuan_pembelajaran && lm.tujuan_pembelajaran.length > 0) {
        targetLmId = lm.id;
        targetTpId = lm.tujuan_pembelajaran[0].id;
        break;
      }
    }
  }

  if (!targetTpId) {
    const anyTp = await prisma.tujuanPembelajaran.findFirst({
      where: { sekolah_id: sekolahId },
      select: { id: true },
    });
    targetTpId = anyTp?.id || null;
  }

  const defId = generateUlid();
  await prisma.definisiAsesmen.create({
    data: {
      id: defId,
      sekolah_id: sekolahId,
      penugasan_mengajar_id: ujian.penugasan_mengajar_id,
      tp_id: targetTpId,
      lingkup_materi_id: targetLmId,
      judul: ujian.judul,
      deskripsi: `Perangkat Administrasi Asesmen Resmi CBT untuk ${ujian.penugasan_mengajar?.mata_pelajaran?.nama || "Mata Pelajaran"} kelas ${ujian.penugasan_mengajar?.rombel?.nama || ""}`,
      kategori: "SUMATIF",
      teknik_penilaian: "TES_TERTULIS",
      kkm_kktp: ujian.kkm_kktp || 75.0,
      tanggal_pelaksanaan: ujian.waktu_mulai || new Date(),
      status: "PUBLISHED",
    },
  });

  await prisma.ujianCbt.update({
    where: { id: ujian.id },
    data: { asesmen_id: defId },
  });

  // Parse blueprint butir soal
  let blueprintItems: any[] = [];
  try {
    if (typeof ujian.blueprint === "string") {
      blueprintItems = JSON.parse(ujian.blueprint);
    } else if (Array.isArray(ujian.blueprint)) {
      blueprintItems = ujian.blueprint;
    }
  } catch {
    blueprintItems = [];
  }

  // Buat Kisi-Kisi Asesmen
  const kisiKisiId = generateUlid();
  await prisma.kisiKisiAsesmen.create({
    data: {
      id: kisiKisiId,
      sekolah_id: sekolahId,
      definisi_asesmen_id: defId,
      judul: `Kisi-Kisi Asesmen: ${ujian.judul}`,
      tahun_ajaran: "2026/2027",
      semester: "GANJIL",
      alokasi_waktu_menit: ujian.durasi_menit || 90,
      total_butir_soal: blueprintItems.length,
      status: "REVIEW",
    },
  });

  // Buat butir item kisi-kisi dari blueprint bank soal
  if (blueprintItems.length > 0 && targetTpId) {
    for (let i = 0; i < blueprintItems.length; i++) {
      const bp = blueprintItems[i];
      const bankSoal = await prisma.bankSoal.findUnique({
        where: { id: bp.bank_soal_id },
        include: { versi_soal: { orderBy: { nomor_versi: "desc" }, take: 1 } },
      });

      const latestVer = bankSoal?.versi_soal?.[0];
      const pertanyaan = latestVer?.pertanyaan || "Butir Soal CBT";
      const opsi = latestVer?.opsi_jawaban || null;
      const kunci = latestVer?.kunci_jawaban || null;
      const kesul = bankSoal?.tingkat_kesulitan || "SEDANG";
      const levelKog =
        bankSoal?.level_kognitif || (kesul === "MUDAH" ? "L1" : kesul === "SEDANG" ? "L2" : "L3");

      await prisma.itemKisiKisi.create({
        data: {
          id: generateUlid(),
          sekolah_id: sekolahId,
          kisi_kisi_id: kisiKisiId,
          tujuan_pembelajaran_id: targetTpId,
          nomor_urut: bp.urutan || i + 1,
          indikator_soal: `Peserta didik dapat memahami konsep dasar multimedia, produksi konten digital, dan teknologi informasi secara tepat.`,
          level_kognitif: levelKog,
          bentuk_soal: bankSoal?.tipe_soal || "PILIHAN_GANDA",
          bobot_skor: bp.bobot || 1.0,
          bank_soal_id: bp.bank_soal_id,
          versi_soal_id: latestVer?.id || null,
          snapshot_pertanyaan: pertanyaan,
          snapshot_opsi: opsi ? (typeof opsi === "string" ? opsi : JSON.stringify(opsi)) : null,
          snapshot_kunci: kunci
            ? typeof kunci === "string"
              ? kunci
              : JSON.stringify(kunci)
            : null,
          snapshot_pembahasan: latestVer?.pembahasan || null,
        },
      });
    }
  }

  return defId;
}
