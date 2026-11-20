import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

function checksum(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function applyToDb(dbUrl) {
  console.log(`Applying CBT-04 migrations to SQLite database: ${dbUrl}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  // 1. Resolve pending migration CBT-02 if needed
  await prisma.$executeRawUnsafe(`
    UPDATE _prisma_migrations 
    SET finished_at = CURRENT_TIMESTAMP, applied_steps_count = 1
    WHERE migration_name = '20261007203000_add_assessment_foundation_cbt_02' AND finished_at IS NULL
  `);

  // 2. Insert CBT-03 migration record if not exists
  const cbt03Exists = await prisma.$queryRawUnsafe(
    "SELECT id FROM _prisma_migrations WHERE migration_name = '20261007212000_add_snapshot_fields_cbt_03'"
  );
  if (cbt03Exists.length === 0) {
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES ('${id}', '${checksum("cbt03")}', CURRENT_TIMESTAMP, '20261007212000_add_snapshot_fields_cbt_03', NULL, NULL, CURRENT_TIMESTAMP, 1)
    `);
  }

  // 3. Add columns to snapshot_ujian
  const snapshotCols = await prisma.$queryRawUnsafe("PRAGMA table_info(snapshot_ujian)");
  const colNames = snapshotCols.map((c) => c.name);

  if (!colNames.includes("metadata_ujian")) {
    console.log("Adding metadata_ujian column to snapshot_ujian...");
    await prisma.$executeRawUnsafe('ALTER TABLE "snapshot_ujian" ADD COLUMN "metadata_ujian" TEXT');
  }

  if (!colNames.includes("hash_integritas")) {
    console.log("Adding hash_integritas column to snapshot_ujian...");
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "snapshot_ujian" ADD COLUMN "hash_integritas" TEXT'
    );
  }

  // 4. Create exam_session table if not exists
  console.log("Creating exam_session table if not exists...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "exam_session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sekolah_id" TEXT NOT NULL,
      "ujian_cbt_id" TEXT NOT NULL,
      "kode_sesi" TEXT NOT NULL,
      "nama_sesi" TEXT NOT NULL,
      "waktu_mulai" DATETIME NOT NULL,
      "waktu_selesai" DATETIME NOT NULL,
      "token" TEXT,
      "token_aktif" BOOLEAN NOT NULL DEFAULT true,
      "token_expired_at" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'TERJADWAL',
      "ruang_ujian" TEXT,
      "pengawas_nama" TEXT,
      "catatan" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL,
      CONSTRAINT "exam_session_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "exam_session_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "exam_session_ujian_cbt_id_kode_sesi_key" ON "exam_session"("ujian_cbt_id", "kode_sesi")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "exam_session_sekolah_id_status_idx" ON "exam_session"("sekolah_id", "status")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "exam_session_ujian_cbt_id_idx" ON "exam_session"("ujian_cbt_id")
  `);

  // 5. Create assessment_attempt table if not exists
  console.log("Creating assessment_attempt table if not exists...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "assessment_attempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sekolah_id" TEXT NOT NULL,
      "ujian_cbt_id" TEXT NOT NULL,
      "exam_session_id" TEXT,
      "snapshot_id" TEXT NOT NULL,
      "siswa_id" TEXT NOT NULL,
      "penempatan_rombel_id" TEXT,
      "attempt_ke" INTEGER NOT NULL DEFAULT 1,
      "waktu_mulai" DATETIME,
      "batas_waktu_server" DATETIME,
      "waktu_selesai" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
      "urutan_soal_peserta" TEXT,
      "ip_address" TEXT,
      "user_agent" TEXT,
      "catatan" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL,
      CONSTRAINT "assessment_attempt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "assessment_attempt_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "assessment_attempt_exam_session_id_fkey" FOREIGN KEY ("exam_session_id") REFERENCES "exam_session" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "assessment_attempt_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_ujian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "assessment_attempt_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "assessment_attempt_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "assessment_attempt_ujian_cbt_id_siswa_id_attempt_ke_key" ON "assessment_attempt"("ujian_cbt_id", "siswa_id", "attempt_ke")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "assessment_attempt_siswa_id_status_idx" ON "assessment_attempt"("siswa_id", "status")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "assessment_attempt_ujian_cbt_id_status_idx" ON "assessment_attempt"("ujian_cbt_id", "status")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "assessment_attempt_exam_session_id_idx" ON "assessment_attempt"("exam_session_id")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "assessment_attempt_sekolah_id_status_idx" ON "assessment_attempt"("sekolah_id", "status")
  `);

  // 6. Insert CBT-04 migration record if not exists
  const cbt04Exists = await prisma.$queryRawUnsafe(
    "SELECT id FROM _prisma_migrations WHERE migration_name = '20261008070000_add_cbt_delivery_foundation_cbt_04'"
  );
  if (cbt04Exists.length === 0) {
    const id = crypto.randomUUID();
    const hash = crypto.createHash("sha256").update("cbt04").digest("hex");
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES ('${id}', '${hash}', CURRENT_TIMESTAMP, '20261008070000_add_cbt_delivery_foundation_cbt_04', NULL, NULL, CURRENT_TIMESTAMP, 1)
    `);
  }

  await prisma.$disconnect();
  console.log(`CBT-04 migrations successfully applied to ${dbUrl}!`);
}

async function main() {
  await applyToDb("file:./data/ruang-pintar.db");
  await applyToDb("file:./data/ruang-pintar-test.db");
}

main().catch(console.error);
