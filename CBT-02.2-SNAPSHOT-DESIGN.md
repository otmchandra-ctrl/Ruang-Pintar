# CBT-02.2: SNAPSHOT ARCHITECTURE & VERSION DRIFT PREVENTION DESIGN
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| :--- | :--- |
| **Dokumen** | CBT-02.2-SNAPSHOT-DESIGN.md |
| **Tahap** | STAGE CBT-02.2 — Foundation Hardening & Snapshot Design |
| **Status** | `PROPOSED ARCHITECTURE` |
| **Tanggal** | 2026-10-07 |
| **Modul Terkait** | M11 (Learning), M12 (CBT / Bank Soal), M13 (Assessment & Blueprint), M14 (Exam Execution) |

---

## 1. Latar Belakang & Masalah: Version Drift

Dalam siklus asesmen sekolah, butir soal melewati berbagai fase waktu yang dinamis:
1. Soal dibuat di **Bank Soal** (Personal/Sekolah).
2. Soal dipetakan ke dalam **Kisi-Kisi Asesmen (Blueprint)**.
3. Soal dicetak ke dalam **Naskah Ujian Kertas (Paper-Based Exam)** untuk panitia semester.
4. Kunci jawaban dan pedoman penskoran dicetak untuk tim korektor/pengawas.
5. Ujian dijadwalkan dan disinkronkan ke **CBT Online Engine**.

### Masalah Nyata: "Version Drift" (Pergeseran Versi)
Jika seorang guru mengoreksi salah tik (*typo*), mengubah opsi jawaban (misal dari C ke D), atau mengganti gambar stimulus pada Bank Soal **setelah** kisi-kisi atau naskah cetak dibuat:
- **Ketidakcocokan Naskah Fisik vs Kunci Jawaban:** Siswa mengerjakan naskah kertas versi lama (Opsi C), sedangkan kunci koreksi menggunakan versi baru (Opsi D).
- **Inkonsistensi Kisi-Kisi vs Soal:** Kisi-kisi menyatakan level kognitif L2 dengan indikator X, namun soal di bank diubah guru menjadi studi kasus L3 dengan indikator Y.
- **Inkonsistensi Sesi CBT Berjalan:** Siswa A yang login pukul 08:00 mendapat pertanyaan versi awal, sedangkan Siswa B yang login pukul 08:15 mendapat pertanyaan versi yang baru saja diedit guru di tengah ujian.

Untuk mencegah integritas akademik runtuh akibat *version drift*, Ruang Pintar menerapkan **Three-Tier Snapshot Architecture**.

---

## 2. Arsitektur Tiga Lapis Snapshot (Three-Tier Snapshot Architecture)

Ruang Pintar membagi immutabilitas data ke dalam 3 lapisan pertahanan:

```
+-------------------------------------------------------------------------------+
|  TIER 1: QUESTION VERSION SNAPSHOT (Immutability di Tingkat Butir Soal)       |
|  - Tabel: VersiSoal (nomor_versi, pertanyaan, opsi, kunci, stimulus, bobot)    |
|  - Setiap mutasi teks/kunci TIDAK PERNAH menimpa baris lama (Insert-Only).    |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼ (Dipin via versi_soal_id spesifik)
+-------------------------------------------------------------------------------+
|  TIER 2: BLUEPRINT & ADMINISTRATION SNAPSHOT (Immutability Dokumen Resmi)    |
|  - Tabel: KisiKisiAsesmen & ItemKisiKisi (status: DRAFT -> REVIEW -> FINAL)   |
|  - Status FINAL/ARSIP: Semua item mengunci versi_soal_id definitif.           |
|  - Checksum Hash Dokumen: SHA-256 dicetak di naskah & kunci jawaban.          |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼ (Dibekukan saat ujian diterbitkan)
+-------------------------------------------------------------------------------+
|  TIER 3: ASSESSMENT EXECUTION SNAPSHOT (Immutability Runtime CBT Engine)      |
|  - Tabel: SnapshotUjian (manifest_soal JSON, kunci_penilaian JSON terenkripsi)|
|  - Seluruh sesi pengerjaan siswa terikat pada ID snapshot yang sama.          |
+-------------------------------------------------------------------------------+
```

