/**
 * Ruang Pintar — Seeding Script: 20 Butir Soal Latihan TKA Kejuruan RPL
 * & Pembuatan Snapshot Ujian CBT untuk Kelas XII RPL
 */

import { PrismaClient } from "@prisma/client";
import { ulid } from "ulidx";
import crypto from "crypto";

const prisma = new PrismaClient();

// Data 20 Butir Soal Latihan TKA Lengkap
const SOAL_TKA = [
  {
    nomor: 1,
    kode: "TKA-RPL-001",
    judul: "Profesi Rekayasa Perangkat Lunak",
    pertanyaan:
      "Dalam sebuah perusahaan pengembang perangkat lunak, seseorang bertugas mengumpulkan kebutuhan pengguna, membuat dokumen kebutuhan sistem, dan menjembatani komunikasi antara pengguna dan programmer.\n\nProfesi yang paling sesuai adalah ...",
    opsi: [
      { id: "A", label: "A", teks: "UI Designer", urutan: 1 },
      { id: "B", label: "B", teks: "Programmer", urutan: 2 },
      { id: "C", label: "C", teks: "System Analyst", urutan: 3 },
      { id: "D", label: "D", teks: "Network Engineer", urutan: 4 },
      { id: "E", label: "E", teks: "Database Administrator", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "System Analyst bertugas menganalisis kebutuhan sistem, membuat spesifikasi kebutuhan perangkat lunak (SRS/FSD), dan menjembatani kebutuhan klien/pengguna dengan tim pengembang/programmer.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 2,
    kode: "TKA-RPL-002",
    judul: "Teknopreneurship Bidang IT",
    pertanyaan:
      "Seorang siswa membuat aplikasi kasir berbasis web dan menjualnya kepada UMKM di daerahnya.\n\nAktivitas tersebut merupakan contoh ...",
    opsi: [
      { id: "A", label: "A", teks: "Outsourcing", urutan: 1 },
      { id: "B", label: "B", teks: "Teknopreneurship", urutan: 2 },
      { id: "C", label: "C", teks: "Virtualisasi", urutan: 3 },
      { id: "D", label: "D", teks: "Refactoring", urutan: 4 },
      { id: "E", label: "E", teks: "Version Control", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Teknopreneurship adalah wirausaha yang memanfaatkan inovasi teknologi sebagai basis produk atau layanannya untuk memberikan solusi bernilai ekonomis kepada masyarakat.",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
  },
  {
    nomor: 3,
    kode: "TKA-RPL-003",
    judul: "Tahapan Siklus Pengembangan Perangkat Lunak (SDLC)",
    pertanyaan:
      "Perhatikan tahapan berikut:\n1. Pengujian\n2. Perencanaan\n3. Implementasi\n4. Analisis kebutuhan\n\nUrutan yang paling logis dalam pengembangan perangkat lunak adalah ...",
    opsi: [
      { id: "A", label: "A", teks: "2-4-3-1", urutan: 1 },
      { id: "B", label: "B", teks: "4-2-3-1", urutan: 2 },
      { id: "C", label: "C", teks: "4-3-2-1", urutan: 3 },
      { id: "D", label: "D", teks: "2-3-4-1", urutan: 4 },
      { id: "E", label: "E", teks: "1-2-3-4", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Siklus logis pengembangan perangkat lunak (SDLC) dimulai dari Analisis kebutuhan (4) -> Perencanaan/Desain (2) -> Implementasi/Coding (3) -> Pengujian/Testing (1).",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 4,
    kode: "TKA-RPL-004",
    judul: "Penerapan K3LH Bidang Komputer",
    pertanyaan:
      "Saat melakukan instalasi server, teknisi menggunakan sarung tangan antistatis untuk menghindari kerusakan komponen elektronik.\n\nTindakan tersebut merupakan penerapan ...",
    opsi: [
      { id: "A", label: "A", teks: "OOP", urutan: 1 },
      { id: "B", label: "B", teks: "K3LH", urutan: 2 },
      { id: "C", label: "C", teks: "TCP/IP", urutan: 3 },
      { id: "D", label: "D", teks: "Versioning", urutan: 4 },
      { id: "E", label: "E", teks: "Modularisasi", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "K3LH (Kesehatan, Keselamatan Kerja dan Lingkungan Hidup) mencakup prosedur keselamatan kerja bagi teknisi dan perlindungan perangkat keras dari kerusakan akibat listrik statis (ESD).",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
  },
  {
    nomor: 5,
    kode: "TKA-RPL-005",
    judul: "Aset Digital dalam Proyek Perangkat Lunak",
    pertanyaan: "Manakah yang termasuk aset digital dalam proyek perangkat lunak?",
    opsi: [
      { id: "A", label: "A", teks: "Meja kerja", urutan: 1 },
      { id: "B", label: "B", teks: "Kursi operator", urutan: 2 },
      { id: "C", label: "C", teks: "Source code aplikasi", urutan: 3 },
      { id: "D", label: "D", teks: "Lampu ruangan", urutan: 4 },
      { id: "E", label: "E", teks: "Rak penyimpanan", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Aset digital adalah data, berkas, atau informasi biner berharga dalam format digital, seperti kode sumber aplikasi (source code), skema basis data, dan dokumentasi digital.",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
  },
  {
    nomor: 6,
    kode: "TKA-RPL-006",
    judul: "Struktur Direktori Framework MVC",
    pertanyaan:
      "Folder berikut ditemukan dalam proyek framework (seperti Laravel):\n- `app/`\n- `database/`\n- `routes/`\n- `storage/`\n\nFungsi utama penggunaan struktur direktori tersebut adalah ...",
    opsi: [
      { id: "A", label: "A", teks: "Memperbesar ukuran program", urutan: 1 },
      { id: "B", label: "B", teks: "Mempermudah pengelolaan proyek", urutan: 2 },
      { id: "C", label: "C", teks: "Menambah kecepatan internet", urutan: 3 },
      { id: "D", label: "D", teks: "Mengurangi RAM", urutan: 4 },
      { id: "E", label: "E", teks: "Menghapus bug otomatis", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Struktur direktori standar memisahkan tanggung jawab (separation of concerns) sehingga mempermudah kolaborasi tim, pengelolaan komponen, dan pemeliharaan kode proyek jangka panjang.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 7,
    kode: "TKA-RPL-007",
    judul: "Fungsi Pengalamatan Jaringan (IP Address)",
    pertanyaan: "IP Address berfungsi untuk ...",
    opsi: [
      { id: "A", label: "A", teks: "Mengatur warna tampilan aplikasi", urutan: 1 },
      { id: "B", label: "B", teks: "Mengidentifikasi perangkat dalam jaringan", urutan: 2 },
      { id: "C", label: "C", teks: "Menyimpan program", urutan: 3 },
      { id: "D", label: "D", teks: "Membuat database", urutan: 4 },
      { id: "E", label: "E", teks: "Mengelola source code", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Internet Protocol (IP) Address merupakan alamat numerik unik yang mengidentifikasi setiap perangkat pada jaringan komputer agar dapat saling berkomunikasi.",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
  },
  {
    nomor: 8,
    kode: "TKA-RPL-008",
    judul: "Protokol Transport Jaringan (TCP vs UDP)",
    pertanyaan: "Protokol yang menjamin data diterima secara lengkap dan berurutan adalah ...",
    opsi: [
      { id: "A", label: "A", teks: "UDP", urutan: 1 },
      { id: "B", label: "B", teks: "ARP", urutan: 2 },
      { id: "C", label: "C", teks: "TCP", urutan: 3 },
      { id: "D", label: "D", teks: "ICMP", urutan: 4 },
      { id: "E", label: "E", teks: "DNS", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "TCP (Transmission Control Protocol) adalah protokol connection-oriented yang menjamin pengiriman paket data secara andal, lengkap, dan berurutan melalui mekanisme handshake dan acknowledgment.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 9,
    kode: "TKA-RPL-009",
    judul: "Tipe Data Primitif dalam Pemrograman",
    pertanyaan: "Variabel berikut yang tepat menggunakan tipe data Boolean adalah ...",
    opsi: [
      { id: "A", label: "A", teks: "NamaSiswa", urutan: 1 },
      { id: "B", label: "B", teks: "HargaBarang", urutan: 2 },
      { id: "C", label: "C", teks: "NilaiUjian", urutan: 3 },
      { id: "D", label: "D", teks: "StatusLulus", urutan: 4 },
      { id: "E", label: "E", teks: "AlamatRumah", urutan: 5 },
    ],
    kunci: ["D"],
    pembahasan:
      "Tipe data Boolean hanya memiliki dua kemungkinan nilai logis (true atau false), sehingga sangat tepat digunakan untuk variabel biner seperti StatusLulus.",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
  },
  {
    nomor: 10,
    kode: "TKA-RPL-010",
    judul: "Analisis Algoritma Perulangan For Loop",
    pertanyaan:
      "Perhatikan kode berikut:\n```java\nfor (int i = 1; i <= 5; i++) {\n    System.out.println(i);\n}\n```\nOutput terakhir yang ditampilkan adalah ...",
    opsi: [
      { id: "A", label: "A", teks: "1", urutan: 1 },
      { id: "B", label: "B", teks: "3", urutan: 2 },
      { id: "C", label: "C", teks: "4", urutan: 3 },
      { id: "D", label: "D", teks: "5", urutan: 4 },
      { id: "E", label: "E", teks: "6", urutan: 5 },
    ],
    kunci: ["D"],
    pembahasan:
      "Kondisi perulangan adalah `i <= 5`. Iterasi berlangsung dari 1, 2, 3, 4, hingga 5. Saat `i = 6`, kondisi bernilai false dan loop berhenti, sehingga angka terakhir yang dicetak adalah 5.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 11,
    kode: "TKA-RPL-011",
    judul: "Struktur Kontrol Percabangan (If-Else)",
    pertanyaan:
      'Seorang siswa membuat program untuk menentukan apakah seorang peserta didik lulus ujian. Peserta dinyatakan lulus jika nilainya minimal 75.\n\nPerhatikan kode berikut:\n```java\nint nilai = 72;\n\nif (nilai >= 75) {\n    System.out.println("Lulus");\n} else {\n    System.out.println("Tidak Lulus");\n}\n```\n\nApabila program dijalankan, keluaran yang dihasilkan adalah ....',
    opsi: [
      { id: "A", label: "A", teks: "Lulus", urutan: 1 },
      { id: "B", label: "B", teks: "Tidak Lulus", urutan: 2 },
      { id: "C", label: "C", teks: "72", urutan: 3 },
      { id: "D", label: "D", teks: "Program mengalami kesalahan", urutan: 4 },
      { id: "E", label: "E", teks: "Tidak ada keluaran", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Kondisi pada percabangan memeriksa apakah nilai >= 75. Karena nilai = 72, kondisi (72 >= 75) menghasilkan nilai false sehingga alur eksekusi masuk ke blok else dan mencetak teks 'Tidak Lulus'.",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L2",
  },
  {
    nomor: 12,
    kode: "TKA-RPL-012",
    judul: "Analisis Akumulasi Nilai dalam Perulangan",
    pertanyaan:
      "Seorang programmer ingin menghitung total bilangan genap dari 2 sampai 10. Ia menggunakan kode berikut:\n```java\nint total = 0;\n\nfor (int i = 2; i <= 10; i += 2) {\n    total += i;\n}\n\nSystem.out.println(total);\n```\n\nBerapakah keluaran program tersebut?",
    opsi: [
      { id: "A", label: "A", teks: "20", urutan: 1 },
      { id: "B", label: "B", teks: "25", urutan: 2 },
      { id: "C", label: "C", teks: "30", urutan: 3 },
      { id: "D", label: "D", teks: "35", urutan: 4 },
      { id: "E", label: "E", teks: "40", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Perulangan menambahkan bilangan genap bertahap: total = 2 + 4 + 6 + 8 + 10 = 30. Sehingga keluaran program adalah 30.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 13,
    kode: "TKA-RPL-013",
    judul: "Modularisasi Program & Refactoring Fungsi",
    pertanyaan:
      "Sebuah tim pengembang membuat aplikasi penggajian. Pada versi awal, seluruh proses perhitungan gaji, pemotongan pajak, dan pencetakan laporan ditulis dalam satu fungsi yang sangat panjang. Ketika aturan pajak berubah, programmer kesulitan menemukan bagian kode yang perlu diperbaiki.\n\nPerbaikan desain yang paling tepat adalah ....",
    opsi: [
      {
        id: "A",
        label: "A",
        teks: "Menggabungkan seluruh variabel menjadi variabel global.",
        urutan: 1,
      },
      { id: "B", label: "B", teks: "Menghapus komentar agar kode lebih ringkas.", urutan: 2 },
      { id: "C", label: "C", teks: "Memindahkan seluruh kode ke satu kelas besar.", urutan: 3 },
      {
        id: "D",
        label: "D",
        teks: "Membagi program menjadi fungsi-fungsi sesuai tanggung jawabnya.",
        urutan: 4,
      },
      {
        id: "E",
        label: "E",
        teks: "Menggandakan kode perhitungan pada setiap halaman.",
        urutan: 5,
      },
    ],
    kunci: ["D"],
    pembahasan:
      "Prinsip Single Responsibility Principle (SRP) dan modularisasi menganjurkan pemisahan tugas menjadi fungsi/modul independen (misal: hitungGaji(), hitungPajak(), cetakLaporan()) agar mudah dirawat dan diuji.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 14,
    kode: "TKA-RPL-014",
    judul: "Konsep Dasar Pemrograman Berorientasi Objek (OOP)",
    pertanyaan:
      "Sebuah aplikasi perpustakaan memiliki rancangan kelas `Buku` dengan atribut `judul`, `penulis`, dan `tahunTerbit`. Kelas tersebut juga memiliki method `tampilkanInformasi()`.\n\nKetika programmer membuat objek `bukuA` berdasarkan kelas `Buku`, hubungan yang tepat antara kelas dan objek adalah ....",
    opsi: [
      {
        id: "A",
        label: "A",
        teks: "Kelas merupakan hasil dari objek yang sudah dibuat.",
        urutan: 1,
      },
      {
        id: "B",
        label: "B",
        teks: "Objek merupakan cetak biru yang digunakan untuk membuat kelas.",
        urutan: 2,
      },
      {
        id: "C",
        label: "C",
        teks: "Kelas merupakan cetak biru, sedangkan objek merupakan instansiasi dari kelas tersebut.",
        urutan: 3,
      },
      {
        id: "D",
        label: "D",
        teks: "Kelas dan objek merupakan dua istilah yang memiliki arti sama.",
        urutan: 4,
      },
      {
        id: "E",
        label: "E",
        teks: "Objek hanya dapat dibuat jika kelas tidak memiliki atribut.",
        urutan: 5,
      },
    ],
    kunci: ["C"],
    pembahasan:
      "Class adalah cetak biru (blueprint) atau template konseptual, sedangkan Object adalah wujud nyata (instance) yang dialokasikan di memori berdasarkan cetak biru tersebut.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 15,
    kode: "TKA-RPL-015",
    judul: "Enkapsulasi dan Access Modifier",
    pertanyaan:
      "Seorang programmer membuat kelas `RekeningBank`. Ia ingin memastikan atribut `saldo` tidak dapat diubah secara langsung dari kelas lain. Perubahan saldo harus dilakukan melalui method yang memeriksa apakah transaksi valid.\n\nRancangan yang paling tepat adalah ....",
    opsi: [
      {
        id: "A",
        label: "A",
        teks: "Mendeklarasikan saldo sebagai public dan membiarkannya diubah langsung.",
        urutan: 1,
      },
      {
        id: "B",
        label: "B",
        teks: "Mendeklarasikan saldo sebagai private dan menyediakan method transaksi dengan validasi.",
        urutan: 2,
      },
      {
        id: "C",
        label: "C",
        teks: "Menghapus atribut saldo dan menggantinya dengan variabel global.",
        urutan: 3,
      },
      {
        id: "D",
        label: "D",
        teks: "Mendeklarasikan seluruh method sebagai private agar tidak dapat digunakan.",
        urutan: 4,
      },
      {
        id: "E",
        label: "E",
        teks: "Menyimpan saldo sebagai teks agar tidak dapat dihitung.",
        urutan: 5,
      },
    ],
    kunci: ["B"],
    pembahasan:
      "Enkapsulasi dicapai dengan menyembunyikan data internal menggunakan modifier `private` dan mengekspos fungsi kontrol/getter/setter publik dengan validasi logika.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 16,
    kode: "TKA-RPL-016",
    judul: "Inheritance (Pewarisan Kelas OOP)",
    pertanyaan:
      "Sebuah aplikasi gim memiliki kelas `Karakter` yang menyimpan atribut `nama` dan method `bergerak()`. Programmer kemudian membuat kelas `Pemain` yang membutuhkan atribut dan perilaku dasar dari `Karakter`, tetapi juga memiliki method tambahan `serang()`.\n\nRancangan yang paling tepat adalah ....",
    opsi: [
      { id: "A", label: "A", teks: "Membuat Karakter mewarisi Pemain.", urutan: 1 },
      {
        id: "B",
        label: "B",
        teks: "Membuat kedua kelas tanpa hubungan, kemudian menggandakan seluruh kode.",
        urutan: 2,
      },
      { id: "C", label: "C", teks: "Mengubah bergerak() menjadi atribut.", urutan: 3 },
      { id: "D", label: "D", teks: "Membuat Pemain mewarisi Karakter.", urutan: 4 },
      {
        id: "E",
        label: "E",
        teks: "Menghapus kelas Karakter dan memindahkan seluruh atribut ke variabel global.",
        urutan: 5,
      },
    ],
    kunci: ["D"],
    pembahasan:
      "Konsep pewarisan (inheritance) memungkinkan subclass (`Pemain`) mewarisi sifat dan perilaku dari superclass (`Karakter`) sekaligus menambahkan method spesifik (`serang()`).",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 17,
    kode: "TKA-RPL-017",
    judul: "Polymorphism dan Method Overriding",
    pertanyaan:
      'Perhatikan kode Java berikut:\n```java\nclass Hewan {\n    void bersuara() {\n        System.out.println("Suara hewan");\n    }\n}\n\nclass Kucing extends Hewan {\n    @Override\n    void bersuara() {\n        System.out.println("Meong");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Hewan h = new Kucing();\n        h.bersuara();\n    }\n}\n```\n\nApa keluaran program tersebut?',
    opsi: [
      { id: "A", label: "A", teks: "Suara hewan", urutan: 1 },
      { id: "B", label: "B", teks: "Kucing", urutan: 2 },
      { id: "C", label: "C", teks: "Hewan", urutan: 3 },
      { id: "D", label: "D", teks: "Program tidak dapat dikompilasi.", urutan: 4 },
      { id: "E", label: "E", teks: "Meong", urutan: 5 },
    ],
    kunci: ["E"],
    pembahasan:
      "Konsep Polymorphism (runtime dynamic binding) memanggil method overridden milik objek instansiasi sebenarnya di memori (`Kucing`). Meskipun referensi variabel bertipe `Hewan`, pemanggilan `h.bersuara()` menghasilkan keluaran 'Meong'.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L3",
  },
  {
    nomor: 18,
    kode: "TKA-RPL-018",
    judul: "Troubleshooting Jaringan & Resolusi DNS",
    pertanyaan:
      "Sebuah aplikasi web dapat mengakses server melalui alamat IP, tetapi pengguna tidak dapat mengaksesnya menggunakan nama domain. Hasil pemeriksaan menunjukkan bahwa koneksi jaringan ke server berjalan normal.\n\nKomponen yang paling perlu diperiksa terlebih dahulu adalah ....",
    opsi: [
      { id: "A", label: "A", teks: "Protokol DHCP", urutan: 1 },
      { id: "B", label: "B", teks: "Protokol DNS", urutan: 2 },
      { id: "C", label: "C", teks: "Protokol FTP", urutan: 3 },
      { id: "D", label: "D", teks: "Protokol SMTP", urutan: 4 },
      { id: "E", label: "E", teks: "Protokol ARP", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Domain Name System (DNS) bertanggung jawab menerjemahkan nama domain yang mudah dibaca manusia menjadi alamat IP. Jika IP bisa diakses namun domain gagal, permasalahan utama terletak pada konfigurasi atau server DNS.",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
  {
    nomor: 19,
    kode: "TKA-RPL-019",
    judul: "Analisis Konektivitas Jaringan & Gateway",
    pertanyaan:
      "Laboratorium PPLG memiliki dua komputer yang terhubung ke jaringan lokal yang sama dengan konfigurasi berikut:\n\n| Konfigurasi | Komputer A | Komputer B |\n| :--- | :--- | :--- |\n| IP Address | 192.168.10.10 | 192.168.10.20 |\n| Subnet Mask | 255.255.255.0 | 255.255.255.0 |\n| Gateway | 192.168.10.1 | 192.168.20.1 |\n\nKedua komputer dapat saling berkomunikasi dalam jaringan lokal, tetapi Komputer B tidak dapat mengakses jaringan di luar subnetnya. Pemeriksaan menunjukkan bahwa gateway Komputer B tidak berada pada subnet lokalnya.\n\nTindakan perbaikan yang paling tepat adalah ....",
    gambar_url: "/images/soal/soal-19-jaringan-komputer.png",
    opsi: [
      {
        id: "A",
        label: "A",
        teks: "Mengubah IP Address Komputer A menjadi alamat publik.",
        urutan: 1,
      },
      { id: "B", label: "B", teks: "Menghapus subnet mask pada Komputer B.", urutan: 2 },
      {
        id: "C",
        label: "C",
        teks: "Mengubah gateway Komputer B menjadi gateway yang valid pada subnet lokal, yaitu 192.168.10.1.",
        urutan: 3,
      },
      { id: "D", label: "D", teks: "Mengubah protokol TCP menjadi UDP.", urutan: 4 },
      { id: "E", label: "E", teks: "Menghapus alamat IP Komputer B.", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Subnet mask 255.255.255.0 menentukan bahwa subnet lokal adalah 192.168.10.0/24. Gateway Komputer B terkonfigurasi 192.168.20.1 (berada di subnet berbeda), sehingga paket keluar dari Komputer B tidak dapat diteruskan ke router. Gateway harus disamakan ke 192.168.10.1.",
    tingkat_kesulitan: "SULIT",
    level_kognitif: "L3",
  },
  {
    nomor: 20,
    kode: "TKA-RPL-020",
    judul: "Evaluasi Desain Program & Algoritma Pencarian",
    pertanyaan:
      "Seorang programmer membuat fitur pencarian siswa. Program tersebut menyimpan 1.000 data siswa dalam sebuah array yang sudah terurut berdasarkan nomor induk. Saat ini, program memeriksa data dari elemen pertama sampai elemen terakhir hingga data ditemukan.\n\nUntuk meningkatkan efisiensi pencarian, algoritma yang paling tepat dipertimbangkan adalah ....",
    opsi: [
      {
        id: "A",
        label: "A",
        teks: "Linear search dengan pemeriksaan seluruh elemen tanpa berhenti.",
        urutan: 1,
      },
      { id: "B", label: "B", teks: "Bubble sort sebelum setiap pencarian.", urutan: 2 },
      { id: "C", label: "C", teks: "Menggandakan seluruh data menjadi dua array.", urutan: 3 },
      {
        id: "D",
        label: "D",
        teks: "Binary search dengan membandingkan nilai target terhadap elemen tengah.",
        urutan: 4,
      },
      {
        id: "E",
        label: "E",
        teks: "Menghapus pengurutan data agar pencarian lebih fleksibel.",
        urutan: 5,
      },
    ],
    kunci: ["D"],
    pembahasan:
      "Pada koleksi data yang sudah terurut, Binary Search jauh lebih efisien dengan kompleksitas waktu O(log n) dibandingkan Linear Search yang beroperasi pada O(n).",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
  },
];

async function main() {
  console.log(
    "=== MEMULAI INPUT BANK SOAL & JADWAL UJIAN CBT LATIHAN TKA KELAS XII RPL (20 BUTIR) ==="
  );

  const sekolahId = "01M2XXYD227F9S3H985FH53GMF"; // SMK OTOMINDO
  const guru = await prisma.guru.findFirst({
    where: { sekolah_id: sekolahId, nama_lengkap: { contains: "Eri Chandra" } },
  });

  if (!guru) {
    throw new Error("Guru Eri Chandra tidak ditemukan");
  }

  // Cari penugasan mengajar XII RPL untuk Pak Eri Chandra
  const penugasan = await prisma.penugasanMengajar.findFirst({
    where: {
      sekolah_id: sekolahId,
      guru_id: guru.id,
      rombel: { nama: "XII RPL" },
    },
    include: {
      rombel: true,
      mata_pelajaran: true,
    },
  });

  if (!penugasan) {
    throw new Error("Penugasan XII RPL untuk Pak Eri Chandra tidak ditemukan");
  }

  console.log(`Sekolah   : SMK Otomindo (${sekolahId})`);
  console.log(`Guru      : ${guru.nama_lengkap} (${guru.id})`);
  console.log(`Rombel    : ${penugasan.rombel.nama}`);
  console.log(`Mapel     : ${penugasan.mata_pelajaran.nama} (ID: ${penugasan.mata_pelajaran_id})`);

  // 1. Buat / Cari Folder Bank Soal
  let folder = await prisma.folderBankSoal.findFirst({
    where: {
      sekolah_id: sekolahId,
      guru_id: guru.id,
      nama: "Latihan TKA RPL 2026",
    },
  });

  if (!folder) {
    folder = await prisma.folderBankSoal.create({
      data: {
        id: ulid(),
        sekolah_id: sekolahId,
        guru_id: guru.id,
        nama: "Latihan TKA RPL 2026",
        deskripsi: "Kumpulan butir soal Tes Kemampuan Akademik Kejuruan RPL untuk Kelas XII RPL",
        warna: "#2563EB",
      },
    });
    console.log(`[+] Folder Bank Soal dibuat: ${folder.nama}`);
  } else {
    console.log(`[=] Folder Bank Soal ditemukan: ${folder.nama}`);
  }

  // 2. Input 20 Butir Bank Soal
  const blueprintItems = [];
  const manifestItems = [];
  const scoringKeys = [];

  for (const item of SOAL_TKA) {
    let bankSoal = await prisma.bankSoal.findFirst({
      where: {
        sekolah_id: sekolahId,
        kode: item.kode,
      },
      include: { versi_soal: true },
    });

    const versiId = ulid();

    if (!bankSoal) {
      const bankSoalId = ulid();
      bankSoal = await prisma.bankSoal.create({
        data: {
          id: bankSoalId,
          sekolah_id: sekolahId,
          guru_id: guru.id,
          mata_pelajaran_id: penugasan.mata_pelajaran_id,
          folder_id: folder.id,
          kode: item.kode,
          judul: item.judul,
          tipe_soal: "PILIHAN_GANDA",
          tingkat_kesulitan: item.tingkat_kesulitan,
          scope_kepemilikan: "SEKOLAH",
          level_kognitif: item.level_kognitif,
          status: "AKTIF",
          versi_soal: {
            create: {
              id: versiId,
              sekolah_id: sekolahId,
              nomor_versi: 1,
              pertanyaan: item.pertanyaan,
              gambar_url: item.gambar_url || null,
              opsi_jawaban: JSON.stringify(item.opsi),
              kunci_jawaban: JSON.stringify(item.kunci),
              pembahasan: item.pembahasan,
              bobot_default: 1.0,
              dibuat_oleh: guru.nama_lengkap,
            },
          },
        },
        include: { versi_soal: true },
      });
      console.log(`[+] Dibuat Soal No. ${item.nomor}: ${item.judul} (${item.kode})`);
    } else {
      // Perbarui bank soal agar konten versi_soal selalu sinkron
      const currentVer = bankSoal.versi_soal[0];
      if (currentVer) {
        await prisma.versiSoal.update({
          where: { id: currentVer.id },
          data: {
            pertanyaan: item.pertanyaan,
            gambar_url: item.gambar_url || null,
            opsi_jawaban: JSON.stringify(item.opsi),
            kunci_jawaban: JSON.stringify(item.kunci),
            pembahasan: item.pembahasan,
          },
        });
      }
      console.log(`[=] Soal disinkronkan No. ${item.nomor}: ${item.judul} (${item.kode})`);
    }

    const latestVer = bankSoal.versi_soal[0];

    blueprintItems.push({
      bank_soal_id: bankSoal.id,
      versi_soal_id: latestVer.id,
      urutan: item.nomor,
      bobot: 1.0,
    });

    manifestItems.push({
      nomor_urut: item.nomor,
      bank_soal_id: bankSoal.id,
      versi_soal_id: latestVer.id,
      tipe_soal: "PILIHAN_GANDA",
      pertanyaan: item.pertanyaan,
      gambar_url: item.gambar_url || null,
      opsi_jawaban: item.opsi,
      bobot: 1.0,
    });

    scoringKeys.push({
      nomor_urut: item.nomor,
      bank_soal_id: bankSoal.id,
      tipe_soal: "PILIHAN_GANDA",
      kunci_jawaban: item.kunci,
      bobot: 1.0,
      pembahasan: item.pembahasan,
    });
  }

  // 3. Buat / Perbarui Ujian CBT untuk Kelas XII RPL
  const judulUjian = "Latihan TKA - Kejuruan Rekayasa Perangkat Lunak";
  let ujian = await prisma.ujianCbt.findFirst({
    where: {
      sekolah_id: sekolahId,
      penugasan_mengajar_id: penugasan.id,
      judul: judulUjian,
    },
    include: {
      snapshot_ujian: {
        orderBy: { nomor_snapshot: "desc" },
      },
    },
  });

  const snapshotId = ulid();
  const ujianId = ujian ? ujian.id : ulid();

  const konfigurasi = {
    acak_soal: false,
    acak_opsi: false,
    kktp: 75.0,
    durasi_menit: 60,
    tampilkan_nilai: true,
    tampilkan_pembahasan: true,
    token: "TKARPL",
  };

  const metadataUjian = {
    judul: judulUjian,
    deskripsi:
      "Simulasi Ujian Tes Kemampuan Akademik (TKA) Kejuruan RPL untuk siswa Kelas XII RPL.",
    mapel: penugasan.mata_pelajaran.nama,
    guru: guru.nama_lengkap,
    rombel: penugasan.rombel.nama,
  };

  const canonicalString = JSON.stringify({
    metadata: metadataUjian,
    konfigurasi: konfigurasi,
    manifestSoal: manifestItems,
    kunciPenilaian: scoringKeys,
  });
  const hashIntegritas = crypto.createHash("sha256").update(canonicalString).digest("hex");

  if (!ujian) {
    ujian = await prisma.ujianCbt.create({
      data: {
        id: ujianId,
        sekolah_id: sekolahId,
        penugasan_mengajar_id: penugasan.id,
        judul: judulUjian,
        deskripsi:
          "Simulasi Ujian Tes Kemampuan Akademik (TKA) Kejuruan RPL untuk siswa Kelas XII RPL.",
        durasi_menit: 60,
        kkm_kktp: 75.0,
        acak_soal: false,
        acak_opsi: false,
        gunakan_token: true,
        token_masuk: "TKARPL",
        tampilkan_nilai: true,
        tampilkan_pembahasan: true,
        maksimal_attempt: 3,
        status: "DITERBITKAN",
        blueprint: JSON.stringify(blueprintItems),
        snapshot_aktif_id: snapshotId,
        snapshot_ujian: {
          create: {
            id: snapshotId,
            sekolah_id: sekolahId,
            nomor_snapshot: 1,
            total_soal: manifestItems.length,
            total_bobot: manifestItems.length * 1.0,
            durasi_menit: 60,
            konfigurasi: JSON.stringify(konfigurasi),
            manifest_soal: JSON.stringify(manifestItems),
            kunci_penilaian: JSON.stringify(scoringKeys),
            metadata_ujian: JSON.stringify(metadataUjian),
            hash_integritas: hashIntegritas,
            dibekukan_oleh: guru.nama_lengkap,
          },
        },
      },
    });
    console.log(`\n[+] Ujian CBT BERHASIL DIBUAT & DITERBITKAN (20 Soal)!`);
  } else {
    const nextNomor = (ujian.snapshot_ujian[0]?.nomor_snapshot || 1) + 1;

    await prisma.snapshotUjian.create({
      data: {
        id: snapshotId,
        sekolah_id: sekolahId,
        ujian_cbt_id: ujian.id,
        nomor_snapshot: nextNomor,
        total_soal: manifestItems.length,
        total_bobot: manifestItems.length * 1.0,
        durasi_menit: 60,
        konfigurasi: JSON.stringify(konfigurasi),
        manifest_soal: JSON.stringify(manifestItems),
        kunci_penilaian: JSON.stringify(scoringKeys),
        metadata_ujian: JSON.stringify(metadataUjian),
        hash_integritas: hashIntegritas,
        dibekukan_oleh: guru.nama_lengkap,
      },
    });

    ujian = await prisma.ujianCbt.update({
      where: { id: ujian.id },
      data: {
        durasi_menit: 60,
        token_masuk: "TKARPL",
        gunakan_token: true,
        status: "DITERBITKAN",
        blueprint: JSON.stringify(blueprintItems),
        snapshot_aktif_id: snapshotId,
      },
    });
    console.log(`\n[=] Ujian CBT DIPERBARUI dengan Snapshot v${nextNomor} (20 Soal Lengkap)!`);
  }

  console.log(`\n============================================================`);
  console.log(`STATUS CBT LATIHAN TKA KELAS XII RPL: 20 SOAL LENGKAP!`);
  console.log(`============================================================`);
  console.log(`Judul Ujian   : ${ujian.judul}`);
  console.log(`Rombel Target : ${penugasan.rombel.nama}`);
  console.log(`Total Soal    : ${manifestItems.length} Butir Soal (Nomor 1 - 20)`);
  console.log(`Durasi        : ${ujian.durasi_menit} Menit`);
  console.log(`Token Ujian   : ${ujian.token_masuk}`);
  console.log(`Status Ujian  : ${ujian.status}`);
  console.log(`ID Ujian      : ${ujian.id}`);
  console.log(`ID Snapshot   : ${snapshotId}`);
  console.log(`============================================================\n`);
}

main()
  .catch((e) => {
    console.error("Gagal seed ujian TKA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
