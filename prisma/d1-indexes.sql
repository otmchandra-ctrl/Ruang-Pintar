CREATE UNIQUE INDEX "sekolah_npsn_key" ON "sekolah"("npsn");

CREATE UNIQUE INDEX "unit_organisasi_sekolah_id_nama_key" ON "unit_organisasi"("sekolah_id", "nama");

CREATE UNIQUE INDEX "jabatan_sekolah_id_kode_jabatan_key" ON "jabatan"("sekolah_id", "kode_jabatan");

CREATE INDEX "penugasan_jabatan_personil_id_status_idx" ON "penugasan_jabatan"("personil_id", "status");

CREATE UNIQUE INDEX "konfigurasi_sistem_sekolah_id_kunci_key" ON "konfigurasi_sistem"("sekolah_id", "kunci");

CREATE UNIQUE INDEX "metadata_berkas_storage_key_key" ON "metadata_berkas"("storage_key");

CREATE INDEX "metadata_berkas_storage_provider_status_idx" ON "metadata_berkas"("storage_provider", "status");

CREATE INDEX "log_audit_sekolah_id_dibuat_pada_idx" ON "log_audit"("sekolah_id", "dibuat_pada");

CREATE INDEX "log_audit_aktor_id_dibuat_pada_idx" ON "log_audit"("aktor_id", "dibuat_pada");

CREATE INDEX "log_audit_tipe_sumber_id_sumber_idx" ON "log_audit"("tipe_sumber", "id_sumber");

CREATE INDEX "outbox_pesan_status_percobaan_berikutnya_pada_idx" ON "outbox_pesan"("status", "percobaan_berikutnya_pada");

CREATE UNIQUE INDEX "pengguna_username_key" ON "pengguna"("username");

CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

CREATE INDEX "pengguna_sekolah_id_peran_dasar_idx" ON "pengguna"("sekolah_id", "peran_dasar");

CREATE INDEX "pengguna_status_akun_idx" ON "pengguna"("status_akun");

CREATE INDEX "identitas_provider_pengguna_id_provider_idx" ON "identitas_provider"("pengguna_id", "provider");

CREATE UNIQUE INDEX "identitas_provider_provider_subject_key" ON "identitas_provider"("provider", "subject");

CREATE INDEX "kemampuan_staff_kode_kemampuan_idx" ON "kemampuan_staff"("kode_kemampuan");

CREATE UNIQUE INDEX "kemampuan_staff_pengguna_id_kode_kemampuan_key" ON "kemampuan_staff"("pengguna_id", "kode_kemampuan");

CREATE UNIQUE INDEX "sesi_pengguna_token_hash_key" ON "sesi_pengguna"("token_hash");

CREATE INDEX "sesi_pengguna_pengguna_id_dicabut_berlaku_sampai_idx" ON "sesi_pengguna"("pengguna_id", "dicabut", "berlaku_sampai");

CREATE INDEX "sesi_pengguna_sekolah_aktif_id_dicabut_berlaku_sampai_idx" ON "sesi_pengguna"("sekolah_aktif_id", "dicabut", "berlaku_sampai");

CREATE INDEX "keanggotaan_sekolah_sekolah_id_status_keanggotaan_idx" ON "keanggotaan_sekolah"("sekolah_id", "status_keanggotaan");

CREATE INDEX "keanggotaan_sekolah_pengguna_id_status_keanggotaan_idx" ON "keanggotaan_sekolah"("pengguna_id", "status_keanggotaan");

CREATE INDEX "keanggotaan_sekolah_sekolah_id_is_owner_status_keanggotaan_idx" ON "keanggotaan_sekolah"("sekolah_id", "is_owner", "status_keanggotaan");

CREATE UNIQUE INDEX "keanggotaan_sekolah_pengguna_id_sekolah_id_key" ON "keanggotaan_sekolah"("pengguna_id", "sekolah_id");

CREATE INDEX "langganan_tenant_sekolah_id_status_berakhir_pada_idx" ON "langganan_tenant"("sekolah_id", "status", "berakhir_pada");

CREATE INDEX "langganan_tenant_transaksi_sumber_id_idx" ON "langganan_tenant"("transaksi_sumber_id");

CREATE INDEX "log_percobaan_login_identifier_dibuat_pada_idx" ON "log_percobaan_login"("identifier", "dibuat_pada");

