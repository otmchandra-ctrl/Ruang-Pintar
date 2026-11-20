import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ulid } from "ulidx";

const prisma = new PrismaClient();

// Generator password ramah siswa sesuai standar Ruang Pintar:
// Format: xto1#<4_digit_acak>@<2_huruf_acak>
// Contoh: xto1#4928@jc
// Karakter a-z tanpa 'l' dan 'o' agar tidak tertukar dengan angka 1 dan 0 di layar HP siswa
function generateStudentPassword(rombelCode = "xto1") {
  const cleanRombel = rombelCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  const randomDigits = crypto.randomInt(1000, 9999).toString();
  const chars = "abcdefghjkmnpqrstuvwxyz";
  const c1 = chars[crypto.randomInt(0, chars.length)];
  const c2 = chars[crypto.randomInt(0, chars.length)];
  return `${cleanRombel}#${randomDigits}@${c1}${c2}`;
}

async function main() {
  console.log("=== MEMULAI PEMBARUAN PASSWORD SISWA KELAS X TO 1 ===");

  // 1. Ambil rombel X TO 1
  const rombel = await prisma.rombel.findFirst({
    where: { nama: "X TO 1" },
  });

  if (!rombel) {
    throw new Error("Rombel X TO 1 tidak ditemukan di database!");
  }

  // 2. Ambil penempatan rombel siswa kelas X TO 1
  const penempatanList = await prisma.penempatanRombel.findMany({
    where: {
      rombel_id: rombel.id,
      status: "AKTIF",
    },
    include: {
      keikutsertaan: {
        include: {
          siswa: {
            include: {
              pengguna: true,
            },
          },
        },
      },
      rombel: true,
    },
    orderBy: {
      nomor_absen: "asc",
    },
  });

  console.log(`Ditemukan ${penempatanList.length} siswa aktif di kelas X TO 1.`);

  if (penempatanList.length === 0) {
    throw new Error("Tidak ada siswa ditemukan di kelas X TO 1.");
  }

  const results = [];
  const usedPasswords = new Set();

  for (let i = 0; i < penempatanList.length; i++) {
    const penempatan = penempatanList[i];
    const siswa = penempatan.keikutsertaan.siswa;
    let pengguna = siswa.pengguna;
    const noAbsen = penempatan.nomor_absen || i + 1;
    const defaultUsername = `xto1-${String(noAbsen).padStart(2, "0")}`;

    // Generate password unik
    let plainPassword = "";
    do {
      plainPassword = generateStudentPassword("xto1");
    } while (usedPasswords.has(plainPassword));
    usedPasswords.add(plainPassword);

    // Hash password dengan bcrypt
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Jika pengguna belum ada, buat akun baru
    if (!pengguna) {
      const penggunaId = ulid();
      pengguna = await prisma.pengguna.create({
        data: {
          id: penggunaId,
          sekolah_id: rombel.sekolah_id,
          username: defaultUsername,
          email: `${defaultUsername}@siswa.otomindo.sch.id`,
          nama_lengkap: siswa.nama_lengkap,
          peran_dasar: "STUDENT",
          password_hash: passwordHash,
          status_akun: "AKTIF",
          harus_ganti_password: false,
        },
      });

      await prisma.siswa.update({
        where: { id: siswa.id },
        data: { pengguna_id: pengguna.id },
      });

      console.log(`+ Akun baru dibuat untuk ${siswa.nama_lengkap} (${defaultUsername})`);
    } else {
      // Pastikan username rapi
      const targetUsername = pengguna.username || defaultUsername;

      await prisma.pengguna.update({
        where: { id: pengguna.id },
        data: {
          username: targetUsername,
          password_hash: passwordHash,
          status_akun: "AKTIF",
          harus_ganti_password: false,
        },
      });
    }

    results.push({
      no: noAbsen,
      nama: siswa.nama_lengkap,
      nis: siswa.nis || "-",
      username: pengguna.username || defaultUsername,
      password: plainPassword,
      penggunaId: pengguna.id,
      siswaId: siswa.id,
    });

    console.log(
      `[${i + 1}/${penempatanList.length}] Updated: Absen ${noAbsen} - ${siswa.nama_lengkap} (${pengguna.username || defaultUsername}) -> ${plainPassword}`
    );
  }

  // 3. Buat berkas Rekap Markdown
  const markdownRows = results
    .map((r) => `| ${r.no} | ${r.nama} | ${r.nis} | \`${r.username}\` | \`${r.password}\` |`)
    .join("\n");

  const markdownContent = `# Rekap Akun & Password Siswa Kelas X TO 1
## Ruang Pintar — SMK Otomindo
**Tanggal Dibuat:** ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB  
**Total Siswa:** ${results.length} Siswa  
**Format Password:** \`xto1#<4_digit>@<2_huruf>\` (Huruf kecil, angka, dan simbol)

> **Catatan Penggunaan:**
> - Bagikan kredensial berikut kepada siswa untuk login CBT di URL aplikasi / portal Ruang Pintar.
> - Password menggunakan huruf kecil seluruhnya agar siswa mudah mengetik di HP tanpa kendala tombol Shift/Caps Lock.
> - Setiap siswa memiliki kata sandi unik demi keamanan dan integritas nilai ujian.
> - Status \`harus_ganti_password\` telah diset ke \`false\` sehingga siswa langsung diarahkan ke beranda ujian tanpa kendala formulir reset sandi.

| No | Nama Lengkap Siswa | NIS | Username | Password Baru |
| :---: | :--- | :---: | :---: | :---: |
${markdownRows}
`;

  // 4. Buat berkas Rekap CSV
  const csvHeader = "No,Nama Lengkap,NIS,Username,Password Baru\n";
  const csvRows = results
    .map((r) => `${r.no},"${r.nama.replace(/"/g, '""')}",${r.nis},${r.username},${r.password}`)
    .join("\n");
  const csvContent = csvHeader + csvRows;

  // Tulis ke folder docs/
  const mdPath = path.resolve("docs/rekap-kredensial-siswa-xto1.md");
  const csvPath = path.resolve("docs/rekap-kredensial-siswa-xto1.csv");

  await fs.writeFile(mdPath, markdownContent, "utf8");
  await fs.writeFile(csvPath, csvContent, "utf8");

  console.log("\nBerhasil membuat dokumen rekap:");
  console.log("- " + mdPath);
  console.log("- " + csvPath);

  // 5. Verifikasi uji coba login akun pertama
  const testStudent = results[0];
  const userInDb = await prisma.pengguna.findUnique({
    where: { id: testStudent.penggunaId },
  });
  const isMatch = await bcrypt.compare(testStudent.password, userInDb.password_hash);
  console.log(
    `\nVerifikasi Login [${testStudent.username}]: ${isMatch ? "SUCCESS (PASSWORD VALID)" : "FAILED"}`
  );
  console.log(`Harus Ganti Password: ${userInDb.harus_ganti_password}`);

  console.log(`\n=== SELESAI: ${results.length} SISWA KELAS X TO 1 TELAH DIPERBARUI ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
