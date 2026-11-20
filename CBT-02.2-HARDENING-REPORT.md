# CBT-02.2: FOUNDATION HARDENING & ARCHITECTURE AUDIT REPORT
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| :--- | :--- |
| **Dokumen** | CBT-02.2-HARDENING-REPORT.md |
| **Tahap** | STAGE CBT-02.2 — Foundation Hardening & Snapshot Design |
| **Status** | `COMPLETED & VERIFIED` |
| **Tanggal** | 2026-10-07 |
| **Modul Terkait** | M11 (Learning), M12 (CBT / Bank Soal), M13 (Assessment & Administration), M14 (CBT Runtime) |

---

## 1. Ringkasan Eksekutif

STAGE CBT-02.2 berfokus pada **Hardening Arsitektur Fondasi** Assessment Engine sebelum melangkah ke implementasi UI atau CBT execution engine. Audit mendalam dan perancangan arsitektur telah diselesaikan untuk 4 domain kritis:

1. **Snapshot Strategy (Version Drift Prevention):** Perancangan *Three-Tier Snapshot Architecture* yang melindungi integritas akademik dari perubahan butir soal setelah kisi-kisi dibuat, naskah dicetak, atau ujian berjalan.
2. **Print Engine Foundation:** Perancangan arsitektur cetak dokumen fisik berstandar nasional (A4 Landscape untuk Kisi-Kisi, A4 Portrait 2-Kolom untuk Naskah Soal, A4 Portrait Box untuk Kartu Soal) dengan *safe print margin* untuk printer sekolah Indonesia dan *flexible school letterhead*.
3. **Question Folder Hierarchy:** Perancangan model hierarki 4 level (`Folder` $\rightarrow$ `Sub-Folder` $\rightarrow$ `Topic` $\rightarrow$ `Chapter`) yang selaras dengan field `folder_id` eksisting, menjamin nol migrasi destruktif di masa depan.
4. **Cognitive Taxonomy Architecture:** Audit model `L1`, `L2`, `L3` Pusmendik/BSKAP yang terbukti 100% memadai untuk SD, SMP, SMA, dan SMK, dilengkapi *Bi-directional Extensibility Layer* menuju Taksonomi Bloom Revisi (`C1`–`C6`).

Pekerjaan mematuhi batasan ketat: **TIDAK mengimplementasikan CBT Player, Proctoring, maupun AI Assistant.**

---

## 2. Hasil Audit & Keputusan Arsitektur

### 2.1. Audit 1: Snapshot Strategy & Version Drift
- **Temuan:** Butir soal di Bank Soal bersifat dinamis (dapat diperbaiki typo atau kunci jawabannya oleh guru sewaktu-waktu). Jika tidak diproteksi, naskah kertas siswa yang telah difotokopi akan berbeda dengan kunci jawaban di sistem (*Version Drift*).
- **Keputusan:**
  - **Tier 1 (Question Level):** Tabel `VersiSoal` bersifat *append-only* (setiap revisi menghasilkan `nomor_versi` baru tanpa menghapus versi lama).
  - **Tier 2 (Document Level):** `ItemKisiKisi` mengunci `versi_soal_id` definitif saat status kisi-kisi beralih ke `FINAL`. Checksum hash dicetak di naskah dan kunci jawaban untuk audit fisik.
  - **Tier 3 (Runtime Level):** `SnapshotUjian` membekukan manifest soal dan kunci jawaban saat ujian dijadwalkan, mengisolasi peserta ujian dari segala mutasi di bank soal.
- **Rujukan Lengkap:** [CBT-02.2-SNAPSHOT-DESIGN.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-SNAPSHOT-DESIGN.md)

### 2.2. Audit 2: Print Engine Foundation
- **Temuan:** Tata letak cetak dokumen administrasi sekolah Indonesia memiliki konvensi baku: tabel kisi-kisi sangat lebar (8-10 kolom), naskah soal wajib 2 kolom untuk efisiensi kertas BOS fotokopi, printer sekolah (Epson/Canon ink-tank) memiliki batas margin bawah 8-14 mm, dan kop surat bervariasi (Pemprov/Dinas/Cabdin vs Yayasan swasta).
- **Keputusan:**
  - Kisi-kisi asesmen diatur ke format **A4 Landscape** dengan `thead` berulang otomatis di setiap halaman.
  - Naskah soal diatur ke format **A4 Portrait 2 Kolom** (*two-column layout*), margin aman `15mm 15mm 18mm 18mm`, serta aturan `break-inside: avoid` pada setiap butir soal dan opsi agar tidak terpotong terpisah halaman.
  - Mesin kop sekolah fleksibel mendukung logo ganda, baris instansi bertingkat, dan garis ganda resmi (*double border rule*).
- **Rujukan Lengkap:** [CBT-02.2-PRINT-ARCHITECTURE.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-PRINT-ARCHITECTURE.md)

