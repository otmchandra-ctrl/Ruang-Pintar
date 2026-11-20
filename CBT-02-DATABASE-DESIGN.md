# CBT-02 DATABASE DESIGN & SCHEMA EVOLUTION
## Ruang Pintar — School Digital Operating Platform
### STAGE CBT-02: Desain Skema Database, Relasi, Indeks & Rencana Migrasi Aman (MVP Only)

| Metadata | Nilai Canonical |
| --- | --- |
| **Produk / Sub-sistem** | Ruang Pintar — Database Architecture for Assessment Engine MVP |
| **Kode Tahap** | `STAGE CBT-02` |
| **Status Dokumen** | `READY FOR HUMAN REVIEW (PLANNING ONLY — BELUM BOLEH EKSEKUSI MIGRASI)` |
| **Database Engine** | SQLite 3.x + Prisma ORM |
| **Identifier Standard** | ULID 26 Karakter |
| **Prinsip Skema** | *Forward Compatible*, *Zero Data Loss*, *Strict Foreign Keys*, *Tenant Scoped Indexes* |

---

# 1. Audit Skema Database Eksisting (Baseline Fact-Check)

Audit terhadap `prisma/schema.prisma` saat ini (total 1927 baris, 23 migrasi terverifikasi) menghasilkan fakta berikut:

