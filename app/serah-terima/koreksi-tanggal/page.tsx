"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { useSession } from "@/context/SessionContext";
import {
  correctSerahTerimaDate,
  fetchBerkasSerahTerimaList,
  fetchSerahTerimaDateCorrectionHistory,
  type BerkasSerahTerimaItem,
  type SerahTerimaDateCorrectionHistoryItem,
} from "@/lib/api";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

type SerahTerimaGroup = {
  key: string;
  nomorUlok: string;
  cabang: string;
  namaToko: string;
  proyek: string;
  currentDate: string | null;
  totalDenda: number;
  items: BerkasSerahTerimaItem[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value?: string | number | null) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
};

const todayDateInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const groupItems = (items: BerkasSerahTerimaItem[]): SerahTerimaGroup[] => {
  const groups = new Map<string, BerahTerimaAccumulator>();

  items.forEach((item) => {
    const nomorUlok = String(item.toko?.nomor_ulok ?? "").trim() || "-";
    const cabang = String(item.toko?.cabang ?? "").trim() || "-";
    const key = `${nomorUlok}__${cabang}`;
    const existing = groups.get(key) ?? {
      key,
      nomorUlok,
      cabang,
      namaToko: item.toko?.nama_toko || "-",
      proyek: item.toko?.proyek || "-",
      currentDate: item.created_at || null,
      totalDenda: 0,
      items: [],
    };

    existing.items.push(item);
    existing.totalDenda += Number(item.nilai_denda ?? 0);
    if (!existing.currentDate || new Date(item.created_at).getTime() < new Date(existing.currentDate).getTime()) {
      existing.currentDate = item.created_at;
    }
    groups.set(key, existing);
  });

  return Array.from(groups.values()).sort((a, b) => {
    const dateA = a.currentDate ? new Date(a.currentDate).getTime() : 0;
    const dateB = b.currentDate ? new Date(b.currentDate).getTime() : 0;
    return dateB - dateA;
  });
};

type BerahTerimaAccumulator = SerahTerimaGroup;

export default function KoreksiTanggalSerahTerimaPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { showAlert } = useGlobalAlert();
  const [allItems, setAllItems] = useState<BerkasSerahTerimaItem[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tanggalBaru, setTanggalBaru] = useState(todayDateInputValue);
  const [catatan, setCatatan] = useState("");
  const [history, setHistory] = useState<SerahTerimaDateCorrectionHistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const groups = useMemo(() => groupItems(allItems), [allItems]);
  const selectedGroup = useMemo(
    () => groups.find((group) => group.key === selectedKey) ?? groups[0] ?? null,
    [groups, selectedKey]
  );

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) return groups.slice(0, 60);
    return groups.filter((group) => {
      const haystack = [
        group.nomorUlok,
        group.cabang,
        group.namaToko,
        group.proyek,
        ...group.items.map((item) => item.toko?.lingkup_pekerjaan || ""),
      ].join(" ").toUpperCase();
      return haystack.includes(query);
    }).slice(0, 60);
  }, [groups, searchQuery]);

  const loadItems = useCallback(async () => {
    setLoadingData(true);
    try {
      const result = await fetchBerkasSerahTerimaList();
      const data = result.data ?? [];
      setAllItems(data);
      setSelectedKey((current) => {
        const nextGroups = groupItems(data);
        if (current && nextGroups.some((group) => group.key === current)) return current;
        return nextGroups[0]?.key ?? "";
      });
      if (data.length === 0) {
        showAlert({
          title: "Data Kosong",
          message: "Belum ada berkas Serah Terima yang tersedia untuk dikoreksi.",
          type: "info",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data Serah Terima.";
      showAlert({ title: "Data Tidak Terbaca", message, type: "error" });
    } finally {
      setLoadingData(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    const isStoreBranchControlling = user?.roles?.some(role => role.toUpperCase() === "STORE & BRANCH CONTROLLING SPECIALIST");
    if (!user.isSuperHuman && !isStoreBranchControlling) {
      showAlert({
        title: "Akses Ditolak",
        message: "Halaman ini hanya tersedia untuk Super Human dan Store & Branch Controlling Specialist.",
        type: "warning",
        onConfirm: () => router.push("/dashboard"),
      });
      return;
    }
    loadItems();
  }, [isLoading, loadItems, router, showAlert, user]);

  const loadHistory = useCallback(async (group: SerahTerimaGroup | null) => {
    if (!group || group.nomorUlok === "-") {
      setHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const result = await fetchSerahTerimaDateCorrectionHistory(
        {
          nomor_ulok: group.nomorUlok,
          cabang: group.cabang === "-" ? undefined : group.cabang,
        },
        { suppressGlobalError: true }
      );
      setHistory(result.data ?? []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.isSuperHuman) return;
    loadHistory(selectedGroup);
  }, [loadHistory, selectedGroup, user?.isSuperHuman]);

  const submitCorrection = async () => {
    if (!selectedGroup) return;
    setSubmitting(true);
    try {
      const result = await correctSerahTerimaDate(
        {
          nomor_ulok: selectedGroup.nomorUlok,
          cabang: selectedGroup.cabang === "-" ? undefined : selectedGroup.cabang,
          tanggal_serah_terima: tanggalBaru,
          catatan: catatan.trim() || undefined,
        },
        { suppressGlobalError: true }
      );

      const updatedKeys = new Set((result.data.items ?? []).map((item) => item.id));
      setAllItems((previous) => [
        ...previous.filter((item) => !updatedKeys.has(item.id)),
        ...(result.data.items ?? []),
      ]);
      await loadHistory(selectedGroup);
      showAlert({
        title: "Tanggal Diperbarui",
        message: `${result.data.affected_count} berkas diperbarui. Denda sudah dihitung ulang dan PDF terkait sedang dibuat ulang.`,
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tanggal Serah Terima gagal diperbarui.";
      showAlert({ title: "Koreksi Gagal", message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup) {
      showAlert({
        title: "Data Belum Dipilih",
        message: "Pilih salah satu ULOK dari daftar Serah Terima.",
        type: "warning",
      });
      return;
    }
    if (!tanggalBaru) {
      showAlert({
        title: "Tanggal Baru Diperlukan",
        message: "Pilih tanggal Serah Terima yang benar.",
        type: "warning",
      });
      return;
    }

    showAlert({
      title: "Konfirmasi Koreksi Tanggal",
      message: `Tanggal Serah Terima ULOK ${selectedGroup.nomorUlok} akan diubah dari ${formatDate(selectedGroup.currentDate)} menjadi ${formatDate(tanggalBaru)}. Sistem akan menghitung ulang denda dan menjadwalkan pembuatan ulang dokumen terkait.`,
      type: "warning",
      confirmMode: true,
      confirmText: "Proses Koreksi",
      cancelText: "Batalkan",
      onConfirm: submitCorrection,
    });
  };

  const canSubmit = Boolean(user?.isSuperHuman && selectedGroup && tanggalBaru && !submitting && !loadingData);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <AppNavbar title="KOREKSI SERAH TERIMA" showBackButton backHref="/dashboard" showBuildingLogo />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Kontrol dokumen final</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950">Koreksi Tanggal Serah Terima</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Data Serah Terima dimuat otomatis. Pilih ULOK, cek tanggal saat ini, lalu tentukan tanggal pengganti.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadItems}
            disabled={loadingData || submitting}
            className="h-10 rounded-lg border-slate-200 bg-white shadow-sm"
          >
            {loadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700">
                <Database className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-950">Data Serah Terima</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {loadingData ? "Mengambil data dari server..." : `${groups.length.toLocaleString("id-ID")} ULOK tersedia dari ${allItems.length.toLocaleString("id-ID")} berkas.`}
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari ULOK, toko, cabang, proyek, atau scope"
                className="h-10 rounded-lg bg-white pl-9"
              />
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
              <div className="grid min-w-[780px] grid-cols-[150px_1fr_120px_130px_120px] bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>ULOK</span>
                <span>Toko</span>
                <span>Tanggal Saat Ini</span>
                <span className="text-right">Denda</span>
                <span className="text-right">Aksi</span>
              </div>
              {loadingData ? (
                <div className="flex min-h-48 min-w-[780px] items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengambil data Serah Terima...
                </div>
              ) : filteredGroups.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredGroups.map((group) => {
                    const active = selectedGroup?.key === group.key;
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setSelectedKey(group.key)}
                        className={`grid min-w-[780px] grid-cols-[150px_1fr_120px_130px_120px] items-center px-4 py-3 text-left text-sm transition-colors hover:bg-red-50 ${active ? "bg-red-50 shadow-[inset_4px_0_0_#dc2626]" : "bg-white"}`}
                      >
                        <div>
                          <p className="font-bold text-slate-950">{group.nomorUlok}</p>
                          <p className="mt-1 text-xs text-slate-500">{group.cabang}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{group.namaToko}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{group.proyek} · {group.items.map((item) => item.toko?.lingkup_pekerjaan).filter(Boolean).join(", ")}</p>
                        </div>
                        <p className="text-slate-700">{formatDate(group.currentDate)}</p>
                        <p className="text-right font-semibold text-slate-900">{formatCurrency(group.totalDenda)}</p>
                        <div className="text-right">
                          <Badge variant="secondary" className={`rounded-md ${active ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                            {active ? "Dipilih" : `${group.items.length} berkas`}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-48 min-w-[780px] flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-slate-500">
                  <FileText className="h-8 w-8 text-slate-300" />
                  Data Serah Terima tidak ditemukan untuk pencarian ini.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">Tanggal Diubah</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Pastikan perubahan tanggal sudah sesuai dengan dokumen pendukung.</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tanggal saat ini</p>
                    <p className="mt-1 font-bold text-slate-950">{formatDate(selectedGroup?.currentDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Diubah menjadi</p>
                    <p className="mt-1 font-bold text-red-700">{formatDate(tanggalBaru)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal_baru">Tanggal Serah Terima Baru</Label>
                  <Input
                    id="tanggal_baru"
                    type="date"
                    value={tanggalBaru}
                    onChange={(event) => setTanggalBaru(event.target.value)}
                    className="h-10 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan</Label>
                  <Textarea
                    id="catatan"
                    value={catatan}
                    onChange={(event) => setCatatan(event.target.value)}
                    placeholder="Opsional, misalnya dasar koreksi atau nomor referensi."
                    className="min-h-24 rounded-lg bg-white"
                    maxLength={500}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Ringkasan Pilihan</p>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500">ULOK</p>
                  <p className="mt-1 font-semibold text-slate-950">{selectedGroup?.nomorUlok ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Proyek</p>
                  <p className="mt-1 font-semibold text-slate-950">{selectedGroup?.proyek ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Toko</p>
                  <p className="mt-1 font-semibold text-slate-950">{selectedGroup?.namaToko ?? "-"}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Berkas terdampak</span>
                  <Badge variant="secondary" className="rounded-md bg-slate-100 text-slate-700">{selectedGroup?.items.length ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Total denda saat ini</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedGroup?.totalDenda)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Denda dihitung ulang saat disimpan. PDF Serah Terima dan PDF Opname Final dibuat ulang di background.</p>
                </div>
              </div>

              <Button type="submit" disabled={!canSubmit} className="mt-5 h-11 w-full rounded-lg bg-red-700 font-bold text-white hover:bg-red-800">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Simpan Koreksi
              </Button>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-950">Riwayat Koreksi</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Catatan perubahan tanggal untuk ULOK yang dipilih.</p>
                </div>
              </div>

              {loadingHistory ? (
                <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat riwayat...
                </div>
              ) : history.length > 0 ? (
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{item.lingkup_pekerjaan || "Scope"}</p>
                          <p className="mt-1 text-sm font-bold text-slate-950">{formatDate(item.old_created_at)} -&gt; {formatDate(item.new_created_at)}</p>
                        </div>
                        <p className="shrink-0 text-right text-[11px] font-semibold text-slate-500">{formatDate(item.created_at)}</p>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">{item.actor_email || "-"}</p>
                      <p className="mt-2 rounded-md bg-white p-2 text-sm leading-5 text-slate-700">{item.catatan || "Tidak ada catatan."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-500">
                  <History className="mb-2 h-5 w-5 text-slate-300" />
                  Belum ada riwayat koreksi untuk pilihan ini.
                </div>
              )}
            </section>
          </aside>
        </form>
      </section>
    </main>
  );
}
