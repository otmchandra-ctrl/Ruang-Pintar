import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const kodes = ["TP1-MM-ES-03", "TP1-MM-PG-20", "TP1-MM-PG-13", "TP1-MM-PG-09", "TP1-MM-PG-04"];
  for (const kode of kodes) {
    const bs = await prisma.bankSoal.findFirst({
      where: { kode },
      include: { versi_soal: { orderBy: { nomor_versi: "desc" }, take: 1 } },
    });
    console.log("=== " + kode + " ===");
    console.log("Gambar:", bs?.versi_soal[0]?.gambar_url);
    console.log("Pertanyaan:\n" + bs?.versi_soal[0]?.pertanyaan);
    console.log("Opsi:\n" + bs?.versi_soal[0]?.opsi_jawaban);
    console.log("-----------------------------------------");
  }
}

main().finally(() => prisma.$disconnect());
