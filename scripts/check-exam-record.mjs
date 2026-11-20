import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.ujianCbt.findUnique({
    where: { id: "01M4NNART8APT88SNZRR6C9EG9" },
    include: {
      penugasan_mengajar: {
        include: {
          rombel: true,
          mata_pelajaran: true,
        },
      },
      sesi_ujian_siswa: {
        include: {
          siswa: true,
        },
      },
    },
  });

  console.log("Detail Ujian TP1 X TO 5:");
  console.log({
    id: exam.id,
    judul: exam.judul,
    rombel: exam.penugasan_mengajar?.rombel?.nama,
    mapel: exam.penugasan_mengajar?.mata_pelajaran?.nama,
    gunakan_token: exam.gunakan_token,
    token_masuk: exam.token_masuk,
    status: exam.status,
    total_sesi_siswa: exam.sesi_ujian_siswa.length,
    daftar_siswa_mengerjakan: exam.sesi_ujian_siswa.map((s) => ({
      nama: s.siswa.nama_lengkap,
      nis: s.siswa.nis,
      status: s.status,
    })),
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
