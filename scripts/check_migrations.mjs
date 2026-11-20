import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const kisiCols = await prisma.$queryRawUnsafe("PRAGMA table_info(kisi_kisi_asesmen)");
  console.log(
    "kisi_kisi_asesmen cols:",
    kisiCols.map((c) => c.name)
  );

  const snapshotCols = await prisma.$queryRawUnsafe("PRAGMA table_info(snapshot_ujian)");
  console.log(
    "snapshot_ujian cols:",
    snapshotCols.map((c) => c.name)
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
