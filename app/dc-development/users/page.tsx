"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import {
  DC_BUILDING_DEVELOPMENT_MANAGER_ROLE,
  DC_BUILDING_DEVELOPMENT_SPECIALIST_ROLE,
  DC_CONTRACTOR_ROLE,
  DC_DOCUMENT_ADMIN_ROLE,
  DC_PLANNER_CONSULTANT_ROLE,
  DC_SOIL_CONSULTANT_ROLE,
  DC_SUPERVISOR_MK_ROLE,
  BUILDING_DEVELOPMENT_GM_ROLE,
  BRANCH_TO_ULOK,
  LOCATION_DEVELOPMENT_GM_ROLE,
  PROPERTY_DEVELOPMENT_DIRECTOR_ROLE,
  SUPER_HUMAN_ROLE,
} from "@/lib/constants";
import { createUserCabang, deleteUserCabang, fetchUserCabangList, updateUserCabang } from "@/lib/api";

const DC_ROLE_OPTIONS = [
  DC_DOCUMENT_ADMIN_ROLE,
  DC_BUILDING_DEVELOPMENT_SPECIALIST_ROLE,
  DC_BUILDING_DEVELOPMENT_MANAGER_ROLE,
  BUILDING_DEVELOPMENT_GM_ROLE,
  LOCATION_DEVELOPMENT_GM_ROLE,
  PROPERTY_DEVELOPMENT_DIRECTOR_ROLE,
  DC_SOIL_CONSULTANT_ROLE,
  DC_PLANNER_CONSULTANT_ROLE,
  DC_SUPERVISOR_MK_ROLE,
  DC_CONTRACTOR_ROLE,
  SUPER_HUMAN_ROLE,
];

type DcUser = {
  id: number;
  cabang: string;
  email_sat: string;
  nama_lengkap: string | null;
  jabatan: string | null;
  nama_pt: string | null;
};

type FormState = {
  cabang: string;
  email_sat: string;
  nama_lengkap: string;
  jabatan: string;
  nama_pt: string;
};

const emptyForm: FormState = {
  cabang: "HEAD OFFICE",
  email_sat: "",
  nama_lengkap: "",
  jabatan: DC_DOCUMENT_ADMIN_ROLE,
  nama_pt: "PT Sumber Alfaria Trijaya Tbk",
};

