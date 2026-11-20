-- AlterTable: Add snapshot fields to kisi_kisi_asesmen
ALTER TABLE "kisi_kisi_asesmen" ADD COLUMN "snapshot_hash" TEXT;
ALTER TABLE "kisi_kisi_asesmen" ADD COLUMN "tanggal_dibekukan" DATETIME;

-- AlterTable: Add snapshot fields to item_kisi_kisi
ALTER TABLE "item_kisi_kisi" ADD COLUMN "snapshot_pertanyaan" TEXT;
ALTER TABLE "item_kisi_kisi" ADD COLUMN "snapshot_opsi" TEXT;
ALTER TABLE "item_kisi_kisi" ADD COLUMN "snapshot_kunci" TEXT;
ALTER TABLE "item_kisi_kisi" ADD COLUMN "snapshot_pembahasan" TEXT;
