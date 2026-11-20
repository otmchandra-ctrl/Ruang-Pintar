import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const penugasanId = "01M3AFKVNY5AGRT767RCJX1CZE"; // KKA X TO 5
  const penugasan = await prisma.penugasanMengajar.findUnique({
    where: { id: penugasanId },
    include: {
      lingkup_materi: {
        include: {
          tujuan_pembelajaran: true,
        },
      },
    },
  });

  console.log("Lingkup materi di penugasan KKA X TO 5:");
  console.log(JSON.stringify(penugasan?.lingkup_materi, null, 2));

  // Cek apakah ada TP umum di mapel KKA
  const allTp = await prisma.tujuanPembelajaran.findMany({
    where: {
      lingkup_materi: {
        penugasan_mengajar: {
          mata_pelajaran: {
            kode: "KKA",
          },
        },
      },
    },
  });
  console.log("Total TP KKA:", allTp.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
