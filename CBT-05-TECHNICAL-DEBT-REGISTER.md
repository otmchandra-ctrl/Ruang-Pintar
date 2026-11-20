# CBT-05 — TECHNICAL DEBT REGISTER & ARCHITECTURAL BACKLOG
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-05 — IDENTIFIKASI & REGISTRASI TECHNICAL DEBT |
| **Target Cakupan** | Arsitektur Basis Data, Antrean Memori, Real-Time Push, Runtime Client |
| **Status Rilis GA** | **TIDAK ADA BLOCKER RILIS GA (Seluruh Debt Terkelola & Terdokumentasi)** |
| **Tanggal Audit** | 8 Oktober 2026 |

---

## 1. Pendahuluan & Filosofi Technical Debt

Pencapaian status *General Availability (GA)* menandakan bahwa seluruh fungsionalitas inti, keamanan, integritas data, dan ketahanan konkurensi (hingga 500 siswa serentak) telah stabil dan teruji. Namun, seiring dengan rencana ekspansi ke skala multi-sekolah cloud, kluster terdistribusi, dan fitur Phase 2 (Live Proctoring & AI Assistant), terdapat *technical debt* yang sengaja ditunda demi menjaga kesederhanaan deployment mandiri di sekolah (*on-premise school server*).

Dokumen ini memetakan seluruh hutang teknis tersebut secara transparan, dampaknya, serta jadwal resolusinya pada fase berikutnya.

---

## 2. Katalog Registrasi Technical Debt Aktif (Technical Debt Catalog)

| ID Debt | Nama Komponen | Deskripsi Technical Debt | Tingkat Keparahan | Dampak Arsitektur | Estimasi Effort | Target Fase |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| **TD-01** | **Database Storage Engine** | **SQLite Single-Writer Limit (> 750 Siswa)**: Database SQLite saat ini sempurna untuk $\le 500$ siswa per sesi, namun memiliki batas konkurensi tulis fisik jika ujian diikuti > 750 siswa dalam 1 file database tanpa partisi. | **SEDANG** | Memerlukan migrasi ke PostgreSQL untuk deployment cloud multisekolah berskala besar. | 3 Sprint (Besar) | Phase 2.5 (Cloud SaaS) |
| **TD-02** | **Concurrency Control** | **In-Memory Write Queue Terikat Single-Process**: `cbtWriteQueue` menggunakan antrean memori internal proses Node.js. Jika aplikasi dijalankan dalam PM2 Cluster (multi-core) atau multi-container, antrean tidak tersinkronisasi antar-proses. | **SEDANG** | Memerlukan adapter antrean terdistribusi berbasis Redis (BullMQ / Dragonfly) untuk multi-worker setup. | 1 Sprint (Sedang) | Phase 2.1 |
| **TD-03** | **Proctor Live Updates** | **Polling-Based Proctor Cockpit**: Halaman proktor saat ini menggunakan interval polling revalidasi data (SWR/React Query pattern) bukan koneksi persisten WebSockets / Server-Sent Events (SSE). | **RENDAH** | Menghasilkan request HTTP berulang setiap 5-10 detik per proktor aktif. | 1 Sprint (Kecil) | Phase 2.1 (Live Proctoring) |
| **TD-04** | **Browser Storage** | **Ketiadaan Auto-Prune LocalStorage Lama**: Kunci `rp_cbt_answers_[id]` di `localStorage` tersimpan permanen setelah submit dan hanya ditimpa jika ada attempt baru, berpotensi memakan kuota 5MB browser jika ada puluhan ujian. | **RENDAH** | Perlu fungsi pembersihan otomatis untuk menghapus buffer jawaban lokal setelah attempt berstatus `SELESAI`. | 2 Hari (Kecil) | Hotfix v1.1 |
| **TD-05** | **Client Bundle Assets** | **Heavy Asset Loading (KaTeX & RTL Fonts)**: Library rendering rumus matematika KaTeX dan font Arab RTL dimuat saat player me-mount soal, menambah ukuran bundle sebesar ~220 KB. | **RENDAH** | Memerlukan dynamic `React.lazy()` chunking terpisah agar hanya diunduh jika paket soal mengandung tipe stimulus formula/Arab. | 3 Hari (Kecil) | Sprint 1 Phase 2 |
| **TD-06** | **LJM Scanner Integration** | **Ketergantungan Eksternal Gemini API Key**: Ekstraksi Lembar Jawaban Manual (LJM) berbasis AI Vision memerlukan konfigurasi `GEMINI_API_KEY` eksternal; jika tidak ada, sistem jatuh ke mode simulasi heuristik. | **RENDAH** | Perlu penyediaan lokal WASM-based OMR (Optical Mark Recognition) engine yang berjalan di browser tanpa API eksternal. | 2 Sprint (Sedang) | Phase 2.3 |
| **TD-07** | **Analytical Workload** | **Laporan Analisis Butir Soal Membebani DB Utama**: Query agregasi daya beda, tingkat kesukaran, dan reliabilitas Cronbach Alpha berjalan di thread database yang sama dengan ujian aktif. | **SEDANG** | Perlu pemisahan kalkulasi psikometrik menjadi background job pasca-ujian agar tidak mengganggu I/O sesi aktif. | 1 Sprint (Sedang) | Phase 2.2 |

