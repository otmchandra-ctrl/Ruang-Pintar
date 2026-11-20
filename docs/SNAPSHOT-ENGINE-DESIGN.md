# SNAPSHOT ENGINE DESIGN
## Ruang Pintar — School Digital Operating Platform
### Immutable Exam Snapshot & Cryptographic Verification Architecture

| Metadata | Nilai |
| --- | --- |
| **Dokumen** | SNAPSHOT-ENGINE-DESIGN.md |
| **Stage** | STAGE CBT-04 — CBT Delivery Foundation |
| **Status** | `APPROVED ARCHITECTURE` |
| **Engine** | `ExamSnapshotEngine` (`src/modules/cbt/application/exam-snapshot-engine.ts`) |

---

## 1. Background & The Version Drift Threat

Ujian di sekolah mengalami jeda waktu yang signifikan antara saat penyusunan draf, percetakan dokumen, telaah kurikulum, dan pelaksanaan CBT. Jika guru mengoreksi salah tik, mengganti gambar stimulus, atau mengubah kunci jawaban pada `BankSoal` di tengah ujian yang sedang berjalan:
- Terjadi ketidakadilan bagi siswa yang telah mengerjakan lebih awal.
- Terjadi inkonsistensi antara kunci penilaian dengan instrumen yang dikerjakan siswa.
- Runtuhnya integritas akreditasi dan audit evaluasi sekolah.

Untuk mengatasi ini, Ruang Pintar menerapkan **Tier-3 Assessment Execution Snapshot** yang bersifat **Immutable**.

---

## 2. Anatomy of a SnapshotUjian

Sebuah `SnapshotUjian` merekam kondisi lengkap ujian pada momen transisi ke `PUBLISHED`:

```
+-----------------------------------------------------------------------------------+
|                               SnapshotUjian (Record)                              |
+-----------------------------------------------------------------------------------+
| 1. METADATA UJIAN (JSON)                                                          |
|    - id, judul, deskripsi, durasi_menit, kkm_kktp                                 |
|    - mata_pelajaran, guru_pengampu, rombel, dibekukan_oleh, dibekukan_pada        |
|                                                                                   |
| 2. KONFIGURASI UJIAN (JSON)                                                       |
|    - acak_soal, acak_opsi, gunakan_token, tampilkan_nilai, maksimal_attempt       |
|                                                                                   |
| 3. MANIFEST SOAL KLIEN (JSON) -> DISTRIBUSI KE SISWA                              |
|    - nomor_urut, soal_id, versi_soal_id, tipe_soal, pertanyaan, gambar_url        |
|    - opsi_jawaban: [{ id, label, teks, urutan }] (TANPA INDIKATOR BENAR!)        |
|                                                                                   |
| 4. ATURAN PENILAIAN RAHASIA (JSON) -> SERVER BOUNDARY ONLY                        |
|    - soal_id, versi_soal_id, tipe_soal, kunci_jawaban, bobot                     |
|                                                                                   |
| 5. CRYPTOGRAPHIC INTEGRITY HASH (SHA-256)                                         |
|    - Hash unik 64-karakter dari komputasi deterministik (1 + 2 + 3 + 4)           |
+-----------------------------------------------------------------------------------+
```

---

## 3. Cryptographic SHA-256 Integrity Hash Computation

Hash integritas dihitung secara deterministik:

```typescript
const canonicalString = JSON.stringify({
  metadata: payload.metadata,
  konfigurasi: payload.konfigurasi,
  manifestSoal: payload.manifestSoal,
  kunciPenilaian: payload.kunciPenilaian,
});

const hashIntegritas = crypto.createHash("sha256").update(canonicalString).digest("hex");
```

### Manfaat Verifikasi Kriptografis:
1. **Tamper-Evident:** Jika data diubah langsung di database SQLite (misal kunci jawaban disusupi), fungsi `verifySnapshotIntegrity()` akan mendeteksi `tampered: true` karena hash yang tercatat tidak cocok dengan hash aktual.
2. **Audit Compliance:** Hash tercetak pada naskah soal, kartu soal, kunci jawaban, dan berita acara ujian (`RP-SNAP-XXXXXXXX-YYYY`).

---

## 4. Immutability Guarantee

1. **Write Once, Read Many (WORM):** Record `SnapshotUjian` dibuat sekali saat publikasi.
2. **Prohibition of Mutation:** Jika ujian telah berstatus `PUBLISHED`, pemanggilan ulang `freezeSnapshot` akan melempar `CbtSnapshotImmutableError`.
3. **Decoupled from Question Bank:** Perubahan atau penghapusan soal di `BankSoal` atau `VersiSoal` tidak memengaruhi `SnapshotUjian` yang sudah ada. Siswa tetap mengerjakan snapshot naskah yang asli.

---

## 5. Security: Client Isolation vs Server Boundary

| Bagian Data | Akses Siswa / Klien | Akses Server Boundary | Alasan Keamanan |
| :--- | :---: | :---: | :--- |
| **Manifest Soal** | Ya (Read-Only) | Ya | Berisi stimulus, teks soal, opsi teracak. Aman ditampilkan di browser siswa. |
| **Opsi Jawaban** | Ya (Teks & Label) | Ya | Tidak menyertakan flag `isCorrect`. Siswa tidak bisa memeriksa kunci lewat DevTools/DOM. |
| **Kunci Jawaban** | **DITOLAK (403)** | Ya (Internal) | Kunci hanya dibaca oleh engine penilaian saat koreksi di server. |
| **Bobot Penilaian** | Ya (Bobot Butir) | Ya | Transparansi bobot penilaian butir soal. |