---

## 3. Tier 1: Question Version Snapshot

### 3.1. Aturan Mutasi Append-Only
Setiap kali butir soal pada `BankSoal` diubah oleh guru pemilik:
1. `BankSoal.versi_aktif` bertambah: $versi\_aktif_{baru} = versi\_aktif_{lama} + 1$.
2. Dibuat record baru pada tabel `VersiSoal` dengan `nomor_versi = versi_aktif_{baru}`.
3. Record `VersiSoal` lama **TIDAK PERNAH DIUBAH ATAU DIHAPUS** (`IMMUTABLE`).

```prisma
model BankSoal {
  id                      String      @id
  sekolah_id              String
  guru_id                 String
  mata_pelajaran_id       String
  versi_aktif             Int         @default(1)
  // ...
  versi_soal              VersiSoal[]
  item_kisi_kisi          ItemKisiKisi[]
}

model VersiSoal {
  id              String    @id
  bank_soal_id    String
  nomor_versi     Int
  pertanyaan      String
  opsi_jawaban    String?   // JSON
  kunci_jawaban   String    // JSON
  pembahasan      String?
  bobot_default   Float     @default(1.0)
  alasan_perubahan String?
  dibuat_oleh     String
  created_at      DateTime  @default(now())

  @@unique([bank_soal_id, nomor_versi])
}
```

### 3.2. Manfaat
- Riwayat perubahan dapat dilacak (*audit trail* lengkap).
- Kisi-kisi atau naskah lama yang menunjuk ke `VersiSoal` nomor 1 tetap membaca teks soal versi 1 persis seperti saat dokumen tersebut disusun.

---

## 4. Tier 2: Blueprint & Administration Snapshot

### 4.1. Lifecycle Kisi-Kisi & Pinning Versi
`KisiKisiAsesmen` memiliki siklus hidup 4 state:
- `DRAFT`: Guru leluasa merakit butir soal. `ItemKisiKisi` dapat menunjuk ke `bank_soal_id`. `versi_soal_id` otomatis mengambil versi aktif terbaru.
- `REVIEW`: Diajukan ke Kepala Sekolah atau Kurikulum / Supervisor. Dilakukan telaah butir soal.
- `FINAL`: Disetujui secara resmi. Pada transisi ini, **SISTEM MELAKUKAN HARD-PINNING**:
  - Seluruh `ItemKisiKisi.versi_soal_id` dikunci permanen pada versi saat itu.
  - Header `KisiKisiAsesmen` menghasilkan `snapshot_hash` (SHA-256).
- `ARSIP`: Dokumen telah selesai diujikan dan disimpan sebagai arsip akreditasi sekolah.

### 4.2. Skema Relasi Item Kisi-Kisi
```prisma
model ItemKisiKisi {
  id                     String    @id
  kisi_kisi_id           String
  nomor_urut             Int
  tujuan_pembelajaran_id String
  indikator_soal         String
  level_kognitif         String    @default("L2") // L1, L2, L3
  bentuk_soal            String    @default("PILIHAN_GANDA")
  bobot_skor             Float     @default(1.0)
  
  // Strict Version Pinning:
  bank_soal_id           String?
  versi_soal_id          String?   // Terkunci saat Kisi-Kisi berstatus FINAL
  
  // Drift Indicator Flag:
  is_version_outdated    Boolean   @default(false)
}
```

### 4.3. Document Checksum & Verification Code
Saat naskah cetak atau PDF di-generate, sistem menyertakan kode verifikasi:
```text
KODE CETAK DOKUMEN: RP-NAS-2026-X-RPL1-7A8B9C (Hash SHA-256 Butir & Kunci)
```
- Tercetak di header atau footer setiap lembar naskah soal, kartu soal, dan lembar kunci jawaban.
- Jika panitia memeriksa kode cetak naskah soal dan kode kunci jawaban sama persis, dijamin **100% TIDAK TERJADI VERSION DRIFT**.

---

## 5. Tier 3: Assessment Execution Snapshot (CBT Runtime)

