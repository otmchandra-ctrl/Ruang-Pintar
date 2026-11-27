# Rencana Implementasi: Offline Queue & Auto-Sync Presensi dan Nilai

| Field | Nilai |
| --- | --- |
| **Slug** | `offline-sync-attendance-grades` |
| **Spec** | [offline-sync-attendance-grades.md](file:///c:/laragon/www/Ruang-Pintar/docs/specs/active/offline-sync-attendance-grades.md) |
| **Status** | `active` |

---

## 1. Urutan Tugas

1. **Infrastruktur Offline Queue & Cache (`src/shared/lib/offline-sync-queue.ts`):**
   - Helper `IndexedDB` untuk `mutations` queue (enqueue/coalesce, list, remove, updateError) dan `dataCache` (set/get).
   - Safe fallback jika `indexedDB` tidak tersedia (SSR / test environment).
   - Custom event `ruang-pintar:offline-queue-changed` untuk reaktivitas UI.

2. **Sync Runner (`src/shared/lib/offline-sync-runner.ts`):**
   - `syncOfflineMutations()` dengan concurrency lock.
   - Handler untuk `SESSION_ATTENDANCE` (`saveSessionAttendanceAction`) dan `ASSESSMENT_GRADES` (`saveAssessmentGradesAction` + optional `publishAssessmentAction`).
   - Deteksi network error (`isLikelyNetworkError`) untuk fallback offline.

3. **Integrasi UI Modul:**
   - `src/modules/attendance/presentation/session-attendance-modal.tsx`: cache read + overlay pending + offline enqueue on submit.
   - `src/modules/assessment/presentation/input-grades-modal.tsx`: cache read + overlay pending + offline enqueue on save/publish.
   - `src/shared/components/pwa/pwa-register.tsx`: auto-sync saat event `online`, indikator antrean tertunda, dan tombol sinkronisasi manual.

4. **Verifikasi & Quality Gates:**
   - Unit test `src/test/pwa/offline-sync.test.ts` (queue coalesce, sync runner, error retention).
   - Jalankan `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, dan `npm run build`.

---

## 2. Rollback

Seluruh perubahan bersifat aditif di sisi client (`src/shared/lib/offline-sync-*.ts`) dan fallback kondisional pada 3 komponen UI (`session-attendance-modal.tsx`, `input-grades-modal.tsx`, `pwa-register.tsx`) tanpa perubahan skema database. Rollback dapat dilakukan dengan mengembalikan file-file tersebut ke versi sebelumnya.
