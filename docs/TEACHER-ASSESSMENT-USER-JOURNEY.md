# TEACHER ASSESSMENT USER JOURNEY
## Ruang Pintar — School Digital Operating Platform
### STAGE CBT-01.1: Pemetaan Pengalaman Pengguna, Beban Kognitif & Mental Model Guru Indonesia

| Metadata | Nilai Canonical |
| --- | --- |
| **Produk / Sub-sistem** | Ruang Pintar — Teacher Assessment User Journey Mapping |
| **Kode Tahap** | `STAGE CBT-01.1` |
| **Status Dokumen** | `READY FOR HUMAN REVIEW` |
| **Klasifikasi Modul** | User Experience & Mental Model Design |
| **Versi Dokumen** | 1.0 (Comprehensive Teacher Journey) |
| **Tanggal Terbit** | 7 Oktober 2026 |
| **Fokus Utama** | *Empati pada Guru Indonesia*, *Pengurangan Beban Kognitif*, *Mitigasi Stres Ruang Ujian*, *Penyederhanaan Administrasi* |

---

# 1. Persona Guru Indonesia

Untuk memastikan antarmuka Assessment Engine benar-benar membumi dan dapat dipakai oleh ribuan sekolah di Indonesia, desain mengacu pada 3 persona representatif:

