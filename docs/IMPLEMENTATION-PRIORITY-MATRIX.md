# IMPLEMENTATION PRIORITY MATRIX
## Ruang Pintar — School Digital Operating Platform
### Evaluasi Prioritas Implementasi Assessment Engine Berdasarkan Kebutuhan Riil Sekolah Indonesia

| Metadata | Nilai Canonical |
| --- | --- |
| **Produk / Sub-sistem** | Ruang Pintar — Assessment & CBT Engine Implementation Roadmap |
| **Kode Tahap** | `STAGE CBT-01 (REFINED)` |
| **Status Dokumen** | `READY FOR HUMAN REVIEW` |
| **Tujuan Dokumen** | Menetapkan batas realistis MVP, Phase 2, dan Phase 3 untuk meminimalkan risiko kegagalan adopsi lapangan |
| **Versi Dokumen** | 1.0 (Priority & Realism Assessment) |
| **Tanggal Terbit** | 7 Oktober 2026 |

---

# 1. Eksekutif Diagnosa: Mengapa Fitur Tertentu Terlalu Awal untuk MVP?

Sebelum melangkah ke implementasi kode (STAGE CBT-02), evaluasi kritis terhadap kondisi faktual ekosistem sekolah di Indonesia menunjukkan bahwa beberapa fitur canggih yang dirancang di awal justru **berisiko tinggi menggagalkan adopsi platform di ruang kelas jika dipaksakan masuk MVP**.

### 1.1. Evaluasi Faktual 4 Fitur Kritis:

```text
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ FITUR DIANALISIS                │ RISIKO LAPANGAN DI SEKOLAH      │ REKOMENDASI PENTAHAPAN          │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ 1. Watchdog Strike 3x Lock      │ Bencana False-Positive: Siswa   │ TUNDA KE PHASE 3                │
│    (Auto-lock saat pindah tab)  │ menggunakan HP pribadi (BYOD).  │ Di MVP: Cukup catat di log audit│
│                                 │ Notifikasi WA, telepon masuk,   │ tanpa mengunci layar siswa.     │
│                                 │ atau baterai lemah memicu strike│                                 │
│                                 │ instan. Proktor kewalahan!      │                                 │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ 2. Dynamic Rolling Token        │ Kepanikan Ruang Kelas: Wi-Fi    │ TUNDA KE PHASE 3                │
│    (Token refresh per 15 menit) │ sekolah sering lambat / drop.   │ Di MVP: Gunakan Token Sesi      │
│                                 │ Siswa terlambat atau login lambat│ Standar (1 kode per ujian) yang │
│                                 │ akan gagal memasukkan token.    │ stabil sepanjang sesi.          │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ 3. Advanced Proctoring Cockpit  │ Kompleksitas Beban Server & Guru:│ SEDERHANAKAN DI MVP,            │
│    (Live WebSocket grid, kartu  │ Guru pengawas butuh kesederhana-│ MATANGKAN DI PHASE 2            │
│    real-time 40 siswa serentak) │ an (Daftar Hadir & Tombol Reset)│ Di MVP: Grid sederhana dengan   │
│                                 │ bukan animasi visual berat.     │ status Hadir / Mengerjakan / Selesai│
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ 4. Anti-Cheating Kiosk Layer    │ Inkompatibilitas Perangkat:     │ TUNDA KE PHASE 3                │
│    (Kunci OS, Safe Exam Browser)│ Mayoritas siswa memakai Android │ Di MVP: Fullscreen API standar  │
│                                 │ murah (RAM 2-3GB). Kiosk lock   │ peramban dengan pesan konfirmasi│
│                                 │ menyebabkan browser crash.      │ ramah siswa.                    │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

---

# 2. Matriks Pembagian Tahap: MVP vs Phase 2 vs Phase 3

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MATRIKS PENTAHAPAN TIGA GELOMBANG (WAVES)                       │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┤
│ TAHAP 1: MVP               │ TAHAP 2: PHASE 2           │ TAHAP 3: PHASE 3             │
│ "STABILITAS, KURIKULUM &   │ "PROCTORING MENENGAH,      │ "STRICT HIGH-STAKES, KIOSK   │
│ ADMINISTRASI RESMI"        │ PSIKOMETRI & ASISTEN AI"   │ & ADAPTIVE ASSESSMENT"       │
├────────────────────────────┼────────────────────────────┼──────────────────────────────┤
│ • Pipeline Kurikulum:      │ • Live Proctor Grid Penuh  │ • Dynamic Rolling Token      │
│   CP -> TP -> KKTP         │   (Status Progres No. X/Y) │   (Auto-refresh 15 menit)    │
│ • Paket Administrasi:      │ • Reset Sesi Perangkat     │ • Watchdog Strike 3x Lock    │
│   Kisi-kisi, Kartu Soal,   │   (Device Rescue Cepat)    │   (Kunci sesi otomatis)      │
│   Naskah PDF, Berita Acara │ • Workspace Blind Grading  │ • Integrasi Safe Exam Browser│
│ • Dual Question Bank:      │   Esai Lengkap             │   / Kiosk Mode               │
│   Personal vs School Bank  │ • Analisis Butir Soal:     │ • Computerized Adaptive      │
│ • CBT Player Tahan Putus   │   Tingkat Kesukaran (P),   │   Testing (CAT Multi-Stage)  │
│   (Offline Autosave Queue) │   Daya Pembeda (D), Pengecoh│ • AI Question Quality Check │
│ • Token Sesi Standar       │ • AI Assessment Assistant: │   & Auto-Audit Kalimat Soal  │
│ • Autograding Objektif     │   Generator Kisi-kisi,     │ • Webcam Integrity Snapshot  │
│ • Sinkronisasi Buku Nilai  │   Soal, Distraktor,        │   (Ujian Daring Mandiri)     │
│   (M13 Gradebook) 1-Klik   │   Pembahasan & Remedial    │                              │
└────────────────────────────┴────────────────────────────┴──────────────────────────────┘
```

