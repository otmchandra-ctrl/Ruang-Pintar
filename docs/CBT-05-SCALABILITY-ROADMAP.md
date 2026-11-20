# CBT-05 — SCALABILITY ROADMAP & PHASE 2 INNOVATION BLUEPRINT
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-05 — ROADMAP SKALABILITAS & INOVASI CBT PHASE 2 |
| **Horison Waktu** | Q4 2026 s.d Q2 2027 |
| **Target Skalabilitas** | 500 Siswa ➔ 1.000 Siswa ➔ 50.000+ Siswa Multi-Sekolah SaaS |
| **Fokus Modul Phase 2** | Live Proctoring • AI Question Assistant • Psychometrics • Advanced Analytics |
| **Tanggal Terbit** | 8 Oktober 2026 |

---

## 1. Arsitektur Skalabilitas Bertingkat (Multi-Tier Scalability Strategy)

Ruang Pintar CBT dirancang untuk berevolusi secara mulus dari server mandiri lokal di sekolah pedesaan (*on-premise offline/hybrid*) hingga platform *Cloud Multi-Tenant SaaS* tingkat nasional.

```text
========================================================================================
TRAJEKTORI SKALABILITAS BERTAHAP
========================================================================================
TIER 1 (BASELINE GA)    │ TIER 2 (MID-SCALE)        │ TIER 3 (ENTERPRISE SAAS)
500 Siswa / Server      │ 1.000 Siswa / Server      │ 50.000+ Siswa Bersamaan
────────────────────────┼───────────────────────────┼───────────────────────────────────
SQLite WAL Mode         │ PostgreSQL + PgBouncer    │ PostgreSQL Multi-Tenant Sharding
In-Memory Write Queue   │ Redis BullMQ Serializer   │ Kafka / Redis Cluster Streams
Local Next.js Monolith  │ Docker Swarm / PM2 (4 Core)│ Kubernetes Auto-Scaling Pods
Local Asset Storage     │ S3-Compatible MinIO       │ AWS S3 + Cloudflare CDN Edge
========================================================================================
```

---

## 2. Rencana Peningkatan Skalabilitas Sistem

### 2.1. Skala 500 Siswa (Baseline Saat Ini — v1.0 GA)
- **Status:** **Terverifikasi 100% Stabil (P99: 68 ms)**.
- **Topologi:** Single Mini PC / Bare-Metal Server (4 Core, 8 GB RAM, NVMe SSD).
- **Penyimpanan:** SQLite WAL dengan `PRAGMA synchronous = NORMAL;` dan `PRAGMA busy_timeout = 5000;`.
- **Rekomendasi:** Untuk sekolah dengan total siswa $\le 500$, konfigurasi ini merupakan pilihan terbaik: hemat biaya, bebas maintenance database daemon eksternal, dan zero-ops.

### 2.2. Skala 1.000 Siswa (Single Large School / Kampus Terpadu)
Sekolah besar dengan 1.000 siswa serentak memiliki dua jalur implementasi:
1. **Jalur Operasional (Shift Model — Rekomendasi Tanpa Biaya):**
   Membagi ujian menjadi 2 sesi bergantian (Shift Pagi: 500 siswa, Shift Siang: 500 siswa). Sesi dan token dipisahkan menggunakan `ExamSession` Ruang Pintar.
2. **Jalur Arsitektur (PostgreSQL Hybrid Upgrade):**
   - Mengalihkan engine Prisma dari SQLite ke **PostgreSQL 16**.
   - Memasang **PgBouncer** dengan connection pooling mode transaction (max 100 pool).
   - Mengganti in-memory write queue dengan **Redis BullMQ** untuk mendistribusikan penulisan jawaban secara atomik antar proses.

### 2.3. Skala Multi-Sekolah Bersamaan (National Cloud Multi-Tenant SaaS)
Untuk melayani ratusan sekolah mitra secara simultan:
- **Tenant Sharding Architecture:**
  - Isolasi data berbasis `sekolah_id` ditingkatkan dengan *Database-per-Cluster* atau *Schema-per-Tenant* pada PostgreSQL.
  - Read Replicas dialokasikan khusus untuk dasbor guru, kepala sekolah, dan orang tua agar query analitik tidak membebani transaksi ujian siswa.
- **Media & Asset Offloading:**
  - Gambar dan stimulus audio dipindahkan dari server lokal ke **S3 Bucket / Cloudflare R2** dengan CDN caching di edge node.

---

## 3. Roadmap Inovasi CBT Phase 2 (Phase 2 Innovation Blueprint)

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            ROADMAP CBT PHASE 2 (2026 - 2027)                         │
└──────────────────────────────────────────────────────────────────────────────────────┘
      Q4 2026                      Q1 2027                               Q2 2027
         │                            │                                     │
         ▼                            ▼                                     ▼
 ┌───────────────┐            ┌───────────────┐                     ┌───────────────┐
 │   PHASE 2.1   │            │   PHASE 2.2   │                     │   PHASE 2.3   │
 │Live Proctoring│ ─────────> │ AI Question   │ ──────────────────> │ Psychometrics │
 │ & SSE Stream  │            │   Assistant   │                     │  & Analytics  │
 └───────────────┘            └───────────────┘                     └───────────────┘
