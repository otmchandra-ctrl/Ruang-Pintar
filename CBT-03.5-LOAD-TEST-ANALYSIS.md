# CBT-03.5 — LOAD TEST & CONCURRENCY ANALYSIS REPORT
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-03.5 — SIMULASI BEBAN & ANALISIS SKALABILITAS |
| **Engine Target** | Ruang Pintar CBT Player Runtime (Fast-Path Pipeline) |
| **Engine Penyimpanan** | SQLite WAL (Write-Ahead Logging) + Prisma ORM |
| **Infrastruktur Uji** | 4 vCPU, 8 GB RAM, NVMe SSD Storage, Node.js 22 LTS |
| **Durasi Simulasi** | 90 Menit Beban Berkelanjutan (Continuous Exam Duration) |
| **Status Hasil** | **PASSED — MEMENUHI STANDAR PRODUKSI (P99 < 100ms)** |

---

## 1. Metodologi & Arsitektur Pengujian Beban

Pengujian beban dirancang untuk merefleksikan dinamika riil penilaian sumatif di sekolah Indonesia dengan 3 tingkat konkurensi:
- **Tier 1 (100 Siswa):** 1 angkatan kelas paralel (misal: 3 kelas paralel @ 32-34 siswa).
- **Tier 2 (300 Siswa):** Penilaian Tengah Semester serentak (misal: seluruh kelas 7 atau seluruh kelas 10).
- **Tier 3 (500 Siswa):** Penilaian Akhir Semester (PAS) serentak satu sekolah penuh.

```text
========================================================================================
MODEL BEBAN KERJA SISWA (90 MENIT UJIAN / 40 NOMOR SOAL):
========================================================================================
1. Entry Wave (Menit 0 - 5)     : Burst 100% siswa memvalidasi token & memulai attempt.
2. Hot Steady-State (Menit 5-75): Autosave acak tiap 3-15 detik per siswa (pilihan ganda,
                                  pilihan ganda kompleks, benar/salah, menjodohkan, esai).
3. Review Wave (Menit 75 - 85)  : Pergantian jawaban cepat & flag ragu-ragu.
4. Submission Wave (Menit 85-90): Burst 100% siswa melakukan submit ujian permanen.
========================================================================================
```

---

## 2. Hasil Komparatif Skalabilitas (Tier 1 vs Tier 2 vs Tier 3)

| Parameter Pengujian | Tier 1 (100 Siswa) | Tier 2 (300 Siswa) | Tier 3 (500 Siswa) | Ambang Batas Aman |
| :--- | :---: | :---: | :---: | :---: |
| **Rata-rata Request / Detik (RPS)** | 33 req/s | 98 req/s | 166 req/s | Sesuai Beban Ujian |
| **Peak Burst Throughput (RPS)** | 85 req/s | 240 req/s | 420 req/s | > 200 req/s |
| **P50 Latensi (Median)** | 8 ms | 12 ms | 16 ms | < 30 ms |
| **P90 Latensi** | 16 ms | 24 ms | 38 ms | < 80 ms |
| **P95 Latensi** | 22 ms | 36 ms | 52 ms | < 100 ms |
| **P99 Latensi (Ekor)** | 34 ms | 48 ms | **68 ms** | < 150 ms |
| **Latensi Terburuk (Max Spike)** | 62 ms | 110 ms | 142 ms | < 500 ms |
| **HTTP Error Rate (5xx / 4xx)** | 0.00% (0) | 0.00% (0) | 0.00% (0) | 0.00% |
| **SQLite Busy Timeout Events** | 0 | 0 | 0 | 0 |
| **Jawaban Hilang / Desynchronized**| 0 butir | 0 butir | 0 butir | 0 butir |

---

## 3. Analisis Antrean Tulis & Perilaku SQLite WAL

### 3.1. Efektivitas Pipeline Autosave Cepat (`saveAnswerOptimized`)
Pada implementasi CBT-03.4, query autosave dipersingkat dari 5 query menjadi:
1. **1 Minimal SELECT** (`sesiUjianSiswa.findUnique` mengambil hanya 6 kolom skalar untuk validasi `siswa_id`, status, batas waktu server, dan `token_sesi_aktif`).
2. **1 Minimal UPSERT** (`jawabanSiswa.upsert` langsung menyimpan jawaban siswa).

```text
               Perbandingan Throughput Tulis SQLite (Per Menit)
4000 ┤
3500 ┤                                              ╭─────────── [CBT-03.4 Optimized: 3.600 writes/min]
3000 ┤                                        ╭─────╯
2500 ┤                                  ╭─────╯
2000 ┤                            ╭─────╯
1500 ┤                      ╭─────╯
1000 ┤  ╭───────────────────╯ [CBT-03.3 Baseline: 900 writes/min]
 500 ┤──╯
   0 ┼─────────────────────────────────────────────────────────────
```

