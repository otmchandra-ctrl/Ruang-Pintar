import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus KKA-SOAL-001 dan KKA-SOAL-002...");

  // Hapus versi soal terkait
  await prisma.versiSoal.deleteMany({
    where: {
      bank_soal: {
        kode: { in: ["KKA-SOAL-001", "KKA-SOAL-002"] },
      },
    },
  });

  // Hapus bank soal
  const deleted = await prisma.bankSoal.deleteMany({
    where: {
      kode: { in: ["KKA-SOAL-001", "KKA-SOAL-002"] },
    },
  });

  console.log(`Berhasil menghapus ${deleted.count} butir bank soal contoh.`);

  const sisa = await prisma.bankSoal.findMany({
    select: { id: true, kode: true, judul: true },
  });
  console.log("Sisa Bank Soal di DB:", sisa);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
