import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const snapshot = await prisma.snapshotUjian.findFirst({
    where: { ujian_cbt_id: "01M4NNART8APT88SNZRR6C9EG9" },
  });
  if (snapshot) {
    const manifest = JSON.parse(snapshot.manifest_soal);
    const withImages = manifest.filter((m) => m.gambar_url);
    console.log("Full item with image sample:\n", JSON.stringify(withImages[0], null, 2));
  }
}

main().finally(() => prisma.$disconnect());
