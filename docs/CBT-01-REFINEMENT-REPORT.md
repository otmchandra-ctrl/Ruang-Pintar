# CBT-01 REFINEMENT REPORT
## Ruang Pintar — School Digital Operating Platform
### Audit Penyempurnaan Domain, Administrasi & Prioritas Implementasi Assessment Engine

| Metadata | Nilai Canonical |
| --- | --- |
| **Tahap / Sub-sistem** | STAGE CBT-01 — Assessment Engine Refinement Report |
| **Status Dokumen** | `READY FOR HUMAN REVIEW` |
| **Status Persetujuan Sebelumnya** | `APPROVED WITH REFINEMENT` |
| **Versi Dokumen** | 2.1 (Architectural Refinement) |
| **Tanggal Audit** | 7 Oktober 2026 |
| **Fokus Utama** | Kurikulum Merdeka, Administrasi Ujian Resmi, Kepemilikan Bank Soal, AI Assistant, dan Audit Prioritas MVP |

---

# 1. Ringkasan Eksekutif Hasil Penyempurnaan

Berdasarkan review dan arahan dari Human Project Owner pada **STAGE CBT-01**, arsitektur Assessment Engine Ruang Pintar disempurnakan dari sekadar "sistem pembuat ujian daring dan CBT player" menjadi **School Operational Assessment & Evaluation Platform** yang utuh.

Penyempurnaan ini berakar pada realitas operasional sekolah di Indonesia:
1. **Kurikulum Merdeka Bounded:** Asesmen sekolah tidak boleh terisolasi menjadi sekadar "Bab/Topik". Evaluasi harus memiliki akuntabilitas kurikulum yang sah: diturunkan dari Capaian Pembelajaran (CP), diukur melalui Tujuan Pembelajaran (TP), dinilai dengan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP), dirakit dalam Kisi-kisi Asesmen, bersumber dari Bank Soal, dan diselenggarakan melalui CBT atau asesmen hibrida.
2. **Kelengkapan Administrasi Ujian Resmi:** Guru dan sekolah di Indonesia diwajibkan oleh pengawas dinas, akreditasi, dan kurikulum untuk memiliki perangkat administrasi tertulis yang dapat dicetak: **Kisi-Kisi Ujian, Kartu Soal per butir, Naskah Soal Resmi ber-kop surat, Kunci Jawaban & Rubrik, Analisis Butir Soal, Daftar Hadir Peserta Ujian, dan Berita Acara Pelaksanaan Ujian**. Domain ini kini resmi menjadi kapabilitas inti Assessment Engine.
3. **Pemisahan Kepemilikan Bank Soal (Personal vs School):** Menghormati hak kekayaan intelektual guru (bank soal pribadi yang hanya dapat dilihat dan diedit pemiliknya) sekaligus membangun aset kurikulum bersama tingkat sekolah (*School Question Bank*) yang dapat dibagikan antarguru serumpun mata pelajaran dengan proteksi isolasi multi-tenant yang ketat.
4. **Peta Kapabilitas AI Assessment Assistant:** Menyiapkan blueprint kemampuan generatif (pembuatan kisi-kisi, draf soal, opsi pengecoh berkualitas, pembahasan, dan materi remedial) serta kapabilitas analitis (diagnosis ketuntasan TP, analisis daya pembeda, dan psikometri) tanpa melakukan implementasi prematur.
5. **Realokasi Prioritas Berbasis Konteks Sekolah Indonesia:** Menata ulang prioritas fitur teknis tinggi (seperti *Dynamic Rolling Token*, *Watchdog Strike Auto-Lock*, dan *Advanced Proctoring Cockpit*) yang dinilai terlalu berisiko dan prematur untuk MVP sekolah Indonesia, menggesernya ke Phase 2 dan Phase 3 agar MVP berfokus pada keandalan pengerjaan, ketahanan BYOD/sinyal drop, dan kelengkapan administrasi guru.

---

