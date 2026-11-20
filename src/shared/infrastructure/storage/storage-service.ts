import { prisma } from "../database/prisma";
import { LocalStorageAdapter } from "./local-storage-adapter";
import { SupabaseStorageAdapter } from "./supabase-storage-adapter";
import type { IStorageService, SaveFileOptions, StoredFile } from "./storage-interface";

const localStorage = new LocalStorageAdapter();
const supabaseStorage = new SupabaseStorageAdapter();

function storageFor(provider: string | undefined): IStorageService {
  if (provider === "SUPABASE") return supabaseStorage;
  if (!provider || provider === "LOCAL") return localStorage;
  throw new Error(`Provider penyimpanan tidak didukung: ${provider}`);
}

export const storageService: IStorageService = {
  saveFile(options: SaveFileOptions) {
    const provider =
      process.env.STORAGE_PROVIDER ??
      (process.env.NODE_ENV === "production" ? "SUPABASE" : "LOCAL");
    return storageFor(provider).saveFile(options);
  },

  async readFile(storageKey: string): Promise<StoredFile> {
    const metadata = await prisma.metadataBerkas.findUnique({ where: { storage_key: storageKey } });
    if (!metadata || metadata.status === "TERHAPUS") throw new Error("Berkas tidak tersedia.");
    return storageFor(metadata.storage_provider).readFile(storageKey);
  },

  async deleteFile(storageKey: string): Promise<void> {
    const metadata = await prisma.metadataBerkas.findUnique({ where: { storage_key: storageKey } });
    if (!metadata) return;
    return storageFor(metadata.storage_provider).deleteFile(storageKey);
  },

  async fileExists(storageKey: string): Promise<boolean> {
    const metadata = await prisma.metadataBerkas.findUnique({ where: { storage_key: storageKey } });
    if (!metadata || metadata.status === "TERHAPUS") return false;
    return storageFor(metadata.storage_provider).fileExists(storageKey);
  },
};
