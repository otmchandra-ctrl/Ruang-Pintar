# CBT-04 IMPLEMENTATION REPORT
## Ruang Pintar — School Digital Operating Platform
### Stage: CBT-04 — CBT Delivery Foundation

| Metadata | Nilai |
| --- | --- |
| **Stage** | STAGE CBT-04 — CBT DELIVERY FOUNDATION |
| **Status** | `READY FOR HUMAN REVIEW` |
| **Prisma Engine** | SQLite + Prisma ORM v6.12.0 |
| **Next.js Engine** | Next.js 16.3.3 (Turbopack) |
| **Quality Gates** | Typecheck (0 error), ESLint (0 error), Prettier (100% clean), Vitest (907/907 PASS), Build (PASS) |
| **Date** | 2026-10-08 |

---

## 1. Executive Summary

Setelah penyelesaian administrasi asesmen (10-Document Official School Bundle) pada Stage CBT-03.1, platform Ruang Pintar berhasil menyelesaikan **STAGE CBT-04: CBT DELIVERY FOUNDATION**.

Tahap ini secara fundamental membangun fondasi server-side pengiriman ujian (Delivery Engine) yang menjamin:
1. **Assessment Publication Lifecycle:** Siklus hidup 9-state yang teratur (`DRAFT` → `REVIEW` → `FINAL` → `SCHEDULED` → `PUBLISHED` → `ACTIVE` → `SUBMITTED` → `CLOSED` → `ARCHIVED`).
2. **Exam Snapshot Engine:** Immutabilitas mutlak pada `SnapshotUjian` dengan segel kriptografis SHA-256 yang merangkum metadata, konfigurasi, manifest soal (tanpa kunci jawaban), dan aturan penilaian rahasia.
3. **CBT Session Engine:** Orkestrasi ruang dan waktu ujian berbasis entitas baru `ExamSession` (`exam_session`) dengan pembukaan/penutupan sesi dan validasi kesiapan ujian.
4. **Exam Token Engine (MVP Only):** Sistem token 6-karakter alphanumeric (`ABC123`) tanpa rolling token yang aman, deterministik, dan mudah digunakan di laboratorium atau ponsel siswa.
5. **Student Eligibility Engine:** Validasi multi-faktor server-side (siswa aktif, rombel aktif, asesmen terdaftar, multi-tenant benar, sesi aktif, dan batas kuota attempt).
6. **Attempt Foundation Engine:** Entitas baru `AssessmentAttempt` (`assessment_attempt`) dengan 5-state lifecycle (`NOT_STARTED` → `IN_PROGRESS` → `SUBMITTED` / `AUTO_SUBMITTED` / `ABANDONED`), penegakan aturan *One Active Attempt*, dan perhitungan *Server-Authoritative Timer*.
7. **Authorization Hardening:** Penegakan batas wewenang tegas antara Guru, Siswa, Operator, dan Kepala Sekolah dengan proteksi isolasi tenant multi-sekolah tanpa kebocoran data.

Batasan implementasi dipatuhi secara ketat: **TIDAK mengimplementasikan Question Navigation UI, Answering UI, Autosave, Offline Mode, Proctoring, AI Assistant, Monitoring, Anti-Cheating, atau Psychometric Engine**.

---

## 2. Deliverables & Implementation Inventory

