# DOCX EXPORT FEASIBILITY STUDY
## Studi Kelayakan Ekspor Dokumen Administrasi Asesmen ke Format Microsoft Word (.docx)

| Parameter Studi | Nilai |
| --- | --- |
| **Document Identity** | FEASIBILITY-STUDY-DOCX-01 |
| **Target System** | Ruang Pintar Assessment Administration Engine (M13) |
| **Objective** | Menganalisis trade-off teknis, keandalan, keamanan, dan integritas dokumen dalam mendukung format `.docx` |
| **Status Keputusan** | **RECOMMENDATION SUBMITTED (Awaiting Human Approval)** |

---

## 1. Latar Belakang & Kebutuhan Lapangan

Guru di sekolah Indonesia sangat akrab dengan Microsoft Word (.docx). Kebutuhan mengunduh berkas `.docx` sering kali dilatarbelakangi oleh:
1. Format template dinas/pengawas yang sering berubah mendadak tanpa pemberitahuan.
2. Kebiasaan guru menambahkan catatan kaki manual, tanda tangan basah, atau menyesuaikan margin spesifik printer lama.
3. Kebutuhan menyatukan naskah ke dalam dokumen portofolio cetak gabungan sekolah.

Namun, pengenalan fitur ekspor `.docx` menghadirkan risiko fundamental terhadap **Three-Tier Snapshot Immutability** dan keandalan sistem cloud multi-tenant.

---

## 2. Analisis 4 Pendekatan Arsitektur

### Pendekatan 1: Pure JavaScript `docx` / `docxtemplater` Library
- **Mekanisme:** Menggunakan package npm seperti `docx` (pembuat dokumen deklaratif via TypeScript) atau `docxtemplater` (XML substitution pada file template `.dotx`).
- **Kelebihan:**
  - 100% berjalan di lingkungan Node.js murni tanpa dependensi binary OS eksternal.
  - Ringan (overhead RAM minimal < 20MB per generasi).
  - Portabel antar OS (Windows dev server, Linux produksi, Docker container).
- **Kelemahan & Tantangan:**
  - **Layout Complexity High:** Naskah soal 2 kolom dengan stimulus gambar, formula matematika (KaTeX/LaTeX ke OMML Office Math), dan tabel kisi-kisi landscape sangat rumit dirender secara deklaratif via OOXML.
  - **High Maintenance:** Setiap perubahan desain tampilan web harus di-porting manual ke kode representasi DOCX (duplikasi logika rendering).

---

### Pendekatan 2: Headless Office Server (`libreoffice` / `soffice` CLI / Pandoc)
- **Mekanisme:** Mengonversi HTML/CSS naskah cetak ke `.docx` menggunakan instance headless LibreOffice di server backend.
- **Kelebihan:**
  - Memanfaatkan HTML yang sudah ada sehingga tidak perlu menulis ulang kode deklaratif DOCX.
- **Kelemahan & Tantangan:**
  - **Heavy OS Dependencies:** Memerlukan instalasi binary LibreOffice (~500MB - 1GB) pada server produksi.
  - **Process Spawning Overheads:** Menjalankan `child_process.execFile("soffice ...")` rentan memicu hanging process, memory leak, dan zombie process saat ribuan guru mencetak serentak menjelang ujian semester.
  - **Inkonsistensi Hasil Rendering:** HTML-to-DOCX conversion pada LibreOffice sering menghasilkan tabel berantakan, margin bergeser, dan font yang terdistorsi.

---

### Pendekatan 3: PDF Only via Native Web Standard (Implementasi Saat Ini)
- **Mekanisme:** Memanfaatkan W3C CSS Paged Media (`@page`, `@media print`, `break-inside: avoid`) yang dirender langsung oleh layout engine browser guru.
- **Kelebihan:**
  - **Zero Server Overhead:** Beban render 100% ditanggung client browser (server Next.js hanya mengirim payload JSON).
  - **Zero Binary Bloat:** Tidak membutuhkan Puppeteer, Chromium headless, maupun LibreOffice.
  - **Pixel-Perfect & Reproducible:** Tampilan cetak 100% identik di semua perangkat printer, tanpa risiko font bergeser.
  - **Strict Immutability:** Naskah PDF yang dicetak terikat permanen pada segel hash SHA-256 (`RP-SNAP-XXXXXXXX-YYYY`), menjamin naskah tidak dapat diubah secara sepihak setelah disetujui pimpinan.
