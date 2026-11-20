# SPEC: STAGE CBT-04 — CBT DELIVERY FOUNDATION
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Feature** | CBT Delivery Foundation (Stage CBT-04) |
| **Status** | `IN_PROGRESS` |
| **Target Lifecycle Gate** | `TEST` |
| **Domain** | M13 (Assessment) & M14 (CBT Delivery Engine) |
| **Dependencies** | Stage CBT-03.1 (Assessment Administration Completeness) |

---

## 1. Problem Statement & Scope

Setelah tahap administrasi asesmen (10-Document Official Bundle) selesai dan disahkan pada Stage CBT-03.1, sistem memasuki tahap paling krusial dari Computer-Based Test (CBT): **CBT Delivery Foundation**.

CBT Delivery Foundation adalah fondasi engine server-side yang mengatur bagaimana ujian dipublikasikan, dibekukan (*immutable snapshot*), dijadwalkan ke dalam sesi ruang/waktu (*ExamSession*), dilindungi dengan token masuk (*ExamToken*), divalidasi kelayakan pesertanya (*StudentEligibility*), dan dikelola status pengerjaannya (*AssessmentAttempt*).

### Scope Inclusions (Yang Wajib Diimplementasikan):
1. **Assessment Publication Engine:** 9-State Publication Lifecycle (`DRAFT` → `REVIEW` → `FINAL` → `SCHEDULED` → `PUBLISHED` → `ACTIVE` → `SUBMITTED` → `CLOSED` → `ARCHIVED`).
2. **Exam Snapshot Engine:** Immutabilitas SnapshotUjian dengan metadata ujian, konfigurasi ujian, manifest soal (tanpa kunci), opsi jawaban, aturan penilaian (rahasia di server boundary), dan cryptographic SHA-256 integrity hash.
3. **CBT Session Engine:** Entitas `ExamSession`, fungsi buka/tutup sesi, validasi jadwal, validasi peserta, validasi status ujian.
4. **Exam Token Engine (MVP Only):** Token alphanumeric 6-karakter sederhana (`ABC123`), fungsi generate, regenerate, expire, dan validate. (Tanpa rolling token).
5. **Student Eligibility Engine:** Validasi multi-faktor server-side (siswa aktif, terdaftar rombel, terdaftar asesmen, tenant benar, jadwal aktif, kuota attempt).
6. **Attempt Foundation:** Entitas `AssessmentAttempt`, 5 status attempt (`NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `ABANDONED`), aturan one active attempt, dan server-authoritative timer deadline.
7. **Authorization Hardening:** Pemisahan tegas batas wewenang Guru, Siswa, Operator, dan Kepala Sekolah dengan Tenant Isolation ketat.

### Explicit Non-Goals (DO NOT IMPLEMENT):
- Question Navigation UI
- Answering UI
- Autosave
- Offline Mode
- Proctoring
- AI Assistant
- Monitoring
- Anti Cheating
- Psychometric Engine

---

## 2. Invariants & Domain Rules

1. **Question ≠ Question Version ≠ Exam Blueprint ≠ Exam ≠ Exam Snapshot ≠ Attempt ≠ Answer ≠ Result:**
   Setiap mutasi pada Bank Soal atau Blueprint setelah publikasi TIDAK BOLEH memengaruhi SnapshotUjian yang sudah dibekukan.
2. **Snapshot Immutability Guarantee:**
   Snapshot ujian yang telah dipublikasikan bersifat permanen (immutable) dan tidak dapat dimodifikasi atau dihapus oleh siapapun.
3. **Answer Key Secrecy:**
   Kunci penilaian dan kunci jawaban TIDAK PERNAH dikirim ke manifest siswa. Kunci hanya tersimpan di server boundary.
4. **Server-Authoritative Timer:**
   Batas waktu pengerjaan dihitung oleh server (`batas_waktu_server = waktu_mulai + durasi_menit`). Klien tidak dapat memperpanjang waktu secara sepihak.
5. **Single Active Attempt:**
   Satu siswa hanya boleh memiliki maksimal satu attempt berstatus `IN_PROGRESS` per ujian.
6. **Strict Multi-Tenant Isolation:**
   Seluruh query, mutasi, snapshot, sesi, dan attempt wajib mematuhi konteks `sekolah_id`. Data tidak boleh bocor lintas sekolah.

---

## 3. State Machines & Lifecycle

### 3.1. Publication Lifecycle (9-State Transition)
```text
DRAFT
  │
  ▼ (Submit for Review)
REVIEW
  │
  ▼ (Approved by Headmaster / Waka)
FINAL
  │
  ▼ (Schedule Exam Date & Slot)
SCHEDULED
  │
  ▼ (Freeze Snapshot & Publish)
PUBLISHED
  │
  ▼ (Open Session & Exam Window Starts)
ACTIVE
  │
  ▼ (All Students Submitted / Time Elapsed)
SUBMITTED
  │
  ▼ (Session Officially Closed by Proctor/Teacher)
CLOSED
  │
  ▼ (Archived for School Accreditation Portfolio)
ARCHIVED
```

### 3.2. Attempt Lifecycle (5-State Transition)
```text
NOT_STARTED
  │
  ▼ (Student starts attempt with valid token)
IN_PROGRESS
  ├──────────────────────────────────┐
  │ (Normal manual submission)       │ (Server timer expires)
  ▼                                  ▼
SUBMITTED                      AUTO_SUBMITTED
  │
  ▼ (If abandoned or cancelled by proctor)
ABANDONED
```

---

## 4. Acceptance Criteria

1. **Publication Lifecycle:**
   - Transisi status hanya dapat berjalan sesuai matriks yang diizinkan.
   - Transisi ilegal melempar `CbtValidationError`.
   - Transisi ke `PUBLISHED` mewajibkan pembuatan snapshot immutable dengan hash SHA-256.
2. **Snapshot Engine:**
   - Menghasilkan SHA-256 hash unik berdasarkan konten snapshot.
   - Memvalidasi integritas snapshot (`verifySnapshotIntegrity`).
   - Mencegah perubahan jika snapshot sudah berstatus publikasi.
3. **Session Engine:**
   - Dapat membuka dan menutup sesi pelaksanaan ujian.
   - Memvalidasi window jadwal waktu ujian.
   - Memvalidasi peserta rombel penugasan.
4. **Token Engine:**
   - Token 6 karakter alphanumeric kapital (misal `ABC123`).
   - Token valid selama window aktif dan belum kedaluwarsa.
   - Token dapat di-regenerate atau di-expire oleh guru/operator.
5. **Student Eligibility Engine:**
   - Menolak siswa non-aktif, siswa di luar rombel, siswa dari tenant lain, jadwal di luar sesi, atau siswa yang telah melampaui kuota attempt.
   - Memberikan laporan eligibilitas rinci.
6. **Attempt Foundation:**
   - Mencegah multiple active attempts untuk siswa yang sama pada ujian yang sama.
   - Mengatur server-authoritative timer deadline secara akurat.
7. **Authorization Hardening:**
   - Guru hanya dapat mengelola kelas miliknya.
   - Siswa hanya dapat mengakses attempt miliknya dan tidak dapat melihat kunci penilaian.
   - Operator hanya dapat memantau dan mengelola sesi dalam tenant sekolahnya.
   - Kepala sekolah memiliki akses supervisi sekolah luas.
