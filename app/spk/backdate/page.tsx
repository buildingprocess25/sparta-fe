"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { useSession } from "@/context/SessionContext";
import {
  fetchSpkBackdatePolicy,
  updateSpkBackdatePolicyBranches,
  type SpkBackdatePolicyBranch,
} from "@/lib/api";
import { BRANCH_TO_ULOK, normalizeBranchValue } from "@/lib/constants";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

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

const buildBranchOptions = (policyRows: SpkBackdatePolicyBranch[]) =>
  Array.from(
    new Set([
      ...Object.keys(BRANCH_TO_ULOK),
      ...policyRows.map((row) => row.branch_name),
    ].map(normalizeBranchValue).filter(Boolean))
  ).sort();

export default function SpkBackdatePolicyPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { showAlert } = useGlobalAlert();
  const [policyRows, setPolicyRows] = useState<SpkBackdatePolicyBranch[]>([]);
  const [enabledBranches, setEnabledBranches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const branchOptions = useMemo(() => buildBranchOptions(policyRows), [policyRows]);
  const enabledSet = useMemo(() => new Set(enabledBranches.map(normalizeBranchValue)), [enabledBranches]);
  const latestUpdate = useMemo(() => {
    const enabledRows = policyRows.filter((row) => row.is_enabled);
    return enabledRows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  }, [policyRows]);

  const filteredBranches = useMemo(() => {
    const query = normalizeBranchValue(searchQuery);
    if (!query) return branchOptions;
    return branchOptions.filter((branch) => branch.includes(query));
  }, [branchOptions, searchQuery]);

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchSpkBackdatePolicy({ suppressGlobalError: true });
      setPolicyRows(result.data.branches ?? []);
      setEnabledBranches((result.data.enabled_branches ?? []).map(normalizeBranchValue));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat policy backdate SPK.";
      showAlert({ title: "Policy Tidak Terbaca", message, type: "error" });
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
        message: "Halaman policy backdate SPK hanya tersedia untuk Super Human.",
        type: "warning",
        onConfirm: () => router.push("/dashboard"),
      });
      return;
    }
    loadPolicy();
  }, [isLoading, loadPolicy, router, showAlert, user]);

  const toggleBranch = (branch: string) => {
    const normalized = normalizeBranchValue(branch);
    setEnabledBranches((current) => {
      const next = new Set(current.map(normalizeBranchValue));
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return Array.from(next).sort();
    });
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const result = await updateSpkBackdatePolicyBranches(enabledBranches, { suppressGlobalError: true });
      setPolicyRows(result.data.branches ?? []);
      setEnabledBranches((result.data.enabled_branches ?? []).map(normalizeBranchValue));
      showAlert({
        title: "Policy Disimpan",
        message: `${result.data.enabled_branches.length} cabang dapat memilih tanggal mulai SPK sebelum hari ini.`,
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Policy backdate SPK gagal disimpan.";
      showAlert({ title: "Simpan Gagal", message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(user?.isSuperHuman && !loading && !saving);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <AppNavbar title="POLICY BACKDATE SPK" showBackButton backHref="/dashboard" showBuildingLogo />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Kontrol tanggal SPK</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950">Policy Backdate SPK</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pilih cabang yang boleh mengisi tanggal mulai pelaksanaan SPK sebelum tanggal hari ini.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadPolicy}
            disabled={loading || saving}
            className="h-10 rounded-lg border-slate-200 bg-white shadow-sm"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-950">Daftar Cabang</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {loading
                    ? "Mengambil policy dari server..."
                    : `${enabledBranches.length.toLocaleString("id-ID")} dari ${branchOptions.length.toLocaleString("id-ID")} cabang aktif.`}
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari cabang"
                className="h-10 rounded-lg bg-white pl-9"
              />
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1fr_110px_120px] bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Cabang</span>
                <span>Kode</span>
                <span className="text-right">Backdate</span>
              </div>
              {loading ? (
                <div className="flex min-h-56 items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat cabang...
                </div>
              ) : filteredBranches.length > 0 ? (
                <div className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
                  {filteredBranches.map((branch) => {
                    const active = enabledSet.has(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        className={`grid w-full grid-cols-[1fr_110px_120px] items-center px-4 py-3 text-left text-sm transition-colors hover:bg-red-50 ${active ? "bg-red-50 shadow-[inset_4px_0_0_#dc2626]" : "bg-white"}`}
                      >
                        <span className="font-bold text-slate-950">{branch}</span>
                        <span className="font-semibold text-slate-500">{BRANCH_TO_ULOK[branch] ?? "-"}</span>
                        <span className="flex justify-end">
                          <span className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${active ? "bg-red-700" : "bg-slate-300"}`}>
                            <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0"}`} />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-40 items-center justify-center px-4 py-8 text-center text-sm text-slate-500">
                  Cabang tidak ditemukan.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">Ringkasan</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Perubahan berlaku untuk form SPK dan validasi backend.</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-500">Cabang aktif</span>
                  <Badge variant="secondary" className="rounded-md bg-red-50 text-red-700">{enabledBranches.length}</Badge>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Update terakhir</p>
                  <p className="mt-1 font-bold text-slate-950">{formatDateTime(latestUpdate?.updated_at)}</p>
                  <p className="mt-1 text-xs text-slate-500">{latestUpdate?.updated_by_email || "Belum ada catatan pengubah."}</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={savePolicy}
                disabled={!canSave}
                className="mt-5 h-11 w-full rounded-lg bg-red-700 font-bold text-white hover:bg-red-800"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Simpan Policy
              </Button>
            </section>

            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Tanggal lampau mengubah tanggal selesai SPK dan dapat memengaruhi timeline serta perhitungan denda. Aktifkan hanya untuk cabang yang memang butuh toleransi input administratif.
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
