"use client";

import React, { useState } from "react";
import {
  X,
  KeyRound,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  resetPlatformUserPasswordAction,
  deleteFreemiumTenantAction,
  deletePlatformUserAction,
} from "@/app/actions/platform-admin-actions";
import type {
  PlatformUserAccountItem,
  ResetPlatformUserPasswordResult,
} from "@/modules/school/application/platform-control-service";

export interface ResetPasswordTarget {
  userId: string;
  nama_lengkap: string;
  username: string;
  email: string | null;
  sekolah_nama?: string | null;
}

interface ResetPlatformPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: ResetPasswordTarget | null;
  onSuccess?: () => void;
}

export function ResetPlatformPasswordModal({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}: ResetPlatformPasswordModalProps) {
  const [customPassword, setCustomPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ResetPlatformUserPasswordResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = customPassword.trim();
    if (trimmed.length > 0 && trimmed.length < 8) {
      setErrorMsg("Kata sandi kustom minimal 8 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPlatformUserPasswordAction(
        targetUser.userId,
        trimmed.length > 0 ? trimmed : undefined
      );
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
      setResult(res.data);
      onSuccess?.();
    } catch {
      setErrorMsg("Gagal menghubungi server saat mereset kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!result) return;
    const text = [
      `Nama: ${result.nama_lengkap}`,
      `Username: ${result.username}`,
      result.email ? `Email: ${result.email}` : null,
      `Password Sementara: ${result.temporaryPassword}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback jika clipboard tidak tersedia
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-modal-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h3
                id="reset-password-modal-title"
                className="text-base font-extrabold text-slate-900 dark:text-white"
              >
                Reset Kata Sandi Pengguna
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemulihan akses langsung oleh Super Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Profil Target */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 space-y-1">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {targetUser.nama_lengkap}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                @{targetUser.username}
              </span>
              {targetUser.email && <span>• {targetUser.email}</span>}
              {targetUser.sekolah_nama && (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  • {targetUser.sekolah_nama}
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="size-4" />
                  <span>Kata Sandi Berhasil Di-reset!</span>
                </div>
                <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
                  Sesi login lama telah dicabut dan akun terbuka. Kirimkan kredensial sementara ini
                  kepada pemilik akun:
                </p>
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 p-3 font-mono text-xs space-y-1 text-slate-800 dark:text-slate-200">
                  <div>
                    Username: <span className="font-bold">{result.username}</span>
                  </div>
                  {result.email && (
                    <div>
                      Email: <span className="font-bold">{result.email}</span>
                    </div>
                  )}
                  <div>
                    Password Sementara:{" "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {result.temporaryPassword}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Kredensial Disalin" : "Salin Kredensial"}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="custom-reset-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Kata Sandi Baru (Opsional)
                </label>
                <input
                  id="custom-reset-password"
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Kosongkan untuk sandi default: Password123#"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Jika dikosongkan, sistem mengatur sandi sementara ke{" "}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    Password123#
                  </span>{" "}
                  dan pengguna wajib menggantinya saat login berikutnya.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  Reset Kata Sandi Sekarang
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export interface DeleteFreemiumTenantTarget {
  id: string;
  nama: string;
  tipe_lisensi: string;
  _count?: {
    siswa: number;
    guru: number;
    rombel: number;
    ujian_cbt: number;
    pengguna: number;
  };
  ownerSummary?: {
    nama_lengkap: string;
    username: string;
    email: string | null;
  } | null;
}

interface DeleteFreemiumTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: DeleteFreemiumTenantTarget | null;
  onSuccess?: () => void;
}

export function DeleteFreemiumTenantModal({
  isOpen,
  onClose,
  school,
  onSuccess,
}: DeleteFreemiumTenantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !school) return null;

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await deleteFreemiumTenantAction(school.id, school.nama.trim());
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setErrorMsg("Gagal menghapus tenant trial dari server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tenant-modal-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h3
                id="delete-tenant-modal-title"
                className="text-base font-extrabold text-rose-950 dark:text-rose-100"
              >
                Hapus Permanen Tenant Trial
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Pembersihan workspace FREEMIUM beserta akun eksklusifnya
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
              <span>Tindakan Ini Tidak Dapat Dibatalkan</span>
            </div>
            <p>
              Seluruh data ruang kerja <strong>{school.nama}</strong> ({school._count?.siswa ?? 0}{" "}
              Siswa, {school._count?.guru ?? 0} Guru, {school._count?.ujian_cbt ?? 0} Ujian CBT)
              serta akun pengguna yang hanya terdaftar di tenant trial ini akan dihapus permanen.
            </p>
            {school.ownerSummary && (
              <p className="font-medium">
                Pemilik Terdaftar: <strong>{school.ownerSummary.nama_lengkap}</strong> (
                {school.ownerSummary.email || `@${school.ownerSummary.username}`})
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              Hapus Tenant Permanen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeletePlatformUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PlatformUserAccountItem | null;
  onSuccess?: () => void;
}

export function DeletePlatformUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: DeletePlatformUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await deletePlatformUserAction(user.id);
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setErrorMsg("Gagal menghapus akun pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h3
                id="delete-user-modal-title"
                className="text-base font-extrabold text-rose-950 dark:text-rose-100"
              >
                Hapus Akun Pengguna
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Penghapusan akun terproteksi safety guard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 space-y-1 text-xs">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {user.nama_lengkap}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              @{user.username} {user.email ? `• ${user.email}` : ""}
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Peran: <strong>{user.peran_dasar}</strong> • Tenant:{" "}
              <strong>{user.sekolah_nama || "Tanpa Tenant"}</strong>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Sistem akan otomatis menolak penghapusan jika akun ini memiliki riwayat penugasan guru
            aktif atau transaksi pembayaran lunas.
            {user.sekolah_tipe_lisensi === "FREEMIUM" &&
              user.is_owner &&
              " Karena akun ini adalah pemilik tenant FREEMIUM, Anda juga dapat menghapus seluruh workspace trial-nya melalui tombol Hapus Trial di Tab Direktori Sekolah."}
          </p>

          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              Hapus Akun Permanen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