# 2. Matriks Penyempurnaan 5 Area Utama

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MATRIKS REFINEMENT STAGE CBT-01                                 │
├─────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ AREA PERBAIKAN          │ KONDISI SEBELUMNYA           │ KONDISI SETELAH PENYEMPURNAAN │
├─────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ 1. Alur Kurikulum       │ Terbatas pada Bab/Topik      │ Rantai Utuh: CP -> TP ->      │
│                         │ & Lingkup Materi             │ KKTP -> Blueprint -> Soal     │
├─────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ 2. Administrasi Ujian   │ Tidak ada naskah cetak       │ Lengkap: Kisi-kisi, Kartu     │
│                         │ & kelengkapan audit          │ Soal, Naskah, Kunci, Analisis,│
│                         │                              │ Daftar Hadir, Berita Acara    │
├─────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ 3. Kepemilikan Soal     │ Bank soal tercampur          │ Personal Bank vs School Bank  │
│                         │ per guru tanpa pemisahan     │ dengan kontrol izin & tenant  │
├─────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ 4. Asisten AI           │ Rencana ad-hoc parsial       │ Blueprint Domain Generatif    │
│                         │                              │ & Analitis Terpetakan Rapi    │
├─────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ 5. Prioritas MVP        │ Fitur ketat di awal          │ Diselaraskan: MVP (Stabilitas │
│                         │ (Rolling Token, Strike Lock) │ & Administrasi), P2, P3       │
└─────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

# 3. Rincian Penyempurnaan Tiap Pilar

### 3.1. Rantai Kurikulum & Assessment Blueprint
Sistem menetapkan hierarki rantai evaluasi akademik:
```text
Capaian Pembelajaran (CP) [Fase/Jenjang]
           ↓
Tujuan Pembelajaran (TP) [Semester/Rombel]
           ↓
Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) [Indikator & Interval Tuntas]
           ↓
Blueprint Asesmen / Kisi-Kisi [Level Kognitif, Bentuk Soal, Bobot Skor]
           ↓
Bank Soal [Butir Soal, Versi Soal, Stimulus Media, Opsi & Kunci]
           ↓
CBT / Sesi Pelaksanaan Asesmen [Snapshot Ujian, Lembar Jawaban, Autograding]
```
Dengan rantai ini:
- Setiap butir soal dalam bank soal maupun ujian CBT wajib memiliki tautan balik (*lineage traceability*) minimal ke **Tujuan Pembelajaran (TP)** dan **Capaian Pembelajaran (CP)**.
- Nilai yang diperoleh siswa tidak lagi sekadar angka agregat mata pelajaran, melainkan langsung menghasilkan peta diagnosis: *"Kompetensi TP mana yang telah tuntas optimal dan TP mana yang membutuhkan bimbingan khusus."*

### 3.2. Administrasi Ujian Resmi Sekolah (Assessment Administration)
Menjawab kebutuhan supervisi sekolah, Penilaian Akhir Semester, dan akreditasi:
1. **Kisi-Kisi Ujian:** Dokumen matriks standar yang memetakan KD/CP, TP, materi pokok, indikator soal, level kognitif (L1: Pengetahuan/Pemahaman, L2: Aplikasi, L3: Penalaran/HOTS), bentuk soal, dan nomor butir soal.
2. **Kartu Soal:** Format dokumen satu lembar per butir soal yang memuat rumusan pertanyaan, stimulus, kunci jawaban, pedoman penskoran/rubrik, dan buku sumber rujukan.
3. **Naskah Soal Resmi:** Format cetak dokumen naskah soal ber-kop surat resmi sekolah, petunjuk umum, petunjuk khusus, dan tata letak dua kolom hemat kertas siap cetak atau ekspor PDF.
4. **Kunci Jawaban & Pedoman Penskoran:** Dokumen panduan koreksi yang memuat daftar kunci objektif dan rubrik penilaian esai bertingkat.
5. **Daftar Hadir Peserta Ujian:** Lembar kehadiran terintegrasi yang mencatat kehadiran fisik maupun digital peserta didik di ruang ujian per sesi.
6. **Berita Acara Pelaksanaan Ujian:** Lembar laporan resmi pengawas ruang yang mendokumentasikan waktu mulai/selesai, jumlah peserta hadir/absen, catatan kendala teknis, dan tanda tangan pengawas ruang serta kepala sekolah.

### 3.3. Dual Ownership Bank Soal (Personal vs School)
Menghilangkan konflik antara privasi guru dan kebutuhan kolaborasi kurikulum:
1. **Personal Question Bank:**
   - Dibuat dan dimiliki oleh guru individu.
   - **Visibilitas Privat:** Hanya guru pembuat yang dapat melihat, mengubah, menduplikasi, atau mengarsipkan butir soal.
   - Tetap terikat pada tenant sekolah guru aktif (`sekolah_id`).
