import { PrismaClient } from "@prisma/client";
import { ulid } from "ulidx";

const prisma = new PrismaClient();

async function resolveOrCreateAssessmentForCbt(cbtId, sekolahId) {
  // 1. Cek apakah ada Ujian CBT dengan ID ini
  const ujian = await prisma.ujianCbt.findFirst({
    where: { id: cbtId, sekolah_id: sekolahId },
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

  if (!ujian) return null;

  // Jika sudah memiliki asesmen_id dan definisi_asesmen ada
  if (ujian.asesmen_id) {
    const existing = await prisma.definisiAsesmen.findFirst({
      where: { id: ujian.asesmen_id, sekolah_id: sekolahId },
    });
    if (existing) return existing.id;
  }

  console.log(`Mengaitkan Ujian CBT '${ujian.judul}' ke Definisi Asesmen...`);

  // Cari TP dan Lingkup Materi yang relevan dari penugasan mengajar
  let targetTpId = null;
  let targetLmId = null;

  if (ujian.penugasan_mengajar?.lingkup_materi) {
    for (const lm of ujian.penugasan_mengajar.lingkup_materi) {
      if (lm.tujuan_pembelajaran && lm.tujuan_pembelajaran.length > 0) {
        targetLmId = lm.id;
        targetTpId = lm.tujuan_pembelajaran[0].id;
        break;
      }
    }
  }

  // Jika belum ada TP di penugasan, fallback ke TP pertama di sekolah untuk mapel ini
  if (!targetTpId) {
    const anyTp = await prisma.tujuanPembelajaran.findFirst({
      where: { sekolah_id: sekolahId },
    });
    targetTpId = anyTp?.id || null;
  }

  const defId = ulid();
  const defAsesmen = await prisma.definisiAsesmen.create({
    data: {
      id: defId,
      sekolah_id: sekolahId,
      penugasan_mengajar_id: ujian.penugasan_mengajar_id,
      tp_id: targetTpId,
      lingkup_materi_id: targetLmId,
      judul: ujian.judul,
      deskripsi: `Administrasi Perangkat Asesmen Terintegrasi CBT untuk ${ujian.penugasan_mengajar?.mata_pelajaran?.nama || "Mata Pelajaran"} kelas ${ujian.penugasan_mengajar?.rombel?.nama || ""}`,
      kategori: "SUMATIF",
      teknik_penilaian: "TES_TERTULIS",
      kkm_kktp: ujian.kkm_kktp || 75.0,
      tanggal_pelaksanaan: ujian.waktu_mulai || new Date(),
      status: "PUBLISHED",
    },
  });

  // Hubungkan Ujian CBT ke Definisi Asesmen
  await prisma.ujianCbt.update({
    where: { id: ujian.id },
    data: { asesmen_id: defId },
  });

  // Parse blueprint butir soal
  let blueprintItems = [];
  try {
    if (typeof ujian.blueprint === "string") {
      blueprintItems = JSON.parse(ujian.blueprint);
    } else if (Array.isArray(ujian.blueprint)) {
      blueprintItems = ujian.blueprint;
    }
  } catch (err) {
    console.error("Gagal parse blueprint:", err);
  }

  // Buat Kisi-Kisi Asesmen
  const kisiKisiId = ulid();
  const kisiKisi = await prisma.kisiKisiAsesmen.create({
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

  // Buat Item Kisi-Kisi dari blueprint bank soal
  if (blueprintItems.length > 0 && targetTpId) {
    for (let i = 0; i < blueprintItems.length; i++) {
      const bp = blueprintItems[i];
      const bankSoal = await prisma.bankSoal.findUnique({
        where: { id: bp.bank_soal_id },
        include: { versi_soal: { orderBy: { versi: "desc" }, take: 1 } },
      });

      const latestVer = bankSoal?.versi_soal?.[0];
      const pertanyaan = latestVer?.pertanyaan || bankSoal?.pertanyaan || "Butir Soal CBT";
      const opsi = latestVer?.opsi || bankSoal?.opsi;
      const kunci = latestVer?.kunci_jawaban || bankSoal?.kunci_jawaban;

      const kesul = bankSoal?.tingkat_kesulitan || "SEDANG";
      const levelKog = kesul === "MUDAH" ? "L1" : kesul === "SEDANG" ? "L2" : "L3";

      await prisma.itemKisiKisi.create({
        data: {
          id: ulid(),
          sekolah_id: sekolahId,
          kisi_kisi_id: kisiKisiId,
          tujuan_pembelajaran_id: targetTpId,
          nomor_urut: bp.urutan || i + 1,
          indikator_soal: `Disajikan butir evaluasi, peserta didik dapat menganalisis dan menyelesaikan soal terkait konten multimedia digital dengan tepat.`,
          level_kognitif: levelKog,
          bentuk_soal: bankSoal?.jenis_soal || "PILIHAN_GANDA",
          bobot_skor: bp.bobot || 1.0,
          bank_soal_id: bp.bank_soal_id,
          versi_soal_id: latestVer?.id || null,
          snapshot_pertanyaan: pertanyaan,
          snapshot_opsi: opsi ? JSON.stringify(opsi) : null,
          snapshot_kunci: kunci ? JSON.stringify(kunci) : null,
          snapshot_pembahasan: bankSoal?.pembahasan || null,
        },
      });
    }
  }

  console.log(
    `Berhasil membuat Definisi Asesmen (${defId}) dan Kisi-Kisi (${kisiKisiId}) dengan ${blueprintItems.length} butir soal!`
  );
  return defId;
}

async function main() {
  const cbtId = "01M4NNART8APT88SNZRR6C9EG9";
  const sekolahId = "01M2XXYD227F9S3H985FH53GMF";
  const resolvedId = await resolveOrCreateAssessmentForCbt(cbtId, sekolahId);
  console.log("RESOLVED DEFINISI ASESMEN ID:", resolvedId);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
