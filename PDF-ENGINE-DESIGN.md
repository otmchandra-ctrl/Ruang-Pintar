# PDF & PRINT ENGINE DESIGN
## School Official Documents Print Engine Architecture

| Metadata | Nilai |
| --- | --- |
| **Document Version** | 1.0 (Canonical Print Engine Architecture) |
| **Stage Alignment** | STAGE CBT-03 — Assessment Administration Implementation |
| **Engine Strategy** | Native CSS Paged Media + Pure Web Standard Printing (Zero Heavy Sidecar) |
| **Output Standard** | ISO 216 A4 (Portrait & Landscape), Standard Printer Margin (15mm - 22mm) |

---

## 1. Architectural Philosophy

Sistem cetak dokumen sekolah di Indonesia sering kali menghadapi tantangan:
1. **Printer Variatif:** Printer sekolah di Indonesia berkisar dari printer laser berkecepatan tinggi, printer inkjet kantor, hingga printer fotokopi mini. Margin fisik printer sering memotong teks jika margin CSS terlalu kecil.
2. **Page Break Horrors:** Stimulus soal atau tabel terpotong di tengah kalimat atau gambar terpisah dari pertanyaannya.
3. **Heavy Binary Bloat:** Menjalankan Puppeteer/Chromium headless di server Next.js lokal menimbulkan beban RAM tinggi (200MB - 500MB per render) dan sering bermasalah di hosting VPS resource-terbatas.

**Keputusan Arsitektur Ruang Pintar:**
Menggunakan **Native CSS Paged Media Standard** (`@page`, `@media print`, CSS Multi-column, dan `break-inside: avoid`). Engine ini berjalan 100% instan di browser guru/staf sekolah tanpa dependensi server yang berat, namun menghasilkan output PDF cetak beresolusi tinggi, pixel-perfect, dan memenuhi standar administrasi pendidikan nasional.

---

## 2. Standard Document Formats & Paged Media Rules

| Dokumen | Orientasi | Margin `@page` | Struktur Layout | Aturan Anti-Terpotong |
| --- | :---: | :---: | --- | --- |
| **1. Kisi-Kisi Asesmen** | A4 Landscape | `15mm 15mm 15mm 22mm` *(kiri 22mm untuk lubang arsip/stapler)* | Single Table Matrix | `thead { display: table-header-group; }` (Header tabel berulang otomatis di setiap halaman baru) |
| **2. Kartu Soal Asesmen** | A4 Portrait | `15mm 15mm 18mm 18mm` | Modular Card Box | `.kartu-soal-card { break-inside: avoid; }` (Satu butir soal tidak boleh pecah antar halaman) |
| **3. Naskah Soal Ujian** | A4 Portrait | `15mm 12mm 15mm 15mm` | 2 Kolom (`column-count: 2`) | `.naskah-item { break-inside: avoid; }` (Soal tidak patah di tengah kolom) |
| **4. Kunci Jawaban & Rubrik** | A4 Portrait | `15mm 15mm 15mm 18mm` | Matrix & Rubric Box | `tr { break-inside: avoid; }`, Watermark Rahasia |
| **5. Daftar Hadir Peserta** | A4 Portrait | `15mm 15mm 15mm 18mm` | Alternating Signature Table | Zig-zag tanda tangan ganjil-genap, 2 kolom pengawas di footer |
| **6. Berita Acara Ujian** | A4 Portrait | `15mm 15mm 15mm 18mm` | Formal Minutes & Narrative | Narasi resmi, rekapitulasi kehadiran, 2 kolom pengawas |

---

## 3. School Letterhead Engine (Kop Fleksibel)

### 3.1. Hierarki Kop Sekolah
Kop surat resmi sekolah di Indonesia terbagi dalam 3 format utama yang didukung secara dinamis oleh `SchoolLetterhead`:

1. **Format Negeri Bertingkat (Dinas Pendidikan):**
   - Baris 1: `PEMERINTAH PROVINSI JAWA BARAT`
   - Baris 2: `DINAS PENDIDIKAN`
   - Baris 3: `CABANG DINAS PENDIDIKAN WILAYAH VII`
   - Nama Satuan: `SMK NEGERI 1 CONTOH`
2. **Format Swasta / Yayasan:**
   - Baris 1: `YAYASAN PENDIDIKAN NUSANTARA`
   - Baris 2: `BADAN PENGURUS PENDIDIKAN DASAR & MENENGAH`
   - Nama Satuan: `SMA NUSANTARA UNGGUL`
3. **Format Madrasah / Kemenag:**
   - Baris 1: `KEMENTERIAN AGAMA REPUBLIK INDONESIA`
   - Baris 2: `KANTOR KEMENTERIAN AGAMA KOTA BANDUNG`
   - Nama Satuan: `MADRASAH ALIYAH NEGERI 1`

### 3.2. Garis Pembatas Kop Resmi (Double Rule Line)
Standar tata naskah dinas Indonesia mewajibkan garis pembatas ganda di bawah kop surat:
```html
<div class="h-[2px] bg-black w-full" />
<div class="h-[0.75px] bg-black w-full mt-[2px]" />
```
Garis pertama tebal (2px) dan garis kedua tipis (0.75px) berwarna hitam solid.

---

## 4. Anti-Page Break & Zero Overflow Protection

### 4.1. Repeating Header pada Tabel Landscape (Kisi-Kisi)
Saat kisi-kisi memiliki 40 butir soal dan memanjang hingga 3-4 lembar kertas, kepala tabel wajib muncul kembali di setiap lembar baru:
```css
@media print {
  .kisi-kisi-table thead {
    display: table-header-group;
  }
  .kisi-kisi-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

### 4.2. Layout Naskah 2 Kolom Efisien
Standar naskah soal ujian nasional (UN/Asesmen Standar) menggunakan 2 kolom per halaman A4 untuk menghemat kertas fotokopi sekolah:
```css
@media print {
  .naskah-two-columns {
    column-count: 2 !important;
    column-gap: 8mm !important;
    column-rule: 0.5px solid #000000 !important;
  }
  .naskah-item {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 12px !important;
  }
}
```
Aturan `break-inside: avoid` pada setiap butir menjamin butir soal beserta stimulus dan opsinya tidak pernah terbelah antara kolom kiri dan kolom kanan atau antar halaman.

---

## 5. Physical Document Integrity: SHA-256 Seal

Untuk mencegah kebocoran soal fisik atau manipulasi kunci jawaban:
1. **Deterministic Canonical JSON Hashing:**
   Object snapshot dinormalisasi urutan kuncinya (`canonicalize`) sebelum di-hash menggunakan SHA-256.
2. **Physical Seal Code:**
   Naskah soal dan kunci jawaban menyertakan kode segel fisik di kop dan footer:
   ```text
   RP-SNAP-E3B0C442-2026
   ```
   Pengawas dan pemeriksa dapat memverifikasi bahwa naskah fisik yang dicetak di ruang ujian bersesuaian dengan snapshot terdaftar di sistem.
