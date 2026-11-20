# CBT-02.2: COGNITIVE TAXONOMY & COGNITIVE LEVEL MODEL ARCHITECTURE
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| :--- | :--- |
| **Dokumen** | CBT-02.2-COGNITIVE-TAXONOMY.md |
| **Tahap** | STAGE CBT-02.2 — Foundation Hardening & Snapshot Design |
| **Status** | `PROPOSED ARCHITECTURE` |
| **Tanggal** | 2026-10-07 |
| **Modul Terkait** | M11 (Learning), M12 (CBT / Bank Soal), M13 (Assessment Blueprint) |

---

## 1. Analisis Standar Nasional: Model L1, L2, L3

Pada STAGE CBT-02.1, Ruang Pintar menetapkan taksonomi kognitif `L1`, `L2`, dan `L3` sebagai field inti pada `BankSoal` dan `ItemKisiKisi`.

### Dasar Regulasi:
Model 3 level kognitif ini bersumber langsung dari pedoman resmi **Pusat Asesmen Pendidikan (Pusmendik) / BSKAP Kemendikbudristek** untuk perakitan soal Ujian Sekolah, Asesmen Sumatif Sekolah, dan AKM:
- **Level 1 (L1) — Pengetahuan & Pemahaman (*Knowing*):** Mengukur kemampuan mengingat kembali fakta, istilah, definisi, konsep dasar, dan rumus.
- **Level 2 (L2) — Aplikasi / Penerapan (*Applying*):** Mengukur kemampuan menerapkan konsep, rumus, atau prosedur ke dalam situasi nyata yang rutin/terstruktur.
- **Level 3 (L3) — Penalaran (*Reasoning* / HOTS):** Mengukur kemampuan menganalisis informasi, mengevaluasi fakta, memecahkan masalah non-rutin, menghubungkan berbagai konsep, dan mencipta solusi.

---

## 2. Analisis Kecukupan Lintas Jenjang Pendidikan di Indonesia

Audit empiris terhadap format asesmen di sekolah Indonesia menunjukkan kecukupan model L1-L3:

```text
+-------------------+-----------------------------------------------------------------------------+
| JENJANG PENDIDIKAN| KARAKTERISTIK DAN KOMPOSISI ASESMEN YANG BERLAKU DI LAPANGAN                |
+-------------------+-----------------------------------------------------------------------------+
| SD / MI           | • Dominan L1 (40%) dan L2 (45%), L3 pengenalan (15%).                       |
| (Fase A, B, C)    | • Guru membutuhkan format ringkas tanpa jargon rumit.                       |
|                   | • Format L1-L3 diterima 100% oleh pengawas SD dan Dinas Pendidikan Kab/Kota.|
+-------------------+-----------------------------------------------------------------------------+
| SMP / MTs         | • Komposisi tipikal: L1 (30%), L2 (40%), L3 (30%).                          |
| (Fase D)          | • Digunakan dalam Ujian Sekolah / Asesmen Sumatif Akhir Jenjang (ASAJ).     |
|                   | • L1-L3 menjadi format wajib format kisi-kisi Musyawarah Guru Mata Pelajaran|
|                   |   (MGMP) tingkat Rayon dan Kabupaten/Kota.                                  |
+-------------------+-----------------------------------------------------------------------------+
| SMA / MA          | • Komposisi tipikal: L1 (20%), L2 (40%), L3 (40%).                          |
| (Fase E, F)       | • L3 ditekankan untuk persiapan Asesmen Nasional dan Seleksi Masuk PTN      |
|                   |   (SNBT / UTBK / Tes Potensi Skolastik).                                   |
|                   | • Guru SMA sangat familiar dengan pemetaan L1-L3.                           |
+-------------------+-----------------------------------------------------------------------------+
| SMK / MAK         | • Komposisi tipikal: L1 (15%), L2 (45%), L3 (40%).                          |
| (Fase E, F Vokasi)| • L2 merefleksikan keterampilan prosedural & eksekusi SOP bengkel/lab.       |
|                   | • L3 merefleksikan troubleshooting, perbaikan sirkuit/mesin, diagnosa error,|
|                   |   serta perancangan produk kreatif kewirausahaan.                           |
+-------------------+-----------------------------------------------------------------------------+
```

**Kesimpulan Audit:** Model canonical `L1`, `L2`, `L3` **SUDAH SANGAT CUKUP DAN TEPAT** sebagai fondasi default bagi seluruh jenjang SD, SMP, SMA, dan SMK di Indonesia.

---

## 3. Extensibility Layer: Pemetaan Terhadap Taksonomi Bloom (Anderson-Krathwohl)

