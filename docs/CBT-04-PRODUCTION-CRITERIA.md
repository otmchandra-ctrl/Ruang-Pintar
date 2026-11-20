# CBT-04 — PILOT MONITORING KPIS & PRODUCTION RELEASE CRITERIA
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-04 — SCHOOL PILOT PREPARATION & OPERATIONAL READINESS |
| **Dokumen** | Metrik Monitoring KPI Pilot & Kriteria Kelulusan Menuju Rilis Produksi (GA) |
| **Audiens** | Dewan Arsitektur Perangkat Lunak, Penjamin Mutu (QA), Tim Produk Sekolah |
| **Target Evaluasi** | Kelulusan Uji Coba Lapangan Nyata (Tier 1, Tier 2, Tier 3) |
| **Status Keputusan** | **READY FOR PILOT EXECUTION** |
| **Tanggal Terbit** | 8 Oktober 2026 |

---

# 1. Monitoring Dashboard KPI Pilot Sekolah

Selama pelaksanaan pilot di lapangan, tim teknisi dan proktor memantau performa platform secara real-time melalui 5 metrik utama KPI Pilot:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      PILOT REAL-TIME MONITORING METRICS PANEL                          │
├─────────────────────┬─────────────────────┬─────────────────────┬──────────────────────┤
│ 1. ACTIVE SESSIONS  │ 2. AUTOSAVE RATE    │ 3. SUBMIT RATE      │ 4. LATENCY & ERRORS  │
│    Target: 100%     │    Target: ≥ 99.9%  │    Target: 100.0%   │    Avg: < 30ms       │
│    Peserta Roster   │    Zero Drop        │    Zero Hang        │    Error: < 0.05%    │
└─────────────────────┴─────────────────────┴─────────────────────┴──────────────────────┘
```

---

## 1.1. Definisi & Ambang Batas 5 KPI Utama

| Metrik KPI | Definisi Operasional | Target Minimum Lolos | Ambang Kritis (Alert) | Metode Pengukuran |
| :--- | :--- | :---: | :---: | :--- |
| **1. Active Sessions** | Rasio jumlah siswa yang berhasil menginisialisasi attempt terhadap total siswa yang dijadwalkan pada sesi tersebut. | **100%** siswa hadir | $< 95\%$ | Query: `count(status = 'IN_PROGRESS' \| 'SUBMITTED') / total_roster_hadir` |
| **2. Autosave Success Rate** | Persentase request penyimpanan jawaban otomatis yang berhasil dikonfirmasi oleh database tanpa kegagalan permanen. | **$\ge 99.90\%$** | $< 99.00\%$ | Log mutasi `cbtWriteQueue` dan metrik HTTP response code 200 pada endpoint autosave. |
| **3. Submit Success Rate** | Persentase lembar ujian yang berhasil dikumpulkan secara permanen, terhitung nilainya, dan status berubah menjadi `SUBMITTED`. | **100.00%** | $< 100.00\%$ | Rekonsiliasi `count(jawabanSiswa)` terhadap `SnapshotUjian` pada setiap attempt selesai. |
| **4. Average Latency (Rata-rata & P99)** | Waktu putaran bolak-balik (*Round-Trip Time*) pemrosesan request autosave dari browser ke server database. | **Rata-rata: $< 30\text{ ms}$**<br>**P99: $< 100\text{ ms}$** | Rata-rata $> 100\text{ ms}$<br>P99 $> 300\text{ ms}$ | Middleware timer log server action `saveAnswerOptimized`. |
| **5. Error Rate (5xx / 4xx)** | Rasio respons galat server (*Internal Server Error*, *Database Busy*, *Crash*) terhadap total request yang masuk. | **$< 0.05\%$** | $> 0.20\%$ | Log aggregasi server dan exception tracker. |

---

# 2. Kriteria Kelulusan Pilot Menuju Rilis Produksi Penuh (GA Criteria)

Untuk beralih dari status **School Pilot** ke status **Production Release (General Availability)** yang dapat digunakan oleh seluruh sekolah di Indonesia secara mandiri, sistem harus membuktikan pemenuhan kriteria kuantitatif dan kualitatif berikut:

---

## 2.1. Kriteria Kuantitatif (Hard Gates)

1. **Zero Unrecoverable Answer Loss (Nol Kehilangan Data):**
   - Tidak ada satu pun butir jawaban siswa yang hilang atau terhapus secara permanen selama pengerjaan, baik akibat fluktuasi Wi-Fi, refresh browser, maupun pergantian gawai.
2. **Kestabilan Konkurensi Puncak (Peak Stress):**
   - Sukses melayani Tier 3 (300 siswa serentak) tanpa satupun insiden database lock (*SQLITE_BUSY timeout*) dan latensi P99 tetap berada di bawah 100 ms.
3. **Kepatuhan Penilaian Otomatis 100%:**
   - Skor otomatis pilihan ganda, pilihan ganda kompleks, benar/salah, dan menjodohkan 100% identik dengan kunci jawaban resmi guru tanpa deviasi pembobotan.
4. **Keberhasilan Transfer Nilai ke Modul M13:**
   - 100% data nilai siswa yang telah disubmit berhasil dialirkan ke Buku Nilai sekolah (`/penilaian`) tanpa anomali relasi foreign key atau tenancy mismatch.
5. **Uptime Sistem Selama Jam Ujian:**
   - Ketersediaan sistem mencapai **99.99%** selama jendela waktu pelaksanaan ujian aktif.

---

## 2.2. Kriteria Kualitatif (Soft Gates)

1. **Tingkat Kemudahan Proktor & Pengawas:**
   - $\ge 90\%$ proktor menyatakan *Proctor Cockpit* mudah digunakan, responsif, dan memberikan kejelasan status siswa tanpa kebingungan.
2. **Kenyamanan Siswa (User Experience):**
   - Siswa tidak mengalami hambatan dalam membaca stimulus gambar, persamaan matematika, dan navigasi daftar nomor soal.
3. **Zero False Positive Anti-Cheat Scandal:**
   - Tidak ada siswa jujur yang didiskualifikasi secara keliru akibat perilaku keyboard virtual gawai Android atau pergantian orientasi layar.
4. **Efektivitas SOP Lapangan:**
   - Tim sekolah (Admin, Guru, Proktor, Pengawas, Teknisi) mampu mengeksekusi peran mereka secara mandiri tanpa membutuhkan intervensi langsung dari pengembang (*Zero Code-Level Assistance*).

---

# 3. Batas Ambang Kegagalan Mutlak (Hard Red Lines)

Jika salah satu dari kejadian berikut terjadi selama masa pilot, status pilot dinyatakan **GAGAL** dan sistem **DILARANG** dirilis ke produksi hingga perbaikan arsitektural selesai:

```text
========================================================================================
                      HARD RED LINES (PENGHENTI RILIS OTOMATIS)
