import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

// Generator password profesional ramah siswa:
// Format: xto5#<4_digit_acak>@<2_huruf_acak>
// Contoh: xto5#4928@jc
function generateStudentPassword(rombelCode = "xto5") {
  const cleanRombel = rombelCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  const randomDigits = crypto.randomInt(1000, 9999).toString();
  // Karakter a-z tanpa 'l' dan 'o' agar tidak tertukar dengan angka 1 dan 0 di layar HP
  const chars = "abcdefghjkmnpqrstuvwxyz";
  const c1 = chars[crypto.randomInt(0, chars.length)];
  const c2 = chars[crypto.randomInt(0, chars.length)];
  return `${cleanRombel}#${randomDigits}@${c1}${c2}`;
}

async function main() {
  console.log("=== MEMULAI PEMBARUAN PASSWORD SISWA KELAS X TO 5 ===");

  // 1. Ambil data siswa kelas X TO 5
  const siswaList = await prisma.siswa.findMany({
    where: {
      keikutsertaan: {
        some: {
          penempatan: {
            some: {
              rombel: {
                nama: {
                  contains: "TO 5",
                },
              },
            },
          },
        },
      },
    },
    include: {
      pengguna: true,
      keikutsertaan: {
        include: {
          penempatan: {
            include: {
              rombel: true,
            },
          },
        },
      },
    },
    orderBy: {
      nama_lengkap: "asc",
    },
  });

  console.log(`Ditemukan ${siswaList.length} siswa di kelas X TO 5.`);

  if (siswaList.length === 0) {
    throw new Error("Tidak ada siswa ditemukan di kelas X TO 5.");
  }

  const results = [];
  const usedPasswords = new Set();

  for (let i = 0; i < siswaList.length; i++) {
    const siswa = siswaList[i];
    const pengguna = siswa.pengguna;

    if (!pengguna) {
      console.warn(
        `Peringatan: Siswa ${siswa.nama_lengkap} (${siswa.id}) tidak memiliki akun pengguna!`
      );
      continue;
    }

    // Generate password unik
    let plainPassword = "";
    do {
      plainPassword = generateStudentPassword("xto5");
    } while (usedPasswords.has(plainPassword));
    usedPasswords.add(plainPassword);

    // Hash password dengan bcrypt
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Update database
    await prisma.pengguna.update({
      where: { id: pengguna.id },
      data: {
        password_hash: passwordHash,
        status_akun: "AKTIF",
        harus_ganti_password: false,
      },
    });

    results.push({
      no: i + 1,
      nama: siswa.nama_lengkap,
      nis: siswa.nis || "-",
      username: pengguna.username,
      password: plainPassword,
      penggunaId: pengguna.id,
      siswaId: siswa.id,
    });

    console.log(
      `[${i + 1}/${siswaList.length}] Updated: ${siswa.nama_lengkap} (${pengguna.username}) -> ${plainPassword}`
    );
  }

  // 2. Buat berkas Rekap Markdown
  const markdownRows = results
    .map((r) => `| ${r.no} | ${r.nama} | ${r.nis} | \`${r.username}\` | \`${r.password}\` |`)
    .join("\n");

  const markdownContent = `# Rekap Akun & Password Siswa Kelas X TO 5
## Ruang Pintar — SMK Otomindo
**Tanggal Dibuat:** ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB  
**Total Siswa:** ${results.length} Siswa  
**Format Password:** \`xto5#<4_digit>@<2_huruf>\` (Huruf kecil, angka, dan simbol)

> **Catatan Penggunaan:**
> - Bagikan kredensial berikut kepada siswa untuk login CBT di URL aplikasi / portal Ruang Pintar.
> - Password menggunakan huruf kecil seluruhnya agar siswa mudah mengetik di HP tanpa kendala tombol Shift/Caps Lock.
> - Setiap siswa memiliki kata sandi unik demi keamanan dan integritas nilai ujian.

| No | Nama Lengkap Siswa | NIS | Username | Password Baru |
| :---: | :--- | :---: | :---: | :---: |
${markdownRows}
`;

  // 3. Buat berkas Rekap CSV
  const csvHeader = "No,Nama Lengkap,NIS,Username,Password Baru\n";
  const csvRows = results
    .map((r) => `${r.no},"${r.nama.replace(/"/g, '""')}",${r.nis},${r.username},${r.password}`)
    .join("\n");
  const csvContent = csvHeader + csvRows;

  // Tulis ke folder docs/
  const mdPath = path.resolve("docs/rekap-kredensial-siswa-xto5.md");
  const csvPath = path.resolve("docs/rekap-kredensial-siswa-xto5.csv");

  await fs.writeFile(mdPath, markdownContent, "utf8");
  await fs.writeFile(csvPath, csvContent, "utf8");

  console.log("\nBerhasil membuat dokumen rekap:");
  console.log("- " + mdPath);
  console.log("- " + csvPath);

  // 4. Verifikasi uji coba login salah satu akun
  const testStudent = results[0];
  const userInDb = await prisma.pengguna.findUnique({
    where: { id: testStudent.penggunaId },
  });
  const isMatch = await bcrypt.compare(testStudent.password, userInDb.password_hash);
  console.log(
    `\nVerifikasi Login [${testStudent.username}]: ${isMatch ? "SUCCESS (PASSWORD VALID)" : "FAILED"}`
  );

  console.log("\n=== SELESAI: 38 SISWA KELAS X TO 5 TELAH DIPERBARUI ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
