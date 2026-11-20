# SPEC: Folder Bank Soal — Organisasi Hierarkis ala Google Drive

| Field          | Nilai                                                 |
| -------------- | ----------------------------------------------------- |
| **Feature**    | Folder Bank Soal (Question Bank Folders)              |
| **Status**     | `DRAFT`                                               |
| **Author**     | AI Agent                                              |
| **Created**    | 2026-10-05                                            |
| **Complexity** | Complex Route (Schema change + New UI + Server Actions) |

---

## 1. Latar Belakang & Masalah

Saat ini Bank Soal di Ruang Pintar hanya dikelompokkan secara otomatis per **Mata Pelajaran**. Guru tidak memiliki kendali organisasi manual — tidak bisa membuat kategori, folder, atau pengelompokan kustom berdasarkan:
- Jenis ujian (UTS, UAS, Kuis, Remidial)
- Kelas/tingkat (Kelas VII, VIII, IX)
- Bab/materi tertentu
- Tahun ajaran

Akibatnya, saat jumlah soal bertambah, guru kesulitan menemukan dan mengelola koleksi soal mereka.

## 2. Tujuan

Memberikan guru kemampuan mengorganisir soal dalam **folder hierarkis** (nested) — mirip Google Drive:
- Buat folder dan sub-folder sesuai kebutuhan
- Pindahkan soal antar folder (drag & drop atau manual)
- Navigasi dengan breadcrumb
- Filter dan pencarian dalam konteks folder

## 3. Domain Model

### 3.1. Entitas Baru: `FolderBankSoal`

```prisma
model FolderBankSoal {
  id             String    @id              // ULID 26 karakter
  sekolah_id     String
  guru_id        String
  parent_id      String?                    // NULL = folder root level
  nama           String                     // "UTS Semester 1 Kelas IX"
  deskripsi      String?
  warna          String?   @default("#3B82F6")
  urutan         Int       @default(0)      // Urutan tampil dalam parent
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  sekolah        Sekolah          @relation(fields: [sekolah_id], references: [id], onDelete: Restrict)
  guru           Guru             @relation(fields: [guru_id], references: [id], onDelete: Restrict)
  parent         FolderBankSoal?  @relation("SubFolders", fields: [parent_id], references: [id], onDelete: Cascade)
  sub_folders    FolderBankSoal[] @relation("SubFolders")
  bank_soal      BankSoal[]

  @@unique([sekolah_id, guru_id, parent_id, nama])
  @@index([sekolah_id, guru_id])
  @@index([parent_id])
  @@map("folder_bank_soal")
}
```

### 3.2. Perubahan pada `BankSoal`

Tambahkan field opsional:
```prisma
model BankSoal {
  // ... existing fields tetap ...
  folder_id      String?
  folder         FolderBankSoal? @relation(fields: [folder_id], references: [id], onDelete: SetNull)
  @@index([folder_id])
}
```

**Catatan:** `folder_id` nullable — soal tanpa folder tetap valid dan ditampilkan di "root" / "Tanpa Folder".

### 3.3. Domain Invariants
```
- Folder milik 1 guru di 1 sekolah (tenant-isolated)
- Nama folder unik per parent + guru + sekolah
- Kedalaman folder dibatasi maksimal 3 level (root → L1 → L2 → L3)
- Hapus folder cascade ke sub-folder, tapi soal di dalamnya di-SetNull (tetap ada, pindah ke root)
- Soal tanpa folder_id = berada di root (selalu ditampilkan)
```

## 4. Acceptance Criteria

### AC-1: CRUD Folder
- [ ] Guru dapat membuat folder baru (dengan nama, deskripsi opsional, warna opsional)
- [ ] Guru dapat membuat sub-folder di dalam folder (maks 3 level)
- [ ] Guru dapat rename folder
- [ ] Guru dapat menghapus folder (soal di dalamnya pindah ke root, bukan ikut terhapus)
- [ ] Validasi nama folder unik per parent

### AC-2: Organisasi Soal
- [ ] Guru dapat memindahkan soal ke dalam folder tertentu
- [ ] Guru dapat memindahkan soal keluar folder (ke root)
- [ ] Saat membuat soal baru, guru dapat memilih folder tujuan (opsional)
- [ ] Bulk move: pilih beberapa soal sekaligus dan pindahkan ke folder

### AC-3: Navigasi & UI
- [ ] Sidebar/panel folder tree yang collapsible ditampilkan di halaman Bank Soal
- [ ] Breadcrumb navigasi: `Bank Soal > Matematika IX > UTS Semester 1`
- [ ] Badge counter jumlah soal per folder (termasuk sub-folder)
- [ ] Filter khusus: "Tanpa Folder" untuk soal yang belum dikategorikan
- [ ] Indikator warna folder (color tag)

### AC-4: Keamanan & Isolasi
- [ ] Folder ter-isolasi per guru per sekolah (tenant-scoped)
- [ ] SUPER_ADMIN dapat melihat semua folder semua guru
- [ ] Server-side authorization pada setiap mutasi folder

## 5. Out of Scope (v1)
- Sharing folder antar guru
- Drag & drop reordering (cukup urutan manual)
- Template folder otomatis per kurikulum
- Folder untuk ujian (UjianCbt) — hanya untuk soal (BankSoal)

## 6. Risiko & Mitigasi
| Risiko | Mitigasi |
|---|---|
| Migrasi database pada tabel existing | `folder_id` nullable, tidak merusak data lama |
| Performa query nested folder | Batasi kedalaman maks 3 level, index pada `parent_id` |
| Soal orphan saat folder dihapus | `onDelete: SetNull` — soal pindah ke root |