export default function DcUserManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [users, setUsers] = useState<DcUser[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DcUser | null>(null);

  const canManage = Boolean(user?.isSuperHuman);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const loadUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetchUserCabangList({
        workspace: "dc",
        search: search.trim() || undefined,
        cabang: branchFilter || undefined,
        jabatan: roleFilter || undefined,
      });
      setUsers(res.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memuat user DC.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [branchFilter, roleFilter, search]);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.isSuperHuman) {
      router.replace("/dc-development");
      return;
    }
    loadUsers();
  }, [isLoading, loadUsers, router, user?.isSuperHuman]);

  const branchOptions = useMemo(() => {
    const branches = users.map((item) => item.cabang).filter(Boolean);
    return Array.from(new Set(["HEAD OFFICE", ...Object.keys(BRANCH_TO_ULOK), ...branches])).sort();
  }, [users]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: DcUser) => {
    setEditingId(item.id);
    setForm({
      cabang: item.cabang || "HEAD OFFICE",
      email_sat: item.email_sat || "",
      nama_lengkap: item.nama_lengkap || "",
      jabatan: item.jabatan || DC_DOCUMENT_ADMIN_ROLE,
      nama_pt: item.nama_pt || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!canManage) return;
    if (!form.email_sat.trim() || !form.jabatan.trim() || !form.cabang.trim()) {
      showToast("Cabang, email, dan role wajib diisi.", "error");
      return;
    }
    if (form.jabatan === DC_DOCUMENT_ADMIN_ROLE && form.cabang.trim().toUpperCase() !== "HEAD OFFICE") {
      showToast("DC Document Admin wajib memakai cabang HEAD OFFICE.", "error");
      return;
    }

    setProcessing(true);
    try {
      const payload = { ...form, workspace: "dc" as const };
      if (editingId) {
        await updateUserCabang(editingId, payload);
        showToast("User DC berhasil diperbarui.", "success");
      } else {
        await createUserCabang(payload);
        showToast("User DC berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      await loadUsers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan user DC.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      await deleteUserCabang(deleteTarget.id);
      showToast("User DC berhasil dihapus.", "success");
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus user DC.", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Memuat sesi...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3f7] text-slate-900 [font-family:var(--font-sans)]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${
          toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {toast.message}
        </div>
      )}

      <header className="sticky top-0 z-30 bg-[#d60010] shadow-md">
        <div className="mx-auto flex h-[86px] max-w-[1380px] items-center gap-5 px-5 md:px-8">
          <Link href="/dc-development" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15" title="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Image src="/assets/Alfamart-Emblem.png" alt="Alfamart" width={94} height={42} className="h-[42px] w-auto drop-shadow-md" priority />
          <div className="h-9 w-px bg-white/30" />
          <h1 className="truncate text-xl font-semibold tracking-wide text-white md:text-[24px]">Manajemen User DC</h1>
          <Button onClick={loadUsers} className="ml-auto hidden rounded-xl border border-white/25 bg-white/10 font-medium text-white hover:bg-white hover:text-red-700 md:inline-flex">
            <RefreshCw className={loadingData ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-4 py-6 md:px-8">
        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <UserCog className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold leading-tight text-slate-950">Manajemen User DC</h2>
                <p className="mt-1 text-sm font-normal text-slate-500">Kelola akun dan akses khusus workspace DC Development</p>
              </div>
            </div>
            <Button className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </div>
        </section>

        <section className="mt-5 rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              className="relative flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                loadUsers();
              }}
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, email, cabang, atau jabatan..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </form>
            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 lg:w-48"
            >
              <option value="">Semua Cabang</option>
              {branchOptions.map((branch) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 lg:w-56"
            >
              <option value="">Semua Jabatan</option>
              {DC_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-5" onClick={loadUsers}>
              Cari
            </Button>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User Info</th>
                  <th className="px-6 py-4 font-semibold">Jabatan & PT</th>
                  <th className="px-6 py-4 font-semibold">Cabang</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingData ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                      Memuat user DC...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada user DC.</td>
                  </tr>
                ) : users.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-950">{(item.nama_lengkap || "-").toUpperCase()}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.email_sat}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.jabatan || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.nama_pt || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {item.cabang || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-amber-200 bg-amber-50 p-0 text-amber-600 hover:bg-amber-100" onClick={() => openEdit(item)} title="Edit user">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-red-200 bg-red-50 p-0 text-red-600 hover:bg-red-100" onClick={() => setDeleteTarget(item)} title="Hapus user">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[492px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-6">
              <h2 className="text-xl font-semibold text-slate-950">{editingId ? "Edit User DC" : "Tambah User DC"}</h2>
              <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => setFormOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-8">
              <Field label="Cabang *">
                <select value={form.cabang} onChange={(event) => setForm({ ...form, cabang: event.target.value })} className="dc-input">
                  <option value="">-- Pilih Cabang --</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </Field>
              <Field label="Email SAT *">
                <input type="email" value={form.email_sat} onChange={(event) => setForm({ ...form, email_sat: event.target.value })} placeholder="contoh@alfamart.co.id" className="dc-input" />
              </Field>
              <Field label="Nama Lengkap">
                <input value={form.nama_lengkap} onChange={(event) => setForm({ ...form, nama_lengkap: event.target.value })} placeholder="Masukkan nama lengkap" className="dc-input" />
              </Field>
              <Field label="Jabatan">
                <select value={form.jabatan} onChange={(event) => setForm({ ...form, jabatan: event.target.value, cabang: event.target.value === DC_DOCUMENT_ADMIN_ROLE ? "HEAD OFFICE" : form.cabang })} className="dc-input">
                  <option value="">-- Pilih Jabatan --</option>
                  {DC_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nama PT">
                <input value={form.nama_pt} onChange={(event) => setForm({ ...form, nama_pt: event.target.value })} placeholder="Misal: PT Sumber Alfaria Trijaya Tbk" className="dc-input" />
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
              <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white px-5 font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button className="h-10 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700" onClick={handleSave} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950">Hapus user DC?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              User {deleteTarget.nama_lengkap || deleteTarget.email_sat} akan dihapus dari daftar user cabang.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button className="rounded-xl bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .dc-input {
          height: 46px;
          width: 100%;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0 12px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
        }
        .dc-input::placeholder {
          color: #8b96a8;
        }
        .dc-input:focus {
          border-color: #93c5fd;
          background: white;
          box-shadow: 0 0 0 4px #eff6ff;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
