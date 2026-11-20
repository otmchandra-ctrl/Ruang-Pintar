# CBT-04 — STANDARD OPERATING PROCEDURE (SOP) OPERASIONAL CBT
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-04 — SCHOOL PILOT PREPARATION & OPERATIONAL READINESS |
| **Dokumen** | Panduan Operasional Standar (SOP) Multi-Peran Pelaksanaan CBT Sekolah |
| **Audiens Utama** | Admin Sekolah, Proktor, Pengawas Ruang, Guru Mapel, Teknisi IT |
| **Prinsip Operasional** | Zero Data Loss • Server-Authoritative • Disiplin Jam Resmi • Anti-Kecurangan Adil |
| **Status Dokumen** | **ACTIVE & MANDATORY FOR PILOT EXECUTION** |
| **Tanggal Terbit** | 8 Oktober 2026 |

---

# 1. Matriks Tanggung Jawab Antar-Peran (RACI Matrix)

| Aktivitas Operasional | Admin Sekolah | Guru Mapel | Proktor | Pengawas Ruang | Teknisi IT |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Verifikasi Data Siswa & Rombel** | **A / R** | C | I | I | I |
| **2. Penyusunan Soal & Pembekuan Snapshot** | I | **A / R** | C | I | I |
| **3. Setup Server, UPS & Jaringan Wi-Fi** | I | I | C | I | **A / R** |
| **4. Cetak Berkas Administrasi (Daftar Hadir/BA)** | C | I | **A / R** | I | I |
| **5. Rilis & Manajemen Token Ujian** | I | I | **A / R** | C | I |
| **6. Penegakan Tata Tertib Ruang Kelas** | I | I | C | **A / R** | I |
| **7. Unlock Sesi Siswa (Reset/Ganti Device)** | I | I | **A / R** | C | I |
| **8. Penanganan Gangguan Daya / Jaringan** | I | I | C | C | **A / R** |
| **9. Koreksi Esai & Transfer Nilai ke M13** | I | **A / R** | I | I | I |
| **10. Backup Database Pasca-Ujian** | C | I | I | I | **A / R** |

*Keterangan: **A** = Accountable (Penanggung Jawab Utama), **R** = Responsible (Pelaksana), **C** = Consulted (Konsultasi), **I** = Informed (Menerima Informasi).*

---

# 2. SOP Peran Rinci

---

## 2.1. SOP Admin Sekolah

### Tanggung Jawab Utama:
Memastikan integritas tenancy sekolah, ketersediaan akun seluruh pengguna, struktur rombel, dan penetapan jadwal resmi pada kalender akademik.

### Prosedur Kerja:
1. **H-7 Sebelum Ujian:**
   - Masuk ke portal Ruang Pintar sebagai `ADMIN_SEKOLAH`.
   - Lakukan verifikasi master data siswa di menu `/data-siswa`. Pastikan seluruh NISN, nama lengkap, dan status aktif siswa telah valid.
   - Periksa pembagian rombongan belajar di `/struktur-akademik`. Pastikan tidak ada siswa yang belum ditempatkan dalam rombel (*unassigned placement*).
2. **H-3 Sebelum Ujian:**
   - Pastikan akun seluruh Proktor dan Pengawas telah aktif dengan role yang sesuai.
   - Koordinasikan pembagian shift/sesi jika jumlah peserta melebihi kapasitas lab/ruang (maksimal 300 siswa per sesi serentak).
3. **Hari-H:**
   - Memantau pelaksanaan secara makro dari dashboard manajemen sekolah.
   - Menerima eskalasi formal dari Proktor jika terjadi kendala force majeure yang mengharuskan penundaan jadwal.

---

## 2.2. SOP Guru Mata Pelajaran

### Tanggung Jawab Utama:
Menyusun butir naskah soal berkualitas, memverifikasi keterbacaan stimulus gambar/rumus matematika, mempublikasikan paket ujian hingga terbit `SnapshotUjian`, memeriksa jawaban esai, dan melakukan transfer nilai ke Buku Nilai.

### Prosedur Kerja:
1. **H-7 s.d H-3 (Penyusunan Paket Ujian):**
   - Buat paket soal di modul Bank Soal `/cbt-ujian/bank-soal/buat`.
   - Gunakan variasi butir soal standar Kurikulum Merdeka (Pilihan Ganda, Pilihan Ganda Kompleks, Benar/Salah, Menjodohkan, Esai).
   - Pastikan rumus matematika menggunakan sintaks KaTeX yang valid (uji tombol preview matematika).
   - Pastikan gambar stimulus memiliki rasio proporsional dan ukuran file di bawah 500 KB per gambar agar hemat bandwidth lokal.
