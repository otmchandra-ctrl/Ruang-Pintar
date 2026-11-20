# PLAN: STAGE CBT-04 — CBT DELIVERY FOUNDATION
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Plan** | CBT Delivery Foundation Implementation Plan |
| **Stage** | STAGE CBT-04 |
| **Status** | `IN_PROGRESS` |
| **Lifecycle Gate** | `PLAN → ARCHITECTURE → BUILD → TEST` |

---

## 1. Work Breakdown Structure (WBS)

### Phase 1: Database Schema & Migration (Prisma Layer)
- [x] 1.1 Review model yang ada di `prisma/schema.prisma`.
- [ ] 1.2 Tambahkan field `metadata_ujian` dan `hash_integritas` ke `SnapshotUjian`.
- [ ] 1.3 Tambahkan model `ExamSession` (`exam_session`) untuk sesi pelaksanaan ujian ruang/waktu.
- [ ] 1.4 Tambahkan model `AssessmentAttempt` (`assessment_attempt`) untuk melacak daur hidup pengerjaan siswa (`NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`, `ABANDONED`).
- [ ] 1.5 Hubungkan relasi pada model `Sekolah`, `UjianCbt`, `Siswa`, dan `PenempatanRombel`.
- [ ] 1.6 Buat migrasi Prisma `20261008070000_add_cbt_delivery_foundation_cbt_04` dan generate Prisma Client.

### Phase 2: Domain Types & Validation Contracts
- [ ] 2.1 Perbarui `src/modules/cbt/domain/cbt-types.ts` dengan tipe lifecycle publikasi 9-state, status attempt 5-state, DTO `ExamSession`, DTO `AssessmentAttempt`, dan DTO token.
- [ ] 2.2 Tambahkan skema validasi Zod di `src/modules/cbt/domain/cbt-validation.ts` untuk open/close session, generate/validate token, status transitions, dan attempt initialization.
- [ ] 2.3 Tambahkan domain error baru di `src/modules/cbt/domain/cbt-errors.ts` jika diperlukan.

### Phase 3: Core Delivery Engines (Application & Domain Services)
- [ ] 3.1 **Assessment Publication Engine:** Implementasikan transisi status 9-state dengan state machine guard terisolasi.
- [ ] 3.2 **Exam Snapshot Engine:** Perbarui `freezeSnapshot` dengan komputasi SHA-256 integrity hash, metadata lengkap, manifest soal & opsi tanpa kunci, serta verifikasi integritas.
- [ ] 3.3 **CBT Session Engine:** Implementasikan pembuatan, pembukaan, penutupan sesi ujian, validasi jadwal, dan relasi rombel.
- [ ] 3.4 **Exam Token Engine (MVP Only):** Implementasikan generate, regenerate, expire, dan validate token format `ABC123` (6 uppercase alphanumeric).
- [ ] 3.5 **Student Eligibility Engine:** Implementasikan validasi multi-faktor server-side (aktif, rombel, asesmen, tenant, jadwal, kuota attempt).
- [ ] 3.6 **Attempt Foundation Engine:** Implementasikan siklus hidup attempt (`NOT_STARTED` → `IN_PROGRESS` → `SUBMITTED`/`AUTO_SUBMITTED`/`ABANDONED`) dengan server-authoritative timer deadline dan one active attempt rule.
- [ ] 3.7 **Authorization Hardening:** Terapkan pemisahan wewenang Guru, Siswa, Operator, dan Kepala Sekolah dengan Tenant Isolation ketat.

### Phase 4: Server Actions & Public Seams
- [ ] 4.1 Buat Server Actions terpadu di `src/app/actions/cbt-delivery-actions.ts` untuk ekspos API server-side yang aman.
- [ ] 4.2 Pastikan seluruh tindakan memvalidasi sesi aktif pengguna dan tenancy `sekolah_aktif_id`.

### Phase 5: Verification & Quality Gate
- [ ] 5.1 Tulis unit & integration test komprehensif di `src/test/cbt/cbt-delivery-foundation-cbt04.test.ts`.
- [ ] 5.2 Jalankan seluruh quality gate: `typecheck`, `lint`, `format:check`, `test`, `build`.

### Phase 6: Deliverables & Documentation
- [ ] 6.1 `CBT-04-IMPLEMENTATION-REPORT.md`
- [ ] 6.2 `CBT-PUBLICATION-LIFECYCLE.md`
- [ ] 6.3 `SNAPSHOT-ENGINE-DESIGN.md`
- [ ] 6.4 `SESSION-ENGINE-DESIGN.md`
- [ ] 6.5 `TOKEN-ENGINE-DESIGN.md`
- [ ] 6.6 `AUTHORIZATION-AUDIT.md`
- [ ] 6.7 `TEST-REPORT.md`
