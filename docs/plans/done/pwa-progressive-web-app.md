# PLAN: Progressive Web App (PWA) Implementation

| Field | Nilai |
| --- | --- |
| **Feature** | Progressive Web App (PWA) Foundation & Offline Resilience |
| **Status** | `completed (TEST PASSED -> READY FOR HUMAN REVIEW)` |
| **Spec Reference** | `docs/specs/active/pwa-progressive-web-app.md` |
| **Operating Mode** | Complex Route (PLAN → ARCHITECTURE → BUILD → TEST → DEPLOY GATE) |

---

## 1. Task Breakdown & Execution Steps

### Step 1: Icon & Asset Generation [COMPLETED]
- [x] Generator aset ikon PWA berbasis `public/brand/ruang-pintar-mark.png`:
  - `public/icons/icon-192x192.png`
  - `public/icons/icon-512x512.png`
  - `public/icons/icon-maskable-192x192.png`
  - `public/icons/icon-maskable-512x512.png`
  - `public/icons/apple-touch-icon.png` (180x180)
  - `public/favicon.ico`

### Step 2: Next.js Web App Manifest [COMPLETED]
- [x] Implementasikan `src/app/manifest.ts` menggunakan API metadata resmi Next.js App Router (`MetadataRoute.Manifest`).
- [x] Static mirror `public/manifest.json`.
- [x] Perbarui `src/app/layout.tsx` untuk menyertakan `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, dan ikon Apple.

### Step 3: Service Worker Caching Engine [COMPLETED]
- [x] Buat `public/sw.js` dengan strategi:
  - Cache versioning: `rp-static-v1` dan `rp-pages-v1`.
  - Core cache pre-caching: `/offline`, icon brand, favicon, font.
  - Strict exclusion: `/cbt/*`, `/cbt-ujian/*`, `/api/*`, `/login`, dan method non-GET selalu diarahkan ke `NetworkOnly`.
  - Stale-While-Revalidate untuk aset statis Next.js (`/_next/static/`).
  - Network-First dengan fallback ke `/offline` untuk request HTML navigasi.

### Step 4: Academic Glass Offline Fallback Page [COMPLETED]
- [x] Buat `src/app/offline/page.tsx` dengan desain Academic Glass UI:
  - Status indikator koneksi terputus.
  - Tombol aksi "Coba Hubungkan Kembali" (Reload) dan instruksi singkat.
  - Jaminan keamanan data CBT & presensi saat offline.

### Step 5: Service Worker Registration & Online/Offline Bar [COMPLETED]
- [x] Buat komponen `src/shared/components/pwa/pwa-register.tsx` (Client Component):
  - Registrasi Service Worker di `window.addEventListener('load')`.
  - Hook koneksi berbasis `useSyncExternalStore` (React 19 idiomatic).
  - Floating pill offline warning dan toast "Kembali Terhubung".
  - Install prompt handler (`beforeinstallprompt`) dengan banner Academic Glass.
- [x] Pasang komponen tersebut di `src/app/layout.tsx`.

### Step 6: Test Suite & Verification (Risk-Based Verification) [COMPLETED]
- [x] Unit & integration test untuk:
  - Manifest generation test (`src/test/pwa/pwa-manifest.test.ts` - 4 tests PASS).
  - Service worker exclusion invariant test (`src/test/pwa/pwa-service-worker.test.ts` - 5 tests PASS).
  - Offline view rendering test (`src/test/pwa/offline-page.test.tsx` - 3 tests PASS).
  - PWA registration & connectivity monitor (`src/test/pwa/pwa-register.test.tsx` - 3 tests PASS).
- [x] Canonical Quality Gates:
  - `npm run typecheck` (0 errors)
  - `npm run lint` (0 errors)
  - `npm run format:check` (100% clean)
  - `npm run test` (151 test files, 979 tests PASS)
  - `npm run build` (57 routes compiled, 0 errors)

---

## 2. Rollback Strategy

Bila terjadi kendala pada caching service worker:
1. Naikkan versi cache di `sw.js` atau set unregister script pada `pwa-register.tsx`.
2. Hapus file `public/sw.js` dan revert perubahan di `src/app/layout.tsx`.
3. Aplikasi akan langsung kembali berfungsi sebagai web app standar tanpa cache worker.