CREATE INDEX "log_percobaan_login_ip_address_dibuat_pada_idx" ON "log_percobaan_login"("ip_address", "dibuat_pada");

CREATE INDEX "tahun_ajaran_sekolah_id_status_idx" ON "tahun_ajaran"("sekolah_id", "status");

CREATE UNIQUE INDEX "tahun_ajaran_sekolah_id_nama_key" ON "tahun_ajaran"("sekolah_id", "nama");

CREATE INDEX "semester_sekolah_id_status_idx" ON "semester"("sekolah_id", "status");

CREATE UNIQUE INDEX "semester_tahun_ajaran_id_kode_key" ON "semester"("tahun_ajaran_id", "kode");

CREATE UNIQUE INDEX "fase_sekolah_id_kode_key" ON "fase"("sekolah_id", "kode");

CREATE UNIQUE INDEX "tingkat_kelas_sekolah_id_kode_key" ON "tingkat_kelas"("sekolah_id", "kode");

CREATE UNIQUE INDEX "program_keahlian_sekolah_id_kode_key" ON "program_keahlian"("sekolah_id", "kode");

CREATE INDEX "rombel_sekolah_id_tahun_ajaran_id_status_idx" ON "rombel"("sekolah_id", "tahun_ajaran_id", "status");

CREATE INDEX "rombel_sekolah_id_dibuat_oleh_pengguna_id_idx" ON "rombel"("sekolah_id", "dibuat_oleh_pengguna_id");

CREATE UNIQUE INDEX "rombel_sekolah_id_tahun_ajaran_id_nama_key" ON "rombel"("sekolah_id", "tahun_ajaran_id", "nama");

CREATE INDEX "preferensi_onboarding_guru_sekolah_id_updated_at_idx" ON "preferensi_onboarding_guru"("sekolah_id", "updated_at");

CREATE UNIQUE INDEX "preferensi_onboarding_guru_pengguna_id_sekolah_id_key" ON "preferensi_onboarding_guru"("pengguna_id", "sekolah_id");

CREATE UNIQUE INDEX "siswa_pengguna_id_key" ON "siswa"("pengguna_id");

CREATE INDEX "siswa_sekolah_id_status_akademik_idx" ON "siswa"("sekolah_id", "status_akademik");

CREATE INDEX "siswa_sekolah_id_nisn_idx" ON "siswa"("sekolah_id", "nisn");

CREATE UNIQUE INDEX "siswa_sekolah_id_nis_key" ON "siswa"("sekolah_id", "nis");

CREATE INDEX "keikutsertaan_siswa_sekolah_id_tahun_ajaran_id_status_idx" ON "keikutsertaan_siswa"("sekolah_id", "tahun_ajaran_id", "status");

CREATE UNIQUE INDEX "keikutsertaan_siswa_siswa_id_tahun_ajaran_id_key" ON "keikutsertaan_siswa"("siswa_id", "tahun_ajaran_id");

CREATE INDEX "penempatan_rombel_rombel_id_status_idx" ON "penempatan_rombel"("rombel_id", "status");

CREATE INDEX "penempatan_rombel_keikutsertaan_id_status_idx" ON "penempatan_rombel"("keikutsertaan_id", "status");

CREATE INDEX "penempatan_rombel_sekolah_id_status_idx" ON "penempatan_rombel"("sekolah_id", "status");

CREATE UNIQUE INDEX "guru_pengguna_id_key" ON "guru"("pengguna_id");

CREATE INDEX "guru_sekolah_id_status_aktif_idx" ON "guru"("sekolah_id", "status_aktif");

CREATE INDEX "guru_sekolah_id_status_lifecycle_idx" ON "guru"("sekolah_id", "status_lifecycle");

CREATE INDEX "guru_sekolah_id_nip_idx" ON "guru"("sekolah_id", "nip");

CREATE INDEX "guru_sekolah_id_nuptk_idx" ON "guru"("sekolah_id", "nuptk");

CREATE INDEX "mata_pelajaran_sekolah_id_status_aktif_idx" ON "mata_pelajaran"("sekolah_id", "status_aktif");

CREATE INDEX "mata_pelajaran_sekolah_id_status_lifecycle_idx" ON "mata_pelajaran"("sekolah_id", "status_lifecycle");

