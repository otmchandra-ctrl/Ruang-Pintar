"use client";

import React from "react";
import {
  KeyRound,
  Trash2,
  UserCog,
  Mail,
  Building2,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Ban,
  Crown,
} from "lucide-react";
import {
  AcademicDataTable,
  DataTableColumn,
  DataTableFilterOption,
} from "@/shared/components/ui/academic-data-table";
import type { PlatformUserAccountItem } from "@/modules/school/application/platform-control-service";
import type { ResetPasswordTarget } from "./platform-control-modals";

interface PlatformUsersDirectoryPanelProps {
  users: PlatformUserAccountItem[];
  onResetPassword: (target: ResetPasswordTarget) => void;
  onDeleteUser: (user: PlatformUserAccountItem) => void;
}

function getStatusBadge(status: string, harusGantiPassword: boolean) {
  if (status === "TERKUNCI") {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
          <Lock className="size-3" />
          Terkunci
        </span>
        {harusGantiPassword && (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Wajib ganti sandi
          </span>
        )}
      </div>
    );
  }
  if (status === "NONAKTIF") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
        <Ban className="size-3" />
        Nonaktif
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
        <CheckCircle2 className="size-3" />
        Aktif
      </span>
      {harusGantiPassword && (
        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
          Wajib ganti sandi
        </span>
      )}
    </div>
  );
}

function formatRoleLabel(role: string) {
  switch (role) {
    case "TEACHER":
      return "Guru / Pengajar";
    case "SCHOOL_STAFF":
      return "Staf / Admin Sekolah";
    case "STUDENT":
      return "Siswa";
    case "GUARDIAN":
      return "Wali Murid";
    default:
      return role;
  }
}

export function PlatformUsersDirectoryPanel({
  users,
  onResetPassword,
  onDeleteUser,
}: PlatformUsersDirectoryPanelProps) {
  const columns: DataTableColumn<PlatformUserAccountItem>[] = [
    {
      key: "nama_lengkap",
      header: "Pengguna & Kredensial",
      sortable: true,
      sortAccessor: (row) => row.nama_lengkap,
      cell: (row) => (
        <div className="space-y-1 min-w-[200px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {row.nama_lengkap}
            </span>
            {row.is_owner && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                <Crown className="size-2.5" />
                Pemilik
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {row.username}
            </span>
            {row.email && (
              <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                <Mail className="size-3 shrink-0" />
                {row.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "peran_dasar",
      header: "Peran",
      sortable: true,
      sortAccessor: (row) => row.peran_dasar,
      cell: (row) => (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            <UserCog className="size-3 text-slate-500" />
            {formatRoleLabel(row.peran_dasar)}
          </span>
          {row.guru_id && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Penugasan ajar: {row.guru_penugasan_count}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "sekolah",
      header: "Tenant / Sekolah",
      sortable: true,
      sortAccessor: (row) => row.sekolah_nama || "",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Building2 className="size-3.5 text-slate-400 shrink-0" />
            <span>{row.sekolah_nama || "Tanpa Tenant"}</span>
          </div>
          {row.sekolah_tipe_lisensi && (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                row.sekolah_tipe_lisensi === "FREEMIUM"
                  ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              }`}
            >
              {row.sekolah_tipe_lisensi}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status_akun",
      header: "Status Akun",
      sortable: true,
      sortAccessor: (row) => row.status_akun,
      cell: (row) => getStatusBadge(row.status_akun, row.harus_ganti_password),
    },
    {
      key: "terakhir_login",
      header: "Aktivitas Login",
      sortable: true,
      sortAccessor: (row) => row.terakhir_login || "",
      cell: (row) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {row.terakhir_login ? (
            new Date(row.terakhir_login).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          ) : (
            <span className="italic text-slate-400 dark:text-slate-500">Belum pernah login</span>
          )}
          {row.percobaan_login_gagal > 0 && (
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
              {row.percobaan_login_gagal}x gagal login
            </div>
          )}
        </div>
      ),
    },
    {
      key: "aksi",
      header: "Kontrol Akun",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() =>
              onResetPassword({
                userId: row.id,
                nama_lengkap: row.nama_lengkap,
                username: row.username,
                email: row.email,
                sekolah_nama: row.sekolah_nama,
              })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold transition cursor-pointer"
          >
            <KeyRound className="size-3.5" />
            <span>Reset Sandi</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteUser(row)}
            title={`Hapus Akun ${row.username}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 text-xs font-bold transition cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Hapus Akun</span>
          </button>
        </div>
      ),
    },
  ];

  const filters: DataTableFilterOption<PlatformUserAccountItem>[] = [
    {
      id: "lisensi",
      label: "Tipe Tenant",
      filterAccessor: (row, val) => row.sekolah_tipe_lisensi === val,
      options: [
        { value: "FREEMIUM", label: "Freemium / Trial" },
        { value: "SEKOLAH", label: "Sekolah Penuh" },
      ],
    },
    {
      id: "peran_dasar",
      label: "Peran Pengguna",
      filterAccessor: (row, val) => row.peran_dasar === val,
      options: [
        { value: "TEACHER", label: "Guru / Pengajar" },
        { value: "SCHOOL_STAFF", label: "Staf / Admin" },
        { value: "STUDENT", label: "Siswa" },
        { value: "GUARDIAN", label: "Wali Murid" },
      ],
    },
    {
      id: "status_akun",
      label: "Status Akun",
      filterAccessor: (row, val) => row.status_akun === val,
      options: [
        { value: "AKTIF", label: "Aktif" },
        { value: "TERKUNCI", label: "Terkunci" },
        { value: "NONAKTIF", label: "Nonaktif" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 px-4 py-3 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldAlert className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Kelola seluruh akun pengguna non-Super Admin lintas sekolah, termasuk{" "}
          <strong>Guru Mandiri (Freemium)</strong> yang lupa kata sandi atau akun uji coba yang
          perlu dibersihkan. Reset kata sandi otomatis membuka akun terkunci dan mencabut sesi lama.
        </p>
      </div>

      <AcademicDataTable<PlatformUserAccountItem>
        data={users}
        columns={columns}
        searchPlaceholder="Cari nama, username, email, atau nama sekolah..."
        searchKeys={["nama_lengkap", "username", "email", "sekolah_nama", (row) => row.peran_dasar]}
        filters={filters}
        exportFilename="ruang-pintar-pengguna-platform"
        emptyStateTitle="Belum Ada Akun Pengguna"
        emptyStateDescription="Belum ada akun guru mandiri, staf sekolah, siswa, atau wali yang cocok dengan filter."
        defaultPageSize={10}
        renderMobileCard={(row) => (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {row.nama_lengkap}
                  </h4>
                  {row.is_owner && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      <Crown className="size-2.5" />
                      Pemilik
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {row.username}
                </p>
                {row.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.email}</p>
                )}
              </div>
              {getStatusBadge(row.status_akun, row.harus_ganti_password)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Peran
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatRoleLabel(row.peran_dasar)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Tenant
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {row.sekolah_nama || "Tanpa Tenant"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onResetPassword({
                    userId: row.id,
                    nama_lengkap: row.nama_lengkap,
                    username: row.username,
                    email: row.email,
                    sekolah_nama: row.sekolah_nama,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold cursor-pointer"
              >
                <KeyRound className="size-3.5" />
                Reset Sandi
              </button>
              <button
                type="button"
                onClick={() => onDeleteUser(row)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Hapus Akun
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
