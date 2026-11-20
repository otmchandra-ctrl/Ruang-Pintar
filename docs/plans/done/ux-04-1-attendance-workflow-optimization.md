# PLAN: STAGE UX-04.1 — ATTENDANCE WORKFLOW OPTIMIZATION

## 1. Tujuan
Mengoptimalkan arsitektur alur presensi kelas (`SessionAttendanceModal`) agar guru dapat menyelesaikan presensi 27–40 siswa dalam waktu kurang dari 60 detik melalui segregasi *List View (lihat)* dan *Detail View (ubah via Bottom Sheet)* serta mengimplementasikan *Real Apple Glass Radio Button*.

---

## 2. Rincian Langkah Kerja

### Fase 1: Desain & Tipe Komponen
1. Tentukan state untuk `activeEditStudentId: string | null` di dalam modal presensi.
2. Siapkan komponen Bottom Sheet Editor (`StudentAttendanceBottomSheet`) yang mengelola pemilihan status dan catatan presensi untuk siswa terpilih.
3. Rancang indikator *Real Glass Radio Button* dengan styling:
   - `backdrop-blur-xl`
   - Background: `rgba(255,255,255,0.45)` (Light) & `rgba(255,255,255,0.06)` (Dark)
   - Border: `rgba(255,255,255,0.6)` (Light) & `rgba(255,255,255,0.12)` (Dark)
   - Selected state: `scale(1.02)`, transisi 150ms.

### Fase 2: Refaktor `SessionAttendanceModal`
1. **Quick Action**:
   - Pasang header ringkas dengan jumlah total siswa dan tombol `[✓ Tandai Semua Hadir]`.
2. **Compact Summary Bar**:
   - Pasang summary badges minimalis (`✓ Hadir [N]`, `🏥 Sakit [N]`, `✉ Izin [N]`, `✕ Alpha [N]`).
3. **Sticky Search**:
   - Pertahankan pencarian `[🔍 Cari Nama / NISN]` tetap sticky di atas daftar siswa.
4. **Compact Student Rows**:
   - Gantikan 4 tombol segmented berulang dengan baris siswa 56px–72px.
   - Tampilkan nama siswa, NISN/NIS, pill status saat ini, dan ikon chevron `>`.
   - Klik pada baris memicu pembukaan Bottom Sheet siswa bersangkutan.
5. **Bottom Sheet Editor**:
   - Render Bottom Sheet saat siswa dipilih.
   - Pilihan status 4 opsi dengan Real Glass Radio Button.
   - Textarea catatan/alasan.
   - Tombol `[Simpan]` untuk memperbarui state dan menutup sheet.
6. **Sticky Footer**:
   - Ringkasan penyelesaian `X siswa selesai`, tombol `[Tutup]`, dan tombol `[Simpan Presensi]`.

### Fase 3: Pembaruan & Penambahan Unit Test
1. Perbarui `src/test/attendance/session-attendance-mobile-redesign.test.tsx` untuk menguji alur baru:
   - Verifikasi 1-click "Tandai Semua Hadir".
   - Verifikasi baris siswa kompak dan tidak lagi merender puluhan segmented button di daftar utama.
   - Verifikasi klik baris siswa membuka Bottom Sheet editor.
   - Verifikasi perubahan status melalui Real Glass Radio Button di Bottom Sheet.
   - Verifikasi form submit mengirimkan seluruh item ke server action.
2. Pastikan `src/test/attendance/attendance-views.test.tsx` tetap lulus 100%.

### Fase 4: Quality Gates & Verifikasi
1. Jalankan `npm run typecheck`
2. Jalankan `npm run lint`
3. Jalankan `npm run format:check`
4. Jalankan `npm run test`
5. Jalankan `npm run build`

---

## 3. Rencana Rollback
Jika terjadi masalah fungsional, git restore pada `src/modules/attendance/presentation/session-attendance-modal.tsx` dan berkas pengujian terkait untuk mengembalikan ke checkpoint UX-04.