CREATE UNIQUE INDEX "mata_pelajaran_sekolah_id_kode_key" ON "mata_pelajaran"("sekolah_id", "kode");

CREATE INDEX "penugasan_mengajar_guru_id_status_idx" ON "penugasan_mengajar"("guru_id", "status");

CREATE INDEX "penugasan_mengajar_rombel_id_status_idx" ON "penugasan_mengajar"("rombel_id", "status");

CREATE INDEX "penugasan_mengajar_sekolah_id_tahun_ajaran_id_status_idx" ON "penugasan_mengajar"("sekolah_id", "tahun_ajaran_id", "status");

CREATE INDEX "penugasan_wali_kelas_guru_id_status_idx" ON "penugasan_wali_kelas"("guru_id", "status");

CREATE INDEX "penugasan_wali_kelas_rombel_id_status_idx" ON "penugasan_wali_kelas"("rombel_id", "status");

CREATE INDEX "penugasan_wali_kelas_sekolah_id_tahun_ajaran_id_status_idx" ON "penugasan_wali_kelas"("sekolah_id", "tahun_ajaran_id", "status");

CREATE INDEX "kalender_akademik_sekolah_id_tahun_ajaran_id_tanggal_mulai_idx" ON "kalender_akademik"("sekolah_id", "tahun_ajaran_id", "tanggal_mulai");

CREATE INDEX "kalender_akademik_sekolah_id_tipe_event_idx" ON "kalender_akademik"("sekolah_id", "tipe_event");

CREATE INDEX "slot_waktu_sekolah_id_urutan_idx" ON "slot_waktu"("sekolah_id", "urutan");

CREATE UNIQUE INDEX "slot_waktu_sekolah_id_kode_key" ON "slot_waktu"("sekolah_id", "kode");

CREATE INDEX "versi_jadwal_sekolah_id_tahun_ajaran_id_status_idx" ON "versi_jadwal"("sekolah_id", "tahun_ajaran_id", "status");

CREATE INDEX "jadwal_pelajaran_versi_jadwal_id_hari_slot_waktu_id_idx" ON "jadwal_pelajaran"("versi_jadwal_id", "hari", "slot_waktu_id");

CREATE INDEX "jadwal_pelajaran_guru_id_hari_slot_waktu_id_idx" ON "jadwal_pelajaran"("guru_id", "hari", "slot_waktu_id");

CREATE INDEX "jadwal_pelajaran_rombel_id_hari_slot_waktu_id_idx" ON "jadwal_pelajaran"("rombel_id", "hari", "slot_waktu_id");

CREATE INDEX "sesi_kelas_aktual_guru_id_tanggal_status_idx" ON "sesi_kelas_aktual"("guru_id", "tanggal", "status");

CREATE INDEX "sesi_kelas_aktual_rombel_id_tanggal_status_idx" ON "sesi_kelas_aktual"("rombel_id", "tanggal", "status");

CREATE INDEX "sesi_kelas_aktual_jadwal_pelajaran_id_tanggal_idx" ON "sesi_kelas_aktual"("jadwal_pelajaran_id", "tanggal");

CREATE INDEX "lingkup_materi_penugasan_mengajar_id_urutan_idx" ON "lingkup_materi"("penugasan_mengajar_id", "urutan");

CREATE INDEX "lingkup_materi_sekolah_id_status_idx" ON "lingkup_materi"("sekolah_id", "status");

CREATE INDEX "tujuan_pembelajaran_lingkup_materi_id_urutan_idx" ON "tujuan_pembelajaran"("lingkup_materi_id", "urutan");

CREATE INDEX "tujuan_pembelajaran_sekolah_id_status_idx" ON "tujuan_pembelajaran"("sekolah_id", "status");

CREATE INDEX "tujuan_pembelajaran_capaian_pembelajaran_id_idx" ON "tujuan_pembelajaran"("capaian_pembelajaran_id");

CREATE INDEX "materi_pembelajaran_guru_id_status_idx" ON "materi_pembelajaran"("guru_id", "status");

CREATE INDEX "materi_pembelajaran_sekolah_id_status_idx" ON "materi_pembelajaran"("sekolah_id", "status");

CREATE INDEX "publikasi_materi_penugasan_mengajar_id_status_idx" ON "publikasi_materi"("penugasan_mengajar_id", "status");

