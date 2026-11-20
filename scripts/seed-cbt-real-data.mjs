import { PrismaClient } from "@prisma/client";
import { ulid } from "ulidx";

const prisma = new PrismaClient();

async function main() {
  console.log("Menyiapkan data real CBT untuk guru Pak Eri Chandra A...");

  const sekolahId = "01M2XXYD227F9S3H985FH53GMF"; // SMK OTOMINDO
  const guru = await prisma.guru.findFirst({
    where: { sekolah_id: sekolahId, nama_lengkap: { contains: "Eri Chandra" } },
  });

  if (!guru) {
    console.error("Guru Eri Chandra tidak ditemukan");
    return;
  }

  // Cari penugasan mengajar X DKV 1 KKA
  const penugasan = await prisma.penugasanMengajar.findFirst({
    where: {
      sekolah_id: sekolahId,
      guru_id: guru.id,
      rombel: { nama: "X DKV 1" },
    },
    include: {
      rombel: true,
      mata_pelajaran: true,
    },
  });

  if (!penugasan) {
    console.error("Penugasan X DKV 1 KKA tidak ditemukan");
    return;
  }

  console.log(
    `Menggunakan penugasan: ${penugasan.id} (${penugasan.rombel.nama} - ${penugasan.mata_pelajaran.nama})`
  );

  // Siswa X DKV 1
  const penempatan = await prisma.penempatanRombel.findFirst({
    where: {
      rombel_id: penugasan.rombel_id,
      status: "AKTIF",
    },
    include: {
      keikutsertaan: {
        include: { siswa: true },
      },
    },
  });

  const siswa = penempatan?.keikutsertaan.siswa;

  // 1. Bank Soal Koding & AI
  const bankSoalExisting = await prisma.bankSoal.findFirst({
    where: { sekolah_id: sekolahId, guru_id: guru.id },
  });

  if (!bankSoalExisting) {
    const bankSoal1Id = ulid();
    await prisma.bankSoal.create({
      data: {
        id: bankSoal1Id,
        sekolah_id: sekolahId,
        guru_id: guru.id,
        mata_pelajaran_id: penugasan.mata_pelajaran_id,
        kode: "KKA-SOAL-001",
        judul: "Konsep Dasar Algoritma & Flowchart",
        tipe_soal: "PILIHAN_GANDA",
        tingkat_kesulitan: "SEDANG",
        scope_kepemilikan: "SEKOLAH",
        level_kognitif: "L2",
        status: "AKTIF",
        versi_soal: {
          create: {
            id: ulid(),
            sekolah_id: sekolahId,
            nomor_versi: 1,
            pertanyaan:
              "Simbol flowchart yang digunakan untuk pengambilan keputusan (decision) adalah...",
            opsi_jawaban: JSON.stringify([
              { id: "A", teks: "Persegi Panjang", urutan: 1 },
              { id: "B", teks: "Belah Ketupat (Diamond)", urutan: 2 },
              { id: "C", teks: "Lingkaran", urutan: 3 },
              { id: "D", teks: "Jajar Genjang", urutan: 4 },
            ]),
            kunci_jawaban: JSON.stringify(["B"]),
            pembahasan: "Belah ketupat melambangkan kondisi logika atau percabangan.",
            bobot_default: 1.0,
            dibuat_oleh: guru.nama_lengkap,
          },
        },
      },
    });

    const bankSoal2Id = ulid();
    await prisma.bankSoal.create({
      data: {
        id: bankSoal2Id,
        sekolah_id: sekolahId,
        guru_id: guru.id,
        mata_pelajaran_id: penugasan.mata_pelajaran_id,
        kode: "KKA-SOAL-002",
        judul: "Implementasi Fungsi Rekursif Esai",
        tipe_soal: "ESAI",
        tingkat_kesulitan: "SULIT",
        scope_kepemilikan: "PERSONAL",
        level_kognitif: "L3",
        status: "AKTIF",
        versi_soal: {
          create: {
            id: ulid(),
            sekolah_id: sekolahId,
            nomor_versi: 1,
            pertanyaan:
              "Jelaskan perbedaan mendasar antara perulangan iteratif dengan rekursif serta risiko stack overflow!",
            opsi_jawaban: null,
            kunci_jawaban: JSON.stringify([
              "Perulangan iteratif menggunakan loop counter, sedangkan rekursif memanggil dirinya sendiri sampai base case terpenuhi.",
            ]),
            pembahasan:
              "Kriteria penilaian: kejelasan konsep base case dan alokasi memory call stack.",
            bobot_default: 5.0,
            dibuat_oleh: guru.nama_lengkap,
          },
        },
      },
    });

    console.log("Bank soal berhasil dibuat.");
  }

  // 2. Ujian 1: Selesai dengan Koreksi Esai Tertunda (PERLU_KOREKSI_MANUAL)
  let ujian1 = await prisma.ujianCbt.findFirst({
    where: { penugasan_mengajar_id: penugasan.id, judul: "Evaluasi Pemrograman Web & Algoritma" },
  });

  if (!ujian1) {
    const ujian1Id = ulid();
    const snapshot1Id = ulid();

    ujian1 = await prisma.ujianCbt.create({
      data: {
        id: ujian1Id,
        sekolah_id: sekolahId,
        penugasan_mengajar_id: penugasan.id,
        judul: "Evaluasi Pemrograman Web & Algoritma",
        deskripsi: "Evaluasi bab 2 pemahaman algoritma dan logika percabangan",
        durasi_menit: 45,
        status: "SELESAI",
        kkm_kktp: 75.0,
        tampilkan_nilai: true,
        snapshot_aktif_id: snapshot1Id,
        snapshot_ujian: {
          create: {
            id: snapshot1Id,
            sekolah_id: sekolahId,
            nomor_snapshot: 1,
            total_soal: 10,
            total_bobot: 100,
            durasi_menit: 45,
            konfigurasi: JSON.stringify({ acak_soal: false, kktp: 75 }),
            manifest_soal: JSON.stringify([]),
            kunci_penilaian: JSON.stringify([]),
            dibekukan_oleh: guru.nama_lengkap,
          },
        },
      },
    });

    // Buat sesi pengerjaan siswa yang butuh koreksi esai
    if (siswa) {
      const sesiId = ulid();
      await prisma.sesiUjianSiswa.create({
        data: {
          id: sesiId,
          sekolah_id: sekolahId,
          ujian_cbt_id: ujian1Id,
          snapshot_id: snapshot1Id,
          siswa_id: siswa.id,
          attempt_ke: 1,
          waktu_mulai: new Date(Date.now() - 3600000 * 2),
          batas_waktu_server: new Date(Date.now() - 3600000),
          waktu_selesai: new Date(Date.now() - 3600000),
          status: "DIKUMPULKAN",
          hasil: {
            create: {
              id: ulid(),
              sekolah_id: sekolahId,
              siswa_id: siswa.id,
              ujian_cbt_id: ujian1Id,
              total_soal: 10,
              total_dijawab: 10,
              jumlah_benar: 7,
              jumlah_salah: 2,
              jumlah_kosong: 0,
              skor_mentah: 70.0,
              skor_maksimal: 100.0,
              nilai_akhir: 70.0,
              apakah_tuntas: false,
              status_penilaian: "PERLU_KOREKSI_MANUAL", // Butuh koreksi esai!
              status_transfer: "BELUM_DITRANSFER",
            },
          },
        },
      });
    }

    console.log("Ujian 1 (Koreksi Esai) berhasil dibuat.");
  }

  // 3. Ujian 2: Ujian Siap Diterbitkan (DRAFT)
  let ujian2 = await prisma.ujianCbt.findFirst({
    where: {
      penugasan_mengajar_id: penugasan.id,
      judul: "Persiapan PTS Koding & Kecerdasan Artifisial",
    },
  });

  if (!ujian2) {
    const ujian2Id = ulid();
    const snapshot2Id = ulid();

    ujian2 = await prisma.ujianCbt.create({
      data: {
        id: ujian2Id,
        sekolah_id: sekolahId,
        penugasan_mengajar_id: penugasan.id,
        judul: "Persiapan PTS Koding & Kecerdasan Artifisial",
        deskripsi: "Simulasi persiapan Penilaian Tengah Semester Gasal",
        durasi_menit: 60,
        status: "DRAFT",
        kkm_kktp: 75.0,
        gunakan_token: true,
        token_masuk: "PTSKKA",
        snapshot_aktif_id: snapshot2Id,
        snapshot_ujian: {
          create: {
            id: snapshot2Id,
            sekolah_id: sekolahId,
            nomor_snapshot: 1,
            total_soal: 25,
            total_bobot: 100,
            durasi_menit: 60,
            konfigurasi: JSON.stringify({ acak_soal: true, kktp: 75 }),
            manifest_soal: JSON.stringify([]),
            kunci_penilaian: JSON.stringify([]),
            dibekukan_oleh: guru.nama_lengkap,
          },
        },
      },
    });

    console.log("Ujian 2 (Siap Diterbitkan) berhasil dibuat.");
  }

  // 4. Ujian 3: Naskah Belum Ada Snapshot (Perlu Bekukan Snapshot Naskah)
  let ujian3 = await prisma.ujianCbt.findFirst({
    where: { penugasan_mengajar_id: penugasan.id, judul: "Asesmen Semester Logika & Pemrograman" },
  });

  if (!ujian3) {
    const ujian3Id = ulid();
    ujian3 = await prisma.ujianCbt.create({
      data: {
        id: ujian3Id,
        sekolah_id: sekolahId,
        penugasan_mengajar_id: penugasan.id,
        judul: "Asesmen Semester Logika & Pemrograman",
        deskripsi: "Kisi-kisi & butir asesmen akhir semester ganjil",
        durasi_menit: 90,
        status: "DRAFT",
        kkm_kktp: 75.0,
        snapshot_aktif_id: null, // Belum dibekukan snapshot-nya!
      },
    });

    console.log("Ujian 3 (Belum Ada Snapshot) berhasil dibuat.");
  }

  console.log("Semua data real CBT telah terkonfigurasi dengan sukses di database!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
