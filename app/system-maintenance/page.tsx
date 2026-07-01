"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { useSession } from "@/context/SessionContext";
import {
  fetchSystemMaintenanceStatus,
  updateSystemMaintenanceStatus,
  type SystemMaintenanceStatus,
} from "@/lib/api";
import { AlertTriangle, CheckCircle2, Loader2, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function SystemMaintenancePage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { showAlert } = useGlobalAlert();
  const [status, setStatus] = useState<SystemMaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchSystemMaintenanceStatus({ suppressGlobalError: true });
      setStatus(result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat status pemeliharaan sistem.";
      showAlert({ title: "Status Tidak Terbaca", message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!user.isSuperHuman) {
      showAlert({
        title: "Akses Ditolak",
        message: "Anda tidak memiliki akses ke halaman ini.",
        type: "warning",
        onConfirm: () => router.push("/dashboard"),
      });
      return;
    }
    loadStatus();
  }, [isLoading, loadStatus, router, showAlert, user]);

  const setActive = async (nextActive: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await updateSystemMaintenanceStatus(nextActive, { suppressGlobalError: true });
      setStatus(result.data);
      showAlert({
        title: nextActive ? "Pemeliharaan Diaktifkan" : "Pemeliharaan Dinonaktifkan",
        message: result.message,
        type: nextActive ? "warning" : "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Status pemeliharaan gagal diperbarui.";
      showAlert({ title: "Perubahan Gagal", message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isActive = Boolean(status?.is_active);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AppNavbar title="PEMELIHARAAN SISTEM" showBackButton backHref="/dashboard" variant="clean" />

      <section className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Kontrol akses aplikasi</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950">Pemeliharaan Sistem</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Aktifkan mode pemeliharaan saat aplikasi perlu dibatasi sementara. Pesan pengguna memakai template resmi.
            </p>
          </div>
          <Button variant="outline" onClick={loadStatus} disabled={loading || saving} className="h-10 rounded-lg border-slate-200 bg-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${isActive ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {isActive ? <LockKeyhole className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
                <div>
                  <Badge className={`rounded-md border px-2.5 py-1 text-[11px] font-black ${isActive ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {isActive ? "AKTIF" : "NORMAL"}
                  </Badge>
                  <h2 className="mt-3 text-lg font-black text-slate-950">
                    {isActive ? "Akses pengguna sedang dibatasi" : "Aplikasi berjalan normal"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {isActive
                      ? "Mode pemeliharaan sedang aktif. Pengguna umum akan melihat layar pembatasan akses."
                      : "Mode pemeliharaan tidak aktif. Semua pengguna dapat mengakses aplikasi sesuai hak aksesnya."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Template pesan pengguna</p>
              <div>
                <p className="text-sm font-black text-slate-900">{status?.title || "Sistem sedang dalam pemeliharaan"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {status?.message || "Akses sementara dibatasi agar pembaruan dapat berjalan stabil. Silakan kembali beberapa saat lagi."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                disabled={loading || saving || isActive}
                onClick={() => setActive(true)}
                className="h-11 rounded-lg bg-red-700 px-5 font-black text-white hover:bg-red-800"
              >
                {saving && !isActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                Aktifkan Pemeliharaan
              </Button>
              <Button
                type="button"
                disabled={loading || saving || !isActive}
                onClick={() => setActive(false)}
                variant="outline"
                className="h-11 rounded-lg border-emerald-200 bg-white px-5 font-black text-emerald-700 hover:bg-emerald-50"
              >
                {saving && isActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Nonaktifkan
              </Button>
            </div>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Informasi status</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-bold text-slate-400">Terakhir diperbarui</dt>
                <dd className="mt-1 font-semibold text-slate-800">{formatDateTime(status?.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-400">Diaktifkan pada</dt>
                <dd className="mt-1 font-semibold text-slate-800">{formatDateTime(status?.started_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-400">Dinonaktifkan pada</dt>
                <dd className="mt-1 font-semibold text-slate-800">{formatDateTime(status?.ended_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-slate-400">Operator terakhir</dt>
                <dd className="mt-1 break-words font-semibold text-slate-800">{status?.updated_by_email || "-"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}