```text
┌──────────────────────────────┬──────────────────────────────┬───────────────────────────────┐
│ MODEL EKSISTING              │ STATUS & RELASI SAAT INI     │ EVALUASI KEBUTUHAN STAGE CBT-02│
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ 1. Fase & TingkatKelas       │ Aktif di M06 (Fase E, F, dll)│ Siap dihubungkan ke CP        │
│ 2. MataPelajaran             │ Aktif di M08                 │ Siap dihubungkan ke CP        │
│ 3. LingkupMateri (BAB)       │ Aktif di M11                 │ Memiliki relasi ke TP & Soal  │
│ 4. TujuanPembelajaran (TP)   │ Aktif di M11 (child Lingkup) │ Belum memiliki model KKTP     │
│ 5. CapaianPembelajaran (CP)  │ BELUM ADA di schema.prisma   │ WAJIB DITAMBAHKAN             │
│ 6. DefinisiAsesmen           │ Aktif di M13                 │ Belum ada model Kisi-Kisi     │
│ 7. BankSoal                  │ Aktif di M14                 │ Belum ada scope_kepemilikan   │
│                              │                              │ dan level_kognitif            │
│ 8. VersiSoal                 │ Aktif di M14 (Immutable Vers)│ Siap pakai (tanpa perubahan)  │
│ 9. FolderBankSoal            │ Aktif di M14 (Hierarkis)     │ Siap pakai (tanpa perubahan)  │
│ 10. UjianCbt & SnapshotUjian │ Aktif di M14                 │ Blueprint saat ini teks JSON  │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

# 2. Desain Penambahan & Evolusi Model Skema Prisma

Seluruh penambahan bersifat **non-destructive & backward-compatible** (tidak menghapus kolom atau merusak data yang sudah tersimpan):

### 2.1. Model Baru: `CapaianPembelajaran` (CP)
Mendukung Kurikulum Merdeka di tingkat Fase dan Mata Pelajaran:

```prisma
/// M06/M11 — Kurikulum Merdeka: Capaian Pembelajaran (CP) per Fase & Mata Pelajaran
model CapaianPembelajaran {
  id                String   @id // ULID 26 char
  sekolah_id        String
  mata_pelajaran_id String
  fase_id           String
  kode              String   // e.g. "CP-INF-FASE-E"
  elemen            String?  // e.g. "Berpikir Komputasional", "Algoritma & Pemrograman"
  deskripsi         String   // Teks narasi capaian kompetensi fase resmi
  urutan            Int      @default(1)
  status            String   @default("AKTIF") // AKTIF | NONAKTIF | ARSIP
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  sekolah             Sekolah               @relation(fields: [sekolah_id], references: [id], onDelete: Restrict)
  mata_pelajaran      MataPelajaran         @relation(fields: [mata_pelajaran_id], references: [id], onDelete: Restrict)
  fase                Fase                  @relation(fields: [fase_id], references: [id], onDelete: Restrict)
  tujuan_pembelajaran TujuanPembelajaran[]
  bank_soal           BankSoal[]

  @@unique([sekolah_id, mata_pelajaran_id, fase_id, kode])
  @@index([sekolah_id, mata_pelajaran_id, status])
  @@map("capaian_pembelajaran")
}
```

### 2.2. Model Baru: `KriteriaKetercapaianTp` (KKTP)
Mendefinisikan kriteria ketercapaian operasional per Tujuan Pembelajaran (TP):

```prisma
/// M11/M13 — Kurikulum Merdeka: Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
model KriteriaKetercapaianTp {
  id                     String   @id // ULID 26 char
  sekolah_id             String
  tujuan_pembelajaran_id String   @unique
  tipe_kktp              String   @default("SKALA_INTERVAL") // SKALA_INTERVAL | RUBRIK_DESKRIPTIF | DAFTAR_KRITERIA
  ambang_tuntas          Float    @default(75.0) // Nilai minimum tuntas (e.g. 75.0)
  interval_json          String?  // JSON Array: interval skor, predikat, dan deskripsi tindak lanjut
  rubrik_json            String?  // JSON Array: kriteria rubrik kualitatif (Perlu Bimbingan, Cukup, Baik, dll)
  deskripsi              String?
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt

  sekolah             Sekolah            @relation(fields: [sekolah_id], references: [id], onDelete: Restrict)
  tujuan_pembelajaran TujuanPembelajaran @relation(fields: [tujuan_pembelajaran_id], references: [id], onDelete: Cascade)

  @@index([sekolah_id])
  @@map("kriteria_ketercapaian_tp")
}
```

### 2.3. Model Baru: `KisiKisiAsesmen` & `ItemKisiKisi` (Blueprint Matriks Resmi)
Menyediakan sumber kebenaran formal kisi-kisi ujian supervisi dan perakitan soal:

```prisma
/// M13/M14 — Assessment Blueprint: Master Matriks Kisi-Kisi Ujian Resmi
model KisiKisiAsesmen {
  id                    String   @id // ULID 26 char
  sekolah_id            String
  penugasan_mengajar_id String
  asesmen_id            String?  @unique
  judul                 String   // e.g. "Kisi-Kisi Asesmen Sumatif Tengah Semester (STS) Gasal"
  deskripsi             String?
  tahun_ajaran_id       String
  semester_id           String?
  target_total_soal     Int      @default(25)
  alokasi_waktu_menit   Int      @default(90)
  status                String   @default("DRAFT") // DRAFT | DISETUJUI | ARSIP
  disetujui_oleh_id     String?
  disetujui_pada        DateTime?
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  sekolah            Sekolah           @relation(fields: [sekolah_id], references: [id], onDelete: Restrict)
  penugasan_mengajar PenugasanMengajar @relation(fields: [penugasan_mengajar_id], references: [id], onDelete: Cascade)
  asesmen            DefinisiAsesmen?  @relation(fields: [asesmen_id], references: [id], onDelete: SetNull)
  items              ItemKisiKisi[]

  @@index([sekolah_id, penugasan_mengajar_id, status])
  @@map("kisi_kisi_asesmen")
}

