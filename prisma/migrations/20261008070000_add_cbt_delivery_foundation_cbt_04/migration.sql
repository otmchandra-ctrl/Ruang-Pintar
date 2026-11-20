-- AlterTable: Add metadata_ujian and hash_integritas to snapshot_ujian
ALTER TABLE "snapshot_ujian" ADD COLUMN "metadata_ujian" TEXT;
ALTER TABLE "snapshot_ujian" ADD COLUMN "hash_integritas" TEXT;

-- CreateTable: exam_session
CREATE TABLE "exam_session" (
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
);

-- CreateTable: assessment_attempt
CREATE TABLE "assessment_attempt" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_session_ujian_cbt_id_kode_sesi_key" ON "exam_session"("ujian_cbt_id", "kode_sesi");
CREATE INDEX "exam_session_sekolah_id_status_idx" ON "exam_session"("sekolah_id", "status");
CREATE INDEX "exam_session_ujian_cbt_id_idx" ON "exam_session"("ujian_cbt_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_attempt_ujian_cbt_id_siswa_id_attempt_ke_key" ON "assessment_attempt"("ujian_cbt_id", "siswa_id", "attempt_ke");
CREATE INDEX "assessment_attempt_siswa_id_status_idx" ON "assessment_attempt"("siswa_id", "status");
CREATE INDEX "assessment_attempt_ujian_cbt_id_status_idx" ON "assessment_attempt"("ujian_cbt_id", "status");
CREATE INDEX "assessment_attempt_exam_session_id_idx" ON "assessment_attempt"("exam_session_id");
CREATE INDEX "assessment_attempt_sekolah_id_status_idx" ON "assessment_attempt"("sekolah_id", "status");
