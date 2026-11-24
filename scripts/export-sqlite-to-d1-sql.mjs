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

async function main() {
  console.log("Exporting SQLite data to D1 SQL seed...");
  let sql = "-- Ruang Pintar D1 Seed Data Export\n";
  sql += "PRAGMA foreign_keys = OFF;\n\n";

  const models = [
    { name: "sekolah", table: "sekolah" },
    { name: "tahunAjaran", table: "tahun_ajaran" },
    { name: "semester", table: "semester" },
    { name: "pengguna", table: "pengguna" },
    { name: "guru", table: "guru" },
    { name: "rombel", table: "rombel" },
    { name: "siswa", table: "siswa" },
    { name: "mataPelajaran", table: "mata_pelajaran" },
    { name: "jadwalPelajaran", table: "jadwal_pelajaran" },
  ];

  for (const m of models) {
    try {
      const rows = await prisma[m.name].findMany();
      console.log(`- ${m.table}: ${rows.length} rows`);
      sql += `-- Table: ${m.table} (${rows.length} rows)\n`;
      sql += generateInserts(m.table, rows);
      sql += "\n";
    } catch (err) {
      console.warn(`Skipping ${m.name}: ${err.message}`);
    }
  }

  sql += "PRAGMA foreign_keys = ON;\n";

  fs.writeFileSync("prisma/seed.d1.sql", sql, "utf8");
  console.log(`Successfully generated prisma/seed.d1.sql (${(fs.statSync("prisma/seed.d1.sql").size / 1024).toFixed(1)} KB)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
