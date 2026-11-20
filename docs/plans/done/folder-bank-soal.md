# PLAN: Folder Bank Soal — Implementation Steps

| Field          | Nilai                                          |
| -------------- | ---------------------------------------------- |
| **Feature**    | Folder Bank Soal                               |
| **Spec**       | `docs/specs/active/folder-bank-soal.md`        |
| **Status**     | `IN PROGRESS`                                  |
| **Created**    | 2026-10-05                                     |

---

## Task Sequence

### Task 1: Schema & Migration
- [ ] Tambah model `FolderBankSoal` ke `prisma/schema.prisma`
- [ ] Tambah field `folder_id` ke model `BankSoal`
- [ ] Jalankan `npx prisma migrate dev`
- [ ] Verifikasi: `npx prisma migrate status`

### Task 2: Server Actions
- [ ] Buat `src/app/actions/folder-bank-soal-actions.ts`
  - `getFoldersAction()` — list folder tree
  - `createFolderAction()` — buat folder/sub-folder
  - `renameFolderAction()` — rename
  - `deleteFolderAction()` — hapus (soal pindah root)
  - `moveQuestionsToFolderAction()` — pindah soal ke folder
- [ ] Semua action tenant-scoped (`sekolah_id` + `guru_id`)

### Task 3: UI — Folder Sidebar + Integration
- [ ] Buat komponen `FolderTreeSidebar` di `src/modules/cbt/presentation/`
- [ ] Integrasikan ke `question-bank-modal.tsx`
- [ ] Breadcrumb navigasi
- [ ] Badge counter per folder
- [ ] Context menu (rename, hapus, buat sub-folder)
- [ ] Pilihan folder saat buat soal baru

### Task 4: Verification
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — PASS
- [ ] Manual test: CRUD folder, pindah soal, navigasi

---

## Rollback
- Revert migration jika gagal: `npx prisma migrate resolve --rolled-back <migration_name>`
- `folder_id` nullable — tidak merusak data existing
