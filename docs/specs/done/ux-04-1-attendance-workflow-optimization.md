# SPEC: STAGE UX-04.1 — ATTENDANCE WORKFLOW OPTIMIZATION

## 1. Konteks & Latar Belakang
Pada tahap UX-04 sebelumnya, antarmuka tabel spreadsheet berhasil digantikan oleh format kartu. Namun, setiap kartu siswa memuat 4 tombol kontrol presensi tersegmentasi (`Hadir`, `Sakit`, `Izin`, `Alpha`) secara berulang. Untuk kelas dengan 27–40 siswa, pola ini menghasilkan:
- Jarak gulir (scroll length) yang terlampau panjang.
- Kebisingan visual (*visual noise*) yang tinggi akibat puluhan tombol yang bersaing secara bersamaan.
- Guru dipaksa menavigasi banyak kontrol sekaligus sehingga target alur presensi cepat (*"Absen selesai dalam < 60 detik"*) belum tercapai.

STAGE UX-04.1 melakukan refaktor arsitektural alur presensi dengan menerapkan prinsip pemisahan:
- **LIST VIEW = LIHAT STATUS**: Tampilan daftar ringkas berketinggian 56px–72px per siswa, memuat informasi nama, nomor identitas (NISN/NIS), badge status saat ini, dan tombol penunjuk detail.
- **DETAIL VIEW = UBAH STATUS**: Interaksi pengubahan status dan pengisian catatan presensi dialihkan ke modal melayang dari bawah (*Bottom Sheet Drawer/Editor*), fokus pada satu siswa yang dipilih.

---

## 2. Prinsip & Kriteria Desain Baru

### 2.1 Quick Attendance (1-Click Mark All Present)
- Di bagian atas modal, tersedia ringkasan jumlah siswa dan tombol aksi cepat:
  `[✓ Tandai Semua Hadir]` (100% width, tinggi 44–48px).
- Menekan tombol ini seketika mengubah seluruh siswa dalam daftar menjadi berstatus `HADIR`.
- Guru hanya perlu membuka siswa pengecualian yang sakit, izin, atau alpha.

### 2.2 Compact Student Row (56px–72px)
- Format baris siswa:
  - Sisi kiri: Nama lengkap siswa (tebal, truncate) + NISN/NIS (font-mono slate).
  - Sisi kanan: Status pill ringkas (e.g., `✓ Hadir`, `🏥 Sakit`, `✉ Izin`, `✕ Alpha`) + Chevron `>`.
- Ketinggian baris maksimum 56px–72px untuk memastikan pada viewport mobile 390px, terlihat Header, Summary, Search, dan 5–6 siswa sekaligus tanpa perlu scroll awal.

### 2.3 Bottom Sheet Editor (Mobile First)
- Mengklik baris siswa membuka Bottom Sheet yang muncul dari bawah layar dengan animasi halus.
- Konten Bottom Sheet:
  - Header Bottom Sheet: Nama siswa, NISN/NIS, tombol tutup `[X]`.
  - Pilihan Status Presensi: Radio button bergaya *Real Apple Glass Style*.
  - Input Catatan/Alasan: Textarea catatan presensi (terutama saat Sakit, Izin, atau Alpha).
  - Footer Bottom Sheet: Tombol `[Simpan]` / `[Selesai]` untuk mengonfirmasi status siswa dan menutup sheet.

### 2.4 Real Glass Radio Button
- Menggantikan kontrol flat green border/background dengan Apple Glassmorphism standar tinggi:
  - `backdrop-blur-xl`
  - Background: `rgba(255,255,255,0.45)` (Light) / `rgba(255,255,255,0.06)` (Dark)
  - Border: `rgba(255,255,255,0.6)` (Light) / `rgba(255,255,255,0.12)` (Dark)
  - Soft shadow & border highlight
  - Selected state: `scale(1.02)`, transisi 150ms (`transition-all duration-150`)
  - Aksen status spesifik:
    - Hadir: Emerald glass accents
    - Sakit: Amber glass accents
    - Izin: Sky/Blue glass accents
    - Alpha: Rose glass accents

### 2.5 Attendance Summary Ringkas
- Menampilkan penghitung status minimalis:
  `✓ 25` (Hadir), `🏥 1` / `⚠ 1` (Sakit/Izin), `✕ 1` (Alpha).
- Dilarang memakai chart/donut/progress ring yang memakan ruang vertikal.

### 2.6 Sticky Search & Sticky Footer
- Search input `[🔍 Cari Nama / NISN]` tetap sticky saat menggulir daftar.
- Sticky footer menampilkan `X siswa selesai`, tombol `[Tutup]`, dan tombol utama `[Simpan Presensi]` yang selalu terlihat dan mudah ditekan.

---

## 3. Kriteria Penerimaan (Acceptance Criteria)
1. ✓ Satu kali klik "Tandai Semua Hadir" langsung mengubah status seluruh siswa menjadi HADIR.
2. ✓ Baris siswa kompak (tinggi 56px–72px).
3. ✓ Status di baris siswa hanya tampil sebagai badge/pill ringkas.
4. ✓ Pengubahan status siswa dilakukan lewat Bottom Sheet.
5. ✓ Radio button mengimplementasikan Real Glass UI (Apple Glass style, backdrop-blur-xl, scale 1.02, 150ms).
6. ✓ Kepadatan visual memungkinkan 5–6 siswa tampak pada viewport mobile 390px.
7. ✓ Input catatan presensi tersedia di dalam Bottom Sheet.
8. ✓ Form submit utama mengirimkan seluruh data presensi sesi secara akurat ke server action.
9. ✓ Seluruh quality gates (typecheck, lint, format:check, test, build) lulus 100%.
