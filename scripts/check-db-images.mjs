import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const versis = await prisma.versiSoal.findMany({
    where: {
      gambar_url: { not: null },
    },
    include: { bank_soal: true },
  });

  console.log("=== VERSI SOAL DENGAN GAMBAR ===");
  for (const v of versis) {
    console.log(`- BankSoal ID: ${v.bank_soal_id} (${v.bank_soal.kode}): ${v.gambar_url}`);
  }

  const items = await prisma.itemKisiKisi.findMany({
    where: {
      versi_soal_id: { in: versis.map((v) => v.id) },
    },
  });
  console.log("=== ITEM KISI KISI TERKAIT ===", items.length);

  const snapshots = await prisma.snapshotUjian.findMany();
  console.log("=== SNAPSHOT UJIAN ===", snapshots.length);
  for (const s of snapshots) {
    console.log(`Snapshot ID: ${s.id}, Ujian CBT ID: ${s.ujian_cbt_id}`);
    const manifest = JSON.parse(s.manifest_soal || "[]");
    const withImg = manifest.filter((m) => m.gambar_url);
    console.log(`  Total soal dengan gambar di snapshot: ${withImg.length}`);
  }
}

main().finally(() => prisma.$disconnect());
