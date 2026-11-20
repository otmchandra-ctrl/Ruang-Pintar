import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { MetadataBerkas } from "@prisma/client";
import { prisma } from "../database/prisma";
import { generateUlid } from "../../lib/ulid";
import type { IStorageService, SaveFileOptions, StoredFile } from "./storage-interface";

function getSupabaseStorage(): { client: SupabaseClient; bucket: string } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!url || !serviceRoleKey || !bucket) {
    throw new Error("Supabase Storage belum dikonfigurasi pada environment server.");
  }

  return {
    client: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    bucket,
  };
}

function checksum(content: Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export class SupabaseStorageAdapter implements IStorageService {
  async saveFile(options: SaveFileOptions): Promise<MetadataBerkas> {
    const { client, bucket } = getSupabaseStorage();
    const id = generateUlid();
    const datePrefix = new Date().toISOString().slice(0, 10);
    const sanitizedName = options.nama_file_asli
      .split(/[\\/]/)
      .at(-1)!
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${datePrefix}/${id}_${sanitizedName}`;
    const content = Buffer.from(options.content);

    const { error: uploadError } = await client.storage.from(bucket).upload(storageKey, content, {
      contentType: options.mime_type,
      upsert: false,
    });
    if (uploadError) throw new Error(`Supabase Storage upload gagal: ${uploadError.message}`);

    try {
      return await prisma.metadataBerkas.create({
        data: {
          id,
          sekolah_id: options.sekolah_id ?? null,
          nama_file_asli: options.nama_file_asli,
          storage_provider: "SUPABASE",
          storage_key: storageKey,
          mime_type: options.mime_type,
          ukuran_byte: content.length,
          checksum: checksum(content),
          status: "AKTIF",
        },
      });
    } catch (error) {
      await client.storage.from(bucket).remove([storageKey]);
      throw error;
    }
  }

  async readFile(storageKey: string): Promise<StoredFile> {
    const metadata = await prisma.metadataBerkas.findUnique({ where: { storage_key: storageKey } });
    if (!metadata) throw new Error(`Metadata berkas tidak ditemukan untuk key ${storageKey}.`);

    const { client, bucket } = getSupabaseStorage();
    const { data, error } = await client.storage.from(bucket).download(storageKey);
    if (error || !data)
      throw new Error(`Supabase Storage download gagal: ${error?.message ?? "file kosong"}`);

    const content = Buffer.from(await data.arrayBuffer());
    if (metadata.checksum && checksum(content) !== metadata.checksum) {
      throw new Error("Checksum berkas Supabase Storage tidak cocok dengan metadata.");
    }
    return { metadata, content };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const metadata = await prisma.metadataBerkas.findUnique({ where: { storage_key: storageKey } });
    if (!metadata) return;

    const { client, bucket } = getSupabaseStorage();
    const { error } = await client.storage.from(bucket).remove([storageKey]);
    if (error) throw new Error(`Supabase Storage delete gagal: ${error.message}`);

    await prisma.metadataBerkas.update({
      where: { storage_key: storageKey },
      data: { status: "TERHAPUS" },
    });
  }

  async fileExists(storageKey: string): Promise<boolean> {
    const { client, bucket } = getSupabaseStorage();
    const { data, error } = await client.storage.from(bucket).download(storageKey);
    return !error && Boolean(data);
  }
}