/// M13/M14 — Assessment Blueprint: Butir Rincian Matriks Kisi-Kisi Soal
model ItemKisiKisi {
  id                     String   @id // ULID 26 char
  kisi_kisi_id           String
  nomor_urut             Int      // 1, 2, 3, ...
  tujuan_pembelajaran_id String?
  materi_pokok           String   // Pokok bahasan
  indikator_soal         String   // Rumusan operasional kemampuan yang diuji
  level_kognitif         String   @default("L2_APLIKASI") // L1_PENGETAHUAN | L2_APLIKASI | L3_PENALARAN_HOTS
  bentuk_soal            String   @default("PILIHAN_GANDA") // PILIHAN_GANDA | PG_KOMPLEKS | BENAR_SALAH | MENJODOHKAN | ISIAN | ESAI
  bobot_skor             Float    @default(1.0)
  bank_soal_id           String?  // Tautan opsional ke butir Bank Soal yang terpilih
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt

  kisi_kisi           KisiKisiAsesmen     @relation(fields: [kisi_kisi_id], references: [id], onDelete: Cascade)
  tujuan_pembelajaran TujuanPembelajaran? @relation(fields: [tujuan_pembelajaran_id], references: [id], onDelete: SetNull)
  bank_soal           BankSoal?           @relation(fields: [bank_soal_id], references: [id], onDelete: SetNull)

  @@unique([kisi_kisi_id, nomor_urut])
  @@index([kisi_kisi_id, level_kognitif])
  @@index([bank_soal_id])
  @@map("item_kisi_kisi")
}
```

### 2.4. Penambahan Kolom Baru pada Model `BankSoal` (M14)
Memperkaya model `BankSoal` dengan kepemilikan ganda dan level kognitif:

```prisma
// Penambahan pada model BankSoal:
model BankSoal {
  // ... kolom-kolom eksisting tetap dipertahankan ...
  scope_kepemilikan      String   @default("PERSONAL") // PERSONAL | SEKOLAH
  level_kognitif         String   @default("L2_APLIKASI") // L1_PENGETAHUAN | L2_APLIKASI | L3_PENALARAN_HOTS
  capaian_pembelajaran_id String?

  capaian_pembelajaran CapaianPembelajaran? @relation(fields: [capaian_pembelajaran_id], references: [id], onDelete: SetNull)
  item_kisi_kisi       ItemKisiKisi[]

  // Penambahan indeks pendukung:
  @@index([sekolah_id, scope_kepemilikan, status])
  @@index([sekolah_id, mata_pelajaran_id, scope_kepemilikan])
}
```

### 2.5. Penambahan Relasi pada Model `TujuanPembelajaran` (M11)
```prisma
// Penambahan relasi pada model TujuanPembelajaran:
model TujuanPembelajaran {
  // ... kolom-kolom eksisting tetap dipertahankan ...
  capaian_pembelajaran_id String?

  capaian_pembelajaran CapaianPembelajaran? @relation(fields: [capaian_pembelajaran_id], references: [id], onDelete: SetNull)
  kktp                 KriteriaKetercapaianTp?
  item_kisi_kisi       ItemKisiKisi[]
}
```

---

# 3. Analisis Foreign Keys, Cascades & Integritas Data

1. **Prinsip Tenant Boundary:** Seluruh model induk (`CapaianPembelajaran`, `KriteriaKetercapaianTp`, `KisiKisiAsesmen`) memiliki kolom `sekolah_id` dengan `onDelete: Restrict`. Hal ini menjamin data sekolah tidak dapat terhapus secara tidak sengaja.
2. **Prinsip Child Cascades:** 
   - Jika `KisiKisiAsesmen` dihapus oleh guru, seluruh `ItemKisiKisi` di dalamnya terhapus otomatis (`onDelete: Cascade`).
   - Jika `TujuanPembelajaran` dihapus, `KriteriaKetercapaianTp` terkait ikut terhapus (`onDelete: Cascade`).
3. **Prinsip Question Protection:** `ItemKisiKisi` yang merujuk ke `BankSoal` menggunakan `onDelete: SetNull`. Jika suatu butir soal dihapus, baris kisi-kisi tetap utuh dengan referensi kosong, mencegah rusaknya naskah kisi-kisi resmi.

---

# 4. Rencana Migrasi Database (Migration Strategy & Rollback)

1. **Metode Pembuatan Migrasi:**
   - Gunakan perintah canonical: `npx prisma migrate dev --name add_assessment_foundation_and_curriculum_lineage --create-only`
   - Lakukan inspeksi manual pada berkas `.sql` hasil generate untuk memverifikasi tidak ada perintah `DROP TABLE` destruktif.
2. **Backfill Default Data Aman:**
   - Seluruh data `BankSoal` lama secara otomatis mendapatkan nilai `scope_kepemilikan = 'PERSONAL'` dan `level_kognitif = 'L2_APLIKASI'` via nilai default skema.
3. **Rencana Rollback:**
   - Karena seluruh penambahan bersifat aditif (kolom baru nullable atau ber-default, tabel baru terisolasi), rollback dapat dilakukan dengan aman tanpa risiko korupsi tabel utama.

---
*Dokumen ini merupakan perencanaan teknis database resmi STAGE CBT-02 dan siap untuk ditinjau oleh Human Project Owner.*
