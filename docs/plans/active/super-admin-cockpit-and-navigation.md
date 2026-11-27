# Rencana Implementasi: Perapian Cockpit & Navigasi Kontekstual SUPER_ADMIN

| Field | Nilai |
| --- | --- |
| **Slug** | `super-admin-cockpit-and-navigation` |
| **Spec** | [super-admin-cockpit-and-navigation.md](file:///c:/laragon/www/Ruang-Pintar/docs/specs/active/super-admin-cockpit-and-navigation.md) |
| **Status** | `active` |

---

## 1. Urutan Tugas

1. **Konfigurasi Navigasi & Mobile Bottom Nav (`navigation-config.ts`, `mobile-bottom-nav.tsx`):**
   - Tambah `requiresActiveTenant?: boolean` pada `NavItem` dan parameter `hasActiveTenant: boolean = false` pada `getFilteredNavigation`.
   - Kelompokkan item `SUPER_ADMIN` menjadi menu Platform SaaS (selalu tampil) dan `Operasional Sekolah Aktif` (`requiresActiveTenant: true`, hanya tampil saat ada tenant aktif).
   - Perbarui `getMobileBottomNavItems` untuk `SUPER_ADMIN` agar adaptif terhadap `hasActiveTenant`.

2. **Shell Konteks Tenant Aktif (`academic-shell.tsx`, `sidebar.tsx`, `mobile-drawer.tsx`, `src/app/dashboard/page.tsx`):**
   - Teruskan `hasActiveTenant = Boolean(user.sekolah_id)` ke `Sidebar`, `MobileDrawer`, dan `MobileBottomNav`.
   - Tambahkan prop opsional `activeSchoolName?: string | null` pada `AcademicShell` dan tampilkan banner Mode Dukungan Sekolah Aktif untuk `SUPER_ADMIN` dengan tombol `Keluar ke Mode Platform` (`clearActiveTenantAction`).

3. **Dashboard Cockpit `SUPER_ADMIN` (`super-admin-dashboard.tsx`, `super-admin-dashboard-view.tsx`):**
   - Query data riil tambahan: `activeTenant` (jika `user.sekolah_id` terisi), jumlah sekolah `suspended`, daftar sekolah dengan `trial_berakhir_pada` untuk menghitung `expiringTrialsCount`, serta hapus angka latensi/SLA hardcoded.
   - Refactor `SuperAdminDashboardView` menjadi Action-First Platform Cockpit: banner konteks mode, antrean prioritas platform, aksi cepat kontekstual tanpa `/rapor-siswa` & `/kelas-saya`, tabel tenant dengan tombol langsung `Masuk` / `Keluar` & `Kelola`, serta ringkasan KBM + Audit Trail.

4. **Unit Test & Verifikasi Quality Gates:**
   - Perbarui `src/test/shell/navigation-config.test.ts`, `src/test/shell/mobile-bottom-nav.test.tsx`, `src/test/shell/academic-shell.test.tsx`, dan `src/test/shell/dashboard-views.test.tsx`.
   - Jalankan test suite terkait, `typecheck`, `lint`, `prettier --check`, dan `npm run build`.
   - Setelah verifikasi lulus, pindahkan spec & plan ke `docs/specs/done/` dan `docs/plans/done/`.

---

## 2. Rollback

Seluruh perubahan hanya berada di layer presentasi shell/navigasi/dashboard dan unit tests tanpa perubahan skema database maupun API kontrak backend. Rollback dapat dilakukan dengan mengembalikan file-file UI & test terkait ke commit sebelumnya.