CREATE UNIQUE INDEX "publikasi_materi_materi_id_penugasan_mengajar_id_key" ON "publikasi_materi"("materi_id", "penugasan_mengajar_id");

CREATE INDEX "definisi_tugas_guru_id_status_idx" ON "definisi_tugas"("guru_id", "status");

CREATE INDEX "definisi_tugas_sekolah_id_status_idx" ON "definisi_tugas"("sekolah_id", "status");

CREATE INDEX "publikasi_tugas_penugasan_mengajar_id_status_idx" ON "publikasi_tugas"("penugasan_mengajar_id", "status");

CREATE INDEX "pengumpulan_tugas_siswa_id_status_idx" ON "pengumpulan_tugas"("siswa_id", "status");

CREATE UNIQUE INDEX "pengumpulan_tugas_publikasi_tugas_id_siswa_id_key" ON "pengumpulan_tugas"("publikasi_tugas_id", "siswa_id");

CREATE UNIQUE INDEX "administrasi_pembelajaran_sesi_kelas_aktual_id_key" ON "administrasi_pembelajaran"("sesi_kelas_aktual_id");

CREATE INDEX "administrasi_pembelajaran_penugasan_mengajar_id_tanggal_idx" ON "administrasi_pembelajaran"("penugasan_mengajar_id", "tanggal");

CREATE INDEX "administrasi_pembelajaran_guru_id_tanggal_idx" ON "administrasi_pembelajaran"("guru_id", "tanggal");

CREATE UNIQUE INDEX "administrasi_tujuan_pembelajaran_administrasi_id_tp_id_key" ON "administrasi_tujuan_pembelajaran"("administrasi_id", "tp_id");

CREATE INDEX "presensi_sesi_kelas_sesi_kelas_id_status_idx" ON "presensi_sesi_kelas"("sesi_kelas_id", "status");

CREATE INDEX "presensi_sesi_kelas_siswa_id_status_idx" ON "presensi_sesi_kelas"("siswa_id", "status");

CREATE INDEX "presensi_sesi_kelas_sekolah_id_status_idx" ON "presensi_sesi_kelas"("sekolah_id", "status");

CREATE UNIQUE INDEX "presensi_sesi_kelas_sesi_kelas_id_siswa_id_key" ON "presensi_sesi_kelas"("sesi_kelas_id", "siswa_id");

CREATE INDEX "definisi_asesmen_penugasan_mengajar_id_tanggal_pelaksanaan_idx" ON "definisi_asesmen"("penugasan_mengajar_id", "tanggal_pelaksanaan");

CREATE INDEX "definisi_asesmen_tp_id_idx" ON "definisi_asesmen"("tp_id");

CREATE INDEX "definisi_asesmen_lingkup_materi_id_idx" ON "definisi_asesmen"("lingkup_materi_id");

CREATE INDEX "definisi_asesmen_sekolah_id_status_idx" ON "definisi_asesmen"("sekolah_id", "status");

CREATE INDEX "nilai_siswa_asesmen_id_status_idx" ON "nilai_siswa"("asesmen_id", "status");

CREATE INDEX "nilai_siswa_siswa_id_idx" ON "nilai_siswa"("siswa_id");

CREATE INDEX "nilai_siswa_sekolah_id_status_idx" ON "nilai_siswa"("sekolah_id", "status");

CREATE UNIQUE INDEX "nilai_siswa_asesmen_id_siswa_id_key" ON "nilai_siswa"("asesmen_id", "siswa_id");

CREATE INDEX "publikasi_nilai_asesmen_asesmen_id_status_idx" ON "publikasi_nilai_asesmen"("asesmen_id", "status");

CREATE INDEX "publikasi_nilai_asesmen_sekolah_id_status_idx" ON "publikasi_nilai_asesmen"("sekolah_id", "status");

CREATE INDEX "bank_soal_sekolah_id_mata_pelajaran_id_status_idx" ON "bank_soal"("sekolah_id", "mata_pelajaran_id", "status");

CREATE INDEX "bank_soal_sekolah_id_scope_kepemilikan_mata_pelajaran_id_idx" ON "bank_soal"("sekolah_id", "scope_kepemilikan", "mata_pelajaran_id");

