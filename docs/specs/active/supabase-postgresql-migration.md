# Spesifikasi Migrasi PostgreSQL Supabase

| Field | Nilai |
| --- | --- |
| **Feature** | Migrasi persistence produksi dari SQLite ke PostgreSQL Supabase |
| **Status** | `active` |
| **Scope** | Prisma schema, migrasi produksi, adapter runtime, pemindahan data dan berkas privat, serta operasi Vercel |

## 1. Tujuan

Menyiapkan Ruang Pintar agar dapat memakai PostgreSQL terkelola Supabase sebagai sumber data persisten ketika dijalankan di Vercel, sambil mempertahankan SQLite sebagai sumber data migrasi dan jalur pengembangan lokal bila masih dibutuhkan.

## 2. Invariants

- Seluruh 78 model Prisma dan relasinya dipertahankan tanpa kehilangan data.
- ID ULID, domain invariants akademik, dan batas tenant `sekolah_id` tidak berubah.
- Migrasi SQLite yang pernah diterapkan tidak diubah isi SQL-nya.
- Relasi opsional yatim ditransformasikan pada salinan target mengikuti `onDelete: SetNull`, dilaporkan; sumber SQLite tidak diubah. Relasi wajib yatim menghentikan transfer.
- Tidak ada cutover ke produksi sebelum salinan data diverifikasi dan pemilik menyetujui rilis.
- Pemindahan data dapat diulang dengan aman hanya ke target kosong; proses menolak database target berisi data agar tidak menimpa data produksi.
- Rahasia koneksi dan data siswa tidak masuk Git atau log migrasi.
- CBT write retry tidak mengulang operasi yang telah berhasil, dan pola antrian SQLite tidak dianggap sebagai jaminan konkurensi PostgreSQL.

## 3. Kriteria Penerimaan

1. Prisma dapat menghasilkan client PostgreSQL dari skema lengkap dan menyediakan migrasi baseline PostgreSQL terpisah.
2. Client aplikasi berjalan dengan connection string Supabase PostgreSQL dan tidak menjalankan PRAGMA SQLite.
3. Skrip migrasi membaca SQLite sumber, menulis data ke PostgreSQL target dengan urutan relasi yang benar, menolak target yang tidak kosong, dan melaporkan jumlah baris per tabel tanpa mencetak data personal.
4. Skrip verifikasi membandingkan jumlah baris tabel dan memeriksa foreign-key orphan sebelum cutover.
5. Panduan deploy menjelaskan environment Vercel, migrasi skema, cutover, backup, rollback, dan keterbatasan file storage lokal.
6. Migrasi data nyata hanya dapat dilanjutkan dengan kredensial sumber/target yang diberikan operator dan setelah backup diverifikasi.
7. Pencarian yang saat ini case-insensitive di SQLite mempertahankan perilaku yang sama di PostgreSQL.
8. File baru memakai Supabase Storage privat ketika `STORAGE_PROVIDER=SUPABASE`; otorisasi file tetap dilakukan aplikasi sebelum konten dikirim.
9. File lokal lama dapat dipindahkan dengan checksum yang cocok sebelum metadata diarahkan ke Supabase; salinan lokal tetap tersimpan sebagai rollback.

## 4. Out of Scope

- Membuat atau mengakses project Supabase tanpa kredensial operator.
- Men-deploy aplikasi ke Vercel atau mengganti DNS.
- Menghapus database SQLite sumber.
- Membuka akses publik langsung ke file sekolah.

## 5. Risiko

- SQLite dan PostgreSQL berbeda pada sintaks SQL, urutan/semantik constraint, dan perilaku konkurensi.
- Pencarian Prisma `contains` dapat berubah menjadi case-sensitive pada PostgreSQL; query pencarian perlu diaudit.
- Kegagalan menyalin salah satu tabel dapat membuat target tidak lengkap; target harus dibuang dan diisi ulang sebelum cutover.
- Koneksi serverless memerlukan connection pool yang sesuai.
- Berkas yang disimpan di disk lokal tidak ikut tersalin saat database dipindah.
- Supabase Storage bucket wajib dibuat privat sebelum upload; service role key harus tetap server-only.
