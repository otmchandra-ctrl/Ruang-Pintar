import fs from 'fs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulidx';

const prisma = new PrismaClient();

const SEKOLAH_ID = '01M2XXYD227F9S3H985FH53GMF';
const GURU_ID = '01M2XXYD299G35BZDH2NKFCM3P'; // Eri Chandra A
const USER_ID = '01M2XXYD26H385F6RAW5PB6FBK';
const MAPEL_ID = '01M3AFKVMS6VCBANVEGWPYHYYS'; // PBO
const PENUGASAN_ID = '01M3AFKVS7SMQ8PG7SZWWE0V7T'; // XII RPL - PBO

const ANSWER_KEYS = {
  1: 'E', 2: 'D', 3: 'C', 4: 'C', 5: 'A',
  6: 'D', 7: 'E', 8: 'C', 9: 'B', 10: 'B',
  11: 'A', 12: 'A', 13: 'B', 14: 'D', 15: 'C',
  16: 'C', 17: 'D', 18: 'E', 19: 'A', 20: 'C',
  21: 'E', 22: 'D', 23: 'A', 24: 'E', 25: 'E',
  26: 'A', 27: 'C', 28: 'D', 29: 'A', 30: 'B',
  31: 'E', 32: 'B', 33: 'C', 34: 'D', 35: 'A',
  36: 'C', 37: 'B', 38: 'E', 39: 'B', 40: 'A',
  41: 'C', 42: 'B', 43: 'D', 44: 'E', 45: 'B',
  46: 'A', 47: 'B', 48: 'E', 49: 'D', 50: 'D'
};

const IMAGE_MAP = {
  11: '/images/soal/pbo-soal-11-uml-pegawai-guru.png',
  21: '/images/soal/pbo-soal-21-flowchart-setter-nilai.png',
  22: '/images/soal/pbo-soal-21-flowchart-setter-nilai.png',
  41: '/images/soal/pbo-soal-41-flowchart-try-catch-exception.png',
  42: '/images/soal/pbo-soal-41-flowchart-try-catch-exception.png'
};

const QUESTION_TITLES = {
  1: 'Konsep Dasar Class dan Object OOP',
  2: 'Sintaks Instansiasi Objek PHP',
  3: 'Operator Akses Property dan Method Objek',
  4: 'Fungsi Kata Kunci $this pada Method',
  5: 'Lifecycle Method Magic Constructor __construct',
  6: 'Kalkulasi Nilai pada Method dan Constructor',
  7: 'Method Magic Destructor __destruct',
  8: 'Return Type Declaration pada Method PHP',
  9: 'Independensi State/Property Antar Objek',
  10: 'Akses Class Constant Tanpa Instansiasi',
  11: 'Notasi Access Modifier pada UML Class Diagram',
  12: 'Sintaks Pewarisan (Inheritance) pada PHP',
  13: 'Pilar Enkapsulasi (Encapsulation)',
  14: 'Perbedaan Hak Akses Private vs Protected',
  15: 'Pelanggaran Akses Property Private (Fatal Error)',
  16: 'Pola Getter dan Setter pada Enkapsulasi',
  17: 'Validasi State Melalui Method Enkapsulasi',
  18: 'Default Access Modifier Method pada PHP',
  19: 'Ruang Lingkup Visibilitas Protected Property',
  20: 'Tujuan Validasi Data Input Melalui Setter',
  21: 'Evaluasi Flowchart Validasi Setter (Nilai Diluar Batas)',
  22: 'Evaluasi Flowchart Validasi Setter (Nilai Batas Bawah 0)',
  23: 'Keuntungan Pilar Inheritance (Code Reusability)',
  24: 'Pemanggilan Constructor Induk (parent::__construct)',
  25: 'Konsep Method Overriding pada Subclass',
  26: 'Kata Kunci Final Class pada PHP',
  27: 'Pengecekan Tipe Objek dengan Operator instanceof',
  28: 'Karakteristik dan Aturan Abstract Class',
  29: 'Kewajiban Implementasi Abstract Method pada Subclass',
  30: 'Sintaks Implementasi Interface (implements)',
  31: 'Penerapan Multiple Interface pada PHP',
  32: 'Pemanggilan Static Method Tanpa Objek (::)',
  33: 'Akses Static Property dari Dalam Method (self::$)',
  34: 'Akumulasi Static Counter Lintas Instance Objek',
  35: 'Penerapan Fitur Trait untuk Code Sharing (use)',
  36: 'Fitur Namespace Pengelompokan Class dan Anti Naming Collision',
  37: 'Fitur Autoloading Class (spl_autoload_register)',
  38: 'Fungsi Blok Catch pada Exception Handling',
  39: 'Karakteristik Eksekusi Blok Finally',
  40: 'Pengambilan Pesan Kesalahan Exception ($e->getMessage())',
  41: 'Evaluasi Flowchart Exception Handling Pembagian Nol',
  42: 'Evaluasi Flowchart Operasi Pembagian Normal',
  43: 'Inisialisasi Koneksi Database MySQLi Gaya OOP',
  44: 'Eksekusi Query dan Fetch Array Asosiatif MySQLi OOP',
  45: 'Pengecekan Status Error Koneksi Database ($conn->connect_error)',
  46: 'Penempatan Koneksi Database pada Constructor Class',
  47: 'Penerapan Pola Method Chaining (return $this)',
  48: 'Serialisasi Objek ke Format JSON (json_encode)',
  49: 'Magic Method Representasi String Objek (__toString)',
  50: 'Penerapan Polymorphism dan Inheritance pada Kasus E-Commerce'
};