CREATE INDEX "bank_soal_guru_id_idx" ON "bank_soal"("guru_id");

CREATE INDEX "bank_soal_lingkup_materi_id_idx" ON "bank_soal"("lingkup_materi_id");

CREATE INDEX "bank_soal_tujuan_pembelajaran_id_idx" ON "bank_soal"("tujuan_pembelajaran_id");

CREATE INDEX "bank_soal_capaian_pembelajaran_id_idx" ON "bank_soal"("capaian_pembelajaran_id");

CREATE INDEX "bank_soal_folder_id_idx" ON "bank_soal"("folder_id");

CREATE UNIQUE INDEX "bank_soal_sekolah_id_kode_key" ON "bank_soal"("sekolah_id", "kode");

CREATE INDEX "versi_soal_sekolah_id_idx" ON "versi_soal"("sekolah_id");

CREATE UNIQUE INDEX "versi_soal_bank_soal_id_nomor_versi_key" ON "versi_soal"("bank_soal_id", "nomor_versi");

CREATE INDEX "ujian_cbt_sekolah_id_penugasan_mengajar_id_status_idx" ON "ujian_cbt"("sekolah_id", "penugasan_mengajar_id", "status");

CREATE INDEX "ujian_cbt_penugasan_mengajar_id_idx" ON "ujian_cbt"("penugasan_mengajar_id");

CREATE INDEX "ujian_cbt_asesmen_id_idx" ON "ujian_cbt"("asesmen_id");

CREATE INDEX "snapshot_ujian_sekolah_id_idx" ON "snapshot_ujian"("sekolah_id");

CREATE UNIQUE INDEX "snapshot_ujian_ujian_cbt_id_nomor_snapshot_key" ON "snapshot_ujian"("ujian_cbt_id", "nomor_snapshot");

CREATE INDEX "exam_session_sekolah_id_status_idx" ON "exam_session"("sekolah_id", "status");

CREATE INDEX "exam_session_ujian_cbt_id_idx" ON "exam_session"("ujian_cbt_id");

CREATE UNIQUE INDEX "exam_session_ujian_cbt_id_kode_sesi_key" ON "exam_session"("ujian_cbt_id", "kode_sesi");

CREATE INDEX "assessment_attempt_siswa_id_status_idx" ON "assessment_attempt"("siswa_id", "status");

CREATE INDEX "assessment_attempt_ujian_cbt_id_status_idx" ON "assessment_attempt"("ujian_cbt_id", "status");

CREATE INDEX "assessment_attempt_exam_session_id_idx" ON "assessment_attempt"("exam_session_id");

CREATE INDEX "assessment_attempt_sekolah_id_status_idx" ON "assessment_attempt"("sekolah_id", "status");

CREATE UNIQUE INDEX "assessment_attempt_ujian_cbt_id_siswa_id_attempt_ke_key" ON "assessment_attempt"("ujian_cbt_id", "siswa_id", "attempt_ke");

CREATE INDEX "sesi_ujian_siswa_siswa_id_status_idx" ON "sesi_ujian_siswa"("siswa_id", "status");

CREATE INDEX "sesi_ujian_siswa_ujian_cbt_id_status_idx" ON "sesi_ujian_siswa"("ujian_cbt_id", "status");

CREATE INDEX "sesi_ujian_siswa_snapshot_id_idx" ON "sesi_ujian_siswa"("snapshot_id");

CREATE INDEX "sesi_ujian_siswa_sekolah_id_status_idx" ON "sesi_ujian_siswa"("sekolah_id", "status");

CREATE UNIQUE INDEX "sesi_ujian_siswa_ujian_cbt_id_siswa_id_attempt_ke_key" ON "sesi_ujian_siswa"("ujian_cbt_id", "siswa_id", "attempt_ke");

CREATE INDEX "jawaban_siswa_sesi_ujian_id_idx" ON "jawaban_siswa"("sesi_ujian_id");

CREATE INDEX "jawaban_siswa_soal_id_idx" ON "jawaban_siswa"("soal_id");

CREATE UNIQUE INDEX "jawaban_siswa_sesi_ujian_id_soal_id_key" ON "jawaban_siswa"("sesi_ujian_id", "soal_id");

CREATE UNIQUE INDEX "hasil_ujian_cbt_sesi_ujian_id_key" ON "hasil_ujian_cbt"("sesi_ujian_id");

