# CBT-03 IMPLEMENTATION REPORT
## Assessment Administration & Reproducible Print Engine Implementation

| Metadata | Keterangan |
| --- | --- |
| **Stage** | STAGE CBT-03 — Assessment Administration Implementation |
| **Status** | `READY FOR HUMAN REVIEW` |
| **Prisma Engine** | SQLite + Prisma ORM v6.12.0 |
| **Next.js Engine** | Next.js 16.3.3 (Turbopack) |
| **Verification Gate** | Typecheck (0 error), ESLint (0 error), Prettier (100% clean), Vitest (872/872 PASS), Next Build (PASS) |
| **Date** | 2026-10-07 |

---

## 1. Executive Summary

Implementasi **STAGE CBT-03 (Assessment Administration Implementation)** telah diselesaikan secara tuntas tanpa melakukan coding di luar scope (tidak ada CBT player siswa, tidak ada live proctoring, tidak ada AI assistant). 

Fokus implementasi adalah membangun **School Administration Print Engine** dan **Three-Tier Snapshot Binding** yang menjamin:
1. **Zero Version Drift:** Perubahan bank soal setelah dokumen di-snapshot/dibekukan tidak akan mengubah isi naskah cetak, kartu soal, atau kunci jawaban.
2. **Reproducible Documents:** Setiap dokumen cetak resmi dapat diverifikasi keasliannya melalui segel kriptografis SHA-256 (`formatSnapshotSealCode`).
3. **National Print Standard:** 6 dokumen administrasi resmi sekolah dirancang dengan ukuran kertas A4 presisi (portrait & landscape), `break-inside: avoid` untuk mencegah pemotongan butir soal, dan format 2-kolom untuk naskah ujian.
4. **Flexible School Letterhead:** Mendukung identitas instansi resmi sekolah negeri bertingkat (Dinas/Cabdin), swasta/yayasan, madrasah (Kemenag), logo ganda, dan garis pembatas ganda standar kedinasan.

---

## 2. Deliverables & Implementation Inventory

### 2.1. Database Schema & Migration
- **File Skema:** `prisma/schema.prisma`
- **Migration:** `prisma/migrations/20261007212000_add_snapshot_fields_cbt_03/migration.sql`
- **Kolom Baru pada `KisiKisiAsesmen`:**
  - `snapshot_hash String?`: Menyimpan hash SHA-256 deterministik dari payload naskah dan kisi-kisi saat dibekukan.
  - `tanggal_dibekukan DateTime?`: Timestamp pembekuan permanen.
- **Kolom Baru pada `ItemKisiKisi`:**
  - `snapshot_pertanyaan String?`: Snapshot teks butir pertanyaan tersemat.
  - `snapshot_opsi String?`: Snapshot pilihan ganda (JSON array `{ label, teks }`).
  - `snapshot_kunci String?`: Snapshot kunci jawaban tersemat.
  - `snapshot_pembahasan String?`: Snapshot pedoman penskoran/rubrik tersemat.
- **Database Target:** Teluk disinkronkan ke `prisma/data/ruang-pintar.db` dan `prisma/data/ruang-pintar-test.db`.

### 2.2. Cryptographic Helper & Snapshot Engine
- **File:** `src/modules/assessment/infrastructure/snapshot-hash-helper.ts`
- **Fungsi:**
  - `generateDeterministicSnapshotHash(payload)`: Normalisasi rekursif (canonicalize) dari struktur object sebelum hash SHA-256, menjamin hash 100% identik terlepas dari variasi urutan key JSON.
  - `formatSnapshotSealCode(hash, tahunAjaran)`: Memformat segel fisik ringkas untuk naskah fisik (misal: `RP-SNAP-E3B0C442-2026`).

### 2.3. Domain Types & Administration DTOs
- **File:** `src/modules/assessment/domain/assessment-types.ts`
- **DTOs:**
  - `KopSekolahDTO`: Identitas instansi, NPSN, logo kiri (dinas/yayasan), logo kanan (sekolah), kontak.
  - `KartuSoalPayloadDTO` & `KartuSoalItemDTO`: Kartu modular per butir dengan pemetaan TP, materi pokok, indikator, level kognitif (L1/L2/L3), stimulus, teks, kunci, dan rubrik.
  - `NaskahSoalPayloadDTO` & `NaskahSoalButirDTO`: Naskah 2 kolom A4 dengan petunjuk umum, stimulus gambar/teks, dan opsi PG / lembar uraian.
  - `KunciJawabanPayloadDTO` & `KunciJawabanItemDTO`: Naskah rahasia penskoran dan total bobot.
  - `DaftarHadirPayloadDTO` & `SiswaDaftarHadirDTO`: Absensi peserta didik dengan kolom tanda tangan zig-zag (ganjil di kiri, genap di kanan).
  - `BeritaAcaraPayloadDTO` & `SiswaAbsenBeritaAcaraDTO`: Berita acara resmi dengan rekapitulasi kehadiran dan tanda tangan pengawas ruang.