---

# 3. Rincian Scope per Fase

## 3.1. TAHAP 1: MVP (Minimum Viable Product)
**Tujuan:** Menghadirkan sistem ujian yang **100% handal di lapangan**, tidak menimbulkan kepanikan teknis, ramah perangkat ponsel siswa, dan menyelesaikan beban administrasi resmi guru.

### Fitur yang Masuk MVP:
1. **Kurikulum Merdeka Alignment:**
   - Guru dapat memilih Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) saat merakit asesmen.
   - Ambang batas Kriteria Ketuntasan (KKTP) terdefinisi jelas (default: 75.0).
2. **Paket Administrasi Ujian Resmi Siap Cetak:**
   - **Kisi-Kisi Soal:** Matriks tabel standar supervisi (CP, TP, indikator, level kognitif L1/L2/L3, nomor soal).
   - **Kartu Soal:** Format telaah butir soal per nomor lengkap dengan pedoman penskoran.
   - **Naskah Soal PDF:** Tata letak naskah soal dua kolom resmi ber-kop surat sekolah siap cetak.
   - **Kunci Jawaban:** Lembar kunci objektif dan rubrik esai untuk tim pengoreksi.
   - **Daftar Hadir Peserta:** Lembar presensi peserta di ruang ujian.
   - **Berita Acara Ujian:** Formulir resmi pengawas ruang yang siap dicetak dan ditandatangani.
3. **Dual Question Bank:**
   - *Personal Bank:* Guru membuat dan menyimpan soal miliknya sendiri secara privat.
   - *School Bank:* Guru dapat membagikan soal ke bank bersama sekolah per mata pelajaran serumpun.
   - Editor soal mendukung formula matematika KaTeX, teks Arab RTL, stimulus gambar, dan audio listening.
4. **CBT Player Handal & Ramah Sinyal:**
   - **Antrean Autosave Idempotent:** Jawaban siswa tersimpan otomatis ke server. Jika Wi-Fi putus sementara, peramban menyimpan lokal (*cache local*) dan melakukan sinkronisasi otomatis saat sinyal kembali.
   - **Timer Server-Authoritative:** Sisa waktu dihitung dari jam server, mencegah kecurangan manipulasi jam lokal.
   - **Token Sesi Standar:** Satu kode token 6-karakter per paket ujian yang dibagikan proktor di awal ujian.
   - **Navigasi Soal Ramah Siswa:** Daftar nomor soal, penanda ragu-ragu (kuning), dan modal audit sebelum submit final.
5. **Autograding Objektif & Buku Nilai Terpadu:**
   - Koreksi otomatis instan untuk soal PG, PG Kompleks, Benar/Salah, dan Menjodohkan.
   - Koreksi esai manual sederhana oleh guru.
   - Tombol satu-klik: *"Bukukan ke Buku Nilai"* untuk mentransfer skor ke Gradebook M13 dan e-Rapor.

---

## 3.2. TAHAP 2: PHASE 2 (Mid-Scale Assessment & Analytics)
**Tujuan:** Memberikan kendali pemantauan proktor yang lebih dinamis, ruang koreksi esai profesional, analitik psikometri ilmiah, dan efisiensi waktu guru melalui Asisten AI.