```

---

### 3.1. Phase 2.1: Live Proctoring & Real-Time Monitoring
Modul pengawasan ujian modern berbasis real-time telemetry tanpa membebani bandwidth sekolah:

1. **Server-Sent Events (SSE) Proctor Stream:**
   - Menghilangkan polling HTTP pada dasbor proktor.
   - Status siswa (Sedang Mengerjakan, Soal Terakhir, Sisa Waktu, Ragu-ragu, Peringatan) diperbarui secara instan (< 500 ms).
2. **Periodic Webcam Snapshot Proctoring (Low-Bandwidth):**
   - Pengambilan foto webcam acak setiap 3–5 menit dengan kompresi WebP resolusi rendah (160x120px, ~8 KB).
   - Pengawas dapat melihat grid galeri visual seluruh siswa di satu layar.
3. **Dual-Camera QR Sync (Mobile Cam as Room Proctor):**
   - Siswa dapat memindai kode QR menggunakan kamera ponsel untuk dijadikan kamera pengawas sudut samping meja ujian saat mengerjakan di laptop.

---

### 3.2. Phase 2.2: AI Question Assistant & Quality Engine
Asisten kecerdasan buatan terintegrasi untuk membantu guru menyusun bank soal berkualitas:

1. **Automated Item Generator from CP & TP:**
   - Guru memilih Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) Kurikulum Merdeka.
   - AI men-generate draf naskah soal lengkap dengan stimulus kontekstual, opsi jawaban pengecoh logis (*plausible distractors*), dan rubrik penilaian.
2. **Distractor Quality & Ambiguity Checker:**
   - AI menganalisis apakah opsi pengecoh terlalu kentara salah atau memiliki multitafsir yang membingungkan siswa.
3. **Automated Cognitive Taxonomy Classifier:**
   - AI memprediksi secara otomatis Level Kognitif (L1 Pengetahuan/Pemahaman, L2 Aplikasi, L3 Penalaran/HOTS) dan Taksonomi Bloom (C1–C6) berdasarkan kata kerja operasional (KKO).

---

### 3.3. Phase 2.3: Psychometric Analytics Engine
Mesin analisis pengukuran mutu asesmen berstandar psikometri internasional:

1. **Classical Test Theory (CTT) Analytics:**
   - **Tingkat Kesukaran ($P$):** Menghitung proporsi siswa yang menjawab benar per butir soal ($P < 0.3$: Sukar, $0.3 \le P \le 0.7$: Sedang, $P > 0.7$: Mudah).
   - **Daya Pembeda ($D$):** Menghitung korelasi skor kelompok atas vs kelompok bawah ($D \ge 0.4$: Sangat Baik, $D < 0.2$: Wajib Direvisi).
   - **Efektivitas Pengecoh:** Mendeteksi opsi jawaban yang tidak pernah dipilih sama sekali oleh siswa.
2. **Reliabilitas Tes (Cronbach's Alpha & KR-20):**
   - Menghitung koefisien reliabilitas konsistensi internal paket ujian secara otomatis.
3. **Aberrant Response Pattern Detection:**
   - Mendeteksi pola jawaban janggal (misal: siswa menjawab benar seluruh soal HOTS tersukar namun salah pada seluruh soal dasar, mengindikasikan kebocoran kunci tertentu).

---

### 3.4. Phase 2.4: Advanced Diagnostic Reporting & Kurikulum Merdeka Matrix
Pelaporan cerdas yang langsung terhubung ke proses pembelajaran kelas:

1. **Matriks Diagnostik Ketuntasan Materi:**
   - Peta capaian kompetensi per materi dan per TP untuk seluruh kelas dalam bentuk *heatmap*.
2. **Pengelompokan Remedial Otomatis:**
   - Sistem secara otomatis mengelompokkan siswa ke dalam 3 tier intervensi:
     - *Perlu Bimbingan Khusus* (Skor < 60)
     - *Cukup / Menengah* (60 $\le$ Skor < 75)
     - *Mahir / Pengayaan* (Skor $\ge$ 75)
3. **Buku Nilai & Dapodik One-Click Export:**
   - Ekspor rekapitulasi nilai akhir langsung ke format impor Dapodik, Rapor Pendidikan, dan format Excel resmi dinas pendidikan.

---

## 4. Jadwal Pelaksanaan & Milestone Roadmap

| Milestone | Target Waktu | Fokus Deliverable Utama | Prasyarat Arsitektur |
| :---: | :---: | :--- | :--- |
| **v1.0 GA** | **Oktober 2026** | Rilis Umum CBT Engine (500 Siswa, Zero Loss, Anti-Cheat, 10 Dokumen Administrasi) | Baseline Saat Ini (Lengkap) |
| **v1.1 Patch** | **November 2026** | LocalStorage Pruning, KaTeX Lazy-Loading, Enhancements Dashboard Proktor | Non-Breaking Updates |
| **v2.0 Phase 2.1** | **Desember 2026** | SSE Live Proctoring, Periodic Snapshot Webcam, Real-Time Progress Bar | Route Handler SSE |
| **v2.1 Phase 2.2** | **Januari 2027** | AI Question Assistant (Gemini Flash integration), Kurikulum Merdeka Taxonomy | Gemini API Pipeline |
| **v2.2 Phase 2.3** | **Maret 2027** | Psychometrics Engine (CTT, Daya Beda, Cronbach Alpha, Distractor Analysis) | Background Job Queue |
| **v2.5 Enterprise**| **Mei 2027** | PostgreSQL Multi-Tenant Migration, Redis BullMQ, Cloud SaaS Scale | Hybrid Storage Driver |

---

## 5. Kesimpulan Roadmap

Ruang Pintar CBT memiliki jalur evolusi yang jelas, realistis, dan berkesinambungan. Fondasi v1.0 GA saat ini memberikan keandalan maksimal bagi sekolah, sementara cetak biru Phase 2 memastikan Ruang Pintar tetap menjadi platform operasional digital sekolah paling modern dan komprehensif di Indonesia.
