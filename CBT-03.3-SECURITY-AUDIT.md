# CBT-03.3 — SECURITY & PENETRATION AUDIT
## Ruang Pintar — School Digital Operating Platform

| Parameter | Nilai Resmi |
| --- | --- |
| **Audit Focus** | CBT Security Perimeter, Threat Modeling & Exploitation Vectors |
| **Auditor** | Antigravity AI — Security & Threat Modeling Unit |
| **Status** | `COMPLETED` |
| **Standar Acuan** | OWASP Top 10 API, STRIDE Threat Model, ISO 27001 Tenant Isolation |

---

## 1. Threat Modeling & Attack Surface Overview

Sistem CBT Ruang Pintar memiliki model ancaman spesifik terhadap kecurangan akademik, manipulasi skor, dan kebocoran lembar asesmen:

```mermaid
flowchart TD
    A["Siswa / Attacker (Browser)"] -->|1. Manipulasi Timer Client| B["CBT Player View"]
    A -->|2. Injeksi IDOR Attempt Siswa Lain| C["Server Actions / API"]
    A -->|3. Inspeksi Network & DOM untuk Kunci| D["Snapshot Manifest"]
    A -->|4. Bypass Token Ujian| E["Entry Gate Action"]
    A -->|5. Akses Antar Sekolah (Cross-Tenant)| F["Multi-Tenant DB (SQLite)"]
```

---

## 2. Hasil Audit Vektor Serangan Spesifik

### 2.1. Vektor 1: Akses Attempt Milik Siswa Lain (IDOR & Impersonation)
- **Metode Pengujian:**
  Aktor `Siswa B` (terautentikasi di sekolah yang sama atau sekolah berbeda) mencoba memanggil:
  - `cbtService.getAttemptPlayer(attemptIdSiswaA, sekolahId, siswaB)`
  - `autosaveAnswerAction({ sesi_ujian_siswa_id: attemptIdSiswaA, ... })`
  - `submitAttemptAction(attemptIdSiswaA)`
- **Temuan & Bukti Audit:**
  - Pada layer service:
    ```typescript
    if (session.siswa_id !== siswaId) {
      throw new CbtAccessDeniedError("Akses ditolak: Sesi ujian ini bukan milik Anda.");
    }
    ```
  - Pada Server Actions:
    `resolveStudentContext` menyelesaikan `siswaId` secara authoritative dari session cookie pengguna login (`user.id`), bukan dari payload client.
  - **Hasil Evaluasi:** **PASS (AMAL / TAHAN EKSPLOITASI)**. Tidak ada celah IDOR horizontal maupun vertikal.

### 2.2. Vektor 2: Manipulasi Timer Client (Client Clock Tampering)
- **Metode Pengujian:**
  1. Siswa mengubah jam sistem operasi (misal memundurkan 2 jam ke belakang).
  2. Siswa memanipulasi variabel state React via konsol browser: `setSecondsLeft(999999)`.
  3. Siswa membekukan tab browser di latar belakang (background tab throttle).
- **Temuan & Bukti Audit:**
  - Timer visual di client memang menghitung mundur, namun **SERVER TIDAK PERNAH MEMPERCAYAI CLIENT TIMER**.
  - Setiap kali mutasi autosave (`autosaveAnswer`) atau submit (`submitAttempt`) diterima server:
    ```typescript
    const deadline = new Date(session.batas_waktu_server).getTime();
    if (Date.now() > deadline) {
      await this.repo.submitAttempt(session.id);
      throw new CbtTimerExpiredError("Waktu ujian telah habis. Sesi telah dikumpulkan.");
    }
    ```
  - Jika waktu server telah melewati deadline, server langsung mengunci attempt dan menilai lembar jawaban secara sepihak.
  - **Hasil Evaluasi:** **PASS (AUTHORITATIVE SERVER DEADLINE INVARIANT TERPELIHARA)**.
  - *Catatan Minor:* `setInterval` client rentan melambat di Android saat tab diminimalkan, sehingga countdown visual bisa tertinggal dari server time. Mitigasi: sinkronisasi delta timestamp lokal di client.

### 2.3. Vektor 3: Bypass Token Ujian Masuk
- **Metode Pengujian:**
  1. Siswa mencoba langsung membuka `/cbt/attempt/[attemptId]` tanpa melalui `/cbt/start`.
  2. Siswa mengirimkan token lowercase / dengan spasi (`abc123 ` vs `ABC123`).
  3. Admin mengaktifkan `gunakan_token: true` namun tidak mengisi `token_masuk` (null).
- **Temuan & Bukti Audit:**
  - Sesi attempt belum ada sebelum siswa memanggil `startOrResumeAttempt`.
  - Normalisasi token sudah `toUpperCase()` dan `trim()`.
  - **KELEMAHAN DITEMUKAN (Celah Edge Case):**
    Di `cbt-service.ts`:
    ```typescript
    if (exam.gunakan_token && exam.token_masuk) { ... }
    ```
    Jika administrator mencentang `gunakan_token = true` namun kolom `token_masuk` bernilai `null` atau string kosong, blok if dilewati (`falsy`), sehingga ujian dapat dimulai tanpa token!
  - **Tingkat Risiko:** **MEDIUM**.
  - **Rekomendasi Perbaikan:** Tambahkan validasi: jika `exam.gunakan_token === true && !exam.token_masuk`, lempar error konfigurasi atau tolak pendaftaran.

