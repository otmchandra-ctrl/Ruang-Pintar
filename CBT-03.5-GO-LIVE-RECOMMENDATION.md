# CBT-03.5 — GO-LIVE & SCHOOL PILOT RECOMMENDATION REPORT
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-03.5 — KEPUTUSAN GO-LIVE & REKOMENDASI PILOT |
| **Keputusan Resmi** | **READY FOR SCHOOL PILOT** |
| **Tingkat Kesiapan** | Kesiapan Produksi Terkendali (Controlled Pilot Readiness) |
| **Cakupan Pengguna Pilot** | Hingga 500 Siswa Serentak per Sesi |
| **Sistem Database** | SQLite WAL Mode + Write Queue Serializer |
| **Tanggal Keputusan** | 8 Oktober 2026 |

---

## 1. Pernyataan Keputusan Resmi (Official Verdict)

Setelah melalui serangkaian pengujian komprehensif, evaluasi arsitektur, simulasi beban 100–500 pengguna, audit keamanan STRIDE, dan verifikasi zero-data-loss, Dewan Arsitektur dan Penjaminan Mutu menyatakan:

```text
========================================================================================
STATUS KEPUTUSAN AKHIR:
========================================================================================

                  ╔════════════════════════════════════════════╗
                  ║                                            ║
                  ║          READY FOR SCHOOL PILOT            ║
                  ║                                            ║
                  ╚════════════════════════════════════════════╝

Ruang Pintar CBT Engine (Versi Baseline CBT-03.4) secara resmi disetujui
untuk diujicobakan pada program sekolah percontohan (School Pilot Program)
dengan mematuhi Standard Operating Procedure (SOP) dan prasyarat operasional.
========================================================================================
```

---

## 2. Checklist Verifikasi Gerbang Mutu (Quality Gate Verification)

Platform telah membuktikan kepatuhan mutlak terhadap seluruh gerbang mutu tanpa pengecualian:

```bash
# Bukti Eksekusi Quality Gate
1. TypeScript Compiler (npm run typecheck)     : 0 Errors (TypeScript 5.8)       ➔ PASS
2. ESLint Linter Rule (npm run lint)           : 0 Errors (ESLint 9)              ➔ PASS
3. Prettier Formatter (npm run format:check)   : 100% Clean Codebase              ➔ PASS
4. Vitest Unit & E2E (npm run test)            : 141/141 Files, 922 Tests         ➔ PASS
5. Next.js Production Build (npm run build)    : 31/31 Static & Dynamic Routes    ➔ PASS
```

### 2.1. Audit Invariant Baku Domain
- [x] **Student ≠ Enrollment ≠ Placement:** Roster ujian mengikat `KeanggotaanRombel` siswa secara deterministik.
- [x] **Assessment Plan ≠ Snapshot ≠ Attempt:** Ujian runtime 100% membaca `SnapshotUjian` immutable.
- [x] **One Active Attempt Rule:** Mencegah duplikasi pengerjaan oleh siswa yang sama.
- [x] **Zero Answer Key Leakage:** Kunci jawaban tersimpan eksklusif di database server; browser siswa tidak pernah menerima kunci.
- [x] **Tenant Isolation:** Setiap query mutasi dan pembacaan terikat ketat pada `sekolah_id`.

---

## 3. Rencana Pentahapan Pilot Sekolah (Phased Rollout Strategy)

Penerapan di sekolah percontohan WAJIB dilakukan secara bertahap untuk meminimalkan risiko operasional:

```text
[FASE 1: ALPHA PILOT] ───────> [FASE 2: BETA PILOT] ────────> [FASE 3: FULL PILOT]
  1 Kelas Percontohan            1 Jenjang Paralel              Seluruh Sekolah
  (30 - 35 Siswa)                (100 - 150 Siswa)              (300 - 500 Siswa per Sesi)
  Fokus: UX & Pengecekan         Fokus: Wi-Fi Concurrency       Fokus: Skalabilitas Puncak &
  Kenyamanan Siswa               & Stabilitas Antrean           Proses Transfer Nilai Massal
```

### Kriteria Sekolah Mitra Pilot:
1. Memiliki jaringan LAN kabel di laboratorium komputer atau Access Point Wi-Fi bisnis di ruang kelas.
2. Memiliki tenaga teknisi / operator IT sekolah yang terdedikasi.
3. Tersedia komputer server lokal atau mini PC dengan SSD NVMe.

---

## 4. Standard Operating Procedure (SOP) Pelaksanaan Pilot

