# TEACHER ASSESSMENT INFORMATION ARCHITECTURE
## Ruang Pintar — School Digital Operating Platform
### STAGE CBT-01.1: Hirarki Data, Taksonomi, Content Inventory & Progressive Disclosure

| Metadata | Nilai Canonical |
| --- | --- |
| **Produk / Sub-sistem** | Ruang Pintar — Teacher Assessment Information Architecture (IA) |
| **Kode Tahap** | `STAGE CBT-01.1` |
| **Status Dokumen** | `READY FOR HUMAN REVIEW` |
| **Klasifikasi Modul** | Data Architecture & Information Hierarchy |
| **Versi Dokumen** | 1.0 (Comprehensive IA Specification) |
| **Tanggal Terbit** | 7 Oktober 2026 |
| **Prinsip Utama** | *Kurikulum Merdeka Taxonomy*, *Progressive Disclosure*, *Teacher-Friendly Labeling*, *High-Density Scannability* |

---

# 1. Hirarki Objek Informasi Hulu-ke-Hilir

Arsitektur informasi Assessment Engine disusun mengikuti relasi keterkaitan kurikulum dan operasional evaluasi akademik sekolah:

```text
SEKOLAH (TENANT BOUNDARY)
 │
 ├── TAHUN AJARAN & SEMESTER
 │    │
 │    ├── MATA PELAJARAN (Kurikulum Mapel)
 │    │    │
 │    │    └── CAPAIAN PEMBELAJARAN (CP per Fase)
 │    │         │
 │    │         └── TUJUAN PEMBELAJARAN (TP per Bab/Topik)
 │    │              │
 │    │              ├── KRITERIA KETUNTASAN (Interval KKTP)
 │    │              │
 │    │              ├── BLUEPRINT / KISI-KISI ASESMEN RESMI
 │    │              │
 │    │              └── BANK SOAL (REPOSITORI BUTIR SOAL)
 │    │                   ├── Personal Question Bank (Privat Guru)
 │    │                   └── School Question Bank (Aset MGMP)
 │    │                        │
 │    │                        └── VERSI SOAL STABIL (Pertanyaan, KaTeX, Arab, Stimulus, Opsi, Kunci)
 │    │
 └── PENUGASAN MENGAJAR GURU (GURU + MAPEL + ROMBEL)
      │
      ├── UJIAN CBT / ASESMEN TERJADWAL
      │    │
      │    ├── SNAPSHOT UJIAN BEKU (Naskah Stabil & Kunci Rahasia)
      │    │
      │    ├── DOKUMEN ADMINISTRASI UJIAN RESMI
      │    │    ├── Kisi-Kisi Soal Siap Cetak
      │    │    ├── Kartu Soal per Butir
      │    │    ├── Naskah Soal Resmi PDF (Kop Surat Sekolah)
      │    │    ├── Kunci Jawaban & Rubrik Penskoran
      │    │    ├── Daftar Hadir Peserta Ujian
      │    │    └── Berita Acara Pelaksanaan Ujian
      │    │
      │    └── SESI PENGERJAAN PESERTA DIDIK (EXAM ATTEMPTS)
      │         │
      │         ├── JAWABAN SISWA (Autosave Idempotent)
      │         ├── LOG INTEGRITAS (Event Watchdog Humanis)
      │         └── HASIL UJIAN CBT & ANALISIS BUTIR SOAL (P & D)
      │              │
      │              └── BUKU NILAI KELAS (GRADEBOOK M13 & E-RAPOR)
```

---

# 2. Taksonomi & Standar Pelabelan Antarmuka (Labeling System)

Untuk menghindari kebingungan guru, sistem menggunakan **istilah bahasa Indonesia baku yang akrab di lingkungan sekolah dan dinas pendidikan**:

```text
┌──────────────────────────────┬──────────────────────────────┬───────────────────────────────┐
│ ISTILAH SISTEM / INTERNAL    │ LABEL ANTARMUKA GURU         │ DEFINISI KONSEPTUAL           │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ Assessment Definition        │ Asesmen Pembelajaran         │ Induk evaluasi formatif/sumatif│
│ Question Bank (Personal)     │ Bank Soal Saya               │ Kumpulan soal privat guru     │
│ Question Bank (School)       │ Bank Soal Sekolah (MGMP)     │ Aset soal bersama institusi   │
│ Assessment Blueprint         │ Kisi-Kisi Ujian              │ Matriks rancangan sebaran soal│
│ Item Spec / Question Card    │ Kartu Soal                   │ Lembar telaah per butir soal  │
│ Exam Manifest                │ Naskah Soal Ujian            │ Lembar soal yang dikerjakan   │
│ Proctor Cockpit              │ Pengawasan Ujian / Proktor   │ Layar pemantauan ruang ujian  │
│ Gradebook Matrix             │ Buku Nilai Kelas             │ Rekapitulasi nilai semester   │
│ Official Exam Report         │ Berita Acara Pelaksanaan     │ Laporan resmi pengawas ruang  │
│ Attendance Sheet             │ Daftar Hadir Ujian           │ Lembar presensi peserta ujian │
│ Item Psychometrics           │ Analisis Butir Soal          │ Analisis kesukaran & pembeda  │
│ Remedial Pipeline            │ Program Bimbingan Remedial   │ Tindak lanjut siswa < KKTP    │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

# 3. Content Inventory & Inventarisasi Komponen Meja Kerja

### 3.1. Hub Asesmen (`/cbt-ujian`)
- **Metadata Title:** `CBT Ujian Online & Evaluasi Pembelajaran — Ruang Pintar`
- **Komponen Inti:**
  1. `TeacherActiveExamHero`: Kartu ujian aktif hari ini dengan tombol *Pantau Proktor*.
  2. `AssessmentMetricRow`: 4 metrik ringkas (Ujian aktif, ketuntasan KKTP, antrean esai, bank soal).
  3. `TeacherClassAccordionList`: Daftar rombel yang diampu beserta rekapitulasi ujian tiap rombel.
  4. `QuickActionToolbar`: Tombol pintas untuk Bank Soal, Jadwal Baru, dan Cetak Administrasi.

### 3.2. Bank Soal (`/cbt-ujian/bank-soal`)
- **Metadata Title:** `Bank Soal Akademik — Ruang Pintar`
- **Komponen Inti:**
  1. `ScopeOwnershipTabs`: Tab alih *Bank Soal Saya* vs *Bank Soal Sekolah*.
  2. `SubjectFolderSidebar`: Pohon folder berdasarkan Mata Pelajaran dan Lingkup Materi (Bab).
  3. `QuestionItemCard`: Kartu cuplikan soal menampilkan nomor kode, tipe soal, tingkat kesulitan, formula KaTeX, stimulus gambar, dan indikator TP terkait.
  4. `RichQuestionEditor`: Editor kanvas penuh dengan toolbar KaTeX, toggle Arab RTL, dan upload stimulus.

### 3.3. Kisi-Kisi & Administrasi Ujian (`/cbt-ujian/kisi-kisi` & `/administrasi/[id]`)
- **Metadata Title:** `Kelengkapan Administrasi & Kisi-Kisi — Ruang Pintar`
- **Komponen Inti:**
  1. `CurriculumMatrixTable`: Tabel kisi-kisi standar format pengawas dinas.
  2. `PdfPrintPreviewModal`: Penampil pratinjau dokumen PDF ber-kop surat sekolah resmi.
  3. `OfficialExamReportForm`: Formulir pengisian berita acara kejadian di ruang ujian.
  4. `OfficialAttendanceGrid`: Tabel presensi peserta ruang ujian.

### 3.4. Live Proctor Cockpit (`/cbt-ujian/proctor/[id]`)
- **Metadata Title:** `Live Proctor Cockpit — CBT Ruang Pintar`
- **Komponen Inti:**
  1. `ProctorHeaderBanner`: Token aktif besar, sisa waktu, dan statistik kehadiran.
  2. `ParticipantLiveGrid`: Kartu visual 36+ siswa dengan kode warna (Abu-abu: Belum Masuk, Biru: Mengerjakan, Hijau: Selesai, Merah: Terkunci).
  3. `EmergencyControlDrawer`: Aksi darurat (Reset Sesi Perangkat, Tambah Waktu, Buka Kunci).

### 3.5. Workspace Koreksi Esai (`/cbt-ujian/evaluasi/[id]`)
- **Metadata Title:** `Evaluasi & Koreksi Esai — Ruang Pintar`
- **Komponen Inti:**
  1. `BlindGradingHeader`: Status butir soal nomor X dari total Y esai.
  2. `AnonymousAnswerCard`: Jawaban esai siswa tanpa nama/foto dengan rubrik penskoran di sampingnya.
  3. `ScoreInputSlider`: Input nilai rentang 0 s/d skor maksimal butir soal.

### 3.6. Laporan Analitik Psikometri (`/cbt-ujian/analitik/[id]`)
- **Metadata Title:** `Laporan Analisis Butir Soal — Ruang Pintar`
- **Komponen Inti:**
  1. `ScoreDistributionBellCurve`: Grafik kurva sebaran nilai rombel.
  2. `PsychometricItemTable`: Tabel indeks kesukaran ($P$), daya pembeda ($D$), dan status kualitas butir soal (Baik / Cacat).
  3. `RemedialStudentQueue`: Rekapitulasi nama siswa di bawah KKTP dan rekomendasi TP materi remedial.

---

# 4. Prinsip Progressive Disclosure & Kerapatan Data (Data Density)

Guru di Indonesia membutuhkan sistem yang **padat informasi tanpa terasa sesak**:
1. **Level 1 (Glanceable Overview):** Di halaman utama, guru hanya melihat status ringkas: Nama Ujian, Kelas, Waktu, dan Tombol Status (`Pantau`, `Nilai`, `Cetak`).
2. **Level 2 (Scannable Details on Demand):** Saat baris ujian diklik, kartu membentang memperlihatkan rata-rata nilai, jumlah peserta tuntas, dan daftar butir soal.
3. **Level 3 (Deep Dive Focus Canvas):** Saat guru masuk ke mode koreksi esai atau editor butir soal, antarmuka beralih ke kanvas fokus penuh (*full canvas mode*), menyembunyikan sidebar navigasi untuk memberikan ruang pandang maksimal pada teks dan formula matematika.

---
*Dokumen ini merupakan bagian resmi dari STAGE CBT-01.1 dan siap untuk ditinjau oleh Human Project Owner.*
