# CBT-04 — INCIDENT RESPONSE & EMERGENCY PLAYBOOK
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-04 — SCHOOL PILOT PREPARATION & OPERATIONAL READINESS |
| **Dokumen** | Panduan Tanggap Darurat & Penanganan Insiden (Incident Response Playbook) |
| **Prinsip Dasar** | Zero Panic • Zero Answer Loss • Data Atomicity • Komunikasi Terstruktur |
| **Target SLA Penanganan** | Respon Awal < 1 Menit, Resolusi Teknis < 3 Menit |
| **Status Dokumen** | **ACTIVE & MANDATORY FOR PILOT EXECUTION** |
| **Tanggal Terbit** | 8 Oktober 2026 |

---

# 1. Rantai Komando & Jalur Eskalasi Darurat (Chain of Command)

Ketika terjadi gangguan teknis atau fisik saat ujian berlangsung, penanganan mengikuti alur eskalasi satu pintu agar tidak menimbulkan kepanikan siswa:

```text
┌─────────────────┐       Lapor Fisik       ┌──────────────────┐      Eskalasi Sistem    ┌─────────────────┐
│ Pengawas Ruang  │ ──────────────────────► │  Proktor Ujian   │ ──────────────────────► │   Teknisi IT    │
│ (Ruang Kelas)   │                         │  (Pusat Kendali) │                         │  (Ruang Server) │
└─────────────────┘                         └──────────────────┘                         └─────────────────┘
         ▲                                           │                                            │
         │                                           ▼                                            ▼
    Tenangkan                               Kebijakan Tambahan                           Inspeksi Hardware,
      Siswa                                   Waktu / Reset                             Daya & Backbone LAN
```

### Jalur Komunikasi Wajib:
- **Saluran Cepat:** Grup WhatsApp Siaga Panitia Ujian (hanya untuk Proktor, Pengawas, Teknisi, dan Pimpinan).
- **Format Laporan Darurat:** `[RUANG] - [NAMA SISWA / MASALAH] - [TINDAKAN SEMENTARA YANG SUDAH DILAKUKAN]`.
  *Contoh:* `Ruang Lab 1 - PC 12 Mati Mendadak - Siswa dipindahkan ke Laptop Cadangan 02.`

---

# 2. Playbook Tanggap Darurat 5 Insiden Kritis

---

## Insiden 1: Koneksi Internet Putus / Wi-Fi Drop di Ruang Ujian

### Analisis Arsitektur Sistem:
Ruang Pintar CBT Player Runtime dirancang dengan prinsip **Offline-First Buffer**:
- Seluruh butir soal, opsi jawaban, gambar stimulus, dan rumus matematika telah di-*freeze* dalam `SnapshotUjian` dan diunduh ke browser siswa saat pengerjaan dimulai.
- Navigasi antar-nomor soal **100% lokal** dan tidak membutuhkan koneksi internet.
- Jawaban yang dipilih siswa otomatis dicatat seketika ke `localStorage` gawai siswa.
- Tombol "Kumpulkan Ujian" dilindungi oleh *Pre-Submit Synchronization Barrier*, sehingga lembar ujian tidak dapat ditutup sebelum seluruh buffer offline berhasil terunggah ke database server.

### Protokol Penanganan:
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PROSEDUR PENGAWAS RUANG:                                                               │
│ 1. Berdiri dan umumkan dengan suara tenang:                                            │
│    "Anak-anak, koneksi Wi-Fi sedang tidak stabil. TETAP KERJAKAN SOAL SEPERTI BIASA.   │
│     Jawaban kalian tersimpan otomatis di perangkat masing-masing. JANGAN TUTUP BROWSER."│
│ 2. DILARANG keras menyuruh siswa me-refresh halaman berulang kali saat Wi-Fi mati.     │
│ 3. Hubungi Teknisi IT melalui grup siaga: "Ruang X sinyal Wi-Fi drop."                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PROSEDUR TEKNISI IT:                                                                   │
│ 1. Periksa lampu indikator Access Point di ruang kelas bersangkutan.                  │
│ 2. Jika AP hang: lakukan reboot Access Point melalui PoE switch (< 45 detik).          │
│ 3. Jika koneksi pulih, browser siswa otomatis mendeteksi status online dan             │
│    mengunggah seluruh antrean jawaban yang tertunda (indikator menjadi hijau).         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PROSEDUR PROKTOR:                                                                      │
│ 1. Pantau status sinkronisasi di Proctor Cockpit.                                      │
│ 2. Jika gangguan berlangsung > 5 menit, berikan kompensasi penambahan waktu melalui    │
│    fitur "Tambah Waktu Sesi" sejumlah durasi gangguan yang terjadi.                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Insiden 2: Pemadaman Listrik PLN Tiba-Tiba

