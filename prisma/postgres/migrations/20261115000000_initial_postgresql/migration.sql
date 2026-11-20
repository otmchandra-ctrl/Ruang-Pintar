-- CreateTable
CREATE TABLE "sekolah" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "npsn" TEXT,
    "jenjang" TEXT NOT NULL,
    "alamat" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "zona_waktu" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "logo_url" TEXT,
    "tipe_lisensi" TEXT NOT NULL DEFAULT 'FREEMIUM',
    "trial_berakhir_pada" TIMESTAMP(3),
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_organisasi" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "induk_unit_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_organisasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jabatan" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "kode_jabatan" TEXT NOT NULL,
    "nama_jabatan" TEXT NOT NULL,
    "tingkat_akses" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penugasan_jabatan" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "jabatan_id" TEXT NOT NULL,
    "personil_id" TEXT NOT NULL,
    "berlaku_mulai" TIMESTAMP(3) NOT NULL,
    "berlaku_sampai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penugasan_jabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "konfigurasi_sistem" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT,
    "kunci" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "konfigurasi_sistem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_berkas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT,
    "nama_file_asli" TEXT NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "ukuran_byte" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metadata_berkas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_audit" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT,
    "aktor_id" TEXT NOT NULL,
    "aktor_role" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "tipe_sumber" TEXT NOT NULL,
    "id_sumber" TEXT NOT NULL,
    "payload_sebelum" TEXT,
    "payload_sesudah" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_pesan" (
    "id" TEXT NOT NULL,
    "tipe_event" TEXT NOT NULL,
    "tipe_agregat" TEXT NOT NULL,
    "id_agregat" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "jumlah_percobaan" INTEGER NOT NULL DEFAULT 0,
    "maks_percobaan" INTEGER NOT NULL DEFAULT 5,
    "percobaan_berikutnya_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diproses_pada" TIMESTAMP(3),
    "pesan_error" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_pesan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "peran_dasar" TEXT NOT NULL,
    "status_akun" TEXT NOT NULL DEFAULT 'AKTIF',
    "harus_ganti_password" BOOLEAN NOT NULL DEFAULT false,
    "terakhir_login_pada" TIMESTAMP(3),
    "percobaan_login_gagal" INTEGER NOT NULL DEFAULT 0,
    "dikunci_sampai" TIMESTAMP(3),
    "foto_url" TEXT,
    "avatar_id" TEXT,
    "no_telepon" TEXT,
    "tipe_lisensi" TEXT NOT NULL DEFAULT 'FREEMIUM',
    "trial_berakhir_pada" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identitas_provider" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identitas_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kemampuan_staff" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "kode_kemampuan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kemampuan_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_pengguna" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_aktif_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "berlaku_sampai" TIMESTAMP(3) NOT NULL,
    "terakhir_aktif_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dicabut" BOOLEAN NOT NULL DEFAULT false,
    "alasan_cabut" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesi_pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keanggotaan_sekolah" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "peran_dasar_di_tenant" TEXT NOT NULL,
    "status_keanggotaan" TEXT NOT NULL DEFAULT 'PENDING',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "berlaku_mulai" TIMESTAMP(3),
    "berlaku_sampai" TIMESTAMP(3),
    "sumber_pendaftaran" TEXT NOT NULL DEFAULT 'MIGRASI_LEGACY',
    "disetujui_oleh_id" TEXT,
    "disetujui_pada" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keanggotaan_sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "langganan_tenant" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "paket" TEXT NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'TRIAL_ACTIVE',
    "mulai_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berakhir_pada" TIMESTAMP(3),
    "entitlement_json" TEXT,
    "sumber_aktivasi" TEXT NOT NULL DEFAULT 'MIGRASI_LEGACY',
    "transaksi_sumber_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "langganan_tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_percobaan_login" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "sukses" BOOLEAN NOT NULL,
    "alasan_gagal" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_percobaan_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_ajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fase" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tingkat_kelas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "fase_id" TEXT,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tingkat_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_keahlian" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenjang" TEXT,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_keahlian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rombel" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "dibuat_oleh_pengguna_id" TEXT,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "tingkat_id" TEXT NOT NULL,
    "fase_id" TEXT,
    "program_id" TEXT,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "kapasitas" INTEGER NOT NULL DEFAULT 36,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rombel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferensi_onboarding_guru" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "onboarding_eligible" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT true,
    "wizard_step" INTEGER NOT NULL DEFAULT 0,
    "mata_pelajaran_ids_json" TEXT NOT NULL DEFAULT '[]',
    "guru_mapel_aktif" BOOLEAN NOT NULL DEFAULT false,
    "wali_kelas_aktif" BOOLEAN NOT NULL DEFAULT false,
    "peran_dikonfirmasi_pada" TIMESTAMP(3),
    "mapel_dikonfirmasi_pada" TIMESTAMP(3),
    "siswa_ditunda_pada" TIMESTAMP(3),
    "jadwal_ditunda_pada" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferensi_onboarding_guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nis" TEXT,
    "nisn" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" TIMESTAMP(3),
    "agama" TEXT,
    "nik" TEXT,
    "alamat" TEXT,
    "nama_wali" TEXT,
    "telepon_wali" TEXT,
    "email_wali" TEXT,
    "status_akademik" TEXT NOT NULL DEFAULT 'AKTIF',
    "foto_url" TEXT,
    "tanggal_masuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_keluar" TIMESTAMP(3),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keikutsertaan_siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "tingkat_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "tanggal_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_selesai" TIMESTAMP(3),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keikutsertaan_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penempatan_rombel" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "keikutsertaan_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_selesai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "nomor_absen" INTEGER,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penempatan_rombel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nip" TEXT,
    "nuptk" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "gelar_depan" TEXT,
    "gelar_belakang" TEXT,
    "jenis_kelamin" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" TIMESTAMP(3),
    "email" TEXT,
    "telepon" TEXT,
    "alamat" TEXT,
    "status_kepegawaian" TEXT NOT NULL DEFAULT 'TETAP',
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "status_lifecycle" TEXT NOT NULL DEFAULT 'AKTIF',
    "foto_url" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_pelajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelompok" TEXT,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "status_lifecycle" TEXT NOT NULL DEFAULT 'AKTIF',
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mata_pelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penugasan_mengajar" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "rombel_id" TEXT NOT NULL,
    "jumlah_jam_minggu" INTEGER NOT NULL DEFAULT 2,
    "berlaku_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berlaku_sampai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penugasan_mengajar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penugasan_wali_kelas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "berlaku_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berlaku_sampai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penugasan_wali_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kalender_akademik" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tipe_event" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "libur_kbm" BOOLEAN NOT NULL DEFAULT false,
    "warna" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kalender_akademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_waktu" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "jam_mulai" TEXT NOT NULL,
    "jam_selesai" TEXT NOT NULL,
    "is_istirahat" BOOLEAN NOT NULL DEFAULT false,
    "is_upacara" BOOLEAN NOT NULL DEFAULT false,
    "hari_khusus" TEXT,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slot_waktu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versi_jadwal" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "nomor_versi" INTEGER NOT NULL DEFAULT 1,
    "nama" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tanggal_publikasi" TIMESTAMP(3),
    "dipublikasikan_oleh" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "versi_jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_pelajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "versi_jadwal_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "rombel_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "slot_waktu_id" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "ruangan" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_pelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_kelas_aktual" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "jadwal_pelajaran_id" TEXT,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "guru_pengganti_id" TEXT,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jam_mulai_aktual" TIMESTAMP(3),
    "jam_selesai_aktual" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TERJADWAL',
    "ruangan_aktual" TEXT,
    "topik_pembelajaran" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesi_kelas_aktual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lingkup_materi" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "kode" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lingkup_materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tujuan_pembelajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "lingkup_materi_id" TEXT NOT NULL,
    "capaian_pembelajaran_id" TEXT,
    "kode" TEXT,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tujuan_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi_pembelajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "lingkup_materi_id" TEXT,
    "mata_pelajaran_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tipe_konten" TEXT NOT NULL DEFAULT 'DOKUMEN',
    "konten_teks" TEXT,
    "tautan_url" TEXT,
    "berkas_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materi_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publikasi_materi" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "materi_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "tanggal_publikasi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DITERBITKAN',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publikasi_materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "definisi_tugas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "lingkup_materi_id" TEXT,
    "mata_pelajaran_id" TEXT,
    "judul" TEXT NOT NULL,
    "petunjuk" TEXT NOT NULL,
    "tipe_penyerahan" TEXT NOT NULL DEFAULT 'FILE',
    "berkas_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "definisi_tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publikasi_tugas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tugas_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batas_waktu" TIMESTAMP(3),
    "izinkan_terlambat" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DITERBITKAN',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publikasi_tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengumpulan_tugas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "publikasi_tugas_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "tanggal_kumpul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DIKUMPULKAN',
    "teks_jawaban" TEXT,
    "berkas_id" TEXT,
    "catatan_siswa" TEXT,
    "catatan_guru" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengumpulan_tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrasi_pembelajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "sesi_kelas_aktual_id" TEXT,
    "guru_id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "pertemuan_ke" INTEGER NOT NULL DEFAULT 1,
    "materi_disampaikan" TEXT NOT NULL,
    "kegiatan_pembelajaran" TEXT,
    "catatan_refleksi" TEXT,
    "status_realisasi" TEXT NOT NULL DEFAULT 'TERLAKSANA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administrasi_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrasi_tujuan_pembelajaran" (
    "id" TEXT NOT NULL,
    "administrasi_id" TEXT NOT NULL,
    "tp_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administrasi_tujuan_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi_sesi_kelas" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "sesi_kelas_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HADIR',
    "catatan" TEXT,
    "waktu_presensi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diinput_oleh" TEXT,
    "diubah_terakhir_oleh" TEXT,
    "alasan_koreksi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presensi_sesi_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "definisi_asesmen" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "tp_id" TEXT,
    "lingkup_materi_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'FORMATIF',
    "teknik_penilaian" TEXT NOT NULL DEFAULT 'TES_TERTULIS',
    "bobot" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "skala_maksimal" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "kkm_kktp" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "tanggal_pelaksanaan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "definisi_asesmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai_siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "asesmen_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "nilai_angka" DOUBLE PRECISION,
    "nilai_huruf" TEXT,
    "capaian_kompetensi" TEXT,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "diinput_oleh" TEXT,
    "diubah_terakhir_oleh" TEXT,
    "alasan_koreksi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nilai_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publikasi_nilai_asesmen" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "asesmen_id" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL DEFAULT 'SEMUA',
    "tanggal_publikasi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dipublikasikan_oleh" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publikasi_nilai_asesmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_soal" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "lingkup_materi_id" TEXT,
    "tujuan_pembelajaran_id" TEXT,
    "capaian_pembelajaran_id" TEXT,
    "folder_id" TEXT,
    "kode" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "tipe_soal" TEXT NOT NULL DEFAULT 'PILIHAN_GANDA',
    "tingkat_kesulitan" TEXT NOT NULL DEFAULT 'SEDANG',
    "scope_kepemilikan" TEXT NOT NULL DEFAULT 'PERSONAL',
    "level_kognitif" TEXT NOT NULL DEFAULT 'L2',
    "versi_aktif" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versi_soal" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "bank_soal_id" TEXT NOT NULL,
    "nomor_versi" INTEGER NOT NULL DEFAULT 1,
    "pertanyaan" TEXT NOT NULL,
    "gambar_url" TEXT,
    "opsi_jawaban" TEXT,
    "kunci_jawaban" TEXT,
    "pembahasan" TEXT,
    "bobot_default" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dibuat_oleh" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "versi_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_cbt" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "asesmen_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "durasi_menit" INTEGER NOT NULL DEFAULT 60,
    "waktu_mulai" TIMESTAMP(3),
    "waktu_selesai" TIMESTAMP(3),
    "kkm_kktp" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "acak_soal" BOOLEAN NOT NULL DEFAULT false,
    "acak_opsi" BOOLEAN NOT NULL DEFAULT false,
    "gunakan_token" BOOLEAN NOT NULL DEFAULT false,
    "token_masuk" TEXT,
    "tampilkan_nilai" BOOLEAN NOT NULL DEFAULT false,
    "tampilkan_pembahasan" BOOLEAN NOT NULL DEFAULT false,
    "maksimal_attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "blueprint" TEXT,
    "snapshot_aktif_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ujian_cbt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_ujian" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "nomor_snapshot" INTEGER NOT NULL DEFAULT 1,
    "total_soal" INTEGER NOT NULL,
    "total_bobot" DOUBLE PRECISION NOT NULL,
    "durasi_menit" INTEGER NOT NULL,
    "konfigurasi" TEXT NOT NULL,
    "manifest_soal" TEXT NOT NULL,
    "kunci_penilaian" TEXT NOT NULL,
    "metadata_ujian" TEXT,
    "hash_integritas" TEXT,
    "dibekukan_oleh" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_session" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "kode_sesi" TEXT NOT NULL,
    "nama_sesi" TEXT NOT NULL,
    "waktu_mulai" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "token_aktif" BOOLEAN NOT NULL DEFAULT true,
    "token_expired_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TERJADWAL',
    "ruang_ujian" TEXT,
    "pengawas_nama" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempt" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "exam_session_id" TEXT,
    "snapshot_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "attempt_ke" INTEGER NOT NULL DEFAULT 1,
    "waktu_mulai" TIMESTAMP(3),
    "batas_waktu_server" TIMESTAMP(3),
    "waktu_selesai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "urutan_soal_peserta" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "token_sesi_aktif" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_ujian_siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "attempt_ke" INTEGER NOT NULL DEFAULT 1,
    "waktu_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batas_waktu_server" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SEDANG_MENGERJAKAN',
    "urutan_soal_peserta" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "token_sesi_aktif" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesi_ujian_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "sesi_ujian_id" TEXT NOT NULL,
    "soal_id" TEXT NOT NULL,
    "versi_soal_id" TEXT NOT NULL,
    "jawaban_peserta" TEXT,
    "ragu_ragu" BOOLEAN NOT NULL DEFAULT false,
    "apakah_benar" BOOLEAN,
    "skor_diperoleh" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "catatan_koreksi" TEXT,
    "waktu_simpan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jawaban_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hasil_ujian_cbt" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "sesi_ujian_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "total_soal" INTEGER NOT NULL,
    "total_dijawab" INTEGER NOT NULL,
    "jumlah_benar" INTEGER NOT NULL DEFAULT 0,
    "jumlah_salah" INTEGER NOT NULL DEFAULT 0,
    "jumlah_kosong" INTEGER NOT NULL DEFAULT 0,
    "skor_mentah" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "skor_maksimal" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "nilai_akhir" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "apakah_tuntas" BOOLEAN NOT NULL DEFAULT false,
    "status_penilaian" TEXT NOT NULL DEFAULT 'LENGKAP',
    "status_transfer" TEXT NOT NULL DEFAULT 'BELUM_DITRANSFER',
    "ditransfer_ke_nilai_siswa_id" TEXT,
    "waktu_transfer" TIMESTAMP(3),
    "ditransfer_oleh" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hasil_ujian_cbt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_integritas_ujian" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "sesi_ujian_id" TEXT NOT NULL,
    "jenis_event" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "payload" TEXT,
    "waktu_kejadian" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_integritas_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wali_murid" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "jenis_kelamin" TEXT,
    "no_telepon" TEXT,
    "email" TEXT,
    "pekerjaan" TEXT,
    "penghasilan" TEXT,
    "alamat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wali_murid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubungan_wali_siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "wali_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "jenis_hubungan" TEXT NOT NULL,
    "status_verifikasi" TEXT NOT NULL DEFAULT 'TERVERIFIKASI',
    "apakah_wali_utama" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubungan_wali_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan_wali" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "wali_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3),
    "tanggal_selesai" TIMESTAMP(3),
    "lampiran_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "catatan_tanggapan" TEXT,
    "ditanggapi_oleh_id" TEXT,
    "ditanggapi_pada" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_wali_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengumuman" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "penulis_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "apakah_disematkan" BOOLEAN NOT NULL DEFAULT false,
    "lampiran_url" TEXT,
    "target_audiens" TEXT NOT NULL DEFAULT 'SEMUA',
    "target_rombel_id" TEXT,
    "dipublikasikan_pada" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sasaran_pengumuman" (
    "id" TEXT NOT NULL,
    "pengumuman_id" TEXT NOT NULL,
    "tipe_sasaran" TEXT NOT NULL,
    "nilai_sasaran" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sasaran_pengumuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi_pengguna" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "tautan_url" TEXT,
    "apakah_dibaca" BOOLEAN NOT NULL DEFAULT false,
    "dibaca_pada" TIMESTAMP(3),
    "data_tambahan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifikasi_pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferensi_notifikasi" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "in_app_aktif" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_aktif" BOOLEAN NOT NULL DEFAULT true,
    "email_aktif" BOOLEAN NOT NULL DEFAULT false,
    "notif_pengumuman" BOOLEAN NOT NULL DEFAULT true,
    "notif_tugas" BOOLEAN NOT NULL DEFAULT true,
    "notif_nilai" BOOLEAN NOT NULL DEFAULT true,
    "notif_presensi" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferensi_notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catatan_monitoring" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penulis_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "tingkat_urgensi" TEXT NOT NULL DEFAULT 'SEDANG',
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catatan_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tindak_lanjut_monitoring" (
    "id" TEXT NOT NULL,
    "catatan_id" TEXT NOT NULL,
    "penanggung_jawab_id" TEXT,
    "tindakan" TEXT NOT NULL,
    "target_tanggal" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DIRENCANAKAN',
    "hasil" TEXT,
    "tanggal_penyelesaian" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tindak_lanjut_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_ekspor_laporan" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tipe_laporan" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "parameter_filter_json" TEXT,
    "total_baris" INTEGER NOT NULL DEFAULT 0,
    "dibuat_oleh_id" TEXT NOT NULL,
    "berkas_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "riwayat_ekspor_laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "konfigurasi_integrasi" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tipe_layanan" TEXT NOT NULL,
    "nama_konfigurasi" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "kredensial_json" TEXT,
    "parameter_json" TEXT,
    "terakhir_diuji_pada" TIMESTAMP(3),
    "status_uji_terakhir" TEXT,
    "catatan_uji" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "konfigurasi_integrasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endpoint_webhook" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "url_target" TEXT NOT NULL,
    "secret_token" TEXT NOT NULL,
    "event_langganan_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "retry_count_max" INTEGER NOT NULL DEFAULT 3,
    "timeout_detik" INTEGER NOT NULL DEFAULT 10,
    "terakhir_dipicu_pada" TIMESTAMP(3),
    "total_terkirim" INTEGER NOT NULL DEFAULT 0,
    "total_gagal" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoint_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_pengiriman_integrasi" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tipe_layanan" TEXT NOT NULL,
    "arah" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "event_name" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "penerima" TEXT,
    "judul" TEXT,
    "payload_json" TEXT NOT NULL,
    "respons_status_code" INTEGER,
    "respons_body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "jumlah_percobaan" INTEGER NOT NULL DEFAULT 1,
    "error_message" TEXT,
    "durasi_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_pengiriman_integrasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permintaan_setup_kelas_ai" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "nama_kelas" TEXT NOT NULL,
    "mata_pelajaran" TEXT,
    "foto_url" TEXT NOT NULL,
    "hasil_ekstraksi_json" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rombel_id_hasil" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permintaan_setup_kelas_ai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi_langganan" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_id" TEXT,
    "paket" TEXT NOT NULL DEFAULT 'GURU_PRO_BULANAN',
    "nominal" INTEGER NOT NULL,
    "biaya_admin" INTEGER NOT NULL DEFAULT 0,
    "total_bayar" INTEGER NOT NULL,
    "metode_pembayaran" TEXT NOT NULL DEFAULT 'QRIS',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "snap_token" TEXT,
    "snap_redirect_url" TEXT,
    "qris_url" TEXT,
    "waktu_transaksi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dibayar_pada" TIMESTAMP(3),
    "kadaluarsa_pada" TIMESTAMP(3),
    "durasi_bulan" INTEGER NOT NULL DEFAULT 1,
    "payload_notifikasi_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_langganan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapor_siswa" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatan_wali_kelas" TEXT,
    "saran_tindak_lanjut" TEXT,
    "ekstrakurikuler_json" TEXT,
    "tanggal_validasi" TIMESTAMP(3),
    "divalidasi_oleh" TEXT,
    "tanggal_publikasi" TIMESTAMP(3),
    "dipublikasikan_oleh" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapor_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_bank_soal" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "warna" TEXT DEFAULT '#3B82F6',
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_bank_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capaian_pembelajaran" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "fase_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "elemen" TEXT,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capaian_pembelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kriteria_ketercapaian_tp" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "tujuan_pembelajaran_id" TEXT NOT NULL,
    "tipe_kktp" TEXT NOT NULL DEFAULT 'SKALA_INTERVAL',
    "ambang_tuntas" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "interval_json" TEXT,
    "rubrik_json" TEXT,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kriteria_ketercapaian_tp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kisi_kisi_asesmen" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "definisi_asesmen_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "tahun_ajaran" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "alokasi_waktu_menit" INTEGER NOT NULL DEFAULT 90,
    "total_butir_soal" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatan_supervisi" TEXT,
    "snapshot_hash" TEXT,
    "tanggal_dibekukan" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kisi_kisi_asesmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_kisi_kisi" (
    "id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "kisi_kisi_id" TEXT NOT NULL,
    "tujuan_pembelajaran_id" TEXT NOT NULL,
    "nomor_urut" INTEGER NOT NULL,
    "indikator_soal" TEXT NOT NULL,
    "level_kognitif" TEXT NOT NULL DEFAULT 'L2',
    "bentuk_soal" TEXT NOT NULL DEFAULT 'PILIHAN_GANDA',
    "bobot_skor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "bank_soal_id" TEXT,
    "versi_soal_id" TEXT,
    "snapshot_pertanyaan" TEXT,
    "snapshot_opsi" TEXT,
    "snapshot_kunci" TEXT,
    "snapshot_pembahasan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_kisi_kisi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sekolah_npsn_key" ON "sekolah"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "unit_organisasi_sekolah_id_nama_key" ON "unit_organisasi"("sekolah_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "jabatan_sekolah_id_kode_jabatan_key" ON "jabatan"("sekolah_id", "kode_jabatan");

-- CreateIndex
CREATE INDEX "penugasan_jabatan_personil_id_status_idx" ON "penugasan_jabatan"("personil_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "konfigurasi_sistem_sekolah_id_kunci_key" ON "konfigurasi_sistem"("sekolah_id", "kunci");

-- CreateIndex
CREATE UNIQUE INDEX "metadata_berkas_storage_key_key" ON "metadata_berkas"("storage_key");

-- CreateIndex
CREATE INDEX "metadata_berkas_storage_provider_status_idx" ON "metadata_berkas"("storage_provider", "status");

-- CreateIndex
CREATE INDEX "log_audit_sekolah_id_dibuat_pada_idx" ON "log_audit"("sekolah_id", "dibuat_pada");

-- CreateIndex
CREATE INDEX "log_audit_aktor_id_dibuat_pada_idx" ON "log_audit"("aktor_id", "dibuat_pada");

-- CreateIndex
CREATE INDEX "log_audit_tipe_sumber_id_sumber_idx" ON "log_audit"("tipe_sumber", "id_sumber");

-- CreateIndex
CREATE INDEX "outbox_pesan_status_percobaan_berikutnya_pada_idx" ON "outbox_pesan"("status", "percobaan_berikutnya_pada");

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_username_key" ON "pengguna"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

-- CreateIndex
CREATE INDEX "pengguna_sekolah_id_peran_dasar_idx" ON "pengguna"("sekolah_id", "peran_dasar");

-- CreateIndex
CREATE INDEX "pengguna_status_akun_idx" ON "pengguna"("status_akun");

-- CreateIndex
CREATE INDEX "identitas_provider_pengguna_id_provider_idx" ON "identitas_provider"("pengguna_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "identitas_provider_provider_subject_key" ON "identitas_provider"("provider", "subject");

-- CreateIndex
CREATE INDEX "kemampuan_staff_kode_kemampuan_idx" ON "kemampuan_staff"("kode_kemampuan");

-- CreateIndex
CREATE UNIQUE INDEX "kemampuan_staff_pengguna_id_kode_kemampuan_key" ON "kemampuan_staff"("pengguna_id", "kode_kemampuan");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_pengguna_token_hash_key" ON "sesi_pengguna"("token_hash");

-- CreateIndex
CREATE INDEX "sesi_pengguna_pengguna_id_dicabut_berlaku_sampai_idx" ON "sesi_pengguna"("pengguna_id", "dicabut", "berlaku_sampai");

-- CreateIndex
CREATE INDEX "sesi_pengguna_sekolah_aktif_id_dicabut_berlaku_sampai_idx" ON "sesi_pengguna"("sekolah_aktif_id", "dicabut", "berlaku_sampai");

-- CreateIndex
CREATE INDEX "keanggotaan_sekolah_sekolah_id_status_keanggotaan_idx" ON "keanggotaan_sekolah"("sekolah_id", "status_keanggotaan");

-- CreateIndex
CREATE INDEX "keanggotaan_sekolah_pengguna_id_status_keanggotaan_idx" ON "keanggotaan_sekolah"("pengguna_id", "status_keanggotaan");

-- CreateIndex
CREATE INDEX "keanggotaan_sekolah_sekolah_id_is_owner_status_keanggotaan_idx" ON "keanggotaan_sekolah"("sekolah_id", "is_owner", "status_keanggotaan");

-- CreateIndex
CREATE UNIQUE INDEX "keanggotaan_sekolah_pengguna_id_sekolah_id_key" ON "keanggotaan_sekolah"("pengguna_id", "sekolah_id");

-- CreateIndex
CREATE INDEX "langganan_tenant_sekolah_id_status_berakhir_pada_idx" ON "langganan_tenant"("sekolah_id", "status", "berakhir_pada");

-- CreateIndex
CREATE INDEX "langganan_tenant_transaksi_sumber_id_idx" ON "langganan_tenant"("transaksi_sumber_id");

-- CreateIndex
CREATE INDEX "log_percobaan_login_identifier_dibuat_pada_idx" ON "log_percobaan_login"("identifier", "dibuat_pada");

-- CreateIndex
CREATE INDEX "log_percobaan_login_ip_address_dibuat_pada_idx" ON "log_percobaan_login"("ip_address", "dibuat_pada");

-- CreateIndex
CREATE INDEX "tahun_ajaran_sekolah_id_status_idx" ON "tahun_ajaran"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_ajaran_sekolah_id_nama_key" ON "tahun_ajaran"("sekolah_id", "nama");

-- CreateIndex
CREATE INDEX "semester_sekolah_id_status_idx" ON "semester"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "semester_tahun_ajaran_id_kode_key" ON "semester"("tahun_ajaran_id", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "fase_sekolah_id_kode_key" ON "fase"("sekolah_id", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "tingkat_kelas_sekolah_id_kode_key" ON "tingkat_kelas"("sekolah_id", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "program_keahlian_sekolah_id_kode_key" ON "program_keahlian"("sekolah_id", "kode");

-- CreateIndex
CREATE INDEX "rombel_sekolah_id_tahun_ajaran_id_status_idx" ON "rombel"("sekolah_id", "tahun_ajaran_id", "status");

-- CreateIndex
CREATE INDEX "rombel_sekolah_id_dibuat_oleh_pengguna_id_idx" ON "rombel"("sekolah_id", "dibuat_oleh_pengguna_id");

-- CreateIndex
CREATE UNIQUE INDEX "rombel_sekolah_id_tahun_ajaran_id_nama_key" ON "rombel"("sekolah_id", "tahun_ajaran_id", "nama");

-- CreateIndex
CREATE INDEX "preferensi_onboarding_guru_sekolah_id_updated_at_idx" ON "preferensi_onboarding_guru"("sekolah_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "preferensi_onboarding_guru_pengguna_id_sekolah_id_key" ON "preferensi_onboarding_guru"("pengguna_id", "sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_pengguna_id_key" ON "siswa"("pengguna_id");

-- CreateIndex
CREATE INDEX "siswa_sekolah_id_status_akademik_idx" ON "siswa"("sekolah_id", "status_akademik");

-- CreateIndex
CREATE INDEX "siswa_sekolah_id_nisn_idx" ON "siswa"("sekolah_id", "nisn");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_sekolah_id_nis_key" ON "siswa"("sekolah_id", "nis");

-- CreateIndex
CREATE INDEX "keikutsertaan_siswa_sekolah_id_tahun_ajaran_id_status_idx" ON "keikutsertaan_siswa"("sekolah_id", "tahun_ajaran_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "keikutsertaan_siswa_siswa_id_tahun_ajaran_id_key" ON "keikutsertaan_siswa"("siswa_id", "tahun_ajaran_id");

-- CreateIndex
CREATE INDEX "penempatan_rombel_rombel_id_status_idx" ON "penempatan_rombel"("rombel_id", "status");

-- CreateIndex
CREATE INDEX "penempatan_rombel_keikutsertaan_id_status_idx" ON "penempatan_rombel"("keikutsertaan_id", "status");

-- CreateIndex
CREATE INDEX "penempatan_rombel_sekolah_id_status_idx" ON "penempatan_rombel"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "guru_pengguna_id_key" ON "guru"("pengguna_id");

-- CreateIndex
CREATE INDEX "guru_sekolah_id_status_aktif_idx" ON "guru"("sekolah_id", "status_aktif");

-- CreateIndex
CREATE INDEX "guru_sekolah_id_status_lifecycle_idx" ON "guru"("sekolah_id", "status_lifecycle");

-- CreateIndex
CREATE INDEX "guru_sekolah_id_nip_idx" ON "guru"("sekolah_id", "nip");

-- CreateIndex
CREATE INDEX "guru_sekolah_id_nuptk_idx" ON "guru"("sekolah_id", "nuptk");

-- CreateIndex
CREATE INDEX "mata_pelajaran_sekolah_id_status_aktif_idx" ON "mata_pelajaran"("sekolah_id", "status_aktif");

-- CreateIndex
CREATE INDEX "mata_pelajaran_sekolah_id_status_lifecycle_idx" ON "mata_pelajaran"("sekolah_id", "status_lifecycle");

-- CreateIndex
CREATE UNIQUE INDEX "mata_pelajaran_sekolah_id_kode_key" ON "mata_pelajaran"("sekolah_id", "kode");

-- CreateIndex
CREATE INDEX "penugasan_mengajar_guru_id_status_idx" ON "penugasan_mengajar"("guru_id", "status");

-- CreateIndex
CREATE INDEX "penugasan_mengajar_rombel_id_status_idx" ON "penugasan_mengajar"("rombel_id", "status");

-- CreateIndex
CREATE INDEX "penugasan_mengajar_sekolah_id_tahun_ajaran_id_status_idx" ON "penugasan_mengajar"("sekolah_id", "tahun_ajaran_id", "status");

-- CreateIndex
CREATE INDEX "penugasan_wali_kelas_guru_id_status_idx" ON "penugasan_wali_kelas"("guru_id", "status");

-- CreateIndex
CREATE INDEX "penugasan_wali_kelas_rombel_id_status_idx" ON "penugasan_wali_kelas"("rombel_id", "status");

-- CreateIndex
CREATE INDEX "penugasan_wali_kelas_sekolah_id_tahun_ajaran_id_status_idx" ON "penugasan_wali_kelas"("sekolah_id", "tahun_ajaran_id", "status");

-- CreateIndex
CREATE INDEX "kalender_akademik_sekolah_id_tahun_ajaran_id_tanggal_mulai_idx" ON "kalender_akademik"("sekolah_id", "tahun_ajaran_id", "tanggal_mulai");

-- CreateIndex
CREATE INDEX "kalender_akademik_sekolah_id_tipe_event_idx" ON "kalender_akademik"("sekolah_id", "tipe_event");

-- CreateIndex
CREATE INDEX "slot_waktu_sekolah_id_urutan_idx" ON "slot_waktu"("sekolah_id", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "slot_waktu_sekolah_id_kode_key" ON "slot_waktu"("sekolah_id", "kode");

-- CreateIndex
CREATE INDEX "versi_jadwal_sekolah_id_tahun_ajaran_id_status_idx" ON "versi_jadwal"("sekolah_id", "tahun_ajaran_id", "status");

-- CreateIndex
CREATE INDEX "jadwal_pelajaran_versi_jadwal_id_hari_slot_waktu_id_idx" ON "jadwal_pelajaran"("versi_jadwal_id", "hari", "slot_waktu_id");

-- CreateIndex
CREATE INDEX "jadwal_pelajaran_guru_id_hari_slot_waktu_id_idx" ON "jadwal_pelajaran"("guru_id", "hari", "slot_waktu_id");

-- CreateIndex
CREATE INDEX "jadwal_pelajaran_rombel_id_hari_slot_waktu_id_idx" ON "jadwal_pelajaran"("rombel_id", "hari", "slot_waktu_id");

-- CreateIndex
CREATE INDEX "sesi_kelas_aktual_guru_id_tanggal_status_idx" ON "sesi_kelas_aktual"("guru_id", "tanggal", "status");

-- CreateIndex
CREATE INDEX "sesi_kelas_aktual_rombel_id_tanggal_status_idx" ON "sesi_kelas_aktual"("rombel_id", "tanggal", "status");

-- CreateIndex
CREATE INDEX "sesi_kelas_aktual_jadwal_pelajaran_id_tanggal_idx" ON "sesi_kelas_aktual"("jadwal_pelajaran_id", "tanggal");

-- CreateIndex
CREATE INDEX "lingkup_materi_penugasan_mengajar_id_urutan_idx" ON "lingkup_materi"("penugasan_mengajar_id", "urutan");

-- CreateIndex
CREATE INDEX "lingkup_materi_sekolah_id_status_idx" ON "lingkup_materi"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "tujuan_pembelajaran_lingkup_materi_id_urutan_idx" ON "tujuan_pembelajaran"("lingkup_materi_id", "urutan");

-- CreateIndex
CREATE INDEX "tujuan_pembelajaran_sekolah_id_status_idx" ON "tujuan_pembelajaran"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "tujuan_pembelajaran_capaian_pembelajaran_id_idx" ON "tujuan_pembelajaran"("capaian_pembelajaran_id");

-- CreateIndex
CREATE INDEX "materi_pembelajaran_guru_id_status_idx" ON "materi_pembelajaran"("guru_id", "status");

-- CreateIndex
CREATE INDEX "materi_pembelajaran_sekolah_id_status_idx" ON "materi_pembelajaran"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "publikasi_materi_penugasan_mengajar_id_status_idx" ON "publikasi_materi"("penugasan_mengajar_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "publikasi_materi_materi_id_penugasan_mengajar_id_key" ON "publikasi_materi"("materi_id", "penugasan_mengajar_id");

-- CreateIndex
CREATE INDEX "definisi_tugas_guru_id_status_idx" ON "definisi_tugas"("guru_id", "status");

-- CreateIndex
CREATE INDEX "definisi_tugas_sekolah_id_status_idx" ON "definisi_tugas"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "publikasi_tugas_penugasan_mengajar_id_status_idx" ON "publikasi_tugas"("penugasan_mengajar_id", "status");

-- CreateIndex
CREATE INDEX "pengumpulan_tugas_siswa_id_status_idx" ON "pengumpulan_tugas"("siswa_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pengumpulan_tugas_publikasi_tugas_id_siswa_id_key" ON "pengumpulan_tugas"("publikasi_tugas_id", "siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "administrasi_pembelajaran_sesi_kelas_aktual_id_key" ON "administrasi_pembelajaran"("sesi_kelas_aktual_id");

-- CreateIndex
CREATE INDEX "administrasi_pembelajaran_penugasan_mengajar_id_tanggal_idx" ON "administrasi_pembelajaran"("penugasan_mengajar_id", "tanggal");

-- CreateIndex
CREATE INDEX "administrasi_pembelajaran_guru_id_tanggal_idx" ON "administrasi_pembelajaran"("guru_id", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "administrasi_tujuan_pembelajaran_administrasi_id_tp_id_key" ON "administrasi_tujuan_pembelajaran"("administrasi_id", "tp_id");

-- CreateIndex
CREATE INDEX "presensi_sesi_kelas_sesi_kelas_id_status_idx" ON "presensi_sesi_kelas"("sesi_kelas_id", "status");

-- CreateIndex
CREATE INDEX "presensi_sesi_kelas_siswa_id_status_idx" ON "presensi_sesi_kelas"("siswa_id", "status");

-- CreateIndex
CREATE INDEX "presensi_sesi_kelas_sekolah_id_status_idx" ON "presensi_sesi_kelas"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_sesi_kelas_sesi_kelas_id_siswa_id_key" ON "presensi_sesi_kelas"("sesi_kelas_id", "siswa_id");

-- CreateIndex
CREATE INDEX "definisi_asesmen_penugasan_mengajar_id_tanggal_pelaksanaan_idx" ON "definisi_asesmen"("penugasan_mengajar_id", "tanggal_pelaksanaan");

-- CreateIndex
CREATE INDEX "definisi_asesmen_tp_id_idx" ON "definisi_asesmen"("tp_id");

-- CreateIndex
CREATE INDEX "definisi_asesmen_lingkup_materi_id_idx" ON "definisi_asesmen"("lingkup_materi_id");

-- CreateIndex
CREATE INDEX "definisi_asesmen_sekolah_id_status_idx" ON "definisi_asesmen"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "nilai_siswa_asesmen_id_status_idx" ON "nilai_siswa"("asesmen_id", "status");

-- CreateIndex
CREATE INDEX "nilai_siswa_siswa_id_idx" ON "nilai_siswa"("siswa_id");

-- CreateIndex
CREATE INDEX "nilai_siswa_sekolah_id_status_idx" ON "nilai_siswa"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "nilai_siswa_asesmen_id_siswa_id_key" ON "nilai_siswa"("asesmen_id", "siswa_id");

-- CreateIndex
CREATE INDEX "publikasi_nilai_asesmen_asesmen_id_status_idx" ON "publikasi_nilai_asesmen"("asesmen_id", "status");

-- CreateIndex
CREATE INDEX "publikasi_nilai_asesmen_sekolah_id_status_idx" ON "publikasi_nilai_asesmen"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "bank_soal_sekolah_id_mata_pelajaran_id_status_idx" ON "bank_soal"("sekolah_id", "mata_pelajaran_id", "status");

-- CreateIndex
CREATE INDEX "bank_soal_sekolah_id_scope_kepemilikan_mata_pelajaran_id_idx" ON "bank_soal"("sekolah_id", "scope_kepemilikan", "mata_pelajaran_id");

-- CreateIndex
CREATE INDEX "bank_soal_guru_id_idx" ON "bank_soal"("guru_id");

-- CreateIndex
CREATE INDEX "bank_soal_lingkup_materi_id_idx" ON "bank_soal"("lingkup_materi_id");

-- CreateIndex
CREATE INDEX "bank_soal_tujuan_pembelajaran_id_idx" ON "bank_soal"("tujuan_pembelajaran_id");

-- CreateIndex
CREATE INDEX "bank_soal_capaian_pembelajaran_id_idx" ON "bank_soal"("capaian_pembelajaran_id");

-- CreateIndex
CREATE INDEX "bank_soal_folder_id_idx" ON "bank_soal"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_soal_sekolah_id_kode_key" ON "bank_soal"("sekolah_id", "kode");

-- CreateIndex
CREATE INDEX "versi_soal_sekolah_id_idx" ON "versi_soal"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "versi_soal_bank_soal_id_nomor_versi_key" ON "versi_soal"("bank_soal_id", "nomor_versi");

-- CreateIndex
CREATE INDEX "ujian_cbt_sekolah_id_penugasan_mengajar_id_status_idx" ON "ujian_cbt"("sekolah_id", "penugasan_mengajar_id", "status");

-- CreateIndex
CREATE INDEX "ujian_cbt_penugasan_mengajar_id_idx" ON "ujian_cbt"("penugasan_mengajar_id");

-- CreateIndex
CREATE INDEX "ujian_cbt_asesmen_id_idx" ON "ujian_cbt"("asesmen_id");

-- CreateIndex
CREATE INDEX "snapshot_ujian_sekolah_id_idx" ON "snapshot_ujian"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "snapshot_ujian_ujian_cbt_id_nomor_snapshot_key" ON "snapshot_ujian"("ujian_cbt_id", "nomor_snapshot");

-- CreateIndex
CREATE INDEX "exam_session_sekolah_id_status_idx" ON "exam_session"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "exam_session_ujian_cbt_id_idx" ON "exam_session"("ujian_cbt_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_session_ujian_cbt_id_kode_sesi_key" ON "exam_session"("ujian_cbt_id", "kode_sesi");

-- CreateIndex
CREATE INDEX "assessment_attempt_siswa_id_status_idx" ON "assessment_attempt"("siswa_id", "status");

-- CreateIndex
CREATE INDEX "assessment_attempt_ujian_cbt_id_status_idx" ON "assessment_attempt"("ujian_cbt_id", "status");

-- CreateIndex
CREATE INDEX "assessment_attempt_exam_session_id_idx" ON "assessment_attempt"("exam_session_id");

-- CreateIndex
CREATE INDEX "assessment_attempt_sekolah_id_status_idx" ON "assessment_attempt"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_attempt_ujian_cbt_id_siswa_id_attempt_ke_key" ON "assessment_attempt"("ujian_cbt_id", "siswa_id", "attempt_ke");

-- CreateIndex
CREATE INDEX "sesi_ujian_siswa_siswa_id_status_idx" ON "sesi_ujian_siswa"("siswa_id", "status");

-- CreateIndex
CREATE INDEX "sesi_ujian_siswa_ujian_cbt_id_status_idx" ON "sesi_ujian_siswa"("ujian_cbt_id", "status");

-- CreateIndex
CREATE INDEX "sesi_ujian_siswa_snapshot_id_idx" ON "sesi_ujian_siswa"("snapshot_id");

-- CreateIndex
CREATE INDEX "sesi_ujian_siswa_sekolah_id_status_idx" ON "sesi_ujian_siswa"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_ujian_siswa_ujian_cbt_id_siswa_id_attempt_ke_key" ON "sesi_ujian_siswa"("ujian_cbt_id", "siswa_id", "attempt_ke");

-- CreateIndex
CREATE INDEX "jawaban_siswa_sesi_ujian_id_idx" ON "jawaban_siswa"("sesi_ujian_id");

-- CreateIndex
CREATE INDEX "jawaban_siswa_soal_id_idx" ON "jawaban_siswa"("soal_id");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_siswa_sesi_ujian_id_soal_id_key" ON "jawaban_siswa"("sesi_ujian_id", "soal_id");

-- CreateIndex
CREATE UNIQUE INDEX "hasil_ujian_cbt_sesi_ujian_id_key" ON "hasil_ujian_cbt"("sesi_ujian_id");

-- CreateIndex
CREATE INDEX "hasil_ujian_cbt_ujian_cbt_id_siswa_id_idx" ON "hasil_ujian_cbt"("ujian_cbt_id", "siswa_id");

-- CreateIndex
CREATE INDEX "hasil_ujian_cbt_sekolah_id_status_transfer_idx" ON "hasil_ujian_cbt"("sekolah_id", "status_transfer");

-- CreateIndex
CREATE INDEX "event_integritas_ujian_sesi_ujian_id_waktu_kejadian_idx" ON "event_integritas_ujian"("sesi_ujian_id", "waktu_kejadian");

-- CreateIndex
CREATE INDEX "event_integritas_ujian_sekolah_id_idx" ON "event_integritas_ujian"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "wali_murid_pengguna_id_key" ON "wali_murid"("pengguna_id");

-- CreateIndex
CREATE INDEX "wali_murid_sekolah_id_idx" ON "wali_murid"("sekolah_id");

-- CreateIndex
CREATE INDEX "hubungan_wali_siswa_sekolah_id_status_verifikasi_idx" ON "hubungan_wali_siswa"("sekolah_id", "status_verifikasi");

-- CreateIndex
CREATE INDEX "hubungan_wali_siswa_siswa_id_idx" ON "hubungan_wali_siswa"("siswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "hubungan_wali_siswa_wali_id_siswa_id_key" ON "hubungan_wali_siswa"("wali_id", "siswa_id");

-- CreateIndex
CREATE INDEX "pengajuan_wali_sekolah_id_status_idx" ON "pengajuan_wali"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "pengajuan_wali_siswa_id_idx" ON "pengajuan_wali"("siswa_id");

-- CreateIndex
CREATE INDEX "pengumuman_sekolah_id_status_idx" ON "pengumuman"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "pengumuman_sekolah_id_target_audiens_idx" ON "pengumuman"("sekolah_id", "target_audiens");

-- CreateIndex
CREATE INDEX "pengumuman_penulis_id_idx" ON "pengumuman"("penulis_id");

-- CreateIndex
CREATE INDEX "pengumuman_target_rombel_id_idx" ON "pengumuman"("target_rombel_id");

-- CreateIndex
CREATE INDEX "sasaran_pengumuman_pengumuman_id_idx" ON "sasaran_pengumuman"("pengumuman_id");

-- CreateIndex
CREATE INDEX "sasaran_pengumuman_tipe_sasaran_nilai_sasaran_idx" ON "sasaran_pengumuman"("tipe_sasaran", "nilai_sasaran");

-- CreateIndex
CREATE INDEX "notifikasi_pengguna_pengguna_id_apakah_dibaca_idx" ON "notifikasi_pengguna"("pengguna_id", "apakah_dibaca");

-- CreateIndex
CREATE INDEX "notifikasi_pengguna_sekolah_id_created_at_idx" ON "notifikasi_pengguna"("sekolah_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "preferensi_notifikasi_pengguna_id_key" ON "preferensi_notifikasi"("pengguna_id");

-- CreateIndex
CREATE INDEX "catatan_monitoring_sekolah_id_rombel_id_idx" ON "catatan_monitoring"("sekolah_id", "rombel_id");

-- CreateIndex
CREATE INDEX "catatan_monitoring_siswa_id_status_idx" ON "catatan_monitoring"("siswa_id", "status");

-- CreateIndex
CREATE INDEX "catatan_monitoring_penulis_id_idx" ON "catatan_monitoring"("penulis_id");

-- CreateIndex
CREATE INDEX "tindak_lanjut_monitoring_catatan_id_status_idx" ON "tindak_lanjut_monitoring"("catatan_id", "status");

-- CreateIndex
CREATE INDEX "riwayat_ekspor_laporan_sekolah_id_tipe_laporan_idx" ON "riwayat_ekspor_laporan"("sekolah_id", "tipe_laporan");

-- CreateIndex
CREATE INDEX "riwayat_ekspor_laporan_dibuat_oleh_id_idx" ON "riwayat_ekspor_laporan"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "konfigurasi_integrasi_sekolah_id_status_idx" ON "konfigurasi_integrasi"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "konfigurasi_integrasi_sekolah_id_tipe_layanan_provider_key" ON "konfigurasi_integrasi"("sekolah_id", "tipe_layanan", "provider");

-- CreateIndex
CREATE INDEX "endpoint_webhook_sekolah_id_status_idx" ON "endpoint_webhook"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "log_pengiriman_integrasi_idempotency_key_key" ON "log_pengiriman_integrasi"("idempotency_key");

-- CreateIndex
CREATE INDEX "log_pengiriman_integrasi_sekolah_id_tipe_layanan_status_idx" ON "log_pengiriman_integrasi"("sekolah_id", "tipe_layanan", "status");

-- CreateIndex
CREATE INDEX "log_pengiriman_integrasi_sekolah_id_created_at_idx" ON "log_pengiriman_integrasi"("sekolah_id", "created_at");

-- CreateIndex
CREATE INDEX "permintaan_setup_kelas_ai_sekolah_id_status_idx" ON "permintaan_setup_kelas_ai"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "permintaan_setup_kelas_ai_pengguna_id_idx" ON "permintaan_setup_kelas_ai"("pengguna_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_langganan_order_id_key" ON "transaksi_langganan"("order_id");

-- CreateIndex
CREATE INDEX "transaksi_langganan_pengguna_id_idx" ON "transaksi_langganan"("pengguna_id");

-- CreateIndex
CREATE INDEX "transaksi_langganan_status_idx" ON "transaksi_langganan"("status");

-- CreateIndex
CREATE INDEX "transaksi_langganan_order_id_idx" ON "transaksi_langganan"("order_id");

-- CreateIndex
CREATE INDEX "rapor_siswa_penempatan_rombel_id_status_idx" ON "rapor_siswa"("penempatan_rombel_id", "status");

-- CreateIndex
CREATE INDEX "rapor_siswa_sekolah_id_status_idx" ON "rapor_siswa"("sekolah_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "rapor_siswa_siswa_id_semester_id_key" ON "rapor_siswa"("siswa_id", "semester_id");

-- CreateIndex
CREATE INDEX "folder_bank_soal_sekolah_id_guru_id_idx" ON "folder_bank_soal"("sekolah_id", "guru_id");

-- CreateIndex
CREATE INDEX "folder_bank_soal_parent_id_idx" ON "folder_bank_soal"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_bank_soal_sekolah_id_guru_id_parent_id_nama_key" ON "folder_bank_soal"("sekolah_id", "guru_id", "parent_id", "nama");

-- CreateIndex
CREATE INDEX "capaian_pembelajaran_sekolah_id_mata_pelajaran_id_status_idx" ON "capaian_pembelajaran"("sekolah_id", "mata_pelajaran_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "capaian_pembelajaran_sekolah_id_mata_pelajaran_id_fase_id_k_key" ON "capaian_pembelajaran"("sekolah_id", "mata_pelajaran_id", "fase_id", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "kriteria_ketercapaian_tp_tujuan_pembelajaran_id_key" ON "kriteria_ketercapaian_tp"("tujuan_pembelajaran_id");

-- CreateIndex
CREATE INDEX "kriteria_ketercapaian_tp_sekolah_id_idx" ON "kriteria_ketercapaian_tp"("sekolah_id");

-- CreateIndex
CREATE UNIQUE INDEX "kisi_kisi_asesmen_definisi_asesmen_id_key" ON "kisi_kisi_asesmen"("definisi_asesmen_id");

-- CreateIndex
CREATE INDEX "kisi_kisi_asesmen_sekolah_id_status_idx" ON "kisi_kisi_asesmen"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "item_kisi_kisi_sekolah_id_kisi_kisi_id_idx" ON "item_kisi_kisi"("sekolah_id", "kisi_kisi_id");

-- CreateIndex
CREATE INDEX "item_kisi_kisi_tujuan_pembelajaran_id_idx" ON "item_kisi_kisi"("tujuan_pembelajaran_id");

-- CreateIndex
CREATE INDEX "item_kisi_kisi_bank_soal_id_idx" ON "item_kisi_kisi"("bank_soal_id");

-- CreateIndex
CREATE INDEX "item_kisi_kisi_versi_soal_id_idx" ON "item_kisi_kisi"("versi_soal_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_kisi_kisi_kisi_kisi_id_nomor_urut_key" ON "item_kisi_kisi"("kisi_kisi_id", "nomor_urut");

-- AddForeignKey
ALTER TABLE "unit_organisasi" ADD CONSTRAINT "unit_organisasi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_organisasi" ADD CONSTRAINT "unit_organisasi_induk_unit_id_fkey" FOREIGN KEY ("induk_unit_id") REFERENCES "unit_organisasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jabatan" ADD CONSTRAINT "jabatan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jabatan" ADD CONSTRAINT "jabatan_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit_organisasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_jabatan" ADD CONSTRAINT "penugasan_jabatan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_jabatan" ADD CONSTRAINT "penugasan_jabatan_jabatan_id_fkey" FOREIGN KEY ("jabatan_id") REFERENCES "jabatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "konfigurasi_sistem" ADD CONSTRAINT "konfigurasi_sistem_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_berkas" ADD CONSTRAINT "metadata_berkas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_audit" ADD CONSTRAINT "log_audit_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identitas_provider" ADD CONSTRAINT "identitas_provider_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kemampuan_staff" ADD CONSTRAINT "kemampuan_staff_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_pengguna" ADD CONSTRAINT "sesi_pengguna_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_pengguna" ADD CONSTRAINT "sesi_pengguna_sekolah_aktif_id_fkey" FOREIGN KEY ("sekolah_aktif_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keanggotaan_sekolah" ADD CONSTRAINT "keanggotaan_sekolah_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keanggotaan_sekolah" ADD CONSTRAINT "keanggotaan_sekolah_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "langganan_tenant" ADD CONSTRAINT "langganan_tenant_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahun_ajaran" ADD CONSTRAINT "tahun_ajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester" ADD CONSTRAINT "semester_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester" ADD CONSTRAINT "semester_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fase" ADD CONSTRAINT "fase_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tingkat_kelas" ADD CONSTRAINT "tingkat_kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tingkat_kelas" ADD CONSTRAINT "tingkat_kelas_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_keahlian" ADD CONSTRAINT "program_keahlian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_dibuat_oleh_pengguna_id_fkey" FOREIGN KEY ("dibuat_oleh_pengguna_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_tingkat_id_fkey" FOREIGN KEY ("tingkat_id") REFERENCES "tingkat_kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombel" ADD CONSTRAINT "rombel_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program_keahlian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferensi_onboarding_guru" ADD CONSTRAINT "preferensi_onboarding_guru_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferensi_onboarding_guru" ADD CONSTRAINT "preferensi_onboarding_guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keikutsertaan_siswa" ADD CONSTRAINT "keikutsertaan_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keikutsertaan_siswa" ADD CONSTRAINT "keikutsertaan_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keikutsertaan_siswa" ADD CONSTRAINT "keikutsertaan_siswa_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keikutsertaan_siswa" ADD CONSTRAINT "keikutsertaan_siswa_tingkat_id_fkey" FOREIGN KEY ("tingkat_id") REFERENCES "tingkat_kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_rombel" ADD CONSTRAINT "penempatan_rombel_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_rombel" ADD CONSTRAINT "penempatan_rombel_keikutsertaan_id_fkey" FOREIGN KEY ("keikutsertaan_id") REFERENCES "keikutsertaan_siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_rombel" ADD CONSTRAINT "penempatan_rombel_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_pelajaran" ADD CONSTRAINT "mata_pelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_mengajar" ADD CONSTRAINT "penugasan_mengajar_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_mengajar" ADD CONSTRAINT "penugasan_mengajar_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_mengajar" ADD CONSTRAINT "penugasan_mengajar_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_mengajar" ADD CONSTRAINT "penugasan_mengajar_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_mengajar" ADD CONSTRAINT "penugasan_mengajar_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_mengajar" ADD CONSTRAINT "penugasan_mengajar_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_wali_kelas" ADD CONSTRAINT "penugasan_wali_kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_wali_kelas" ADD CONSTRAINT "penugasan_wali_kelas_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_wali_kelas" ADD CONSTRAINT "penugasan_wali_kelas_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_wali_kelas" ADD CONSTRAINT "penugasan_wali_kelas_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalender_akademik" ADD CONSTRAINT "kalender_akademik_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalender_akademik" ADD CONSTRAINT "kalender_akademik_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalender_akademik" ADD CONSTRAINT "kalender_akademik_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_waktu" ADD CONSTRAINT "slot_waktu_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versi_jadwal" ADD CONSTRAINT "versi_jadwal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versi_jadwal" ADD CONSTRAINT "versi_jadwal_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versi_jadwal" ADD CONSTRAINT "versi_jadwal_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_versi_jadwal_id_fkey" FOREIGN KEY ("versi_jadwal_id") REFERENCES "versi_jadwal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_slot_waktu_id_fkey" FOREIGN KEY ("slot_waktu_id") REFERENCES "slot_waktu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_jadwal_pelajaran_id_fkey" FOREIGN KEY ("jadwal_pelajaran_id") REFERENCES "jadwal_pelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_guru_pengganti_id_fkey" FOREIGN KEY ("guru_pengganti_id") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_kelas_aktual" ADD CONSTRAINT "sesi_kelas_aktual_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lingkup_materi" ADD CONSTRAINT "lingkup_materi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lingkup_materi" ADD CONSTRAINT "lingkup_materi_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tujuan_pembelajaran" ADD CONSTRAINT "tujuan_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tujuan_pembelajaran" ADD CONSTRAINT "tujuan_pembelajaran_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tujuan_pembelajaran" ADD CONSTRAINT "tujuan_pembelajaran_capaian_pembelajaran_id_fkey" FOREIGN KEY ("capaian_pembelajaran_id") REFERENCES "capaian_pembelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_pembelajaran" ADD CONSTRAINT "materi_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_pembelajaran" ADD CONSTRAINT "materi_pembelajaran_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_pembelajaran" ADD CONSTRAINT "materi_pembelajaran_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_pembelajaran" ADD CONSTRAINT "materi_pembelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_pembelajaran" ADD CONSTRAINT "materi_pembelajaran_berkas_id_fkey" FOREIGN KEY ("berkas_id") REFERENCES "metadata_berkas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_materi" ADD CONSTRAINT "publikasi_materi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_materi" ADD CONSTRAINT "publikasi_materi_materi_id_fkey" FOREIGN KEY ("materi_id") REFERENCES "materi_pembelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_materi" ADD CONSTRAINT "publikasi_materi_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_tugas" ADD CONSTRAINT "definisi_tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_tugas" ADD CONSTRAINT "definisi_tugas_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_tugas" ADD CONSTRAINT "definisi_tugas_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_tugas" ADD CONSTRAINT "definisi_tugas_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_tugas" ADD CONSTRAINT "definisi_tugas_berkas_id_fkey" FOREIGN KEY ("berkas_id") REFERENCES "metadata_berkas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_tugas" ADD CONSTRAINT "publikasi_tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_tugas" ADD CONSTRAINT "publikasi_tugas_tugas_id_fkey" FOREIGN KEY ("tugas_id") REFERENCES "definisi_tugas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_tugas" ADD CONSTRAINT "publikasi_tugas_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan_tugas" ADD CONSTRAINT "pengumpulan_tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan_tugas" ADD CONSTRAINT "pengumpulan_tugas_publikasi_tugas_id_fkey" FOREIGN KEY ("publikasi_tugas_id") REFERENCES "publikasi_tugas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan_tugas" ADD CONSTRAINT "pengumpulan_tugas_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan_tugas" ADD CONSTRAINT "pengumpulan_tugas_berkas_id_fkey" FOREIGN KEY ("berkas_id") REFERENCES "metadata_berkas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrasi_pembelajaran" ADD CONSTRAINT "administrasi_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrasi_pembelajaran" ADD CONSTRAINT "administrasi_pembelajaran_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrasi_pembelajaran" ADD CONSTRAINT "administrasi_pembelajaran_sesi_kelas_aktual_id_fkey" FOREIGN KEY ("sesi_kelas_aktual_id") REFERENCES "sesi_kelas_aktual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrasi_pembelajaran" ADD CONSTRAINT "administrasi_pembelajaran_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrasi_tujuan_pembelajaran" ADD CONSTRAINT "administrasi_tujuan_pembelajaran_administrasi_id_fkey" FOREIGN KEY ("administrasi_id") REFERENCES "administrasi_pembelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrasi_tujuan_pembelajaran" ADD CONSTRAINT "administrasi_tujuan_pembelajaran_tp_id_fkey" FOREIGN KEY ("tp_id") REFERENCES "tujuan_pembelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_sesi_kelas" ADD CONSTRAINT "presensi_sesi_kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_sesi_kelas" ADD CONSTRAINT "presensi_sesi_kelas_sesi_kelas_id_fkey" FOREIGN KEY ("sesi_kelas_id") REFERENCES "sesi_kelas_aktual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_sesi_kelas" ADD CONSTRAINT "presensi_sesi_kelas_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_sesi_kelas" ADD CONSTRAINT "presensi_sesi_kelas_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_asesmen" ADD CONSTRAINT "definisi_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_asesmen" ADD CONSTRAINT "definisi_asesmen_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_asesmen" ADD CONSTRAINT "definisi_asesmen_tp_id_fkey" FOREIGN KEY ("tp_id") REFERENCES "tujuan_pembelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definisi_asesmen" ADD CONSTRAINT "definisi_asesmen_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_siswa" ADD CONSTRAINT "nilai_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_siswa" ADD CONSTRAINT "nilai_siswa_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "definisi_asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_siswa" ADD CONSTRAINT "nilai_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_siswa" ADD CONSTRAINT "nilai_siswa_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_nilai_asesmen" ADD CONSTRAINT "publikasi_nilai_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publikasi_nilai_asesmen" ADD CONSTRAINT "publikasi_nilai_asesmen_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "definisi_asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_capaian_pembelajaran_id_fkey" FOREIGN KEY ("capaian_pembelajaran_id") REFERENCES "capaian_pembelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder_bank_soal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versi_soal" ADD CONSTRAINT "versi_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versi_soal" ADD CONSTRAINT "versi_soal_bank_soal_id_fkey" FOREIGN KEY ("bank_soal_id") REFERENCES "bank_soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_cbt" ADD CONSTRAINT "ujian_cbt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_cbt" ADD CONSTRAINT "ujian_cbt_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_cbt" ADD CONSTRAINT "ujian_cbt_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "definisi_asesmen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_ujian" ADD CONSTRAINT "snapshot_ujian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_ujian" ADD CONSTRAINT "snapshot_ujian_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_session" ADD CONSTRAINT "exam_session_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_session" ADD CONSTRAINT "exam_session_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_exam_session_id_fkey" FOREIGN KEY ("exam_session_id") REFERENCES "exam_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_ujian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempt" ADD CONSTRAINT "assessment_attempt_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_ujian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_sesi_ujian_id_fkey" FOREIGN KEY ("sesi_ujian_id") REFERENCES "sesi_ujian_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_ujian_cbt" ADD CONSTRAINT "hasil_ujian_cbt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_ujian_cbt" ADD CONSTRAINT "hasil_ujian_cbt_sesi_ujian_id_fkey" FOREIGN KEY ("sesi_ujian_id") REFERENCES "sesi_ujian_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_ujian_cbt" ADD CONSTRAINT "hasil_ujian_cbt_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_ujian_cbt" ADD CONSTRAINT "hasil_ujian_cbt_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_integritas_ujian" ADD CONSTRAINT "event_integritas_ujian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_integritas_ujian" ADD CONSTRAINT "event_integritas_ujian_sesi_ujian_id_fkey" FOREIGN KEY ("sesi_ujian_id") REFERENCES "sesi_ujian_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wali_murid" ADD CONSTRAINT "wali_murid_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wali_murid" ADD CONSTRAINT "wali_murid_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubungan_wali_siswa" ADD CONSTRAINT "hubungan_wali_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubungan_wali_siswa" ADD CONSTRAINT "hubungan_wali_siswa_wali_id_fkey" FOREIGN KEY ("wali_id") REFERENCES "wali_murid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubungan_wali_siswa" ADD CONSTRAINT "hubungan_wali_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_wali" ADD CONSTRAINT "pengajuan_wali_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_wali" ADD CONSTRAINT "pengajuan_wali_wali_id_fkey" FOREIGN KEY ("wali_id") REFERENCES "wali_murid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_wali" ADD CONSTRAINT "pengajuan_wali_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_penulis_id_fkey" FOREIGN KEY ("penulis_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_target_rombel_id_fkey" FOREIGN KEY ("target_rombel_id") REFERENCES "rombel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sasaran_pengumuman" ADD CONSTRAINT "sasaran_pengumuman_pengumuman_id_fkey" FOREIGN KEY ("pengumuman_id") REFERENCES "pengumuman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi_pengguna" ADD CONSTRAINT "notifikasi_pengguna_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi_pengguna" ADD CONSTRAINT "notifikasi_pengguna_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferensi_notifikasi" ADD CONSTRAINT "preferensi_notifikasi_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_monitoring" ADD CONSTRAINT "catatan_monitoring_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_monitoring" ADD CONSTRAINT "catatan_monitoring_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_monitoring" ADD CONSTRAINT "catatan_monitoring_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_monitoring" ADD CONSTRAINT "catatan_monitoring_penulis_id_fkey" FOREIGN KEY ("penulis_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tindak_lanjut_monitoring" ADD CONSTRAINT "tindak_lanjut_monitoring_catatan_id_fkey" FOREIGN KEY ("catatan_id") REFERENCES "catatan_monitoring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tindak_lanjut_monitoring" ADD CONSTRAINT "tindak_lanjut_monitoring_penanggung_jawab_id_fkey" FOREIGN KEY ("penanggung_jawab_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_ekspor_laporan" ADD CONSTRAINT "riwayat_ekspor_laporan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_ekspor_laporan" ADD CONSTRAINT "riwayat_ekspor_laporan_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "konfigurasi_integrasi" ADD CONSTRAINT "konfigurasi_integrasi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endpoint_webhook" ADD CONSTRAINT "endpoint_webhook_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_pengiriman_integrasi" ADD CONSTRAINT "log_pengiriman_integrasi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permintaan_setup_kelas_ai" ADD CONSTRAINT "permintaan_setup_kelas_ai_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permintaan_setup_kelas_ai" ADD CONSTRAINT "permintaan_setup_kelas_ai_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_langganan" ADD CONSTRAINT "transaksi_langganan_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_langganan" ADD CONSTRAINT "transaksi_langganan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_siswa" ADD CONSTRAINT "rapor_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_siswa" ADD CONSTRAINT "rapor_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_siswa" ADD CONSTRAINT "rapor_siswa_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_bank_soal" ADD CONSTRAINT "folder_bank_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_bank_soal" ADD CONSTRAINT "folder_bank_soal_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_bank_soal" ADD CONSTRAINT "folder_bank_soal_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folder_bank_soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capaian_pembelajaran" ADD CONSTRAINT "capaian_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capaian_pembelajaran" ADD CONSTRAINT "capaian_pembelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capaian_pembelajaran" ADD CONSTRAINT "capaian_pembelajaran_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kriteria_ketercapaian_tp" ADD CONSTRAINT "kriteria_ketercapaian_tp_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kriteria_ketercapaian_tp" ADD CONSTRAINT "kriteria_ketercapaian_tp_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kisi_kisi_asesmen" ADD CONSTRAINT "kisi_kisi_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kisi_kisi_asesmen" ADD CONSTRAINT "kisi_kisi_asesmen_definisi_asesmen_id_fkey" FOREIGN KEY ("definisi_asesmen_id") REFERENCES "definisi_asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_kisi_kisi" ADD CONSTRAINT "item_kisi_kisi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_kisi_kisi" ADD CONSTRAINT "item_kisi_kisi_kisi_kisi_id_fkey" FOREIGN KEY ("kisi_kisi_id") REFERENCES "kisi_kisi_asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_kisi_kisi" ADD CONSTRAINT "item_kisi_kisi_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_kisi_kisi" ADD CONSTRAINT "item_kisi_kisi_bank_soal_id_fkey" FOREIGN KEY ("bank_soal_id") REFERENCES "bank_soal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_kisi_kisi" ADD CONSTRAINT "item_kisi_kisi_versi_soal_id_fkey" FOREIGN KEY ("versi_soal_id") REFERENCES "versi_soal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

