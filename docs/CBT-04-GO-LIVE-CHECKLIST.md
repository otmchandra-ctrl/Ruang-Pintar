# CBT-04 — GO-LIVE CHECKLIST & ROLLBACK CONTINGENCY PLAN
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-04 — SCHOOL PILOT PREPARATION & OPERATIONAL READINESS |
| **Dokumen** | Daftar Periksa Hari-H (Go-Live Checklist) & Rencana Rollback Darurat |
| **Prasyarat Eksekusi** | Kelulusan Quality Gate CBT-03.5 & Verifikasi Fisik Sekolah |
| **Protokol Fallback** | Naskah Cetak & Lembar Jawaban Manual (LJM) Otomatis Ruang Pintar |
| **Status Dokumen** | **MANDATORY FOR GO-LIVE AUTHORIZATION** |
| **Tanggal Terbit** | 8 Oktober 2026 |

---

# 1. Checklist Kesiapan Hari-H (Pre-Flight & Go-Live Checklist)

Checklist ini wajib diverifikasi dan ditandatangani bersama oleh **Admin Sekolah, Proktor Utama, dan Teknisi IT** sebelum ujian dibuka untuk siswa:

```text
========================================================================================
                      DAFTAR PERIKSA KESIAPAN HARI-H (GO-LIVE CHECKLIST)
========================================================================================
[ ] STATUS: LOLOS SEMUA VERIFIKASI SEBELUM TOKEN UJIAN DIRILIS
========================================================================================
```

---

## 1.1. Verifikasi Server & Sistem Operasi
- [ ] **Spesifikasi Mesin:** CPU minimal 4 Core, RAM fisik minimal 8 GB DDR4.
- [ ] **Kapasitas Penyimpanan:** Ruang kosong (*free disk space*) pada partisi database minimal **20 GB** (Cek: `df -h` atau `Get-PSDrive C`).
- [ ] **Status Storage:** Disk berjenis **NVMe SSD** (bukan SATA HDD mekanik).
- [ ] **OS Service Hygiene:**
  - Pembaruan otomatis OS (*Windows Update / unattended-upgrades*) telah dinonaktifkan sementara selama jam ujian.
  - Antivirus background scheduled scan dinonaktifkan sementara.
- [ ] **Process Manager:** Aplikasi Next.js berjalan pada mode produksi (`npm run start` atau `pm2 start npm --name "cbt-app" -- run start`).
- [ ] **Sinkronisasi Jam (NTP):** Jam server telah dikalibrasi dengan server waktu nasional (deviasi waktu < 1 detik).

---

## 1.2. Verifikasi Database SQLite & Konfigurasi Tuning
- [ ] **Integritas Database:** File database `prisma/dev.db` lolos pemeriksaan integritas tanpa galat (`PRAGMA quick_check;` mengembalikan hasil `ok`).
- [ ] **Journal Mode:** Terverifikasi menggunakan mode WAL (`PRAGMA journal_mode=WAL;`).
- [ ] **Synchronous Mode:** Ditetapkan pada `NORMAL` (`PRAGMA synchronous=NORMAL;`).
- [ ] **Busy Timeout:** Ditetapkan pada 5000 ms (`PRAGMA busy_timeout=5000;`).
- [ ] **Cache Size:** Alokasi cache memori minimal 64 MB (`PRAGMA cache_size=-64000;`).
- [ ] **Pre-Flight Backup:** Database telah di-backup sebelum sesi 1 dibuka:
  ```bash
  sqlite3 prisma/dev.db ".backup 'backups/pre_flight_h_day.db'"
  ```

---

## 1.3. Verifikasi Jaringan Backbone & Router
- [ ] **Konektivitas Kabel:** Server terhubung ke switch utama dengan kabel LAN Gigabit Cat6 (Link Speed 1000 Mbps Full Duplex).
- [ ] **DHCP Pool:**
  - Subnet terkonfigurasi pada `/23` (rentang alokasi minimal 500 IP address).
  - *Lease Time* DHCP ditetapkan pada **2 Jam** (mencegah kepenuhan IP akibat perangkat siswa yang berganti).
  - DNS lokal terkonfigurasi responsif (latensi DNS < 2 ms).
- [ ] **Firewall & Bandwidth Isolation:**
  - Akses keluar router untuk YouTube, TikTok, Instagram, dan game online diblokir pada interface Wi-Fi siswa.
  - Prioritas bandwidth (QoS) diberikan 100% untuk lalu lintas paket data port aplikasi CBT (Port 3000 / HTTP / HTTPS).

---

## 1.4. Verifikasi Access Point (AP) & Wi-Fi Ruang Kelas
- [ ] **Tipe Access Point:** Seluruh AP di ruang ujian bertipe *Enterprise / Business Class* (Dual Band 2.4 GHz & 5 GHz).
- [ ] **Distribusi Klien:** Rasio beban maksimal ditetapkan **35–40 perangkat per Access Point**.
- [ ] **Frekuensi Utama:** SSID Ujian diarahkan ke pita **5 GHz** (Channel Width 20/40 MHz) untuk menghindari interferensi sinyal.
- [ ] **SSID Isolation:** Fitur *Client Isolation* aktif pada AP sehingga gawai siswa tidak dapat saling mengirim paket data secara peer-to-peer.
- [ ] **Uji Sinyal Ruang:** Sinyal Wi-Fi di sudut terlemah setiap ruang ujian berada pada tingkat minimal **-65 dBm**.

---

