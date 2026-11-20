/**
 * Ruang Pintar — M13 Assessment Snapshot Hash & Deterministic Checksum Helper
 *
 * Digunakan untuk:
 * 1. Menghasilkan SHA-256 Hash yang deterministik (reproducible) dari payload butir soal & metadata ujian
 * 2. Mencetak Verification Seal Code pada naskah soal fisik dan kunci jawaban
 * 3. Memverifikasi tidak adanya manipulasi data fisik vs data sistem
 */

import { createHash } from "crypto";

/**
 * Normalisasi objek agar deterministik (mengurutkan keys rekursif)
 */
function canonicalize(val: any): any {
  if (val === null || typeof val !== "object") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(canonicalize);
  }
  const sortedKeys = Object.keys(val).sort();
  const res: Record<string, any> = {};
  for (const k of sortedKeys) {
    if (val[k] !== undefined) {
      res[k] = canonicalize(val[k]);
    }
  }
  return res;
}

/**
 * Hasilkan SHA-256 hash 64-karakter dari data apapun
 */
export function generateDeterministicSnapshotHash(payload: Record<string, any>): string {
  const canonicalJson = JSON.stringify(canonicalize(payload));
  return createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

/**
 * Format kode segel verifikasi ringkas untuk kop naskah ujian fisik
 * Contoh output: RP-SNAP-A1B2C3D4-2026
 */
export function formatSnapshotSealCode(hash: string, tahunAjaran?: string): string {
  const shortHash = hash.slice(0, 8).toUpperCase();
  const yearSuffix = (tahunAjaran || new Date().getFullYear().toString())
    .replace(/[^0-9]/g, "")
    .slice(0, 4);
  return `RP-SNAP-${shortHash}-${yearSuffix}`;
}