CREATE INDEX "hasil_ujian_cbt_ujian_cbt_id_siswa_id_idx" ON "hasil_ujian_cbt"("ujian_cbt_id", "siswa_id");

CREATE INDEX "hasil_ujian_cbt_sekolah_id_status_transfer_idx" ON "hasil_ujian_cbt"("sekolah_id", "status_transfer");

CREATE INDEX "event_integritas_ujian_sesi_ujian_id_waktu_kejadian_idx" ON "event_integritas_ujian"("sesi_ujian_id", "waktu_kejadian");

CREATE INDEX "event_integritas_ujian_sekolah_id_idx" ON "event_integritas_ujian"("sekolah_id");

CREATE UNIQUE INDEX "wali_murid_pengguna_id_key" ON "wali_murid"("pengguna_id");

CREATE INDEX "wali_murid_sekolah_id_idx" ON "wali_murid"("sekolah_id");

CREATE INDEX "hubungan_wali_siswa_sekolah_id_status_verifikasi_idx" ON "hubungan_wali_siswa"("sekolah_id", "status_verifikasi");

CREATE INDEX "hubungan_wali_siswa_siswa_id_idx" ON "hubungan_wali_siswa"("siswa_id");

CREATE UNIQUE INDEX "hubungan_wali_siswa_wali_id_siswa_id_key" ON "hubungan_wali_siswa"("wali_id", "siswa_id");

CREATE INDEX "pengajuan_wali_sekolah_id_status_idx" ON "pengajuan_wali"("sekolah_id", "status");

CREATE INDEX "pengajuan_wali_siswa_id_idx" ON "pengajuan_wali"("siswa_id");

CREATE INDEX "pengumuman_sekolah_id_status_idx" ON "pengumuman"("sekolah_id", "status");

CREATE INDEX "pengumuman_sekolah_id_target_audiens_idx" ON "pengumuman"("sekolah_id", "target_audiens");

CREATE INDEX "pengumuman_penulis_id_idx" ON "pengumuman"("penulis_id");

CREATE INDEX "pengumuman_target_rombel_id_idx" ON "pengumuman"("target_rombel_id");

CREATE INDEX "sasaran_pengumuman_pengumuman_id_idx" ON "sasaran_pengumuman"("pengumuman_id");

CREATE INDEX "sasaran_pengumuman_tipe_sasaran_nilai_sasaran_idx" ON "sasaran_pengumuman"("tipe_sasaran", "nilai_sasaran");

CREATE INDEX "notifikasi_pengguna_pengguna_id_apakah_dibaca_idx" ON "notifikasi_pengguna"("pengguna_id", "apakah_dibaca");

CREATE INDEX "notifikasi_pengguna_sekolah_id_created_at_idx" ON "notifikasi_pengguna"("sekolah_id", "created_at");

CREATE UNIQUE INDEX "preferensi_notifikasi_pengguna_id_key" ON "preferensi_notifikasi"("pengguna_id");

CREATE INDEX "catatan_monitoring_sekolah_id_rombel_id_idx" ON "catatan_monitoring"("sekolah_id", "rombel_id");

CREATE INDEX "catatan_monitoring_siswa_id_status_idx" ON "catatan_monitoring"("siswa_id", "status");

CREATE INDEX "catatan_monitoring_penulis_id_idx" ON "catatan_monitoring"("penulis_id");

CREATE INDEX "tindak_lanjut_monitoring_catatan_id_status_idx" ON "tindak_lanjut_monitoring"("catatan_id", "status");

CREATE INDEX "riwayat_ekspor_laporan_sekolah_id_tipe_laporan_idx" ON "riwayat_ekspor_laporan"("sekolah_id", "tipe_laporan");

CREATE INDEX "riwayat_ekspor_laporan_dibuat_oleh_id_idx" ON "riwayat_ekspor_laporan"("dibuat_oleh_id");

CREATE INDEX "konfigurasi_integrasi_sekolah_id_status_idx" ON "konfigurasi_integrasi"("sekolah_id", "status");

CREATE UNIQUE INDEX "konfigurasi_integrasi_sekolah_id_tipe_layanan_provider_key" ON "konfigurasi_integrasi"("sekolah_id", "tipe_layanan", "provider");

