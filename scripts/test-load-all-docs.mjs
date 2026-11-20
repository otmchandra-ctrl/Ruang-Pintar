import { assessmentService } from "../src/modules/assessment/application/assessment-service.ts";

async function main() {
  const asesmenId = "01M4NQF77NQWP70C3RPWRXJJJ2";
  const sekolahId = "01M2XXYD227F9S3H985FH53GMF";
  const guruId = "01M2XXYD299G35BZDH2NKFCM3P";

  const [kartuSoal, naskahSoal, daftarHadir, pengesahan] = await Promise.all([
    assessmentService.getKartuSoal(asesmenId, sekolahId, guruId, true),
    assessmentService.getNaskahSoal(asesmenId, sekolahId, guruId, true),
    assessmentService.getDaftarHadir(asesmenId, sekolahId, guruId, true),
    assessmentService.getBerkasPengesahan(asesmenId, sekolahId, guruId, true),
  ]);

  console.log("Keys kartuSoal:", Object.keys(kartuSoal || {}));
  console.log("Total kartu:", kartuSoal?.daftar_kartu?.length || kartuSoal?.items?.length);
  console.log("Keys naskahSoal:", Object.keys(naskahSoal || {}));
  console.log("Total naskah butir:", naskahSoal?.daftar_soal?.length || naskahSoal?.items?.length);
  console.log("Keys daftarHadir:", Object.keys(daftarHadir || {}));
  console.log(
    "Total siswa daftar hadir:",
    daftarHadir?.daftar_siswa?.length || daftarHadir?.peserta?.length
  );
  console.log("Keys pengesahan:", Object.keys(pengesahan || {}));
}

main().catch(console.error);