### Analisis Dampak:
- **Kondisi A (Server terlindungi UPS):** Komputer server tetap menyala normal. Laptop dan smartphone siswa yang memiliki baterai tetap dapat mengerjakan soal tanpa gangguan.
- **Kondisi B (Server mati mendadak):** Berkat arsitektur **SQLite WAL (Write-Ahead Logging)**, setiap transaksi yang telah dikonfirmasi bersifat *ACID-compliant* dan atomik. Tidak ada korupsi database. Jawaban yang belum terkirim masih tersimpan utuh di `localStorage` gawai siswa.

### Protokol Penanganan:
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PROSEDUR TEKNISI IT:                                                                   │
│ 1. Segera nyalakan Genset Sekolah dalam waktu maksimal 3 menit.                        │
│ 2. Pastikan pasokan daya beralih ke Genset sebelum kapasitas baterai UPS habis         │
│    (UPS server mampu menopang daya selama 20–30 menit).                                │
│ 3. Jika server sempat padam sebelum genset menyala:                                    │
│    - Nyalakan server kembali.                                                          │
│    - Verifikasi integritas database SQLite:                                            │
│      sqlite3 prisma/dev.db "PRAGMA quick_check;"                                       │
│    - Jalankan kembali aplikasi server: npm run start (atau auto-start via PM2).        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PROSEDUR PENGAWAS RUANG:                                                               │
│ 1. Instruksikan siswa untuk tetap tenang di tempat duduk masing-masing.                │
│ 2. Pastikan siswa tidak memanfaatkan situasi gelap untuk berdiskusi dengan teman.      │
│ 3. Untuk lab komputer berbasis PC desktop yang mati: catat nomor PC dan nama siswa.    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PROSEDUR PROKTOR (PASCA DAYA PULIH):                                                   │
│ 1. Konfirmasi kepada pengawas bahwa server telah aktif kembali.                        │
│ 2. Siswa membuka kembali browser: sesi otomatis di-*resume* ke nomor soal terakhir     │
│    dengan seluruh jawaban terselamatkan utuh.                                          │
│ 3. Proktor menambahkan waktu kompensasi durasi pemadaman listrik di Proctor Cockpit.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Insiden 3: Server Ujian Crash / Restart Mendadak

### Analisis Dampak:
Proses aplikasi Node.js/Next.js berhenti berjalan mendadak akibat lonjakan beban memori atau kesalahan sistem operasi.

### Protokol Penanganan:
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PROSEDUR TEKNISI IT (TARGET WAKTU: < 2 MENIT):                                         │
│ 1. Buka terminal server atau remote console.                                           │
│ 2. Jalankan perintah restart service via process manager:                              │
│    pm2 restart ruang-pintar                                                            │
│    # Atau jika dijalankan manual:                                                      │
│    npm run start                                                                       │
│ 3. Periksa port aktif lokal:                                                           │
│    Get-NetTCPConnection -LocalPort 3000                                                │
│ 4. Lakukan curl/ping lokal: curl -I http://localhost:3000 (Pastikan HTTP 200).         │
│ 5. Kabarkan kepada Proktor: "Server sudah aktif dan melayani request kembali."         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PROSEDUR PROKTOR & PENGAWAS:                                                           │
│ 1. Pengawas meminta siswa me-refresh halaman browser (F5 / tarik layar ke bawah).      │
│ 2. Siswa langsung kembali ke lembar soal mereka masing-masing.                         │
│ 3. Sisa waktu siswa dihitung secara server-authoritative dan tidak berkurang selama    │
│    durasi downtime jika proktor menambahkan kompensasi waktu.                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Insiden 4: Gawai Siswa Rusak, Baterai Habis, atau Mengalami Error Fisik

### Analisis Skenario:
Layar gawai siswa pecah, HP restart sendiri berulang kali (bootloop), atau baterai habis di tengah ujian.

### Protokol Penanganan (Penggantian Perangkat):
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LANGKAH 1 (PENGAMBILAN UNIT CADANGAN):                                                 │
│ Pengawas ruang segera mengambil 1 unit Laptop/Tablet Cadangan Panitia (Contingency     │
│ Stock) yang telah menyala dan terhubung ke Wi-Fi ujian di meja pengawas.               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LANGKAH 2 (LOGIN DI PERANGKAT BARU):                                                   │
│ 1. Siswa login menggunakan NISN dan Password miliknya di laptop cadangan.              │
│ 2. Siswa membuka menu /cbt dan memilih ujian yang sedang aktif.                        │
│ 3. Masukkan Token Ujian yang berlaku.                                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LANGKAH 3 (SINGLE DEVICE LOCK RESOLUTION):                                             │
│ 1. Sistem Ruang Pintar mendeteksi login baru dan menerbitkan token_sesi_aktif baru.    │
│ 2. Sesi di perangkat lama otomatis diinvalidasi (terkunci seketika).                   │
│ 3. Sistem menarik (pull) seluruh jawaban yang telah tersimpan di server database.      │
│ 4. Siswa melanjutkan soal pada nomor terakhir yang dikerjakan.                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LANGKAH 4 (PENCATATAN BERITA ACARA):                                                   │
│ Pengawas mencatat kejadian pada formulir Berita Acara Ujian:                           │
│ "Siswa Budi Utomo ganti gawai pada pukul 08.45 karena baterai HP habis."               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Insiden 5: Token Ujian Bocor atau Diakses Siswa Luar Sesi

