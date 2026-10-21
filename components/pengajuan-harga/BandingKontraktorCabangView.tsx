"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Search,
  Check,
  AlertTriangle,
  X,
  XCircle,
  Layers,
  MapPin,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { PengajuanHargaItem } from "./types";

interface BandingKontraktorCabangViewProps {
  items: PengajuanHargaItem[];
  role: "SB_SPECIALIST" | "REGIONAL_MANAGER";
  getDetailHref: (item: PengajuanHargaItem) => string;
}

export function BandingKontraktorCabangView({
  items,
  role,
  getDetailHref,
}: BandingKontraktorCabangViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [pendingSwitchCabang, setPendingSwitchCabang] = useState<string | null>(null);

  // Helper untuk menentukan apakah suatu item sudah selesai diproses sesuai role
  const isItemCompletedForRole = (item: PengajuanHargaItem) => {
    if (role === "SB_SPECIALIST") {
      // Selesai jika sudah disesuaikan SNB (status PENDING_REGIONAL_MGR atau selanjutnya)
      return (
        (item.isHasilNegosiasi && item.status === "PENDING_REGIONAL_MGR") ||
        item.status === "PENDING_KONTRAKTOR" ||
        item.status === "APPROVED_ACTIVE" ||
        item.status === "RELEASED"
      );
    } else {
      // Regional Manager: Selesai jika sudah diapprove (PENDING_KONTRAKTOR, RELEASED, dll.)
      return (
        item.status === "PENDING_KONTRAKTOR" ||
        item.status === "APPROVED_ACTIVE" ||
        item.status === "RELEASED"
      );
    }
  };

  // Helper untuk menentukan apakah suatu item butuh tindakan aktif dari role saat ini
  const isItemPendingForRole = (item: PengajuanHargaItem) => {
    if (role === "SB_SPECIALIST") {
      return item.status === "USULAN_KONTRAKTOR";
    } else {
      return item.status === "PENDING_REGIONAL_MGR" && Boolean(item.isHasilNegosiasi);
    }
  };

  // Tingkat prioritas item:
  // 1 = Butuh Tindakan Langsung (Perlu Aksi - paling atas)
  // 2 = Sedang Berproses di Pihak Lain
  // 3 = Selesai / Tuntas
  const getItemPriority = (item: PengajuanHargaItem) => {
    if (isItemPendingForRole(item)) {
      return 1;
    }
    if (!isItemCompletedForRole(item)) {
      return 2;
    }
    return 3;
  };

  // Kelompokkan item berdasarkan cabang
  const groupedData = useMemo(() => {
    const map = new Map<
      string,
      {
        cabang: string;
        items: PengajuanHargaItem[];
        totalItems: number;
        completedItems: number;
        pendingItems: number;
        isAllDone: boolean;
        progressPercent: number;
      }
    >();

    items.forEach((item) => {
      const cName = item.cabang?.trim() || "Cikokol";
      if (!map.has(cName)) {
        map.set(cName, {
          cabang: cName,
          items: [],
          totalItems: 0,
          completedItems: 0,
          pendingItems: 0,
          isAllDone: false,
          progressPercent: 0,
        });
      }
      const entry = map.get(cName)!;
      entry.items.push(item);
      entry.totalItems += 1;
      if (isItemCompletedForRole(item)) {
        entry.completedItems += 1;
      }
      if (isItemPendingForRole(item)) {
        entry.pendingItems += 1;
      }
    });

    const result = Array.from(map.values()).map((c) => {
      // Urutkan item di dalam cabang mulai dari yang perlu tindakan
      c.items.sort((a, b) => {
        const prioA = getItemPriority(a);
        const prioB = getItemPriority(b);
        if (prioA !== prioB) return prioA - prioB;
        return a.item.localeCompare(b.item);
      });

      const progressPercent =
        c.totalItems > 0 ? Math.round((c.completedItems / c.totalItems) * 100) : 0;
      return {
        ...c,
        isAllDone: c.pendingItems === 0,
        progressPercent,
      };
    });

    // Urutkan: cabang yang masih punya pekerjaan pending di atas
    return result.sort((a, b) => {
      if (a.isAllDone && !b.isAllDone) return 1;
      if (!a.isAllDone && b.isAllDone) return -1;
      return b.pendingItems - a.pendingItems;
    });
  }, [items, role]);

  // Set default selectedCabang ke cabang pertama yang belum selesai
  const activeCabangName = useMemo(() => {
    if (selectedCabang && groupedData.some((g) => g.cabang === selectedCabang)) {
      return selectedCabang;
    }
    const firstPending = groupedData.find((g) => !g.isAllDone);
    return firstPending?.cabang || groupedData[0]?.cabang || "";
  }, [selectedCabang, groupedData]);

  // Data cabang yang sedang aktif
  const currentBranchData = useMemo(() => {
    return groupedData.find((g) => g.cabang === activeCabangName);
  }, [groupedData, activeCabangName]);

  // Item di cabang aktif setelah difilter pencarian dan diurutkan mulai dari item yang butuh tindakan
  const displayedBranchItems = useMemo(() => {
    if (!currentBranchData) return [];
    let list = currentBranchData.items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q)
      );
    }

    // Pastikan selalu terurut mulai dari item yang butuh tindakan
    return [...list].sort((a, b) => {
      const prioA = getItemPriority(a);
      const prioB = getItemPriority(b);
      if (prioA !== prioB) return prioA - prioB;
      return a.item.localeCompare(b.item);
    });
  }, [currentBranchData, search, role]);

  // Daftar unik rekanan kontraktor yang terdaftar di cabang aktif ini
  const branchContractors = useMemo(() => {
    if (!currentBranchData) return [];
    const contractorMap = new Map<string, string>();
    currentBranchData.items.forEach((item) => {
      item.votingKontraktor?.daftarKontraktor?.forEach((k) => {
        const key = k.kontraktorId || k.namaPerusahaan;
        if (!contractorMap.has(key)) {
          contractorMap.set(key, k.namaPerusahaan);
        }
      });
    });
    return Array.from(contractorMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [currentBranchData]);

  // Handler pergantian cabang dengan peringatan jika cabang aktif belum selesai
  const handleSelectCabang = (targetCabang: string) => {
    if (targetCabang === activeCabangName) return;

    // Cek apakah cabang saat ini masih memiliki pekerjaan yang belum beres
    if (currentBranchData && !currentBranchData.isAllDone) {
      setPendingSwitchCabang(targetCabang);
    } else {
      setSelectedCabang(targetCabang);
    }
  };

  const confirmSwitchCabang = () => {
    if (pendingSwitchCabang) {
      setSelectedCabang(pendingSwitchCabang);
      setPendingSwitchCabang(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Tidak Ada Usulan Banding Kontraktor
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Semua pekerjaan rekanan kontraktor saat ini telah disepakati atau belum ada penolakan kuorum yang membutuhkan negosiasi harga per cabang.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER PEMILIHAN CABANG & PROGRESS TRACKER
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daftar Usulan Banding Berdasarkan Cabang
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih satu cabang dan selesaikan seluruh item pekerjaan di cabang tersebut.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-white">
            {groupedData.length} Cabang Terdaftar
          </Badge>
        </div>

        {/* Grid Kartu Cabang Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {groupedData.map((branch) => {
            const isSelected = branch.cabang === activeCabangName;
            return (
              <div
                key={branch.cabang}
                onClick={() => handleSelectCabang(branch.cabang)}
                className={`relative rounded-xl p-4 transition-all cursor-pointer border text-left flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        Cabang {branch.cabang}
                      </span>
                    </div>
                    {branch.isAllDone ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        Tuntas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        {branch.pendingItems} Perlu Aksi
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mb-3">
                    Total {branch.totalItems} item pekerjaan diajukan banding
                  </p>
                </div>

                {/* Progress Bar & Footer */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>
                      {branch.completedItems} / {branch.totalItems} Selesai
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {branch.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        branch.isAllDone ? "bg-emerald-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${branch.progressPercent}%` }}
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <span
                      className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                        isSelected ? "text-blue-700" : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    >
                      {isSelected ? "Sedang Dikerjakan" : "Pilih Cabang"}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. WORKSPACE TERFOKUS CABANG TERPILIH
          ========================================================================= */}
      {currentBranchData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Banner Fokus Cabang */}
          <div className="bg-red-600 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Cabang {currentBranchData.cabang}
                  </h3>
                  {currentBranchData.isAllDone ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      ✓ Seluruh Item di Cabang Ini Sudah Tuntas
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-slate-900 text-[10px] font-bold">
                      {currentBranchData.pendingItems} Item Perlu Diselesaikan
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-white mt-0.5">
                  {role === "SB_SPECIALIST"
                    ? "Sesuaikan koefisien dan persentase margin seluruh item pekerjaan pada cabang ini sebelum melanjutkan ke cabang berikutnya."
                    : "Tinjau dan putuskan penetapan harga seluruh item hasil usulan SNB di cabang ini sebelum melanjutkan ke cabang berikutnya."}
                </p>
              </div>
            </div>

            {/* Pencarian dalam cabang */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari item di cabang ini..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs text-white placeholder:text-white border-white rounded-lg focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabel Item Pekerjaan Cabang Terpilih */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Item Pekerjaan</th>
                  {branchContractors.map((c) => (
                    <th
                      key={c.id}
                      className="py-3 px-3 text-center min-w-[140px] max-w-[220px]"
                    >
                      <div className="font-semibold text-slate-800 text-xs truncate" title={c.name}>
                        {c.name}
                      </div>
                    </th>
                  ))}
                  {branchContractors.length === 0 && (
                    <th className="py-3 px-3 text-center min-w-[140px]">Status Rekanan</th>
                  )}
                  <th className="py-3 px-3 min-w-[150px]">Status Evaluasi</th>
                  <th className="py-3 px-4 text-right min-w-[130px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBranchItems.map((item) => {
                  const isCompleted = isItemCompletedForRole(item);
                  const isPending = isItemPendingForRole(item);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isPending
                          ? "bg-amber-50/25 hover:bg-amber-50/50"
                          : isCompleted
                          ? "bg-slate-50/40 hover:bg-slate-50"
                          : "hover:bg-blue-50/20"
                      }`}
                    >
                      {/* Kolom 1: Item Pekerjaan */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-xs">
                            {item.item}
                          </span>
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              Perlu Tindakan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.kodeMaster || item.kode} • {item.ukuran} {item.merk}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.kategori}
                        </span>
                      </td>

                      {/* Kolom Matriks: Keputusan Tiap Rekanan Kontraktor */}
                      {branchContractors.map((c) => {
                        const voteItem = item.votingKontraktor?.daftarKontraktor?.find(
                          (k) => (k.kontraktorId && k.kontraktorId === c.id) || k.namaPerusahaan === c.name
                        );

                        return (
                          <td key={c.id} className="py-3 px-3 text-center whitespace-nowrap">
                            {voteItem ? (
                              voteItem.statusVote === "TOLAK" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  Tolak
                                </span>
                              ) : voteItem.statusVote === "SETUJU" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Setuju
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Menunggu
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">-</span>
                            )}
                          </td>
                        );
                      })}

                      {branchContractors.length === 0 && (
                        <td className="py-3 px-3 text-center text-slate-400 text-xs italic">
                          -
                        </td>
                      )}

                      {/* Kolom Status Evaluasi Sesuai Peran */}
                      <td className="py-3 px-3">
                        {role === "SB_SPECIALIST" ? (
                          item.status === "USULAN_KONTRAKTOR" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Perlu Penyesuaian SNB
                            </span>
                          ) : item.isHasilNegosiasi && item.status === "PENDING_REGIONAL_MGR" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              Ditetapkan SNB (Menunggu RM)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Disetujui Regional Manager
                            </span>
                          )
                        ) : (
                          /* Role Regional Manager */
                          item.status === "PENDING_REGIONAL_MGR" && item.isHasilNegosiasi ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Menunggu Approval RM
                            </span>
                          ) : item.status === "USULAN_KONTRAKTOR" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              Proses di S&amp;B Specialist
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Disetujui Regional Manager
                            </span>
                          )
                        )}
                      </td>

                      {/* Kolom 6: Aksi */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={getDetailHref(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                            isCompleted
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : role === "SB_SPECIALIST"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                        >
                          <span>
                            {isCompleted
                              ? "Lihat Detail"
                              : role === "SB_SPECIALIST"
                              ? "Sesuaikan"
                              : "Review"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. MODAL PERINGATAN BERALIH CABANG SEBELUM TUNTAS
          ========================================================================= */}
      {pendingSwitchCabang && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Cabang {currentBranchData?.cabang} Belum Selesai
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masih terdapat <strong>{currentBranchData?.pendingItems} item pekerjaan</strong> yang belum diselesaikan pada cabang ini. Disarankan untuk menuntaskan seluruh item pada satu cabang terlebih dahulu sebelum berpindah.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <span>Beralih ke:</span>
              <strong className="text-blue-700 font-bold">
                Cabang {pendingSwitchCabang}
              </strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingSwitchCabang(null)}
                className="text-xs"
              >
                Tetap di Cabang {currentBranchData?.cabang}
              </Button>
              <Button
                size="sm"
                onClick={confirmSwitchCabang}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Ya, Tetap Beralih
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