2. **H-2 (Review & Finalisasi):**
   - Lakukan *Pratinjau Siswa (Student Preview)* untuk memastikan tampilan soal persis seperti yang akan dilihat siswa di HP dan laptop.
   - Klik **"Publikasikan Ujian"**. Pastikan status berubah menjadi `PUBLIKASI` dan `SnapshotUjian` telah terkunci secara permanen (immutable).
3. **Hari-H:**
   - Berada di ruang guru atau ruang proktor untuk bersiaga jika ada pertanyaan klarifikasi redaksional soal dari pengawas ruang.
   - **DILARANG** mengedit soal yang sedang dikerjakan siswa (soal sudah terlindungi oleh Snapshot).
4. **Pasca-Ujian (H+0 s.d H+2):**
   - Buka lembar hasil penilaian di `/cbt-ujian`. Soal objektif terkoreksi 100% otomatis oleh server.
   - Lakukan pemeriksaan manual untuk soal esai/uraian. Berikan skor sesuai rubrik penilaian.
   - Setelah seluruh esai dinilai, klik tombol **"Transfer ke Buku Nilai"** untuk mengalirkan nilai akhir ke modul Penilaian Akademik (M13).

---

## 2.3. SOP Proktor (Pusat Kendali Ujian)

### Tanggung Jawab Utama:
Mengoperasikan *Proctor Cockpit* (`/cbt-ujian/proctor/[ujianId]`), merilis dan meregenerasi token ujian, memantau kemajuan pengerjaan siswa secara real-time, dan menangani permohonan pembukaan kunci sesi (*unlock attempt*).

### Prosedur Kerja:
1. **H-1 Sebelum Ujian:**
   - Buka menu Administrasi Ujian (`/cbt/administrasi/[asesmenId]`).
   - Unduh dan cetak:
     - Daftar Hadir Peserta Ujian (per ruang kelas/lab).
     - Berita Acara Pelaksanaan Ujian (BA).
     - Naskah Soal & Lembar Jawab Manual (LJM) Cadangan (disimpan tertutup di map darurat).
2. **Hari-H (Pukul H-30 Menit):**
   - Buka laptop proktor dan login ke Ruang Pintar.
   - Masuk ke dashboard **Proctor Cockpit**.
   - Cek daftar peserta yang telah masuk ke *Waiting Room*.
3. **Hari-H (Pukul H-5 Menit):**
   - Klik tombol **"Generate Token"** di Proctor Cockpit. Sistem menerbitkan token 6 digit alfanumerik (misal: `K7X9PQ`).
   - Tulis token di papan tulis ruang ujian atau sampaikan kepada Pengawas Ruang melalui grup komunikasi internal.
4. **Selama Ujian Berlangsung:**
   - Pantau status seluruh siswa pada layar Proktor:
     - 🟢 *Mengerjakan:* Siswa aktif, autosave terupdate dalam < 30 detik terakhir.
     - 🟡 *Koneksi Terputus / Menunggu Sync:* Belum mengirim detak autosave > 60 detik (arahkan pengawas memeriksa gawai siswa).
     - 🔴 *Terkunci (Locked):* Siswa terkena 2-strike pelanggaran integritas layar.
   - **Prosedur Unlock Siswa Terkunci:**
     - Pengawas ruang mendatangi siswa dan memastikan tidak ada aplikasi terlarang.
     - Pengawas menghubungi proktor: *"Ruang 2, Siswa Abieza Praya terverifikasi tidak sengaja terpencet notifikasi, mohon unlock."*
     - Proktor menekan tombol **"Buka Kunci (Unlock)"** pada baris siswa bersangkutan di Proctor Cockpit.
     - Siswa menekan tombol *"Coba Lagi"* pada layarnya dan melanjutkan pengerjaan tanpa kehilangan jawaban.
5. **Penutupan Ujian:**
   - Saat waktu habis, periksa apakah ada siswa yang masih berstatus `IN_PROGRESS`.
   - Gunakan fitur **"Force Submit Sesi"** jika ada siswa yang lupa menekan tombol kumpulkan lembar jawaban saat waktu telah habis.
   - Pastikan metrik *Submitted* mencapai 100%.

---

## 2.4. SOP Pengawas Ruang Kelas

### Tanggung Jawab Utama:
Menjaga ketertiban fisik ruangan, memverifikasi kehadiran siswa, membacakan tata tertib, membagikan token, dan mengawasi jalannya ujian agar tidak terjadi kecurangan.

### Prosedur Kerja:
1. **Pukul H-30 Menit:**
   - Mengambil amplop administrasi ujian dari panitia (Daftar Hadir, Berita Acara, Denah Duduk).
   - Masuk ke ruang ujian dan memeriksa kebersihan meja siswa (tidak boleh ada buku, catatan, atau kertas coret-coretan tanpa cap panitia).
