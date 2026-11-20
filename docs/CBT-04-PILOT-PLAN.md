# CBT-04 — SCHOOL PILOT PLAN & EXECUTION SCENARIOS
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-04 — SCHOOL PILOT PREPARATION & OPERATIONAL READINESS |
| **Dokumen** | Master School Pilot Plan (Rencana Pelaksanaan Uji Coba Sekolah) |
| **Dasar Penilaian** | Hasil Audit STAGE CBT-03.5 & Baseline CBT-03.4 Hardened Engine |
| **Engine Runtime** | Fast-Path Pipeline (1 SELECT + 1 UPSERT), In-Memory Write Queue, SQLite WAL |
| **Target Skala** | Tier 1 (30 Siswa), Tier 2 (100 Siswa), Tier 3 (300 Siswa) |
| **Status Keputusan** | **READY FOR PILOT EXECUTION** (Dengan Kontrol Parameter Operasional) |
| **Tanggal Terbit** | 8 Oktober 2026 |

---

# 1. Latar Belakang & Tujuan Pilot Sekolah

Berdasarkan audit komprehensif pada **STAGE CBT-03.5**, mesin ujian Ruang Pintar telah membuktikan:
1. **Zero Data Loss Guarantee** melalui *Pre-Submit Synchronization Barrier* dan penyimpanan sekunder `localStorage`.
2. **Kinerja Konkurensi Unggul** dengan latensi P99 sebesar **68 ms** pada beban simulasi 500 siswa serentak.
3. **Eliminasi False Positive Anti-Cheat** pada keyboard gawai Android melalui *VisualViewport API* dan *cooldown window 1500ms*.
4. **Keamanan Single-Device Lock** melalui `token_sesi_aktif` yang mencegah pengerjaan paralel atau perjokian.
5. **Kepatuhan Quality Gate 100%** (Typecheck 0 error, Lint 0 error, Format 100% clean, 922 unit/integration test pass, 31 rute build pass).

Tujuan utama dari **STAGE CBT-04 School Pilot** adalah menguji ketahanan operasional, keandalan fisik infrastruktur sekolah, serta efektivitas SOP manusia (Admin, Proktor, Pengawas, Guru, Teknisi) di lingkungan nyata sekolah sebelum pembukaan rilis produksi massal (*General Availability*).

---

# 2. Skenario Bertingkat Pilot Sekolah (Tiered Pilot Scenarios)

Pelaksanaan pilot sekolah **WAJIB** dieksekusi secara bertahap dalam 3 tier berurutan. Kelulusan setiap tier menjadi syarat mutlak (*prerequisite gate*) sebelum melangkah ke tier berikutnya:

