import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/sqlite-client/index.js";

const prisma = new PrismaClient();
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET;
const root = path.resolve(
  process.env.STORAGE_LOCAL_ROOT ?? path.join(process.cwd(), "data", "storage")
);

if (!url || !serviceRoleKey || !bucket) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SUPABASE_STORAGE_BUCKET wajib diatur."
  );
}

const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const checksum = (content) => crypto.createHash("sha256").update(content).digest("hex");
const insideRoot = (candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);

try {
  const files = await prisma.metadataBerkas.findMany({
    where: { status: "AKTIF", storage_provider: "LOCAL" },
    orderBy: { id: "asc" },
  });
  let migrated = 0;

  for (const metadata of files) {
    const localPath = path.resolve(root, metadata.storage_key);
    if (!insideRoot(localPath))
      throw new Error("Storage key keluar dari direktori sumber yang diizinkan.");

    const content = await fs.readFile(localPath);
    const sourceChecksum = checksum(content);
    if (metadata.checksum && sourceChecksum !== metadata.checksum) {
      throw new Error("Checksum file lokal tidak cocok; pemindahan dihentikan.");
    }

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(metadata.storage_key, content, {
        contentType: metadata.mime_type,
        upsert: true,
      });
    if (uploadError) throw new Error(`Upload Supabase Storage gagal (${uploadError.name}).`);

    const { data, error: downloadError } = await client.storage
      .from(bucket)
      .download(metadata.storage_key);
    if (downloadError || !data) throw new Error("Verifikasi unduh setelah upload gagal.");
    if (checksum(Buffer.from(await data.arrayBuffer())) !== sourceChecksum) {
      throw new Error("Checksum file Supabase tidak cocok; metadata lokal tidak diubah.");
    }

    await prisma.metadataBerkas.updateMany({
      where: { id: metadata.id, storage_provider: "LOCAL", status: "AKTIF" },
      data: { storage_provider: "SUPABASE", checksum: sourceChecksum },
    });
    migrated += 1;
  }

  console.log(
    `Pemindahan berkas selesai: ${migrated} file diverifikasi dan diarahkan ke Supabase Storage.`
  );
  console.log("Salinan lokal dipertahankan sebagai rollback.");
} finally {
  await prisma.$disconnect();
}
