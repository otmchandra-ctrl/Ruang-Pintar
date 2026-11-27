/**
 * Ruang Pintar — Client-side Offline Queue & Read Cache (IndexedDB)
 *
 * Menyimpan antrean mutasi (presensi sesi & input nilai) dan cache data baca
 * saat koneksi internet terputus, dengan fallback in-memory untuk lingkungan test/SSR.
 */

export type OfflineMutationType = "SESSION_ATTENDANCE" | "ASSESSMENT_GRADES";

export interface OfflineMutationRecord<TPayload = unknown> {
  key: string;
  type: OfflineMutationType;
  label: string;
  payload: TPayload;
  meta?: {
    penugasanId?: string;
    shouldPublish?: boolean;
  };
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  lastError?: string;
}

interface OfflineCacheRecord<TData = unknown> {
  key: string;
  data: TData;
  updatedAt: number;
}

export const OFFLINE_QUEUE_CHANGED_EVENT = "ruang-pintar:offline-queue-changed";

const DB_NAME = "ruang-pintar-offline-sync";
const DB_VERSION = 1;
const STORE_MUTATIONS = "mutations";
const STORE_CACHE = "dataCache";

const memoryMutations = new Map<string, OfflineMutationRecord>();
const memoryCache = new Map<string, OfflineCacheRecord>();

function hasIndexedDB(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function notifyQueueChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_CHANGED_EVENT));
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        db.createObjectStore(STORE_MUTATIONS, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Gagal membuka IndexedDB."));
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = action(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Operasi IndexedDB gagal."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Transaksi IndexedDB gagal."));
    };
  });
}

/**
 * Menyimpan atau memperbarui mutasi offline berdasarkan key (coalescing).
 */
export async function enqueueOfflineMutation<TPayload>(input: {
  key: string;
  type: OfflineMutationType;
  label: string;
  payload: TPayload;
  meta?: {
    penugasanId?: string;
    shouldPublish?: boolean;
  };
}): Promise<OfflineMutationRecord<TPayload>> {
  const now = Date.now();
  const existing = await getOfflineMutation<TPayload>(input.key);

  const record: OfflineMutationRecord<TPayload> = {
    key: input.key,
    type: input.type,
    label: input.label,
    payload: input.payload,
    meta: input.meta,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    retryCount: existing?.retryCount ?? 0,
    lastError: undefined,
  };

  if (!hasIndexedDB()) {
    memoryMutations.set(record.key, record);
    notifyQueueChanged();
    return record;
  }

  await withStore(STORE_MUTATIONS, "readwrite", (store) => store.put(record));
  notifyQueueChanged();
  return record;
}

/**
 * Mengambil satu item antrean berdasarkan key.
 */
export async function getOfflineMutation<TPayload = unknown>(
  key: string
): Promise<OfflineMutationRecord<TPayload> | null> {
  if (!hasIndexedDB()) {
    return (memoryMutations.get(key) as OfflineMutationRecord<TPayload> | undefined) ?? null;
  }

  const res = await withStore<OfflineMutationRecord<TPayload> | undefined>(
    STORE_MUTATIONS,
    "readonly",
    (store) => store.get(key)
  );
  return res ?? null;
}

/**
 * Mengambil seluruh antrean mutasi terurut dari yang paling lama diperbarui.
 */
export async function listOfflineMutations(): Promise<OfflineMutationRecord[]> {
  if (!hasIndexedDB()) {
    return Array.from(memoryMutations.values()).sort((a, b) => a.updatedAt - b.updatedAt);
  }

  const items = await withStore<OfflineMutationRecord[]>(STORE_MUTATIONS, "readonly", (store) =>
    store.getAll()
  );
  return (items ?? []).sort((a, b) => a.updatedAt - b.updatedAt);
}

/**
 * Menghapus item antrean yang sudah berhasil disinkronkan.
 */
export async function removeOfflineMutation(key: string): Promise<void> {
  if (!hasIndexedDB()) {
    memoryMutations.delete(key);
    notifyQueueChanged();
    return;
  }

  await withStore(STORE_MUTATIONS, "readwrite", (store) => store.delete(key));
  notifyQueueChanged();
}

/**
 * Mencatat kegagalan sinkronisasi terakhir agar item tetap aman di antrean.
 */
export async function markOfflineMutationFailed(key: string, errorMessage: string): Promise<void> {
  const existing = await getOfflineMutation(key);
  if (!existing) return;

  const updated: OfflineMutationRecord = {
    ...existing,
    retryCount: existing.retryCount + 1,
    lastError: errorMessage,
  };

  if (!hasIndexedDB()) {
    memoryMutations.set(key, updated);
    notifyQueueChanged();
    return;
  }

  await withStore(STORE_MUTATIONS, "readwrite", (store) => store.put(updated));
  notifyQueueChanged();
}

/**
 * Menyimpan cache data baca agar halaman/modal tetap bisa dibuka saat offline.
 */
export async function setOfflineDataCache<TData>(key: string, data: TData): Promise<void> {
  const record: OfflineCacheRecord<TData> = {
    key,
    data,
    updatedAt: Date.now(),
  };

  if (!hasIndexedDB()) {
    memoryCache.set(key, record);
    return;
  }

  try {
    await withStore(STORE_CACHE, "readwrite", (store) => store.put(record));
  } catch {
    // Cache read-only bersifat opsional; jangan gagalkan alur utama
  }
}

/**
 * Mengambil cache data baca dari IndexedDB.
 */
export async function getOfflineDataCache<TData>(key: string): Promise<TData | null> {
  if (!hasIndexedDB()) {
    return (memoryCache.get(key)?.data as TData | undefined) ?? null;
  }

  try {
    const res = await withStore<OfflineCacheRecord<TData> | undefined>(
      STORE_CACHE,
      "readonly",
      (store) => store.get(key)
    );
    return res?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Menghapus seluruh isi antrean & cache (khusus keperluan pengujian).
 */
export async function clearOfflineSyncStorageForTests(): Promise<void> {
  memoryMutations.clear();
  memoryCache.clear();
  if (!hasIndexedDB()) {
    notifyQueueChanged();
    return;
  }
  await withStore(STORE_MUTATIONS, "readwrite", (store) => store.clear());
  await withStore(STORE_CACHE, "readwrite", (store) => store.clear());
  notifyQueueChanged();
}
