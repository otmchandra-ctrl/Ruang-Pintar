/**
 * Ruang Pintar — M07/M11 Student Academic Directory Application Service
 *
 * STAGE UX-04: Student Academic Directory & Academic Health Monitoring
 * Mengumpulkan data terpadu siswa kelas: kehadiran, penyerahan tugas,
 * penguasaan TP, matriks nilai, CBT, dan catatan internal guru.
 */

import { prisma } from "@/shared/infrastructure/database/prisma";
import {
  StudentAcademicDirectoryItemDTO,
  StudentAcademicHealthStatus,
  StudentAttendanceHistoryItem,
  StudentGradeBreakdownItem,
  StudentInternalNoteItem,
  StudentTaskHistoryItem,
  StudentTpMatrixItem,
} from "../domain/student-academic-directory-types";

export class StudentAcademicDirectoryService {
  /**
   * Mengambil direktori akademik seluruh siswa dalam penugasan mengajar
   */
  static async getClassStudentDirectory(
    penugasanId: string,
    sekolahId: string
  ): Promise<StudentAcademicDirectoryItemDTO[]> {
    // 1. Dapatkan detail penugasan rombel dan mapel
    const penugasan = await prisma.penugasanMengajar.findFirst({
      where: {
        id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        rombel: true,
        mata_pelajaran: true,
      },
    });

    if (!penugasan) {
      return [];
    }

    // 2. Ambil penempatan siswa aktif di rombel
    const penempatanList = await prisma.penempatanRombel.findMany({
      where: {
        rombel_id: penugasan.rombel_id,
        sekolah_id: sekolahId,
        status: "AKTIF",
      },
      include: {
        keikutsertaan: {
          include: {
            siswa: {
              include: {
                pengguna: {
                  select: {
                    foto_url: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ nomor_absen: "asc" }, { keikutsertaan: { siswa: { nama_lengkap: "asc" } } }],
    });

    if (penempatanList.length === 0) {
      return [];
    }

    // 3. Ambil data tugas terbit di kelas ini
    const publishedTasks = await prisma.publikasiTugas.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
        status: "DITERBITKAN",
      },
      include: {
        tugas: {
          include: {
            lingkup_materi: true,
          },
        },
        pengumpulan: true,
      },
      orderBy: { created_at: "asc" },
    });

    // 4. Ambil Lingkup Materi dan Tujuan Pembelajaran (TP)
    const lingkupMateriList = await prisma.lingkupMateri.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
        status: "AKTIF",
      },
      include: {
        tujuan_pembelajaran: {
          where: { status: "AKTIF" },
          orderBy: { urutan: "asc" },
        },
      },
      orderBy: { urutan: "asc" },
    });

    const allTps = lingkupMateriList.flatMap((lm) =>
      lm.tujuan_pembelajaran.map((tp) => ({
        id: tp.id,
        kode: tp.kode || `TP-${tp.urutan}`,
        deskripsi: tp.deskripsi,
      }))
    );