function parseQuestions() {
  const rawText = fs.readFileSync('extracted_soal.txt', 'utf-8');
  const lines = rawText.split(/\r?\n/);
  const startIndex = lines.findIndex((l) => l.trim().startsWith('1. '));
  if (startIndex === -1) {
    throw new Error('Tidak menemukan awal soal 1.');
  }

  const questions = [];
  let currentQ = null;
  let currentOptionKey = null;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const qMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      if (currentQ) {
        questions.push(currentQ);
      }
      currentQ = {
        nomor: qNum,
        judul: `Soal ${String(qNum).padStart(2, '0')}: ${QUESTION_TITLES[qNum] || 'PBO AAS Ganjil'}`,
        pertanyaan: qMatch[2],
        opsi: [],
        kunci: ANSWER_KEYS[qNum],
        gambar_url: IMAGE_MAP[qNum] || null,
        bobot: 2.0
      };
      currentOptionKey = null;
      continue;
    }

    const optMatch = trimmed.match(/^([A-E])\.\s+(.*)$/);
    if (optMatch && currentQ) {
      currentOptionKey = optMatch[1];
      currentQ.opsi.push({
        id: currentOptionKey,
        label: currentOptionKey,
        teks: optMatch[2],
        urutan: currentOptionKey.charCodeAt(0) - 64
      });
      continue;
    }

    if (currentQ) {
      if (currentOptionKey) {
        const lastOpt = currentQ.opsi[currentQ.opsi.length - 1];
        if (trimmed.length > 0) {
          lastOpt.teks += '\n' + trimmed;
        }
      } else {
        if (trimmed.length > 0) {
          currentQ.pertanyaan += '\n' + trimmed;
        }
      }
    }
  }

  if (currentQ) {
    questions.push(currentQ);
  }

  return questions;
}

