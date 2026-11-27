# Spesifikasi Fitur: Offline Queue & Auto-Sync Presensi dan Nilai

| Field | Nilai |
| --- | --- |
| **Slug** | `offline-sync-attendance-grades` |
| **Status** | `active` |
| **Modul Terkait** | `shared/lib` (PWA Sync), `attendance` (M12), `assessment` (M13) |
| **Dibuat** | 2026-11-26 |

---

## 1. Masalah & Tujuan

Guru yang membuka aplikasi Ruang Pintar (PWA) di area dengan koneksi tidak stabil atau terputus (*offline*) saat mengisi **Presensi Sesi Kelas** atau **Input Nilai Asesmen** tidak dapat menyimpan pekerjaannya ke server. Pekerjaan harus tetap dapat disimpan secara lokal di browser dan otomatis disinkronisasikan ke server saat koneksi internet kembali pulih.

---

## 2. Perilaku yang Diharapkan (Acceptance Criteria)

1. **Read Cache (Akses Data Saat Offline):**
   - Saat modal Presensi (`SessionAttendanceModal`) atau Input Nilai (`InputGradesModal`) berhasil memuat data dari server dalam kondisi online, data tersebut disimpan ke cache lokal browser (`IndexedDB`).
   - Jika pengguna membuka kembali modal untuk sesi/asesmen yang sama saat offline, data dimuat dari cache lokal disertai indikator *"Mode Offline"*.
   - Jika ada perubahan yang belum tersinkron di antrean offline untuk sesi/asesmen tersebut, perubahan tersebut ditampilkan di atas data cache.

2. **Offline Mutation Queue (Simpan Saat Offline):**
   - Ketika pengguna menekan tombol Simpan di `SessionAttendanceModal` atau `InputGradesModal` saat `navigator.onLine === false` atau saat request gagal karena gangguan jaringan:
     - Payload mutasi disimpan ke antrean `IndexedDB` (`ruang-pintar-offline-sync`).
     - Mutasi pada entitas yang sama (`SESSION_ATTENDANCE:<sesiId>` atau `ASSESSMENT_GRADES:<asesmenId>`) di-*coalesce* (ditimpa dengan versi terbaru) agar tidak terjadi duplikasi.
     - Pengguna mendapat pesan sukses lokal yang jelas bahwa data tersimpan di perangkat dan akan disinkronkan saat online.

3. **Auto-Sync & Manual Sync Saat Online Kembali:**
   - Saat browser kembali `online` (atau saat komponen `PwaRegister` dimuat dalam kondisi online dengan antrean tertunda), runner sinkronisasi otomatis mengeksekusi ulang Server Action terkait (`saveSessionAttendanceAction`, `saveAssessmentGradesAction`, dan `publishAssessmentAction` jika dipilih publish).
   - Server tetap menjalankan seluruh validasi, `requireAuth()`, `requirePermission()`, dan isolasi `sekolah_id` seperti biasa.
   - Item yang berhasil disinkronkan dihapus dari antrean; item yang gagal karena error auth/validasi tetap dipertahankan dengan pesan error agar tidak hilang.
   - `PwaRegister` menampilkan indikator jumlah antrean tertunda serta tombol sinkronisasi manual.

---

## 3. Batasan Non-Fungsional & Keamanan

- **Strict Server-Side Authorization:** Tidak ada bypass otorisasi. Semua data yang disinkronkan tetap melewati Server Action resmi.
- **Tidak Mengubah Perilaku Online Normal:** Saat koneksi online dan tidak ada error jaringan, alur simpan berjalan langsung seperti sebelumnya.
- **Zero Schema/Migration Changes:** Tidak ada perubahan skema database server.
