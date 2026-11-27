import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  clearOfflineSyncStorageForTests,
  enqueueOfflineMutation,
  getOfflineDataCache,
  listOfflineMutations,
  setOfflineDataCache,
} from "@/shared/lib/offline-sync-queue";
import { syncOfflineMutations } from "@/shared/lib/offline-sync-runner";
import * as attendanceActions from "@/app/actions/attendance-actions";
import * as assessmentActions from "@/app/actions/assessment-actions";

vi.mock("@/app/actions/attendance-actions", () => ({
  saveSessionAttendanceAction: vi.fn(),
}));

vi.mock("@/app/actions/assessment-actions", () => ({
  saveAssessmentGradesAction: vi.fn(),
  publishAssessmentAction: vi.fn(),
}));

describe("Offline Sync Queue & Runner", () => {
  beforeEach(async () => {
    await clearOfflineSyncStorageForTests();
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  it("melakukan coalesce mutasi offline pada key yang sama agar tidak duplikat", async () => {
    await enqueueOfflineMutation({
      key: "SESSION_ATTENDANCE:sesi-1",
      type: "SESSION_ATTENDANCE",
      label: "Presensi X RPL 1",
      payload: { sesi_kelas_id: "sesi-1", items: [{ siswa_id: "s1", status: "HADIR" }] },
    });

    await enqueueOfflineMutation({
      key: "SESSION_ATTENDANCE:sesi-1",
      type: "SESSION_ATTENDANCE",
      label: "Presensi X RPL 1",
      payload: { sesi_kelas_id: "sesi-1", items: [{ siswa_id: "s1", status: "SAKIT" }] },
    });

    const items = await listOfflineMutations();
    expect(items).toHaveLength(1);
    expect((items[0].payload as { items: Array<{ status: string }> }).items[0].status).toBe(
      "SAKIT"
    );
  });

  it("menyimpan dan membaca cache data offline", async () => {
    await setOfflineDataCache("attendance:sesi-1", { sesi_id: "sesi-1", rombel_nama: "X RPL 1" });
    const cached = await getOfflineDataCache<{ sesi_id: string; rombel_nama: string }>(
      "attendance:sesi-1"
    );
    expect(cached).toEqual({ sesi_id: "sesi-1", rombel_nama: "X RPL 1" });
  });

  it("menjalankan sinkronisasi presensi dan nilai (termasuk publish) saat online", async () => {
    vi.mocked(attendanceActions.saveSessionAttendanceAction).mockResolvedValue({
      success: true,
      message: "OK",
    });
    vi.mocked(assessmentActions.saveAssessmentGradesAction).mockResolvedValue({
      success: true,
      message: "OK",
    });
    vi.mocked(assessmentActions.publishAssessmentAction).mockResolvedValue({
      success: true,
      message: "Published",
    });

    await enqueueOfflineMutation({
      key: "SESSION_ATTENDANCE:sesi-1",
      type: "SESSION_ATTENDANCE",
      label: "Presensi X RPL 1",
      payload: { sesi_kelas_id: "sesi-1", items: [] },
    });

    await enqueueOfflineMutation({
      key: "ASSESSMENT_GRADES:asm-1",
      type: "ASSESSMENT_GRADES",
      label: "Nilai UH 1",
      payload: { asesmen_id: "asm-1", grades: [] },
      meta: { penugasanId: "tgs-1", shouldPublish: true },
    });

    const res = await syncOfflineMutations();
    expect(res.syncedCount).toBe(2);
    expect(res.failedCount).toBe(0);
    expect(res.remainingCount).toBe(0);
    expect(attendanceActions.saveSessionAttendanceAction).toHaveBeenCalledTimes(1);
    expect(assessmentActions.saveAssessmentGradesAction).toHaveBeenCalledTimes(1);
    expect(assessmentActions.publishAssessmentAction).toHaveBeenCalledWith(
      { asesmen_id: "asm-1", target_audience: "SEMUA" },
      "tgs-1"
    );
  });

  it("mempertahankan item di antrean dengan pesan error jika server menolak", async () => {
    vi.mocked(attendanceActions.saveSessionAttendanceAction).mockResolvedValue({
      success: false,
      message: "Sesi login berakhir",
    });

    await enqueueOfflineMutation({
      key: "SESSION_ATTENDANCE:sesi-2",
      type: "SESSION_ATTENDANCE",
      label: "Presensi X RPL 2",
      payload: { sesi_kelas_id: "sesi-2", items: [] },
    });

    const res = await syncOfflineMutations();
    expect(res.syncedCount).toBe(0);
    expect(res.failedCount).toBe(1);
    expect(res.remainingCount).toBe(1);

    const remaining = await listOfflineMutations();
    expect(remaining[0].retryCount).toBe(1);
    expect(remaining[0].lastError).toBe("Sesi login berakhir");
  });

  it("tidak menjalankan sync ketika perangkat masih offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    await enqueueOfflineMutation({
      key: "SESSION_ATTENDANCE:sesi-3",
      type: "SESSION_ATTENDANCE",
      label: "Presensi X RPL 3",
      payload: { sesi_kelas_id: "sesi-3", items: [] },
    });

    const res = await syncOfflineMutations();
    expect(res.syncedCount).toBe(0);
    expect(res.remainingCount).toBe(1);
    expect(attendanceActions.saveSessionAttendanceAction).not.toHaveBeenCalled();
  });
});
