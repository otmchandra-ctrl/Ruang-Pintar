-- CreateTable
CREATE TABLE "capaian_pembelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "fase_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "elemen" TEXT,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "capaian_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "capaian_pembelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "capaian_pembelajaran_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kriteria_ketercapaian_tp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tujuan_pembelajaran_id" TEXT NOT NULL,
    "tipe_kktp" TEXT NOT NULL DEFAULT 'SKALA_INTERVAL',
    "ambang_tuntas" REAL NOT NULL DEFAULT 75.0,
    "interval_json" TEXT,
    "rubrik_json" TEXT,
    "deskripsi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kriteria_ketercapaian_tp_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kriteria_ketercapaian_tp_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kisi_kisi_asesmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "definisi_asesmen_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "tahun_ajaran" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "alokasi_waktu_menit" INTEGER NOT NULL DEFAULT 90,
    "total_butir_soal" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatan_supervisi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kisi_kisi_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kisi_kisi_asesmen_definisi_asesmen_id_fkey" FOREIGN KEY ("definisi_asesmen_id") REFERENCES "definisi_asesmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_kisi_kisi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "kisi_kisi_id" TEXT NOT NULL,
    "tujuan_pembelajaran_id" TEXT NOT NULL,
    "nomor_urut" INTEGER NOT NULL,
    "indikator_soal" TEXT NOT NULL,
    "level_kognitif" TEXT NOT NULL DEFAULT 'L2',
    "bentuk_soal" TEXT NOT NULL DEFAULT 'PILIHAN_GANDA',
    "bobot_skor" REAL NOT NULL DEFAULT 1.0,
    "bank_soal_id" TEXT,
    "versi_soal_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "item_kisi_kisi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_kisi_kisi_id_fkey" FOREIGN KEY ("kisi_kisi_id") REFERENCES "kisi_kisi_asesmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_bank_soal_id_fkey" FOREIGN KEY ("bank_soal_id") REFERENCES "bank_soal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_versi_soal_id_fkey" FOREIGN KEY ("versi_soal_id") REFERENCES "versi_soal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "bank_soal" ADD COLUMN "capaian_pembelajaran_id" TEXT;
ALTER TABLE "bank_soal" ADD COLUMN "scope_kepemilikan" TEXT NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "bank_soal" ADD COLUMN "level_kognitif" TEXT NOT NULL DEFAULT 'L2';

-- AlterTable
ALTER TABLE "tujuan_pembelajaran" ADD COLUMN "capaian_pembelajaran_id" TEXT;

-- CreateIndex
CREATE INDEX "capaian_pembelajaran_sekolah_id_mata_pelajaran_id_status_idx" ON "capaian_pembelajaran"("sekolah_id", "mata_pelajaran_id", "status");
CREATE UNIQUE INDEX "capaian_pembelajaran_sekolah_id_mata_pelajaran_id_fase_id_kode_key" ON "capaian_pembelajaran"("sekolah_id", "mata_pelajaran_id", "fase_id", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "kriteria_ketercapaian_tp_tujuan_pembelajaran_id_key" ON "kriteria_ketercapaian_tp"("tujuan_pembelajaran_id");
CREATE INDEX "kriteria_ketercapaian_tp_sekolah_id_idx" ON "kriteria_ketercapaian_tp"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "kisi_kisi_asesmen_definisi_asesmen_id_key" ON "kisi_kisi_asesmen"("definisi_asesmen_id");
CREATE INDEX "kisi_kisi_asesmen_sekolah_id_status_idx" ON "kisi_kisi_asesmen"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "item_kisi_kisi_sekolah_id_kisi_kisi_id_idx" ON "item_kisi_kisi"("sekolah_id", "kisi_kisi_id");
CREATE INDEX "item_kisi_kisi_tujuan_pembelajaran_id_idx" ON "item_kisi_kisi"("tujuan_pembelajaran_id");
CREATE INDEX "item_kisi_kisi_bank_soal_id_idx" ON "item_kisi_kisi"("bank_soal_id");
CREATE INDEX "item_kisi_kisi_versi_soal_id_idx" ON "item_kisi_kisi"("versi_soal_id");
CREATE UNIQUE INDEX "item_kisi_kisi_kisi_kisi_id_nomor_urut_key" ON "item_kisi_kisi"("kisi_kisi_id", "nomor_urut");

-- CreateIndex
CREATE INDEX "bank_soal_sekolah_id_scope_kepemilikan_mata_pelajaran_id_idx" ON "bank_soal"("sekolah_id", "scope_kepemilikan", "mata_pelajaran_id");
CREATE INDEX "bank_soal_capaian_pembelajaran_id_idx" ON "bank_soal"("capaian_pembelajaran_id");

-- CreateIndex
CREATE INDEX "tujuan_pembelajaran_capaian_pembelajaran_id_idx" ON "tujuan_pembelajaran"("capaian_pembelajaran_id");
