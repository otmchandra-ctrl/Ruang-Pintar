# CBT-03.5 — RESIDUAL RISK REGISTER & OPERATIONAL CONTINGENCY MATRIX
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Tahap** | STAGE CBT-03.5 — REGISTRASI RISIKO RESIDUAL PILOT SEKOLAH |
| **Lifecycle Gate** | Pre-Flight Production Pilot Gate |
| **Status Risiko Software** | **SEMUA RISIKO PERANGKAT LUNAK (RSK-01 s/d RSK-08) CLOSED / MITIGATED** |
| **Fokus Dokumen** | Manajemen Risiko Residual Lapangan (Infrastruktur, Jaringan, Daya & Operasional) |

---

## 1. Status Evaluasi Risiko Perangkat Lunak (CBT-03.3 ➔ CBT-03.5)

| Risk ID | Deskripsi Risiko Awal (CBT-03.3) | Tingkat Awal | Status CBT-03.5 | Resolusi Teknis yang Diterapkan |
| :---: | :--- | :---: | :---: | :--- |
| **RSK-01** | Jawaban offline di `localStorage` berpotensi hilang jika submit ditekan saat koneksi baru pulih. | **BLOCKER (9)** | **CLOSED (0)** | Pre-Submit Synchronization Barrier menahan submit hingga seluruh buffer tersinkron ke server. |
| **RSK-02** | False positive cheat alert Android akibat keyboard virtual memicu deteksi split-screen. | **BLOCKER (9)** | **CLOSED (0)** | VisualViewport API + 1500ms cooldown pasca-blur input. |
| **RSK-03** | Autosave bottleneck akibat 5 query DB dan parsing JSON manifest ratusan KB. | **TINGGI (6)** | **CLOSED (0)** | Pipeline cepat `saveAnswerOptimized` (1 minimal SELECT + 1 UPSERT, zero JSON parsing). |
| **RSK-04** | Ketiadaan single device lock memungkinkan joki ujian real-time di dua perangkat. | **TINGGI (6)** | **CLOSED (0)** | `token_sesi_aktif` ULID dinamis. Login perangkat kedua menginvalidasi sesi sebelumnya secara instan. |
| **RSK-05** | Timer visual drift akibat background tab throttling pada browser HP. | **TINGGI (6)** | **CLOSED (0)** | Absolute server deadline timestamp math + visibilitychange re-sync. |
| **RSK-06** | Potensi bypass token jika konfigurasi `token_masuk` null. | **SEDANG (4)** | **CLOSED (0)** | Validasi ketat di `verifyExamTokenAction` dan skema Zod. |
| **RSK-07** | Layout grid nomor soal bertumpuk di bawah lembar soal pada layar mobile. | **SEDANG (3)** | **CLOSED (0)** | Drawer navigator melayang (sheet navigation) dengan akses cepat 1 tap. |
| **RSK-08** | Aksesibilitas icon button kurang atribut `aria-label`. | **RENDAH (2)** | **CLOSED (0)** | Seluruh elemen interaktif dilengkapi label aksesibilitas standar WCAG. |

---

## 2. Registrasi Risiko Residual Lapangan (School Pilot Operational Risks)

Meskipun perangkat lunak 100% siap, penerapan di lingkungan fisik sekolah nyata menghadirkan tantangan infrastruktur dan lingkungan:

| Residual Risk ID | Kategori | Deskripsi Risiko Lapangan | Probabilitas | Dampak | Tingkat Risiko | Status Penanganan |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **RES-01** | **Infrastruktur Jaringan** | **Kejenuhan Access Point Wi-Fi Sekolah (DHCP Exhaustion / Wi-Fi Jamming)**: Satu AP rumahan dipaksa melayani > 40 siswa serentak, menyebabkan sinyal drop massal. | Tinggi (3) | Tinggi (3) | **TINGGI (9)** | SOP Jaringan & Rekomendasi AP Wajib |
| **RES-02** | **Catu Daya Listrik** | **Pemadaman Listrik / Server Mati Mendadak Tanpa UPS**: Listrik sekolah padam mendadak saat ujian tengah berlangsung. | Sedang (2) | Tinggi (3) | **TINGGI (6)** | Wajib Pasang UPS Mini Server & Offline LocalStorage Buffer |
| **RES-03** | **Sinkronisasi Waktu** | **NTP Clock Skew pada Server Sekolah**: Jam internal server lokal melenceng dari waktu riil karena tidak ada koneksi internet luar / NTP server mati. | Sedang (2) | Sedang (2) | **SEDANG (4)** | Auto-Sync NTP Script saat booting server |
| **RES-04** | **Kapasitas Penyimpanan** | **Disk Full Akibat File Log / Backup Menumpuk**: Server kehabisan ruang disk saat ujian berlangsung. | Rendah (1) | Kritis (3) | **SEDANG (3)** | Pre-Flight Disk Health Check minimal 10 GB free space |
| **RES-05** | **Kompatibilitas Client** | **Smartphone Siswa Menggunakan Browser Sangat Usang**: Android WebView versi lama (< Android 8) tidak mendukung API modern. | Sedang (2) | Sedang (2) | **SEDANG (4)** | Syarat Minimum Browser Chrome 90+ / Safari iOS 15+ |

