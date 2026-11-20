# TOKEN ENGINE DESIGN (MVP ONLY)
## Ruang Pintar — School Digital Operating Platform
### Simple 6-Character Exam Entrance Token Architecture

| Metadata | Nilai |
| --- | --- |
| **Dokumen** | TOKEN-ENGINE-DESIGN.md |
| **Stage** | STAGE CBT-04 — CBT Delivery Foundation |
| **Status** | `APPROVED ARCHITECTURE` |
| **Engine** | `ExamTokenEngine` (`src/modules/cbt/application/exam-token-engine.ts`) |

---

## 1. Overview & MVP Constraints

Pada tahap **STAGE CBT-04**, engine token dirancang secara sengaja untuk model **MVP ONLY**:
- **Format Sederhana:** 6 Karakter Uppercase Alphanumeric (contoh: `ABC123`, `KRYZQA`, `97TPX2`).
- **Fitur Inti:**
  1. `generateToken`: Pembuatan token acak aman.
  2. `regenerateToken`: Pembuatan token baru jika token lama bocor sebelum sesi dimulai.
  3. `expireToken`: Penonaktifan token seketika saat sesi ditutup atau darurat.
  4. `validateToken`: Verifikasi token masuk peserta dengan toleransi huruf besar/kecil.
- **Batasan Eksplisit:** **DILARANG mengimplementasikan rolling token** (token dinamis yang berganti tiap 15 menit). Rolling token menimbulkan overhead bagi sekolah dengan kendala konektivitas lab, dan berada di luar cakupan MVP Delivery Foundation.

---

## 2. Character Set Optimization (Anti-Ambiguity)

Untuk menghindari kebingungan siswa saat membaca token di papan tulis atau layar proyektor ruang ujian:
- Menghilangkan huruf `I` (mirip angka 1).
- Menghilangkan angka `1` (mirip huruf I/l).
- Menghilangkan huruf `O` (mirip angka 0).
- Menghilangkan angka `0` (mirip huruf O).

```typescript
const TOKEN_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 Karakter Unambigu
```

Kombinasi entropi: $32^6 = 1.073.741.824$ kemungkinan kombinasi unik per sesi.

---

## 3. Cryptographically Secure Token Generation

Token dihasilkan menggunakan modul Node.js `crypto.randomBytes`:

```typescript
generateTokenCode(): string {
  const bytes = crypto.randomBytes(6);
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += TOKEN_CHARSET[bytes[i] % TOKEN_CHARSET.length];
  }
  return result;
}
```

---

## 4. Token Validation Protocol

Saat siswa memasukkan token di halaman pembuka:
1. **Case-Insensitive & Trim Normalization:** String token dibersihkan dari spasi liar dan di-uppercase (`token.trim().toUpperCase()`).
2. **Session Active Check:** Memastikan sesi berstatus `DIBUKA` dan `token_aktif === true`.
3. **Expiration Window Check:** Jika `token_expired_at` telah lewat dari waktu server saat ini ($T_{now} > T_{expired}$), token ditolak dengan pesan: `"Token ujian telah kedaluwarsa. Minta token baru ke pengawas."`
4. **Exact Match Verification:** Pencocokan hash/string token.

---

## 5. Security & Operator Boundaries

- **Guru Pengampu / Pengawas Ruang:** Berwenang menampilkan token di proyektor, me-regenerate token baru, dan meng-expire token.
- **Siswa:** Hanya berwenang menginput token untuk memverifikasi hak masuk sesi ujian.
- **Tenant Isolation:** Token hanya valid untuk sesi di sekolah yang sama (`sekolah_id`). Token sekolah A tidak dapat digunakan di sekolah B.
