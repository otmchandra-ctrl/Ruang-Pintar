/**
 * Ruang Pintar — Cetak Kartu Tanda Pelajar (KTS) Standar A4
 * Route: /data-siswa/cetak-kartu
 *
 * Mendukung cetak massal per-rombel atau pilihan siswa terseleksi (ID-1/CR-80).
 */

import React from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { prisma } from "@/shared/infrastructure/database/prisma";
import { studentFacade } from "@/modules/student/application/student-facade";
import {
  StudentCardsPrintView,
  SchoolCardData,
} from "@/modules/student/presentation/print/student-cards-print-view";
import { StudentIdentityDTO } from "@/modules/student/domain/student-types";

export const dynamic = "force-dynamic";

interface CetakKartuPageProps {
  searchParams?: Promise<{
    ids?: string;
    rombelId?: string;
    sekolahId?: string;
  }>;
}

export default async function CetakKartuPage(props: CetakKartuPageProps) {
  const user = await requireAuth();
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const isSuperAdmin = user.peran_dasar === "SUPER_ADMIN";

  const effectiveSekolahId = isSuperAdmin
    ? searchParams?.sekolahId || user.sekolah_id
    : user.sekolah_id;

  if (!effectiveSekolahId) {
    redirect("/data-siswa");
  }

  // 1. Ambil data sekolah
  const school = await prisma.sekolah.findUnique({
    where: { id: effectiveSekolahId },
    select: {
      nama: true,
      npsn: true,
      jenjang: true,
      alamat: true,
      telepon: true,
      email: true,
      logo_url: true,
    },
  });

  if (!school) {
    redirect("/data-siswa");
  }

  // 2. Ambil data kepala sekolah resmi jika ada penugasan jabatan
  let kepsekNama = "Kepala Sekolah";
  let kepsekNip: string | null = null;

  try {
    const kepsekJabatan = await prisma.jabatan.findFirst({
      where: {
        sekolah_id: effectiveSekolahId,
        kode_jabatan: { in: ["KEPALA_SEKOLAH", "HEADMASTER"] },
      },
      include: {
        penugasan: {
          where: { status: "AKTIF" },
        },
      },
    });

    if (kepsekJabatan?.penugasan[0]) {
      const personilUser = await prisma.pengguna.findUnique({
        where: { id: kepsekJabatan.penugasan[0].personil_id },
        include: {
          guru: true,
        },
      });
      if (personilUser) {
        kepsekNama = personilUser.nama_lengkap;
        kepsekNip = personilUser.guru?.nip || null;
      }
    }
  } catch {
    // Graceful fallback jika belum ada penugasan kepsek terdaftar
  }

  // 3. Ambil daftar siswa via StudentFacade
  const filterRombelId = searchParams?.rombelId;
  const selectedIds = searchParams?.ids
    ? searchParams.ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const dataset = await studentFacade.getStudentManagementData(effectiveSekolahId, {
    rombelId: filterRombelId,
    studentStatus: "AKTIF",
  });

  let filteredStudents: StudentIdentityDTO[] = dataset.students;
  if (selectedIds.length > 0) {
    const idSet = new Set(selectedIds);
    filteredStudents = dataset.students.filter((s: StudentIdentityDTO) => idSet.has(s.id));
  }

  // Dapatkan nama rombel jika difilter
  let rombelNama: string | undefined;
  if (filterRombelId) {
    const matchedRombel = dataset.rombels.find((r) => r.id === filterRombelId);
    rombelNama = matchedRombel?.nama;
  }

  const schoolCardData: SchoolCardData = {
    nama: school.nama,
    npsn: school.npsn,
    jenjang: school.jenjang,
    alamat: school.alamat,
    telepon: school.telepon,
    email: school.email,
    logo_url: school.logo_url,
    kota: "Sekolah",
    kepala_sekolah_nama: kepsekNama,
    kepala_sekolah_nip: kepsekNip,
  };

  return (
    <StudentCardsPrintView
      students={filteredStudents}
      school={schoolCardData}
      rombelNama={rombelNama}
    />
  );
}