---

## 3. Matriks Keparahan & Probabilitas Risiko Residual

```text
       DAMPAK
       ▲
Kritis │                   [RES-04]          [RES-01]
 (3)   │
       │
Sedang │                   [RES-03, RES-05]  [RES-02]
 (2)   │
       │
Rendah │
 (1)   │
       └────────────────────────────────────────────────►
           Rendah (1)         Sedang (2)       Tinggi (3)   KEMUNGKINAN
```

---

## 4. Protokol Mitigasi & Panduan Kontinjensi (Playbook Proktor & IT Sekolah)

### Mitigasi RES-01: Protokol Jaringan Wi-Fi Sekolah
- **SOP:**
  1. Sekolah DILARANG menggunakan router Wi-Fi rumahan (tipe SOHO standar operator) untuk 1 ruangan penuh.
  2. Gunakan Access Point kelas bisnis (misal: Ruijie Reyee, Ubiquiti UniFi, atau MikroTik cAP) dengan kapasitas minimal 60 concurrent user per AP.
  3. Alokasikan subnet DHCP dengan *lease time* pendek (misal: 2 jam) dan range IP luas (misal: `/23` atau 500 IP pool).
  4. Nonaktifkan akses internet publik (YouTube, medsos) selama jam ujian berlangsung melalui filter firewall router untuk memprioritaskan paket data CBT lokal.

### Mitigasi RES-02: Protokol Catu Daya Server
- **SOP:**
  1. Server CBT sekolah WAJIB terhubung ke perangkat UPS (*Uninterruptible Power Supply*) dengan kapasitas minimal 600 VA (tahan 20–30 menit).
  2. Apabila server mati mendadak, data jawaban siswa tetap aman karena:
     - SQLite WAL mencatat mutasi atomik hingga transaksi terakhir.
     - Sisa jawaban di browser siswa tersimpan di `localStorage`.
     - Ketika server hidup kembali, siswa cukup me-refresh halaman dan sistem otomatis menyinkronkan data yang tertunda.

### Mitigasi RES-03: Protokol Sinkronisasi Jam (NTP)
- **SOP:**
  1. Sebelum ujian dibuka, teknisi sekolah wajib menjalankan perintah kalibrasi waktu:
     ```bash
     w32tm /resync # Windows Server
     # atau
     chronyc makestep # Linux Server
     ```
  2. Pastikan selisih waktu server dengan jam internet tidak melebihi 1 detik.

### Mitigasi RES-04: Protokol Pemeriksaan Ruang Disk
- **SOP:**
  1. Jalankan script pra-ujian untuk memastikan ruang disk server tersisa minimal 10 GB.
  2. Lakukan backup berkala ke media penyimpanan eksternal (USB Drive) setelah setiap sesi ujian selesai:
     ```bash
     # Contoh backup database aman SQLite
     sqlite3 prisma/dev.db ".backup 'backups/cbt_backup_sesi_1.db'"
     ```

### Mitigasi RES-05: Protokol Standar Perangkat Siswa
- **SOP:**
  1. Sosialisasi H-3 kepada siswa dan orang tua: perangkat yang digunakan wajib memiliki browser Google Chrome minimal versi 90 atau Safari iOS 15+.
  2. Sekolah menyediakan 10–15 unit laptop cadangan di laboratorium komputer untuk memfasilitasi siswa yang mengalami kendala teknis pada gawai pribadi (*BYOD contingency stock*).
