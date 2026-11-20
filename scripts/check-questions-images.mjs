import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const ujian = await prisma.ujianCbt.findUnique({
    where: { id: "01M4NNART8APT88SNZRR6C9EG9" },
  });
  console.log("Ujian:", ujian?.judul);
  const bp = JSON.parse(ujian?.blueprint || "[]");
  console.log("Total items in blueprint:", bp.length);

  for (let i = 0; i < bp.length; i++) {
    const b = bp[i];
    const bs = await prisma.bankSoal.findUnique({
      where: { id: b.bank_soal_id },
      include: { versi_soal: { orderBy: { nomor_versi: "desc" }, take: 1 } },
    });
    const ver = bs?.versi_soal?.[0];
    console.log(
      `Soal #${i + 1} (${bs?.kode}): gambar_url = ${ver?.gambar_url || "NULL"} | Pertanyaan = ${ver?.pertanyaan?.substring(0, 50)}...`
    );
  }
}

main().finally(() => prisma.$disconnect());
