# TEACHER ASSESSMENT WORKSPACE DESIGN
## Ruang Pintar — School Digital Operating Platform
### STAGE CBT-01.1: Desain Meja Kerja Guru Terpadu untuk Assessment Engine

| Metadata | Nilai Canonical |
| --- | --- |
| **Produk / Sub-sistem** | Ruang Pintar — Teacher Assessment Workspace (Meja Kerja Asesmen Guru) |
| **Kode Tahap** | `STAGE CBT-01.1` |
| **Status Dokumen** | `READY FOR HUMAN REVIEW` |
| **Klasifikasi Modul** | Presentation & Workflow Architecture (M13 Assessment & Gradebook + M14 CBT Platform) |
| **Versi Dokumen** | 1.0 (End-to-End Teacher Workspace Specification) |
| **Tanggal Terbit** | 7 Oktober 2026 |
| **Prinsip Desain** | *Zero Confusion*, *3-Click Rule*, *Dual-Entry Gateway*, *Mobile-First Cockpit*, *Kurikulum Merdeka Native*, *Academic Glass UI* |

---

# 1. Filosofi & Konsep Meja Kerja Asesmen Guru

Dalam sistem konvensional, guru sering dihadapkan pada antarmuka terpecah-pecah: membuat bank soal di satu menu, merakit ujian di menu lain, membagikan token di aplikasi berbeda, membuka Google Spreadsheet untuk nilai, dan mengetik dokumen Word manual untuk supervisi pengawas. 

**Teacher Assessment Workspace Ruang Pintar** menyatukan seluruh siklus penilaian ke dalam **satu meja kerja terpadu** yang dirancang khusus untuk kenyamanan dan beban kerja guru di Indonesia:
1. **Dual-Entry Gateway (Dua Pintu Masuk Kontekstual):**
   - **Pintu A: Workspace Kelas Terpadu (`/kelas-saya/[id]`):** Fokus pada pelaksanaan harian satu rombel belajar (ulangan harian, kuis formatif, buku nilai kelas).
   - **Pintu B: Assessment & Evaluation Hub (`/cbt-ujian` & `/penilaian`):** Fokus pada manajemen makro lintas rombel (manajemen bank soal semester, kisi-kisi terpadu, cetak administrasi resmi ujian sekolah, analitik komparatif).
2. **Prinsip Anti-Banyak-Klik (Maksimal 3 Klik ke Tindakan Nyata):** Guru dapat mencapai fungsi koreksi, pemantauan proctoring, atau cetak berita acara maksimal dalam 3 langkah dari layar utama.
3. **Respon Cepat Desktop & Ponsel Pintar:** Desktop dioptimalkan untuk penyusunan soal dan matriks nilai lebar (*wide spreadsheet view*), sedangkan ponsel pintar dioptimalkan untuk pemantauan proctoring sambil berkeliling ruang kelas (*mobile proctor cockpit*).

---

# 2. Pemetaan Alur 11 Langkah Guru (End-to-End Workflow)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ALUR 11 LANGKAH GURU ASSESSMENT ENGINE                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. DASHBOARD ASESMEN       ──> Ikhtisar ujian aktif, antrean koreksi, alert KKTP       │
│ 2. BANK SOAL               ──> Manajemen Personal Bank & School Bank (KaTeX/RTL/Media) │
│ 3. KISI-KISI / BLUEPRINT   ──> Pemetaan CP -> TP -> KKTP & Level Kognitif L1/L2/L3     │
│ 4. PERAKITAN UJIAN         ──> Pemilihan butir soal, penentuan bobot, mode Formatif/Sumatif│
│ 5. PENJADWALAN             ──> Alokasi rombel, jendela waktu, durasi, acak soal/opsi   │
│ 6. PUBLIKASI               ──> Pembekuan snapshot ujian, aktivasi token masuk          │
│ 7. MONITORING              ──> Live monitor pengerjaan siswa, reset sesi darurat HP    │
│ 8. KOREKSI                 ──> Autograding instan objektif & Blind Grading esai manual │
│ 9. ANALITIK                ──> Laporan psikometri: P (kesukaran), D (daya beda), remedial│
│ 10. ADMINISTRASI           ──> Cetak 1-klik: Kisi-kisi, Kartu Soal, Naskah, Berita Acara│
│ 11. SINKRONISASI NILAI     ──> Pembukuan resmi ke Gradebook M13 & e-Rapor Merdeka      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. Rincian Desain Antarmuka & Interaksi per Langkah

