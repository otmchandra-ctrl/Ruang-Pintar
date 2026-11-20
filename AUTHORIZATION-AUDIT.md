# AUTHORIZATION AUDIT REPORT
## Ruang Pintar — School Digital Operating Platform
### Stage CBT-04: CBT Delivery Foundation Authorization Hardening

| Metadata | Nilai |
| --- | --- |
| **Dokumen** | AUTHORIZATION-AUDIT.md |
| **Stage** | STAGE CBT-04 — CBT Delivery Foundation |
| **Status** | `VERIFIED & HARDENED` |
| **Audited Layer** | Server Actions, Application Services, Multi-Tenant Boundary |

---

## 1. Executive Summary

Audit otorisasi pada Stage CBT-04 memvalidasi penegakan prinsip **Default-Deny** dan **Strict Tenant Isolation** pada fondasi delivery engine. Seluruh mutasi publikasi, pembekuan snapshot, pembukaan sesi, pembuatan token, evaluasi kelayakan siswa, dan pengerjaan attempt diaudit terhadap 4 peran utama pengguna:
1. **Guru Pengampu (`TEACHER`)**
2. **Peserta Didik (`STUDENT`)**
3. **Operator Sekolah (`SCHOOL_STAFF`)**
4. **Kepala Satuan Pendidikan (`HEADMASTER`)**

---

## 2. Role-Based Access Control (RBAC) Matrix

| Operasi CBT Delivery | GURU PENGAMPU | GURU LAIN | SISWA | OPERATOR | KEPALA SEKOLAH |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Ajukan Review Asesmen** (`DRAFT` → `REVIEW`) | **IZIN** | DENY | DENY | DENY | **IZIN** |
| **Sahkan Ujian** (`REVIEW` → `FINAL`) | DENY | DENY | DENY | DENY | **IZIN** |
| **Jadwalkan Ujian** (`FINAL` → `SCHEDULED`) | **IZIN** | DENY | DENY | **IZIN** | **IZIN** |
| **Terbitkan & Freeze Snapshot** (`PUBLISHED`) | **IZIN** | DENY | DENY | **IZIN** | **IZIN** |
| **Buat / Buka / Tutup Sesi** (`ExamSession`) | **IZIN** | DENY | DENY | **IZIN** | **IZIN** |
| **Generate / Expire Token Masuk** | **IZIN** | DENY | DENY | **IZIN** | **IZIN** |
| **Lihat Kunci Penilaian (Secret Key)** | **IZIN** | DENY | **DENY** | DENY | **IZIN** |
| **Lihat Manifest Soal Siswa (Tanpa Kunci)** | **IZIN** | DENY | **IZIN** | **IZIN** | **IZIN** |
| **Cek Kelayakan Sendiri** (`Eligibility`) | N/A | N/A | **IZIN** | N/A | N/A |
| **Mulai Pengerjaan** (`startAttempt`) | DENY | DENY | **IZIN (Akun Sendiri)** | DENY | DENY |
| **Kumpulkan Pengerjaan** (`submitAttempt`) | DENY | DENY | **IZIN (Akun Sendiri)** | DENY | DENY |
| **Batalkan Attempt** (`abandonAttempt`) | **IZIN** | DENY | DENY | **IZIN** | **IZIN** |

---

## 3. Server-Side Security Proofs & Threat Mitigation

### 3.1. Threat: Client-Side Answer Key Extraction
- **Vulnerability:** Jika kunci jawaban disematkan ke dalam JSON manifest yang dikirim ke browser siswa, siswa dapat membukanya via Inspect Element / DevTools.
- **Mitigation:** `ExamSnapshotEngine.getStudentManifest()` memisahkan `manifest_soal` dari `kunci_penilaian`. Opsi jawaban dibersihkan dari penanda benar/salah. Kunci jawaban tidak pernah dikirim ke browser siswa.

### 3.2. Threat: Client-Side Timer Manipulation
- **Vulnerability:** Siswa memanipulasi jam lokal sistem operasi laptop/ponsel untuk memperpanjang waktu ujian.
- **Mitigation:** `batas_waktu_server = waktu_mulai + durasi_menit` dihitung dan ditegakkan di database server. Fungsi `startAttempt` dan `submitAttempt` hanya mempercayai waktu server saat ini ($T_{server}$). Jika $T_{server} \ge batas\_waktu\_server$, sistem otomatis mengeksekusi `autoSubmitAttempt`.

### 3.3. Threat: Concurrent / Multiple Active Attempts
- **Vulnerability:** Siswa membuka dua jendela browser untuk mencoba mengerjakan dua attempt bersamaan.
- **Mitigation:** Aturan **One Active Attempt** pada `AssessmentAttemptEngine.initAttempt()` memeriksa apakah terdapat attempt dengan status `IN_PROGRESS`. Jika ada, sistem menolak dan melempar `CbtOneActiveAttemptViolationError`.

### 3.4. Threat: Cross-Student Account Impersonation
- **Vulnerability:** Siswa A memulai ujian atas nama Siswa B dengan mengirimkan `siswaId` siswa lain di payload request.
- **Mitigation:** Server Action `initStudentAttemptAction` mengabaikan input client dan secara mutlak mengikat ID peserta ke identitas sesi login server `actor.profileId`.

### 3.5. Threat: Cross-Tenant Data Leakage
- **Vulnerability:** Guru atau siswa dari Sekolah X mengakses sesi atau attempt di Sekolah Y.
- **Mitigation:** Seluruh query database difilter dengan klausa wajib `sekolah_id = actor.sekolahId`. Siswa yang memiliki NIS di sekolah lain langsung ditolak oleh `StudentEligibilityEngine`.

---

## 4. Audit Conclusion

Sistem pengiriman ujian CBT Ruang Pintar dinyatakan **LULUS AUDIT KEAMANAN & OTORISASI TAHAP CBT-04**. Tidak ditemukan celah kebocoran data (*zero data leak*), batas peran terisolasi, dan integritas akademik terproteksi.
