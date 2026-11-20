# CBT PUBLICATION LIFECYCLE DESIGN
## Ruang Pintar — School Digital Operating Platform
### 9-State Assessment Publication Engine

| Metadata | Nilai |
| --- | --- |
| **Dokumen** | CBT-PUBLICATION-LIFECYCLE.md |
| **Stage** | STAGE CBT-04 — CBT Delivery Foundation |
| **Status** | `APPROVED ARCHITECTURE` |
| **Module** | M13 (Assessment) & M14 (CBT Delivery Engine) |

---

## 1. Overview & Business Rationale

Dalam konteks operasional sekolah formal di Indonesia, ujian tidak dapat langsung dibuat dan dikerjakan oleh siswa secara instan. Asesmen wajib melewati proses telaah mutu kurikulum, penjadwalan ruang/sesi, pembekuan dokumen (*immutable snapshot*), pelaksanaan, hingga penutupan dan pengarsipan untuk kebutuhan akreditasi.

Ruang Pintar mengadopsi **9-State Assessment Publication Lifecycle**:

```text
DRAFT ──► REVIEW ──► FINAL ──► SCHEDULED ──► PUBLISHED ──► ACTIVE ──► SUBMITTED ──► CLOSED ──► ARCHIVED
  ▲         │          │
  └─────────┴──────────┘
      (Revisi Guru)
```

---

## 2. State Definitions & Semantics

| State | Nama Resmi | Penanggung Jawab | Deskripsi & Semantik |
| :---: | :--- | :--- | :--- |
| **1** | `DRAFT` | Guru Pengampu | Penyusunan draf awal ujian, perakitan butir soal dari bank soal ke dalam blueprint, penentuan durasi dan bobot. |
| **2** | `REVIEW` | Waka Kurikulum / Tim Telaah | Pengajuan naskah ujian untuk ditelaah kesesuaian kisi-kisi, level kognitif (L1/L2/L3), dan kejelasan stimulus. Draf dapat dikembalikan ke `DRAFT` jika butuh perbaikan. |
| **3** | `FINAL` | Kepala Satuan Pendidikan | Persetujuan resmi pengesahan ujian. Naskah telah divalidasi dan siap dijadwalkan oleh panitia ujian. |
| **4** | `SCHEDULED` | Panitia / Operator / Guru | Penjadwalan tanggal pelaksanaan, alokasi waktu menit, dan pembuatan sesi ruangan (*ExamSession*). |
| **5** | `PUBLISHED` | Sistem / Panitia | **Titik Pembekuan:** Sistem otomatis membuat `SnapshotUjian` immutable dengan segel hash SHA-256. Naskah soal terkunci dari perubahan guru. |
| **6** | `ACTIVE` | Pengawas / Sistem | Jendela waktu ujian dimulai. Sesi dibuka (`DIBUKA`), token aktif, siswa yang memenuhi syarat dapat memulai attempt pengerjaan. |
| **7** | `SUBMITTED` | Siswa / Server Timer | Seluruh siswa telah mengumpulkan lembar jawaban atau batas waktu pengerjaan server telah tercapai (*auto-submitted*). |
| **8** | `CLOSED` | Pengawas / Guru | Sesi ujian secara resmi ditutup oleh pengawas. Lembar berita acara dan daftar hadir ditandatangani. |
| **9** | `ARCHIVED` | Arsiparis / Kurikulum | Nilai telah ditransfer ke Buku Nilai (M13). Seluruh berkas dibundel sebagai arsip portofolio akreditasi (Terminal state). |

---

## 3. State Transition Matrix & Preconditions

| From Status | To Status | Actor Roles | Preconditions & System Actions |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `REVIEW` | Guru Pengampu, Super Admin | Blueprint minimal memiliki 1 butir soal aktif dan total bobot > 0. |
| `REVIEW` | `FINAL` | Kepala Sekolah, Waka Kurikulum, Super Admin | Pemeriksaan aspek telaah kurikulum disetujui. |
| `REVIEW` | `DRAFT` | Kepala Sekolah, Kurikulum, Guru | Catatan revisi diberikan kepada guru penyusun untuk perbaikan. |
| `FINAL` | `SCHEDULED` | Panitia, Guru, Super Admin | Durasi menit > 0, waktu mulai dan selesai sesi ditentukan. |
| `FINAL` | `DRAFT` | Kepala Sekolah, Super Admin | Pembatalan pengesahan jika ditemukan kesalahan fatal kurikulum. |
| `SCHEDULED`| `PUBLISHED` | Panitia, Guru, Super Admin | **Trigger Immutable Freeze:** Menghitung SHA-256 hash dan menyimpan `SnapshotUjian`. |
| `PUBLISHED`| `ACTIVE` | Pengawas, Guru, Sistem | Waktu saat ini berada dalam rentang sesi (`waktu_mulai <= now <= waktu_selesai`). Status sesi `DIBUKA`. |
| `ACTIVE` | `SUBMITTED` | Siswa, Server Timer | Siswa submit manual atau timer server habis (`AUTO_SUBMITTED`). |
| `ACTIVE` | `CLOSED` | Pengawas, Guru, Super Admin | Penutupan paksa jika situasi darurat di lab atau sesi berakhir. |
| `SUBMITTED`| `CLOSED` | Pengawas, Guru, Super Admin | Seluruh attempt siswa berstatus final (`SUBMITTED`/`AUTO_SUBMITTED`/`ABANDONED`). |
| `CLOSED` | `ARCHIVED` | Kepala Sekolah, Super Admin | Nilai telah direkap dan ditransfer ke Gradebook (M13). |

---

## 4. Technical Safeguards & Invariants

1. **Strict Forward Enforcement:** Transisi lompat (misal `DRAFT` langsung ke `ACTIVE`) **DITOLAK KERAS** dan menghasilkan `CbtInvalidTransitionError`.
2. **Snapshot Immutability Guarantee:** Begitu status mencapai `PUBLISHED`, konten naskah, urutan soal, opsi jawaban, dan kunci penilaian **TIDAK BISA DIUBAH** oleh guru penyusun.
3. **Audit Trail Logging:** Setiap mutasi status mencatat `actor_id`, `actor_role`, waktu mutasi, dan alasan transisi.
