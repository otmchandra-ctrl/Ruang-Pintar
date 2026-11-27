# Spesifikasi Fitur: Perapian Cockpit & Navigasi Kontekstual SUPER_ADMIN

| Field | Nilai |
| --- | --- |
| **Slug** | `super-admin-cockpit-and-navigation` |
| **Status** | `active` |
| **Modul Terkait** | `shared/components/shell`, `shared/components/dashboard/role-views`, `modules/school` |
| **Dibuat** | 2026-11-26 |

---

## 1. Masalah & Tujuan

Saat masuk sebagai `SUPER_ADMIN`, batas peran antara **Operator Platform SaaS** dan **Administrator Operasional Satu Sekolah** tidak terlihat jelas:
- Menu sidebar selalu menampilkan rute operasional sekolah (seperti `Data Siswa`, `Struktur Kurikulum`, `Pusat Integrasi`, `CBT`, `Laporan`) meskipun `SUPER_ADMIN` belum memilih sekolah aktif (bahkan `/integrasi` otomatis me-redirect kembali jika `sekolah_id` kosong).
- Dashboard `SUPER_ADMIN` didominasi telemetri pasif (termasuk angka latensi/SLA statis), shortcut yang salah sasaran (`/rapor-siswa`, `/kelas-saya`), serta tabel sekolah tanpa tombol langsung untuk masuk/switch ke tenant atau kelola sekolah.
- Ketika `SUPER_ADMIN` sedang masuk ke konteks sekolah tertentu (`sekolah_aktif_id`), `AcademicShell` tidak menampilkan penanda mode dukungan sekolah dan tombol keluar ke Mode Platform.

Tujuan fitur ini adalah mempertegas peran `SUPER_ADMIN` sebagai **Operator Platform SaaS** dengan pemisahan kontekstual antara **Mode Platform SaaS** dan **Mode Dukungan Sekolah Aktif**, serta menjadikan Dashboard `SUPER_ADMIN` berorientasi aksi nyata.

---

## 2. Perilaku yang Diharapkan (Acceptance Criteria)

1. **Navigasi Kontekstual `SUPER_ADMIN`:**
   - `NavItem` mendukung flag `requiresActiveTenant?: boolean`.
   - `getFilteredNavigation(userRole, userCapabilities, isOwner, hasActiveTenant = false)` dan `getMobileBottomNavItems(..., hasActiveTenant = false)` memfilter item dengan `requiresActiveTenant: true` ketika `hasActiveTenant === false`.
   - Saat `SUPER_ADMIN` berada di **Mode Platform SaaS** (`hasActiveTenant === false`):
     - Sidebar hanya menampilkan `Dashboard` (`/dashboard`) dan `Sekolah & Lisensi` (`/sekolah`).
     - Mobile bottom nav hanya menampilkan `Beranda` (`/dashboard`) dan `Sekolah` (`/sekolah`).
   - Saat `SUPER_ADMIN` berada di **Mode Dukungan Sekolah Aktif** (`hasActiveTenant === true`):
     - Sidebar menampilkan menu platform plus grup **Operasional Sekolah Aktif** (`Pengumuman`, `Struktur Kurikulum & Rombel`, `Data Kesiswaan`, `Guru & Penugasan`, `CBT & Bank Ujian`, `Pusat Integrasi`, `Laporan & Analitik`).
     - Mobile bottom nav menampilkan `Beranda` (`/dashboard`), `Sekolah` (`/sekolah`), `Siswa` (`/data-siswa`), dan `Akademik` (`/struktur-akademik`).

2. **Indikator Konteks Sekolah Aktif di Shell (`AcademicShell`):**
   - Ketika `user.peran_dasar === "SUPER_ADMIN"` dan `Boolean(user.sekolah_id)` bernilai `true`, `AcademicShell` menampilkan banner konteks sekolah aktif di bagian atas area kerja dengan tombol **`Keluar ke Mode Platform`** (memanggil `clearActiveTenantAction()` dan menyegarkan sesi/rute).
   - Pada `DashboardPage` dan halaman terkait, nama sekolah aktif dapat diteruskan sebagai `activeSchoolName` jika tersedia.

3. **Dashboard Cockpit `SUPER_ADMIN` Minimalis, Informatif & Anti-Slop (Setara Dashboard Guru):**
   - Tata letak 12 kolom (8 kolom workspace utama di kiri + 4 kolom rail ringkas di kanan), tanpa strip gradien biru berlapis, tanpa kotak ikon warna-warni di kartu KPI, tanpa grafik SVG/gauge dekoratif raksasa.
   - **Hero Minimalis:**
     - Menampilkan mode aktif (`Platform Control • SaaS` atau `Mode Dukungan Sekolah • <Nama Sekolah>`), sapaan `Halo, <Nama>!`, 1 kalimat ringkasan status riil platform/tenant (jumlah sekolah, tenant yang butuh tindak lanjut trial/nonaktif), dan tombol aksi utama (`Kelola Sekolah & Lisensi` / `Keluar ke Mode Platform`).
     - Saat sedang masuk sekolah (`activeTenant`), menampilkan bar tautan cepat operasional sekolah (`Kurikulum`, `Data Siswa`, `Guru & Penugasan`, `CBT`, `Integrasi`, `Laporan`) tanpa menampilkan `/rapor-siswa` atau `/kelas-saya`.
   - **4 Kartu KPI Minimalis:** `Sekolah`, `Total Siswa`, `Perlu Tindak Lanjut` (trial hampir habis/kadaluarsa + nonaktif), dan `Estimasi MRR` (100% data riil DB, tanpa angka latensi/SLA statis).
   - **Tabel Daftar Sekolah Langsung Aksi:** Menampilkan nama sekolah, jenjang/NPSN, status lisensi/trial, skala (siswa/guru), serta tombol **`Masuk`** / **`Keluar`** dan **`Kelola`**.
   - **Rail Kanan (`Ringkasan Platform` & `Log Audit`):**
     - `Ringkasan Platform`: daftar ringkas sesi KBM, persentase kehadiran tercatat, ujian CBT, login gagal 24 jam, storage/AI, serta mini bar aktivitas mingguan 6 hari.
     - `Log Audit`: filter ringkas + 5 baris terakhir dengan modal detail JSON snapshot.

---

## 3. Batasan Non-Fungsional & Keamanan

- Tidak mengubah mekanisme otorisasi server-side (`switchActiveTenantAction`, `clearActiveTenantAction`, `access-control.ts`).
- Tidak mengubah skema database atau migrasi Prisma.
- Mematuhi Academic Glass UI v1.2, mode terang/malam, responsivitas mobile-first, dan aturan anti-slop.