2. **Pukul H-15 Menit (Siswa Masuk Ruang):**
   - Mempersilakan siswa masuk ruang dan duduk sesuai nomor meja yang ditentukan.
   - Meminta siswa meletakkan tas, buku, dan jaket di depan kelas.
   - Memeriksa gawai siswa:
     - Wajib mengaktifkan mode **Jangan Ganggu (Do Not Disturb)** agar notifikasi WA/telepon tidak memicu peringatan anti-kecurangan sistem.
     - Wajib menutup seluruh tab browser lain dan aplikasi background.
     - Membuka browser (Chrome/Safari) dan mengakses URL resmi ujian: `http://cbt.sekolah.sch.id` (atau IP lokal server).
3. **Pukul H-5 Menit:**
   - Membacakan Tata Tertib Peserta Ujian.
   - Menuliskan **Token Ujian** di papan tulis kelas.
   - Mengawasi siswa memasukkan token dan memulai pengerjaan.
4. **Selama Ujian Berlangsung:**
   - Mengedarkan Daftar Hadir untuk ditandatangani oleh setiap siswa.
   - Berkeliling ruang secara berkala dan mengamati layar gawai siswa dari arah samping/belakang.
   - **Jika siswa panik karena koneksi Wi-Fi putus:** Tenangkan siswa, katakan: *"Tetap kerjakan di layar, jawaban kamu tersimpan aman di HP. Jangan ditutup tabnya."*
   - **Jika siswa mengalami strike/layar terkunci:** Periksa gawai siswa, pastikan tidak ada kecurangan, lalu minta proktor membuka kunci melalui radio/komunikasi proktor.
5. **Pukul H+0 (Ujian Berakhir):**
   - Memastikan seluruh siswa telah menekan tombol "Kumpulkan Ujian" dan melihat layar *"Ujian Selesai"*.
   - Mengisi dan menandatangani Berita Acara Pelaksanaan Ujian.
   - Menyerahkan berkas administrasi fisik kembali ke sekretariat panitia.

---

## 2.5. SOP Teknisi IT Sekolah

### Tanggung Jawab Utama:
Memastikan infrastruktur server, database SQLite WAL, pasokan daya UPS, jaringan kabel LAN, Access Point Wi-Fi, dan sistem cadangan darurat beroperasi pada kondisi prima 100%.

### Prosedur Kerja:
1. **H-1 Sebelum Ujian (Pemeriksaan Teknis Menyeluruh):**
   - **Pemeriksaan Server:**
     - Ruang disk free minimal 20 GB (`df -h`).
     - Jalankan script tuning SQLite PRAGMA:
       ```bash
       sqlite3 prisma/dev.db "PRAGMA journal_mode=WAL;"
       sqlite3 prisma/dev.db "PRAGMA synchronous=NORMAL;"
       sqlite3 prisma/dev.db "PRAGMA busy_timeout=5000;"
       ```
     - Jalankan kalibrasi jam server dengan server NTP internet: `w32tm /resync` atau `chronyc makestep`.
   - **Pemeriksaan Jaringan:**
     - Pastikan Core Switch dan Access Point menyala normal.
     - Cek DHCP Pool router: pastikan tersedia minimal 500 IP kosong dengan lease time 2 jam.
     - Uji koneksi ping dari ruang kelas terjauh ke IP server (latensi wajib < 5 ms, packet loss 0%).
   - **Pemeriksaan Daya:**
     - Uji cabut colokan PLN untuk memastikan UPS server mengambil alih daya seketika tanpa restart komputer.
     - Pastikan solar/bensin genset sekolah terisi penuh dan aki starter genset berfungsi.
   - **Pencadangan Awal (Pre-Exam Backup):**
     ```bash
     sqlite3 prisma/dev.db ".backup 'backups/pre_exam_backup.db'"
     ```
2. **Hari-H (Pukul H-45 Menit):**
   - Menyalakan server, memastikan proses Next.js runtime berjalan melalui process manager (PM2 atau systemd).
   - Memeriksa dashboard beban sistem (`htop` / Task Manager): CPU idle < 5%, RAM idle < 2 GB.
   - Menyiapkan 10 unit laptop cadangan sekolah yang sudah terhubung ke jaringan ujian dan terpasang charger.
3. **Selama Ujian Berlangsung:**
   - Siaga penuh di ruang server / sekretariat teknis.
   - Memantau konsumsi RAM, I/O disk, dan ukuran file `-wal` database SQLite.
   - Jika terjadi kendala koneksi di suatu ruang, segera lakukan inspeksi Access Point bersangkutan.
4. **Pasca-Ujian:**
   - Jalankan proses checkpoint WAL manual untuk menggabungkan transaksi ke file database utama:
     ```bash
     sqlite3 prisma/dev.db "PRAGMA wal_checkpoint(TRUNCATE);"
     ```
   - Lakukan backup database harian pasca-sesi ke penyimpanan eksternal (Flashdisk / Harddisk Eksternal Teknisi):
     ```bash
     sqlite3 prisma/dev.db ".backup 'backups/cbt_post_sesi_1.db'"
     ```
