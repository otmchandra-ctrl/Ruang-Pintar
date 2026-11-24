PRAGMA foreign_keys = OFF;

-- 1. Sekolah
INSERT OR REPLACE INTO "sekolah" (
  "id", "nama", "jenjang", "alamat", "email", "zona_waktu", "tipe_lisensi", "status_aktif", "created_at", "updated_at"
) VALUES (
  '01M2XXYD227F9S3H985FH53GMF',
  'SMK OTOMINDO',
  'SMK',
  'Indonesia',
  'eri.chandra27@gmail.com',
  'Asia/Jakarta',
  'SEKOLAH',
  1,
  '2026-09-19T22:52:42.592Z',
  '2026-10-17T01:58:25.572Z'
);

-- 2. Pengguna (guru_chandra dengan real password_hash)
INSERT OR REPLACE INTO "pengguna" (
  "id", "sekolah_id", "username", "email", "password_hash", "nama_lengkap", "peran_dasar", "status_akun", "harus_ganti_password", "percobaan_login_gagal", "created_at", "updated_at"
) VALUES (
  '01M2XXYD26H385F6RAW5PB6FBK',
  '01M2XXYD227F9S3H985FH53GMF',
  'guru_chandra',
  'eri.chandra27@gmail.com',
  '$2b$10$eUeZGgwUFebCKEGufsyfceQZQLFU16SRnJfnCLpXw1Mw/5ImZ8fbe',
  'Eri Chandra A, S.Kom',
  'TEACHER',
  'AKTIF',
  0,
  0,
  '2026-09-19T22:52:42.615Z',
  '2026-10-04T09:04:25.937Z'
);

-- 3. Keanggotaan Sekolah (Tenant Resolution & Access Control)
INSERT OR REPLACE INTO "keanggotaan_sekolah" (
  "id", "pengguna_id", "sekolah_id", "peran_dasar_di_tenant", "status_keanggotaan", "is_owner", "sumber_pendaftaran", "berlaku_mulai", "disetujui_pada", "created_at", "updated_at"
) VALUES (
  '01M2XXYD26H385F6RAW5PB6FBK',
  '01M2XXYD26H385F6RAW5PB6FBK',
  '01M2XXYD227F9S3H985FH53GMF',
  'TEACHER',
  'ACTIVE',
  0,
  'MIGRASI_LEGACY',
  '2026-09-19T22:52:42.612Z',
  '2026-09-19T22:52:42.612Z',
  '2026-09-21T10:37:55.000Z',
  '2026-10-02T08:35:37.030Z'
);

-- 4. Profil Guru
INSERT OR REPLACE INTO "guru" (
  "id", "sekolah_id", "pengguna_id", "nama_lengkap", "gelar_belakang", "jenis_kelamin", "email", "status_kepegawaian", "status_aktif", "status_lifecycle", "created_at", "updated_at"
) VALUES (
  '01M2XXYD299G35BZDH2NKFCM3P',
  '01M2XXYD227F9S3H985FH53GMF',
  '01M2XXYD26H385F6RAW5PB6FBK',
  'Eri Chandra A',
  'S.Kom',
  'L',
  'eri.chandra27@gmail.com',
  'TETAP',
  1,
  'AKTIF',
  '2026-09-19T22:52:42.615Z',
  '2026-10-04T09:04:25.937Z'
);

PRAGMA foreign_keys = ON;
