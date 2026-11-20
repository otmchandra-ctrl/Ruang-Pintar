# SPEC: Progressive Web App (PWA) Ruang Pintar

| Field | Nilai |
| --- | --- |
| **Feature Name** | Progressive Web App (PWA) Foundation & Offline Resilience |
| **Status** | `completed (TEST PASSED -> READY FOR HUMAN REVIEW)` |
| **Owner** | Fikran Engineering / Ruang Pintar Core |
| **Related Documents** | `docs/05-SYSTEM-ARCHITECTURE.md`, `docs/07-UI-UX-DESIGN-SYSTEM.md`, `AGENTS.md`, `docs/SECURITY.md` |

---

## 1. Problem Statement & Background

Ruang Pintar saat ini beroperasi sebagai web application responsive (Next.js 16 App Router). Banyak pengguna di lapangan (guru, siswa, dan staf sekolah) mengakses aplikasi melalui smartphone atau tablet dengan kondisi jaringan sekolah yang fluktuatif atau saat berada di area dengan koneksi internet terbatas.

Dengan mengubah Ruang Pintar menjadi Progressive Web App (PWA):
1. Pengguna dapat menginstal aplikasi ke layar utama (*Add to Home Screen*) perangkat mobile maupun desktop layaknya native app.
2. Membuka aplikasi terasa instan dan cepat karena aset statis, font, dan shell aplikasi di-cache secara cerdas.
3. Menghadirkan penanganan graceful saat koneksi internet terputus (halaman offline ramah pengguna bergaya Academic Glass UI).
4. Menjaga integritas data akademik dan ujian CBT dengan kebijakan caching presisi (zero stale exam data, strict network-only untuk API dan CBT).

---

## 1.1. Keputusan Desain & Arsitektur (Disepakati)

1. **Service Worker Architecture:** Native Vanilla Service Worker (`public/sw.js` + client loader) tanpa library pihak ketiga. Hal ini menjamin stabilitas 100% pada Next.js 16 (Turbopack) & React 19 tanpa potensi konflik bundler atau breaking changes dependency.
2. **Install UX & Network Status:** Menggunakan komponen subtle Academic Glass banner dan floating status pill online/offline di bagian bawah/atas aplikasi, serta tombol "Pasang Aplikasi" yang hanya muncul saat event `beforeinstallprompt` aktif dan didukung perangkat.
3. **Strict Caching Invariant:**
   - Static Assets (`/_next/static/*`, `/images/*`, `/brand/*`, `/icons/*`, fonts): Cache-First / Stale-While-Revalidate.
   - Dynamic Navigation (HTML): Network-First dengan fallback ke `/offline`.
   - CBT Exam Engine (`/cbt/*`, `/cbt-ujian/*`), Auth (`/login`, `/api/auth/*`), dan semua Server Actions POST: **`NetworkOnly` (Strict Non-Negotiable)**.

---

## 2. Invariant Domain & Security Guardrails

Sesuai aturan baku tak terlanggar di `AGENTS.md` dan `docs/SECURITY.md`:
1. **Zero-Data Loss & CBT Engine Integrity**:
   - Seluruh alur ujian CBT (`/cbt/*`, `/cbt-ujian/*`, submit jawaban, sinkronisasi token ujian, proctor socket/polling) **DILARANG KERAS** di-cache oleh Service Worker atau disimulasikan offline tanpa otorisasi server.
   - Kebijakan Service Worker untuk `/cbt/*`, `/cbt-ujian/*`, `/api/*`, dan mutasi Server Actions adalah **`NetworkOnly`**.
2. **Server-Side Authorization & Anti-Data Leakage**:
   - Cache Service Worker tidak boleh menyimpan data identitas atau payload sensitif antar tenant.
   - Rute autentikasi (`/login`, `/actions/auth-*`) wajib **`NetworkOnly`**.
3. **Graceful Offline Fallback**:
   - Bila navigasi halaman gagal karena hilangnya jaringan internet, tampilkan halaman `/offline` yang jernih dengan tombol coba lagi (*Retry*), bukan pesan error browser bawaan (seperti *No Internet / Dino screen*).

---

## 3. Scope & Acceptance Criteria

### 3.1. In-Scope
- **Web App Manifest**: Menggunakan standar Next.js App Router (`src/app/manifest.ts` atau `manifest.webmanifest`) dengan metadata lengkap:
  - `name`: Ruang Pintar — School Digital Operating Platform
  - `short_name`: Ruang Pintar
  - `theme_color`: `#0F172A` (Academic Glass dark tone)
  - `background_color`: `#090D16`
  - `display`: `standalone`
  - `start_url`: `/`
  - `orientation`: `portrait-primary`
  - `categories`: `["education", "productivity"]`
- **PWA Asset Generation**:
  - Icon 192x192 PNG (standard)
  - Icon 512x512 PNG (standard)
  - Maskable icon 192x192 & 512x512
  - Apple touch icon (180x180 PNG)
  - Favicon (`favicon.ico` dan/atau PNG)
- **Service Worker (`public/sw.js`)**:
  - Lifecycle: `install`, `activate`, `fetch`.
  - Cache Versioning (`ruang-pintar-static-v1`).
  - Cache static core: font Google/Lexend, manifest, favicon, logo brand, dan halaman fallback `/offline`.
  - Routing strategy:
    - Static Assets (`/_next/static/*`, `/images/*`, `/brand/*`): Cache-First / Stale-While-Revalidate.
    - SSR HTML Navigation: Network-First dengan fallback ke `/offline`.
    - API / Actions / CBT Engine: Strict Network-Only.
- **Client Service Worker Registration & Install Hook**:
  - Komponen client `src/shared/components/pwa/pwa-register.tsx` di `src/app/layout.tsx`.
  - Academic Glass UI Online/Offline status indicator & Install Prompt helper.
- **Offline Screen**:
  - Halaman `src/app/offline/page.tsx` berdesain Academic Glass UI dengan status koneksi live dan tombol periksa ulang koneksi.

### 3.2. Out-of-Scope (Fase Ini)
- Fitur pengerjaan ujian CBT offline tanpa koneksi (memerlukan enkripsi snapshot lokal khusus & sync engine kompleks di tahap lanjutan).
- Web Push Notifications (memerlukan server VAPID key & web push gateway tersendiri).

---

## 4. Acceptance Criteria Checklist

- [x] **AC-01:** Web App Manifest terdeteksi valid oleh browser / Lighthouse PWA check dengan `start_url`, `display: standalone`, icon 192x192, dan 512x512.
- [x] **AC-02:** Service Worker terdaftar dengan sukses di browser pada scope `/`.
- [x] **AC-03:** Aplikasi dapat diinstal ke home screen (A2HS) pada browser mobile (Chrome Android, Safari iOS) dan desktop (Chrome/Edge).
- [x] **AC-04:** Saat jaringan terputus (offline), navigasi ke halaman yang belum di-cache menampilkan halaman `/offline` berdesain Academic Glass UI.
- [x] **AC-05:** Permintaan ke `/cbt/*`, `/api/*`, dan Server Actions POST selalu menggunakan `NetworkOnly` (tidak pernah melayani jawaban ujian usang dari cache).
- [x] **AC-06:** Seluruh suite verifikasi canonical (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`) lulus 100% tanpa regresi.
