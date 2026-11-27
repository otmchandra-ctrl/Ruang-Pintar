# Spesifikasi Fitur: Kontrol Tenant Trial & Akun Pengguna Platform (SUPER_ADMIN)

| Field | Nilai |
| --- | --- |
| **Slug** | `super-admin-tenant-and-account-control` |
| **Status** | `active` |
| **Modul Terkait** | `modules/school`, `shared/infrastructure/auth`, `app/actions`, `app/sekolah` |
| **Dibuat** | 2026-11-27 |

---

## 1. Masalah & Tujuan

Pada tampilan platform **Direktori Sekolah & Lisensi Multi-Tenant** (`/sekolah`), `SUPER_ADMIN` menghadapi beberapa kendala operasional saat mengelola pendaftar gratis (`FREEMIUM` / Guru Mandiri):
1. Beberapa baris tenant tampil identik (`Guru Mandiri • Tanpa NPSN • 0 Siswa • 0/1 Guru`) tanpa menampilkan informasi pemilik akun (nama, username, email).
2. `SUPER_ADMIN` tidak bisa langsung mereset kata sandi guru mandiri yang lupa password dari `/sekolah` (harus melakukan impersonasi masuk ke tiap tenant satu per satu).
3. `SUPER_ADMIN` hanya memiliki tombol Suspend (`Aktif`/`Suspended`), belum memiliki aksi aman untuk **menghapus permanen tenant trial (`FREEMIUM`)** yang kosong/uji coba maupun **menghapus akun pengguna non-admin** langsung dari antarmuka platform.
4. Saat password direset oleh admin (`identityService.adminResetPassword`), sesi login lama (`SesiPengguna`) belum dicabut otomatis.

Tujuan fitur ini adalah melengkapi halaman `/sekolah` menjadi pusat kontrol platform `SUPER_ADMIN` yang fungsional, aman, dan diaudit penuh tanpa mengubah alur navigasi sidebar yang sudah ada (`["dashboard", "saas-schools"]`).

---

## 2. Perilaku yang Diharapkan (Acceptance Criteria)

1. **Informasi Pemilik Tenant pada Direktori Sekolah (`/sekolah`):**
   - Query `/sekolah` menyertakan ringkasan pemilik/owner tenant (dari `KeanggotaanSekolah` `is_owner = true` atau akun `TEACHER`/`SCHOOL_STAFF` utama pada tenant tersebut).
   - Setiap baris tabel & kartu mobile menampilkan identitas pemilik (nama + email/username) atau badge `Tanpa Akun Pemilik` jika tenant tidak memiliki pengguna/guru.

2. **Tab Global di `/sekolah`:**
   - Tab 1: **Direktori Sekolah & Tenant** (tabel tenant + tombol `Masuk`, `Lisensi`, `Reset Sandi Pemilik` bila ada akun pemilik, serta tombol `Hapus Trial` khusus tenant `FREEMIUM`).
   - Tab 2: **Akun Guru Mandiri & Pengguna** (direktori akun `Pengguna` non-`SUPER_ADMIN` lintas tenant dengan pencarian nama/username/email/sekolah, filter status/peran, aksi **Reset Password**, **Buka Kunci/Aktifkan**, dan **Hapus Akun**).

3. **Reset Password Lintas Tenant (`resetPlatformUserPasswordAction`):**
   - Hanya `SUPER_ADMIN` yang diizinkan.
   - Menggunakan `identityService.adminResetPassword` (validasi kebijakan password, reset `percobaan_login_gagal: 0`, buka status `TERKUNCI`, set `harus_ganti_password: true`, audit `LogAudit`).
   - Mencabut seluruh `SesiPengguna` aktif milik target agar wajib login ulang menggunakan kata sandi sementara baru.
   - Menampilkan modal **Salin Kredensial** berisi `username`, `email`, dan `temporaryPassword`.

4. **Hapus Permanen Tenant Trial (`deleteFreemiumTenantAction`):**
   - Hanya `SUPER_ADMIN` yang diizinkan.
   - **Guard Ketat:** Hanya tenant bertipe `FREEMIUM` yang boleh dihapus permanen; tenant `SEKOLAH` (berlisensi penuh) wajib ditolak.
   - Ditolak jika tenant sedang aktif di-impersonate oleh `SUPER_ADMIN` (`actor.sekolah_id === sekolahId`).
   - Wajib menyertakan konfirmasi nama tenant (`confirmName`) yang cocok persis sebelum eksekusi.
   - Menghapus seluruh data anak tenant dalam satu transaksi atomik secara topologis (CBT, Monitoring, Asesmen, Tugas/Materi/Jurnal, Jadwal/Sesi, Penugasan/Struktur, Wali, Siswa/Rombel, Guru/Mapel, Integrasi/Webhook, Komunikasi/Notifikasi, `LanggananTenant`, `KeanggotaanSekolah`, `Pengguna` yang hanya menjadi anggota tenant tersebut dan bukan `SUPER_ADMIN`), lalu mencatat `LogAudit` dengan `sekolah_id: null`.

5. **Hapus Akun Pengguna (`deletePlatformUserAction`):**
   - Hanya `SUPER_ADMIN` yang diizinkan; dilarang menghapus akun sendiri atau akun `SUPER_ADMIN` lain.
   - Memeriksa ketergantungan restriktif (`TransaksiLangganan`, `RiwayatEksporLaporan`, atau `Guru` dengan histori akademik di sekolah aktif) dan mengembalikan pesan terstruktur bila tidak dapat dihapus langsung.
   - Jika aman, mencabut sesi, membersihkan relasi identitas/notifikasi/keanggotaan, profil `Guru` kosong tanpa histori, lalu menghapus `Pengguna` dan mencatat `LogAudit`.

---

## 3. Batasan Keamanan & Non-Fungsional

- Server-side authorization (`requireAuth()` + verifikasi eksplisit `user.peran_dasar === "SUPER_ADMIN"`).
- Kompatibel penuh dengan SQLite (development/testing) dan PostgreSQL/Supabase (production) melalui Prisma ORM.
- Tidak mengubah skema Prisma atau menambah migrasi database.
- Mematuhi Academic Glass UI, mode terang/malam, responsivitas mobile-first, dan kontrak test navigasi `SUPER_ADMIN`.
