# CBT-02.2: PRINT ENGINE FOUNDATION & DOCUMENT ARCHITECTURE
## Ruang Pintar — School Digital Operating Platform

| Field | Nilai |
| :--- | :--- |
| **Dokumen** | CBT-02.2-PRINT-ARCHITECTURE.md |
| **Tahap** | STAGE CBT-02.2 — Foundation Hardening & Snapshot Design |
| **Status** | `PROPOSED ARCHITECTURE` |
| **Tanggal** | 2026-10-07 |
| **Modul Terkait** | M13 (Assessment & Administration), M12 (CBT / Bank Soal) |

---

## 1. Latar Belakang & Realitas Sekolah Indonesia

Meskipun Ruang Pintar menyediakan CBT digital online, **dokumen fisik tetap menjadi kebutuhan mutlak hukum, akreditasi, dan operasional sekolah di Indonesia**:
1. **Administrasi Guru:** Guru wajib melampirkan Kisi-Kisi, Kartu Soal, dan Kunci Jawaban ke dalam Portofolio Perangkat Pembelajaran untuk supervisi Kepala Sekolah, Pengawas Pembina Dinas, dan Asesor Akreditasi BAN-PDM.
2. **Keterbatasan Fasilitas & Cadangan Ujian (Paper Fallback):** Sekolah sering kali harus mencetak sebagian naskah soal di kertas karena siswa kekurangan gawai, kendala listrik padam, atau kebijakan ujian berbasis kertas (*Paper-Based Test / PBT*).
3. **Karakteristik Printer Sekolah:** Mayoritas ruang guru dan Tata Usaha (TU) sekolah Indonesia menggunakan printer ink-tank (seperti Epson L3110/L3210, Canon G2010/G2020, HP Smart Tank) dengan kertas HVS F4/A4 gramatur 70-80 gsm.

### Masalah Klasik Desain Cetak Dokumen Sekolah
- **Naskah Terpotong (Bad Page Breaks):** Soal terpotong di tengah kalimat; nomor soal di halaman 1, sementara pilihan jawaban A/B/C/D pindah ke halaman 2.
- **Stimulus Terpisah:** Gambar grafik/tabel stimulus berada di ujung bawah halaman, sementara pertanyaan berada di halaman berikutnya.
- **Boros Kertas:** Format 1 kolom menghabiskan 8-10 lembar per siswa, membebani anggaran BOS sekolah untuk biaya fotokopi.
- **Kop Sekolah Statis / Kaku:** Tidak dapat mengakomodasi kop bertingkat dinas provinsi, cabang dinas, yayasan swasta, atau logo ganda.

---

## 2. Matriks Dokumen Cetak Administrasi Ujian

| Dokumen | Orientasi | Layout Grid | Margin Aman (Top, Right, Bottom, Left) | Tujuan Utama |
| :--- | :---: | :---: | :---: | :--- |
| **Kisi-Kisi Asesmen** | **A4 Landscape** | Tabel Matriks Lebar (1 Kolom Penuh) | `15mm, 15mm, 15mm, 20mm` | Memuat 8-10 kolom indikator secara leluasa tanpa teks berjejal. |
| **Kartu Soal** | **A4 Portrait** | Kartu Modular (1-2 butir per hal) | `15mm, 15mm, 15mm, 20mm` | Telaah butir soal, stimulus, dan pedoman penskoran resmi. |
| **Naskah Soal Ujian** | **A4 Portrait** | **2 Kolom (Two-Column Journal Grid)** | `15mm, 15mm, 15mm, 15mm` | Format standar hemat kertas untuk fotokopi massal siswa. |
| **Kunci & Pedoman Penskoran** | **A4 Portrait** | Tabel Kompak + Rubrik Analitik | `15mm, 15mm, 15mm, 20mm` | Dokumen rahasia tim penilai dan korektor asesmen. |

---

## 3. Komponen Arsitektur Cetak

### 3.1. Indonesian School Letterhead Engine (Kop Fleksibel)
Kop surat resmi sekolah Indonesia memiliki struktur bertingkat dengan variasi konfigurasi:

```text
+-----------------------------------------------------------------------------------+
| [LOGO 1]                    PEMERINTAH PROVINSI JAWA BARAT               [LOGO 2] |
| (Dinas /                       DINAS PENDIDIKAN                          (Sekolah/|
| Pemda /              CABANG DINAS PENDIDIKAN WILAYAH VII                 Tut Wuri)|
| Yayasan)               SEKOLAH MENENGAH KEJURUAN NEGERI 1                         |
|                 Jl. Budi Utomo No. 12, Telp (022) 123456, Bandung                 |
|                   NPSN: 20219001  |  Email: info@smkn1bandung.sch.id              |
+-----------------------------------------------------------------------------------+
===================================================================================== (Garis Ganda)
```

