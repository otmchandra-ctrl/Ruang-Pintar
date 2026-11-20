# ASSESSMENT ENGINE BLUEPRINT
## Ruang Pintar — School Digital Operating Platform
### STAGE CBT-01: Audit & Perancangan Arsitektur Assessment Engine Terpadu

| Metadata | Nilai Canonical |
| --- | --- |
| **Produk / Sub-sistem** | Ruang Pintar — Unified Assessment & Computer-Based Testing (CBT) Engine |
| **Kode Tahap** | `STAGE CBT-01` |
| **Status Dokumen** | `READY FOR HUMAN REVIEW` |
| **Klasifikasi Modul** | Core Academic Experience (M13 Assessment & Gradebook + M14 CBT Engine) |
| **Versi Dokumen** | 2.0 (Architectural Blueprint) |
| **Tanggal Audit & Desain** | 7 Oktober 2026 |
| **Prinsip Utama** | *Assessment Definition ≠ Grade ≠ Grade Publication*, *Missing Grade ≠ Zero Grade*, *Server-Authoritative Security*, *Anti-Slop Craftsmanship* |

---

# 1. Eksekutif Ringkasan & Visi Sistem

## 1.1. Latar Belakang & Masalah Sistem Eksisting
Berdasarkan audit mendalam terhadap modul `M13 (Assessment & Gradebook)` dan `M14 (CBT)` pada basis kode saat ini, sistem penilaian masih terfragmentasi menjadi dua subsistem yang terpisah:
1. **Silo Konseptual & Teknis:** Guru harus memilih antara membuat kolom nilai manual di `/penilaian` atau membuat paket ujian di `/cbt-ujian`. Penyerahan tugas LMS (`DefinisiTugas` M11) juga berdiri sendiri tanpa integrasi mulus ke buku nilai.
2. **Karakteristik "Database CRUD" vs "Operational Assessment Platform":** Modul CBT saat ini baru sebatas formulir CRUD soal dan formulir pengerjaan siswa dasar. Sistem belum memiliki *Live Proctoring Cockpit* layar penuh, token ujian bersifat statis di database, evaluasi soal uraian (esai) belum memiliki antarmuka *blind grading*, dan sistem belum menyediakan analitik psikometri butir soal (*Item Analysis*).
3. **Keterbatasan Format Stimulus Soal:** Pembelajaran sekolah modern membutuhkan soal kaya media: rumus matematika & sains kompleks (KaTeX), teks Arab berharakat rapi (*Right-to-Left*), berkas audio listening bahasa dengan pembatasan jumlah putar, serta diagram gambar beresolusi tinggi.

## 1.2. Visi Assessment Engine 2.0
**Assessment Engine Ruang Pintar** dirancang sebagai ekosistem penilaian terpadu yang menjembatani **seluruh spektrum evaluasi pembelajaran sekolah**:
- **Formatif Harian (Low-Stakes):** Kuis kilat, apersepsi, latihan mandiri per Tujuan Pembelajaran (TP), dan exit ticket tanpa friksi token rumit, memberikan umpan balik langsung kepada siswa.
- **Sumatif Terstruktur (High-Stakes):** Penilaian Harian (PH), Sumatif Tengah Semester (STS/PTS), Sumatif Akhir Semester (SAS/PAS), Ujian Sekolah (US), dan Asesmen Standar Institusi dengan pengamanan ketat (*fullscreen lock*, deteksi pindah tab, token dinamis, pengawasan proktor waktu nyata).
- **Multi-Modal Delivery:** Tidak hanya CBT digital di layar, tetapi juga mendukung Penilaian Hibrida (koreksi LJM lembar kertas) dan Penilaian Kinerja/Praktik berbasis rubrik Kurikulum Merdeka.