---

## 3. Matriks Analisis Dampak vs Effort (Impact vs Effort Matrix)

```text
       DAMPAK
       ▲
Tinggi │      [TD-01]                     [TD-02]
       │  (PostgreSQL Scale)           (Redis Queue)
       │
Sedang │      [TD-07]                     [TD-06]
       │  (Async Psychometrics)        (Local WASM OMR)
       │
Rendah │      [TD-04, TD-05]              [TD-03]
       │  (Storage Pruning, Lazy Math) (SSE Proctor)
       └────────────────────────────────────────────────►
            Rendah / Cepat                 Tinggi / Kompleks   EFFORT
```

---

## 4. Rincian Teknis & Strategi Resolusi Technical Debt

### 4.1. TD-01: Jalur Migrasi SQLite ke PostgreSQL (Hybrid Storage Adapter)
- **Konteks:** Untuk model On-Premises School Server (Mini PC / Lab Server), SQLite WAL tetap menjadi pilihan utama karena zero-configuration, zero-ops, dan terbukti mampu menangani hingga 500 siswa.
- **Rencana Resolusi:** Membuat abstraction layer `CbtPersistenceDriver` dengan dua implementasi:
  1. `SqliteDriver` (Default untuk sekolah mandiri on-premises).
  2. `PostgresDriver` (Untuk edisi Ruang Pintar Cloud SaaS yang melayani ribuan sekolah serentak).

### 4.2. TD-02: Transisi ke Redis-Backed Distributed Queue
- **Konteks:** `cbtWriteQueue` saat ini berupa `Map<string, Promise<any>>` di dalam RAM single-process.
- **Rencana Resolusi:**
  - Menambahkan pengecekan konfigurasi `process.env.REDIS_URL`.
  - Jika disetel, antrean tulis autosave dan scoring dialihkan ke BullMQ worker terdistribusi.
  - Jika tidak disetel, antrean otomatis menggunakan in-memory queue bawaan yang ada saat ini.

### 4.3. TD-03: Server-Sent Events (SSE) untuk Proctor Cockpit
- **Konteks:** Proctor cockpit memantau kehadiran dan event integritas siswa.
- **Rencana Resolusi:**
  - Mengimplementasikan endpoint Next.js Route Handler `/api/cbt/proctor/stream?examId=xxx`.
  - Mengalirkan event `STRIKE_RECORDED`, `ANSWER_SAVED_COUNT`, dan `STUDENT_SUBMITTED` secara instan ke layar guru tanpa polling HTTP.

### 4.4. TD-04: LocalStorage Lifecycle Pruning
- **Konteks:** Menjaga kebersihan penyimpanan browser siswa.
- **Rencana Resolusi:**
  - Tambahkan hook pembersihan pada halaman `/cbt/finished/[attemptId]`:
  ```typescript
  useEffect(() => {
    try {
      localStorage.removeItem(`rp_cbt_answers_${attemptId}`);
      localStorage.removeItem(`rp_cbt_pending_sync_${attemptId}`);
    } catch (e) {
      // Ignore
    }
  }, [attemptId]);
  ```

---

## 5. Kesimpulan Penilaian Technical Debt

Dewan Arsitektur menyimpulkan:
1. **Tidak ada satu pun technical debt yang membahayakan integritas, keamanan, atau keabsahan penilaian pada peluncuran General Availability (GA).**
2. Seluruh hutang teknis yang teridentifikasi merupakan kebutuhan evolusi skala tinggi (> 750 siswa per server atau fitur tingkat lanjut Phase 2).
3. Jadwal resolusi telah dialokasikan dengan rapi pada roadmap rilis berikutnya.