    // 5. Ambil Asesmen dan Nilai
    const asesmenList = await prisma.definisiAsesmen.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        nilai_siswa: true,
      },
      orderBy: [{ tanggal_pelaksanaan: "asc" }, { created_at: "asc" }],
    });

    // 6. Ambil Riwayat Presensi Sesi Kelas Aktual
    const sesiKelasList = await prisma.sesiKelasAktual.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        presensi_siswa: true,
      },
      orderBy: { tanggal: "desc" },
    });

    // 7. Ambil Ujian CBT di penugasan ini
    const examsList = await prisma.ujianCbt.findMany({
      where: {
        penugasan_mengajar_id: penugasanId,
        sekolah_id: sekolahId,
      },
      include: {
        sesi_ujian_siswa: {
          include: {
            hasil: true,
          },
        },
      },
    });

    // 8. Ambil Catatan Internal Guru (Catatan Monitoring) di rombel ini
    const rawNotes = await prisma.catatanMonitoring.findMany({
      where: {
        rombel_id: penugasan.rombel_id,
        sekolah_id: sekolahId,
        status: "AKTIF",
      },
      include: {
        penulis: {
          select: {
            id: true,
            nama_lengkap: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // 9. Petakan dan kalkulasikan data untuk setiap siswa
    const directoryItems: StudentAcademicDirectoryItemDTO[] = penempatanList.map((pr) => {
      const siswa = pr.keikutsertaan.siswa;
      const siswaId = siswa.id;

      // --- PRESENSI ---
      let totalHadir = 0;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlpha = 0;
      const presensiDetail: StudentAttendanceHistoryItem[] = [];

      sesiKelasList.forEach((sesi) => {
        const record = sesi.presensi_siswa.find(
          (p) => p.siswa_id === siswaId || p.penempatan_rombel_id === pr.id
        );
        if (record) {
          const status = record.status as "HADIR" | "SAKIT" | "IZIN" | "ALPHA";
          if (status === "HADIR") totalHadir++;
          else if (status === "SAKIT") totalSakit++;
          else if (status === "IZIN") totalIzin++;
          else if (status === "ALPHA") totalAlpha++;

          presensiDetail.push({
            sesi_id: sesi.id,
            tanggal: sesi.tanggal.toISOString(),
            status,
            catatan: record.catatan,
          });
        }
      });

      const totalSesiTercatat = totalHadir + totalSakit + totalIzin + totalAlpha;
      const kehadiranPersen =
        totalSesiTercatat > 0 ? Math.round((totalHadir / totalSesiTercatat) * 100) : 100;

      // --- TUGAS ---
      let tugasSelesai = 0;
      const tugasDetail: StudentTaskHistoryItem[] = publishedTasks.map((pub) => {
        const submission = pub.pengumpulan.find((p) => p.siswa_id === siswaId);
        const isSubmitted = submission && submission.status !== "DRAFT";

        if (isSubmitted) {
          tugasSelesai++;
        }

        return {
          id: pub.tugas_id,
          judul: pub.tugas.judul,
          tp_kode: pub.tugas.lingkup_materi?.kode || null,
          status: isSubmitted ? (submission.status as "DIKUMPULKAN" | "TERLAMBAT") : "BELUM_KUMPUL",
          tanggal_kumpul: submission ? submission.tanggal_kumpul.toISOString() : null,
          catatan_guru: submission?.catatan_guru || null,
        };
      });

      const totalTugas = publishedTasks.length;
      const tugasPersen = totalTugas > 0 ? Math.round((tugasSelesai / totalTugas) * 100) : 100;

      // --- ASESMEN & NILAI ---
      const nilaiDetail: StudentGradeBreakdownItem[] = [];
      let totalScoreSum = 0;
      let gradedCount = 0;

      asesmenList.forEach((asesmen) => {
        const gradeRecord = asesmen.nilai_siswa.find(
          (n) => n.siswa_id === siswaId || n.penempatan_rombel_id === pr.id
        );
        const nilaiAngka = gradeRecord?.nilai_angka ?? null;
        const tercapai = nilaiAngka !== null ? nilaiAngka >= asesmen.kkm_kktp : false;

        if (nilaiAngka !== null) {
          totalScoreSum += nilaiAngka;
          gradedCount++;
        }

        nilaiDetail.push({
          asesmen_id: asesmen.id,
          judul: asesmen.judul,
          kategori: asesmen.kategori,
          nilai: nilaiAngka,
          kkm: asesmen.kkm_kktp,
          tercapai,
        });
      });

      const nilaiRataRata = gradedCount > 0 ? Math.round(totalScoreSum / gradedCount) : 0;

      // --- TP (TUJUAN PEMBELAJARAN) MATRIX ---
      let tpSelesai = 0;
      const tpMatrix: StudentTpMatrixItem[] = allTps.map((tp) => {
        // Cari apakah ada asesmen yang terkait dengan TP ini dan lulus KKM
        const relevantAssessments = asesmenList.filter((a) => a.tp_id === tp.id);
        let tercapai = false;
        let bukti: string | null = null;

        for (const ra of relevantAssessments) {
          const g = ra.nilai_siswa.find(
            (n) => n.siswa_id === siswaId || n.penempatan_rombel_id === pr.id
          );
          if (g && g.nilai_angka !== null && g.nilai_angka >= ra.kkm_kktp) {
            tercapai = true;
            bukti = `${ra.judul} (${g.nilai_angka})`;
            break;
          }
        }

        if (tercapai) {
          tpSelesai++;
        }

        return {
          tp_id: tp.id,
          kode: tp.kode,
          deskripsi: tp.deskripsi,
          tercapai,
          bukti,
        };
      });

      const totalTp = allTps.length;
      const tpPersen = totalTp > 0 ? Math.round((tpSelesai / totalTp) * 100) : 100;

      // --- CBT STATS ---
      let cbtDiikuti = 0;
      let cbtScoreSum = 0;
      examsList.forEach((exam) => {
        const studentSession = exam.sesi_ujian_siswa.find(
          (s) => s.siswa_id === siswaId || s.penempatan_rombel_id === pr.id
        );
        if (studentSession && studentSession.hasil) {
          cbtDiikuti++;
          cbtScoreSum += studentSession.hasil.nilai_akhir || 0;
        }
      });

      const cbtRataRata = cbtDiikuti > 0 ? Math.round(cbtScoreSum / cbtDiikuti) : 0;

      // --- CATATAN INTERNAL GURU ---
      const catatanList: StudentInternalNoteItem[] = rawNotes
        .filter((n) => n.siswa_id === siswaId)
        .map((n) => ({
          id: n.id,
          judul: n.judul,
          isi: n.isi,
          kategori: n.kategori,
          tingkat_urgensi: n.tingkat_urgensi,
          penulis_id: n.penulis_id,
          penulis_nama: n.penulis.nama_lengkap,
          created_at: n.created_at.toISOString(),
        }));

      // --- ACADEMIC HEALTH SCORE (FORMULA RESMI UX-04) ---
      // Red: Kehadiran < 70% OR Tugas < 50%
      // Green: Kehadiran >= 85% AND Tugas >= 80% AND TP >= 75%
      // Yellow: Kehadiran 70-84% OR Tugas 50-79% (atau kondisi perantara)
      const isRed = kehadiranPersen < 70 || tugasPersen < 50;
      const isGreen = kehadiranPersen >= 85 && tugasPersen >= 80 && tpPersen >= 75;

      const healthStatus: StudentAcademicHealthStatus = isRed
        ? "RISIKO_AKADEMIK"
        : isGreen
          ? "AMAN"
          : "PERLU_PERHATIAN";

      return {
        siswa_id: siswaId,
        penempatan_rombel_id: pr.id,
        nama_lengkap: siswa.nama_lengkap,
        nis: siswa.nis,
        nisn: siswa.nisn,
        nomor_absen: pr.nomor_absen,
        jenis_kelamin: (siswa.jenis_kelamin as "L" | "P") || "L",
        foto_url: siswa.pengguna?.foto_url || null,
        rombel_nama: penugasan.rombel.nama,
        health_status: healthStatus,
        kehadiran_persen: kehadiranPersen,
        kehadiran_stats: {
          hadir: totalHadir,
          sakit: totalSakit,
          izin: totalIzin,
          alpha: totalAlpha,
          total: totalSesiTercatat,
        },
        tugas_selesai: tugasSelesai,
        tugas_total: totalTugas,
        tugas_persen: tugasPersen,
        tp_selesai: tpSelesai,
        tp_total: totalTp,
        tp_persen: tpPersen,
        nilai_rata_rata: nilaiRataRata,
        tugas_detail: tugasDetail,
        presensi_detail: presensiDetail,
        nilai_detail: nilaiDetail,
        tp_matrix: tpMatrix,
        cbt_stats: {
          total_ujian: examsList.length,
          diikuti: cbtDiikuti,
          rata_rata: cbtRataRata,
        },
        catatan_list: catatanList,
      };
    });

    return directoryItems;
  }
}
