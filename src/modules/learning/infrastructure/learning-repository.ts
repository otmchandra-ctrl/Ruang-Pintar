/**
 * Ruang Pintar — M11 Learning Prisma Repository
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import { generateUlid } from "@/shared/lib/ulid";
import { getHariBelajarInTimezone } from "@/shared/lib/date-utils";
import {
  CreateAdministrasiInput,
  CreateLingkupMateriInput,
  CreateMateriInput,
  CreateTugasInput,
  CreateTujuanPembelajaranInput,
  LingkupMateriDTO,
  MateriPembelajaranDTO,
  TeacherClassCardDTO,
  TeacherClassWorkspaceDTO,
  TujuanPembelajaranDTO,
  UpdateAdministrasiInput,
  UpdateLingkupMateriInput,
  UpdateMateriInput,
  UpdateTujuanPembelajaranInput,
  AdministrasiPembelajaranDTO,
  DefinisiTugasDTO,
  CapaianPembelajaranDTO,
  CreateCapaianPembelajaranInput,
  UpdateCapaianPembelajaranInput,
  KriteriaKetercapaianTpDTO,
  UpsertKktpInput,
  CurriculumLineageNodeDTO,
  ClassActivityItemDTO,
} from "../domain/learning-types";

export class LearningRepository {
  /**
   * Mengambil seluruh penugasan mengajar aktif guru (Daftar Kelas Saya)
   */
  async listTeacherClasses(
    sekolahId: string,
    guruId?: string | null
  ): Promise<TeacherClassCardDTO[]> {
    const where: any = {
      sekolah_id: sekolahId,
      status: "AKTIF",
    };
    if (guruId) {
      where.guru_id = guruId;
    }

    const assignments = await prisma.penugasanMengajar.findMany({
      where,
      include: {
        guru: true,
        rombel: {
          include: {
            tingkat: true,
            penempatan_rombel: {
              where: { status: "AKTIF" },
            },
            penugasan_wali: {
              where: { status: "AKTIF" },
              include: { guru: { select: { nama_lengkap: true } } },
            },
          },
        },
        mata_pelajaran: true,
        tahun_ajaran: true,
        semester: true,
        lingkup_materi: {
          where: { status: "AKTIF" },
          select: { id: true },
        },
        publikasi_materi: {
          where: { status: "DITERBITKAN" },
          select: { id: true },
        },
        publikasi_tugas: {
          where: { status: "DITERBITKAN" },
          select: { id: true },
        },
        administrasi_pembelajaran: {
          select: { id: true },
        },
        jadwal_pelajaran: {
          select: { hari: true, slot_waktu: true },
        },
      },
      orderBy: [{ rombel: { nama: "asc" } }, { mata_pelajaran: { nama: "asc" } }],
    });

    const hariMap: Record<number, string> = {
      1: "SENIN",
      2: "SELASA",
      3: "RABU",
      4: "KAMIS",
      5: "JUMAT",
      6: "SABTU",
      0: "MINGGU",
    };
    const dayOrder: Record<string, number> = {
      SENIN: 1,
      SELASA: 2,
      RABU: 3,
      KAMIS: 4,
      JUMAT: 5,
      SABTU: 6,
      MINGGU: 7,
    };
    const dayNameId: Record<string, string> = {
      SENIN: "Senin",
      SELASA: "Selasa",
      RABU: "Rabu",
      KAMIS: "Kamis",
      JUMAT: "Jumat",
      SABTU: "Sabtu",
      MINGGU: "Minggu",
    };
    const todayName = getHariBelajarInTimezone(new Date(), "Asia/Jakarta");

    return assignments.map((a) => {
      const todaySchedule = a.jadwal_pelajaran.find((j) => j.hari === todayName);

      const schedules = a.jadwal_pelajaran;
      const byDay: Record<string, (typeof schedules)[0]["slot_waktu"][]> = {};
      for (const s of schedules) {
        if (!byDay[s.hari]) byDay[s.hari] = [];
        byDay[s.hari].push(s.slot_waktu);
      }
      const daysSorted = Object.keys(byDay).sort(
        (x, y) => (dayOrder[x] || 99) - (dayOrder[y] || 99)
      );
      const daySchedules = daysSorted.map((d) => {
        const slots = byDay[d].sort((x, y) => x.urutan - y.urutan);
        const start = slots[0]?.jam_mulai || "";
        const end = slots[slots.length - 1]?.jam_selesai || "";
        return {
          hari: dayNameId[d] || d,
          jam: start && end ? `${start}–${end}` : "",
          jp: slots.length,
        };
      });

      const hari_mengajar =
        daySchedules.length > 0 ? daySchedules.map((d) => d.hari).join(", ") : null;
      const jam_mengajar =
        daySchedules.length > 0
          ? daySchedules
              .map((d) => d.jam)
              .filter(Boolean)
              .join(", ")
          : null;
      const jadwal_ringkas =
        daySchedules.length > 0 ? daySchedules.map((d) => `${d.hari} ${d.jam}`).join(" • ") : null;

      return {
        id: a.id,
        guru_id: a.guru_id,
        guru_nama: a.guru.nama_lengkap,
        rombel_id: a.rombel_id,
        rombel_nama: a.rombel.nama,
        tingkat_nama: a.rombel.tingkat?.nama || null,
        mata_pelajaran_id: a.mata_pelajaran_id,
        mata_pelajaran_nama: a.mata_pelajaran.nama,
        mata_pelajaran_kode: a.mata_pelajaran.kode,
        tahun_ajaran_nama: a.tahun_ajaran.nama,
        semester_nama: a.semester?.nama || null,
        jumlah_jam_minggu: a.jumlah_jam_minggu,
        status: a.status,
        total_siswa: a.rombel.penempatan_rombel.length,
        total_bab: a.lingkup_materi.length,
        total_materi: a.publikasi_materi.length,
        total_tugas: a.publikasi_tugas.length,
        total_jurnal: a.administrasi_pembelajaran.length,
        jadwal_hari_ini: todaySchedule
          ? `${todaySchedule.slot_waktu.jam_mulai} - ${todaySchedule.slot_waktu.jam_selesai}`
          : null,
        hari_mengajar,
        jam_mengajar,
        jadwal_ringkas,
        wali_kelas_nama: a.rombel.penugasan_wali[0]?.guru?.nama_lengkap || null,
      };
    });
  }

  /**
   * Mengambil daftar guru yang memiliki penugasan mengajar aktif
   */
  async listTeachersWithAssignments(sekolahId: string): Promise<
    Array<{
      id: string;
      nama_lengkap: string;
      gelar_depan: string | null;
      gelar_belakang: string | null;
      total_kelas: number;
    }>
  > {
    const teachers = await prisma.guru.findMany({
      where: {
        sekolah_id: sekolahId,
        status_aktif: true,
        penugasan_mengajar: {
          some: { status: "AKTIF" },
        },
      },
      select: {
        id: true,
        nama_lengkap: true,
        gelar_depan: true,
        gelar_belakang: true,
        _count: {
          select: {
            penugasan_mengajar: {
              where: { status: "AKTIF" },
            },
          },
        },
      },
      orderBy: { nama_lengkap: "asc" },
    });

    return teachers.map((t) => ({
      id: t.id,
      nama_lengkap: t.nama_lengkap,
      gelar_depan: t.gelar_depan,
      gelar_belakang: t.gelar_belakang,
      total_kelas: t._count.penugasan_mengajar,
    }));
  }

  /**
   * Mengambil seluruh data Workspace Kelas Terpadu berdasarkan ID Penugasan Mengajar
   */
  async getTeacherClassWorkspace(
    penugasanId: string,
    sekolahId: string
  ): Promise<TeacherClassWorkspaceDTO | null> {
    const penugasan = await prisma.penugasanMengajar.findFirst({
      where: {
        id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        guru: true,
        rombel: {
          include: {
            tingkat: true,
            penempatan_rombel: {
              where: { status: "AKTIF" },
            },
          },
        },
        mata_pelajaran: true,
        tahun_ajaran: true,
        semester: true,
        jadwal_pelajaran: {
          include: {
            slot_waktu: true,
          },
          orderBy: [{ hari: "asc" }, { slot_waktu: { urutan: "asc" } }],
        },
      },
    });

    if (!penugasan) return null;

    // 1. Lingkup Materi & TP
    const lingkupMateriRaw = await prisma.lingkupMateri.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        tujuan_pembelajaran: {
          orderBy: { urutan: "asc" },
        },
      },
      orderBy: { urutan: "asc" },
    });

    // 2. Materi Terpublikasi di kelas ini
    const publikasiMateriRaw = await prisma.publikasiMateri.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        materi: {
          include: {
            lingkup_materi: true,
            mata_pelajaran: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // 3. Tugas Terpublikasi di kelas ini
    const publikasiTugasRaw = await prisma.publikasiTugas.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        tugas: {
          include: {
            lingkup_materi: true,
            mata_pelajaran: true,
          },
        },
        _count: {
          select: { pengumpulan: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // 4. Jurnal Administrasi Pembelajaran KBM
    const administrasiRaw = await prisma.administrasiPembelajaran.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        guru: true,
        tp_terkait: {
          include: { tp: true },
        },
      },
      orderBy: { pertemuan_ke: "desc" },
    });

    return {
      penugasan: {
        id: penugasan.id,
        sekolah_id: penugasan.sekolah_id,
        guru_id: penugasan.guru_id,
        guru_nama: penugasan.guru.nama_lengkap,
        mata_pelajaran_id: penugasan.mata_pelajaran_id,
        mata_pelajaran_nama: penugasan.mata_pelajaran.nama,
        mata_pelajaran_kode: penugasan.mata_pelajaran.kode,
        rombel_id: penugasan.rombel_id,
        rombel_nama: penugasan.rombel.nama,
        tingkat_nama: penugasan.rombel.tingkat?.nama || null,
        tahun_ajaran_id: penugasan.tahun_ajaran_id,
        tahun_ajaran_nama: penugasan.tahun_ajaran.nama,
        semester_id: penugasan.semester_id,
        semester_nama: penugasan.semester?.nama || null,
        jumlah_jam_minggu: penugasan.jumlah_jam_minggu,
        status: penugasan.status,
      },
      total_siswa: penugasan.rombel.penempatan_rombel.length,
      lingkup_materi: lingkupMateriRaw.map((lm) => ({
        id: lm.id,
        sekolah_id: lm.sekolah_id,
        penugasan_mengajar_id: lm.penugasan_mengajar_id,
        kode: lm.kode,
        judul: lm.judul,
        deskripsi: lm.deskripsi,
        urutan: lm.urutan,
        status: lm.status as any,
        created_at: lm.created_at,
        updated_at: lm.updated_at,
        tujuan_pembelajaran: lm.tujuan_pembelajaran.map((tp) => ({
          id: tp.id,
          sekolah_id: tp.sekolah_id,
          lingkup_materi_id: tp.lingkup_materi_id,
          kode: tp.kode,
          deskripsi: tp.deskripsi,
          urutan: tp.urutan,
          status: tp.status as any,
          created_at: tp.created_at,
          updated_at: tp.updated_at,
        })),
      })),
      materi_list: publikasiMateriRaw.map((pub) => ({
        id: pub.materi.id,
        sekolah_id: pub.materi.sekolah_id,
        guru_id: pub.materi.guru_id,
        lingkup_materi_id: pub.materi.lingkup_materi_id,
        lingkup_materi_judul: pub.materi.lingkup_materi?.judul || null,
        mata_pelajaran_id: pub.materi.mata_pelajaran_id,
        mata_pelajaran_nama: pub.materi.mata_pelajaran?.nama || null,
        judul: pub.materi.judul,
        deskripsi: pub.materi.deskripsi,
        tipe_konten: pub.materi.tipe_konten as any,
        konten_teks: pub.materi.konten_teks,
        tautan_url: pub.materi.tautan_url,
        berkas_id: pub.materi.berkas_id,
        status: pub.materi.status as any,
        created_at: pub.materi.created_at,
        updated_at: pub.materi.updated_at,
        is_published: pub.status === "DITERBITKAN",
      })),
      tugas_list: publikasiTugasRaw.map((pub) => ({
        id: pub.tugas.id,
        sekolah_id: pub.tugas.sekolah_id,
        guru_id: pub.tugas.guru_id,
        lingkup_materi_id: pub.tugas.lingkup_materi_id,
        lingkup_materi_judul: pub.tugas.lingkup_materi?.judul || null,
        mata_pelajaran_id: pub.tugas.mata_pelajaran_id,
        mata_pelajaran_nama: pub.tugas.mata_pelajaran?.nama || null,
        judul: pub.tugas.judul,
        petunjuk: pub.tugas.petunjuk,
        tipe_penyerahan: pub.tugas.tipe_penyerahan as any,
        berkas_id: pub.tugas.berkas_id,
        status: pub.tugas.status as any,
        created_at: pub.tugas.created_at,
        updated_at: pub.tugas.updated_at,
        publikasi_aktif: {
          id: pub.id,
          sekolah_id: pub.sekolah_id,
          tugas_id: pub.tugas_id,
          penugasan_mengajar_id: pub.penugasan_mengajar_id,
          tanggal_mulai: pub.tanggal_mulai,
          batas_waktu: pub.batas_waktu,
          izinkan_terlambat: pub.izinkan_terlambat,
          status: pub.status as any,
          catatan: pub.catatan,
          submission_count: pub._count.pengumpulan,
          created_at: pub.created_at,
          updated_at: pub.updated_at,
        },
      })),
      administrasi_list: administrasiRaw.map((adm) => ({
        id: adm.id,
        sekolah_id: adm.sekolah_id,
        penugasan_mengajar_id: adm.penugasan_mengajar_id,
        sesi_kelas_aktual_id: adm.sesi_kelas_aktual_id,
        guru_id: adm.guru_id,
        guru_nama: adm.guru.nama_lengkap,
        tanggal: adm.tanggal,
        pertemuan_ke: adm.pertemuan_ke,
        materi_disampaikan: adm.materi_disampaikan,
        kegiatan_pembelajaran: adm.kegiatan_pembelajaran,
        catatan_refleksi: adm.catatan_refleksi,
        status_realisasi: adm.status_realisasi as any,
        created_at: adm.created_at,
        updated_at: adm.updated_at,
        tp_ids: adm.tp_terkait.map((t) => t.tp_id),
        tp_terkait: adm.tp_terkait.map((t) => ({
          id: t.tp.id,
          sekolah_id: t.tp.sekolah_id,
          lingkup_materi_id: t.tp.lingkup_materi_id,
          kode: t.tp.kode,
          deskripsi: t.tp.deskripsi,
          urutan: t.tp.urutan,
          status: t.tp.status as any,
          created_at: t.tp.created_at,
          updated_at: t.tp.updated_at,
        })),
      })),
      jadwal_list: penugasan.jadwal_pelajaran.map((j) => ({
        hari: j.hari,
        jam_mulai: j.slot_waktu.jam_mulai,
        jam_selesai: j.slot_waktu.jam_selesai,
        ruangan: j.ruangan,
        slot_nama: j.slot_waktu.nama,
      })),
    };
  }

  // ==========================================
  // LINGKUP MATERI (BAB)
  // ==========================================

  async createLingkupMateri(input: CreateLingkupMateriInput): Promise<LingkupMateriDTO> {
    const penugasan = await prisma.penugasanMengajar.findFirst({
      where: { id: input.penugasan_mengajar_id, sekolah_id: input.sekolah_id },
    });
    if (!penugasan) {
      throw new Error(
        `Penugasan mengajar dengan ID '${input.penugasan_mengajar_id}' tidak ditemukan atau bukan milik sekolah aktif.`
      );
    }

    const id = generateUlid();
    const created = await prisma.lingkupMateri.create({
      data: {
        id,
        sekolah_id: input.sekolah_id,
        penugasan_mengajar_id: input.penugasan_mengajar_id,
        kode: input.kode || null,
        judul: input.judul,
        deskripsi: input.deskripsi || null,
        urutan: input.urutan || 1,
        status: "AKTIF",
      },
    });

    return {
      ...created,
      status: created.status as any,
    };
  }

  async updateLingkupMateri(
    id: string,
    input: UpdateLingkupMateriInput,
    sekolahId?: string
  ): Promise<LingkupMateriDTO> {
    const existing = await prisma.lingkupMateri.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Lingkup materi dengan ID '${id}' tidak ditemukan.`);
    }

    const updated = await prisma.lingkupMateri.update({
      where: { id },
      data: {
        kode: input.kode,
        judul: input.judul,
        deskripsi: input.deskripsi,
        urutan: input.urutan,
        status: input.status,
      },
    });

    return {
      ...updated,
      status: updated.status as any,
    };
  }

  async deleteLingkupMateri(id: string, sekolahId?: string): Promise<void> {
    const existing = await prisma.lingkupMateri.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Lingkup materi dengan ID '${id}' tidak ditemukan.`);
    }

    await prisma.lingkupMateri.delete({
      where: { id },
    });
  }

  // ==========================================
  // TUJUAN PEMBELAJARAN (TP)
  // ==========================================

  async createTujuanPembelajaran(
    input: CreateTujuanPembelajaranInput
  ): Promise<TujuanPembelajaranDTO> {
    const id = generateUlid();
    const created = await prisma.tujuanPembelajaran.create({
      data: {
        id,
        sekolah_id: input.sekolah_id,
        lingkup_materi_id: input.lingkup_materi_id,
        capaian_pembelajaran_id: input.capaian_pembelajaran_id || null,
        kode: input.kode || null,
        deskripsi: input.deskripsi,
        urutan: input.urutan || 1,
        status: "AKTIF",
      },
    });

    return {
      ...created,
      status: created.status as any,
    };
  }

  async updateTujuanPembelajaran(
    id: string,
    input: UpdateTujuanPembelajaranInput,
    sekolahId?: string
  ): Promise<TujuanPembelajaranDTO> {
    const existing = await prisma.tujuanPembelajaran.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Tujuan pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    const updated = await prisma.tujuanPembelajaran.update({
      where: { id },
      data: {
        capaian_pembelajaran_id:
          input.capaian_pembelajaran_id !== undefined
            ? input.capaian_pembelajaran_id
            : existing.capaian_pembelajaran_id,
        kode: input.kode,
        deskripsi: input.deskripsi,
        urutan: input.urutan,
        status: input.status,
      },
    });

    return {
      ...updated,
      status: updated.status as any,
    };
  }

  async deleteTujuanPembelajaran(id: string, sekolahId?: string): Promise<void> {
    const existing = await prisma.tujuanPembelajaran.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Tujuan pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    await prisma.tujuanPembelajaran.delete({
      where: { id },
    });
  }

  // ==========================================
  // CAPAIAN PEMBELAJARAN (CP)
  // ==========================================

  async listCapaianPembelajaran(
    sekolahId: string,
    filter?: { mataPelajaranId?: string; faseId?: string; status?: string }
  ): Promise<CapaianPembelajaranDTO[]> {
    const where: any = { sekolah_id: sekolahId };
    if (filter?.mataPelajaranId) where.mata_pelajaran_id = filter.mataPelajaranId;
    if (filter?.faseId) where.fase_id = filter.faseId;
    if (filter?.status) where.status = filter.status;

    const list = await prisma.capaianPembelajaran.findMany({
      where,
      include: {
        mata_pelajaran: true,
        fase: true,
        _count: { select: { tujuan_pembelajaran: true } },
      },
      orderBy: [{ urutan: "asc" }, { kode: "asc" }],
    });

    return list.map((cp) => ({
      id: cp.id,
      sekolah_id: cp.sekolah_id,
      mata_pelajaran_id: cp.mata_pelajaran_id,
      mata_pelajaran_nama: cp.mata_pelajaran.nama,
      mata_pelajaran_kode: cp.mata_pelajaran.kode,
      fase_id: cp.fase_id,
      fase_nama: cp.fase.nama,
      fase_kode: cp.fase.kode,
      kode: cp.kode,
      elemen: cp.elemen,
      deskripsi: cp.deskripsi,
      urutan: cp.urutan,
      status: cp.status as any,
      created_at: cp.created_at,
      updated_at: cp.updated_at,
      tujuan_pembelajaran_count: cp._count.tujuan_pembelajaran,
    }));
  }

  async getCapaianPembelajaranById(
    sekolahId: string,
    id: string
  ): Promise<CapaianPembelajaranDTO | null> {
    const cp = await prisma.capaianPembelajaran.findFirst({
      where: { id, sekolah_id: sekolahId },
      include: {
        mata_pelajaran: true,
        fase: true,
        _count: { select: { tujuan_pembelajaran: true } },
      },
    });

    if (!cp) return null;

    return {
      id: cp.id,
      sekolah_id: cp.sekolah_id,
      mata_pelajaran_id: cp.mata_pelajaran_id,
      mata_pelajaran_nama: cp.mata_pelajaran.nama,
      mata_pelajaran_kode: cp.mata_pelajaran.kode,
      fase_id: cp.fase_id,
      fase_nama: cp.fase.nama,
      fase_kode: cp.fase.kode,
      kode: cp.kode,
      elemen: cp.elemen,
      deskripsi: cp.deskripsi,
      urutan: cp.urutan,
      status: cp.status as any,
      created_at: cp.created_at,
      updated_at: cp.updated_at,
      tujuan_pembelajaran_count: cp._count.tujuan_pembelajaran,
    };
  }

  async createCapaianPembelajaran(
    input: CreateCapaianPembelajaranInput
  ): Promise<CapaianPembelajaranDTO> {
    const id = generateUlid();
    const created = await prisma.capaianPembelajaran.create({
      data: {
        id,
        sekolah_id: input.sekolah_id,
        mata_pelajaran_id: input.mata_pelajaran_id,
        fase_id: input.fase_id,
        kode: input.kode,
        elemen: input.elemen || null,
        deskripsi: input.deskripsi,
        urutan: input.urutan || 1,
        status: "AKTIF",
      },
      include: {
        mata_pelajaran: true,
        fase: true,
        _count: { select: { tujuan_pembelajaran: true } },
      },
    });

    return {
      id: created.id,
      sekolah_id: created.sekolah_id,
      mata_pelajaran_id: created.mata_pelajaran_id,
      mata_pelajaran_nama: created.mata_pelajaran.nama,
      mata_pelajaran_kode: created.mata_pelajaran.kode,
      fase_id: created.fase_id,
      fase_nama: created.fase.nama,
      fase_kode: created.fase.kode,
      kode: created.kode,
      elemen: created.elemen,
      deskripsi: created.deskripsi,
      urutan: created.urutan,
      status: created.status as any,
      created_at: created.created_at,
      updated_at: created.updated_at,
      tujuan_pembelajaran_count: created._count.tujuan_pembelajaran,
    };
  }

  async updateCapaianPembelajaran(
    sekolahId: string,
    id: string,
    input: UpdateCapaianPembelajaranInput
  ): Promise<CapaianPembelajaranDTO> {
    const existing = await prisma.capaianPembelajaran.findFirst({
      where: { id, sekolah_id: sekolahId },
    });
    if (!existing) {
      throw new Error(`Capaian Pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    const updated = await prisma.capaianPembelajaran.update({
      where: { id },
      data: {
        kode: input.kode,
        elemen: input.elemen,
        deskripsi: input.deskripsi,
        urutan: input.urutan,
        status: input.status,
      },
      include: {
        mata_pelajaran: true,
        fase: true,
        _count: { select: { tujuan_pembelajaran: true } },
      },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      mata_pelajaran_id: updated.mata_pelajaran_id,
      mata_pelajaran_nama: updated.mata_pelajaran.nama,
      mata_pelajaran_kode: updated.mata_pelajaran.kode,
      fase_id: updated.fase_id,
      fase_nama: updated.fase.nama,
      fase_kode: updated.fase.kode,
      kode: updated.kode,
      elemen: updated.elemen,
      deskripsi: updated.deskripsi,
      urutan: updated.urutan,
      status: updated.status as any,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      tujuan_pembelajaran_count: updated._count.tujuan_pembelajaran,
    };
  }

  async deleteCapaianPembelajaran(sekolahId: string, id: string): Promise<void> {
    const existing = await prisma.capaianPembelajaran.findFirst({
      where: { id, sekolah_id: sekolahId },
      include: { _count: { select: { tujuan_pembelajaran: true, bank_soal: true } } },
    });
    if (!existing) {
      throw new Error(`Capaian Pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }
    if (existing._count.tujuan_pembelajaran > 0) {
      throw new Error("Tidak dapat menghapus CP yang masih memiliki Tujuan Pembelajaran terkait.");
    }

    await prisma.capaianPembelajaran.delete({ where: { id } });
  }

  // ==========================================
  // KRITERIA KETERCAPAIAN TP (KKTP)
  // ==========================================

  async getKktpByTpId(
    sekolahId: string,
    tujuanPembelajaranId: string
  ): Promise<KriteriaKetercapaianTpDTO | null> {
    const kktp = await prisma.kriteriaKetercapaianTp.findFirst({
      where: {
        tujuan_pembelajaran_id: tujuanPembelajaranId,
        sekolah_id: sekolahId,
      },
    });

    if (!kktp) return null;

    return {
      id: kktp.id,
      sekolah_id: kktp.sekolah_id,
      tujuan_pembelajaran_id: kktp.tujuan_pembelajaran_id,
      tipe_kktp: kktp.tipe_kktp as any,
      ambang_tuntas: kktp.ambang_tuntas,
      interval_data: kktp.interval_json ? JSON.parse(kktp.interval_json) : null,
      rubrik_data: kktp.rubrik_json ? JSON.parse(kktp.rubrik_json) : null,
      deskripsi: kktp.deskripsi,
      created_at: kktp.created_at,
      updated_at: kktp.updated_at,
    };
  }

  async upsertKktp(input: UpsertKktpInput): Promise<KriteriaKetercapaianTpDTO> {
    const tp = await prisma.tujuanPembelajaran.findFirst({
      where: { id: input.tujuan_pembelajaran_id, sekolah_id: input.sekolah_id },
    });
    if (!tp) {
      throw new Error("Tujuan pembelajaran tidak ditemukan.");
    }

    const intervalJson = input.interval_data ? JSON.stringify(input.interval_data) : null;
    const rubrikJson = input.rubrik_data ? JSON.stringify(input.rubrik_data) : null;

    const existing = await prisma.kriteriaKetercapaianTp.findUnique({
      where: { tujuan_pembelajaran_id: input.tujuan_pembelajaran_id },
    });

    let saved;
    if (existing) {
      saved = await prisma.kriteriaKetercapaianTp.update({
        where: { id: existing.id },
        data: {
          tipe_kktp: input.tipe_kktp || existing.tipe_kktp,
          ambang_tuntas:
            input.ambang_tuntas !== undefined ? input.ambang_tuntas : existing.ambang_tuntas,
          interval_json: intervalJson !== undefined ? intervalJson : existing.interval_json,
          rubrik_json: rubrikJson !== undefined ? rubrikJson : existing.rubrik_json,
          deskripsi: input.deskripsi !== undefined ? input.deskripsi : existing.deskripsi,
        },
      });
    } else {
      const id = generateUlid();
      saved = await prisma.kriteriaKetercapaianTp.create({
        data: {
          id,
          sekolah_id: input.sekolah_id,
          tujuan_pembelajaran_id: input.tujuan_pembelajaran_id,
          tipe_kktp: input.tipe_kktp || "SKALA_INTERVAL",
          ambang_tuntas: input.ambang_tuntas ?? 75.0,
          interval_json: intervalJson,
          rubrik_json: rubrikJson,
          deskripsi: input.deskripsi || null,
        },
      });
    }

    return {
      id: saved.id,
      sekolah_id: saved.sekolah_id,
      tujuan_pembelajaran_id: saved.tujuan_pembelajaran_id,
      tipe_kktp: saved.tipe_kktp as any,
      ambang_tuntas: saved.ambang_tuntas,
      interval_data: saved.interval_json ? JSON.parse(saved.interval_json) : null,
      rubrik_data: saved.rubrik_json ? JSON.parse(saved.rubrik_json) : null,
      deskripsi: saved.deskripsi,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    };
  }

  // ==========================================
  // CURRICULUM LINEAGE QUERY
  // ==========================================

  async getCurriculumLineage(
    sekolahId: string,
    mataPelajaranId: string,
    penugasanMengajarId?: string
  ): Promise<CurriculumLineageNodeDTO[]> {
    const lmWhere: any = { sekolah_id: sekolahId };
    if (penugasanMengajarId) {
      lmWhere.penugasan_mengajar_id = penugasanMengajarId;
    } else {
      lmWhere.penugasan_mengajar = { mata_pelajaran_id: mataPelajaranId };
    }

    const lingkupMateriList = await prisma.lingkupMateri.findMany({
      where: lmWhere,
      include: {
        tujuan_pembelajaran: {
          include: {
            capaian_pembelajaran: {
              include: { fase: true, mata_pelajaran: true },
            },
            kriteria_ketercapaian: true,
          },
          orderBy: { urutan: "asc" },
        },
      },
      orderBy: { urutan: "asc" },
    });

    const nodes: CurriculumLineageNodeDTO[] = [];

    for (const lm of lingkupMateriList) {
      for (const tp of lm.tujuan_pembelajaran) {
        const cpDto = tp.capaian_pembelajaran
          ? {
              id: tp.capaian_pembelajaran.id,
              sekolah_id: tp.capaian_pembelajaran.sekolah_id,
              mata_pelajaran_id: tp.capaian_pembelajaran.mata_pelajaran_id,
              mata_pelajaran_nama: tp.capaian_pembelajaran.mata_pelajaran.nama,
              mata_pelajaran_kode: tp.capaian_pembelajaran.mata_pelajaran.kode,
              fase_id: tp.capaian_pembelajaran.fase_id,
              fase_nama: tp.capaian_pembelajaran.fase.nama,
              fase_kode: tp.capaian_pembelajaran.fase.kode,
              kode: tp.capaian_pembelajaran.kode,
              elemen: tp.capaian_pembelajaran.elemen,
              deskripsi: tp.capaian_pembelajaran.deskripsi,
              urutan: tp.capaian_pembelajaran.urutan,
              status: tp.capaian_pembelajaran.status as any,
              created_at: tp.capaian_pembelajaran.created_at,
              updated_at: tp.capaian_pembelajaran.updated_at,
            }
          : null;

        const kktpDto = tp.kriteria_ketercapaian
          ? {
              id: tp.kriteria_ketercapaian.id,
              sekolah_id: tp.kriteria_ketercapaian.sekolah_id,
              tujuan_pembelajaran_id: tp.kriteria_ketercapaian.tujuan_pembelajaran_id,
              tipe_kktp: tp.kriteria_ketercapaian.tipe_kktp as any,
              ambang_tuntas: tp.kriteria_ketercapaian.ambang_tuntas,
              interval_data: tp.kriteria_ketercapaian.interval_json
                ? JSON.parse(tp.kriteria_ketercapaian.interval_json)
                : null,
              rubrik_data: tp.kriteria_ketercapaian.rubrik_json
                ? JSON.parse(tp.kriteria_ketercapaian.rubrik_json)
                : null,
              deskripsi: tp.kriteria_ketercapaian.deskripsi,
              created_at: tp.kriteria_ketercapaian.created_at,
              updated_at: tp.kriteria_ketercapaian.updated_at,
            }
          : null;

        nodes.push({
          cp: cpDto,
          lingkup_materi: {
            id: lm.id,
            kode: lm.kode,
            judul: lm.judul,
            urutan: lm.urutan,
          },
          tp: {
            id: tp.id,
            sekolah_id: tp.sekolah_id,
            lingkup_materi_id: tp.lingkup_materi_id,
            capaian_pembelajaran_id: tp.capaian_pembelajaran_id,
            kode: tp.kode,
            deskripsi: tp.deskripsi,
            urutan: tp.urutan,
            status: tp.status as any,
            created_at: tp.created_at,
            updated_at: tp.updated_at,
            kriteria_ketercapaian: kktpDto,
            capaian_pembelajaran: cpDto,
          },
          kktp: kktpDto,
        });
      }
    }

    return nodes;
  }

  // ==========================================
  // MATERI PEMBELAJARAN
  // ==========================================

  async createMateri(input: CreateMateriInput): Promise<MateriPembelajaranDTO> {
    const materiId = generateUlid();

    const created = await prisma.$transaction(async (tx) => {
      const m = await tx.materiPembelajaran.create({
        data: {
          id: materiId,
          sekolah_id: input.sekolah_id,
          guru_id: input.guru_id,
          lingkup_materi_id: input.lingkup_materi_id || null,
          mata_pelajaran_id: input.mata_pelajaran_id || null,
          judul: input.judul,
          deskripsi: input.deskripsi || null,
          tipe_konten: input.tipe_konten || "DOKUMEN",
          konten_teks: input.konten_teks || null,
          tautan_url: input.tautan_url || null,
          berkas_id: input.berkas_id || null,
          status: input.publish_langsung ? "PUBLISHED" : "DRAFT",
        },
        include: {
          lingkup_materi: true,
          mata_pelajaran: true,
        },
      });

      // Jika publish langsung, buat relasi PublikasiMateri
      if (input.publish_langsung) {
        const publikasiId = generateUlid();
        await tx.publikasiMateri.create({
          data: {
            id: publikasiId,
            sekolah_id: input.sekolah_id,
            materi_id: materiId,
            penugasan_mengajar_id: input.penugasan_mengajar_id,
            status: "DITERBITKAN",
          },
        });
      }

      return m;
    });

    return {
      id: created.id,
      sekolah_id: created.sekolah_id,
      guru_id: created.guru_id,
      lingkup_materi_id: created.lingkup_materi_id,
      lingkup_materi_judul: created.lingkup_materi?.judul || null,
      mata_pelajaran_id: created.mata_pelajaran_id,
      mata_pelajaran_nama: created.mata_pelajaran?.nama || null,
      judul: created.judul,
      deskripsi: created.deskripsi,
      tipe_konten: created.tipe_konten as any,
      konten_teks: created.konten_teks,
      tautan_url: created.tautan_url,
      berkas_id: created.berkas_id,
      status: created.status as any,
      created_at: created.created_at,
      updated_at: created.updated_at,
      is_published: input.publish_langsung,
    };
  }

  async updateMateri(
    id: string,
    input: UpdateMateriInput,
    sekolahId?: string
  ): Promise<MateriPembelajaranDTO> {
    const existing = await prisma.materiPembelajaran.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Materi pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    const updated = await prisma.materiPembelajaran.update({
      where: { id },
      data: {
        lingkup_materi_id: input.lingkup_materi_id,
        judul: input.judul,
        deskripsi: input.deskripsi,
        tipe_konten: input.tipe_konten,
        konten_teks: input.konten_teks,
        tautan_url: input.tautan_url,
        berkas_id: input.berkas_id,
        status: input.status,
      },
      include: {
        lingkup_materi: true,
        mata_pelajaran: true,
      },
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      guru_id: updated.guru_id,
      lingkup_materi_id: updated.lingkup_materi_id,
      lingkup_materi_judul: updated.lingkup_materi?.judul || null,
      mata_pelajaran_id: updated.mata_pelajaran_id,
      mata_pelajaran_nama: updated.mata_pelajaran?.nama || null,
      judul: updated.judul,
      deskripsi: updated.deskripsi,
      tipe_konten: updated.tipe_konten as any,
      konten_teks: updated.konten_teks,
      tautan_url: updated.tautan_url,
      berkas_id: updated.berkas_id,
      status: updated.status as any,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }

  async deleteMateri(id: string, sekolahId?: string): Promise<void> {
    const existing = await prisma.materiPembelajaran.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Materi pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    await prisma.materiPembelajaran.delete({
      where: { id },
    });
  }

  // ==========================================
  // TUGAS PEMBELAJARAN
  // ==========================================

  async createTugas(input: CreateTugasInput): Promise<DefinisiTugasDTO> {
    const tugasId = generateUlid();
    const publikasiId = generateUlid();

    const created = await prisma.$transaction(async (tx) => {
      const t = await tx.definisiTugas.create({
        data: {
          id: tugasId,
          sekolah_id: input.sekolah_id,
          guru_id: input.guru_id,
          lingkup_materi_id: input.lingkup_materi_id || null,
          mata_pelajaran_id: input.mata_pelajaran_id || null,
          judul: input.judul,
          petunjuk: input.petunjuk,
          tipe_penyerahan: input.tipe_penyerahan || "FILE",
          berkas_id: input.berkas_id || null,
          status: "PUBLISHED",
        },
        include: {
          lingkup_materi: true,
          mata_pelajaran: true,
        },
      });

      const pub = await tx.publikasiTugas.create({
        data: {
          id: publikasiId,
          sekolah_id: input.sekolah_id,
          tugas_id: tugasId,
          penugasan_mengajar_id: input.penugasan_mengajar_id,
          tanggal_mulai: input.tanggal_mulai ? new Date(input.tanggal_mulai) : new Date(),
          batas_waktu: input.batas_waktu ? new Date(input.batas_waktu) : null,
          izinkan_terlambat: input.izinkan_terlambat || false,
          status: "DITERBITKAN",
        },
      });

      return { t, pub };
    });

    return {
      id: created.t.id,
      sekolah_id: created.t.sekolah_id,
      guru_id: created.t.guru_id,
      lingkup_materi_id: created.t.lingkup_materi_id,
      lingkup_materi_judul: created.t.lingkup_materi?.judul || null,
      mata_pelajaran_id: created.t.mata_pelajaran_id,
      mata_pelajaran_nama: created.t.mata_pelajaran?.nama || null,
      judul: created.t.judul,
      petunjuk: created.t.petunjuk,
      tipe_penyerahan: created.t.tipe_penyerahan as any,
      berkas_id: created.t.berkas_id,
      status: created.t.status as any,
      created_at: created.t.created_at,
      updated_at: created.t.updated_at,
    };
  }

  async deleteTugas(id: string, sekolahId?: string): Promise<void> {
    const existing = await prisma.definisiTugas.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Tugas dengan ID '${id}' tidak ditemukan.`);
    }

    await prisma.definisiTugas.delete({
      where: { id },
    });
  }

  // ==========================================
  // ADMINISTRASI PEMBELAJARAN (JURNAL KBM)
  // ==========================================

  async createAdministrasi(input: CreateAdministrasiInput): Promise<AdministrasiPembelajaranDTO> {
    const id = generateUlid();

    const created = await prisma.$transaction(async (tx) => {
      const adm = await tx.administrasiPembelajaran.create({
        data: {
          id,
          sekolah_id: input.sekolah_id,
          penugasan_mengajar_id: input.penugasan_mengajar_id,
          sesi_kelas_aktual_id: input.sesi_kelas_aktual_id || null,
          guru_id: input.guru_id,
          tanggal: new Date(input.tanggal),
          pertemuan_ke: input.pertemuan_ke,
          materi_disampaikan: input.materi_disampaikan,
          kegiatan_pembelajaran: input.kegiatan_pembelajaran || null,
          catatan_refleksi: input.catatan_refleksi || null,
          status_realisasi: input.status_realisasi || "TERLAKSANA",
        },
        include: {
          guru: true,
        },
      });

      if (input.tp_ids && input.tp_ids.length > 0) {
        for (const tpId of input.tp_ids) {
          await tx.administrasiTujuanPembelajaran.create({
            data: {
              id: generateUlid(),
              administrasi_id: id,
              tp_id: tpId,
            },
          });
        }
      }

      return adm;
    });

    return {
      id: created.id,
      sekolah_id: created.sekolah_id,
      penugasan_mengajar_id: created.penugasan_mengajar_id,
      sesi_kelas_aktual_id: created.sesi_kelas_aktual_id,
      guru_id: created.guru_id,
      guru_nama: created.guru.nama_lengkap,
      tanggal: created.tanggal,
      pertemuan_ke: created.pertemuan_ke,
      materi_disampaikan: created.materi_disampaikan,
      kegiatan_pembelajaran: created.kegiatan_pembelajaran,
      catatan_refleksi: created.catatan_refleksi,
      status_realisasi: created.status_realisasi as any,
      created_at: created.created_at,
      updated_at: created.updated_at,
      tp_ids: input.tp_ids,
    };
  }

  async updateAdministrasi(
    id: string,
    input: UpdateAdministrasiInput,
    sekolahId?: string
  ): Promise<AdministrasiPembelajaranDTO> {
    const existing = await prisma.administrasiPembelajaran.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Administrasi pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const adm = await tx.administrasiPembelajaran.update({
        where: { id },
        data: {
          tanggal: input.tanggal ? new Date(input.tanggal) : undefined,
          pertemuan_ke: input.pertemuan_ke,
          materi_disampaikan: input.materi_disampaikan,
          kegiatan_pembelajaran: input.kegiatan_pembelajaran,
          catatan_refleksi: input.catatan_refleksi,
          status_realisasi: input.status_realisasi,
        },
        include: {
          guru: true,
        },
      });

      if (input.tp_ids !== undefined) {
        await tx.administrasiTujuanPembelajaran.deleteMany({
          where: { administrasi_id: id },
        });

        if (input.tp_ids && input.tp_ids.length > 0) {
          for (const tpId of input.tp_ids) {
            await tx.administrasiTujuanPembelajaran.create({
              data: {
                id: generateUlid(),
                administrasi_id: id,
                tp_id: tpId,
              },
            });
          }
        }
      }

      return adm;
    });

    return {
      id: updated.id,
      sekolah_id: updated.sekolah_id,
      penugasan_mengajar_id: updated.penugasan_mengajar_id,
      sesi_kelas_aktual_id: updated.sesi_kelas_aktual_id,
      guru_id: updated.guru_id,
      guru_nama: updated.guru.nama_lengkap,
      tanggal: updated.tanggal,
      pertemuan_ke: updated.pertemuan_ke,
      materi_disampaikan: updated.materi_disampaikan,
      kegiatan_pembelajaran: updated.kegiatan_pembelajaran,
      catatan_refleksi: updated.catatan_refleksi,
      status_realisasi: updated.status_realisasi as any,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      tp_ids: input.tp_ids,
    };
  }

  async deleteAdministrasi(id: string, sekolahId?: string): Promise<void> {
    const existing = await prisma.administrasiPembelajaran.findFirst({
      where: { id, ...(sekolahId ? { sekolah_id: sekolahId } : {}) },
    });
    if (!existing) {
      throw new Error(`Administrasi pembelajaran dengan ID '${id}' tidak ditemukan.`);
    }

    await prisma.administrasiPembelajaran.delete({
      where: { id },
    });
  }

  /**
   * Mengambil activity feed aktual kelas (materi, tugas baru, tugas kumpul, presensi, penilaian)
   * Dilengkapi tenant isolation dan zero dummy data.
   */
  async getClassActivityFeed(
    penugasanId: string,
    sekolahId: string,
    limit: number = 8
  ): Promise<ClassActivityItemDTO[]> {
    const [materiPubs, tugasPubs, submissions, sesiPresensi, nilaiList] = await Promise.all([
      // 1. Publikasi Materi
      prisma.publikasiMateri.findMany({
        where: {
          penugasan_mengajar_id: penugasanId,
          sekolah_id: sekolahId,
        },
        include: {
          materi: {
            include: {
              guru: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      }),

      // 2. Publikasi Tugas
      prisma.publikasiTugas.findMany({
        where: {
          penugasan_mengajar_id: penugasanId,
          sekolah_id: sekolahId,
        },
        include: {
          tugas: {
            include: {
              guru: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      }),

      // 3. Pengumpulan Tugas oleh Siswa
      prisma.pengumpulanTugas.findMany({
        where: {
          sekolah_id: sekolahId,
          publikasi_tugas: {
            penugasan_mengajar_id: penugasanId,
          },
        },
        include: {
          siswa: true,
          publikasi_tugas: {
            include: {
              tugas: true,
            },
          },
        },
        orderBy: { tanggal_kumpul: "desc" },
        take: limit,
      }),

      // 4. Sesi Presensi / Jurnal KBM
      prisma.sesiKelasAktual.findMany({
        where: {
          sekolah_id: sekolahId,
          penugasan_mengajar_id: penugasanId,
          presensi_siswa: {
            some: {},
          },
        },
        include: {
          guru: true,
          _count: {
            select: { presensi_siswa: true },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      }),

      // 5. Input Nilai Asesmen Siswa
      prisma.nilaiSiswa.findMany({
        where: {
          sekolah_id: sekolahId,
          asesmen: {
            penugasan_mengajar_id: penugasanId,
          },
          nilai_angka: {
            not: null,
          },
        },
        include: {
          siswa: true,
          asesmen: true,
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      }),
    ]);

    const activities: ClassActivityItemDTO[] = [];

    for (const m of materiPubs) {
      activities.push({
        id: `act-mat-${m.id}`,
        tipe: "MATERI",
        judul: `Materi "${m.materi.judul}"`,
        deskripsi: `Materi ${m.materi.tipe_konten.toLowerCase()} telah diterbitkan untuk kelas ini`,
        pelaku_nama: m.materi.guru.nama_lengkap,
        pelaku_peran: "GURU",
        waktu: m.updated_at || m.tanggal_publikasi,
        target_tab: "MATERI",
        referensi_id: m.materi_id,
      });
    }

    for (const t of tugasPubs) {
      activities.push({
        id: `act-tug-${t.id}`,
        tipe: "TUGAS_BARU",
        judul: `Tugas "${t.tugas.judul}"`,
        deskripsi: `Penugasan baru diterbitkan (${t.tugas.tipe_penyerahan.toLowerCase()})`,
        pelaku_nama: t.tugas.guru.nama_lengkap,
        pelaku_peran: "GURU",
        waktu: t.updated_at || t.tanggal_mulai,
        target_tab: "TUGAS",
        referensi_id: t.tugas_id,
      });
    }

    for (const s of submissions) {
      activities.push({
        id: `act-sub-${s.id}`,
        tipe: "TUGAS_KUMPUL",
        judul: `Pengumpulan: "${s.publikasi_tugas.tugas.judul}"`,
        deskripsi: `${s.siswa.nama_lengkap} mengumpulkan tugas (${s.status.toLowerCase()})`,
        pelaku_nama: s.siswa.nama_lengkap,
        pelaku_peran: "SISWA",
        waktu: s.tanggal_kumpul || s.updated_at,
        target_tab: "TUGAS",
        referensi_id: s.id,
      });
    }

    for (const p of sesiPresensi) {
      activities.push({
        id: `act-pres-${p.id}`,
        tipe: "PRESENSI",
        judul: `Presensi Sesi: ${p.topik_pembelajaran || "Pertemuan Kelas"}`,
        deskripsi: `${p._count.presensi_siswa} kehadiran siswa berhasil disimpan dan diverifikasi`,
        pelaku_nama: p.guru?.nama_lengkap || "Guru Pengampu",
        pelaku_peran: "GURU",
        waktu: p.updated_at,
        target_tab: "CATATAN_KELAS",
        referensi_id: p.id,
      });
    }

    for (const n of nilaiList) {
      activities.push({
        id: `act-nil-${n.id}`,
        tipe: "NILAI",
        judul: `Nilai: "${n.asesmen.judul}"`,
        deskripsi: `Nilai tercatat untuk ${n.siswa.nama_lengkap} (Skor: ${n.nilai_angka})`,
        pelaku_nama: "Guru Pengampu",
        pelaku_peran: "GURU",
        waktu: n.updated_at,
        target_tab: "RINGKASAN",
        referensi_id: n.id,
      });
    }

    activities.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
    return activities.slice(0, limit);
  }
}

export const learningRepository = new LearningRepository();