### 2.1. Prisma Database Schema & Migrations
- **File:** `prisma/schema.prisma`
- **Model Baru:**
  1. `ExamSession` (`exam_session`): Model sesi pelaksanaan ujian dengan kode sesi, rentang waktu, status (`TERJADWAL`, `DIBUKA`, `DITUTUP`, `SELESAI`), dan token.
  2. `AssessmentAttempt` (`assessment_attempt`): Model fondasi daur hidup pengerjaan siswa dengan status (`NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `ABANDONED`) dan deadline timer server.
- **Kolom Baru pada `SnapshotUjian`:**
  - `metadata_ujian`: JSON string metadata lengkap (judul, deskripsi, mapel, guru, rombel).
  - `hash_integritas`: SHA-256 hash integritas konten snapshot.
- **File Migrasi:** `prisma/migrations/20261008070000_add_cbt_delivery_foundation_cbt_04/migration.sql`

### 2.2. Domain Layer
- **File:** `src/modules/cbt/domain/cbt-types.ts`
  - Tipe `AssessmentPublicationStatus` (9-State).
  - Tipe `AssessmentAttemptStatus` (5-State).
  - Tipe `ExamSessionStatus` (`TERJADWAL`, `DIBUKA`, `DITUTUP`, `SELESAI`).
  - DTOs: `ExamSessionDTO`, `AssessmentAttemptDTO`, `ExamSnapshotDetailDTO`, `StudentEligibilityResultDTO`, `ExamTokenDTO`, `PublicationTransitionResultDTO`.
- **File:** `src/modules/cbt/domain/cbt-validation.ts`
  - Zod Schemas: `TransitionPublicationStatusSchema`, `CreateExamSessionSchema`, `UpdateExamSessionStatusSchema`, `GenerateExamTokenSchema`, `ValidateExamTokenSchema`, `CheckStudentEligibilitySchema`, `CreateAssessmentAttemptSchema`, `UpdateAttemptStatusSchema`.
- **File:** `src/modules/cbt/domain/cbt-errors.ts`
  - Domain Errors: `CbtSnapshotImmutableError`, `CbtInvalidTransitionError`, `CbtInvalidTokenError`, `CbtStudentNotEligibleError`, `CbtSessionClosedError`.

### 2.3. Core Delivery Engines (Application Layer)
- **File:** `src/modules/cbt/application/assessment-publication-engine.ts`
  - Mengelola transisi status 9-state dengan precondition validation dan role checking.
- **File:** `src/modules/cbt/application/exam-snapshot-engine.ts`
  - Membekukan snapshot immutable dengan SHA-256 cryptographic hash dan verifikasi integritas.
- **File:** `src/modules/cbt/application/cbt-session-engine.ts`
  - Mengatur pembuatan, pembukaan, penutupan sesi, serta validasi jadwal dan peserta.
- **File:** `src/modules/cbt/application/exam-token-engine.ts`
  - Menghasilkan token 6-karakter `ABC123`, me-regenerate, meng-expire, dan memvalidasi token.
- **File:** `src/modules/cbt/application/student-eligibility-engine.ts`
  - Evaluasi kelayakan multi-faktor siswa.
- **File:** `src/modules/cbt/application/assessment-attempt-engine.ts`
  - Mengatur alur attempt, pencegahan multiple active attempts, dan server-authoritative timer deadline.
- **File:** `src/modules/cbt/application/cbt-delivery-facade.ts`
  - Fasad terpadu pengiriman ujian.

### 2.4. Server Actions Layer
- **File:** `src/app/actions/cbt-delivery-actions.ts`
  - 13 Server Actions terlindungi:
    1. `transitionPublicationStatusAction`
    2. `verifySnapshotIntegrityAction`
    3. `createExamSessionAction`
    4. `openExamSessionAction`
    5. `closeExamSessionAction`
    6. `getExamSessionsAction`
    7. `generateExamTokenAction`
    8. `expireExamTokenAction`
    9. `validateExamTokenAction`
    10. `checkStudentEligibilityAction`
    11. `initStudentAttemptAction`
    12. `startStudentAttemptAction`
    13. `submitStudentAttemptAction`

### 2.5. Test Suites
- **File:** `src/test/cbt/cbt-delivery-foundation-cbt04.test.ts` (23 tests komprehensif)
- **File:** `src/test/cbt/cbt-delivery-actions.test.ts` (7 tests Server Actions)

---

## 3. Quality Gate Compliance

| Quality Gate | Perintah | Status | Keterangan |
| --- | --- | :---: | --- |
| **Typecheck** | `npm run typecheck` | **PASS** | 0 errors (TypeScript 5.8) |
| **Lint** | `npm run lint` | **PASS** | 0 errors (ESLint 9) |
| **Format Check** | `npm run format:check` | **PASS** | 100% clean (Prettier) |
| **Unit & Integration Tests** | `npm run test` | **PASS** | 907 passed dari 907 tests (139 suites) |
| **Production Build** | `npm run build` | **PASS** | Next.js 16.3.3 Turbopack build sukses |

---

## 4. Verification Evidence & Test Summary

- 23 Unit & Integration Tests untuk 6 Delivery Engines (`src/test/cbt/cbt-delivery-foundation-cbt04.test.ts`):
  - 5 tests pada Publication Engine (lifecycle teratur, penolakan transisi ilegal, precondition check).
  - 3 tests pada Exam Snapshot Engine (deterministik SHA-256, immutable guarantee, data tampering detection).
  - 2 tests pada CBT Session Engine (jendela jadwal, open/close session).
  - 3 tests pada Exam Token Engine (format 6-karakter tanpa karakter ambigu, validasi case-insensitive, token expired).
  - 3 tests pada Student Eligibility Engine (multi-faktor lulus, penolakan rombel luar, penolakan kuota attempt habis).
  - 4 tests pada Attempt Foundation Engine (init attempt, one active attempt rule, timer authoritative, manual submit, auto submit, abandon).
  - 3 tests pada Authorization Hardening (guru luar ditolak, akun siswa lain ditolak, isolasi kunci jawaban).
- 7 Unit Tests untuk Server Actions (`src/test/cbt/cbt-delivery-actions.test.ts`).

---

## 5. Status Akhir

**STATUS: READY FOR HUMAN REVIEW**
Tahap STAGE CBT-04 telah selesai secara utuh sesuai batasan scope. Tidak ada kode CBT Player, Autosave, atau UI pengerjaan yang dibuat sebelum persetujuan manusia.
