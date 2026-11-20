# SPEC: STAGE UX-04 — STUDENT DIRECTORY & ATTENDANCE EXPERIENCE REDESIGN

## 1. Konteks & Tujuan
Transformasi alur presensi kelas dan manajemen siswa di area Guru (Teacher Workspace: `/kelas-saya/[id]`) menjadi pengalaman digital yang:
1. **Fast Attendance Workflow**: 1-click attendance ("Tandai Semua Hadir"), koreksi cepat pengecualian, glass segmented controls, mobile-first, tanpa tabel spreadsheet padat.
2. **Student Academic Directory**: Direktori akademik siswa berbasis kelas yang informatif (bukan sekadar daftar nama statis).
3. **Student Academic Health Monitoring**: Perhitungan otomatis status kesehatan akademik siswa (🟢 Aman, 🟡 Perlu Perhatian, 🔴 Risiko Akademik) berbasis 3 pilar: Kehadiran (%), Penyelesaian Tugas (%), dan Capaian TP (%).
4. **Teacher-Centric UX & Side Sheet**: Interaksi mulus tanpa navigasi halaman baru melalui slide-over Right Side Sheet (Fernly inspired) berukuran 420px desktop / 380px tablet, lengkap dengan tab Overview, Presensi, Tugas, Nilai, TP, dan Catatan Internal Guru.
5. **Aksi Percakapan & Catatan**: Tombol Chat (siap integrasi Guru ↔ Siswa / Guru ↔ Orang Tua) dan Catatan Internal Guru (rahasia, tidak terlihat oleh siswa).

---

## 2. Part A: Attendance Modal Redesign
### 2.1 Elemen yang Dihapus
- Tabel presensi horizontal & dense spreadsheet UI.
- Progress circle & persentase kehadiran di header.
- Blok statistik besar & chip badge berlebihan.
- Tombol presensi kecil non-touch-friendly.

### 2.2 Struktur Modal Baru (Mobile First, Teacher First)
1. **Header**:
   - Label: `Presensi Kelas` (font-mono uppercase)
   - Nama Mata Pelajaran: e.g. `Pemrograman Berbasis Objek`
   - Subtitle: `XII RPL • Selasa, 06 Oktober 2026`
   - Badge Total: `15 Siswa`
   - Tombol Tutup: `[X]`
2. **Quick Action**:
   - `[✓ Tandai Semua Hadir]` (Width: 100%, Height: 48px, primary emerald glass glow)
3. **Search**:
   - Input: `[ Cari Nama / NISN ]` (Sticky saat scroll)
4. **Student Attendance Card**:
   - Avatar / Initial, Nama Siswa, NISN / NIS
   - Glass Segmented Attendance Control:
     - `Hadir` (Green glass: emerald-500/20, border emerald-500/40, soft glow, scale 1.02)
     - `Sakit` (Amber glass: amber-500/20, border amber-500/40, soft glow, scale 1.02)
     - `Izin` (Blue glass: blue-500/20, border blue-500/40, soft glow, scale 1.02)
     - `Alpha` (Red glass: rose-500/20, border rose-500/40, soft glow, scale 1.02)
     - Transisi 150ms, touch target 44px (mobile) / 48px (desktop).
   - Catatan / Alasan:
     - Hanya muncul jika status != Hadir
     - Placeholder: `Tulis alasan...`
5. **Sticky Footer**:
   - Ringkasan: `X siswa selesai`
   - Tombol: `[Tutup]` dan `[Simpan Presensi]` (Height: 48px, primary CTA)

---

## 3. Part B: Tab Siswa & Student Academic Directory
### 3.1 Penempatan Tab Baru
Urutan tab di `/kelas-saya/[id]`:
`Overview` → `Materi` → `Tugas` → `Jurnal` → `Presensi` → **`SISWA`** → `Penilaian` → `CBT` → `Pengaturan`

### 3.2 Header & Filter Halaman Siswa
- **Header**:
  - Judul: `Siswa`
  - Subtitle: `23 Siswa Aktif` (dinamis sesuai jumlah siswa kelas)
  - CTA: `[Tambah Siswa]` (membuka drawer/modal Kode Gabung Rombel / Tambah Siswa)