### Fitur yang Masuk Phase 2:
1. **Live Proctoring Grid:**
   - Tampilan visual kartu peserta didik di monitor pengawas: melacak siswa yang sedang mengerjakan nomor X/Y, jumlah ragu-ragu, dan status selesai.
   - Fitur **Reset Sesi Perangkat (Device Rescue):** Memungkinkan proktor mereset sesi siswa yang HP-nya mati mendadak agar dapat melanjutkan di perangkat lain dengan jawaban tetap utuh.
   - Fitur **Tambah Waktu Kompensasi:** Menambahkan waktu (+10 menit) bagi peserta yang mengalami hambatan.
2. **Workspace Koreksi Esai (Blind Grading):**
   - Antarmuka koreksi esai butir per butir tanpa menampilkan nama siswa untuk menjamin objektivitas guru penilai.
3. **Analisis Butir Soal Ilmiah (Psychometrics Engine):**
   - Perhitungan otomatis Tingkat Kesukaran ($P$), Daya Pembeda ($D$), dan Analisis Efektivitas Distraktor/Pengecoh.
   - Deteksi butir soal yang cacat ($D < 0.20$) dan rekomendasi revisi.
   - Analisis ketuntasan TP rombel dan penyusunan daftar otomatis siswa wajib remedial.
4. **AI Assessment Assistant (Generatif & Analitis):**
   - Generator draf kisi-kisi dan butir soal berdasarkan deskripsi TP/CP.
   - Generator opsi pengecoh masuk akal (*plausible distractors*).
   - Generator draf rubrik penskoran dan teks pembahasan.
   - Generator paket soal remedial terarah setara (*parallel tests*).

---

## 3.3. TAHAP 3: PHASE 3 (Strict High-Stakes & Institutional Scale)
**Tujuan:** Pengamanan maksimal tanpa kompromi untuk Ujian Akhir Sekolah, Asesmen Standarisasi Institusi, dan pengujian adaptif skala besar.

### Fitur yang Masuk Phase 3:
1. **Dynamic Rolling Token:**
   - Token bergulir yang otomatis di-refresh setiap 15 menit oleh proktor untuk mencegah kebocoran soal ke kelas sesi berikutnya.
2. **Watchdog Strike 3x Lock:**
   - Deteksi agresif perpindahan jendela/tab dan keluar mode layar penuh. Peringatan Strike 1 dan 2, serta penguncian sesi permanen pada Strike 3 yang mewajibkan intervensi proktor.
3. **Kiosk Mode / Safe Exam Protocol:**
   - Integrasi protokol Safe Exam Browser (SEB) atau aplikasi kiosk lock Android untuk mengunci tombol navigasi sistem operasi.
4. **Computerized Adaptive Testing (CAT):**
   - Algoritma adaptif yang memberikan tingkat kesulitan soal berikutnya secara dinamis berdasarkan respons jawaban siswa sebelumnya.
5. **AI Question Quality & Bias Auditor:**
   - Pemeriksaan otomatis kualitas butir soal menggunakan LLM untuk mendeteksi ambiguitas, bias bahasa, dan kunci jawaban ganda sebelum naskah disetujui.

---

# 4. Kriteria Kelulusan (Quality Gates) per Fase

| Parameter Verifikasi | Kriteria Kelulusan MVP | Kriteria Kelulusan Phase 2 | Kriteria Kelulusan Phase 3 |
| --- | --- | --- | --- |
| **Keberhasilan Autosave** | 100% jawaban tersimpan saat offline 60 detik lalu online | 100% tersimpan + log retry transparan | 100% tersimpan + checksum integritas |
| **Waktu Respon Autograding** | < 2 detik untuk 40 peserta | < 1 detik + background queuing | < 1 detik paralel skala sekolah |
| **Kelengkapan Administrasi** | 100% format cetak siap (PDF & Kop) | 100% cetak + ekspor Excel Dapodik | 100% cetak + digital signature |
| **Beban Pengawas Ruang** | 0 kasus false positive lock | Kontrol reset sesi tersedia lengkap | Verifikasi biometrik / approval proktor |
| **Integritas Timer** | Server-authoritative (Deviasi 0 detik) | Server-authoritative + sync beacon | Multi-server clock synchronization |

---

# 5. Kesimpulan & Rekomendasi Eksekutif

Dengan matriks prioritas ini:
1. Tim pengembang dapat fokus membangun **fondasi yang kokoh dan disukai guru di Indonesia** pada **MVP (STAGE CBT-02)**, yaitu: kelengkapan administrasi kurikulum (kisi-kisi, kartu soal, naskah cetak), bank soal personal/sekolah, dan CBT player yang stabil tanpa drama teknis.
2. Fitur pengawasan ketat dan kecerdasan buatan disiapkan jalurnya secara arsitektural (*extensible & future-proof*), namun tidak membebani rilis pertama.

**STATUS: READY FOR HUMAN REVIEW**