#### Struktur Data Konfigurasi Kop:
```typescript
export interface KopSekolahConfig {
  tipe_sekolah: "NEGERI" | "SWASTA" | "MADRASAH";
  baris_instansi_1?: string; // "PEMERINTAH PROVINSI JAWA BARAT" atau "YAYASAN AL-HIKMAH"
  baris_instansi_2?: string; // "DINAS PENDIDIKAN"
  baris_instansi_3?: string; // "CABANG DINAS PENDIDIKAN WILAYAH VII"
  nama_sekolah: string;      // "SMK NEGERI 1 KOTA BANDUNG"
  alamat_jalan: string;      // "Jl. Budi Utomo No. 12"
  kontak_teks: string;       // "Telp. (022) 123456 | NPSN: 20219001"
  website_email?: string;    // "info@smkn1.sch.id | www.smkn1.sch.id"
  logo_kiri_url?: string;    // Logo Pemprov / Logo Kemenag / Logo Yayasan
  logo_kanan_url?: string;   // Logo Sekolah / Logo Tut Wuri Handayani
  tampilkan_garis_ganda: boolean;
}
```

#### CSS Aturan Garis Pembatas Kop Resmi (Double Rule):
```css
.kop-divider {
  border: none;
  border-top: 2px solid #000;
  border-bottom: 0.5px solid #000;
  height: 3px;
  margin: 6px 0 16px 0;
}
```

---

### 3.2. Naskah Soal 2 Kolom (Two-Column Paper Layout)
Untuk mencapai rasio efisiensi kertas maksimal, naskah soal menggunakan CSS Multicolumn:

```css
@media print {
  .exam-sheet-two-column {
    column-count: 2;
    column-gap: 8mm;
    column-rule: 0.5px solid #d1d5db;
    text-align: justify;
    font-size: 10pt;
    line-height: 1.35;
    font-family: "Calibri", "Arial", sans-serif;
  }
}
```

#### Metadata Ujian (Header Box Non-Kolom):
Header metadata diletakkan sebelum pembagian kolom (`column-span: all`):
```text
+-----------------------------------------------------------------------------------+
| MATA PELAJARAN : INFORMATIKA                    HARI/TANGGAL : SENIN, 10 NOV 2026 |
| KELAS / FASE   : X / FASE E                     WAKTU        : 90 MENIT           |
| GURU PENGAMPU  : BUDI SANTOSO, S.Kom.           JENIS UJIAN  : SUMATIF AKHIR SEM. |
+-----------------------------------------------------------------------------------+
PETUNJUK UMUM:
1. Berdoalah sebelum mulai mengerjakan soal.
2. Dahulukan menjawab butir soal yang dianggap paling mudah.
-------------------------------------------------------------------------------------
```

---

### 3.3. Aturan Anti-Terpotong (Anti-Orphan & Anti-Widow Rules)
Kegagalan utama naskah ujian adalah butir soal yang terbelah antar halaman. Ruang Pintar menerapkan aturan isolasi tegas:

```css
@media print {
  /* Mencegah satu butir soal terbelah di tengah halaman */
  .question-item {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 12px;
    display: block;
  }

  /* Mencegah stimulus (gambar/bacaan) terpisah dari pertanyaan */
  .stimulus-container {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 6px;
  }

  /* Mencegah opsi jawaban terpecah */
  .options-group {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Kartu soal utuh per kartu */
  .kartu-soal-card {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 16px;
  }
}
```

---

### 3.4. Margin Aman Printer Sekolah (Safe Print Margin)
Banyak printer ink-tank sekolah memiliki *physical unprintable margin* (khususnya margin bawah antara 8 - 14 mm). Oleh karena itu, aturan CSS `@page` diatur secara ketat:

```css
/* Naskah Soal & Kartu Soal (A4 Portrait) */
@page exam-portrait {
  size: A4 portrait;
  margin: 15mm 15mm 18mm 18mm; /* Kiri 18mm untuk ruang staples/jilid */
}

/* Kisi-Kisi Asesmen (A4 Landscape) */
@page blueprint-landscape {
  size: A4 landscape;
  margin: 15mm 15mm 15mm 22mm; /* Kiri 22mm untuk ruang binder/jilid dokumen */
}
```