- **Filter**:
  - `[Semua]`
  - `[Laki-laki]`
  - `[Perempuan]`
  - `[Perlu Perhatian]` (Health Status != AMAN)
  - `[Sering Alpha]` (Alpha > 0)
- **Search**:
  - `[ Cari siswa ]`

### 3.3 Academic Health Card (Student Card)
- **Layout**:
  - Desktop: 4 kolom (`grid-cols-4`)
  - Tablet: 3 kolom (`grid-cols-3` / `md:grid-cols-3`)
  - Mobile: 1 kolom (`grid-cols-1`)
- **Desain Kartu**:
  - Avatar, Nama Siswa, NISN
  - Status Akademik:
    - 🟢 `Aman`
    - 🟡 `Perlu Perhatian`
    - 🔴 `Risiko Akademik`
  - 4 Indikator Glass:
    - 📅 Kehadiran: `96%`
    - 📝 Tugas: `8 / 10`
    - 🎯 TP: `6 / 8`
    - 🏆 Nilai: `88`
  - Aksi:
    - `💬 Chat` (Membuka dialog interaksi Guru ↔ Siswa / Wali Murid)
    - `⚠ Catatan` (Membuka Side Sheet langsung ke tab Catatan Internal)
  - Kartu dapat diklik di area utama untuk membuka profil Side Sheet.

### 3.4 Formula Academic Health Score
Dihitung otomatis per siswa:
- 🔴 **Merah (Risiko Akademik)**:
  `Kehadiran < 70%` ATAU `Penyelesaian Tugas < 50%`
- 🟢 **Hijau (Aman)**:
  `Kehadiran >= 85%` DAN `Penyelesaian Tugas >= 80%` DAN `Capaian TP >= 75%`
- 🟡 **Kuning (Perlu Perhatian)**:
  `Kehadiran 70–84%` ATAU `Penyelesaian Tugas 50–79%` (atau kondisi di antara keduanya)

### 3.5 Student Detail Side Sheet (Fernly Inspired)
- **Lebar**: Desktop 420px, Tablet 380px, Mobile responsif
- **Header Side Sheet**:
  - Avatar, Nama Siswa, NISN, Rombel
  - Status Akademik Badge (🟢 / 🟡 / 🔴)
  - Tombol Tutup `[X]`
- **Tab Internal**:
  1. `Overview`: Attendance %, Rata-rata Nilai, Task Completion, TP Completion, CBT Performance
  2. `Presensi`: Riwayat presensi per sesi pertemuan (status, tanggal, alasan)
  3. `Tugas`: Daftar tugas (TP1, TP2, TP3), status pengumpulan (Dikumpulkan, Terlambat, Belum Kumpul), nilai
  4. `Nilai`: Buku nilai asesmen (formatif, sumatif, capaian KKTP)
  5. `TP`: Matriks ketercapaian Tujuan Pembelajaran (kode, deskripsi, status capaian)
  6. `Catatan`: Linimasa catatan internal guru (judul, isi, urgensi, penulis, tanggal) + form tambah catatan baru

---

## 4. Acceptance Criteria
- [x] Modal Presensi tidak lagi menggunakan layout tabel horizontal padat.
- [x] Kontrol presensi menggunakan Glass Segmented Control (Hadir, Sakit, Izin, Alpha) dengan touch target min 44px.
- [x] Presensi modal optimal untuk mobile & desktop.
- [x] Tab baru `Siswa` tersedia di antara `Presensi` dan `Penilaian`.
- [x] Kartu siswa menampilkan Academic Health Score otomatis (🟢 Aman, 🟡 Perlu Perhatian, 🔴 Risiko Akademik).
- [x] Aksi Chat tersedia untuk komunikasi siswa/wali murid masa depan.
- [x] Catatan internal guru tersedia dan tersimpan aman di server (`catatan_monitoring`).
- [x] Right Side Sheet profil siswa diimplementasikan dengan 6 tab internal (Overview, Presensi, Tugas, Nilai, TP, Catatan).
- [x] Desain responsif (1 kolom mobile, 3 kolom tablet, 4 kolom desktop).
- [x] Konsisten dengan Academic Glass UI v1.2 (tokens, font-mono numbers, rounded-2xl, soft glows).
- [x] Tanpa regresi alur kerja guru yang sudah ada.
