# CBT-02.2: QUESTION BANK FOLDER HIERARCHY ARCHITECTURE
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| :--- | :--- |
| **Dokumen** | CBT-02.2-FOLDER-ARCHITECTURE.md |
| **Tahap** | STAGE CBT-02.2 — Foundation Hardening & Snapshot Design |
| **Status** | `PROPOSED ARCHITECTURE` |
| **Tanggal** | 2026-10-07 |
| **Modul Terkait** | M12 (CBT / Bank Soal), M11 (Learning / Kurikulum) |

---

## 1. Latar Belakang & Analisis Kebutuhan

Pada STAGE CBT-02.1, kolom `folder_id` telah diperkenalkan pada entitas `BankSoal` (`prisma/schema.prisma`). Langkah ini merupakan persiapan strategis agar model data dasar siap menampung organisasi hierarki soal tanpa memerlukan *destructive rewrite*.

### Kebutuhan Nyata Guru Sekolah Indonesia:
Guru mata pelajaran rata-rata mengampu 3-5 rombel di 1-2 tingkat kelas dan mengumpulkan ratusan hingga ribuan butir soal. Pengelompokan flat berdasarkan mata pelajaran saja terbukti menimbulkan disorganisasi:
- Guru sulit memisahkan arsip soal ulangan harian, remedial, PTS, PAS, dan tryout ujian sekolah.
- Guru sulit mengelompokkan soal berdasarkan urutan modul ajar (Bab $\rightarrow$ Sub-Bab $\rightarrow$ Topik).
- Sekolah membutuhkan struktur folder terstandarisasi untuk Bank Soal Bersama (*School Shared Bank*).

---

## 2. Struktur Hierarki 4 Level (Folder -> Sub-Folder -> Topic -> Chapter)

Ruang Pintar mengadopsi model **Hierarki Berkedalaman Terbatas (Maximum Depth = 4 Level)**:

```text
Level 0 (Root)   : Tanpa Folder (Unassigned / Beranda Bank Soal)
       │
Level 1 (Folder) : Kategori Utama / Tahun Ajaran / Tingkat
                   Contoh: [ "Kelas X - Informatika (2026/2027)" ]
       │
Level 2 (Sub-F)  : Evaluasi / Periode Akademik / Bab
                   Contoh: [ "Semester Ganjil" ] atau [ "Bab 1: Algoritma" ]
       │
Level 3 (Topic)  : Lingkup Materi Pokok / Jenis Asesmen
                   Contoh: [ "Topik 1.1: Percabangan Logika" ] atau [ "Bank Soal Sumatif 1" ]
       │
Level 4 (Chapter): Sub-Topik Spesifik / Kasus Ujian (Leaf Node)
                   Contoh: [ "Studi Kasus Nested IF" ] atau [ "Paket A (Utama)" ]
```

### Mengapa Maksimal 4 Level?
1. **Pencegahan Kognitif Overload:** Lebih dari 4 level membuat navigasi di layar laptop dan tablet guru berjejal (*too deep breadcrumb*).
2. **Kinerja Database:** Membatasi kedalaman 4 level menjamin query recursive tree / breadcrumb dapat diselesaikan dalam < 5 milidetik pada engine SQLite.
3. **Fleksibilitas Semantic:** Guru bebas menamai level sesuai preferensi (baik gaya Bab/Sub-Bab maupun gaya PTS/PAS/Remedial).

---

## 3. Desain Model Database: `FolderBankSoal`

Untuk menjamin **tidak diperlukan migrasi ulang pada fase berikutnya**, model dirancang komprehensif:

