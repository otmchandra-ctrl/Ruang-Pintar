import fs from "fs";
import path from "path";

/**
 * Script Cadangan (Backup) Otomatis Database SQLite Ruang Pintar
 * Menjaga seluruh data siswa, absensi, dan nilai rapor aman setiap hari.
 */
let dbRelativePath = "./data/ruang-pintar.db";
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/DATABASE_URL=["']?file:(.*?)["']?(\r?\n|$)/);
  if (match && match[1]) {
    dbRelativePath = match[1].trim();
  }
}

let candidates = [
  path.resolve(process.cwd(), "prisma", "data", "ruang-pintar.db"),
  path.resolve(process.cwd(), "data", "ruang-pintar.db"),
  path.resolve(process.cwd(), dbRelativePath),
];

const absoluteDbPath = candidates.find((p) => fs.existsSync(p)) || candidates[0];
const backupDir = path.resolve(process.cwd(), "backups");

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(absoluteDbPath)) {
  console.error(`[ERROR] File database tidak ditemukan di: ${absoluteDbPath}`);
  process.exit(1);
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-");
const backupFileName = `ruang-pintar-backup-${timestamp}.db`;
const backupFilePath = path.join(backupDir, backupFileName);

fs.copyFileSync(absoluteDbPath, backupFilePath);
console.log(`[SUKSES] Database berhasil dicadangkan ke: ${backupFilePath}`);
console.log(`Ukuran berkas: ${(fs.statSync(backupFilePath).size / (1024 * 1024)).toFixed(2)} MB`);
