# Rencana Migrasi PostgreSQL Supabase

| Field | Nilai |
| --- | --- |
| **Feature** | Migrasi persistence produksi dari SQLite ke PostgreSQL Supabase |
| **Status** | `active` |

## Urutan Pengerjaan

1. Pertahankan skema dan riwayat migrasi SQLite yang sudah ada sebagai artefak sumber migrasi; jangan rewrite migrasi lama.
2. Siapkan skema PostgreSQL Prisma dan baseline PostgreSQL yang membangun seluruh struktur dari keadaan kosong.
3. Ubah inisialisasi database dan retry CBT agar tidak menjalankan perintah SQLite pada runtime PostgreSQL.
4. Tambahkan utilitas migrasi satu kali dari SQLite ke PostgreSQL: validasi koneksi, tolak target berisi data, salin model menurut dependensi, terapkan `SetNull` yang telah dinyatakan pada relasi opsional yatim, dan tampilkan ringkasan jumlah baris tanpa isi data pribadi.
5. Tambahkan utilitas pemeriksaan pascamigrasi untuk jumlah data dan konsistensi foreign key.
6. Tambahkan adapter Supabase Storage privat untuk write/read/delete dan migrator lokal-ke-storage dengan checksum; pertahankan otorisasi API yang sudah ada.
7. Perbarui environment example, perintah npm, dan runbook deploy Vercel/Supabase termasuk langkah bucket privat.
8. Jalankan verifikasi statis dan build yang diizinkan repo. Jangan menjalankan data migration tanpa URL sumber/target dan backup operator.
9. Serahkan status `READY FOR HUMAN REVIEW`; cutover/deploy produksi menunggu kredensial project dan otorisasi eksplisit.

## Verification Commands

```bash
npx prisma validate --schema prisma/schema.prisma
npx prisma validate --schema prisma/schema.sqlite.prisma
npx prisma validate --schema prisma/postgres/schema.prisma
npx prisma generate --schema prisma/schema.prisma
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Uji migrasi nyata membutuhkan Supabase PostgreSQL non-produksi, salinan SQLite yang telah di-backup, dan perbandingan jumlah baris serta foreign key.

## Rollback

Sebelum cutover, SQLite tetap menjadi sumber data aktif dan PostgreSQL target dapat dibuang lalu diisi ulang. Sesudah cutover, rollback aplikasi harus tetap memakai PostgreSQL yang sama; jangan mengarahkan versi baru kembali ke SQLite lama karena akan kehilangan seluruh write setelah cutover. Pemulihan data menggunakan restore backup Supabase sesuai titik pemulihan yang tersedia.
