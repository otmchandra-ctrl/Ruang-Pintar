import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(tableName, rows) {
  if (!rows || rows.length === 0) return "";
  const lines = [];
  for (const row of rows) {
    const cols = Object.keys(row);
    const colList = cols.map((c) => `"${c}"`).join(", ");
    const valList = cols.map((c) => escapeSql(row[c])).join(", ");
    lines.push(`INSERT OR REPLACE INTO "${tableName}" (${colList}) VALUES (${valList});`);
  }
  return lines.join("\n") + "\n";
}

async function exportGroup(groupName, filename, models) {
  console.log(`\nExporting group: ${groupName} -> ${filename}...`);
  let sql = `-- Ruang Pintar D1 Seed: ${groupName}\n`;
  sql += "PRAGMA foreign_keys = OFF;\n\n";

  let totalRows = 0;
  for (const m of models) {
    try {
      const rows = await prisma[m.name].findMany();
      console.log(`  - ${m.table}: ${rows.length} rows`);
      totalRows += rows.length;
      if (rows.length > 0) {
        sql += `-- Table: ${m.table} (${rows.length} rows)\n`;
        sql += generateInserts(m.table, rows);
        sql += "\n";
      }
    } catch (err) {
      console.warn(`  ! Skipping ${m.name}: ${err.message}`);
    }
  }

  sql += "PRAGMA foreign_keys = ON;\n";
  fs.writeFileSync(filename, sql, "utf8");
  const sizeKb = (fs.statSync(filename).size / 1024).toFixed(1);
  console.log(`-> Saved ${filename} (${totalRows} total rows, ${sizeKb} KB)`);
}

async function main() {
  // 1. Academic & Teaching Schedule (Everything for Teacher & Schedule Dashboard)
  await exportGroup("Akademik & Jadwal Guru", "prisma/d1-seed-jadwal.sql", [
    { name: "sekolah", table: "sekolah" },
    { name: "langgananTenant", table: "langganan_tenant" },
    { name: "jabatan", table: "jabatan" },
    { name: "penugasanJabatan", table: "penugasan_jabatan" },
    { name: "tahunAjaran", table: "tahun_ajaran" },
    { name: "semester", table: "semester" },
    { name: "fase", table: "fase" },
    { name: "tingkatKelas", table: "tingkat_kelas" },
    { name: "programKeahlian", table: "program_keahlian" },
    { name: "rombel", table: "rombel" },
    { name: "guru", table: "guru" },
    { name: "mataPelajaran", table: "mata_pelajaran" },
    { name: "penugasanMengajar", table: "penugasan_mengajar" },
    { name: "penugasanWaliKelas", table: "penugasan_wali_kelas" },
    { name: "slotWaktu", table: "slot_waktu" },
    { name: "versiJadwal", table: "versi_jadwal" },
    { name: "jadwalPelajaran", table: "jadwal_pelajaran" },
    { name: "sesiKelasAktual", table: "sesi_kelas_aktual" },
    { name: "lingkupMateri", table: "lingkup_materi" },
    { name: "tujuanPembelajaran", table: "tujuan_pembelajaran" },
    { name: "materiPembelajaran", table: "materi_pembelajaran" },
    { name: "publikasiMateri", table: "publikasi_materi" },
  ]);

  // 2. Students & Rombel Memberships
  await exportGroup("Siswa & Anggota Rombel", "prisma/d1-seed-siswa.sql", [
    { name: "pengguna", table: "pengguna" },
    { name: "keanggotaanSekolah", table: "keanggotaan_sekolah" },
    { name: "siswa", table: "siswa" },
    { name: "keikutsertaanSiswa", table: "keikutsertaan_siswa" },
    { name: "penempatanRombel", table: "penempatan_rombel" },
  ]);

  // 3. CBT Exams & Assessments
  await exportGroup("Asesmen & Bank Soal CBT", "prisma/d1-seed-cbt.sql", [
    { name: "definisiAsesmen", table: "definisi_asesmen" },
    { name: "bankSoal", table: "bank_soal" },
    { name: "versiSoal", table: "versi_soal" },
    { name: "ujianCbt", table: "ujian_cbt" },
    { name: "snapshotUjian", table: "snapshot_ujian" },
    { name: "examSession", table: "exam_session" },
  ]);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
