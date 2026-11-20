# PLAN: STAGE UX-04 — STUDENT DIRECTORY & ATTENDANCE EXPERIENCE REDESIGN

## Tahapan Eksekusi

### Task 1: Type Definitions & Domain Contracts
- Buat kontrak domain `src/modules/student/domain/student-academic-directory-types.ts`:
  - `StudentAcademicHealthStatus`
  - `StudentAcademicDirectoryItemDTO`
  - Sub-detail: tugas detail, presensi detail, nilai detail, TP matrix, CBT stats, internal notes list.

### Task 2: Service & Data Aggregation
- Implementasikan `classStudentDirectoryService` atau integrasikan di `src/modules/learning/application/learning-service.ts`:
  - `getClassStudentDirectory(penugasanId: string, sekolahId: string, guruId?: string | null)`
  - Query siswa aktif rombel (`PenempatanRombel`, `Siswa`), riwayat presensi, tugas & pengumpulan, TP & asesmen/nilai, CBT hasil, serta catatan monitoring.
  - Perhitungan deterministic `AcademicHealthStatus`.
- Implementasikan server action `createTeacherStudentNoteAction` di `src/app/actions/teacher-note-actions.ts` untuk menyimpan catatan internal guru ke `CatatanMonitoring`.

### Task 3: Part A Verification & Refinement
- Tinjau dan pastikan `src/modules/attendance/presentation/session-attendance-modal.tsx`:
  - Header: Label "Presensi Kelas", Mapel, Rombel • Tanggal, X Siswa, [X]
  - Tanpa progress circle, tanpa attendance percentage, tanpa statistik besar.
  - Quick action: `[✓ Tandai Semua Hadir]` (100% width, 48px).
  - Search: `[ Cari Nama / NISN ]` (sticky).
  - Glass segmented controls: Hadir (green glass), Sakit (amber glass), Izin (blue glass), Alpha (red glass) (min 44px/48px).
  - Catatan/Alasan hanya saat status != Hadir dengan placeholder `Tulis alasan...`.
  - Sticky footer: `X siswa selesai`, `[Tutup]`, `[Simpan Presensi]` (48px).
- Sesuaikan unit test di `src/test/attendance/session-attendance-mobile-redesign.test.tsx` dan `src/test/attendance/attendance-views.test.tsx` agar 100% lulus.

### Task 4: Part B Presentation Components
- Buat komponen `src/modules/student/presentation/student-academic-health-card.tsx`:
  - Academic Health Card dengan Glass styling, Avatar, NISN, status kesehatan, 4 metrics grid (Kehadiran, Tugas, TP, Nilai).
  - Tombol Chat & Catatan.
  - Card click handler.
- Buat komponen `src/modules/student/presentation/student-academic-side-sheet.tsx`:
  - Slide-over Right Side Sheet (Fernly inspired) 420px desktop / 380px tablet.
  - 6 tab: Overview, Presensi, Tugas, Nilai, TP, Catatan.
  - Timeline catatan + formulir input catatan internal guru baru.
- Buat komponen `src/modules/student/presentation/student-chat-conversation-modal.tsx`:
  - Percakapan Siswa (future-ready UI dengan pilihan Siswa / Wali Murid).
- Buat komponen `src/modules/student/presentation/class-student-directory-tab-view.tsx`:
  - Header: Siswa, X Siswa Aktif, `[Tambah Siswa]`.
  - Filter bar: Semua, Laki-laki, Perempuan, Perlu Perhatian, Sering Alpha.
  - Search: Cari siswa.
  - Responsive Grid (1 col mobile, 3 col tablet, 4 col desktop).
  - Integrasi Side Sheet, Chat Modal, dan Join Code Modal.

### Task 5: Integration in Workspace View & Page Route
- Perbarui `src/modules/learning/presentation/class-workspace-view.tsx`:
  - Tambahkan tab `SISWA` di `WorkspaceTab`.
  - Tambahkan tab Siswa di antara `Presensi` dan `Penilaian`.
  - Render `ClassStudentDirectoryTabView` saat `activeTab === "SISWA"`.
- Perbarui `src/app/kelas-saya/[id]/page.tsx`:
  - Load `studentDirectory` secara paralel dan pass ke `ClassWorkspaceView`.

### Task 6: Unit Tests & Verification Gates
- Tulis comprehensive test suite di `src/test/student/class-student-directory-view.test.tsx`.
- Jalankan Vitest (`npm run test`).
- Jalankan TypeScript check (`npm run typecheck`).
- Jalankan Linter (`npm run lint`).
- Jalankan Prettier check (`npm run format:check`).
