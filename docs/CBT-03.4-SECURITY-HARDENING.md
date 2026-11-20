# CBT-03.4 — SECURITY HARDENING REPORT
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Fokus Dokumen** | Hardening Keamanan, Single Device Lock, & Anti-Cheat Reliability |
| **Tahap** | STAGE CBT-03.4 |
| **Status** | `READY FOR HUMAN REVIEW` |
| **Batas Otorisasi** | Server-Authoritative (Default Deny, Tenant-Scoped) |

---

## 1. STRIDE Threat Model Remediation

| STRIDE Category | Vektor Ancaman Sebelumnya | Status Remediasi CBT-03.4 | Mekanisme Pencegahan |
| --- | --- | :---: | --- |
| **Spoofing (Penyamaran)** | Siswa membuka ujian di 2 perangkat berbeda untuk berbagi layar / pengerjaan bersama | **MITIGATED** | `token_sesi_aktif` unik per sesi. Login/resume dari perangkat baru secara instan menginvalidasi token lama. |
| **Tampering (Manipulasi)** | Klien mengubah timer lokal / countdown di memory browser | **MITIGATED** | Sumber kebenaran mutlak berasal dari `batas_waktu_server`. Timer lokal hanya membaca sisa waktu terhadap server timestamp. Begitu waktu server habis, autosave ditolak dan sesi otomatis di-submit. |
| **Repudiation (Penyangkalan)** | Siswa mengklaim jawaban hilang saat koneksi putus dan submit dilakukan | **MITIGATED** | Pre-Submit Synchronization Barrier mencegah submit sebelum server mengonfirmasi penerimaan seluruh buffer jawaban. Audit integritas mencatat setiap event offline dan sync retry. |
| **Information Disclosure** | Kebocoran kunci jawaban dari manifest | **PROTECTED** | Kunci penilaian dan rubrik penilaian hanya ada di tabel `snapshot_ujian.kunci_penilaian` pada sisi server. Player hanya menerima manifest tanpa jawaban benar. |
| **Denial of Service** | Beban database tinggi akibat autosave beruntun (3 SELECT + JSON parse per simpan) | **MITIGATED** | Single Minimal SELECT + Single Upsert. Pemanfaatan `cbtWriteQueue` untuk melindugi SQLite write lock contention. |
| **Elevation of Privilege** | Siswa mengirimkan request autosave atau submit untuk attempt milik siswa lain | **PREVENTED** | Server Action memvalidasi `actor.siswa_id === session.siswa_id` dan `sekolah_id` matching secara ketat. Pelanggaran memicu penolakan seketika. |

---

## 2. Arsitektur Single Device Lock (HIGH-RISK-02)

```text
  [Perangkat A: Siswa Mulai Ujian]
         │
         ▼
  1. POST /startOrResumeAttempt
         │
         ├──> Server Generate token_sesi_aktif: "TOK_AAA"
         ├──> Simpan ke SesiUjianSiswa di DB
         └──> Balikkan sessionToken: "TOK_AAA" ke Perangkat A
         │
  [Perangkat A Aktif Mengerjakan]
  Autosave kirim session_token="TOK_AAA" ──> Cocok dengan DB ──> Disimpan (OK)
         │
  [Perangkat B: Siswa Membuka Tab Baru / Laptop Kedua]
         │
         ▼
  2. POST /startOrResumeAttempt (Perangkat B)
         │
         ├──> Server Deteksi Active Attempt
         ├──> Generate token_sesi_aktif BARU: "TOK_BBB"
         ├──> Update DB: token_sesi_aktif = "TOK_BBB"
         └──> Balikkan sessionToken: "TOK_BBB" ke Perangkat B
         │
  [Perangkat A Mencoba Menjawab Lagi]
         │
  3. POST /autosaveAnswer (session_token="TOK_AAA")
         │
         ├──> Server Cek: "TOK_AAA" !== "TOK_BBB" (di DB)
         ├──> Lempar CbtSessionInvalidatedError
         └──> Perangkat A Ditutup & Ditampilkan Modal Kunci Layar Penuh!
```

---

## 3. Remediasi Anti-Cheat Android (BLOCKER-02)

### 3.1. Masalah Keyboard Android
Pada perangkat Android, saat keyboard terbuka dan ditutup:
1. `document.activeElement` kehilangan fokus (`blur`) sesaat sebelum animasi keyboard selesai.
2. Dimensi `window.innerHeight` berubah drastis selama transisi rendering Android Window Manager.
3. Kode lama mendeteksi `!isInputFocused && heightRatio < 0.6` sebagai split-screen cheat, menghasilkan pemogokan palsu (*strike*) yang merugikan siswa jujur.

### 3.2. Solusi Rekayasa
- **Event `focusout` Tracking:** Mencatat `lastInputBlurTimeRef.current = Date.now()`.
- **1500ms Blur Cooldown:** Setiap resize yang terjadi dalam jendela 1500ms pasca blur diabaikan secara total.
- **Horizontal Screen Shrink Detection:** Mode split-screen sejati pada Android (membuka AI di samping lembar ujian) mengurangi lebar layar horizontal (`window.visualViewport.width < window.screen.availWidth * 0.65`). Deteksi ini kebal terhadap fluktuasi keyboard vertikal.