### 3.1. Langkah 1: Dashboard Asesmen (Cockpit Ikhtisar Guru)
- **Rute:** `/cbt-ujian` (atau tab `PENILAIAN`/`CBT` pada `/kelas-saya/[id]`).
- **Anatomi Layar:**
  1. *Hero Status Card:* Menampilkan ujian yang sedang aktif hari ini dengan tombol cepat `[ Pantau Ruang Ujian ]`.
  2. *4 Kartu Indikator KPI:*
     - Total Asesmen Semester Ini (misal: 6 Asesmen).
     - Rata-rata Ketuntasan KKTP Rombel (misal: 84.5%).
     - Antrean Butir Esai Belum Dikoreksi (Badge merah jika ada esai masuk).
     - Bank Soal Siap Pakai (Jumlah soal aktif di Personal & School Bank).
  3. *Tabel Jadwal Asesmen Mendatang & Riwayat:* Dilengkapi filter status (*Draf, Diterbitkan, Berlangsung, Selesai*).
  4. *Quick Action Floating Bar:* `[ + Buat Asesmen Baru ]`, `[ 📚 Buka Bank Soal ]`, `[ 🖨️ Cetak Administrasi ]`.

### 3.2. Langkah 2: Manajemen Bank Soal (Personal vs School Repository)
- **Rute:** `/cbt-ujian/bank-soal`.
- **Dua Tab Utama:**
  - `[ Bank Soal Saya (Personal) ]`: Koleksi privat guru.
  - `[ Bank Soal Sekolah (MGMP) ]`: Koleksi terverifikasi bersama antarguru serumpun.
- **Hierarki Folder Topik:** Diklasifikasikan berdasarkan Mata Pelajaran dan Lingkup Materi (Bab).
- **Editor Soal Kaya Media (`/cbt-ujian/bank-soal/buat`):**
  - Pilihan Bentuk Soal: PG Tunggal, PG Kompleks, Benar/Salah, Menjodohkan, Isian Singkat, Esai.
  - *Toolbar Formula KaTeX:* Palet visual pecahan, akar, integral, dan simbol Yunani.
  - *Toggle Teks Arab RTL:* Dukungan penulisan ayat dan kosakata Arab berharakat rapi.
  - *Stimulus Box:* Tempel gambar cepat (Ctrl+V) dan unggah berkas audio listening berbatas putar.
  - *Metadata Kurikulum:* Pengikatan langsung ke Tujuan Pembelajaran (TP) dan level kognitif (L1/L2/L3).

### 3.3. Langkah 3: Kisi-Kisi / Blueprint Kurikulum
- **Rute:** `/cbt-ujian/kisi-kisi`.
- **Fungsi:** Guru merancang naskah kisi-kisi resmi supervisi sebelum ujian dirakit.
- **Tabel Matriks Kisi-Kisi Interaktif:**
  - Kolom: No, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Lingkup Materi, Indikator Soal, Level Kognitif (L1 Mengingat, L2 Menerapkan, L3 Menganalisis/HOTS), Bentuk Soal, Bobot, Nomor Soal.
  - Tombol Bantuan: `[ ✨ AI: Draf Kisi-Kisi Otomatis dari TP ]` untuk mempercepat guru.

### 3.4. Langkah 4: Perakitan Paket Ujian (Exam Assembler)
- **Rute:** Modal Cepat atau Wizard 3-Langkah di `/cbt-ujian/jadwal/buat`.
- **Pilihan Metode Perakitan:**
  1. *Rakit dari Kisi-Kisi:* Sistem otomatis memanggil soal dari Bank Soal yang cocok dengan indikator TP pada kisi-kisi.
  2. *Pilih Manual dari Bank Soal:* Guru mencentang butir soal dari folder bank soal.
  3. *Import Cepat Word/Excel:* Mengunggah naskah kisi-kisi berformat standar.
- **Penetapan Mode Asesmen:**
  - *Mode Formatif:* Kuis harian, tanpa kunci layar ketat, pembahasan langsung terbuka setelah submit.
  - *Mode Sumatif:* STS, SAS, US; durasi terikat, kunci layar aktif, pembahasan tertutup hingga dirilis resmi.

