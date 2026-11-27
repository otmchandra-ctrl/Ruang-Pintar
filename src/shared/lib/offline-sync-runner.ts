/**
 * Ruang Pintar — Offline Mutation Sync Runner
 *
 * Mengeksekusi ulang antrean mutasi lokal (presensi & nilai) ke Server Actions resmi
 * ketika koneksi internet kembali pulih.
 */

import { saveSessionAttendanceAction } from "@/app/actions/attendance-actions";
import {
  publishAssessmentAction,
  saveAssessmentGradesAction,
} from "@/app/actions/assessment-actions";
import type { SaveSessionAttendanceInput } from "@/modules/attendance/domain/attendance-types";
import type { BulkSaveGradesInput } from "@/modules/assessment/domain/assessment-types";
import {
  listOfflineMutations,
  markOfflineMutationFailed,
  OfflineMutationRecord,
  removeOfflineMutation,
} from "./offline-sync-queue";

export interface OfflineSyncResult {
  syncedCount: number;
  failedCount: number;
  remainingCount: number;
  errors: string[];
}

let activeSyncPromise: Promise<OfflineSyncResult> | null = null;

/**
 * Mendeteksi apakah error disebabkan oleh koneksi jaringan terputus/offline.
 */
export function isLikelyNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("load failed") ||
    msg.includes("fetch failed") ||
    msg.includes("err_internet_disconnected")
  );
}

async function executeMutation(item: OfflineMutationRecord): Promise<{
  success: boolean;
  message: string;
}> {
  if (item.type === "SESSION_ATTENDANCE") {
    const res = await saveSessionAttendanceAction(item.payload as SaveSessionAttendanceInput);
    return { success: res.success, message: res.message };
  }

  if (item.type === "ASSESSMENT_GRADES") {
    const payload = item.payload as BulkSaveGradesInput;
    const penugasanId = item.meta?.penugasanId ?? "";
    const saveRes = await saveAssessmentGradesAction(payload, penugasanId);
    if (!saveRes.success) {
      return { success: false, message: saveRes.message };
    }

    if (item.meta?.shouldPublish) {
      const pubRes = await publishAssessmentAction(
        {
          asesmen_id: payload.asesmen_id,
          target_audience: "SEMUA",
        },
        penugasanId
      );
      if (!pubRes.success) {
        return { success: false, message: pubRes.message };
      }
    }

    return { success: true, message: saveRes.message };
  }

  return { success: false, message: `Tipe mutasi tidak dikenal: ${String(item.type)}` };
}

/**
 * Menjalankan sinkronisasi seluruh antrean mutasi offline secara berurutan.
 * Menggunakan lock agar tidak terjadi eksekusi paralel ganda.
 */
export async function syncOfflineMutations(): Promise<OfflineSyncResult> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async (): Promise<OfflineSyncResult> => {
    const items = await listOfflineMutations();
    if (items.length === 0) {
      return { syncedCount: 0, failedCount: 0, remainingCount: 0, errors: [] };
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return {
        syncedCount: 0,
        failedCount: 0,
        remainingCount: items.length,
        errors: ["Perangkat masih offline."],
      };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        break;
      }

      try {
        const res = await executeMutation(item);
        if (res.success) {
          await removeOfflineMutation(item.key);
          syncedCount += 1;
        } else {
          await markOfflineMutationFailed(item.key, res.message);
          failedCount += 1;
          errors.push(`${item.label}: ${res.message}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal menghubungi server.";
        await markOfflineMutationFailed(item.key, message);
        failedCount += 1;
        errors.push(`${item.label}: ${message}`);
        if (isLikelyNetworkError(err)) {
          break;
        }
      }
    }

    const remaining = await listOfflineMutations();
    return {
      syncedCount,
      failedCount,
      remainingCount: remaining.length,
      errors,
    };
  })();

  try {
    return await activeSyncPromise;
  } finally {
    activeSyncPromise = null;
  }
}