```text
┌────────────────────────────────────────────────────────────────────────┐
│               UNIFIED ASSESSMENT ENGINE (RUANG PINTAR)                 │
├──────────────────────────────────┬─────────────────────────────────────┤
│  ENGINE A: FORMATIF (LOW-STAKES) │   ENGINE B: SUMATIF (HIGH-STAKES)   │
│  • Kuis Kilat & Latihan Bab/TP   │   • STS / PTS, SAS / PAS, Ujian Akhir│
│  • Self-Paced, Tanpa Token       │   • Jendela Waktu Ketat (Strict Time)│
│  • Pembahasan Langsung           │   • Dynamic Rolling Token (Proktor)  │
│  • Remedial Instan Otomatis      │   • Live Proctoring Cockpit          │
│  • Fokus: Feedback Pembelajaran  │   • Fullscreen & Tab Switch Watchdog │
├──────────────────────────────────┴─────────────────────────────────────┤
│                 CORE PSYCHOMETRICS & GRADEBOOK ENGINE                  │
│  • Autograding Instan Butir Objektif                                   │
│  • Rubric Evaluator & Blind Grading Butir Esai                         │
│  • Analisis Butir Soal Ilmiah (Tingkat Kesukaran P, Daya Pembeda D)    │
│  • Sinkronisasi Otomatis ke Leger Akademik & e-Rapor Kurikulum Merdeka │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Pilar Arsitektur & Prinsip Inti

### 2.1. Invariant Akademik Non-Negotiable
Arsitektur Assessment Engine wajib mempertahankan invariant domain:
1. `Assessment Plan ≠ Assessment Instrument ≠ Exam Snapshot ≠ Assessment Attempt ≠ Grade ≠ Grade Publication`
2. `Question Bank ≠ Question Version ≠ Exam Blueprint`
3. `Missing Grade ≠ Zero Grade` (Siswa yang belum dinilai tidak boleh diberi nilai 0; nilai angka bernilai `null` sampai tuntas diverifikasi).
4. `Raw Score ≠ Final Approved Grade` (Skor mentah autograding butuh persetujuan guru sebelum menjadi nilai rapor resmi).
5. `Integrity Event ≠ Cheating Verdict` (Deteksi pindah jendela adalah indikator review proktor, bukan vonis pembatalan ujian otomatis tanpa hak sanggah).
6. `Server-Authoritative Clock` (Waktu mulai, sisa waktu, dan batas akhir dihitung mutlak oleh jam server; manipulasi jam lokal perangkat siswa tidak berpengaruh).
7. `Tenant Isolation & Teaching Scope Bound` (Setiap butir soal, ujian, sesi, dan nilai terikat ketat pada `sekolah_id` dan `penugasan_mengajar_id` yang sah).

### 2.2. Dual-Engine Assessment Paradigm
| Dimensi | Mode Formatif (Kuis & Latihan) | Mode Sumatif (Ujian Resmi Sekolah) |
| --- | --- | --- |
| **Tujuan Evaluasi** | *Assessment FOR / AS Learning* (Refleksi) | *Assessment OF Learning* (Akuntabilitas Hasil) |
| **Tingkat Resiko** | *Low-Stakes* | *High-Stakes* |
| **Akses & Masuk** | Langsung dari Modul Ajar / Kelas Saya | Memerlukan Token Dinamis 6-Karakter dari Proktor |
| **Batas Waktu** | Fleksibel (*Timer mandiri saat mulai*) | Jendela Waktu Ketat (*Strict Exam Schedule Window*) |
| **Navigasi Soal** | Bebas maju-mundur, tinjau kapan saja | Dapat dibatasi urutan pengerjaan / acak penuh |
| **Kunci & Pembahasan**| Ditampilkan langsung setelah pengumpulan | Dirahasiakan ketat hingga dipublikasikan resmi |
| **Percobaan (Attempt)**| Boleh berkali-kali (remedial langsung) | Dibatasi (default 1x attempt, izin reset oleh proktor)|
| **Pengawasan** | Tanpa pengawasan ketat | *Live Proctor Cockpit*, Watchdog Integritas Layar |

---

# 3. Spesifikasi Komponen Engine

## 3.1. Rich Media & Special Content Engine
Menjawab kebutuhan seluruh rumpun mata pelajaran (MIPA, Bahasa, Agama, Kejuruan):
1. **Formula Matematika & Sains (KaTeX Vector):**
   - Mendukung sintaks LaTeX inline (`$E=mc^2$`) dan display block (`$$\int_{a}^{b} f(x)dx$$`).
   - Toolbar visual simbol matematika: pecahan, akar, eksponen, matriks, limit, integral, dan simbol Yunani tanpa memaksa guru menghafal sintaks LaTeX mentah.
2. **Tipografi Arab & Teks Right-to-Left (RTL):**
   - Rendering font Arab berharakat rapi (*Amiri* / *Scheherazade New*) dengan `dir="rtl"`.
   - Isolasi bilingual: potongan teks Arab di dalam kalimat bahasa Indonesia tetap mempertahankan orientasi alami tanpa merusak susunan tanda baca.
3. **Audio Stimulus Berbatas Putar (Listening Comprehension):**
   - Pemutar audio terenkripsi dengan counter batas pemutaran (misal: maksimal 2x putar).
   - *Anti-Scrubbing & Anti-Download*: Mencegah siswa mempercepat linimasa audio atau mengunduh berkas audio langsung dari inspeksi elemen browser.
4. **Stimulus Gambar Responsif & Modal Lightbox:**
   - Gambar stimulus diagram, peta, atau kode sumber dapat disentuh/diklik untuk menampilkan modal zoom resolusi penuh (*pinch-to-zoom* di seluler).
   - Dukungan tempel cepat (*paste clipboard*) dari cuplikan layar guru (Ctrl+V) dan unggah drag-and-drop.

## 3.2. Live Proctoring Cockpit Engine
Layar kendali penuh bagi guru dan pengawas ruang selama ujian berlangsung:
1. **Real-Time Participant Grid:**
   - Kartu visual seluruh peserta didik dalam satu tampilan layar (kapasitas 36–45 siswa per rombel).
   - Indikator status real-time: `Belum Masuk` (Abu-abu), `Mengerjakan No. X/Y` (Biru), `Ragu-Ragu Z Soal` (Kuning), `Terkunci Pelanggaran` (Merah Berkedip), `Selesai` (Hijau).
2. **Dynamic Rolling Token:**
   - Token 6 karakter alfanumerik acak (misal: `XK9PLM`) yang dapat digenerate ulang sewaktu-waktu oleh proktor.
   - Opsi *Auto-Refresh Token* setiap 15 menit untuk ruang ujian massal, mencegah kebocoran token ke siswa yang terlambat atau berada di luar ruang kelas.
3. **Emergency Proctor Controls:**
   - *Buka Kunci Pelanggaran (Unlock):* Mengizinkan siswa yang terkunci akibat insiden teknis/notifikasi popup untuk kembali melanjutkan ujian.
   - *Reset Sesi Perangkat (Device Rescue):* Jika perangkat siswa kehabisan baterai atau mati mendadak, proktor dapat mereset *device binding* sehingga siswa dapat login di perangkat cadangan sekolah **tanpa kehilangan satu pun jawaban yang telah tersimpan**.
   - *Tambah Waktu Kompensasi:* Menambahkan waktu pengerjaan (+5, +10, +15 menit) secara individual untuk siswa yang mengalami kendala teknis.
   - *Paksa Kumpulkan (Force Submit):* Mengakhiri sesi satu siswa atau seluruh rombel secara serentak ketika waktu ujian resmi berakhir.

## 3.3. Hybrid Delivery & Paper-Based Support
Tidak semua sekolah siap dengan 100% perangkat seluler di setiap waktu:
1. **Pencetakan Naskah Ujian Resmi:**
   - Generator naskah soal cetak format PDF standar sekolah lengkap dengan kop surat institusi, petunjuk pengerjaan, dan layout hemat kertas (2 kolom).
2. **Lembar Jawaban Manual & Input Cepat:**
   - Matriks input cepat lembar jawaban siswa bagi guru yang menyelenggarakan ujian berbasis kertas, menghubungkan nilai langsung ke engine psikometri dan buku nilai.

## 3.4. Psychometrics & Item Analysis Engine
Menghitung parameter ilmiah instrumen evaluasi pasca-ujian:
1. **Tingkat Kesukaran Soal ($P$):**
   $$P = \frac{B}{N}$$
   *(Dimana $B$ adalah jumlah peserta menjawab benar, $N$ adalah total peserta).*
   - $P > 0.70$: Soal Kategori Mudah
   - $0.30 \le P \le 0.70$: Soal Kategori Sedang (Ideal)
   - $P < 0.30$: Soal Kategori Sukar
2. **Daya Pembeda Soal ($D$):**
   Membandingkan proporsi jawaban benar antara 27% kelompok siswa skor tertinggi ($U$) dan 27% kelompok siswa skor terendah ($L$):
   $$D = \frac{B_U - B_L}{n}$$
   - $D \ge 0.40$: Sangat Baik
   - $0.30 \le D < 0.40$: Baik
   - $0.20 \le D < 0.30$: Perlu Revisi
   - $D < 0.20$ atau bernilai negatif: Butir Soal Cacat (Wajib Diperbaiki / Dieliminasi).
3. **Analisis Efektivitas Pengecoh (Distractor Analysis):**
   Memverifikasi bahwa setiap opsi pengecoh (A, B, C, D, E) dipilih minimal oleh 5% peserta dan lebih banyak dipilih oleh kelompok bawah.

---

# 4. Arsitektur Navigasi & Peta Rute URL

Struktur navigasi Assessment Engine dirancang hierarkis dan kontekstual sesuai peran:

```text
GURU (TEACHER)
├── /cbt-ujian                           (Assessment & CBT Hub — Ringkasan Kelas & Jadwal)
│   ├── /bank-soal                       (Repositori Bank Soal Sekolah & Guru)
│   │   ├── /buat                        (Editor Butir Soal Baru — Math, Arab, Media)
│   │   └── /[soalId]/edit               (Editor Versi Soal Stabil)
│   ├── /jadwal/buat                     (Wizard Konfigurasi & Penjadwalan Asesmen)
│   ├── /proctor/[ujianId]               (Live Proctoring Cockpit — Pengawasan Real-Time)
│   ├── /evaluasi/[ujianId]              (Workspace Penilaian Esai & Rubrik Manual)
│   └── /analitik/[ujianId]              (Laporan Psikometri Butir Soal & Kurva Nilai)
├── /penilaian                           (Buku Nilai & Ledger Akademik Terpadu)
│   └── /[penugasanId]                   (Matriks Rekapitulasi Formatif & Sumatif Rombel)
└── /kelas-saya/[rombelId]               (Ruang Kelas Guru — Tab Terintegrasi: Asesmen)