========================================================================================
[RED LINE 1] Terjadi kehilangan jawaban siswa (Data Loss > 0 butir) yang tidak dapat
             dipulihkan dari buffer server maupun localStorage klien.
[RED LINE 2] Kunci jawaban bocor ke sisi klien (Client-Side Inspection Payload) akibat
             kecerobohan pengiriman DTO Snapshot.
[RED LINE 3] Database SQLite mengalami data corruption atau unrecoverable lock contention.
[RED LINE 4] Terjadi kebocoran data antar-sekolah (Cross-Tenant Data Leakage).
[RED LINE 5] Sistem crash total saat burst entry wave di awal sesi ujian (> 5 menit downtime).
========================================================================================
```

---

# 4. Pernyataan Keputusan Resmi Akhir

Berdasarkan seluruh hasil audit CBT-03.5, penyusunan SOP multi-peran, perancangan skenario bertingkat (30, 100, 300 siswa), playbook tanggap darurat, dan daftar periksa Go-Live:

```text
========================================================================================
                         KEPUTUSAN EVALUASI RESMI
========================================================================================

                 ╔══════════════════════════════════════════════╗
                 ║                                              ║
                 ║         READY FOR PILOT EXECUTION            ║
                 ║                                              ║
                 ╚══════════════════════════════════════════════╝

Sistem CBT Ruang Pintar secara arsitektural, teknis, dan operasional dinyatakan
LAYAK DAN SIAP UNTUK DIEKSEKUSI PADA PROGRAM SEKOLAH PERCONTOHAN (PILOT SEKOLAH).
========================================================================================
```

---

# 5. Rekomendasi Sebelum Digunakan pada Siswa Nyata

Sebelum satu pun siswa nyata memasukkan token ujian pada Tier 1:

1. **Lakukan Uji Simulasi Beban Lokal (Dry Run) H-1:**
   - Gunakan 10–15 laptop di lab sekolah untuk menjalankan skenario pengerjaan otomatis bersamaan guna memvalidasi bahwa Access Point dan kabel LAN lokal tidak memiliki masalah fisik.
2. **Kunci Seluruh Naskah Ujian H-2:**
   - Dilarang memodifikasi butir soal pada Hari-H saat ujian telah berstatus `SEDANG_BERLANGSUNG`.
3. **Wajib Pasang UPS Mini Server:**
   - Jangan pernah menyalakan server produksi ujian tanpa UPS aktif, guna mencegah risiko pemadaman listrik mendadak merusak partisi file sistem operasi.
4. **Patuhi Tahapan Tiering Secara Disiplin:**
   - Dilarang langsung melompat ke 300 siswa (Tier 3) tanpa melalui kelulusan evaluasi Tier 1 (30 siswa) dan Tier 2 (100 siswa).