CREATE INDEX "endpoint_webhook_sekolah_id_status_idx" ON "endpoint_webhook"("sekolah_id", "status");

CREATE UNIQUE INDEX "log_pengiriman_integrasi_idempotency_key_key" ON "log_pengiriman_integrasi"("idempotency_key");

CREATE INDEX "log_pengiriman_integrasi_sekolah_id_tipe_layanan_status_idx" ON "log_pengiriman_integrasi"("sekolah_id", "tipe_layanan", "status");

CREATE INDEX "log_pengiriman_integrasi_sekolah_id_created_at_idx" ON "log_pengiriman_integrasi"("sekolah_id", "created_at");

CREATE INDEX "permintaan_setup_kelas_ai_sekolah_id_status_idx" ON "permintaan_setup_kelas_ai"("sekolah_id", "status");

CREATE INDEX "permintaan_setup_kelas_ai_pengguna_id_idx" ON "permintaan_setup_kelas_ai"("pengguna_id");

CREATE UNIQUE INDEX "transaksi_langganan_order_id_key" ON "transaksi_langganan"("order_id");

CREATE INDEX "transaksi_langganan_pengguna_id_idx" ON "transaksi_langganan"("pengguna_id");

CREATE INDEX "transaksi_langganan_status_idx" ON "transaksi_langganan"("status");

CREATE INDEX "transaksi_langganan_order_id_idx" ON "transaksi_langganan"("order_id");

CREATE INDEX "rapor_siswa_penempatan_rombel_id_status_idx" ON "rapor_siswa"("penempatan_rombel_id", "status");

CREATE INDEX "rapor_siswa_sekolah_id_status_idx" ON "rapor_siswa"("sekolah_id", "status");

CREATE UNIQUE INDEX "rapor_siswa_siswa_id_semester_id_key" ON "rapor_siswa"("siswa_id", "semester_id");

CREATE INDEX "folder_bank_soal_sekolah_id_guru_id_idx" ON "folder_bank_soal"("sekolah_id", "guru_id");

CREATE INDEX "folder_bank_soal_parent_id_idx" ON "folder_bank_soal"("parent_id");

CREATE UNIQUE INDEX "folder_bank_soal_sekolah_id_guru_id_parent_id_nama_key" ON "folder_bank_soal"("sekolah_id", "guru_id", "parent_id", "nama");

CREATE INDEX "capaian_pembelajaran_sekolah_id_mata_pelajaran_id_status_idx" ON "capaian_pembelajaran"("sekolah_id", "mata_pelajaran_id", "status");

CREATE UNIQUE INDEX "capaian_pembelajaran_sekolah_id_mata_pelajaran_id_fase_id_kode_key" ON "capaian_pembelajaran"("sekolah_id", "mata_pelajaran_id", "fase_id", "kode");

CREATE UNIQUE INDEX "kriteria_ketercapaian_tp_tujuan_pembelajaran_id_key" ON "kriteria_ketercapaian_tp"("tujuan_pembelajaran_id");

CREATE INDEX "kriteria_ketercapaian_tp_sekolah_id_idx" ON "kriteria_ketercapaian_tp"("sekolah_id");

CREATE UNIQUE INDEX "kisi_kisi_asesmen_definisi_asesmen_id_key" ON "kisi_kisi_asesmen"("definisi_asesmen_id");

CREATE INDEX "kisi_kisi_asesmen_sekolah_id_status_idx" ON "kisi_kisi_asesmen"("sekolah_id", "status");

CREATE INDEX "item_kisi_kisi_sekolah_id_kisi_kisi_id_idx" ON "item_kisi_kisi"("sekolah_id", "kisi_kisi_id");

CREATE INDEX "item_kisi_kisi_tujuan_pembelajaran_id_idx" ON "item_kisi_kisi"("tujuan_pembelajaran_id");

CREATE INDEX "item_kisi_kisi_bank_soal_id_idx" ON "item_kisi_kisi"("bank_soal_id");

CREATE INDEX "item_kisi_kisi_versi_soal_id_idx" ON "item_kisi_kisi"("versi_soal_id");

CREATE UNIQUE INDEX "item_kisi_kisi_kisi_kisi_id_nomor_urut_key" ON "item_kisi_kisi"("kisi_kisi_id", "nomor_urut");