```text
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   TIER 1 (ALPHA)       │ ───► │    TIER 2 (BETA)        │ ───► │    TIER 3 (FULL PILOT)  │
│   30 Siswa             │      │    100 Siswa            │      │    300 Siswa            │
│   1 Rombel Terisolasi  │      │    3-4 Rombel Paralel   │      │    1 Angkatan / Jenjang │
│   Laboratorium Komputer│      │    Lab + Wi-Fi Kelas    │      │    Serentak (PTS / PAS) │
└────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

---

## 2.1. Skenario Tier 1 — Alpha Pilot (30 Siswa)

| Parameter | Spesifikasi Skenario |
| :--- | :--- |
| **Jumlah Peserta** | 30–35 Siswa (1 Rombel Kelas Penuh). |
| **Lokasi Uji** | 1 Ruang Laboratorium Komputer Sekolah. |
| **Infrastruktur Jaringan** | Jaringan Kabel LAN Ethernet 100/1000 Mbps (Direct to Switch). |
| **Perangkat Klien** | PC Desktop / Thin Client Lab Sekolah (Browser Google Chrome 90+). |
| **Mata Pelajaran Uji** | 1 Mata Pelajaran Simulasi / Kuis Formatif (misal: Informatika / Bahasa Indonesia). |
| **Karakteristik Soal** | 30 Butir Soal Campuran: 20 PG, 5 PG Kompleks, 3 Menjodohkan, 2 Esai Singkat. |
| **Durasi Ujian** | 60 Menit. |
| **Fokus Pengujian** | 1. Alur masuk & validasi token oleh siswa.<br>2. Kenyamanan navigasi soal, font, math KaTeX, dan gambar stimulus.<br>3. Kecepatan autosave visual (indikator hijau tersimpan).<br>4. Uji coba submission dan verifikasi koreksi otomatis server.<br>5. Latihan operasional proktor menggunakan *Proctor Cockpit*. |
| **Target KPI** | Autosave success 100%, Error Rate 0%, Latensi P99 < 30 ms. |

---

## 2.2. Skenario Tier 2 — Beta Pilot (100 Siswa)

| Parameter | Spesifikasi Skenario |
| :--- | :--- |
| **Jumlah Peserta** | 100–105 Siswa (3 Rombel Paralel, misal Kelas X-A, X-B, X-C). |
| **Lokasi Uji** | 1 Lab Komputer (35 PC) + 2 Ruang Kelas Reguler (65 BYOD Smartphone/Laptop Siswa). |
| **Infrastruktur Jaringan** | Campuran: LAN Kabel di Lab + 2 Access Point Wi-Fi Bisnis (Dual-Band 5 GHz) di ruang kelas. |
| **Perangkat Klien** | 35 PC Lab + 45 Android Smartphone + 20 Laptop/iPad Siswa. |
| **Mata Pelajaran Uji** | Asesmen Sumatif Lingkup Materi Resmi (Penilaian Harian Bersama). |
| **Karakteristik Soal** | 40 Butir Soal Standar Kurikulum Merdeka (Stimulus literasi/numerasi, formula, tabel). |
| **Durasi Ujian** | 90 Menit. |
| **Fokus Pengujian** | 1. Ketahanan konkurensi Access Point Wi-Fi terhadap paket data bersamaan.<br>2. Evaluasi perilaku baterai smartphone dan rotasi layar siswa.<br>3. Pengujian *Single Device Lock* (simulasi siswa mencoba login di 2 HP).<br>4. Perilaku *Pre-Submit Synchronization Barrier* saat terjadi fluktuasi Wi-Fi.<br>5. Penanganan *Strike Alert* akibat siswa membuka notifikasi WhatsApp/panggilan masuk. |
| **Target KPI** | Autosave success $\ge 99.9\%$, Zero Answer Loss, Latensi P99 < 50 ms. |

---

## 2.3. Skenario Tier 3 — Full Scale Pilot (300 Siswa)

| Parameter | Spesifikasi Skenario |
| :--- | :--- |
| **Jumlah Peserta** | 300 Siswa (1 Jenjang Penuh, misal Seluruh Kelas VII atau Seluruh Kelas X). |
| **Lokasi Uji** | 2 Lab Komputer + 7 Ruang Kelas Sekolah. |
| **Infrastruktur Jaringan** | Backbone LAN Gigabit terpusat + 8 Access Point Terkelola (PoE Switch) + Router Core. |
| **Perangkat Klien** | 70 PC Sekolah + 230 Smartphone / Laptop Pribadi Siswa (BYOD). |
| **Mata Pelajaran Uji** | Penilaian Tengah Semester (PTS) / Penilaian Akhir Semester (PAS) Terjadwal. |
| **Karakteristik Soal** | 40–50 Butir Soal Asesmen Lengkap dengan pembobotan kompetensi. |
| **Durasi Ujian** | 90 Menit Ujian Aktif + 15 Menit Masa Registrasi & Token Entry. |
| **Fokus Pengujian** | 1. **Entry Burst Wave (Menit 0–5):** Lonjakan 300 request validasi token serentak.<br>2. **Steady-State Concurrency (Menit 5–75):** Antrean tulis SQLite WAL `cbtWriteQueue` melayani ~100 req/detik secara mulus tanpa *SQLITE_BUSY*.<br>3. **Submission Wave (Menit 75–90):** Pengumpulan lembar ujian massal di server.<br>4. **Koreksi & Rekonsiliasi:** Verifikasi integrasi transfer nilai ke Modul M13 Buku Nilai Sekolah. |
| **Target KPI** | Autosave success $\ge 99.95\%$, Submit success 100%, Error Rate $< 0.05\%$, Latensi P99 < 80 ms. |

---

# 3. Kebutuhan Infrastruktur Minimum Sekolah

Untuk menjamin keberhasilan uji coba, sekolah mitra pilot **WAJIB** memenuhi spesifikasi teknis berikut:

### 3.1. Spesifikasi Server Ujian (On-Premises / Mini PC Sekolah)
- **Processor:** Minimal 4 Cores / 8 Threads (Intel Core i5 Gen 10+ / AMD Ryzen 5 3600+ atau setara).
- **RAM:** Minimal 8 GB DDR4 (Disarankan 16 GB DDR4 untuk Tier 3).
- **Storage:** **WAJIB NVMe SSD PCIe 3.0/4.0** minimal 256 GB (Kecepatan tulis > 1500 MB/s). **DILARANG menggunakan HDD mekanik SATA.**
- **Network Interface Card (NIC):** 1x Gigabit Ethernet (1000 Mbps) Full Duplex.
- **Sistem Operasi:** Ubuntu Server 22.04/24.04 LTS atau Windows Server / Windows 11 Pro 64-bit teroptimasi.
- **Node.js Runtime:** Node.js 22 LTS dengan alokasi memory heap `--max-old-space-size=4096`.

### 3.2. Spesifikasi Jaringan & Distribusi Access Point (AP)
- **Topologi:** Server terhubung langsung ke Gigabit Core Switch menggunakan kabel LAN Cat6.
- **Access Point:** Wajib Access Point kelas bisnis (misal: Ruijie Reyee RG-RAP2200, Ubiquiti UniFi 6 Lite, Aruba Instant On, atau MikroTik cAP ac). **Dilarang keras memakai router rumahan bawaan Indihome/FirstMedia untuk >15 siswa.**
- **Rasio Client per AP:** Maksimal 35–45 perangkat per Access Point pada pita frekuensi **5 GHz (Channel width 20/40 MHz)**.
- **DHCP Server:** Subnet `/23` (IP Pool: 510 alamat IP, rentang `192.168.10.2` s.d `192.168.11.254`), dengan *lease time* pendek: **2 Jam**.
- **Bandwidth Management / Isolasi:** Port firewall lokal memblokir akses keluar ke situs video streaming, game, dan media sosial selama jam ujian berlangsung.

### 3.3. Spesifikasi Catu Daya & Lingkungan
- **UPS Server:** Wajib UPS minimal 1000 VA / 600 Watt dengan kemampuan tahan daya minimal 20 menit saat listrik padam.
- **Genset Sekolah:** Genset siaga dengan mekanisme pemindahan saklar (ATS atau manual < 5 menit).

---

# 4. Matriks Risiko Operasional & Mitigasi Awal

| Risiko Operasional | Tingkat | Dampak terhadap Siswa | Mitigasi Wajib Sebelum Ujian |
| :--- | :---: | :--- | :--- |
| **Saturasi Wi-Fi Ruang Kelas** | Tinggi | Siswa mengalami connection timeout | Bagi frekuensi 5 GHz dan batasi maksimal 40 client per Access Point. |
| **HP Siswa Kehabisan Baterai** | Sedang | Layar mati, pengerjaan terhenti | Wajibkan baterai $\ge 80\%$ sebelum masuk ruang dan siapkan 10 laptop cadangan. |
| **Jam Server Tidak Sinkron (Clock Skew)** | Sedang | Batas waktu ujian siswa salah hitung | Eksekusi kalibrasi NTP (`chronyc makestep` / `w32tm /resync`) di H-1. |
| **Notifikasi Masuk Memicu Strike** | Sedang | Siswa panik terkena peringatan curang | Pandu siswa mengaktifkan mode *Do Not Disturb* (Jangan Ganggu) sebelum token dibagikan. |
| **Ruang Disk Penuh Akibat Log** | Rendah | Database SQLite terkunci (read-only) | Verifikasi ruang kosong harddisk server minimal 20 GB sebelum sesi 1 dimulai. |

---

# 5. Rekomendasi Jadwal Eksekusi Pilot

```text
Minggu ke-1: Persiapan Infrastruktur, Pelatihan SOP Proktor & Simulasi Tier 1 (30 Siswa)
Minggu ke-2: Evaluasi Hasil Tier 1, Optimasi Access Point & Eksekusi Tier 2 (100 Siswa)
Minggu ke-3: Verifikasi Stress Point, Dry Run Pengawas & Eksekusi Tier 3 (300 Siswa)
Minggu ke-4: Evaluasi Menyeluruh, Audit Integritas Nilai & Persetujuan Rilis Produksi
```
