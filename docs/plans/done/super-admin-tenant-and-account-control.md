# Rencana Implementasi: Kontrol Tenant Trial & Akun Pengguna Platform (SUPER_ADMIN)

| Field | Nilai |
| --- | --- |
| **Slug** | `super-admin-tenant-and-account-control` |
| **Spec Terkait** | [super-admin-tenant-and-account-control.md](file:///C:/laragon/www/Ruang-Pintar/docs/specs/active/super-admin-tenant-and-account-control.md) |
| **Status** | `active` |

---

## 1. Urutan Tugas

1. **Test Suite Regresi & Perilaku (`RED`):**
   - Buat `src/test/school/platform-control-service.test.ts` menguji:
     - Otorisasi & guard `deleteFreemiumTenant` (menolak `SEKOLAH`, menolak salah konfirmasi nama, menolak jika sedang aktif di-impersonate, menghapus seluruh anak tenant `FREEMIUM` beserta pengguna eksklusif tenant tersebut).
     - `resetPlatformUserPassword` (mereset password, mencabut `SesiPengguna`, menolak target tak ditemukan).
     - `deletePlatformUser` (menolak hapus `SUPER_ADMIN`, menolak jika punya transaksi/histori guru, berhasil menghapus akun trial kosong).
   - Perbarui `src/test/school/school-views.test.tsx` atau buat `src/test/school/super-admin-directory-control.test.tsx` untuk menguji tab **Direktori Sekolah** & **Akun Guru Mandiri & Pengguna**, modal **Reset Password**, dan modal **Hapus Tenant Trial**.

2. **Backend Service & Server Actions:**
   - Perbarui `IdentityService.adminResetPassword` (`src/shared/infrastructure/auth/identity-service.ts`) agar mencabut `SesiPengguna` aktif saat password direset admin.
   - Buat `src/modules/school/application/platform-control-service.ts`:
     - `listPlatformDirectoryData()` (query sekolah beserta ringkasan owner + daftar akun pengguna non-`SUPER_ADMIN`).
     - `resetPlatformUserPassword(...)`
     - `deleteFreemiumTenant(...)`
     - `deletePlatformUser(...)`
   - Buat `src/app/actions/platform-admin-actions.ts` dengan Server Actions:
     - `resetPlatformUserPasswordAction`
     - `deleteFreemiumTenantAction`
     - `deletePlatformUserAction`

3. **UI `/sekolah` (`src/app/sekolah/page.tsx` & `src/modules/school/presentation/`):**
   - Muat data `schools` (termasuk `ownerSummary`) dan `platformUsers` di `src/app/sekolah/page.tsx` ketika `isSuperAdmin && !searchParams?.sekolahId`.
   - Tambahkan tab switcher di `SuperAdminSchoolDirectoryView`:
     - Tab **Direktori Sekolah & Tenant**: tampilkan info pemilik di kolom sekolah, tombol aksi **Reset Sandi** (jika ada pemilik), dan tombol **Hapus Trial** (jika `tipe_lisensi === "FREEMIUM"`).
     - Tab **Akun Guru Mandiri & Pengguna**: tabel/kartu responsif seluruh akun lintas tenant dengan filter & pencarian, tombol **Reset Password** dan **Hapus Akun**.
   - Tambahkan modal **Reset Password Pengguna** (dengan opsi password kustom atau default + hasil kredensial siap salin) dan modal **Konfirmasi Hapus Tenant Trial** (wajib ketik nama tenant) & **Konfirmasi Hapus Akun**.

4. **Verifikasi Menyeluruh:**
   - `npm run format:check` / `npx prettier --write`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test` (seluruh Vitest suite)
   - `npm run build`

---

## 2. Rollback

- Perubahan hanya menambah service/action/UI baru pada `modules/school`, `app/actions/platform-admin-actions.ts`, `app/sekolah/page.tsx`, dan pencabutan sesi di `identity-service.ts` (tanpa migrasi DB). Rollback cukup mengembalikan berkas kode yang diubah via `git checkout`.