### Analisis Skenario:
Siswa memotret token ujian dan mengirimkannya melalui grup WhatsApp ke siswa sesi berikutnya yang belum waktunya mengerjakan.

### Protokol Penanganan (Regenerate Token Instan):
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LANGKAH 1 (REGENERASI TOKEN OLEH PROKTOR):                                             │
│ 1. Proktor membuka Proctor Cockpit (/cbt-ujian/proctor/[ujianId]).                     │
│ 2. Klik tombol "Regenerate Token Baru".                                                │
│ 3. Sistem secara instan:                                                               │
│    - Menginvalidasi token lama (status: EXPIRED).                                      │
│    - Menerbitkan token baru 6 karakter (misal: R9W2MK).                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LANGKAH 2 (DAMPAK TERHADAP PESERTA):                                                   │
│ - Siswa yang SUDAH MENGERJAKAN (status: IN_PROGRESS): TIDAK TERPENGARUH SAMA SEKALI.   │
│   Siswa tetap melanjutkan pengerjaan tanpa perlu memasukkan token lagi.                │
│ - Siswa luar / penyusup yang mencoba masuk menggunakan token lama otomatis DITOLAK     │
│   dengan pesan galat: "Token ujian tidak valid atau telah kedaluwarsa."                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LANGKAH 3 (DISTRIBUSI TOKEN BARU KE RUANG KELAS):                                      │
│ Proktor membagikan token baru kepada Pengawas Ruang untuk diumumkan kepada siswa yang  │
│ terlambat atau baru hadir secara resmi.                                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LANGKAH 4 (AUDIT LOG & ISOLASI ROMBEL):                                                │
│ Sistem Ruang Pintar memiliki pertahanan lapis ganda (Roster Eligibility):              │
│ Sekalipun siswa luar sesi mengetahui token ujian, sistem server tetap menolak attempt │
│ jika rombel siswa bersangkutan tidak terdaftar dalam konfigurasi sesi saat ini.       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. Prosedur Penambahan Kompensasi Waktu Pengerjaan

Apabila terjadi kendala teknis massal (listrik padam atau reboot Access Point) yang memakan waktu $\ge 3$ menit:
1. Proktor berhak memberikan waktu kompensasi resmi melalui antarmuka **Proctor Cockpit**.
2. Proktor memilih opsi **"Tambah Waktu Peserta"** (pilihan: 5 menit, 10 menit, 15 menit).
3. Server memperbarui batas waktu (`waktu_harus_selesai`) di database dan membroadcast perubahan ke timer browser siswa.
4. Jam berakhir ujian di papan tulis kelas disesuaikan oleh Pengawas Ruang.

---

# 4. Formulir Pencatatan Insiden (Incident Log Sheet)

Setiap gangguan wajib dicatat pada formulir berita acara dengan format berikut:

```text
========================================================================================
                      LEMBAR LOG INSIDEN OPERASIONAL CBT
========================================================================================
Nama Sekolah       : ................................................................
Mata Pelajaran     : ................................................................
Tanggal & Sesi     : ................................................................
Ruang Ujian        : ................................................................

1. Waktu Kejadian  : Pukul ........ : ........ WIB
2. Kategori Insiden: [ ] Jaringan Wi-Fi Drop         [ ] Pemadaman Listrik
                     [ ] Server Crash / Restart       [ ] Ganti Gawai Siswa
                     [ ] Pelanggaran 2-Strike         [ ] Token Bocor
3. Deskripsi Singkat Masalah:
   ....................................................................................
4. Tindakan yang Diambil:
   ....................................................................................
5. Dampak Terhadap Siswa:
   - Jumlah Siswa Terdampak : ........ Siswa
   - Kompensasi Waktu Diberikan: ........ Menit
6. Status Akhir: [ ] Tuntas / Selesai Ujian      [ ] Ujian Susulan

Tanda Tangan Pengawas Ruang,                      Tanda Tangan Proktor Ujian,


( ................................... )           ( ................................... )
========================================================================================
```