SISWA (STUDENT)
├── /cbt-ujian                           (Portal Asesmen Siswa — Jadwal Ujian Aktif & Riwayat)
├── /cbt/start?ujianId=[id]              (Gerbang Masuk & Validasi Token Dinamis)
├── /cbt/[attemptId]                     (Secure CBT Player — Layar Pengerjaan Ujian)
├── /cbt/selesai/[attemptId]             (Layar Konfirmasi Penyerahan Lembar Ujian)
└── /cbt/hasil/[attemptId]               (Layar Pembahasan & Umpan Balik Pasca-Publikasi)

WALI MURID (GUARDIAN)
└── /nilai-anak                          (Portal Pantauan Nilai & e-Rapor Terpublikasi)
```

### Matriks Hak Akses & Pembagian Tanggung Jawab
| Rute / Kemampuan | Guru Pengampu | Pengawas Ruang (Proktor) | Siswa Peserta | Wali Murid |
| --- | :---: | :---: | :---: | :---: |
| Buat / Edit Bank Soal | **YA** (Mapel Ampuan) | Tidak | Tidak | Tidak |
| Jadwalkan Asesmen | **YA** (Rombel Ampuan) | Tidak | Tidak | Tidak |
| Akses Proctor Cockpit | **YA** | **YA** (Ditugaskan) | Tidak | Tidak |
| Buka Kunci / Reset Sesi | **YA** | **YA** | Tidak | Tidak |
| Mengerjakan Ujian di Player | Tidak | Tidak | **YA** (Terdaftar) | Tidak |
| Koreksi Jawaban Esai | **YA** | Tidak | Tidak | Tidak |
| Lihat Analitik Psikometri | **YA** | Tidak | Tidak | Tidak |
| Bukukan Nilai ke Rapor | **YA** | Tidak | Tidak | Tidak |
| Lihat Hasil & Umpan Balik | **YA** | Tidak | **YA** (Bila Rilis) | **YA** (Bila Rilis) |

---

# 5. Keamanan, Integritas & Anti-Slop Principles

1. **Answer Key Secrecy (Zero-Trust Player):** Manifest soal yang dikirimkan ke peramban siswa (`ManifestItemSoal`) mutlak steril dari kunci jawaban, bobot sensitif, atau indikator opsi benar. Kunci jawaban (`KunciPenilaianItem`) hanya hidup di sisi server dalam snapshot terenkripsi.
2. **Server-Authoritative Timing:** Sisa waktu ujian dikalkulasi dari `batas_waktu_server = waktu_mulai + durasi_menit`. Skrip peramban siswa hanya menampilkan representasi visual timer. Saat waktu server berakhir, mutasi jawaban ditolak dan sesi otomatis dialihkan ke status `WAKTU_HABIS`.
3. **Idempotent Autosave Write Queue:** Penyimpanan jawaban siswa per nomor soal menggunakan mekanisme autosave berbasis antrean (*debounced write-queue*). Setiap kali siswa memilih opsi, jawaban disimpan secara asinkron dengan penanganan kegagalan jaringan (*retry exponential backoff*).
4. **Anti-Cheat Watchdog Humanis:** Pelanggaran perpindahan tab atau keluar dari layar penuh dicatat sebagai `EventIntegritasUjian`. Sistem memberikan peringatan bertingkat (Strike 1, Strike 2) dan mengunci sesi pada Strike 3 untuk ditinjau oleh pengawas ruang secara bijaksana, mencegah vonis sepihak akibat gangguan pop-up sistem operasi.
5. **Anti-Slop Craftsmanship:** Tidak ada tombol hiasan tanpa fungsi, tidak ada grafik visual palsu tanpa data riil, dan antarmuka mematuhi standar desain Academic Glass UI dengan tipografi jernih dan keterbacaan tinggi di segala perangkat.

---
*Dokumen ini merupakan bagian dari STAGE CBT-01 dan siap untuk ditinjau oleh Human Project Owner.*
