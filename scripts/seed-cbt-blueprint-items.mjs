import { PrismaClient } from "@prisma/client";
import { ulid } from "ulidx";

const prisma = new PrismaClient();

async function main() {
  const cbtId = "01M4NNART8APT88SNZRR6C9EG9";
  const defId = "01M4NQF77NQWP70C3RPWRXJJJ2";
  const sekolahId = "01M2XXYD227F9S3H985FH53GMF";

  const ujian = await prisma.ujianCbt.findUnique({
    where: { id: cbtId },
  });

  const kisiKisi = await prisma.kisiKisiAsesmen.findFirst({
    where: { definisi_asesmen_id: defId },
  });

  console.log("Kisi-kisi ID:", kisiKisi?.id);

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

  console.log("Blueprint items count:", blueprintItems.length);

  // Ambil TP yang aktif
  const tp = await prisma.tujuanPembelajaran.findFirst({
    where: {
      lingkup_materi: {
        penugasan_mengajar_id: ujian.penugasan_mengajar_id,
      },
    },
  });

  console.log("Target TP:", tp?.id, tp?.kode, tp?.deskripsi);

  // Hapus item kisi-kisi lama jika ada
  await prisma.itemKisiKisi.deleteMany({
    where: { kisi_kisi_id: kisiKisi.id },
  });

  for (let i = 0; i < blueprintItems.length; i++) {
    const bp = blueprintItems[i];
    const bankSoal = await prisma.bankSoal.findUnique({
      where: { id: bp.bank_soal_id },
      include: { versi_soal: { orderBy: { nomor_versi: "desc" }, take: 1 } },
    });

    const latestVer = bankSoal?.versi_soal?.[0];
    const pertanyaan = latestVer?.pertanyaan || bankSoal?.pertanyaan || "Butir Soal CBT";
    const opsi = latestVer?.opsi_jawaban || bankSoal?.opsi_jawaban;
    const kunci = latestVer?.kunci_jawaban || bankSoal?.kunci_jawaban;

    const kesul = bankSoal?.tingkat_kesulitan || "SEDANG";
    const levelKog = kesul === "MUDAH" ? "L1" : kesul === "SEDANG" ? "L2" : "L3";

    await prisma.itemKisiKisi.create({
      data: {
        id: ulid(),
        sekolah_id: sekolahId,
        kisi_kisi_id: kisiKisi.id,
        tujuan_pembelajaran_id: tp.id,
        nomor_urut: bp.urutan || i + 1,
        indikator_soal: `Peserta didik dapat memahami konsep dasar multimedia, produksi konten digital, dan teknologi informasi secara tepat.`,
        level_kognitif: levelKog,
        bentuk_soal: bankSoal?.jenis_soal || "PILIHAN_GANDA",
        bobot_skor: bp.bobot || 1.0,
        bank_soal_id: bp.bank_soal_id,
        versi_soal_id: latestVer?.id || null,
        snapshot_pertanyaan: pertanyaan,
        snapshot_opsi: opsi ? (typeof opsi === "string" ? opsi : JSON.stringify(opsi)) : null,
        snapshot_kunci: kunci ? (typeof kunci === "string" ? kunci : JSON.stringify(kunci)) : null,
        snapshot_pembahasan: bankSoal?.pembahasan || null,
      },
    });
  }

  // Update total butir soal di kisi-kisi
  await prisma.kisiKisiAsesmen.update({
    where: { id: kisiKisi.id },
    data: { total_butir_soal: blueprintItems.length },
  });

  console.log(`SUKSES: Dibuat ${blueprintItems.length} ItemKisiKisi untuk ${kisiKisi.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