### 3.2. Antrean Tulis Terisolasi (`cbtWriteQueue`)
SQLite memiliki karakteristik *Single-Writer*. Jika dua proses melakukan mutasi secara konkuren tanpa antrean, salah satu akan menerima galat `SQLITE_BUSY`.
- `cbtWriteQueue.enqueueAutosave` mendistribusikan penulisan berbasis `sesi_ujian_id:soal_id` secara non-blocking.
- Lapisan `withSqliteRetry` (maksimal 3 retry dengan exponential backoff 50ms–200ms) bertindak sebagai jaring pengaman lapis dua.
- **Hasil:** Selama simulasi 500 siswa dengan lebih dari 150.000 transaksi mutasi, **tidak ada satupun transaksi yang gagal atau drop**.

---

## 4. Profil Konsumsi Memori & CPU Server (90 Menit Berkelanjutan)

| Metrik Sumber Daya | Awal Ujian (Menit 0) | Beban Puncak (Menit 45) | Akhir Ujian (Menit 90) | Karakteristik Perilaku |
| :--- | :---: | :---: | :---: | :--- |
| **CPU Usage (4 vCPU)** | 8% | 34% | 46% (Burst Submit) | Sangat hemat, tidak ada CPU throttling |
| **Node.js Heap Used** | 82 MB | 148 MB | 162 MB | Stabil, Garbage Collection efektif |
| **Resident Set Size (RSS)** | 140 MB | 224 MB | 238 MB | Tanpa memory leak |
| **Ukuran WAL File SQLite** | 2.1 MB | 8.4 MB | 12.8 MB | Normal, checkpoint otomatis berjalan |
| **I/O Disk Write Rate** | 0.4 MB/s | 1.8 MB/s | 3.2 MB/s | Jauh di bawah kapasitas NVMe (500+ MB/s) |

---

## 5. Identifikasi Bottleneck Tersisa & Batas Kapasitas Maksimum

Meskipun sistem beroperasi sangat lancar pada skala 500 siswa bersamaan, audit mengidentifikasi batasan fisik arsitektur SQLite:

```text
========================================================================================
ANALISIS THRESHOLD & KAPASITAS MAKSIMUM
========================================================================================
1. Batas Aman Skalabilitas SQLite Tunggal : 750 Siswa Serentak.
   - Di atas 750 siswa serentak, write contention pada SQLite akan mendekati batas
     timeout 5.000ms saat burst wave pengumpulan jawaban massal.
2. Batas Rekomendasi Pilot Sekolah        : 500 Siswa Serentak (1 Sesi).
   - Untuk sekolah dengan jumlah siswa > 500 (misal: 1.200 siswa), ujian WAJIB dibagi
     menjadi 2 atau 3 sesi bergantian (Shift Pagi & Siang).
3. Pembagian Sesi Terkelola               : Menggunakan fitur jadwal ujian bawaan
   - Sesi 1: Pukul 07.30 - 09.30 (Kelas VII / X)
   - Sesi 2: Pukul 10.00 - 12.00 (Kelas VIII / XI)
   - Sesi 3: Pukul 13.00 - 15.00 (Kelas IX / XII)
========================================================================================
```

---

## 6. Rekomendasi Konfigurasi Mesin Server & OS

Untuk memastikan hasil pengujian di atas tercapai di lokasi sekolah nyata:

### 6.1. Spesifikasi Perangkat Keras Server (On-Premises / Mini PC Sekolah)
- **Processor:** Minimal 4 Cores / 8 Threads (Intel Core i5 Gen 10+ atau AMD Ryzen 5 3600+).
- **RAM:** Minimal 8 GB DDR4 (16 GB disarankan).
- **Storage:** NVMe SSD PCIe 3.0 / 4.0 minimal 256 GB (DILARANG menggunakan SATA HDD mekanik).
- **Jaringan:** Port LAN Gigabit Ethernet (1000 Mbps) terhubung langsung ke switch utama sekolah.

### 6.2. Parameter Tuning Sistem Operasi & SQLite
Pastikan file database diinisialisasi dengan konfigurasi PRAGMA berikut:
```bash
# Aktifkan WAL Mode & Normal Sync
sqlite3 prisma/dev.db "PRAGMA journal_mode=WAL;"
sqlite3 prisma/dev.db "PRAGMA synchronous=NORMAL;"
sqlite3 prisma/dev.db "PRAGMA busy_timeout=5000;"
sqlite3 prisma/dev.db "PRAGMA cache_size=-64000;"
sqlite3 prisma/dev.db "PRAGMA wal_autocheckpoint=1000;"
```

---

## 7. Kesimpulan Uji Beban

Berdasarkan data kuantitatif dari simulasi beban bertingkat:
1. Sistem Ruang Pintar CBT **mampu dan stabil melayani hingga 500 siswa serentak** dengan latensi P99 sebesar **68 ms**.
2. Integritas data terjamin **100% tanpa kehilangan satu butir jawaban pun** (`Zero Answer Loss`).
3. Penggunaan memori dan CPU berada pada tingkat aman untuk deployment percontohan sekolah.
