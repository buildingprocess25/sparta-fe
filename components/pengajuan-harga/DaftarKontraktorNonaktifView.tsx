"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Building2,
  Clock,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  MessageSquarePlus,
  ShieldCheck,
  ShieldAlert,
  History,
  ArrowRight,
  Filter,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  ParkedKontraktorCabang,
  DiskusiKontraktorLog,
} from "./types";
import {
  getParkedKontraktorList,
  addDiskusiParkedKontraktor,
  unparkKontraktor,
} from "./store";
import { useGlobalAlert } from "@/context/GlobalAlertContext";

interface DaftarKontraktorNonaktifViewProps {
  role: "SB_SPECIALIST" | "REGIONAL_MANAGER";
}

export function DaftarKontraktorNonaktifView({
  role,
}: DaftarKontraktorNonaktifViewProps) {
  const { showAlert } = useGlobalAlert();
  const [parkedList, setParkedList] = useState<ParkedKontraktorCabang[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCabangFilter, setSelectedCabangFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // State Modal Catat Diskusi
  const [diskusiModalItem, setDiskusiModalItem] = useState<ParkedKontraktorCabang | null>(null);
  const [saluranDiskusi, setSaluranDiskusi] = useState<"TELEPON" | "WHATSAPP" | "MEETING" | "KUNJUNGAN">("TELEPON");
  const [picInternal, setPicInternal] = useState(
    role === "SB_SPECIALIST" ? "S&B Specialist" : "B&M Regional Manager"
  );
  const [picKontraktor, setPicKontraktor] = useState("");
  const [ringkasanDiskusi, setRingkasanDiskusi] = useState("");
  const [kesepakatanDiskusi, setKesepakatanDiskusi] = useState("");
  const [statusHasilDiskusi, setStatusHasilDiskusi] = useState<"DALAM_DISKUSI" | "SEPAKAT" | "DITANGGUHKAN">("DALAM_DISKUSI");

  // State Modal Unpark / Re-aktivasi
  const [unparkModalItem, setUnparkModalItem] = useState<ParkedKontraktorCabang | null>(null);
  const [unparkReason, setUnparkReason] = useState("");

  // State Modal Riwayat Lengkap
  const [historyModalItem, setHistoryModalItem] = useState<ParkedKontraktorCabang | null>(null);

  // Load Data
  const reloadData = () => {
    setParkedList(getParkedKontraktorList());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Filter List Cabang yang Unik
  const availableCabang = useMemo(() => {
    const set = new Set<string>();
    parkedList.forEach((p) => {
      if (p.cabang) set.add(p.cabang.trim());
    });
    return Array.from(set);
  }, [parkedList]);

  // Statistik KPI Ringkasan
  const stats = useMemo(() => {
    const nonaktifAktif = parkedList.filter((p) => p.statusAktif !== "AKTIF_KEMBALI");
    const belumDiskusi = nonaktifAktif.filter((p) => !p.statusDiskusi || p.statusDiskusi === "BELUM_DISKUSI").length;
    const dalamDiskusi = nonaktifAktif.filter((p) => p.statusDiskusi === "DALAM_DISKUSI").length;
    const sepakat = nonaktifAktif.filter((p) => p.statusDiskusi === "SEPAKAT").length;
    const aktifKembali = parkedList.filter((p) => p.statusAktif === "AKTIF_KEMBALI").length;

    return {
      totalNonaktif: nonaktifAktif.length,
      belumDiskusi,
      dalamDiskusi,
      sepakat,
      aktifKembali,
    };
  }, [parkedList]);

  // Data Terfilter
  const filteredList = useMemo(() => {
    return parkedList.filter((item) => {
      // Filter Cabang
      if (selectedCabangFilter !== "ALL" && item.cabang.toLowerCase() !== selectedCabangFilter.toLowerCase()) {
        return false;
      }

      // Filter Status Diskusi / Aktif
      if (selectedStatusFilter === "NONAKTIF" && item.statusAktif === "AKTIF_KEMBALI") {
        return false;
      }
      if (selectedStatusFilter === "AKTIF_KEMBALI" && item.statusAktif !== "AKTIF_KEMBALI") {
        return false;
      }
      if (selectedStatusFilter === "BELUM_DISKUSI" && item.statusDiskusi !== "BELUM_DISKUSI") {
        return false;
      }
      if (selectedStatusFilter === "DALAM_DISKUSI" && item.statusDiskusi !== "DALAM_DISKUSI") {
        return false;
      }
      if (selectedStatusFilter === "SEPAKAT" && item.statusDiskusi !== "SEPAKAT") {
        return false;
      }

      // Filter Pencarian Text
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.namaPerusahaan.toLowerCase().includes(q) ||
          (item.picName && item.picName.toLowerCase().includes(q)) ||
          item.cabang.toLowerCase().includes(q) ||
          item.alasan.toLowerCase().includes(q) ||
          (item.itemPemicuKode && item.itemPemicuKode.toLowerCase().includes(q)) ||
          (item.itemPemicuNama && item.itemPemicuNama.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [parkedList, selectedCabangFilter, selectedStatusFilter, search]);

  // Handler Buka Modal Catat Diskusi
  const handleOpenCatatDiskusi = (item: ParkedKontraktorCabang) => {
    setDiskusiModalItem(item);
    setPicKontraktor(item.picName || "");
    setRingkasanDiskusi("");
    setKesepakatanDiskusi("");
    setStatusHasilDiskusi("DALAM_DISKUSI");
    setSaluranDiskusi("TELEPON");
  };

  // Submit Simpan Diskusi
  const handleSubmitDiskusi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diskusiModalItem) return;
    if (!ringkasanDiskusi.trim()) {
      showAlert({
        title: "Perhatian",
        message: "Ringkasan hasil diskusi wajib diisi.",
        type: "warning",
      });
      return;
    }

    addDiskusiParkedKontraktor(diskusiModalItem.kontraktorId, diskusiModalItem.cabang, {
      saluran: saluranDiskusi,
      picInternal: picInternal.trim() || (role === "SB_SPECIALIST" ? "S&B Specialist" : "B&M Regional Manager"),
      picKontraktor: picKontraktor.trim() || diskusiModalItem.picName || "PIC Kontraktor",
      ringkasan: ringkasanDiskusi.trim(),
      kesepakatan: kesepakatanDiskusi.trim() || undefined,
      statusHasil: statusHasilDiskusi,
    });

    showAlert({
      title: "Diskusi Berhasil Dicatat",
      message: `Catatan diskusi dengan ${diskusiModalItem.namaPerusahaan} telah tersimpan.`,
      type: "success",
    });

    setDiskusiModalItem(null);
    reloadData();
  };

  // Submit Buka Nonaktif (Unpark)
  const handleSubmitUnpark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unparkModalItem) return;
    if (!unparkReason.trim()) {
      showAlert({
        title: "Perhatian",
        message: "Alasan pengaktifan kembali wajib diisi.",
        type: "warning",
      });
      return;
    }

    const actor = role === "SB_SPECIALIST" ? "S&B Specialist" : "B&M Regional Manager";
    unparkKontraktor(unparkModalItem.kontraktorId, unparkModalItem.cabang, unparkReason.trim(), actor);

    showAlert({
      title: "Kontraktor Berhasil Diaktifkan Kembali",
      message: `${unparkModalItem.namaPerusahaan} kini telah aktif kembali untuk menerima pekerjaan di Cabang ${unparkModalItem.cabang}.`,
      type: "success",
    });

    setUnparkModalItem(null);
    setUnparkReason("");
    reloadData();
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER & SUMMARY CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Nonaktif */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-rose-700 block">
                Sedang Dinonaktifkan
              </span>
              <span className="text-2xl font-bold text-rose-900 mt-1 block">
                {stats.totalNonaktif}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Menolak harga pasca banding di cabang terkait
          </p>
        </div>

        {/* Card 2: Belum Dihubungi */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-amber-700 block">
                Perlu Dihubungi
              </span>
              <span className="text-2xl font-bold text-amber-900 mt-1 block">
                {stats.belumDiskusi}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Belum ada komunikasi mediasi tercatat
          </p>
        </div>

        {/* Card 3: Dalam Proses Diskusi */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-blue-700 block">
                Dalam Proses Diskusi
              </span>
              <span className="text-2xl font-bold text-blue-900 mt-1 block">
                {stats.dalamDiskusi}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Sedang tahap negosiasi/klarifikasi lapangan
          </p>
        </div>

        {/* Card 4: Tercapai Kesepakatan / Siap Unpark */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-emerald-700 block">
                Tercapai Kesepakatan
              </span>
              <span className="text-2xl font-bold text-emerald-900 mt-1 block">
                {stats.sepakat}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mediasi berhasil, siap diaktifkan kembali
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. FILTER & PENCARIAN
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Kiri: Filter Cabang & Filter Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* Filter Cabang */}
          <select
            value={selectedCabangFilter}
            onChange={(e) => setSelectedCabangFilter(e.target.value)}
            className="text-xs h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Cabang ({availableCabang.length})</option>
            {availableCabang.map((c) => (
              <option key={c} value={c}>
                Cabang {c}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Status Mediasi</option>
            <option value="NONAKTIF">Hanya yang Sedang Nonaktif ({stats.totalNonaktif})</option>
            <option value="BELUM_DISKUSI">Belum Dihubungi ({stats.belumDiskusi})</option>
            <option value="DALAM_DISKUSI">Dalam Diskusi ({stats.dalamDiskusi})</option>
            <option value="SEPAKAT">Tercapai Kesepakatan ({stats.sepakat})</option>
            <option value="AKTIF_KEMBALI">Riwayat Diaktifkan Kembali ({stats.aktifKembali})</option>
          </select>
        </div>

        {/* Kanan: Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari kontraktor, PIC, cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50 rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* =========================================================================
          3. TABEL DAFTAR KONTRAKTOR NONAKTIF
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daftar Rekanan Dinonaktifkan Sementara
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kontraktor dalam daftar ini dinonaktifkan sementara dari seluruh pekerjaan di cabang terkait karena penolakan kuorum pasca banding.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
            Total {filteredList.length} Rekanan
          </Badge>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Tidak Ada Kontraktor Nonaktif
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada rekanan yang sedang dinonaktifkan sementara pada kriteria filter saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Rekanan Kontraktor &amp; PIC</th>
                  <th className="py-3 px-3 min-w-[130px]">Cabang &amp; Tanggal</th>
                  <th className="py-3 px-3 min-w-[220px]">Pemicu Penonaktifan</th>
                  <th className="py-3 px-3 min-w-[160px]">Status Mediasi</th>
                  <th className="py-3 px-4 text-right min-w-[180px]">Tindak Lanjut &amp; Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  const isAlreadyActive = item.statusAktif === "AKTIF_KEMBALI";
                  const totalLogs = item.riwayatDiskusi?.length || 0;
                  const latestLog = item.riwayatDiskusi?.[0];

                  return (
                    <tr
                      key={`${item.kontraktorId}-${item.cabang}`}
                      className={`transition-colors ${
                        isAlreadyActive
                          ? "bg-slate-50/50 hover:bg-slate-50 text-slate-500"
                          : "hover:bg-rose-50/20"
                      }`}
                    >
                      {/* Kolom 1: Rekanan & PIC */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isAlreadyActive
                                ? "bg-slate-100 text-slate-600"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                              <span>{item.namaPerusahaan}</span>
                              {isAlreadyActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-200 text-slate-700">
                                  Sudah Diaktifkan
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{item.picName || "PIC Rekanan"}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                              {item.telepon && (
                                <a
                                  href={`tel:${item.telepon}`}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                  title="Hubungi via Telepon"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{item.telepon}</span>
                                </a>
                              )}
                              {item.email && (
                                <a
                                  href={`mailto:${item.email}`}
                                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                                  title="Kirim Email"
                                >
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>{item.email}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Cabang & Waktu Nonaktif */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-slate-50 text-slate-800 border-slate-300"
                          >
                            Cabang {item.cabang}
                          </Badge>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.parkedAt}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 3: Pemicu Penonaktifan */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="space-y-1">
                          {item.itemPemicuNama && (
                            <div className="text-xs font-semibold text-slate-800">
                              {item.itemPemicuKode && (
                                <span className="font-mono text-[10px] text-slate-500 mr-1 bg-slate-100 px-1 py-0.2 rounded">
                                  {item.itemPemicuKode}
                                </span>
                              )}
                              {item.itemPemicuNama}
                            </div>
                          )}
                          <p className="text-[11px] text-rose-700 bg-rose-50/70 p-1.5 rounded-lg border border-rose-100 leading-relaxed">
                            {item.alasan}
                          </p>
                        </div>
                      </td>

                      {/* Kolom 4: Status Mediasi */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1.5">
                          {item.statusAktif === "AKTIF_KEMBALI" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aktif Kembali
                            </span>
                          ) : item.statusDiskusi === "SEPAKAT" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Tercapai Kesepakatan
                            </span>
                          ) : item.statusDiskusi === "DALAM_DISKUSI" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <MessageSquare className="w-3 h-3 text-blue-600" />
                              Dalam Diskusi ({totalLogs}x)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Belum Dihubungi
                            </span>
                          )}

                          {latestLog && (
                            <div className="text-[10px] text-slate-500 italic truncate max-w-[170px]" title={latestLog.ringkasan}>
                              Terakhir: {latestLog.ringkasan}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Kolom 5: Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Tombol Catat Diskusi */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCatatDiskusi(item)}
                            className="h-8 text-xs font-semibold px-2.5 rounded-lg border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            title="Catat Notulensi / Hasil Diskusi Mediasi"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            <span>Catat Diskusi</span>
                          </Button>

                          {/* Tombol Aktifkan Kembali (Unpark) */}
                          {!isAlreadyActive && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setUnparkModalItem(item);
                                setUnparkReason("");
                              }}
                              className="h-8 text-xs font-semibold px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                              title="Buka status nonaktif dan pulihkan rekanan di cabang ini"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              <span>Aktifkan</span>
                            </Button>
                          )}

                          {/* Tombol Riwayat Lengkap */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setHistoryModalItem(item)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Lihat Rincian Riwayat Mediasi"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. MODAL CATAT HASIL DISKUSI
          ========================================================================= */}
      {diskusiModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Catat Hasil Diskusi / Mediasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    {diskusiModalItem.namaPerusahaan} • Cabang {diskusiModalItem.cabang}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDiskusiModalItem(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDiskusi} className="space-y-4">
              {/* Info Pemicu */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider block">
                  Pemicu Penonaktifan:
                </span>
                <p className="font-medium text-slate-900">
                  {diskusiModalItem.itemPemicuNama
                    ? `${diskusiModalItem.itemPemicuKode || ""} - ${diskusiModalItem.itemPemicuNama}`
                    : diskusiModalItem.alasan}
                </p>
              </div>

              {/* Grid Form Saluran & PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Saluran Komunikasi
                  </Label>
                  <select
                    value={saluranDiskusi}
                    onChange={(e) => setSaluranDiskusi(e.target.value as any)}
                    className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="TELEPON">Panggilan Telepon Langsung</option>
                    <option value="WHATSAPP">Komunikasi WhatsApp / Chat</option>
                    <option value="MEETING">Rapat Koordinasi Tatap Muka</option>
                    <option value="KUNJUNGAN">Kunjungan Lapangan / Workshop</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    PIC Kontraktor
                  </Label>
                  <Input
                    type="text"
                    value={picKontraktor}
                    onChange={(e) => setPicKontraktor(e.target.value)}
                    placeholder="Nama PIC Kontraktor..."
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  PIC Internal Alfamart
                </Label>
                <Input
                  type="text"
                  value={picInternal}
                  onChange={(e) => setPicInternal(e.target.value)}
                  placeholder="Nama PIC Internal..."
                  className="text-xs h-9"
                />
              </div>

              {/* Ringkasan Pembahasan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ringkasan Diskusi &amp; Kendala Lapangan *
                </Label>
                <Textarea
                  value={ringkasanDiskusi}
                  onChange={(e) => setRingkasanDiskusi(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan alasan keberatan harga rekanan, situasi lapangan, atau kendala rantai pasok..."
                  className="text-xs resize-none"
                  required
                />
              </div>

              {/* Solusi / Kesepakatan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kesepakatan / Solusi Lanjutan (Opsional)
                </Label>
                <Textarea
                  value={kesepakatanDiskusi}
                  onChange={(e) => setKesepakatanDiskusi(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Kontraktor menyepakati margin 15% jika pembayaran termin 1 dipercepat..."
                  className="text-xs resize-none"
                />
              </div>

              {/* Status Hasil Diskusi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Status Hasil Mediasi Ini
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      statusHasilDiskusi === "DALAM_DISKUSI"
                        ? "bg-blue-50/70 border-blue-500 font-bold text-blue-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusHasil"
                      value="DALAM_DISKUSI"
                      checked={statusHasilDiskusi === "DALAM_DISKUSI"}
                      onChange={() => setStatusHasilDiskusi("DALAM_DISKUSI")}
                      className="text-blue-600"
                    />
                    <span>Masih Dalam Diskusi</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      statusHasilDiskusi === "SEPAKAT"
                        ? "bg-emerald-50/70 border-emerald-500 font-bold text-emerald-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="statusHasil"
                      value="SEPAKAT"
                      checked={statusHasilDiskusi === "SEPAKAT"}
                      onChange={() => setStatusHasilDiskusi("SEPAKAT")}
                      className="text-emerald-600"
                    />
                    <span>Tercapai Kesepakatan (Siap Unpark)</span>
                  </label>
                </div>
              </div>

              {/* Footer Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDiskusiModalItem(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Simpan Catatan Diskusi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MODAL AKTIFKAN KEMBALI (UNPARK)
          ========================================================================= */}
      {unparkModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Aktifkan Kembali Rekanan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {unparkModalItem.namaPerusahaan} • Cabang {unparkModalItem.cabang}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan <strong>mencabut status penonaktifan sementara</strong> rekanan. Kontraktor akan kembali berhak menerima penawaran dan berpartisipasi dalam voting pekerjaan di Cabang {unparkModalItem.cabang}.
            </p>

            <form onSubmit={handleSubmitUnpark} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Alasan &amp; Dasar Pengaktifan Kembali *
                </Label>
                <Textarea
                  value={unparkReason}
                  onChange={(e) => setUnparkReason(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Telah tercapai kesepakatan tertulis mengenai penyesuaian koefisien dan komitmen penyelesaian pekerjaan..."
                  className="text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUnparkModalItem(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Konfirmasi Aktifkan Kembali
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL RIWAYAT DETAIL MEDIASI
          ========================================================================= */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Riwayat Mediasi &amp; Rekam Jejak
                  </h3>
                  <p className="text-xs text-slate-500">
                    {historyModalItem.namaPerusahaan} • Cabang {historyModalItem.cabang}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalItem(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ringkasan Pemicu */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider block">
                Catatan Penonaktifan:
              </span>
              <p className="font-medium text-slate-900">
                {historyModalItem.alasan}
              </p>
              <div className="text-[10px] text-slate-500 pt-1">
                Waktu Nonaktif: {historyModalItem.parkedAt}
              </div>
              {historyModalItem.statusAktif === "AKTIF_KEMBALI" && (
                <div className="pt-2 border-t border-slate-200 text-emerald-800 text-[11px] font-medium">
                  ✓ Diaktifkan kembali pada {historyModalItem.unparkedAt} oleh {historyModalItem.unparkedBy}:
                  <p className="italic text-slate-600 mt-0.5">"{historyModalItem.unparkReason}"</p>
                </div>
              )}
            </div>

            {/* Timeline Riwayat Diskusi */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Log Diskusi &amp; Mediasi ({historyModalItem.riwayatDiskusi?.length || 0})
              </h4>

              {(!historyModalItem.riwayatDiskusi || historyModalItem.riwayatDiskusi.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                  Belum ada log diskusi mediasi yang tercatat.
                </p>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {historyModalItem.riwayatDiskusi.map((log) => (
                    <div key={log.id} className="relative flex items-start gap-3 pl-1">
                      <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white text-blue-700 flex items-center justify-center shrink-0 text-xs shadow-2xs z-10">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">
                            {log.saluran} • {log.picInternal} &amp; {log.picKontraktor}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {log.tanggal}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {log.ringkasan}
                        </p>
                        {log.kesepakatan && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium mt-1.5">
                            <strong>Kesepakatan:</strong> {log.kesepakatan}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalItem(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