### 2.4. Repository & Service Layer
- **File Repository:** `src/modules/assessment/infrastructure/assessment-repository.ts`
  - `resolveSchoolLetterhead(sekolahId)`: Mengonstruksi Kop resmi dari data profil `Sekolah`.
  - `freezeKisiKisiSnapshot(kisiKisiId, sekolahId)`: Hard-pinning versi soal dari Bank Soal ke kolom `snapshot_*` di `ItemKisiKisi`, menghitung hash SHA-256, dan mengubah status menjadi `FINAL`.
  - `generateKartuSoalPayload`, `generateNaskahSoalPayload`, `generateKunciJawabanPayload`: Membaca data secara ketat dari snapshot jika dokumen sudah dibekukan, atau fallback ke versi tersemat jika draf.
  - `generateDaftarHadirPayload`, `generateBeritaAcaraPayload`: Mengagregasi peserta ujian aktif di rombel secara aman dalam isolasi tenant `sekolah_id`.
- **File Service:** `src/modules/assessment/application/assessment-service.ts`
  - `freezeKisiKisi`: Menerapkan Teacher Scope Guard (guru pengampu penugasan mengajar atau super admin), audit logging `ASSESSMENT_SNAPSHOT_FROZEN`.
  - `getKartuSoal`, `getNaskahSoal`, `getKunciJawaban`, `getDaftarHadir`, `getBeritaAcara`: Enforcement otorisasi guru server-side.

### 2.5. Server Actions
- **File:** `src/app/actions/assessment-administration-actions.ts`
  - Melindungi akses menggunakan `requireAuth()` dan pengecekan konteks `user.sekolah_id`.
  - Menyediakan endpoint tindakan:
    - `getKisiKisiDocumentAction`
    - `getKartuSoalDocumentAction`
    - `getNaskahSoalDocumentAction`
    - `getKunciJawabanDocumentAction`
    - `getDaftarHadirDocumentAction`
    - `getBeritaAcaraDocumentAction`
    - `freezeKisiKisiAction`

### 2.6. Presentation Components (Print Engine)
- **Komponen Kop:** `src/modules/assessment/presentation/print/school-letterhead.tsx`
- **1. Kisi-Kisi Print View:** `src/modules/assessment/presentation/print/kisi-kisi-print-view.tsx` (A4 Landscape, repeating `thead`, kurikulum matriks, segel verifikasi).
- **2. Kartu Soal Print View:** `src/modules/assessment/presentation/print/kartu-soal-print-view.tsx` (A4 Portrait, modular box, stimulus, TP/materi, kunci, penskoran).
- **3. Naskah Soal Print View:** `src/modules/assessment/presentation/print/naskah-soal-print-view.tsx` (A4 Portrait 2 Kolom, `break-inside: avoid` per butir, petunjuk umum).
- **4. Kunci Jawaban Print View:** `src/modules/assessment/presentation/print/kunci-jawaban-print-view.tsx` (A4 Portrait Confidential, rubrik penskoran, total bobot).
- **5. Daftar Hadir Print View:** `src/modules/assessment/presentation/print/daftar-hadir-print-view.tsx` (A4 Portrait, zig-zag ganjil/genap, tanda tangan pengawas).
- **6. Berita Acara Print View:** `src/modules/assessment/presentation/print/berita-acara-print-view.tsx` (A4 Portrait, narasi pembuka resmi, rekapitulasi kehadiran).
- **Interactive Administration Hub:** `src/modules/assessment/presentation/print/administration-hub-view.tsx` (Navigasi tab switcher 6 dokumen, status snapshot frozen vs draf, aksi pembekuan snapshot, pemicu `window.print()`).
- **Next.js Page:** `src/app/cbt/administrasi/[asesmenId]/page.tsx` (Server-side loader & error boundary compliant).

### 2.7. Unit & Integration Test Suite
- **File:** `src/test/assessment/assessment-administration-cbt03.test.ts`
- 8 skenario pengujian komprehensif mencakup hash deterministik, segel fisik, pembekuan snapshot, proteksi akses guru tidak berwenang, dan integritas payload cetak.

---

## 3. Quality Gate Results

| Check | Tool / Runner | Result | Bukti / Metrik |
| --- | --- | :---: | --- |
| **Typecheck** | `tsc --noEmit` (TypeScript 5.8) | **PASS** | 0 errors |
| **Lint** | `eslint .` (ESLint 9) | **PASS** | 0 errors (3 warnings `<img>` non-blocking di cbt eksisting) |
| **Format** | `prettier --check .` | **PASS** | 100% clean |
| **Test Suite** | Vitest 3.2.7 | **PASS** | 137 test files passed, 872 tests passed (0 failed) |
| **Production Build** | Next.js 16.3.3 Turbopack | **PASS** | Rute `/cbt/administrasi/[asesmenId]` terkompilasi optimal |

---

## 4. Verification Check of Domain Invariants & Rules

1. **Three-Tier Snapshot Binding:**
   - Semua generator payload (`Kartu Soal`, `Naskah Soal`, `Kunci Jawaban`) mendeteksi keberadaan `snapshot_*` di item. Jika snapshot ada, isi naskah terkunci permanen pada versi saat dibekukan, mencegah *version drift*.
2. **Tenant Isolation:**
   - Seluruh query database difilter secara ketat dengan `sekolah_id`. Akses lintas tenant langsung ditolak pada tingkat query.
3. **Teacher Scope Guard:**
   - Pengajar hanya dapat membekukan snapshot atau melihat naskah rahasia/kunci jawaban jika ditugaskan sebagai pengampu penugasan mengajar kelas tersebut (`guru_id === penugasan.guru_id` atau `SUPER_ADMIN`).
4. **Reproducible Seal Verification:**
   - Hash SHA-256 dan kode segel fisik tercetak pada footer setiap dokumen untuk verifikasi silang fisik vs digital.