2. **School Question Bank (Aset Institusi):**
   - Guru dapat mengusulkan atau menyalin butir soal dari bank pribadi ke Bank Soal Sekolah.
   - Dikelola bersama oleh Koordinator Musyawarah Guru Mata Pelajaran (MGMP) Sekolah atau Wakasek Kurikulum.
   - Guru pengampu mata pelajaran serumpun dalam satu sekolah dapat menggunakan butir-butir soal tersebut untuk merakit ujian kelas masing-masing tanpa mengubah naskah asli (*read-only reuse*).

### 3.4. AI Assessment Assistant Capability Framework
Blueprint domain disiapkan untuk 2 fungsi utama:
- **Kemampuan Generatif:** Pembuatan kisi-kisi terstruktur dari dokumen TP/CP, generator butir soal bervariasi dengan stimulus, pembuatan pilihan pengecoh (*distractor generator*) yang masuk akal (*plausible*), pembuatan rubrik dan pembahasan detail, serta generator paket soal remedial setara.
- **Kemampuan Analitis:** Analisis ketuntasan kompetensi TP kelas, diagnosis efektivitas opsi pengecoh, deteksi butir soal bias atau cacat logika, dan rekomendasi perbaikan instrumen evaluasi.

### 3.5. Realokasi Prioritas Implementasi Berbasis Sekolah Indonesia
Hasil audit lapangan terhadap tantangan sekolah di Indonesia membuktikan bahwa:
- Memasang *Watchdog Strike 3x Lock* pada MVP akan menyebabkan kegagalan adopsi karena tingginya interupsi notifikasi WA/baterai pada ponsel siswa (BYOD), yang akan membuat pengawas ruang panik membuka kunci puluhan siswa secara serentak.
- *Dynamic Rolling Token* 15 menit berpotensi mengunci siswa yang terlambat atau mengalami lag sinyal Wi-Fi sekolah.
- Oleh karena itu, **MVP diprioritaskan pada**: Kestabilan pengerjaan, autosave tangguh tahan mati lampu, timer server-authoritative, token sesi standar, autograding objektif, administrasi ujian lengkap siap cetak, dan buku nilai terintegrasi.
- Fitur anti-cheat ketat dan proctoring layar penuh dialokasikan secara realistis pada **Phase 2 dan Phase 3**.

---

# 4. Dokumen Hasil Penyempurnaan yang Dihasilkan

Empat dokumen canonical baru dan diperbarui telah tersedia di repositori:
1. [CBT-01-REFINEMENT-REPORT.md](file:///C:/laragon/www/Ruang-Pintar/CBT-01-REFINEMENT-REPORT.md) (Dokumen ini)
2. [UPDATED-ASSESSMENT-ENGINE-BLUEPRINT.md](file:///C:/laragon/www/Ruang-Pintar/UPDATED-ASSESSMENT-ENGINE-BLUEPRINT.md) (Cetak biru arsitektur terpadu dengan 8 Bounded Contexts)
3. [UPDATED-ASSESSMENT-DOMAIN-MODEL.md](file:///C:/laragon/www/Ruang-Pintar/UPDATED-ASSESSMENT-DOMAIN-MODEL.md) (Model domain, agregat baru, invariant, dan state machines)
4. [IMPLEMENTATION-PRIORITY-MATRIX.md](file:///C:/laragon/www/Ruang-Pintar/IMPLEMENTATION-PRIORITY-MATRIX.md) (Matriks komparasi bertingkat MVP, Phase 2, Phase 3)

---

# 5. Rekomendasi Langkah Selanjutnya

Dengan tuntasnya penyempurnaan dokumen arsitektur ini, tim pengembang memiliki fondasi yang kuat, realistis, dan berorientasi pada kebutuhan nyata sekolah di Indonesia. 

Langkah berikutnya setelah dokumen ini ditinjau dan disetujui adalah melangkah ke **STAGE CBT-02: Implementasi Fondasi Bank Soal & Administrasi Asesmen (Tahap MVP)**.

**STATUS: READY FOR HUMAN REVIEW**