```prisma
model FolderBankSoal {
  id                 String           @id // ULID 26 karakter
  sekolah_id         String
  guru_id            String?          // NULL jika folder milik bersama sekolah (School Bank)
  mata_pelajaran_id  String           // Terikat pada mata pelajaran
  parent_id          String?          // NULL = Folder Root (Level 1)
  
  nama               String           // Nama folder (e.g. "Bab 1: Algoritma")
  deskripsi          String?          // Keterangan opsional
  warna              String?          @default("#3B82F6") // Hex token Academic Glass
  icon               String?          @default("folder")  // Icon identifier (Lucide)
  
  kedalaman          Int              @default(1) // 1 = Level 1, 2 = Level 2, maks 4
  urutan             Int              @default(0) // Urutan tampilan dalam parent
  scope_kepemilikan  String           @default("PERSONAL") // "PERSONAL" | "SEKOLAH"
  
  created_at         DateTime         @default(now())
  updated_at         DateTime         @updatedAt

  // Relasi Domain:
  sekolah            Sekolah          @relation(fields: [sekolah_id], references: [id], onDelete: Cascade)
  guru               Guru?            @relation(fields: [guru_id], references: [id], onDelete: Cascade)
  mata_pelajaran     MataPelajaran    @relation(fields: [mata_pelajaran_id], references: [id], onDelete: Restrict)
  parent             FolderBankSoal?  @relation("SubFolders", fields: [parent_id], references: [id], onDelete: Cascade)
  sub_folders        FolderBankSoal[] @relation("SubFolders")
  bank_soal          BankSoal[]

  @@unique([sekolah_id, guru_id, mata_pelajaran_id, parent_id, nama])
  @@index([sekolah_id, guru_id])
  @@index([sekolah_id, mata_pelajaran_id, scope_kepemilikan])
  @@index([parent_id])
  @@map("folder_bank_soal")
}
```

---

## 4. Domain Invariants & Aturan Keamanan Folder

### 4.1. Tenant Isolation Mutlak
- Setiap operasi query folder wajib menerapkan filter `where: { sekolah_id: actor.sekolah_id }`.
- Dilarang keras menautkan folder ke entitas di luar tenant actor.

### 4.2. Ownership Boundary (Personal vs School Folders)
- **Folder Personal (`scope_kepemilikan = 'PERSONAL'`):**
  - Wajib memiliki `guru_id === actor.guru_id`.
  - Hanya guru pemilik yang dapat melihat, membuat, mengubah nama, memindahkan, atau menghapus folder ini.
- **Folder Sekolah (`scope_kepemilikan = 'SEKOLAH'`):**
  - `guru_id` dapat bernilai `NULL` atau ID guru pembuat awal.
  - Dapat dilihat oleh seluruh guru yang mengajar mata pelajaran yang sama di sekolah tersebut.
  - Modifikasi struktur folder sekolah dibatasi untuk Koordinator Mata Pelajaran (MGMP Sekolah) atau Waka Kurikulum.

### 4.3. Safe Deletion & Anti-Data-Loss Rule
Jika sebuah folder dihapus oleh guru:
1. Sub-folder di bawahnya ikut terhapus secara cascade (`onDelete: Cascade`).
2. **BUTIR SOAL DI DALAMNYA DILARANG IKUT TERHAPUS!**
   - Kolom `BankSoal.folder_id` diatur `onDelete: SetNull`.
   - Seluruh soal yang berada di dalam folder yang dihapus otomatis berpindah ke status **"Tanpa Folder / Root"**.
   - Zero Risk kehilangan soal akibat kesalahan klik guru.

### 4.4. Circular Dependency Guard
Sistem memvalidasi sebelum pemindahan folder (*move folder*) bahwa target parent bukan merupakan dirinya sendiri atau sub-folder keturunannya sendiri ($A \not\rightarrow B \not\rightarrow A$).

---

## 5. Navigasi & Query Engine

### 5.1. Breadcrumb Path Resolver
Untuk menampilkan navigasi: `Home > Informatika > Kelas X > Bab 1 > Topik 1.1`, sistem menggunakan CTE (Common Table Expression) rekursif atau Adjacency Traversal:
```sql
WITH RECURSIVE FolderPath AS (
  SELECT id, parent_id, nama, kedalaman, 1 AS lv
  FROM folder_bank_soal
  WHERE id = :target_folder_id AND sekolah_id = :sekolah_id
  
  UNION ALL
  
  SELECT f.id, f.parent_id, f.nama, f.kedalaman, fp.lv + 1
  FROM folder_bank_soal f
  JOIN FolderPath fp ON f.id = fp.parent_id
  WHERE f.sekolah_id = :sekolah_id
)
SELECT * FROM FolderPath ORDER BY kedalaman ASC;
```

### 5.2. Drag & Drop & Batch Reorganization API
Service API yang akan disiapkan:
- `createFolder(actor, input)`
- `renameFolder(actor, folderId, newName)`
- `moveFolder(actor, folderId, newParentId)`
- `deleteFolder(actor, folderId)` (Safe SetNull)
- `moveQuestionsToFolder(actor, questionIds[], targetFolderId)`

---

## 6. Verifikasi Kesiapan (Ready for Phase 3)

Desain model di atas telah diaudit dan dipastikan **tidak memerlukan migrasi ulang yang merusak (*breaking migration*)** ketika fitur UI Folder Explorer diimplementasikan pada fase berikutnya.
