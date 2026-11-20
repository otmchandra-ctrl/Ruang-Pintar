import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const SOURCE_DIR = "C:\\Users\\vitam\\Downloads";
const DEST_DIR = path.resolve("public/images/soal");

const imageUpdates = [
  {
    kode: "TP1-MM-PG-13",
    srcFilename: "Curious Tabby Kitten in Garden Bokeh.png",
    destFilename: "curious-tabby-kitten-in-garden-bokeh.png",
    deskripsi: "Foto Kucing untuk Elemen Gambar / Visual (PG-13)",
  },
  {
    kode: "TP1-MM-PG-09",
    srcFilename: "Glossy Blue Megaphone with Sound Waves.png",
    destFilename: "glossy-blue-megaphone-with-sound-waves.png",
    deskripsi: "Ilustrasi Megafon / Audio untuk Elemen Suara (PG-09)",
  },
  {
    kode: "TP1-MM-PG-20",
    srcFilename: "Interactive Digital Learning Dashboard.png",
    destFilename: "interactive-digital-learning-dashboard.png",
    deskripsi: "Dashboard Aplikasi Belajar untuk Multimedia Interaktif (PG-20)",
  },
  {
    kode: "TP1-MM-ES-03",
    srcFilename: "Multimedia Learning Formats Infographic.png",
    destFilename: "multimedia-learning-formats-infographic.png",
    deskripsi: "Infografik Format Pembelajaran Multimedia untuk Soal Esai (ES-03)",
  },
];

async function main() {
  console.log("=== MEMULAI PEMBARUAN GAMBAR SOAL CBT & BANK SOAL ===");

  // 1. Copy file ke public/images/soal
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  for (const item of imageUpdates) {
    const srcPath = path.join(SOURCE_DIR, item.srcFilename);
    const destPath = path.join(DEST_DIR, item.destFilename);

    if (!fs.existsSync(srcPath)) {
      throw new Error(`File sumber tidak ditemukan: ${srcPath}`);
    }

    fs.copyFileSync(srcPath, destPath);
    console.log(
      `[FILE OK] Disalin: ${item.srcFilename} -> ${destPath} (${fs.statSync(destPath).size} bytes)`
    );
  }

  // 2. Update VersiSoal di Database
  for (const item of imageUpdates) {
    const bankSoal = await prisma.bankSoal.findFirst({
      where: { kode: item.kode },
      include: {
        versi_soal: {
          orderBy: { nomor_versi: "desc" },
          take: 1,
        },
      },
    });

    if (!bankSoal || bankSoal.versi_soal.length === 0) {
      console.warn(`[WARN] Bank soal kode ${item.kode} tidak ditemukan!`);
      continue;
    }

    const latestVer = bankSoal.versi_soal[0];
    const newImageUrl = `/images/soal/${item.destFilename}`;

    await prisma.versiSoal.update({
      where: { id: latestVer.id },
      data: {
        gambar_url: newImageUrl,
      },
    });

    console.log(`[DB OK] VersiSoal [${item.kode}] (${latestVer.id}) diperbarui: ${newImageUrl}`);
  }

  // 3. Update Snapshot Ujian CBT (01M4NNART8APT88SNZRR6C9EG9)
  const examId = "01M4NNART8APT88SNZRR6C9EG9";
  const snapshot = await prisma.snapshotUjian.findFirst({
    where: { ujian_cbt_id: examId },
    orderBy: { nomor_snapshot: "desc" },
  });

  if (snapshot) {
    console.log(`Memperbarui Snapshot Ujian ID: ${snapshot.id}...`);
    const manifest = JSON.parse(snapshot.manifest_soal);
    const konfigurasi = JSON.parse(snapshot.konfigurasi);
    const metadata = snapshot.metadata_ujian ? JSON.parse(snapshot.metadata_ujian) : {};
    const kunciPenilaian = JSON.parse(snapshot.kunci_penilaian);

    // Dapatkan pemetaan soal_id -> destFilename
    const bankSoalMap = new Map();
    for (const item of imageUpdates) {
      const bs = await prisma.bankSoal.findFirst({
        where: { kode: item.kode },
        include: { versi_soal: { orderBy: { nomor_versi: "desc" }, take: 1 } },
      });
      if (bs) {
        bankSoalMap.set(bs.id, item.destFilename);
        if (bs.versi_soal[0]) {
          bankSoalMap.set(bs.versi_soal[0].id, item.destFilename);
        }
      }
    }

    let updatedCount = 0;
    for (const item of manifest) {
      const destFilename = bankSoalMap.get(item.soal_id) || bankSoalMap.get(item.versi_soal_id);

      if (destFilename) {
        const newUrl = `/images/soal/${destFilename}`;
        console.log(`  - Manifest item #${item.nomor_urut}: ${item.gambar_url} -> ${newUrl}`);
        item.gambar_url = newUrl;
        updatedCount++;
      }
    }

    // Hitung ulang hash integritas kriptografis
    const canonicalString = JSON.stringify({
      metadata,
      konfigurasi,
      manifestSoal: manifest,
      kunciPenilaian,
    });
    const newHash = crypto.createHash("sha256").update(canonicalString).digest("hex");

    await prisma.snapshotUjian.update({
      where: { id: snapshot.id },
      data: {
        manifest_soal: JSON.stringify(manifest),
        hash_integritas: newHash,
      },
    });

    console.log(
      `[SNAPSHOT OK] ${updatedCount} soal di manifest berhasil diperbarui dengan SHA-256: ${newHash}`
    );
  }

  console.log("=== SEMUA GAMBAR BERHASIL DIPERBARUI SECARA SEMPURNA ===");
}

main().finally(() => prisma.$disconnect());
