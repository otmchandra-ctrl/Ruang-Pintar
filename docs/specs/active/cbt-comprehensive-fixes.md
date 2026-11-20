# Spesifikasi CBT Engine & UI/UX Fixes (CBT-HOTFIX-01)

| Field | Nilai |
| --- | --- |
| **Feature** | CBT Fullscreen, Anti-Cheat Reload Safety, Autosave Data Integrity, High-Contrast UI/UX, Active Question Editing |
| **Status** | `active` |
| **Date** | 2026-10-13 |
| **Scope** | CBT Player, Proctor Cockpit, Snapshot Sync, Answer Deduplication |

## 1. Problem Statement
Pengguna melaporkan 6 masalah kritis pada modul CBT:
1. Layar tidak full screen secara default / tidak ada penegakan mode layar penuh yang benar.
2. Saat siswa me-refresh halaman (F5 / reload), sistem menganggapnya curang (strike keluar layar / pindah tab), sehingga siswa terkunci otomatis.
3. Soal ujian hanya 20 butir, namun siswa tercatat mengerjakan hingga 51/39/30 soal. Akibatnya seluruh nilai siswa menjadi 0 (Kosong: 20).
4. Tampilan UI/UX ujian siswa dan cockpit pemantauan proctor dinilai sangat buruk dan tidak nyaman digunakan.
5. Warna font soal tidak terbaca (teks putih/abu-abu terang di atas background putih akibat styling dark mode yang bocor).
6. Soal CBT yang aktif/diterbitkan tidak dapat diedit atau dikoreksi saat ditemukan kesalahan ketik/kunci jawaban.

## 2. Invariants & Guarantees
1. **Zero Answer Loss & Zero Duplicate Answers:** Setiap butir soal dalam satu sesi ujian hanya memiliki satu baris jawaban yang valid. Autosave bersifat idempoten terhadap `(sesi_ujian_id, soal_id)`.
2. **Safe Reload Guarantee:** Siswa yang me-refresh browser tidak boleh dicap sebagai pelanggaran kecurangan. Event `beforeunload` dan inisiasi reload tidak memicu strike.
3. **Enforced Fullscreen with Graceful Gate:** Ujian berlangsung dalam mode fullscreen. Jika keluar atau reload, sistem menampilkan modal gerbang fullscreen yang ramah tanpa hukuman instan.
4. **Legibility & High-Contrast Typography:** Seluruh teks soal dan opsi jawaban terbaca jelas 100% pada mode terang maupun mode gelap (rasio kontras WCAG AA/AAA).
5. **Live Exam Question Correction:** Guru/pengawas dapat mengoreksi teks soal, stimulus, opsi, dan kunci jawaban pada ujian yang sedang aktif, dan perubahan langsung tersinkronisasi ke snapshot aktif ujian.
6. **Accurate Grading & Data Repair:** Memperbaiki data jawaban dan nilai 13 siswa yang terdampak bug duplikasi pada ujian Latihan TKA RPL.

## 3. Acceptance Criteria
- [x] Layar CBT menampilkan Fullscreen Barrier saat pertama kali dibuka dan saat kembali dari refresh.
- [x] Me-refresh browser (F5) tidak menambah strike pelanggaran kecurangan.
- [x] Nilai dan jumlah soal yang dikerjakan siswa akurat sesuai jumlah soal pada ujian (20 soal = maksimal 20 dijawab).
- [x] Teks soal dan opsi kontras tinggi, terbaca sempurna di light dan dark mode.
- [x] Tersedia tombol dan modal "Koreksi Soal" di Proctor Cockpit & CBT Hub untuk ujian aktif.
- [x] Perbaikan snapshot sinkron ke seluruh sesi pengerjaan siswa.
- [x] Seluruh unit test CBT lulus 100%.
