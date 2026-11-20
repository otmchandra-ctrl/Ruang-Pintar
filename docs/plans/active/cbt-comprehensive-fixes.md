# Plan CBT Engine & UI/UX Hotfixes (CBT-HOTFIX-01)

| Field | Nilai |
| --- | --- |
| **Feature** | CBT Fullscreen, Anti-Cheat Reload Safety, Autosave Data Integrity, High-Contrast UI/UX, Active Question Editing |
| **Status** | `active` |
| **Date** | 2026-10-13 |

## 1. Urutan Pengerjaan
1. **Perbaikan Backend & Autosave ID Invariant:**
   - Normalisasi `soal_id` vs `bank_soal_id` di `cbt-repository.ts` (`saveJawaban`, `findJawabanBySession`, `findExamAttempts`, `submitAttempt`).
   - Normalisasi `soal_id` di `cbt-player-view.tsx` payload (`qItem.soal_id || qItem.bank_soal_id`).
   - Mencegah `generateUlid()` acak untuk `soal_id` yang menyebabkan baris hantu tak terbatas.
2. **Data Repair & Re-Scoring:**
   - Buat skrip perbaikan database untuk deduplikasi jawaban siswa pada "Latihan TKA RPL".
   - Hitung ulang nilai (re-scoring) untuk 13 siswa terdampak agar nilai asli mereka muncul.
3. **Penegakan Fullscreen & Anti-Cheat Safe Reload:**
   - Tambahkan Fullscreen Modal Gate saat pertama kali membuka ujian dan saat refresh.
   - Tambahkan `beforeunload` suppression tracker pada `handleBlur` agar me-refresh halaman tidak dianggap pindah tab / curang.
4. **Perbaikan Warna Font & Keterbacaan (Contrast & Dark Mode Fix):**
   - Pastikan styling card CBT dan `MathRenderer` sinkron (tidak ada teks putih di atas background putih).
   - Dukung styling code block yang rapi untuk soal pemrograman/kode.
5. **UI/UX Overhaul CBT Player & Proctor Cockpit:**
   - CBT Player: Desain modern, bersih, font size selector (A- / A / A+), pilihan ganda yang elegan, panel daftar soal yang intuitif.
   - Proctor Cockpit: Monitor siswa dengan metrik akurat (X/20 soal dijawab), filter status, indikator live, tombol koreksi soal.
6. **Fitur Edit/Koreksi Soal Ujian Aktif:**
   - Server action `updateActiveExamQuestionAction` yang mengupdate `VersiSoal` dan `SnapshotUjian.manifest_soal` serta `kunci_penilaian`.
   - Modal Koreksi Soal di Proctor Cockpit dan tombol di CBT Hub untuk ujian aktif.
7. **Verifikasi Quality Gates:**
   - Jalankan `npm run typecheck`, `npm run test`, `npm run lint`.
