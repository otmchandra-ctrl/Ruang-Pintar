CREATE TABLE "sekolah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "npsn" TEXT,
    "jenjang" TEXT NOT NULL,
    "alamat" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "zona_waktu" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "logo_url" TEXT,
    "tipe_lisensi" TEXT NOT NULL DEFAULT 'FREEMIUM',
    "trial_berakhir_pada" DATETIME,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE "unit_organisasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "induk_unit_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "unit_organisasi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "unit_organisasi_induk_unit_id_fkey" FOREIGN KEY ("induk_unit_id") REFERENCES "unit_organisasi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "jabatan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "kode_jabatan" TEXT NOT NULL,
    "nama_jabatan" TEXT NOT NULL,
    "tingkat_akses" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "jabatan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jabatan_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit_organisasi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "penugasan_jabatan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "jabatan_id" TEXT NOT NULL,
    "personil_id" TEXT NOT NULL,
    "berlaku_mulai" DATETIME NOT NULL,
    "berlaku_sampai" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "penugasan_jabatan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_jabatan_jabatan_id_fkey" FOREIGN KEY ("jabatan_id") REFERENCES "jabatan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "konfigurasi_sistem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT,
    "kunci" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "deskripsi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "konfigurasi_sistem_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "metadata_berkas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT,
    "nama_file_asli" TEXT NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "ukuran_byte" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "metadata_berkas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "log_audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "log_audit_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "outbox_pesan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipe_event" TEXT NOT NULL,
    "tipe_agregat" TEXT NOT NULL,
    "id_agregat" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "jumlah_percobaan" INTEGER NOT NULL DEFAULT 0,
    "maks_percobaan" INTEGER NOT NULL DEFAULT 5,
    "percobaan_berikutnya_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diproses_pada" DATETIME,
    "pesan_error" TEXT,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" DATETIME NOT NULL
);

CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "peran_dasar" TEXT NOT NULL,
    "status_akun" TEXT NOT NULL DEFAULT 'AKTIF',
    "harus_ganti_password" BOOLEAN NOT NULL DEFAULT false,
    "terakhir_login_pada" DATETIME,
    "percobaan_login_gagal" INTEGER NOT NULL DEFAULT 0,
    "dikunci_sampai" DATETIME,
    "foto_url" TEXT,
    "avatar_id" TEXT,
    "no_telepon" TEXT,
    "tipe_lisensi" TEXT NOT NULL DEFAULT 'FREEMIUM',
    "trial_berakhir_pada" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengguna_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "identitas_provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengguna_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "identitas_provider_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "kemampuan_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengguna_id" TEXT NOT NULL,
    "kode_kemampuan" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kemampuan_staff_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "sesi_pengguna" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_aktif_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "berlaku_sampai" DATETIME NOT NULL,
    "terakhir_aktif_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dicabut" BOOLEAN NOT NULL DEFAULT false,
    "alasan_cabut" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sesi_pengguna_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sesi_pengguna_sekolah_aktif_id_fkey" FOREIGN KEY ("sekolah_aktif_id") REFERENCES "sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "keanggotaan_sekolah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "peran_dasar_di_tenant" TEXT NOT NULL,
    "status_keanggotaan" TEXT NOT NULL DEFAULT 'PENDING',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "berlaku_mulai" DATETIME,
    "berlaku_sampai" DATETIME,
    "sumber_pendaftaran" TEXT NOT NULL DEFAULT 'MIGRASI_LEGACY',
    "disetujui_oleh_id" TEXT,
    "disetujui_pada" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "keanggotaan_sekolah_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keanggotaan_sekolah_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "langganan_tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "paket" TEXT NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'TRIAL_ACTIVE',
    "mulai_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berakhir_pada" DATETIME,
    "entitlement_json" TEXT,
    "sumber_aktivasi" TEXT NOT NULL DEFAULT 'MIGRASI_LEGACY',
    "transaksi_sumber_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "langganan_tenant_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "log_percobaan_login" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "sukses" BOOLEAN NOT NULL,
    "alasan_gagal" TEXT,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "tahun_ajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "tanggal_mulai" DATETIME NOT NULL,
    "tanggal_selesai" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tahun_ajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "semester" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "tanggal_mulai" DATETIME NOT NULL,
    "tanggal_selesai" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "semester_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "semester_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "fase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fase_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "tingkat_kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "fase_id" TEXT,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tingkat_kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tingkat_kelas_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "program_keahlian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenjang" TEXT,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "deskripsi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "program_keahlian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "rombel" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "rombel_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rombel_dibuat_oleh_pengguna_id_fkey" FOREIGN KEY ("dibuat_oleh_pengguna_id") REFERENCES "pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rombel_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rombel_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rombel_tingkat_id_fkey" FOREIGN KEY ("tingkat_id") REFERENCES "tingkat_kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rombel_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rombel_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program_keahlian" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "preferensi_onboarding_guru" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengguna_id" TEXT NOT NULL,
    "sekolah_id" TEXT NOT NULL,
    "onboarding_eligible" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT true,
    "wizard_step" INTEGER NOT NULL DEFAULT 0,
    "mata_pelajaran_ids_json" TEXT NOT NULL DEFAULT '[]',
    "guru_mapel_aktif" BOOLEAN NOT NULL DEFAULT false,
    "wali_kelas_aktif" BOOLEAN NOT NULL DEFAULT false,
    "peran_dikonfirmasi_pada" DATETIME,
    "mapel_dikonfirmasi_pada" DATETIME,
    "siswa_ditunda_pada" DATETIME,
    "jadwal_ditunda_pada" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "preferensi_onboarding_guru_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "preferensi_onboarding_guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nis" TEXT,
    "nisn" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATETIME,
    "agama" TEXT,
    "nik" TEXT,
    "alamat" TEXT,
    "nama_wali" TEXT,
    "telepon_wali" TEXT,
    "email_wali" TEXT,
    "status_akademik" TEXT NOT NULL DEFAULT 'AKTIF',
    "foto_url" TEXT,
    "tanggal_masuk" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_keluar" DATETIME,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "siswa_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "keikutsertaan_siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "tingkat_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "tanggal_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_selesai" DATETIME,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "keikutsertaan_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keikutsertaan_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keikutsertaan_siswa_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keikutsertaan_siswa_tingkat_id_fkey" FOREIGN KEY ("tingkat_id") REFERENCES "tingkat_kelas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "penempatan_rombel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "keikutsertaan_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "tanggal_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_selesai" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "nomor_absen" INTEGER,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "penempatan_rombel_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penempatan_rombel_keikutsertaan_id_fkey" FOREIGN KEY ("keikutsertaan_id") REFERENCES "keikutsertaan_siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penempatan_rombel_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "guru" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nip" TEXT,
    "nuptk" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "gelar_depan" TEXT,
    "gelar_belakang" TEXT,
    "jenis_kelamin" TEXT NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATETIME,
    "email" TEXT,
    "telepon" TEXT,
    "alamat" TEXT,
    "status_kepegawaian" TEXT NOT NULL DEFAULT 'TETAP',
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "status_lifecycle" TEXT NOT NULL DEFAULT 'AKTIF',
    "foto_url" TEXT,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "guru_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "guru_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "mata_pelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelompok" TEXT,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "status_lifecycle" TEXT NOT NULL DEFAULT 'AKTIF',
    "deskripsi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mata_pelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "penugasan_mengajar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "rombel_id" TEXT NOT NULL,
    "jumlah_jam_minggu" INTEGER NOT NULL DEFAULT 2,
    "berlaku_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berlaku_sampai" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "penugasan_mengajar_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_mengajar_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_mengajar_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_mengajar_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_mengajar_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "penugasan_mengajar_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "penugasan_wali_kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "berlaku_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berlaku_sampai" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "penugasan_wali_kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_wali_kelas_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_wali_kelas_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_wali_kelas_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "kalender_akademik" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tipe_event" TEXT NOT NULL,
    "tanggal_mulai" DATETIME NOT NULL,
    "tanggal_selesai" DATETIME NOT NULL,
    "libur_kbm" BOOLEAN NOT NULL DEFAULT false,
    "warna" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kalender_akademik_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kalender_akademik_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kalender_akademik_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "slot_waktu" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "slot_waktu_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "versi_jadwal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "nomor_versi" INTEGER NOT NULL DEFAULT 1,
    "nama" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tanggal_publikasi" DATETIME,
    "dipublikasikan_oleh" TEXT,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "versi_jadwal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "versi_jadwal_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "versi_jadwal_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "jadwal_pelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "jadwal_pelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_versi_jadwal_id_fkey" FOREIGN KEY ("versi_jadwal_id") REFERENCES "versi_jadwal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jadwal_pelajaran_slot_waktu_id_fkey" FOREIGN KEY ("slot_waktu_id") REFERENCES "slot_waktu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sesi_kelas_aktual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "jadwal_pelajaran_id" TEXT,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "guru_pengganti_id" TEXT,
    "tahun_ajaran_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "tanggal" DATETIME NOT NULL,
    "jam_mulai_aktual" DATETIME,
    "jam_selesai_aktual" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'TERJADWAL',
    "ruangan_aktual" TEXT,
    "topik_pembelajaran" TEXT,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sesi_kelas_aktual_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_jadwal_pelajaran_id_fkey" FOREIGN KEY ("jadwal_pelajaran_id") REFERENCES "jadwal_pelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_guru_pengganti_id_fkey" FOREIGN KEY ("guru_pengganti_id") REFERENCES "guru" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_kelas_aktual_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "lingkup_materi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "kode" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lingkup_materi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lingkup_materi_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "tujuan_pembelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "lingkup_materi_id" TEXT NOT NULL,
    "capaian_pembelajaran_id" TEXT,
    "kode" TEXT,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tujuan_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tujuan_pembelajaran_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tujuan_pembelajaran_capaian_pembelajaran_id_fkey" FOREIGN KEY ("capaian_pembelajaran_id") REFERENCES "capaian_pembelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "materi_pembelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "materi_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "materi_pembelajaran_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "materi_pembelajaran_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "materi_pembelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "materi_pembelajaran_berkas_id_fkey" FOREIGN KEY ("berkas_id") REFERENCES "metadata_berkas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "publikasi_materi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "materi_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "tanggal_publikasi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DITERBITKAN',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "publikasi_materi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "publikasi_materi_materi_id_fkey" FOREIGN KEY ("materi_id") REFERENCES "materi_pembelajaran" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "publikasi_materi_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "definisi_tugas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "lingkup_materi_id" TEXT,
    "mata_pelajaran_id" TEXT,
    "judul" TEXT NOT NULL,
    "petunjuk" TEXT NOT NULL,
    "tipe_penyerahan" TEXT NOT NULL DEFAULT 'FILE',
    "berkas_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "definisi_tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "definisi_tugas_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "definisi_tugas_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "definisi_tugas_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "definisi_tugas_berkas_id_fkey" FOREIGN KEY ("berkas_id") REFERENCES "metadata_berkas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "publikasi_tugas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tugas_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "tanggal_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batas_waktu" DATETIME,
    "izinkan_terlambat" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DITERBITKAN',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "publikasi_tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "publikasi_tugas_tugas_id_fkey" FOREIGN KEY ("tugas_id") REFERENCES "definisi_tugas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "publikasi_tugas_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "pengumpulan_tugas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "publikasi_tugas_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "tanggal_kumpul" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DIKUMPULKAN',
    "teks_jawaban" TEXT,
    "berkas_id" TEXT,
    "catatan_siswa" TEXT,
    "catatan_guru" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengumpulan_tugas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pengumpulan_tugas_publikasi_tugas_id_fkey" FOREIGN KEY ("publikasi_tugas_id") REFERENCES "publikasi_tugas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengumpulan_tugas_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pengumpulan_tugas_berkas_id_fkey" FOREIGN KEY ("berkas_id") REFERENCES "metadata_berkas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "administrasi_pembelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "sesi_kelas_aktual_id" TEXT,
    "guru_id" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "pertemuan_ke" INTEGER NOT NULL DEFAULT 1,
    "materi_disampaikan" TEXT NOT NULL,
    "kegiatan_pembelajaran" TEXT,
    "catatan_refleksi" TEXT,
    "status_realisasi" TEXT NOT NULL DEFAULT 'TERLAKSANA',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "administrasi_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "administrasi_pembelajaran_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "administrasi_pembelajaran_sesi_kelas_aktual_id_fkey" FOREIGN KEY ("sesi_kelas_aktual_id") REFERENCES "sesi_kelas_aktual" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "administrasi_pembelajaran_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "administrasi_tujuan_pembelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "administrasi_id" TEXT NOT NULL,
    "tp_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "administrasi_tujuan_pembelajaran_administrasi_id_fkey" FOREIGN KEY ("administrasi_id") REFERENCES "administrasi_pembelajaran" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "administrasi_tujuan_pembelajaran_tp_id_fkey" FOREIGN KEY ("tp_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "presensi_sesi_kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "sesi_kelas_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HADIR',
    "catatan" TEXT,
    "waktu_presensi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diinput_oleh" TEXT,
    "diubah_terakhir_oleh" TEXT,
    "alasan_koreksi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "presensi_sesi_kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "presensi_sesi_kelas_sesi_kelas_id_fkey" FOREIGN KEY ("sesi_kelas_id") REFERENCES "sesi_kelas_aktual" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "presensi_sesi_kelas_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "presensi_sesi_kelas_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "definisi_asesmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "tp_id" TEXT,
    "lingkup_materi_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'FORMATIF',
    "teknik_penilaian" TEXT NOT NULL DEFAULT 'TES_TERTULIS',
    "bobot" REAL NOT NULL DEFAULT 1.0,
    "skala_maksimal" REAL NOT NULL DEFAULT 100.0,
    "kkm_kktp" REAL NOT NULL DEFAULT 75.0,
    "tanggal_pelaksanaan" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "definisi_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "definisi_asesmen_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "definisi_asesmen_tp_id_fkey" FOREIGN KEY ("tp_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "definisi_asesmen_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "nilai_siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "asesmen_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "nilai_angka" REAL,
    "nilai_huruf" TEXT,
    "capaian_kompetensi" TEXT,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "diinput_oleh" TEXT,
    "diubah_terakhir_oleh" TEXT,
    "alasan_koreksi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "nilai_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "nilai_siswa_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "definisi_asesmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nilai_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "nilai_siswa_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "publikasi_nilai_asesmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "asesmen_id" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL DEFAULT 'SEMUA',
    "tanggal_publikasi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dipublikasikan_oleh" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "publikasi_nilai_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "publikasi_nilai_asesmen_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "definisi_asesmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "bank_soal" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bank_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bank_soal_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bank_soal_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bank_soal_lingkup_materi_id_fkey" FOREIGN KEY ("lingkup_materi_id") REFERENCES "lingkup_materi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bank_soal_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bank_soal_capaian_pembelajaran_id_fkey" FOREIGN KEY ("capaian_pembelajaran_id") REFERENCES "capaian_pembelajaran" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bank_soal_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder_bank_soal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "versi_soal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "bank_soal_id" TEXT NOT NULL,
    "nomor_versi" INTEGER NOT NULL DEFAULT 1,
    "pertanyaan" TEXT NOT NULL,
    "gambar_url" TEXT,
    "opsi_jawaban" TEXT,
    "kunci_jawaban" TEXT,
    "pembahasan" TEXT,
    "bobot_default" REAL NOT NULL DEFAULT 1.0,
    "dibuat_oleh" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "versi_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "versi_soal_bank_soal_id_fkey" FOREIGN KEY ("bank_soal_id") REFERENCES "bank_soal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ujian_cbt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "penugasan_mengajar_id" TEXT NOT NULL,
    "asesmen_id" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "durasi_menit" INTEGER NOT NULL DEFAULT 60,
    "waktu_mulai" DATETIME,
    "waktu_selesai" DATETIME,
    "kkm_kktp" REAL NOT NULL DEFAULT 75.0,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ujian_cbt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ujian_cbt_penugasan_mengajar_id_fkey" FOREIGN KEY ("penugasan_mengajar_id") REFERENCES "penugasan_mengajar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ujian_cbt_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "definisi_asesmen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "snapshot_ujian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "nomor_snapshot" INTEGER NOT NULL DEFAULT 1,
    "total_soal" INTEGER NOT NULL,
    "total_bobot" REAL NOT NULL,
    "durasi_menit" INTEGER NOT NULL,
    "konfigurasi" TEXT NOT NULL,
    "manifest_soal" TEXT NOT NULL,
    "kunci_penilaian" TEXT NOT NULL,
    "metadata_ujian" TEXT,
    "hash_integritas" TEXT,
    "dibekukan_oleh" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "snapshot_ujian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "snapshot_ujian_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "exam_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "kode_sesi" TEXT NOT NULL,
    "nama_sesi" TEXT NOT NULL,
    "waktu_mulai" DATETIME NOT NULL,
    "waktu_selesai" DATETIME NOT NULL,
    "token" TEXT,
    "token_aktif" BOOLEAN NOT NULL DEFAULT true,
    "token_expired_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'TERJADWAL',
    "ruang_ujian" TEXT,
    "pengawas_nama" TEXT,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "exam_session_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exam_session_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "assessment_attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "exam_session_id" TEXT,
    "snapshot_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "attempt_ke" INTEGER NOT NULL DEFAULT 1,
    "waktu_mulai" DATETIME,
    "batas_waktu_server" DATETIME,
    "waktu_selesai" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "urutan_soal_peserta" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "token_sesi_aktif" TEXT,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "assessment_attempt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessment_attempt_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_attempt_exam_session_id_fkey" FOREIGN KEY ("exam_session_id") REFERENCES "exam_session" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "assessment_attempt_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_ujian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessment_attempt_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessment_attempt_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "sesi_ujian_siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT,
    "attempt_ke" INTEGER NOT NULL DEFAULT 1,
    "waktu_mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batas_waktu_server" DATETIME NOT NULL,
    "waktu_selesai" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SEDANG_MENGERJAKAN',
    "urutan_soal_peserta" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "token_sesi_aktif" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sesi_ujian_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_ujian_siswa_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sesi_ujian_siswa_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_ujian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_ujian_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_ujian_siswa_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "jawaban_siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "sesi_ujian_id" TEXT NOT NULL,
    "soal_id" TEXT NOT NULL,
    "versi_soal_id" TEXT NOT NULL,
    "jawaban_peserta" TEXT,
    "ragu_ragu" BOOLEAN NOT NULL DEFAULT false,
    "apakah_benar" BOOLEAN,
    "skor_diperoleh" REAL NOT NULL DEFAULT 0.0,
    "catatan_koreksi" TEXT,
    "waktu_simpan" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "jawaban_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jawaban_siswa_sesi_ujian_id_fkey" FOREIGN KEY ("sesi_ujian_id") REFERENCES "sesi_ujian_siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "hasil_ujian_cbt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "sesi_ujian_id" TEXT NOT NULL,
    "ujian_cbt_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "total_soal" INTEGER NOT NULL,
    "total_dijawab" INTEGER NOT NULL,
    "jumlah_benar" INTEGER NOT NULL DEFAULT 0,
    "jumlah_salah" INTEGER NOT NULL DEFAULT 0,
    "jumlah_kosong" INTEGER NOT NULL DEFAULT 0,
    "skor_mentah" REAL NOT NULL DEFAULT 0.0,
    "skor_maksimal" REAL NOT NULL DEFAULT 100.0,
    "nilai_akhir" REAL NOT NULL DEFAULT 0.0,
    "apakah_tuntas" BOOLEAN NOT NULL DEFAULT false,
    "status_penilaian" TEXT NOT NULL DEFAULT 'LENGKAP',
    "status_transfer" TEXT NOT NULL DEFAULT 'BELUM_DITRANSFER',
    "ditransfer_ke_nilai_siswa_id" TEXT,
    "waktu_transfer" DATETIME,
    "ditransfer_oleh" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hasil_ujian_cbt_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hasil_ujian_cbt_sesi_ujian_id_fkey" FOREIGN KEY ("sesi_ujian_id") REFERENCES "sesi_ujian_siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hasil_ujian_cbt_ujian_cbt_id_fkey" FOREIGN KEY ("ujian_cbt_id") REFERENCES "ujian_cbt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hasil_ujian_cbt_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "event_integritas_ujian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "sesi_ujian_id" TEXT NOT NULL,
    "jenis_event" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "payload" TEXT,
    "waktu_kejadian" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_integritas_ujian_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "event_integritas_ujian_sesi_ujian_id_fkey" FOREIGN KEY ("sesi_ujian_id") REFERENCES "sesi_ujian_siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "wali_murid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "jenis_kelamin" TEXT,
    "no_telepon" TEXT,
    "email" TEXT,
    "pekerjaan" TEXT,
    "penghasilan" TEXT,
    "alamat" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wali_murid_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wali_murid_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "hubungan_wali_siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "wali_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "jenis_hubungan" TEXT NOT NULL,
    "status_verifikasi" TEXT NOT NULL DEFAULT 'TERVERIFIKASI',
    "apakah_wali_utama" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hubungan_wali_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hubungan_wali_siswa_wali_id_fkey" FOREIGN KEY ("wali_id") REFERENCES "wali_murid" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hubungan_wali_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "pengajuan_wali" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "wali_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tanggal_mulai" DATETIME,
    "tanggal_selesai" DATETIME,
    "lampiran_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "catatan_tanggapan" TEXT,
    "ditanggapi_oleh_id" TEXT,
    "ditanggapi_pada" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengajuan_wali_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pengajuan_wali_wali_id_fkey" FOREIGN KEY ("wali_id") REFERENCES "wali_murid" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengajuan_wali_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "pengumuman" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "dipublikasikan_pada" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengumuman_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pengumuman_penulis_id_fkey" FOREIGN KEY ("penulis_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengumuman_target_rombel_id_fkey" FOREIGN KEY ("target_rombel_id") REFERENCES "rombel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "sasaran_pengumuman" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengumuman_id" TEXT NOT NULL,
    "tipe_sasaran" TEXT NOT NULL,
    "nilai_sasaran" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sasaran_pengumuman_pengumuman_id_fkey" FOREIGN KEY ("pengumuman_id") REFERENCES "pengumuman" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "notifikasi_pengguna" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "tautan_url" TEXT,
    "apakah_dibaca" BOOLEAN NOT NULL DEFAULT false,
    "dibaca_pada" DATETIME,
    "data_tambahan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notifikasi_pengguna_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifikasi_pengguna_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "preferensi_notifikasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pengguna_id" TEXT NOT NULL,
    "in_app_aktif" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_aktif" BOOLEAN NOT NULL DEFAULT true,
    "email_aktif" BOOLEAN NOT NULL DEFAULT false,
    "notif_pengumuman" BOOLEAN NOT NULL DEFAULT true,
    "notif_tugas" BOOLEAN NOT NULL DEFAULT true,
    "notif_nilai" BOOLEAN NOT NULL DEFAULT true,
    "notif_presensi" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "preferensi_notifikasi_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "catatan_monitoring" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "rombel_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penulis_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "tingkat_urgensi" TEXT NOT NULL DEFAULT 'SEDANG',
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "catatan_monitoring_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "catatan_monitoring_rombel_id_fkey" FOREIGN KEY ("rombel_id") REFERENCES "rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "catatan_monitoring_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "catatan_monitoring_penulis_id_fkey" FOREIGN KEY ("penulis_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "tindak_lanjut_monitoring" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catatan_id" TEXT NOT NULL,
    "penanggung_jawab_id" TEXT,
    "tindakan" TEXT NOT NULL,
    "target_tanggal" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DIRENCANAKAN',
    "hasil" TEXT,
    "tanggal_penyelesaian" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tindak_lanjut_monitoring_catatan_id_fkey" FOREIGN KEY ("catatan_id") REFERENCES "catatan_monitoring" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tindak_lanjut_monitoring_penanggung_jawab_id_fkey" FOREIGN KEY ("penanggung_jawab_id") REFERENCES "pengguna" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "riwayat_ekspor_laporan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tipe_laporan" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "parameter_filter_json" TEXT,
    "total_baris" INTEGER NOT NULL DEFAULT 0,
    "dibuat_oleh_id" TEXT NOT NULL,
    "berkas_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "riwayat_ekspor_laporan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "riwayat_ekspor_laporan_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "pengguna" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "konfigurasi_integrasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tipe_layanan" TEXT NOT NULL,
    "nama_konfigurasi" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "kredensial_json" TEXT,
    "parameter_json" TEXT,
    "terakhir_diuji_pada" DATETIME,
    "status_uji_terakhir" TEXT,
    "catatan_uji" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "konfigurasi_integrasi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "endpoint_webhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "url_target" TEXT NOT NULL,
    "secret_token" TEXT NOT NULL,
    "event_langganan_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "retry_count_max" INTEGER NOT NULL DEFAULT 3,
    "timeout_detik" INTEGER NOT NULL DEFAULT 10,
    "terakhir_dipicu_pada" DATETIME,
    "total_terkirim" INTEGER NOT NULL DEFAULT 0,
    "total_gagal" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "endpoint_webhook_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "log_pengiriman_integrasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "log_pengiriman_integrasi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "permintaan_setup_kelas_ai" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "nama_kelas" TEXT NOT NULL,
    "mata_pelajaran" TEXT,
    "foto_url" TEXT NOT NULL,
    "hasil_ekstraksi_json" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rombel_id_hasil" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "permintaan_setup_kelas_ai_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "permintaan_setup_kelas_ai_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "transaksi_langganan" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "waktu_transaksi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dibayar_pada" DATETIME,
    "kadaluarsa_pada" DATETIME,
    "durasi_bulan" INTEGER NOT NULL DEFAULT 1,
    "payload_notifikasi_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transaksi_langganan_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transaksi_langganan_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "rapor_siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "siswa_id" TEXT NOT NULL,
    "penempatan_rombel_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "tahun_ajaran_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatan_wali_kelas" TEXT,
    "saran_tindak_lanjut" TEXT,
    "ekstrakurikuler_json" TEXT,
    "tanggal_validasi" DATETIME,
    "divalidasi_oleh" TEXT,
    "tanggal_publikasi" DATETIME,
    "dipublikasikan_oleh" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "rapor_siswa_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rapor_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rapor_siswa_penempatan_rombel_id_fkey" FOREIGN KEY ("penempatan_rombel_id") REFERENCES "penempatan_rombel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "folder_bank_soal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "warna" TEXT DEFAULT '#3B82F6',
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "folder_bank_soal_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folder_bank_soal_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "guru" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folder_bank_soal_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folder_bank_soal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "capaian_pembelajaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "mata_pelajaran_id" TEXT NOT NULL,
    "fase_id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "elemen" TEXT,
    "deskripsi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "capaian_pembelajaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "capaian_pembelajaran_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "mata_pelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "capaian_pembelajaran_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "kriteria_ketercapaian_tp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "tujuan_pembelajaran_id" TEXT NOT NULL,
    "tipe_kktp" TEXT NOT NULL DEFAULT 'SKALA_INTERVAL',
    "ambang_tuntas" REAL NOT NULL DEFAULT 75.0,
    "interval_json" TEXT,
    "rubrik_json" TEXT,
    "deskripsi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kriteria_ketercapaian_tp_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kriteria_ketercapaian_tp_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "kisi_kisi_asesmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "tanggal_dibekukan" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kisi_kisi_asesmen_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kisi_kisi_asesmen_definisi_asesmen_id_fkey" FOREIGN KEY ("definisi_asesmen_id") REFERENCES "definisi_asesmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "item_kisi_kisi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolah_id" TEXT NOT NULL,
    "kisi_kisi_id" TEXT NOT NULL,
    "tujuan_pembelajaran_id" TEXT NOT NULL,
    "nomor_urut" INTEGER NOT NULL,
    "indikator_soal" TEXT NOT NULL,
    "level_kognitif" TEXT NOT NULL DEFAULT 'L2',
    "bentuk_soal" TEXT NOT NULL DEFAULT 'PILIHAN_GANDA',
    "bobot_skor" REAL NOT NULL DEFAULT 1.0,
    "bank_soal_id" TEXT,
    "versi_soal_id" TEXT,
    "snapshot_pertanyaan" TEXT,
    "snapshot_opsi" TEXT,
    "snapshot_kunci" TEXT,
    "snapshot_pembahasan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "item_kisi_kisi_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_kisi_kisi_id_fkey" FOREIGN KEY ("kisi_kisi_id") REFERENCES "kisi_kisi_asesmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_tujuan_pembelajaran_id_fkey" FOREIGN KEY ("tujuan_pembelajaran_id") REFERENCES "tujuan_pembelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_bank_soal_id_fkey" FOREIGN KEY ("bank_soal_id") REFERENCES "bank_soal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "item_kisi_kisi_versi_soal_id_fkey" FOREIGN KEY ("versi_soal_id") REFERENCES "versi_soal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);