- **Kelemahan:**
  - Guru tidak dapat mengedit kata demi kata di Microsoft Word setelah naskah di-generate.

---

### Pendekatan 4: Hybrid Architecture (Recommended Next Phase Strategy)
- **Mekanisme:**
  - **Primary (Real-Time):** Pertahankan **PDF Only via Native Browser Print Media** sebagai kanal utama (1-klik pratinjau & 1-klik cetak/PDF). Ini adalah standar baku untuk naskah ujian resmi, kunci jawaban rahasia, berita acara, dan daftar hadir.
  - **Secondary (Opt-in Download DOCX):** Untuk dokumen administratif kustom seperti *Kisi-Kisi* dan *Kartu Soal*, sediakan tombol terpisah `[ Unduh Format Word (.docx) ]` yang di-generate menggunakan library `docx` murni berbasis template resmi.
  - **Watermark Integritas:** File `.docx` yang diunduh menyertakan watermark teks permanen di footer: *"Dokumen Draf Ekspor — Versi Sah Tersegel Resmi Mengacu pada Segel SHA-256 di Ruang Pintar"*.

---

## 3. Matriks Perbandingan & Evaluasi

| Kriteria Evaluasi | Pure DOCX Lib | LibreOffice CLI | PDF Only (Current) | Hybrid Architecture |
| --- | :---: | :---: | :---: | :---: |
| **Kecepatan Render** | Cepat (< 1s) | Lambat (3-8s) | **Instan (0s server load)** | **Instan (PDF) / Cepat (DOCX)** |
| **Beban RAM Server** | Rendah (~30MB) | Sangat Tinggi (~400MB) | **Nol (0MB client-side)** | Rendah (~30MB) |
| **Kesesuaian Tata Letak A4** | Sedang | Rendah (Sering geser) | **Tinggi (Pixel-Perfect)** | Tinggi |
| **Formula & Gambar Stimulus** | Rumit (XML OMML) | Sering rusak | **Sempurna (KaTeX/HTML)** | Sempurna (PDF) |
| **Proteksi Anti-Kecurangan** | Lemah (Dapat diedit) | Lemah (Dapat diedit) | **Sangat Kuat (SHA-256 Sealed)** | Kuat (Dual Ledger) |
| **Kompatibilitas Hosting VPS** | Tinggi | Rendah (Perlu root/apt) | **100% Portabel** | **100% Portabel** |

---

## 4. Rekomendasi Final untuk Tim Engineering & Human Reviewer

1. **STAGE CBT-03 & CBT-03.1 (Rekomendasi Mutlak):**
   - **TETAPKAN PDF ONLY (NATIVE PRINT ENGINE).**
   - Jangan memasang binary LibreOffice atau library DOCX pada tahap stabilisasi fondasi ini.
   - Naskah Ujian, Kunci Jawaban, Berita Acara, dan Daftar Hadir adalah dokumen hukum yang **tidak boleh diedit di luar sistem** demi mencegah kebocoran soal dan kecurangan akreditasi.
2. **Roadmap Lanjutan (STAGE CBT-04+ / Add-on Utility):**
   - Jika pengguna sekolah secara masif menuntut ekspor Word untuk penyusunan RPP/Modul Ajar, implementasikan **Pendekatan 4 (Hybrid)** menggunakan package `docx` murni (tanpa LibreOffice) terbatas hanya pada dokumen *Kisi-Kisi* dan *Kartu Soal*, dengan menyematkan segel hash audit pada metadata dokumen Word.
