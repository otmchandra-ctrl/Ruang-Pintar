# SESSION ENGINE DESIGN
## Ruang Pintar — School Digital Operating Platform
### CBT Execution Session Orchestration Architecture

| Metadata | Nilai |
| --- | --- |
| **Dokumen** | SESSION-ENGINE-DESIGN.md |
| **Stage** | STAGE CBT-04 — CBT Delivery Foundation |
| **Status** | `APPROVED ARCHITECTURE` |
| **Engine** | `CbtSessionEngine` (`src/modules/cbt/application/cbt-session-engine.ts`) |

---

## 1. Overview & Concept

Dalam manajemen ujian sekolah, sebuah Ujian CBT (`UjianCbt`) tidak selalu dikerjakan serempak oleh seluruh siswa dalam satu waktu bersamaan. Sekolah sering membagi pelaksanaan ke dalam beberapa **Sesi / Gelombang / Ruang Lab**:
- Sesi 1: 07:30 – 09:30 (Rombel X RPL 1, Lab Komputer A)
- Sesi 2: 10:00 – 12:00 (Rombel X RPL 2, Lab Komputer B)

Untuk itu, Stage CBT-04 memperkenalkan entitas first-class: **`ExamSession` (`exam_session`)**.

---

## 2. Model & Relasi Database (`exam_session`)

```prisma
model ExamSession {
  id               String    @id
  sekolah_id       String
  ujian_cbt_id     String
  kode_sesi        String    // e.g. "SESI-01"
  nama_sesi        String    // e.g. "Sesi 1 - Pagi"
  waktu_mulai      DateTime
  waktu_selesai    DateTime
  token            String?   // ABC123 (6 karakter uppercase alphanumeric)
  token_aktif      Boolean   @default(true)
  token_expired_at DateTime?
  status           String    @default("TERJADWAL") // TERJADWAL | DIBUKA | DITUTUP | SELESAI
  ruang_ujian      String?   // e.g. "LAB-KOMP-1"
  pengawas_nama    String?   // Nama pengawas ruangan
  catatan          String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  sekolah          Sekolah             @relation(fields: [sekolah_id], references: [id], onDelete: Restrict)
  ujian_cbt        UjianCbt            @relation(fields: [ujian_cbt_id], references: [id], onDelete: Cascade)
  attempts         AssessmentAttempt[]

  @@unique([ujian_cbt_id, kode_sesi])
  @@index([sekolah_id, status])
  @@index([ujian_cbt_id])
  @@map("exam_session")
}
```

---

## 3. Session Lifecycle & Status Transitions

```text
TERJADWAL (Jadwal dibuat oleh panitia / guru)
    │
    ▼ (openSession: Pengawas membuka sesi saat jam ujian dimulai)
  DIBUKA  (Siswa berhak masuk menggunakan token)
    │
    ▼ (closeSession: Pengawas menutup sesi saat jam ujian selesai)
  DITUTUP (Token dinonaktifkan, siswa tidak dapat memulai attempt baru)
    │
    ▼ (Sesi diarsipkan)
  SELESAI
```

---

## 4. Key Responsibilities of `CbtSessionEngine`

1. **Pembuatan Sesi (`createSession`):**
   - Menghitung rentang waktu valid (`waktu_selesai > waktu_mulai`).
   - Otomatis menghasilkan token masuk perdana via `ExamTokenEngine` jika `generate_token: true`.
2. **Pembukaan Sesi (`openSession`):**
   - Memvalidasi kesiapan status ujian (`PUBLISHED`/`SCHEDULED`).
   - Memastikan snapshot ujian telah dibekukan.
   - Mengaktifkan status sesi ke `DIBUKA` dan mengaktifkan token.
3. **Penutupan Sesi (`closeSession`):**
   - Mengubah status ke `DITUTUP`.
   - Menonaktifkan token masuk (`token_aktif: false`).
4. **Validasi Jadwal (`validateSchedule`):**
   - Memastikan waktu sekarang ($T_{now}$) berada di antara $waktu\_mulai$ dan $waktu\_selesai$.
   - Menolak akses jika sesi belum dimulai atau sudah lewat.
5. **Validasi Peserta Rombel (`validateParticipant`):**
   - Menghubungkan rombel pada penugasan mengajar ujian dengan penempatan rombel aktif siswa.
   - Menolak siswa yang berasal dari rombel yang tidak ditugaskan.