### 3.5. Langkah 5: Penjadwalan & Konfigurasi Kebijakan
- **Elemen Konfigurasi:**
  - Target Peserta: Satu rombel spesifik (misal: X TO 3) atau gabungan beberapa rombel satu tingkat.
  - Jendela Waktu Pelaksanaan: Tanggal mulai, tanggal selesai, batas waktu akses.
  - Durasi Ujian: Menit pengerjaan (misal: 60 menit atau 90 menit).
  - Kebijakan Integritas: Acak nomor butir soal, acak urutan pilihan (A–E), gunakan token masuk.
  - Standar KKTP: Menentukan nilai batas tuntas (default: 75.0).

### 3.6. Langkah 6: Publikasi & Pembekuan Naskah (Publishing)
- **Tindakan Guru:** Menekan tombol `[ Terbitkan Ujian ]`.
- **Proses Sistem Otomatis:**
  - Membekukan `SnapshotUjian` stabil (mencegah perubahan naskah di tengah ujian).
  - Memisahkan kunci jawaban dan pedoman penskoran ke brankas rahasia server.
  - Mengenerate Token Masuk 6-Karakter (misal: `KRYZQA`).
  - Mengirim notifikasi jadwal ke portal siswa dan portal wali murid.

### 3.7. Langkah 7: Pemantauan Ujian (Live Proctoring Cockpit)
- **Rute:** `/cbt-ujian/proctor/[ujianId]`.
- **Tampilan Desktop & Monitor Pengawas:**
  - Banner Atas: Token Aktif besar, sisa waktu ujian, ringkasan jumlah peserta (Total, Mengerjakan, Selesai, Terkendala).
  - Grid Peserta: Kartu visual seluruh siswa dengan indikator warna status pengerjaan real-time.
- **Tampilan Mobile (Smartphone Cockpit):**
  - Guru dapat memegang HP sambil berkeliling kelas.
  - Daftar ringkas siswa dengan tombol aksi jempol cepat: `[ Reset Sesi HP Mati ]` dan `[ Buka Kunci Siswa ]`.

### 3.8. Langkah 8: Evaluasi & Koreksi Esai (Grading Workspace)
- **Rute:** `/cbt-ujian/evaluasi/[ujianId]`.
- **Autograding Instan:** Butir soal pilihan ganda, benar/salah, dan menjodohkan langsung dinilai otomatis dalam hitungan detik.
- **Ruang Koreksi Esai (Blind Grading Workspace):**
  - Guru memeriksa jawaban esai per butir nomor soal secara berurutan.
  - Identitas nama dan foto siswa disamarkan (*blind review*) untuk menjamin penilaian adil dan objektif.
  - Guru memasukkan skor pada slider/input numerik dan memberikan catatan umpan balik.

### 3.9. Langkah 9: Analitik Psikometri & Diagnosis Remedial
- **Rute:** `/cbt-ujian/analitik/[ujianId]`.
- **Panel Statistik Akademik:**
  - Kurva distribusi nilai kelas, nilai rata-rata, skor tertinggi, dan terendah.
  - **Tingkat Kesukaran ($P$):** Grafik visual menunjukkan proporsi soal Mudah, Sedang, dan Sukar.
  - **Daya Pembeda ($D$):** Peringatan otomatis untuk soal yang cacat ($D < 0.20$) agar guru dapat menganulir soal tersebut.
  - **Efektivitas Distraktor:** Tabel persentase pilihan opsi A, B, C, D, E.
  - **Daftar Rekomendasi Siswa Remedial:** Rekap instan nama-nama siswa yang nilainya di bawah KKTP beserta TP spesifik yang belum dikuasai.

### 3.10. Langkah 10: Administrasi Ujian Resmi Siap Cetak
- **Rute:** `/cbt-ujian/administrasi/[ujianId]`.
- **Tombol Cetak Satu-Klik (Format PDF Kop Surat Resmi Sekolah):**
  1. `[ 🖨️ Cetak Kisi-Kisi Ujian ]`
  2. `[ 🖨️ Cetak Kartu Soal Lengkap ]`
  3. `[ 🖨️ Cetak Naskah Soal Ujian (2 Kolom) ]`
  4. `[ 🖨️ Cetak Kunci Jawaban & Rubrik ]`
  5. `[ 🖨️ Cetak Daftar Hadir Peserta ]`
  6. `[ 🖨️ Cetak Berita Acara Pelaksanaan ]`
  7. `[ 🖨️ Cetak Laporan Analisis Butir Soal ]`

