"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAuth } from "@/shared/infrastructure/auth/auth-guard";
import { SchoolDomainError } from "@/modules/school/domain/school-errors";
import {
  platformControlService,
  ResetPlatformUserPasswordResult,
} from "@/modules/school/application/platform-control-service";

export type PlatformActionResponse<T = unknown> =
  { success: true; data: T; message: string } | { success: false; error: string; code: string };

async function getRequestMeta() {
  try {
    const h = await headers();
    return {
      ipAddress:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1",
      userAgent: h.get("user-agent") || "Platform-Admin-Action",
    };
  } catch {
    return { ipAddress: "127.0.0.1", userAgent: "Platform-Admin-Action" };
  }
}

function mapActionError(error: unknown): PlatformActionResponse<never> {
  if (error instanceof SchoolDomainError) {
    return { success: false, error: error.message, code: error.code };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    code: "INTERNAL_ERROR",
  };
}

export async function resetPlatformUserPasswordAction(
  targetUserId: string,
  customPassword?: string
): Promise<PlatformActionResponse<ResetPlatformUserPasswordResult>> {
  try {
    const actor = await requireAuth();
    const meta = await getRequestMeta();

    const data = await platformControlService.resetPlatformUserPassword({
      targetUserId,
      customPassword,
      actorId: actor.id,
      actorRole: actor.peran_dasar,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidatePath("/sekolah");
    revalidatePath("/dashboard");

    return {
      success: true,
      data,
      message: `Kata sandi untuk ${data.nama_lengkap} (${data.username}) berhasil di-reset.`,
    };
  } catch (error) {
    return mapActionError(error);
  }
}

export async function deleteFreemiumTenantAction(
  sekolahId: string,
  confirmName: string
): Promise<
  PlatformActionResponse<{ deletedSekolahId: string; nama: string; deletedUsersCount: number }>
> {
  try {
    const actor = await requireAuth();
    const meta = await getRequestMeta();

    const data = await platformControlService.deleteFreemiumTenant({
      sekolahId,
      confirmName,
      actorId: actor.id,
      actorRole: actor.peran_dasar,
      actorActiveSekolahId: actor.sekolah_id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidatePath("/sekolah");
    revalidatePath("/dashboard");

    return {
      success: true,
      data,
      message: `Tenant trial "${data.nama}" berhasil dihapus permanen (${data.deletedUsersCount} akun eksklusif dibersihkan).`,
    };
  } catch (error) {
    return mapActionError(error);
  }
}

export async function deletePlatformUserAction(
  targetUserId: string
): Promise<
  PlatformActionResponse<{ deletedUserId: string; username: string; nama_lengkap: string }>
> {
  try {
    const actor = await requireAuth();
    const meta = await getRequestMeta();

    const data = await platformControlService.deletePlatformUser({
      targetUserId,
      actorId: actor.id,
      actorRole: actor.peran_dasar,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidatePath("/sekolah");
    revalidatePath("/dashboard");

    return {
      success: true,
      data,
      message: `Akun pengguna ${data.nama_lengkap} (${data.username}) berhasil dihapus permanen.`,
    };
  } catch (error) {
    return mapActionError(error);
  }
}