---

## 4. Format Dokumen Administrasi Khusus

### 4.1. Kisi-Kisi Asesmen (A4 Landscape Table)
Struktur tabel standar Kurikulum Merdeka & BSKAP:
```text
+----+-------------------+----------------+--------------------+----------------+----------+--------+--------+-------+
| NO | CAPAIAN PEMBELAJARAN | LINGKUP MATERI | TUJUAN PEMBELAJARAN| INDIKATOR SOAL | BENTUK   | LEVEL  | NO     | BOBOT |
|    | (CP)              |                | (TP)               |                | SOAL     | KOGN.  | SOAL   | SKOR  |
+----+-------------------+----------------+--------------------+----------------+----------+--------+--------+-------+
| 1  | Berpikir Komputa..| Algoritma      | Menerapkan percab..| Disajikan snip.| PG       | L3     | 1      | 2.0   |
| 2  | Berpikir Komputa..| Tipe Data      | Menentukan jenis.. | Diberikan vari.| PGK      | L2     | 2      | 2.0   |
+----+-------------------+----------------+--------------------+----------------+----------+--------+--------+-------+
```
- Setiap halaman baru mengulang judul kolom (*Repeating Table Header* via `thead { display: table-header-group; }`).
- Kolom tanda tangan di halaman terakhir: Guru Penyusun & Kepala Sekolah / Waka Kurikulum.

### 4.2. Kartu Soal (Modular Box Layout)
Format telaah resmi butir soal:
```text
+-----------------------------------------------------------------------------------+
| KARTU SOAL NOMOR 1                                            BENTUK SOAL: PG     |
+-----------------------------------------------------------------------------------+
| Mata Pelajaran : Informatika              | Kelas/Fase     : X / E                |
| Penyusun       : Budi Santoso, S.Kom.     | Level Kognitif : L3 (Penalaran)       |
+-----------------------------------------------------------------------------------+
| Capaian Pembelajaran : Peserta didik mampu merancang solusi algoritma...           |
| Tujuan Pembelajaran  : Menerapkan algoritma percabangan bertingkat...             |
| Materi Pokok         : Percabangan Logika (IF - ELSE IF)                          |
| Indikator Soal       : Disajikan flowchart percabangan, siswa dapat...            |
+-----------------------------------------------------------------------------------+
| BUTIR SOAL:                                                                       |
| Perhatikan potongan kode berikut:                                                 |
| if (x > 10) { y = x * 2; } else { y = 0; }                                         |
| Jika x = 12, maka nilai y adalah ...                                              |
| A. 0       B. 12       C. 24       D. 36                                          |
+-----------------------------------------------------------------------------------+
| Kunci Jawaban : C (24)                                                            |
| Pedoman Penskoran: Setiap jawaban benar diberi skor 2.0, salah skor 0.             |
+-----------------------------------------------------------------------------------+
```

### 4.3. Kunci Jawaban & Pedoman Penskoran
Format 2 bagian:
1. **Matriks Kunci Pilihan Ganda & Isian Singkat:** Format tabel kompak 5 kolom per baris (1. C | 2. A | 3. D | 4. B | 5. C).
2. **Rubrik Holistik / Analitik untuk Soal Uraian / Esai:**
   - Kriteria capaian skor penuh, skor sebagian, dan skor minimal.
   - Total akumulasi bobot skor maksimal.

---

## 5. Pipeline Rendering Dokumen

Ruang Pintar menerapkan strategi **Dual Rendering Pipeline**:

```
                              [ Assessment Data Service ]
                                           │
                                           ▼
                             [ Administration Payload ]
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
     [ Client-Side Print Engine ]                       [ Server-Side PDF Engine ]
     - Next.js Web Route (/cetak/...)                   - Headless Chromium / PDF Generator
     - Academic Glass Print Theme                       - Batch Download (Zip Seluruh Kelas)
     - window.print() 1-klik                            - PDF Archiving untuk Akreditasi
     - Zero Server Latency                              - Automated Backup
```

---

## 6. Verifikasi & Rekomendasi Tahap Berikutnya

1. Komponen view cetak web murni (`/cbt/cetak/kisi-kisi/[id]`, `/cbt/cetak/naskah/[id]`, `/cbt/cetak/kartu/[id]`, `/cbt/cetak/kunci/[id]`) akan dibangun dengan stylesheet print terisolasi.
2. Tambahkan pengaturan printer default sekolah (A4 vs F4/Folio) pada preferensi sekolah (`KonfigurasiSistem`).