```text
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ PERSONA 1: PAK BUDI             │ PERSONA 2: IBU SITI             │ PERSONA 3: MAS FAJAR            │
│ (Guru Kejuruan/MIPA Senior)     │ (Guru Bahasa Indonesia/Inggris) │ (Guru Honorer Muda Adaptif)     │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ • Usia: 52 Tahun, Mengajar 24 Th│ • Usia: 41 Tahun, Mengajar 15 Th│ • Usia: 26 Tahun, Mengajar 2 Th │
│ • Tantangan: Tidak suka aplikasi│ • Tantangan: Butuh stimulus teks│ • Tantangan: Mobilitas tinggi,  │
│   yang berbelit-belit. Sering   │   cerita panjang, soal audio    │   mengajar di 3 sekolah, sering │
│   dimintai dokumen administrasi │   listening, dan lelah mengoreksi│  mengakses sistem dari ponsel   │
│   cetak oleh pengawas dinas.    │   puluhan esai manual di malam. │   Android di sela jadwal.       │
│ • Harapan: Sekali buat soal,    │ • Harapan: Sistem autograding   │ • Harapan: Semuanya serba cepat │
│   kisi-kisi & naskah ujian PDF  │   yang adil, koreksi esai tanpa │   lewat HP, transfer nilai ke   │
│   langsung beres otomatis.      │   bikin pusing, bebas plagiat.  │   rapor dalam hitungan detik.   │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

---

# 2. Mental Model Guru Indonesia & Titik Frustrasi (*Pain Points*)

Dalam pengamatan lapangan di sekolah-sekolah Indonesia, guru mengalami titik stres tertinggi pada 3 situasi:
1. **Ketakutan Saat Ujian Berlangsung (Exam Day Panic):** Guru takut HP siswa error, token tidak bisa dimasukkan, Wi-Fi sekolah putus, atau siswa tiba-tiba terkunci karena salah tekan tombol. Guru tidak ingin dipermalukan di depan kelas karena sistem macet.
2. **Kelelahan Administrasi Fisik:** Menjelang akreditasi atau ujian semester, guru harus begadang mengetik format tabel Kisi-Kisi di Microsoft Word, menyusun Kartu Soal satu per satu, dan membuat format Berita Acara.
3. **Kelelahan Rekap Nilai:** Menghitung manual persentase bobot pilihan ganda dan esai, lalu memindahkan angka satu per satu dari kertas ke aplikasi e-Rapor dinas.

---

# 3. Peta Perjalanan Pengguna 11 Fase (End-to-End Journey Map)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        JOURNEY MAP GURU: DARI PERSIAPAN HINGGA PEMBUKUAN RAPOR                         │
├───────────────┬──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ FASE & TUJUAN │ TINDAKAN GURU (ACTION)   │ TITIK FRUSTRASI (PAIN POINT)│ SOLUSI RUANG PINTAR (DELIGHT) │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 1. Dashboard  │ Guru membuka platform    │ Bingung mana asesmen aktif  │ Hero Card langsung menampilkan│
│    Asesmen    │ sebelum jam pertama      │ dan kelas mana yang belum   │ status ujian hari ini & antre-│
│               │ dimulai.                 │ dinilai.                    │ an butir esai belum dikoreksi.│
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 2. Bank Soal  │ Menyiapkan butir soal    │ Mengetik rumus matematika   │ Palet visual KaTeX 1-klik,    │
│    & Konten   │ matematika & bacaan.     │ dan teks Arab rumit. Soal   │ tempel gambar clipboard (Ctrl+│
│               │                          │ lama sering hilang tercecer.│ V), folder Bab terorganisir.  │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 3. Kisi-Kisi  │ Merumuskan indikator TP  │ Mengetik format matriks     │ Otomatis terhubung ke CP & TP.│
│    Kurikulum  │ sesuai Kurikulum Merdeka │ kisi-kisi tabel Word manual │ Tersedia tombol: "AI Draf     │
│               │                          │ yang memakan waktu berjam2. │ Kisi-Kisi Otomatis dari TP".  │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 4. Perakitan  │ Memilih butir soal untuk │ Lelah memilih 30-40 soal    │ Opsi "Rakit dari Kisi-Kisi":  │
│    Paket Ujian│ jadwal ulangan harian.   │ satu per satu secara manual.│ sistem otomatis memilih soal  │
│               │                          │                             │ sesuai sebaran tingkat kesukaran│
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 5. Penjadwalan│ Menentukan durasi waktu  │ Takut salah pilih kelas atau│ Formulir sederhana 1 layar    │
│    & Rombel   │ dan target rombel kelas. │ jam ujian bentrok.          │ dengan pemilih rombel jelas   │
│               │                          │                             │ dan durasi waktu menit bulat. │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 6. Publikasi  │ Menekan tombol terbitkan │ Takut naskah soal bocor ke  │ Snapshot langsung dibekukan;  │
│    & Token    │ dan rilis token ujian.   │ kelas lain sebelum hari H.  │ token 6-karakter aman dibagikan│
│               │                          │                             │ saat siswa sudah di kelas.    │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 7. Monitoring │ Mengawasi 36 siswa di    │ Siswa panik karena HP mati  │ Live Cockpit di HP guru! Cukup│
│    (Proctor)  │ dalam ruang kelas.       │ atau sinyal drop.           │ tekan tombol "Reset Sesi HP"  │
│               │                          │                             │ jawaban siswa pulih 100%!     │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 8. Evaluasi   │ Menilai hasil jawaban    │ Memeriksa esai butir per    │ Blind Grading Workspace:     │
│    & Koreksi  │ siswa setelah ujian usai.│ butir memicu bias subjektif │ nama siswa disamarkan; skor PG│
│               │                          │ dan memakan waktu malam hari│ tuntas otomatis < 1 detik.    │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 9. Analitik   │ Melihat performa kelas   │ Tidak tahu soal mana yang   │ Grafik psikometri ilmiah:     │
│    Psikometri │ dan ketuntasan KKTP.     │ cacat / membingungkan siswa.│ Peringatan otomatis untuk soal│
│               │                          │                             │ cacat & daftar nama remedial. │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 10.Administrasi│ Menyerahkan berkas ke   │ Mengetik berita acara dan   │ 1-Klik Cetak PDF resmi ber-kop│
│    Supervisi  │ panitia & kepala sekolah.│ naskah soal ber-kop surat.  │ surat sekolah (Kisi-kisi,     │
│               │                          │                             │ Berita Acara, Naskah Soal).   │
├───────────────┼──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 11.Buku Nilai │ Memasukkan nilai ke buku │ Menginput nilai satu per    │ Tombol emas: "Bukukan ke Buku │
│    & Rapor    │ rapor semester.          │ satu ke leger nilai.        │ Nilai" -> skor masuk ke rapor │
│               │                          │                             │ dan e-Rapor Kurikulum Merdeka!│
└───────────────┴──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

# 4. Skenario Perjalanan Berdasarkan Perangkat (Device Journeys)

### 4.1. Desktop Journey (Laptop di Ruang Guru atau Rumah)
- **Konteks:** Guru duduk dengan layar lebar (13–15 inci), mouse/trackpad, dan koneksi internet stabil.
- **Aktivitas Optimal:**
  - Menyusun naskah soal baru, mengetik formula matematika KaTeX, menempelkan stimulus gambar.
  - Memeriksa matriks kisi-kisi dan mengoreksi jawaban esai dengan tampilan dua kolom (*split view*).
  - Mengunduh paket dokumen administrasi PDF resmi untuk dicetak di printer sekolah.

### 4.2. Mobile Journey (Smartphone di Ruang Kelas Nyata)
- **Konteks:** Guru berdiri atau berkeliling di lorong meja siswa sambil memegang ponsel Android.
- **Aktivitas Optimal:**
  - Mengumumkan Token Masuk yang tertera besar di header ponsel.
  - Melirik status siswa yang sedang mengerjakan nomor soal berapa.
  - Menekan tombol jempol **Reset Sesi** ketika ada siswa yang baterai ponselnya drop, tanpa perlu membuka laptop.
  - Mengakhiri sesi ujian saat bel berbunyi dengan menekan tombol **Kumpulkan Semua Peserta**.

---

# 5. Prinsip Emosional: Mengubah Frustrasi Menjadi Rasa Tenang

1. **Jaminan Keamanan Data (Zero Panic):** Setiap kali siswa memilih jawaban, layar pengawas guru memperbarui status jawaban tersimpan. Guru tidak perlu khawatir listrik padam merusak hasil ujian.
2. **Pemberdayaan Guru (Empowerment, Bukan Otomasi Buta):** Asisten AI hadir hanya untuk menyodorkan draf (kisi-kisi, draf soal, rekomendasi remedial). Guru tetap memegang kendali 100% untuk menyetujui, mengedit, atau menolak.
3. **Kebanggaan Profesionalisme Administrasi:** Dokumen PDF yang dihasilkan memiliki tipografi elegan, kop surat institusi resmi, dan format standar Dapodik/Kemendikbud, membuat guru merasa bangga saat menyerahkannya ke kepala sekolah atau pengawas dinas.

---
*Dokumen ini merupakan bagian resmi dari STAGE CBT-01.1 dan siap untuk ditinjau oleh Human Project Owner.*
