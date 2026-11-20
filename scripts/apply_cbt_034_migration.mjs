import { PrismaClient } from "@prisma/client";

async function applyToDb(dbUrl) {
  console.log(`Applying CBT-03.4 Single Device Lock migrations to: ${dbUrl}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  // 1. Add token_sesi_aktif to sesi_ujian_siswa if not exists
  const sesiCols = await prisma.$queryRawUnsafe("PRAGMA table_info(sesi_ujian_siswa)");
  const sesiColNames = sesiCols.map((c) => c.name);

  if (!sesiColNames.includes("token_sesi_aktif")) {
    console.log("Adding token_sesi_aktif column to sesi_ujian_siswa...");
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "sesi_ujian_siswa" ADD COLUMN "token_sesi_aktif" TEXT'
    );
  }

  // 2. Add token_sesi_aktif to assessment_attempt if not exists
  const attemptCols = await prisma.$queryRawUnsafe("PRAGMA table_info(assessment_attempt)");
  const attemptColNames = attemptCols.map((c) => c.name);

  if (!attemptColNames.includes("token_sesi_aktif")) {
    console.log("Adding token_sesi_aktif column to assessment_attempt...");
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "assessment_attempt" ADD COLUMN "token_sesi_aktif" TEXT'
    );
  }

  await prisma.$disconnect();
  console.log(`CBT-03.4 migration successfully applied to ${dbUrl}!`);
}

async function main() {
  await applyToDb("file:./data/ruang-pintar.db");
  await applyToDb("file:./data/ruang-pintar-test.db");
}

main().catch(console.error);
