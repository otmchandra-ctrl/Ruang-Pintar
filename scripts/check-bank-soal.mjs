import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mapels = await prisma.mataPelajaran.findMany({
    select: { id: true, kode: true, nama: true },
  });
  console.log("Daftar Mapel:", mapels);

  const list = await prisma.bankSoal.findMany({
    select: {
      id: true,
      kode: true,
      judul: true,
      mata_pelajaran_id: true,
      guru_id: true,
      sekolah_id: true,
    },
  });
  console.log("Daftar Bank Soal di DB:", JSON.stringify(list, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