## 1.5. Verifikasi Sistem Catu Daya & Cadangan Listrik (UPS & Genset)
- [ ] **UPS Server Terhubung:** Server ujian, core switch, dan router utama tercolok pada stopkontak ber-UPS.
- [ ] **Uji Daya UPS:** Pengujian simulasi cabut colokan PLN telah dilakukan (UPS mampu menopang beban tanpa ada *flicker* listrik).
- [ ] **Bahan Bakar Genset:** Tangki solar/bensin genset sekolah terisi penuh minimal untuk operasional 6 jam.
- [ ] **Kesiapan Operator Genset:** Teknisi listrik sekolah siaga di dekat ruang genset untuk melakukan pengalihan saklar manual dalam waktu < 3 menit jika PLN padam.

---

## 1.6. Verifikasi Perangkat Klien (Siswa & Pengawas)
- [ ] **Standar Browser:** Browser siswa terverifikasi Google Chrome versi 90+ atau Safari iOS 15+.
- [ ] **Penyimpanan Lokal:** Gawai siswa memiliki ruang bebas minimal 100 MB untuk penyimpanan cache dan `localStorage`.
- [ ] **Baterai Gawai:** Baterai gawai siswa terisi minimal **80%** sebelum masuk ruang ujian.
- [ ] **Mode Jangan Ganggu (DND):** Siswa telah mengaktifkan mode *Do Not Disturb* untuk mencegah notifikasi luar memicu *strike violation*.
- [ ] **Stok Laptop Cadangan:** Tersedia minimal **10 unit laptop cadangan sekolah** dalam kondisi menyala, terhubung ke Wi-Fi ujian, dan siap pakai di meja pengawas.

---

# 2. Rencana Rollback Darurat (Rollback & Fallback Plan)

Rollback adalah skenario kontinjensi pamungkas jika terjadi kegagalan infrastruktur fisik fatal yang tidak dapat diselesaikan dalam batas waktu toleransi ujian sekolah.

---

## 2.1. Kriteria Pemicu Rollback (Trigger Conditions)

Rollback ke metode ujian manual/tertulis **HANYA DAPAT DIPUTUSKAN** oleh Kepala Sekolah dan Proktor Utama jika salah satu dari kondisi berikut terpenuhi:

| Kondisi Pemicu Rollback | Batas Ambang Toleransi | Keputusan |
| :--- | :--- | :--- |
| **Kerusakan Fatal Hardware Server** | Kerusakan motherboard/RAM/SSD server tanpa ada server cadangan dalam 30 menit. | **ROLLBACK KE FISIK** |
| **Pemadaman Listrik Berkepanjangan** | Listrik PLN padam dan Genset sekolah mengalami kerusakan mesin > 30 menit. | **ROLLBACK KE FISIK** |
| **Kerusakan Seluruh Jaringan Wi-Fi** | Switch utama sekolah terbakar atau terkena petir sehingga seluruh ruangan terisolasi. | **ROLLBACK KE FISIK** |
| **Kejadian Bencana / Force Majeure** | Gempa bumi, banjir, atau kebakaran yang memaksa evakuasi ruang kelas. | **BATALKAN / UJIAN SUSULAN** |

> ⚠️ **Catatan Penting:** Masalah koneksi Wi-Fi putus sementara (< 10 menit) atau satu PC/HP siswa mati **BUKAN ALASAN ROLLBACK**, melainkan ditangani melalui *Incident Response Playbook* (penggantian gawai cadangan atau perpanjangan waktu).

---

## 2.2. Prosedur Pelaksanaan Rollback ke Lembar Jawaban Manual (LJM)

Jika pemicu rollback terpenuhi:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: KEPUTUSAN RESMI & DISTRIBUSI MAP DARURAT                                      │
│ 1. Kepala Sekolah & Proktor Utama menandatangani "Berita Acara Pembatalan Digital".   │
│ 2. Panitia membuka Map Darurat yang telah disiapkan pada H-1 (berisi Naskah Cetak &    │
│    Lembar Jawaban Manual yang digenerate dari menu /cbt/administrasi/[asesmenId]).    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TAHAP 2: EKSEKUSI DI RUANG UJIAN                                                       │
│ 1. Pengawas meminta siswa mematikan gawai dan menyimpannya di tas.                     │
│ 2. Pengawas membagikan Naskah Soal Fisik dan Lembar Jawaban Manual (LJM).              │
│ 3. Waktu ujian di-reset dan dimulai kembali sesuai durasi penuh.                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TAHAP 3: REKONSILIASI DATA POST-ROLLBACK                                               │
│ 1. Lembar jawaban siswa dikoreksi secara manual atau discan menggunakan format LJM.    │
│ 2. Nilai diinput manual ke modul Buku Nilai (M13) melalui menu Input Nilai Guru.       │
│ 3. Seluruh attempt digital yang berstatus IN_PROGRESS di-cancel secara administratif   │
│    oleh Admin Sekolah setelah server pulih.                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. Lembar Otorisasi Go-Live (Sign-off Protocol)

```text
========================================================================================
                   LEMBAR PENGESAHAN OTORISASI GO-LIVE PILOT CBT
========================================================================================
Nama Sekolah       : ................................................................
Tanggal Pelaksanaan: ................................................................
Sesi / Jam Ujian   : Sesi ........ (Pukul ........ s.d ........ WIB)
Jumlah Peserta     : ........ Siswa

Dengan ini menyatakan bahwa seluruh item pemeriksaan teknis pada Go-Live Checklist telah
diverifikasi dan berada pada kondisi 100% layak operasional.

Keputusan: [ ] GO-LIVE DISETUJUI              [ ] DITUNDA / ROLLBACK


Menyetujui,               Mengetahui,                   Memverifikasi,
Kepala Sekolah,           Proktor Utama,                Teknisi IT Sekolah,



( .................... )  ( .................... )      ( .................... )
========================================================================================
```