Saat sebuah asesmen diujikan via CBT:
1. `UjianCbt` menghasilkan record `SnapshotUjian`.
2. Seluruh soal yang terpilih (baik dari Blueprint maupun Bank Soal) di-render menjadi 2 manifest terisolasi:
   - `manifest_soal`: Berisi stimulus, pertanyaan, opsi teracak/urut, TANPA kunci jawaban. Aman didistribusikan ke browser siswa.
   - `kunci_penilaian`: Berisi ID item, kunci jawaban, dan bobot penilaian. Tersimpan rapat di server boundary.
3. Seluruh sesi siswa (`SesiUjianSiswa`) mereferensikan `snapshot_ujian_id`.
4. Jika guru mengubah soal di Bank Soal saat ujian sedang berlangsung:
   - `SnapshotUjian` **TIDAK TERPENGARUH**.
   - Integritas nilai siswa terlindungi sepenuhnya dari fluktuasi data.

---

## 6. Version Drift Detection & Warning Protocol

Jika soal di Bank Soal mengalami revisi setelah masuk ke dalam Kisi-Kisi yang masih berstatus `DRAFT` atau `REVIEW`:

### 6.1. Deteksi Otomatis
Query mendeteksi ketidaksesuaian versi:
```sql
SELECT 
    ikk.id AS item_id,
    ikk.nomor_urut,
    ikk.versi_soal_id AS pinned_versi_id,
    vs_pinned.nomor_versi AS pinned_nomor_versi,
    bs.versi_aktif AS latest_nomor_versi
FROM item_kisi_kisi ikk
JOIN bank_soal bs ON bs.id = ikk.bank_soal_id
JOIN versi_soal vs_pinned ON vs_pinned.id = ikk.versi_soal_id
WHERE ikk.kisi_kisi_id = :kisi_kisi_id
  AND vs_pinned.nomor_versi < bs.versi_aktif;
```

### 6.2. Visual Indicator di Cockpit Guru (Academic Glass UI)
- Badge Peringatan Oranye: `Versi Soal Berubah (v1 -> v2)`.
- Dialog Perbandingan Diff:
  - Kolom Kiri: Naskah Versi Tersemat (v1).
  - Kolom Kanan: Naskah Versi Terbaru di Bank Soal (v2).
- Tombol Aksi:
  - `[ Pertahankan Versi v1 ]`
  - `[ Sinkronkan ke Versi Terbaru v2 ]`

### 6.3. Kebijakan Kunci pada Status FINAL
Jika `KisiKisiAsesmen.status === 'FINAL'`:
- Tombol sinkronisasi otomatis **DIKUNCI**.
- Guru harus secara eksplisit menekan tombol `[ Buka Kunci Revisi ]` yang mengubah status kembali ke `REVIEW` dan mencatat alasan pembukaan kunci di audit log (*Audit Trail Compliance*).

---

## 7. Ringkasan Matriks Respons Version Drift

| Momen Kejadian | Status Kisi-Kisi | Dampak Perubahan di Bank Soal | Aksi Sistem |
| :--- | :--- | :--- | :--- |
| **Penyusunan Awal** | `DRAFT` | Soal diperbarui guru | Peringatan halus (*notice*), opsi sinkronisasi 1-klik. |
| **Proses Telaah** | `REVIEW` | Soal diperbarui guru | Notifikasi ke penelaah/kurikulum; telaah ulang diperlukan. |
| **Sudah Dicetak / Final** | `FINAL` | Soal diperbarui guru | **DITOLAK** di dokumen cetak; kisi-kisi mempertahankan versi saat cetak. |
| **Ujian Sedang Berlangsung**| `ONGOING` | Soal diperbarui guru | **ZERO IMPACT** pada CBT player (terisolasi di `SnapshotUjian`). |

---

## 8. Rekomendasi Implementasi pada STAGE CBT-03

1. Tambahkan field `snapshot_hash` dan `tanggal_dibekukan` pada `KisiKisiAsesmen`.
2. Buat service method `checkBlueprintVersionDrift(kisiKisiId, sekolahId)`.
3. Buat service method `syncBlueprintToLatestVersions(kisiKisiId, sekolahId, itemIds)`.
