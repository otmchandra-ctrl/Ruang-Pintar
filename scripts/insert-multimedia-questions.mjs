import { PrismaClient } from "@prisma/client";
import { ulid } from "ulidx";

const prisma = new PrismaClient();

const sekolahId = "01M2XXYD227F9S3H985FH53GMF"; // SMK OTOMINDO
const guruId = "01M2XXYD299G35BZDH2NKFCM3P"; // Eri Chandra A
const mapelId = "01M3AFKVMQMQCB3A5FYGRYCWKB"; // KKA (Koding dan Kecerdasan Artifisial)
const lingkupMateriId = "01M3Y6TX4S16ZAVP181RK8YZG8"; // Produksi Konten Digital Multimedia (BAB II)
const tpId = "01M3Y6TX4WGPPNC2R30XC9VS45"; // TP 1: Memahami Konsep Multimedia

const questionsData = [
  // --- PILIHAN GANDA (1 s.d. 20) ---
  {
    kode: "TP1-MM-PG-01",
    judul: "Pengertian Multimedia",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan:
      "Penggabungan beberapa jenis media untuk menyampaikan informasi secara bersamaan disebut ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Multimedia", urutan: 1 },
      { id: "B", teks: "Audio", urutan: 2 },
      { id: "C", teks: "Animasi", urutan: 3 },
      { id: "D", teks: "Tipografi", urutan: 4 },
      { id: "E", teks: "Fotografi", urutan: 5 },
    ],
    kunci: ["A"],
    pembahasan:
      "Multimedia adalah integrasi terpadu antara teks, suara, gambar, animasi, dan video untuk menyampaikan pesan atau informasi secara simultan.",
  },
  {
    kode: "TP1-MM-PG-02",
    judul: "Asal Kata Multimedia",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan: "Istilah multimedia berasal dari gabungan dua kata, yaitu ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Multi dan metode", urutan: 1 },
      { id: "B", teks: "Multi dan media", urutan: 2 },
      { id: "C", teks: "Modern dan media", urutan: 3 },
      { id: "D", teks: "Media dan digital", urutan: 4 },
      { id: "E", teks: "Modul dan media", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Berasal dari bahasa Latin: 'Multi' yang berarti banyak atau bermacam-macam, dan 'Medium / Media' yang berarti sarana atau alat perantara penyampaian pesan.",
  },
  {
    kode: "TP1-MM-PG-03",
    judul: "Identifikasi Elemen Multimedia",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan: "Berikut yang bukan termasuk elemen multimedia adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Teks", urutan: 1 },
      { id: "B", teks: "Audio", urutan: 2 },
      { id: "C", teks: "Printer", urutan: 3 },
      { id: "D", teks: "Gambar", urutan: 4 },
      { id: "E", teks: "Animasi", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Printer merupakan perangkat keras fisik (hardware output), sedangkan teks, audio, gambar, dan animasi adalah elemen representasi media digital.",
  },
  {
    kode: "TP1-MM-PG-04",
    judul: "Karakteristik Buku Digital Linier",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan:
      "Perhatikan gambar berikut!\n\nPerhatikan ilustrasi buku digital yang hanya dapat dibaca halaman demi halaman tanpa fitur interaksi. Jenis multimedia tersebut adalah ....",
    gambar_url: "/images/soal/soal-buku-digital.svg",
    opsi: [
      { id: "A", teks: "Interaktif", urutan: 1 },
      { id: "B", teks: "Hiperaktif", urutan: 2 },
      { id: "C", teks: "Gabungan", urutan: 3 },
      { id: "D", teks: "Linier", urutan: 4 },
      { id: "E", teks: "Simulasi", urutan: 5 },
    ],
    kunci: ["D"],
    pembahasan:
      "Multimedia linier adalah multimedia yang berjalan satu arah secara berurutan (sekuensial) dari awal sampai akhir tanpa navigasi percabangan atau umpan balik interaktif.",
  },
  {
    kode: "TP1-MM-PG-05",
    judul: "Contoh Multimedia Linier",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan: "Contoh multimedia linier adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Game edukasi dengan pilihan level", urutan: 1 },
      { id: "B", teks: "Kuis daring yang memberikan skor", urutan: 2 },
      { id: "C", teks: "Aplikasi pembelajaran interaktif", urutan: 3 },
      { id: "D", teks: "Website dengan navigasi bebas", urutan: 4 },
      { id: "E", teks: "Video yang ditonton secara berurutan dari awal hingga akhir", urutan: 5 },
    ],
    kunci: ["E"],
    pembahasan:
      "Video pembelajaran yang ditonton secara pasif tanpa kontrol interaktif atau tombol respons pengguna merupakan bentuk multimedia linier.",
  },
  {
    kode: "TP1-MM-PG-06",
    judul: "Klasifikasi Kuis Daring Interaktif",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan:
      "Seorang siswa mengerjakan kuis daring, memilih jawaban, dan langsung mendapatkan umpan balik benar atau salah. Kuis tersebut termasuk ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Multimedia interaktif", urutan: 1 },
      { id: "B", teks: "Multimedia linier", urutan: 2 },
      { id: "C", teks: "Media cetak", urutan: 3 },
      { id: "D", teks: "Multimedia pasif", urutan: 4 },
      { id: "E", teks: "Audio digital", urutan: 5 },
    ],
    kunci: ["A"],
    pembahasan:
      "Kuis daring dengan umpan balik langsung memenuhi prinsip interaktivitas karena merespons aksi input pengguna dengan tindakan sistem secara real-time.",
  },
  {
    kode: "TP1-MM-PG-07",
    judul: "Ciri Utama Alur Multimedia Linier",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan: "Salah satu ciri utama multimedia linier adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Pengguna bebas menentukan jalur cerita", urutan: 1 },
      { id: "B", teks: "Konten disajikan secara berurutan dari awal sampai akhir", urutan: 2 },
      { id: "C", teks: "Pengguna selalu menerima umpan balik langsung", urutan: 3 },
      { id: "D", teks: "Pengguna dapat mengubah seluruh isi konten", urutan: 4 },
      { id: "E", teks: "Konten wajib memiliki fitur permainan", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Ciri khas media linier adalah konten disusun dan dialirkan secara lurus (kronologis/sekuensial) tanpa jalur alternatif bagi pengguna.",
  },
  {
    kode: "TP1-MM-PG-08",
    judul: "Karakteristik Presentasi Slide",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan:
      "Presentasi PowerPoint yang menggabungkan teks, gambar, audio, dan video, serta memungkinkan pengguna berpindah slide tetapi tidak memiliki interaksi penuh, merupakan contoh ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Multimedia linier murni", urutan: 1 },
      { id: "B", teks: "Multimedia audio", urutan: 2 },
      { id: "C", teks: "Multimedia gabungan", urutan: 3 },
      { id: "D", teks: "Media cetak", urutan: 4 },
      { id: "E", teks: "Multimedia tanpa visual", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Menggabungkan beragam modalitas media (teks, visual, audio) dalam satu lingkungan presentasi terintegrasi.",
  },
  {
    kode: "TP1-MM-PG-09",
    judul: "Fungsi Elemen Suara / Audio",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan:
      "Perhatikan gambar berikut!\n\nElemen multimedia yang digunakan untuk menyampaikan narasi, musik latar, dan efek suara adalah ....",
    gambar_url: "/images/soal/glossy-blue-megaphone-with-sound-waves.png",
    opsi: [
      { id: "A", teks: "Teks", urutan: 1 },
      { id: "B", teks: "Gambar", urutan: 2 },
      { id: "C", teks: "Animasi", urutan: 3 },
      { id: "D", teks: "Audio", urutan: 4 },
      { id: "E", teks: "Video", urutan: 5 },
    ],
    kunci: ["D"],
    pembahasan:
      "Elemen audio bertanggung jawab atas persepsi pendengaran pengguna, mencakup suara tuturan pengajar, musik latar belakang, dan efek suara (sound effects).",
  },
  {
    kode: "TP1-MM-PG-10",
    judul: "Penerapan Pembelajaran Interaktif",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan: "Contoh penerapan multimedia interaktif dalam pembelajaran adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Buku cetak tanpa ilustrasi", urutan: 1 },
      { id: "B", teks: "Rekaman suara yang diputar sampai selesai", urutan: 2 },
      { id: "C", teks: "Film yang ditonton tanpa interaksi", urutan: 3 },
      { id: "D", teks: "Poster yang hanya berisi tulisan", urutan: 4 },
      {
        id: "E",
        teks: "Game edukasi yang memungkinkan siswa memilih jawaban dan memperoleh skor",
        urutan: 5,
      },
    ],
    kunci: ["E"],
    pembahasan:
      "Game edukasi memberikan siswa peran aktif dalam mengambil keputusan, menavigasi tantangan, dan memperoleh penghargaan/skor secara dinamis.",
  },
  {
    kode: "TP1-MM-PG-11",
    judul: "Manfaat Multimedia bagi Pemahaman Belajar",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan: "Salah satu manfaat utama multimedia dalam pendidikan adalah ....",
    gambar_url: null,
    opsi: [
      {
        id: "A",
        teks: "Meningkatkan pemahaman siswa melalui kombinasi berbagai format informasi",
        urutan: 1,
      },
      { id: "B", teks: "Menghilangkan kebutuhan belajar dan berlatih", urutan: 2 },
      { id: "C", teks: "Membatasi sumber belajar hanya pada buku", urutan: 3 },
      { id: "D", teks: "Mengurangi variasi penyampaian materi", urutan: 4 },
      { id: "E", teks: "Membuat semua siswa harus belajar dengan cara yang sama", urutan: 5 },
    ],
    kunci: ["A"],
    pembahasan:
      "Kombinasi format teks, audio, dan gambar membantu mengakomodasi gaya belajar yang berbeda dan mempercepat pemahaman materi yang sulit.",
  },
  {
    kode: "TP1-MM-PG-12",
    judul: "Klasifikasi Slide Otomatis Berwaktu",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan:
      "Guru menampilkan presentasi yang berganti slide secara otomatis sesuai waktu tanpa memberikan kesempatan kepada siswa untuk memilih jalur penyajian. Contoh tersebut termasuk ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Multimedia interaktif penuh", urutan: 1 },
      { id: "B", teks: "Multimedia linier", urutan: 2 },
      { id: "C", teks: "Simulasi interaktif", urutan: 3 },
      { id: "D", teks: "Game edukasi", urutan: 4 },
      { id: "E", teks: "Aplikasi berbasis navigasi bebas", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Jika pengguna tidak memiliki kontrol atas peralihan konten atau kecepatan tayang, maka sistem tersebut bersifat linier pasif.",
  },
  {
    kode: "TP1-MM-PG-13",
    judul: "Identifikasi Elemen Gambar / Visual",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan:
      "Perhatikan gambar berikut!\n\nFoto tersebut merupakan contoh elemen multimedia berupa ....",
    gambar_url: "/images/soal/curious-tabby-kitten-in-garden-bokeh.png",
    opsi: [
      { id: "A", teks: "Audio", urutan: 1 },
      { id: "B", teks: "Animasi", urutan: 2 },
      { id: "C", teks: "Gambar", urutan: 3 },
      { id: "D", teks: "Video", urutan: 4 },
      { id: "E", teks: "Teks", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Foto dokumentasi merupakan representasi visual diam/statis yang masuk dalam kategori elemen gambar (image/graphic).",
  },
  {
    kode: "TP1-MM-PG-14",
    judul: "Analisis Batasan & Manfaat Multimedia",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan: "Berikut yang bukan merupakan manfaat multimedia adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Membantu menjelaskan materi yang sulit", urutan: 1 },
      { id: "B", teks: "Meningkatkan motivasi belajar", urutan: 2 },
      { id: "C", teks: "Mendukung berbagai kebutuhan belajar", urutan: 3 },
      { id: "D", teks: "Membatasi penggunaan multimedia hanya untuk hiburan", urutan: 4 },
      { id: "E", teks: "Memudahkan akses dan pembagian materi digital", urutan: 5 },
    ],
    kunci: ["D"],
    pembahasan:
      "Pernyataan D salah karena multimedia dimanfaatkan secara esensial dalam pendidikan, pelatihan kerja, sains, kedokteran, dan industri profesional.",
  },
  {
    kode: "TP1-MM-PG-15",
    judul: "Prinsip Tombol dan Pilihan Jalur",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan:
      "Multimedia yang memungkinkan pengguna mengklik tombol, memilih jalur, dan menjawab pertanyaan memiliki karakteristik ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Pasif", urutan: 1 },
      { id: "B", teks: "Statis", urutan: 2 },
      { id: "C", teks: "Tidak memiliki umpan balik", urutan: 3 },
      { id: "D", teks: "Selalu berjalan otomatis", urutan: 4 },
      { id: "E", teks: "Interaktif", urutan: 5 },
    ],
    kunci: ["E"],
    pembahasan:
      "Fitur tombol navigasi, pemilihan cabang alur, dan input jawaban pengguna adalah definisi inti interaktivitas.",
  },
  {
    kode: "TP1-MM-PG-16",
    judul: "Definisi Elemen Video",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan:
      "Elemen multimedia yang menggabungkan gambar bergerak dan audio secara berurutan adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Video", urutan: 1 },
      { id: "B", teks: "Teks", urutan: 2 },
      { id: "C", teks: "Ikon", urutan: 3 },
      { id: "D", teks: "Foto", urutan: 4 },
      { id: "E", teks: "Grafik", urutan: 5 },
    ],
    kunci: ["A"],
    pembahasan:
      "Video memadukan suksesi frame gambar bergerak yang tersinkronisasi sempurna dengan rekaman audio.",
  },
  {
    kode: "TP1-MM-PG-17",
    judul: "Contoh Penggunaan Elemen Teks",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan: "Contoh penggunaan elemen teks dalam konten multimedia adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Musik latar video", urutan: 1 },
      { id: "B", teks: "Judul, caption, dan subtitle", urutan: 2 },
      { id: "C", teks: "Foto dokumentasi", urutan: 3 },
      { id: "D", teks: "Gerakan karakter digital", urutan: 4 },
      { id: "E", teks: "Rekaman suara narator", urutan: 5 },
    ],
    kunci: ["B"],
    pembahasan:
      "Judul materi, takarir (caption), dan terjemahan tertulis (subtitle) adalah penerapan elemen teks berbasis tipografi.",
  },
  {
    kode: "TP1-MM-PG-18",
    judul: "Peran Utama Elemen Animasi",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan: "Animasi paling tepat digunakan untuk ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Menggantikan seluruh informasi tertulis", urutan: 1 },
      { id: "B", teks: "Menyampaikan suara tanpa gambar", urutan: 2 },
      {
        id: "C",
        teks: "Menjelaskan konsep abstrak atau proses yang sulit direkam secara langsung",
        urutan: 3,
      },
      { id: "D", teks: "Menghilangkan kebutuhan visualisasi", urutan: 4 },
      { id: "E", teks: "Menyimpan dokumen tanpa perubahan", urutan: 5 },
    ],
    kunci: ["C"],
    pembahasan:
      "Animasi sangat unggul untuk mensimulasikan fenomena abstrak seperti pergerakan elektron, siklus mesin dalam, atau alur algoritma perangkat lunak.",
  },
  {
    kode: "TP1-MM-PG-19",
    judul: "Peluang Karier Bidang Multimedia",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "MUDAH",
    level_kognitif: "L1",
    bobot_default: 1.0,
    pertanyaan:
      "Profesi yang banyak membutuhkan keterampilan membuat konten multimedia adalah ....",
    gambar_url: null,
    opsi: [
      { id: "A", teks: "Petugas parkir saja", urutan: 1 },
      { id: "B", teks: "Penjaga loket saja", urutan: 2 },
      { id: "C", teks: "Petugas kebersihan saja", urutan: 3 },
      {
        id: "D",
        teks: "Content creator, desainer grafis, video editor, dan digital marketer",
        urutan: 4,
      },
      { id: "E", teks: "Semua pekerjaan tidak memerlukan multimedia", urutan: 5 },
    ],
    kunci: ["D"],
    pembahasan:
      "Kreator konten, desainer grafis, penyunting video, pengembang web, dan pemasar digital adalah profesi industri kreatif yang berbasis kompetensi multimedia.",
  },
  {
    kode: "TP1-MM-PG-20",
    judul: "Penerapan Aplikasi Pembelajaran Digital",
    tipe_soal: "PILIHAN_GANDA",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 1.0,
    pertanyaan:
      "Perhatikan gambar berikut!\n\nSebuah aplikasi pembelajaran memungkinkan siswa memilih topik, mengerjakan kuis, dan melihat perkembangan belajarnya. Aplikasi tersebut merupakan contoh ....",
    gambar_url: "/images/soal/interactive-digital-learning-dashboard.png",
    opsi: [
      { id: "A", teks: "Multimedia linier", urutan: 1 },
      { id: "B", teks: "Media cetak", urutan: 2 },
      { id: "C", teks: "Audio pasif", urutan: 3 },
      { id: "D", teks: "Video tanpa interaksi", urutan: 4 },
      { id: "E", teks: "Multimedia interaktif", urutan: 5 },
    ],
    kunci: ["E"],
    pembahasan:
      "Fitur pemilihan materi secara mandiri dan pelacakan kemajuan belajar personal adalah manifestasi multimedia interaktif modern.",
  },

  // --- SOAL ESAI / URAIAN (1 s.d. 5) ---
  {
    kode: "TP1-MM-ES-01",
    judul: "Esai: Pengertian Multimedia & Contoh Nyata",
    tipe_soal: "ESAI",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 4.0,
    pertanyaan:
      "Jelaskan pengertian multimedia menggunakan bahasamu sendiri! Berikan dua contoh multimedia yang kamu temukan dalam kehidupan sehari-hari!",
    gambar_url: null,
    opsi: null,
    kunci: [
      "Rubrik Penilaian (Maksimal 4 Poin):\n- (2 Poin) Siswa mampu menjelaskan konsep integrasi lebih dari satu media (teks, audio, gambar, video, animasi) untuk menyampaikan informasi.\n- (2 Poin) Siswa mampu memberikan 2 contoh nyata yang relevan (misalnya: video tutorial YouTube, game edukasi, aplikasi Canva, PowerPoint beranimasi, website e-learning Ruang Pintar).",
    ],
    pembahasan:
      "Multimedia adalah perpaduan harmonis antara teks, grafik, audio, video, dan animasi yang dikendalikan oleh komputer untuk menyampaikan pesan yang menarik.",
  },
  {
    kode: "TP1-MM-ES-02",
    judul: "Esai: Tiga Jenis Multimedia Interaktivitas",
    tipe_soal: "ESAI",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 4.0,
    pertanyaan:
      "Sebutkan dan jelaskan tiga jenis multimedia berdasarkan tingkat interaktivitasnya! Berikan masing-masing satu contoh!",
    gambar_url: null,
    opsi: null,
    kunci: [
      "Rubrik Penilaian (Maksimal 4 Poin):\n1. Multimedia Linier: Berjalan sekuensial satu arah tanpa kontrol navigasi pengguna (Contoh: film bioskop, video tutorial tanpa jeda interaktif).\n2. Multimedia Interaktif: Pengguna memiliki kendali penuh atas alur dan respons (Contoh: game edukasi, aplikasi kuis CBT).\n3. Multimedia Hiperaktif: Memiliki jalinan tautan (link/hypertext) yang memungkinkan lompatan bebas antar konten (Contoh: World Wide Web/website, portal informasi Wikipedia).",
    ],
    pembahasan:
      "Tiga klasifikasi interaktivitas media meliputi Linier (pasif/searah), Interaktif (dua arah/responsif), dan Hiperaktif (jaringan tautan bercabang).",
  },
  {
    kode: "TP1-MM-ES-03",
    judul: "Esai: Identifikasi 4 Elemen Video Pembelajaran",
    tipe_soal: "ESAI",
    tingkat_kesulitan: "SULIT",
    level_kognitif: "L3",
    bobot_default: 4.0,
    pertanyaan:
      "Perhatikan gambar berikut!\n\nPerhatikan ilustrasi video pembelajaran yang memuat gambar, narasi suara, teks, dan animasi. Identifikasikan empat elemen multimedia yang digunakan serta jelaskan fungsi setiap elemen tersebut!",
    gambar_url: "/images/soal/multimedia-learning-formats-infographic.png",
    opsi: null,
    kunci: [
      "Rubrik Penilaian (Maksimal 4 Poin):\n1. Teks: Menampilkan judul, istilah kunci, atau subtitle agar pesan mudah dicatat dan dipahami secara literasi.\n2. Gambar: Menyediakan representasi visual statis atau diagram benda nyata pendukung pemahaman.\n3. Audio: Berfungsi sebagai narasi penjelasan pengajar (voice-over) serta musik pengiring yang membangun fokus.\n4. Animasi: Menggambarkan proses dinamis atau konsep abstrak yang bergerak secara visual.",
    ],
    pembahasan:
      "Keempat elemen saling melengkapi: teks memperkuat memori visual, gambar memberikan wujud nyata, audio memandu pemahaman auditori, dan animasi mengilustrasikan pergerakan dinamis.",
  },
  {
    kode: "TP1-MM-ES-04",
    judul: "Esai: Manfaat Multimedia bagi Siswa SMK",
    tipe_soal: "ESAI",
    tingkat_kesulitan: "SEDANG",
    level_kognitif: "L2",
    bobot_default: 4.0,
    pertanyaan:
      "Sebutkan minimal lima manfaat multimedia dalam pendidikan dan jelaskan bagaimana multimedia membantu kegiatan belajar siswa SMK!",
    gambar_url: null,
    opsi: null,
    kunci: [
      "Rubrik Penilaian (Maksimal 4 Poin):\nManfaat yang disebutkan minimal 5:\n1. Memvisualisasikan prosedur praktik kerja yang rumit/berbahaya sebelum turun ke mesin riil.\n2. Meningkatkan daya ingat dan pemahaman konsep kejuruan.\n3. Mengakomodasi beragam gaya belajar (visual, auditori, kinestetik).\n4. Memberikan fleksibilitas belajar mandiri yang dapat diputar berulang-ulang.\n5. Meningkatkan motivasi dan keterlibatan aktif siswa dalam memecahkan masalah industri.",
    ],
    pembahasan:
      "Pada jenjang SMK, multimedia berfungsi vital sebagai media simulasi digital yang menghubungkan teori kelas dengan praktik bengkel kerja secara presisi.",
  },
  {
    kode: "TP1-MM-ES-05",
    judul: "Esai: Perancangan Konten Multimedia Pembelajaran",
    tipe_soal: "ESAI",
    tingkat_kesulitan: "SULIT",
    level_kognitif: "L3",
    bobot_default: 4.0,
    pertanyaan:
      "Seorang guru ingin menjelaskan materi yang sulit dipahami siswa hanya melalui teks. Rancanglah sebuah konten multimedia sederhana yang dapat digunakan guru tersebut! Jelaskan jenis konten, elemen yang digunakan, dan alasan pemilihannya!",
    gambar_url: null,
    opsi: null,
    kunci: [
      "Rubrik Penilaian (Maksimal 4 Poin):\n- Rancangan Jenis Konten: Video animasi tutorial singkat / presentasi interaktif dengan kuis cek pemahaman.\n- Elemen yang Digunakan: Teks poin utama, animasi proses, narasi audio pengajar, dan gambar simulasi.\n- Alasan Pemilihan: Rasional dan logis, menjelaskan bagaimana perpaduan elemen tersebut mengubah materi abstrak menjadi konkret dan memicu rasa ingin tahu siswa.",
    ],
    pembahasan:
      "Rancangan konten multimedia yang efektif memprioritaskan kesederhanaan pesan, kejelasan audio, visualisasi yang relevan, serta keterlibatan aktif siswa.",
  },
];