### 2.3. Audit 3: Question Folder Hierarchy
- **Temuan:** Penambahan kolom `folder_id` pada `BankSoal` di CBT-02.1 memerlukan kejelasan struktur agar pada fase berikutnya tidak terjadi perubahan skema yang merusak relasi yang sudah ada.
- **Keputusan:**
  - Struktur berkedalaman maksimal 4 level: `Folder Utama` $\rightarrow$ `Sub-Folder` $\rightarrow$ `Topik/Bab` $\rightarrow$ `Sub-Topik/Paket`.
  - Model `FolderBankSoal` menggunakan self-referential `parent_id` dengan pembatasan `kedalaman <= 4` dan foreign key `onDelete: SetNull` pada `BankSoal` (soal tidak pernah terhapus jika foldernya dihapus).
  - Dukungan kepemilikan ganda: Folder Personal (`guru_id`) dan Folder Bersama Sekolah (`scope = SEKOLAH`).
- **Rujukan Lengkap:** [CBT-02.2-FOLDER-ARCHITECTURE.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-FOLDER-ARCHITECTURE.md)

### 2.4. Audit 4: Cognitive Taxonomy Model
- **Temuan:** Model `L1`, `L2`, `L3` yang telah diimplementasikan perlu diverifikasi kecukupannya untuk seluruh jenjang pendidikan di Indonesia.
- **Keputusan:**
  - Model `L1` (Pemahaman), `L2` (Aplikasi), dan `L3` (Penalaran / HOTS) sesuai 100% dengan standar Pusmendik/BSKAP Kemendikbudristek untuk SD, SMP, SMA, dan SMK.
  - Disediakan *Bi-directional Extensibility Layer* untuk memetakan Taksonomi Bloom Revisi (`C1` s/d `C6`) ke canonical `L1`–`L3`, sehingga sekolah yang memilih mode granular Bloom tetap menghasilkan dokumen dinas resmi `L1`–`L3` tanpa kerja ganda guru.
- **Rujukan Lengkap:** [CBT-02.2-COGNITIVE-TAXONOMY.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-COGNITIVE-TAXONOMY.md)

---

## 3. Verifikasi Quality Gate

Seluruh fondasi kode yang dibangun pada tahap sebelumnya tetap stabil dan lulus Quality Gate komprehensif:

```text
==================================================
QUALITY GATE COMPLIANCE AUDIT
==================================================
1. TypeScript Compilation (npm run typecheck) : PASS (0 errors)
2. ESLint Rules Check (npm run lint)          : PASS (0 errors)
3. Prettier Formatting (npm run format:check) : PASS (100% clean)
4. Unit & Integration Tests (npm run test)    : PASS (136 files, 864 tests passed)
5. Production Build (npm run build)           : PASS (Next.js 16.3.3 Turbopack clean)
==================================================
```

---

## 4. Deliverables yang Dihasilkan

| No | Nama Dokumen | Lokasi Root | Lokasi Docs Canonical |
| :---: | :--- | :--- | :--- |
| 1 | **Snapshot Design** | [CBT-02.2-SNAPSHOT-DESIGN.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-SNAPSHOT-DESIGN.md) | [docs/CBT-02.2-SNAPSHOT-DESIGN.md](file:///c:/laragon/www/Ruang-Pintar/docs/CBT-02.2-SNAPSHOT-DESIGN.md) |
| 2 | **Print Architecture** | [CBT-02.2-PRINT-ARCHITECTURE.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-PRINT-ARCHITECTURE.md) | [docs/CBT-02.2-PRINT-ARCHITECTURE.md](file:///c:/laragon/www/Ruang-Pintar/docs/CBT-02.2-PRINT-ARCHITECTURE.md) |
| 3 | **Folder Architecture** | [CBT-02.2-FOLDER-ARCHITECTURE.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-FOLDER-ARCHITECTURE.md) | [docs/CBT-02.2-FOLDER-ARCHITECTURE.md](file:///c:/laragon/www/Ruang-Pintar/docs/CBT-02.2-FOLDER-ARCHITECTURE.md) |
| 4 | **Cognitive Taxonomy** | [CBT-02.2-COGNITIVE-TAXONOMY.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-COGNITIVE-TAXONOMY.md) | [docs/CBT-02.2-COGNITIVE-TAXONOMY.md](file:///c:/laragon/www/Ruang-Pintar/docs/CBT-02.2-COGNITIVE-TAXONOMY.md) |
| 5 | **Hardening Report** | [CBT-02.2-HARDENING-REPORT.md](file:///c:/laragon/www/Ruang-Pintar/CBT-02.2-HARDENING-REPORT.md) | [docs/CBT-02.2-HARDENING-REPORT.md](file:///c:/laragon/www/Ruang-Pintar/docs/CBT-02.2-HARDENING-REPORT.md) |

---

## 5. Status Akhir

Pekerjaan STAGE CBT-02.2 telah selesai secara menyeluruh. Sesuai Operating Contract Bab 5.3:
AI **berhenti** dan menunggu arahan dari Human untuk langkah berikutnya.

**STATUS:**
```text
READY FOR HUMAN REVIEW
```