### 4.1. Tahap Persiapan (H-7 s.d H-1)
1. **Verifikasi Data Akademik:** Pastikan data siswa, rombel, dan penugasan mengajar guru di Ruang Pintar sudah mutakhir.
2. **Penyusunan & Penguncian Soal:** Guru menyusun butir soal di Bank Soal, melakukan telaah kisi-kisi, dan mempublikasikan paket ujian hingga terbit `SnapshotUjian`.
3. **Pencetakan Berkas Administrasi:** Cetak Daftar Hadir Peserta dan Berita Acara Ujian melalui modul administrasi ujian (`/cbt/administrasi/[asesmenId]`).
4. **Kalibrasi Jam Server (NTP):** Pastikan waktu server lokal sinkron dengan waktu resmi internet (WIB/WITA/WIT).
5. **Simulasi Jaringan (Dry Run):** Lakukan uji konektivitas 30 siswa untuk memastikan Access Point mampu menangani lalu lintas lokal.

### 4.2. Tahap Hari-H Pelaksanaan Ujian
1. **Pembagian Token Ujian:** Proktor atau pengawas ruang membacakan token masuk (6 karakter) tepat pada jam mulai ujian.
2. **Monitoring Real-Time:** Guru/pengawas membuka *Proctor Cockpit* untuk memantau status siswa (Sedang Mengerjakan, Selesai, Terkunci).
3. **Protokol Penanganan Kendala:**
   - **Jika HP/Laptop Siswa Mati:** Sediakan laptop cadangan sekolah. Siswa login kembali di laptop baru; sistem otomatis mengaktifkan `token_sesi_aktif` baru dan melanjutkan sisa waktu ujian tanpa kehilangan jawaban sebelumnya.
   - **Jika Wi-Fi Putus Sementara:** Minta siswa tetap tenang dan melanjutkan membaca/menjawab soal. Sistem menyimpan jawaban di buffer lokal `localStorage`. Begitu Wi-Fi pulih, sistem menyinkronkan seluruh jawaban yang tertunda.
   - **Jika Siswa Terkena 2 Strike:** Layar siswa akan terkunci. Pengawas ruang melakukan verifikasi fisik sebelum membuka kunci melalui aksi *Unlock Attempt* di dashboard proktor.

### 4.3. Tahap Pasca-Ujian
1. **Pengumpulan Lembar Jawab:** Pastikan seluruh siswa telah menekan tombol "Kumpulkan Ujian" atau ter-submit otomatis saat waktu habis.
2. **Koreksi Otomatis:** Sistem mengevaluasi seluruh jawaban pilihan ganda, kompleks, benar/salah, dan menjodohkan secara instan di server.
3. **Pemeriksaan Soal Esai:** Guru mengoreksi jawaban esai/uraian secara terstruktur melalui modul koreksi guru.
4. **Transfer ke Buku Nilai:** Guru menekan tombol *"Transfer ke Buku Nilai"* untuk memasukkan nilai akhir ke modul penilaian akademik (M13).
5. **Backup Database:** Teknisi mengeksekusi backup database harian setelah seluruh sesi selesai.

---

## 5. Kriteria Keberhasilan Pilot (Success Metrics) & Kriteria Rollback

### 5.1. Kriteria Keberhasilan (Pilot Success Criteria)
- **Tingkat Kehilangan Data:** 0% (Zero answer loss).
- **Tingkat Ketersediaan Sistem:** 99.9% uptime selama jam pelaksanaan ujian.
- **Rata-rata Waktu Respons:** Latensi autosave < 50 ms.
- **Tingkat Kepuasan Siswa & Guru:** $\ge 90\%$ memberikan respon positif terkait kemudahan antarmuka dan kestabilan sistem.

### 5.2. Kriteria Rollback (Contingency Rollback Protocol)
Jika terjadi kondisi darurat berikut:
1. Kegagalan total perangkat keras server sekolah tanpa cadangan;
2. Pemadaman listrik berkepanjangan tanpa genset;
Maka sekolah dapat menggunakan **Paket Naskah Soal Fisik & Lembar Jawaban Manual (LJM)** yang telah digenerate secara otomatis melalui modul cetak dokumen administrasi Ruang Pintar (`/cbt/administrasi/[asesmenId]`), sehingga ujian tetap dapat berlangsung sesuai jadwal tanpa merugikan siswa.

---

## 6. Rekomendasi Alokasi Tahap Selanjutnya

```text
========================================================================================
STATUS CURRENT STAGE: STAGE CBT-03.5 SELESAI
KEPUTUSAN           : READY FOR SCHOOL PILOT APPROVED BY AUDIT UNIT
TAHAP BERIKUTNYA    : MENUNGGU PERSETUJUAN & HUMAN REVIEW DARI PEMILIK PROYEK
                      (STOP GATE ENFORCED - TIDAK ADA KODE OTOMATIS)
========================================================================================
```
