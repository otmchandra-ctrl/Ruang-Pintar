# CBT-03.3 — PRODUCTION RISK REGISTER & MITIGATION MATRIX
## Ruang Pintar — School Digital Operating Platform

| Parameter | Nilai Resmi |
| --- | --- |
| **Document Purpose** | Comprehensive Risk Catalog, Impact Analysis & Mitigation Pathways |
| **Lifecycle Gate** | Post CBT-03.2 Delivery / Pre CBT-03.4 Remediation |
| **Auditor** | Antigravity AI — Risk & Quality Assurance Unit |
| **Status** | `ACTIVE RISK REGISTER` |

---

## 1. Matriks Klasifikasi Risiko (Risk Severity Matrix)

| Dampak \ Kemungkinan | Rendah (1) | Sedang (2) | Tinggi (3) |
| :--- | :---: | :---: | :---: |
| **Kritis (3)** | SEDANG (3) | **TINGGI (6)** | **KRITIS / BLOCKER (9)** |
| **Sedang (2)** | RENDAH (2) | SEDANG (4) | **TINGGI (6)** |
| **Rendah (1)** | RENDAH (1) | RENDAH (2) | SEDANG (3) |

---

## 2. Tabel Registrasi Risiko CBT Runtime (Active Risk Register)

| Risk ID | Domain Kategori | Deskripsi Risiko | Kemungkinan | Dampak | Tingkat Risiko | Status Saat Ini |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **RSK-01** | **Reliabilitas** | **Jawaban offline di LocalStorage tidak di-flush sebelum submit**, berpotensi kehilangan butir jawaban jika koneksi internet baru pulih sesaat sebelum submit akhir. | Tinggi (3) | Kritis (3) | **BLOCKER (9)** | Menunggu Remediasi CBT-03.4 |
| **RSK-02** | **UX Mobile** | **False Positive Strike deteksi Split-Screen Android** saat virtual keyboard menutup lambat, menyebabkan attempt terkunci pada siswa yang jujur. | Tinggi (3) | Kritis (3) | **BLOCKER (9)** | Menunggu Remediasi CBT-03.4 |
| **RSK-03** | **Performa** | **Redundansi 3x SELECT dan JSON parse berulang** per satu butir autosave membebani I/O SQLite Single-Writer pada skala > 300 siswa serentak. | Tinggi (3) | Sedang (2) | **TINGGI (6)** | Menunggu Remediasi CBT-03.4 |
| **RSK-04** | **Keamanan** | **Tidak adanya Single Device Session Lock**, memungkinkan akun siswa dibuka dan dikerjakan secara paralel di dua perangkat berbeda (joki real-time). | Sedang (2) | Tinggi (3) | **TINGGI (6)** | Menunggu Remediasi CBT-03.4 |
| **RSK-05** | **Reliabilitas** | **Timer visual client melambat akibat background tab throttling** di browser Android, sehingga countdown visual tertinggal dari server deadline. | Tinggi (3) | Sedang (2) | **TINGGI (6)** | Menunggu Remediasi CBT-03.4 |
| **RSK-06** | **Keamanan** | **Bypass Token jika admin menyetel `gunakan_token: true` namun membiarkan `token_masuk` null**, melewati pengecekan token. | Sedang (2) | Sedang (2) | **SEDANG (4)** | Menunggu Remediasi CBT-03.4 |
| **RSK-07** | **UX Mobile** | **Grid nomor soal bertumpuk di bawah lembar soal** pada viewport mobile, mengharuskan scroll panjang untuk berpindah nomor soal. | Tinggi (3) | Rendah (1) | **SEDANG (3)** | Menunggu Remediasi CBT-03.4 |
| **RSK-08** | **Aksesibilitas** | **Tombol icon aksi belum memiliki atribut `aria-label` lengkap**, mengurangi aksesibilitas bagi siswa pengguna screen reader. | Rendah (1) | Sedang (2) | **RENDAH (2)** | Menunggu Remediasi CBT-03.4 |

---

## 3. Rencana Tindakan Mitigasi Terperinci (Mitigation Action Plan)

### RSK-01: Auto-Flush LocalStorage Buffer on Submit
- **Akar Masalah:**
  Fungsi `submitAttemptAction` di server langsung mengevaluasi tabel `jawaban_siswa` yang ada di database. Jawaban yang sempat tersimpan di `localStorage` karena gangguan koneksi belum tentu sudah terkirim ke server sebelum siswa menekan submit.
- **Rencana Tindakan:**
  Pada client `handleSubmitAttempt`, bandingkan timestamp jawaban lokal dengan riwayat jawaban terkonfirmasi di server. Jika terdapat selisih (jawaban tertunda), lakukan batch sync sinkron sebelum request submit permanen dieksekusi.

### RSK-02: Debounce & Cooldown Penutupan Keyboard Android
- **Akar Masalah:**
  Resize event browser Android terpicu saat keyboard virtual menutup, sementara event blur pada input terjadi terlebih dahulu, menyebabkan rasio tinggi layar < 0.6 terbaca sebagai pembagian layar split-screen.
- **Rencana Tindakan:**
  Gunakan `window.visualViewport` API untuk mengukur perubahan viewport murni, dan terapkan cooldown 1500ms setelah input blur sebelum detektor rasio layar diaktifkan kembali.

### RSK-03: Optimasi Pipeline Autosave (Eliminasi Redundansi Query)
- **Akar Masalah:**
  Satu panggilan autosave mengeksekusi `findSessionById` di service, lalu `findUnique` + join snapshot di `saveJawaban`, lalu `findUnique` di `saveAnswer`.
- **Rencana Tindakan:**
  Kirimkan `soal_id` dan `versi_soal_id` langsung dari manifest client yang terverifikasi, sehingga autosave hanya membutuhkan **1 single upsert** ke tabel `jawaban_siswa` tanpa membaca ulang snapshot ujian.

### RSK-04: Single Device Session Enforcer
- **Akar Masalah:**
  Tidak ada token validasi kepemilikan sesi perangkat aktif pada tabel `sesi_ujian_siswa`.
- **Rencana Tindakan:**
  Tambahkan field `active_session_token` pada `sesi_ujian_siswa`. Saat start/resume dipanggil, generate token sesi baru. Jika perangkat lain mencoba melakukan autosave dengan token sesi lama, server melempar galat `SESI_PERANGKAT_KEDALUWARSA` dan mengunci layar perangkat lama.

### RSK-05: Absolute Timestamp Delta Timer
- **Akar Masalah:**
  Countdown menggunakan `setInterval` murni `prev - 1` yang di-throttle oleh engine penghemat daya Android saat tab tidak aktif.
- **Rencana Tindakan:**
  Hitung sisa waktu berbasis `targetDeadlineMs - Date.now()` pada setiap tick interval, sehingga saat tab diaktifkan kembali, timer langsung meloncat ke waktu sebenarnya yang sinkron dengan server.

---

## 4. Rekomendasi Alokasi Tahap Berikutnya

```text
TAHAP SAAT INI : STAGE CBT-03.3 (HUMAN REVIEW AUDIT) -> SELESAI
TAHAP BERIKUTNYA: STAGE CBT-03.4 (STABILIZATION & PRODUCTION REMEDIATION)
TARGET TUGAS   : Menyelesaikan mitigasi RSK-01 s/d RSK-05 sebelum pelaksanaan pilot sekolah.
```
