"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  BadgeCheck,
  Sparkles,
  Eye,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Building2,
  FolderTree,
  ChevronsUpDown,
  CornerDownRight,
} from "lucide-react";
import { PengajuanHargaItem } from "./types";
import { getTrialBadgeInfo } from "./trial-utils";

interface KatalogMasterTableProps {
  items: PengajuanHargaItem[];
  activeTab?: 'official' | 'trial';
  onOpenDetail: (item: PengajuanHargaItem) => void;
  selectedCabangFilter?: string;
}

interface GroupedMasterItem {
  parentKode: string;
  parentItem: PengajuanHargaItem;
  children: PengajuanHargaItem[];
  isAnyTrial: boolean;
  allOfficial: boolean;
}

export function KatalogMasterTable({
  items,
  activeTab = 'official',
  onOpenDetail,
  selectedCabangFilter = 'all',
}: KatalogMasterTableProps) {
  // Pengelompokan data: Induk = Kode Item (item.kode), Anak = Kode Master Item (item.kodeMaster)
  const groupedItems = useMemo(() => {
    const map = new Map<string, GroupedMasterItem>();

    items.forEach((item) => {
      const key = item.kode || item.id;
      if (!map.has(key)) {
        map.set(key, {
          parentKode: key,
          parentItem: item,
          children: [],
          isAnyTrial: false,
          allOfficial: true,
        });
      }

      const group = map.get(key)!;
      group.children.push(item);

      const isTrial =
        Boolean(item.isTrial) ||
        item.status === "TRIAL_RELEASED" ||
        item.status.startsWith("TRIAL_PROMOSI_");

      if (isTrial) {
        group.isAnyTrial = true;
        group.allOfficial = false;
      }
    });

    return Array.from(map.values());
  }, [items]);

  // State untuk expand / collapse baris induk (default: semua terbuka)
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const isExpanded = (kode: string) => !collapsedGroups[kode];

  const toggleGroup = (kode: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [kode]: !prev[kode],
    }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    groupedItems.forEach((g) => {
      allCollapsed[g.parentKode] = true;
    });
    setCollapsedGroups(allCollapsed);
  };

  return (
    <div className="space-y-2.5">
      {/* Sub-header Toolbar Ringkas: Info Grouping & Tombol Expand/Collapse */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            <span>Struktur Hierarki Material:</span>
          </span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
            {groupedItems.length} Material Induk
          </span>
          <span>&bull;</span>
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
            {items.length} Varian Master Anak
          </span>
        </div>

        {groupedItems.length > 0 && (
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-7 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer"
            >
              Buka Semua
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-7 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer"
            >
              Tutup Semua
            </Button>
          </div>
        )}
      </div>

      {/* Tabel Hirarki Master */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] w-12">
                No
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] min-w-[170px]">
                Kode (Induk / Master)
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Material &amp; Spesifikasi
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Kategori &amp; Lokasi
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Tipe
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Cakupan Cabang
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Masa Berlaku / Status
              </th>
              <th className="text-center px-3.5 py-3 font-bold whitespace-nowrap text-[11px] w-28">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {groupedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400">
                  <Database className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-600">
                    Tidak ada data material dalam katalog untuk filter yang
                    dipilih.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Coba sesuaikan kata kunci pencarian atau ganti filter tab /
                    cabang.
                  </p>
                </td>
              </tr>
            ) : (
              groupedItems.map((group, groupIdx) => {
                const expanded = isExpanded(group.parentKode);
                const parent = group.parentItem;

                return (
                  <React.Fragment key={group.parentKode}>
                    {/* =========================================================================
                        1. BARIS INDUK (PARENT ROW - KODE ITEM FISIK)
                        ========================================================================= */}
                    <tr className="bg-slate-100 hover:bg-slate-200 transition-colors border-t border-b border-slate-200 font-medium">
                      {/* No */}
                      <td className="text-center px-3 py-3 font-bold text-slate-700 border-r border-slate-200">
                        {groupIdx + 1}
                      </td>

                      {/* Kode Item Induk + Toggle Accordion Button */}
                      <td className="px-3.5 py-3 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.parentKode)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-300 transition-colors cursor-pointer"
                            title={expanded ? "Tutup Varian" : "Buka Varian"}
                          >
                            {expanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-700" />
                            )}
                          </button>
                          <div>
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-300 text-xs shadow-2xs">
                              {group.parentKode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Material & Spesifikasi Induk */}
                      <td className="px-3.5 py-3 border-r border-slate-200 min-w-[200px]">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{parent.item}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-normal mt-0.5">
                          {parent.merk} &bull; {parent.ukuran}
                        </div>
                      </td>

                      {/* Kategori Induk */}
                      <td className="px-3.5 py-3 border-r border-slate-200 whitespace-nowrap text-slate-800">
                        <span className="font-semibold text-slate-800">
                          {parent.kategori}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Posisi: {parent.implementasi || "Lantai / Dinding"}
                        </span>
                      </td>

                      {/* Tipe Master Induk (Ringkasan) */}
                      <td className="text-center px-3.5 py-3 border-r border-slate-200 whitespace-nowrap">
                        {group.isAnyTrial ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-600 text-white select-none">
                            Trial
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white select-none">
                            Master Harga
                          </span>
                        )}
                      </td>

                      {/* Cakupan Cabang / Jumlah Varian Anak */}
                      <td className="text-center px-3.5 py-3 border-r border-slate-200 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800 select-none">
                          {group.children.length} Varian
                        </span>
                      </td>

                      <td></td>

                      {/* Aksi Baris Induk */}
                      <td className="text-center px-3 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleGroup(group.parentKode)}
                          className="h-7 text-[11px] px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-300 rounded-lg gap-1 cursor-pointer font-medium"
                        >
                          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                          <span>{expanded ? "Tutup" : "Buka"}</span>
                        </Button>
                      </td>
                    </tr>

                    {/* =========================================================================
                        2. BARIS ANAK (CHILD ROWS - KODE MASTER ITEM & VARIAN LOKASI)
                        ========================================================================= */}
                    {expanded &&
                      group.children.map((child) => {
                        const isChildTrial =
                          Boolean(child.isTrial) ||
                          child.status === "TRIAL_RELEASED" ||
                          child.status.startsWith("TRIAL_PROMOSI_");

                        const trialBadge = isChildTrial
                          ? getTrialBadgeInfo(child)
                          : null;

                        // Perhitungan cabang aktif
                        const activeBranches = (
                          child.hargaPerCabang || []
                        ).filter((c) => c.status === "AKTIF");

                        // Evaluasi filter cabang spesifik (jika ada)
                        const filteredBranchInfo =
                          selectedCabangFilter && selectedCabangFilter !== "all"
                            ? (child.hargaPerCabang || []).find(
                                (c) =>
                                  c.cabang.toLowerCase() ===
                                  selectedCabangFilter.toLowerCase(),
                              )
                            : null;

                        return (
                          <tr
                            key={child.id}
                            className="bg-white hover:bg-slate-50 transition-colors border-b border-slate-100"
                          >
                            {/* No (Kosong untuk baris anak agar fokus ke hierarki) */}
                            <td className="text-center px-3 py-3 text-slate-300 border-r border-slate-100">
                              <span className="text-[10px]">&bull;</span>
                            </td>

                            {/* Kode Master Item Anak dengan Indentasi Lembut */}
                            <td className="px-3.5 py-3 border-r border-slate-100 whitespace-nowrap pl-7">
                              <div className="flex items-center gap-1.5">
                                <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span
                                  className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${
                                    isChildTrial
                                      ? "text-purple-700 bg-purple-50 border-purple-200"
                                      : "text-blue-700 bg-blue-50 border-blue-200"
                                  }`}
                                >
                                  {child.kodeMaster || child.kode}
                                </span>
                              </div>
                            </td>

                            {/* Material & Spesifikasi Spesifik */}
                            <td className="px-3.5 py-3 border-r border-slate-100 min-w-[200px]">
                              <div className="font-semibold text-slate-800 text-xs">
                                {child.item}
                              </div>
                              <div className="text-[11px] text-slate-500 font-normal">
                                {child.merk} &bull; {child.tipe || child.ukuran}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                                {child.deskripsiOtomatis}
                              </div>
                            </td>

                            {/* Kategori & Lokasi Penempatan */}
                            <td className="px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">
                                {child.lokasi || "-"}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {child.kategori}
                              </div>
                            </td>

                            {/* Tipe Master Anak (Solid Badge Tanpa Ikon) */}
                            <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                              {isChildTrial ? (
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-600 text-white select-none">
                                  Master Trial
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white select-none">
                                  Master Harga
                                </span>
                              )}
                            </td>

                            {/* Cakupan Cabang (Solid Badge Tanpa Ikon) */}
                            <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                              {selectedCabangFilter &&
                              selectedCabangFilter !== "all" ? (
                                filteredBranchInfo?.status === "AKTIF" ? (
                                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white select-none">
                                    Aktif di {selectedCabangFilter}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-600 select-none">
                                    Nonaktif di {selectedCabangFilter}
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 select-none">
                                  {activeBranches.length > 0
                                    ? `${activeBranches.length} Cabang Aktif`
                                    : "Belum Ada Cabang"}
                                </span>
                              )}
                            </td>

                            {/* Masa Berlaku / Status (Solid Badge Tanpa Ikon) */}
                            <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                              {isChildTrial ? (
                                <span
                                  className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold select-none ${
                                    trialBadge?.badgeClass ||
                                    "bg-purple-600 text-white"
                                  }`}
                                >
                                  {trialBadge?.label || "Trial"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white select-none">
                                  Aktif
                                </span>
                              )}
                            </td>

                            {/* Aksi Anak (Tombol Rincian Detail Modal) */}
                            <td className="text-center px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onOpenDetail(child)}
                                  className="h-7 text-[11px] px-2.5 rounded-lg gap-1 cursor-pointer hover:bg-slate-100 hover:text-slate-900 border-slate-200 font-semibold"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Rincian</span>
                                </Button>

                                {isChildTrial &&
                                  trialBadge?.isActionRequired && (
                                    <Link href="/pengajuan-harga/sb-specialist">
                                      <Button
                                        size="sm"
                                        className="h-7 text-[11px] px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                                      >
                                        <span>Tindak Lanjut</span>
                                      </Button>
                                    </Link>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