### 3.11. Langkah 11: Sinkronisasi Nilai ke Gradebook & e-Rapor
- **Tindakan Guru:** Menekan tombol emas `[ 📥 Bukukan ke Buku Nilai Kelas ]`.
- **Proses Sistem:**
  - Nilai akhir ujian CBT otomatis disalin menjadi satu kolom Asesmen resmi pada Tab `PENILAIAN` di ruang kelas (`/kelas-saya/[id]`).
  - Nilai tersimpan permanen pada model `NilaiSiswa` M13 dan langsung siap disinkronkan ke Ledger Leger Nilai e-Rapor Kurikulum Merdeka.
  - Guru memilih opsi `[ Publikasikan Nilai ke Siswa & Wali ]`.

---

# 4. Desain Tata Letak Layar (Wireframe Structure Academic Glass)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR KELAS / ASESMEN                                                                                   │
│ < Kembali ke Kelas Saya  |  X TO 3 — Koding & AI • Asesmen Sumatif Tengah Semester (STS)   [Cetak PDF]   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BILAH NAVIGASI HORIZONTAL WORKSPACE ASESMEN:                                                             │
│ [ 📌 Ikhtisar ] [ 📑 Kisi-Kisi ] [ 📚 Soal & Kunci ] [ 💻 Monitor Proktor ] [ ✍️ Koreksi Esai ] [ 📊 Analitik ] │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KANVAS KERJA UTAMA (ACADEMIC GLASS DUAL-PANEL):                                                          │
│                                                                                                          │
│ ┌──────────────────────────────────────────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │ PANEL KIRI: MONITOR STATUS & PESERTA             │ │ PANEL KANAN: AKSI CEPAT & KELENGKAPAN           │ │
│ │ • Total Peserta: 36 Siswa (34 Hadir, 2 Selesai)  │ │ • Token Masuk: [ K R Y Z Q A ] (Stabil)         │ │
│ │ • Waktu Berjalan: 00:48:12 / 01:30:00            │ │ • Status Naskah: Snapshot Beku (25 Soal)        │ │
│ │ • Sinyal Kelas: 36 Terhubung Stabil              │ │ • Tindakan Pengawas:                            │ │
│ │                                                  │ │   [ + 10 Menit Waktu ]  [ Reset Sesi HP ]       │ │
│ │ GRID STATUS PESERTA (4 KOLOM DESKTOP / 2 MOBILE):│ │ • Kelengkapan Berkas Administrasi:              │ │
│ │ [Ahmad F.]  [Alif A.]   [Budi S.]   [Cindy P.]   │ │   [ Cetak Berita Acara ]  [ Cetak Presensi ]    │ │
│ │ Soal 18/25  Soal 22/25  SELESAI     Soal 14/25   │ │ • Buku Nilai:                                   │ │
│ │ Status: OK  Status: OK  Skor: 88    Ragu: 2      │ │   [ 📥 Bukukan Nilai ke Rapor (1-Klik) ]        │ │
│ └──────────────────────────────────────────────────┘ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. Adaptasi Penggunaan Seluler (Mobile Teaching Cockpit)

Untuk guru yang mengawasi ujian langsung di dalam ruang kelas dengan membawa smartphone:
1. **Sticky Header Ringkas:** Menampilkan Token Ujian besar, sisa waktu, dan jumlah siswa yang belum selesai.
2. **Kartu Peserta Vertikal Ramah Jempol:** Setiap baris siswa dilengkapi tombol aksi cepat berukuran minimal 44px:
   - Tombol **Reset Sesi** (jika HP siswa mati).
   - Tombol **Buka Kunci** (jika siswa terkena peringatan keluar fullscreen).
3. **Bottom Action Bar:** Tombol mengambang di bagian bawah layar untuk mengakhiri ujian atau melihat daftar presensi tanpa perlu menggulir (*scroll*) berulang kali.

---
*Dokumen ini merupakan bagian resmi dari STAGE CBT-01.1 dan siap untuk ditinjau oleh Human Project Owner.*