async function main() {
  console.log("=== Memulai Pemasukan 25 Butir Soal TP 1 - BAB II Multimedia ===");

  const guru = await prisma.guru.findUnique({
    where: { id: guruId },
    include: { pengguna: true },
  });
  if (!guru) throw new Error("Guru tidak ditemukan!");
  const creatorName = guru.nama_lengkap || guru.pengguna.nama_lengkap;

  let insertedCount = 0;
  let updatedCount = 0;

  for (const q of questionsData) {
    // Cek apakah soal dengan kode ini sudah ada di sekolah ini
    const existing = await prisma.bankSoal.findFirst({
      where: {
        sekolah_id: sekolahId,
        kode: q.kode,
      },
      include: { versi_soal: true },
    });

    if (existing) {
      // Update data soal & versinya
      await prisma.bankSoal.update({
        where: { id: existing.id },
        data: {
          judul: q.judul,
          mata_pelajaran_id: mapelId,
          lingkup_materi_id: lingkupMateriId,
          tujuan_pembelajaran_id: tpId,
          tipe_soal: q.tipe_soal,
          tingkat_kesulitan: q.tingkat_kesulitan,
          level_kognitif: q.level_kognitif,
          status: "AKTIF",
        },
      });

      const activeVersion = existing.versi_soal[0];
      if (activeVersion) {
        await prisma.versiSoal.update({
          where: { id: activeVersion.id },
          data: {
            pertanyaan: q.pertanyaan,
            gambar_url: q.gambar_url,
            opsi_jawaban: q.opsi ? JSON.stringify(q.opsi) : null,
            kunci_jawaban: JSON.stringify(q.kunci),
            pembahasan: q.pembahasan,
            bobot_default: q.bobot_default,
          },
        });
      }

      updatedCount++;
      console.log(`[UPDATED] ${q.kode}: ${q.judul}`);
    } else {
      // Buat baru
      const bankSoalId = ulid();
      const versiSoalId = ulid();

      await prisma.bankSoal.create({
        data: {
          id: bankSoalId,
          sekolah_id: sekolahId,
          guru_id: guruId,
          mata_pelajaran_id: mapelId,
          lingkup_materi_id: lingkupMateriId,
          tujuan_pembelajaran_id: tpId,
          kode: q.kode,
          judul: q.judul,
          tipe_soal: q.tipe_soal,
          tingkat_kesulitan: q.tingkat_kesulitan,
          scope_kepemilikan: "SEKOLAH",
          level_kognitif: q.level_kognitif,
          versi_aktif: 1,
          status: "AKTIF",
          versi_soal: {
            create: {
              id: versiSoalId,
              sekolah_id: sekolahId,
              nomor_versi: 1,
              pertanyaan: q.pertanyaan,
              gambar_url: q.gambar_url,
              opsi_jawaban: q.opsi ? JSON.stringify(q.opsi) : null,
              kunci_jawaban: JSON.stringify(q.kunci),
              pembahasan: q.pembahasan,
              bobot_default: q.bobot_default,
              dibuat_oleh: creatorName,
            },
          },
        },
      });

      insertedCount++;
      console.log(`[INSERTED] ${q.kode}: ${q.judul} (${q.tipe_soal})`);
    }
  }

  console.log(
    `\nSELESAI! Berhasil memasukkan ${insertedCount} butir baru, memperbarui ${updatedCount} butir.`
  );

  const totalBank = await prisma.bankSoal.count({
    where: { sekolah_id: sekolahId, mata_pelajaran_id: mapelId },
  });
  console.log(`Total butir soal di Bank Soal KKA sekarang: ${totalBank} butir.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
