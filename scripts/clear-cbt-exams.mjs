import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Mengosongkan data tugas evaluasi / ujian CBT yang tadi dibuat...");

  // Hapus hasil ujian dan sesi ujian
  await prisma.hasilUjianCbt.deleteMany({});
  await prisma.jawabanSiswa.deleteMany({});
  await prisma.eventIntegritasUjian.deleteMany({});
  await prisma.sesiUjianSiswa.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.snapshotUjian.deleteMany({});
  await prisma.ujianCbt.deleteMany({});

  console.log("Semua data ujian CBT berhasil dikosongkan.");

  const count = await prisma.ujianCbt.count();
  console.log("Jumlah ujian_cbt sekarang:", count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