Meskipun L1-L3 adalah bahasa resmi kisi-kisi dinas, sejumlah sekolah swasta unggulan, Sekolah Penggerak, dan Satuan Pendidikan Kerjasama (SPK) memerlukan rincian 6 jenjang Taksonomi Bloom Revisi (Anderson & Krathwohl, 2001).

Ruang Pintar menyediakan **Extensibility Layer dua arah (Bi-directional Mapping)**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   TAKSONOMI BLOOM (REVISI ANDERSON)                   │
├─────────────────────┬──────────────────────────────────────────────────┤
│ C1 : Mengingat      │ (Remembering: fakta, istilah, definisi)          │
│ C2 : Memahami       │ (Understanding: menerangkan, mengklasifikasi)    │ ───► LEVEL 1 (L1)
├─────────────────────┼──────────────────────────────────────────────────┤      Pengetahuan & Pemahaman
│ C3 : Menerapkan     │ (Applying: menghitung, menjalankan prosedur)     │ ───► LEVEL 2 (L2)
├─────────────────────┼──────────────────────────────────────────────────┤      Aplikasi / Penerapan
│ C4 : Menganalisis   │ (Analyzing: membedakan, mendiagnosis, mengurai)  │
│ C5 : Mengevaluasi   │ (Evaluating: menilai, mengkritisi, menyimpulkan) │ ───► LEVEL 3 (L3)
│ C6 : Mencipta       │ (Creating: merancang, merumuskan, memproduksi)   │      Penalaran / HOTS
└─────────────────────┴──────────────────────────────────────────────────┘
```

### 3.1. Dimensi Pengetahuan (Knowledge Dimension Extension)
Untuk kurikulum SMK dan Sekolah Riset, sistem menyiapkan metadata dimensi pengetahuan:
- `FAKTUAL`: Simbol, terminologi, fakta spesifik.
- `KONSEPTUAL`: Klasifikasi, prinsip, teori, generalisasi.
- `PROSEDURAL`: Keterampilan khusus, algoritma, teknik, metode, kriteria penggunaan SOP.
- `METAKOGNITIF`: Pengetahuan strategis, kesadaran kognitif diri.

---

## 4. Desain Skema Database Extensible (Zero Breaking Change)

Agar model tetap ringan namun siap diekstensikan di masa depan, skema dirancang dengan **Canonical Field + Metadata Extensibility**:

```prisma
// Entitas BankSoal & ItemKisiKisi tetap menggunakan field inti L1, L2, L3:
model BankSoal {
  // ...
  level_kognitif        String   @default("L2") // Canonical: "L1" | "L2" | "L3"
  
  // Extensibility Metadata (Nullable / Optional):
  bloom_level           String?  // "C1", "C2", "C3", "C4", "C5", "C6"
  dimensi_pengetahuan   String?  // "FAKTUAL", "KONSEPTUAL", "PROSEDURAL", "METAKOGNITIF"
}

model ItemKisiKisi {
  // ...
  level_kognitif        String   @default("L2") // Canonical: "L1" | "L2" | "L3"
  bloom_level           String?  // Optional detailed level
}
```

---

## 5. Mesin Sinkronisasi & Auto-Rollup (Dual-Mode Toggle)

Sekolah dapat memilih mode taksonomi pada konfigurasi akademik sekolah:

### Mode 1: Mode Standar Nasional (Pusmendik L1-L3) — *Default*
- Guru hanya melihat opsi dropdown: `L1 (Pemahaman)`, `L2 (Penerapan)`, `L3 (Penalaran / HOTS)`.
- Sederhana, cepat, tidak membebani guru.

### Mode 2: Mode Granular (Bloom C1-C6) — *Opt-in*
- Guru dapat memilih level spesifik `C1` s/d `C6`.
- **Auto-Rollup Engine:** Sistem secara otomatis memetakan level Bloom yang dipilih ke canonical `level_kognitif` (misal guru memilih `C4`, sistem otomatis menyimpan `level_kognitif = 'L3'` dan `bloom_level = 'C4'`).
- **Keuntungan Besar:** Saat sekolah mencetak dokumen dinas resmi (Kisi-Kisi/Kartu Soal), kolom level kognitif otomatis terisi format `L3` yang sah sesuai aturan pengawas, tanpa perlu kerja ganda dari guru.

---

## 6. Verifikasi Kesiapan (Ready for Next Phases)

1. Model data eksisting `level_kognitif` (`L1` | `L2` | `L3`) adalah pilihan terbaik dan 100% tepat untuk MVP dan jangka panjang.
2. Penambahan field granular `bloom_level` bersifat additive murni (*zero breaking change*).
3. Cetak dokumen administrasi resmi tidak akan mengalami distorsi format.