async function main() {
  console.log('--- MEMULAI IMPOR SOAL PBO AAS GANJIL 2026/2027 ---');
  const questions = parseQuestions();
  console.log(`Berhasil mem-parsing ${questions.length} butir soal.`);

  if (questions.length !== 50) {
    throw new Error(`Diharapkan 50 butir soal, ditemukan ${questions.length}`);
  }

  // 1. Buat atau temukan Folder Bank Soal
  let folder = await prisma.folderBankSoal.findFirst({
    where: {
      sekolah_id: SEKOLAH_ID,
      guru_id: GURU_ID,
      nama: 'AAS Ganjil 2026/2027 - PBO XII RPL'
    }
  });

  if (!folder) {
    folder = await prisma.folderBankSoal.create({
      data: {
        id: ulid(),
        sekolah_id: SEKOLAH_ID,
        guru_id: GURU_ID,
        nama: 'AAS Ganjil 2026/2027 - PBO XII RPL'
      }
    });
    console.log(`Membuat Folder Bank Soal baru: ${folder.nama} (${folder.id})`);
  } else {
    console.log(`Menggunakan Folder Bank Soal eksisting: ${folder.nama} (${folder.id})`);
  }

  // 2. Cek apakah soal dengan kode PBO-AAS-001 s/d 050 sudah ada, jika ada bersihkan dulu agar idempotent
  const existingCodes = questions.map(q => `PBO-AAS-${String(q.nomor).padStart(3, '0')}`);
  const existingQuestions = await prisma.bankSoal.findMany({
    where: {
      sekolah_id: SEKOLAH_ID,
      kode: { in: existingCodes }
    },
    select: { id: true }
  });

  if (existingQuestions.length > 0) {
    console.log(`Ditemukan ${existingQuestions.length} butir soal lama. Membersihkan...`);
    await prisma.bankSoal.deleteMany({
      where: { id: { in: existingQuestions.map(q => q.id) } }
    });
    console.log(`Soal lama berhasil dibersihkan.`);
  }

  // 3. Masukkan 50 butir soal BankSoal & VersiSoal
  console.log('Menyimpan 50 butir soal dan versi soal ke database...');
  const createdBankSoalList = [];

  for (const q of questions) {
    const bankSoalId = ulid();
    const versiSoalId = ulid();
    const kode = `PBO-AAS-${String(q.nomor).padStart(3, '0')}`;

    const bankSoal = await prisma.bankSoal.create({
      data: {
        id: bankSoalId,
        sekolah_id: SEKOLAH_ID,
        guru_id: GURU_ID,
        mata_pelajaran_id: MAPEL_ID,
        folder_id: folder.id,
        kode: kode,
        judul: q.judul,
        tipe_soal: 'PILIHAN_GANDA',
        tingkat_kesulitan: q.nomor <= 10 ? 'MUDAH' : q.nomor <= 35 ? 'SEDANG' : 'SULIT',
        scope_kepemilikan: 'SEKOLAH',
        level_kognitif: q.nomor <= 10 ? 'L1' : q.nomor <= 35 ? 'L2' : 'L3',
        versi_aktif: 1,
        status: 'AKTIF',
        versi_soal: {
          create: {
            id: versiSoalId,
            sekolah_id: SEKOLAH_ID,
            nomor_versi: 1,
            pertanyaan: q.pertanyaan,
            gambar_url: q.gambar_url,
            opsi_jawaban: JSON.stringify(q.opsi),
            kunci_jawaban: JSON.stringify([q.kunci]),
            pembahasan: `Kunci Jawaban: ${q.kunci}`,
            bobot_default: q.bobot,
            dibuat_oleh: USER_ID
          }
        }
      },
      include: {
        versi_soal: true
      }
    });

    createdBankSoalList.push({
      bank_soal_id: bankSoal.id,
      versi_soal_id: versiSoalId,
      nomor_urut: q.nomor,
      bobot: q.bobot,
      kunci: q.kunci,
      pertanyaan: q.pertanyaan,
      gambar_url: q.gambar_url,
      opsi: q.opsi
    });
  }

  console.log(`Berhasil menyimpan ${createdBankSoalList.length} butir BankSoal dan VersiSoal.`);

  // 4. Buat Blueprint untuk Ujian CBT
  const blueprint = createdBankSoalList.map(item => ({
    bank_soal_id: item.bank_soal_id,
    versi_soal_id: item.versi_soal_id,
    nomor_urut: item.nomor_urut,
    bobot: item.bobot
  }));

  // 5. Cek apakah ujian PBO AAS Ganjil sudah ada untuk penugasan ini
  const existingExam = await prisma.ujianCbt.findFirst({
    where: {
      sekolah_id: SEKOLAH_ID,
      penugasan_mengajar_id: PENUGASAN_ID,
      judul: { contains: 'AAS Ganjil 2026/2027 - Pemrograman Berorientasi Objek' }
    }
  });

  if (existingExam) {
    console.log(`Ujian CBT lama ditemukan (${existingExam.id}). Menghapus untuk pembaruan fresh...`);
    await prisma.ujianCbt.delete({
      where: { id: existingExam.id }
    });
  }

  const ujianId = ulid();
  const tokenMasuk = 'PBO12R';
  const waktuMulai = new Date('2026-12-01T07:30:00.000Z');
  const waktuSelesai = new Date('2026-12-31T17:00:00.000Z');

  const ujian = await prisma.ujianCbt.create({
    data: {
      id: ujianId,
      sekolah_id: SEKOLAH_ID,
      penugasan_mengajar_id: PENUGASAN_ID,
      judul: 'Asesmen Akhir Semester (AAS) Ganjil 2026/2027 - Pemrograman Berorientasi Objek (PBO)',
      deskripsi: 'Ujian Asesmen Akhir Semester Ganjil Tahun Pelajaran 2026/2027 untuk Mata Pelajaran Pemrograman Berorientasi Objek (PBO) Kelas XII RPL. Terdiri dari 50 butir soal Pilihan Ganda dengan alokasi waktu 90 menit dan bobot total 100.',
      durasi_menit: 90,
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      kkm_kktp: 75.0,
      acak_soal: false,
      acak_opsi: false,
      gunakan_token: true,
      token_masuk: tokenMasuk,
      tampilkan_nilai: true,
      tampilkan_pembahasan: false,
      maksimal_attempt: 1,
      status: 'DITERBITKAN',
      blueprint: JSON.stringify(blueprint)
    }
  });

  console.log(`Ujian CBT dibuat: ${ujian.judul} (ID: ${ujian.id})`);

  // 6. Susun Manifest Soal dan Kunci Penilaian untuk Snapshot Immutable
  const manifestItems = createdBankSoalList.map(item => ({
    nomor_urut: item.nomor_urut,
    soal_id: item.bank_soal_id,
    versi_soal_id: item.versi_soal_id,
    tipe_soal: 'PILIHAN_GANDA',
    pertanyaan: item.pertanyaan,
    gambar_url: item.gambar_url,
    opsi_jawaban: item.opsi,
    bobot: item.bobot
  }));

  const scoringKeys = createdBankSoalList.map(item => ({
    soal_id: item.bank_soal_id,
    versi_soal_id: item.versi_soal_id,
    tipe_soal: 'PILIHAN_GANDA',
    kunci_jawaban: [item.kunci],
    bobot: item.bobot
  }));

  const totalBobot = createdBankSoalList.reduce((acc, curr) => acc + curr.bobot, 0);

  const metadata = {
    ujian_id: ujian.id,
    judul: ujian.judul,
    deskripsi: ujian.deskripsi,
    durasi_menit: ujian.durasi_menit,
    kkm_kktp: ujian.kkm_kktp,
    mata_pelajaran: 'Pemrograman Berbasis Objek',
    mata_pelajaran_kode: 'PBO',
    guru_pengampu: 'Eri Chandra A, S.Kom',
    rombel: 'XII RPL',
    dibekukan_pada: new Date().toISOString(),
    dibekukan_oleh: USER_ID
  };

  const konfigurasi = {
    acak_soal: ujian.acak_soal,
    acak_opsi: ujian.acak_opsi,
    gunakan_token: ujian.gunakan_token,
    tampilkan_nilai: ujian.tampilkan_nilai,
    tampilkan_pembahasan: ujian.tampilkan_pembahasan,
    maksimal_attempt: ujian.maksimal_attempt
  };

  const canonicalString = JSON.stringify({
    metadata,
    konfigurasi,
    manifestSoal: manifestItems,
    kunciPenilaian: scoringKeys
  });
  const hashIntegritas = crypto.createHash('sha256').update(canonicalString).digest('hex');

  const snapshotId = ulid();

  const snapshot = await prisma.snapshotUjian.create({
    data: {
      id: snapshotId,
      sekolah_id: SEKOLAH_ID,
      ujian_cbt_id: ujian.id,
      nomor_snapshot: 1,
      total_soal: manifestItems.length,
      total_bobot: totalBobot,
      durasi_menit: ujian.durasi_menit,
      konfigurasi: JSON.stringify(konfigurasi),
      manifest_soal: JSON.stringify(manifestItems),
      kunci_penilaian: JSON.stringify(scoringKeys),
      metadata_ujian: JSON.stringify(metadata),
      hash_integritas: hashIntegritas,
      dibekukan_oleh: USER_ID
    }
  });

  await prisma.ujianCbt.update({
    where: { id: ujian.id },
    data: { snapshot_aktif_id: snapshot.id }
  });

  console.log(`Snapshot Ujian Immutable dibuat: Snapshot ID ${snapshot.id}, Hash: ${hashIntegritas.substring(0, 16)}...`);

  // 7. Buat ExamSession Sesi Pelaksanaan
  const sessionId = ulid();
  const session = await prisma.examSession.create({
    data: {
      id: sessionId,
      sekolah_id: SEKOLAH_ID,
      ujian_cbt_id: ujian.id,
      kode_sesi: 'SESI-01',
      nama_sesi: 'Sesi Utama AAS PBO XII RPL',
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      token: tokenMasuk,
      token_aktif: true,
      status: 'DIBUKA',
      ruang_ujian: 'Lab Komputer RPL 1',
      pengawas_nama: 'Eri Chandra Apriyadi, S.Kom',
      catatan: 'Sesi Pelaksanaan AAS Ganjil 2026/2027 PBO XII RPL'
    }
  });

  console.log(`Sesi Ujian (ExamSession) dibuat: ${session.nama_sesi} (ID: ${session.id}, Token: ${session.token})`);
  console.log('--- SUKSES: SELURUH 50 SOAL PBO TELAH BERHASIL DIMASUKKAN KE CBT RUANG PINTAR ---');
}

main()
  .catch((err) => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
