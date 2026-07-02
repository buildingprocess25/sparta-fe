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
  type BerkasSerahTerimaItem,
} from "@/lib/api";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

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
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

export default function KoreksiTanggalSerahTerimaPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { showAlert } = useGlobalAlert();
  const [nomorUlok, setNomorUlok] = useState("");
  const [cabang, setCabang] = useState("");
  const [tanggalBaru, setTanggalBaru] = useState(todayDateInputValue);
  const [catatan, setCatatan] = useState("");
  const [items, setItems] = useState<BerkasSerahTerimaItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!user.isSuperHuman) {
      showAlert({
        title: "Akses Ditolak",
        message: "Halaman ini hanya tersedia untuk akun yang memiliki otorisasi kontrol sistem.",
        type: "warning",
        onConfirm: () => router.push("/dashboard"),
      });
    }
  }, [isLoading, router, showAlert, user]);

  const normalizedUlok = nomorUlok.trim();
  const normalizedCabang = cabang.trim();

  const loadItems = useCallback(async () => {
    if (!normalizedUlok) {
      showAlert({
        title: "Nomor ULOK Diperlukan",
        message: "Isi nomor ULOK terlebih dahulu untuk melihat berkas Serah Terima.",
        type: "warning",
      });
      return;
    }

    setLoadingData(true);
    setSearched(true);
    try {
      const result = await fetchBerkasSerahTerimaList({ nomor_ulok: normalizedUlok });
      const filtered = normalizedCabang
        ? (result.data ?? []).filter((item) =>
          String(item.toko?.cabang ?? "").trim().toUpperCase() === normalizedCabang.toUpperCase()
        )
        : result.data ?? [];
      setItems(filtered);
      if (filtered.length === 0) {
        showAlert({
          title: "Data Tidak Ditemukan",
          message: "Tidak ada berkas Serah Terima untuk ULOK atau cabang tersebut.",
          type: "info",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data Serah Terima.";
      showAlert({ title: "Pencarian Gagal", message, type: "error" });
    } finally {
      setLoadingData(false);
    }
  }, [normalizedCabang, normalizedUlok, showAlert]);

  const summary = useMemo(() => {
    const first = items[0];
    return {
      toko: first?.toko?.nama_toko ?? "-",
      proyek: first?.toko?.proyek ?? "-",
      currentDate: first?.created_at ?? null,
      totalDenda: items.reduce((sum, item) => sum + Number(item.nilai_denda ?? 0), 0),
    };
  }, [items]);

  const submitCorrection = async () => {
    setSubmitting(true);
    try {
      const result = await correctSerahTerimaDate(
        {
          nomor_ulok: normalizedUlok,
          cabang: normalizedCabang || undefined,
          tanggal_serah_terima: tanggalBaru,
          catatan: catatan.trim() || undefined,
        },
        { suppressGlobalError: true }
      );
      setItems(result.data.items ?? []);
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
    if (!items.length) {
      showAlert({
        title: "Data Belum Dipilih",
        message: "Cari dan pastikan berkas Serah Terima yang akan dikoreksi terlebih dahulu.",
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
      message: `Tanggal Serah Terima ULOK ${normalizedUlok} akan diubah menjadi ${formatDate(tanggalBaru)}. Sistem akan menghitung ulang denda dan menjadwalkan pembuatan ulang dokumen terkait.`,
      type: "warning",
      confirmMode: true,
      confirmText: "Proses Koreksi",
      cancelText: "Batalkan",
      onConfirm: submitCorrection,
    });
  };

  const canSubmit = Boolean(user?.isSuperHuman && items.length && tanggalBaru && !submitting);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <AppNavbar title="KOREKSI SERAH TERIMA" showBackButton backHref="/dashboard" showBuildingLogo />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Kontrol dokumen final</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950">Koreksi Tanggal Serah Terima</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ubah tanggal Serah Terima berdasarkan ULOK, lalu sistem akan menyinkronkan ulang denda dan dokumen yang bergantung pada tanggal tersebut.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadItems}
            disabled={loadingData || submitting || !normalizedUlok}
            className="h-10 rounded-lg border-slate-200 bg-white shadow-sm"
          >
            {loadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Cari Berkas</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Gunakan nomor ULOK. Cabang dapat diisi jika perlu membatasi scope.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="nomor_ulok">Nomor ULOK</Label>
                <Input
                  id="nomor_ulok"
                  value={nomorUlok}
                  onChange={(event) => setNomorUlok(event.target.value)}
                  placeholder="Contoh: 123456"
                  className="h-10 rounded-lg bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cabang">Cabang</Label>
                <Input
                  id="cabang"
                  value={cabang}
                  onChange={(event) => setCabang(event.target.value)}
                  placeholder="Opsional"
                  className="h-10 rounded-lg bg-white"
                />
              </div>
              <Button type="button" onClick={loadItems} disabled={loadingData || !normalizedUlok} className="h-10 rounded-lg bg-red-700 px-5 text-white hover:bg-red-800">
                {loadingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Cari
              </Button>
            </div>

            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
              <div className="grid min-w-[720px] grid-cols-[1.1fr_1fr_130px_140px] bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Scope</span>
                <span>Toko</span>
                <span>Tanggal ST</span>
                <span className="text-right">Denda</span>
              </div>
              {items.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="grid min-w-[720px] grid-cols-[1.1fr_1fr_130px_140px] items-center px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{item.toko?.lingkup_pekerjaan || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.toko?.cabang || "-"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.toko?.nama_toko || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.toko?.kode_toko || item.toko?.nama_kontraktor || "-"}</p>
                      </div>
                      <p className="text-slate-700">{formatDate(item.created_at)}</p>
                      <p className="text-right font-semibold text-slate-900">{formatCurrency(item.nilai_denda)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-slate-500">
                  <FileText className="h-8 w-8 text-slate-300" />
                  {searched ? "Berkas Serah Terima belum ditemukan." : "Cari ULOK untuk menampilkan berkas Serah Terima."}
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
                  <h2 className="text-lg font-black text-slate-950">Tanggal Baru</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Tanggal ini akan menjadi acuan ulang untuk denda dan dokumen.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal_baru">Tanggal Serah Terima</Label>
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
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Ringkasan</p>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Proyek</p>
                  <p className="mt-1 font-semibold text-slate-950">{summary.proyek}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Toko</p>
                  <p className="mt-1 font-semibold text-slate-950">{summary.toko}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Berkas terdampak</span>
                  <Badge variant="secondary" className="rounded-md bg-slate-100 text-slate-700">{items.length}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Tanggal saat ini</span>
                  <span className="font-semibold text-slate-900">{formatDate(summary.currentDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Total denda saat ini</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(summary.totalDenda)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Proses ini menghitung ulang denda saat disimpan dan membuat ulang PDF Serah Terima serta PDF Opname Final di background.</p>
                </div>
              </div>

              <Button type="submit" disabled={!canSubmit} className="mt-5 h-11 w-full rounded-lg bg-red-700 font-bold text-white hover:bg-red-800">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Simpan Koreksi
              </Button>
            </section>
          </aside>
        </form>
      </section>
    </main>
  );
}