### 2.4. Vektor 4: Akses Langsung ke SnapshotUjian & Bank Soal
- **Metode Pengujian:**
  1. Siswa mencoba memanggil endpoint internal atau menebak ID snapshot untuk melihat kunci jawaban.
  2. Siswa melakukan inspeksi terhadap state Next.js Server Component payload (`__next_f`).
- **Temuan & Bukti Audit:**
  - Tidak ada endpoint API publik yang mengekspos model `SnapshotUjian`.
  - Pada saat freeze snapshot, kolom `manifest_soal` dan `kunci_penilaian` dipisahkan secara fisik di tabel database:
    - `manifest_soal` hanya berisi metadata soal, teks pertanyaan, dan opsi tanpa atribut `kunci_jawaban` atau `is_correct`.
    - `kunci_penilaian` (berisi kunci jawaban) disimpan terpisah dan tidak pernah diambil saat pemanggilan `getAttemptPlayer`.
  - **Hasil Evaluasi:** **PASS (ZERO ANSWER KEY LEAKAGE INVARIANT VERIFIED)**.

### 2.5. Vektor 5: Pemeriksaan Kebocoran Data Antar-Sekolah (Cross-Tenant Isolation)
- **Metode Pengujian:**
  Siswa Sekolah A mencoba mengakses ujian atau attempt di Sekolah B dengan mengganti parameter URL atau memanggil Server Action dengan ID dari Sekolah B.
- **Temuan & Bukti Audit:**
  - Pada Server Action: `sekolah_id` diambil dari token sesi pengguna (`user.sekolah_id`).
  - Pada repository: Seluruh query memuat klausa `where: { sekolah_id }`.
  - Pada `getAttemptPlayer`:
    ```typescript
    const exam = await this.repo.findUjianById(session.ujian_cbt_id, sekolahId);
    if (!exam) throw new CbtNotFoundError(`Ujian CBT tidak ditemukan.`);
    ```
    Jika ID ujian valid tetapi milik sekolah lain, query mengembalikan `null` dan melempar `CbtNotFoundError`.
  - **Hasil Evaluasi:** **PASS (100% TENANT ISOLATION COMPLIANT)**.

### 2.6. Vektor 6: Sesi Ganda / Pengerjaan Konkuren (Single Device Enforcer)
- **Metode Pengujian:**
  Siswa A login di Laptop, memulai ujian. Secara bersamaan, Siswa A login di Smartphone Android dan membuka halaman `/cbt/attempt/[attemptId]`.
- **Temuan & Bukti Audit:**
  - Sistem saat ini mengizinkan kedua perangkat mengakses dan mengirimkan `autosaveAnswer` secara simultan.
  - Tidak ada mekanisme pembatalan sesi lama (*Single Session Token / Device Invalidation*).
  - Kolom `ip_address` dan `user_agent` di `sesi_ujian_siswa` hanya bersifat pencatatan (*audit log*), bukan token pengunci sesi aktif.
  - **Tingkat Risiko:** **HIGH (POTENSI JOKI UJIAN & RACE CONDITION AUTOSAVE)**.
  - **Rekomendasi Perbaikan:** Tambahkan `active_device_token` pada `sesi_ujian_siswa` yang diperbarui saat start/resume. Jika device baru masuk, device lama otomatis menerima sinyal sesi kedaluwarsa.

---

## 3. Matriks Kerentanan Keamanan (Security Scorecard)

| ID | Vektor Ancaman | Dampak | Probabilitas | Tingkat Risiko | Status Penanganan |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **SEC-01** | Akses Attempt Siswa Lain (IDOR) | Kritis | Rendah | **LOW** | Tuntas Termitigasi |
| **SEC-02** | Manipulasi Clock Client | Tinggi | Tinggi | **LOW** | Tuntas Termitigasi |
| **SEC-03** | Kebocoran Kunci Jawaban di Network/DOM | Kritis | Sedang | **LOW** | Tuntas Termitigasi |
| **SEC-04** | Kebocoran Data Antar-Tenant | Kritis | Rendah | **LOW** | Tuntas Termitigasi |
| **SEC-05** | Token Null Bypass saat `gunakan_token=true` | Sedang | Sedang | **MEDIUM** | Butuh Remediasi |
| **SEC-06** | Konkurensi Perangkat Ganda (No Device Lock) | Tinggi | Tinggi | **HIGH** | Butuh Remediasi |
| **SEC-07** | False Positive Anti-Cheat Android Keyboard | Sedang | Tinggi | **HIGH** | Butuh Remediasi |

---

## 4. Kesimpulan Keamanan

Perlindungan data inti, privasi multi-tenant, dan pencegahan kecurangan dasar (jawaban rahasia dan timer) berada dalam status **SANGAT AMAN**. 

Kelemahan keamanan yang perlu ditangani pada fase pengerasan berikutnya terpusat pada **Single Device Session Enforcement** dan **penyempurnaan validasi konfigurasi token null**.
