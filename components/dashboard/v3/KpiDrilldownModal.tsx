import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, Building2, UserCheck, Users, FileText, CheckCircle2, Clock, X, CircleDollarSign, Loader2, AlertTriangle, TimerReset, ReceiptText, CalendarDays } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import type { PerformanceCardType, PerformanceDrilldownItem } from "@/lib/api/performance-v3";
import { fetchPerformanceDrilldown } from "@/lib/api/performance-v3";

interface KpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: PerformanceCardType | null;
  kpiTitle: string;
  actorRole: string;
  actorCabang: string;
  cabangFilter: string;
  coordinatorFilter: string;
  supportFilter: string;
  availableCoordinators?: string[];
  availableSupports?: string[];
}

type DrilldownStep = "select_role" | "select_doc" | "select_name" | "list_ulok";

const ROLE_OPTIONS = [
  { id: "coord", label: "Koordinator", icon: UserCheck, tone: "text-sky-700 bg-sky-50 border-sky-200" },
  { id: "manager", label: "B&M Manager", icon: Users, tone: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { id: "bm", label: "Branch Manager", icon: Building2, tone: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  { id: "support", label: "Support Building", icon: FileText, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" }
];

const DOC_OPTIONS = [
  { id: "rab", label: "RAB", icon: ReceiptText },
  { id: "ktk", label: "Opname Final (KTK)", icon: CircleDollarSign },
];

export function KpiDrilldownModal({
  isOpen,
  onClose,
  kpiType,
  kpiTitle,
  actorRole,
  actorCabang,
  cabangFilter,
  coordinatorFilter,
  supportFilter,
  availableCoordinators = [],
  availableSupports = []
}: KpiDrilldownModalProps) {
  const [step, setStep] = useState<DrilldownStep>("select_role");
  
  // Selection States
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  
  // Data States
  const [data, setData] = useState<PerformanceDrilldownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUlok, setSelectedUlok] = useState<PerformanceDrilldownItem | null>(null);

  // Initialize flow based on card type
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state
    setSelectedRole(null);
    setSelectedDoc(null);
    setSelectedName(null);
    setSelectedUlok(null);
    setData([]);
    
    // Determine starting step based on Card Type & Actor Role
    if (kpiType === "sla") {
      setStep("select_role"); // SLA starts by selecting role
    } else if (kpiType === "ketepatan_st" || kpiType === "sla_ktk") {
      setStep("select_name");
      setSelectedRole("support"); // Forced to support
    } else {
      setStep("select_role"); // Cost, JHK, Denda, KTK can be coord/support
    }
    
    // Auto-skip logic for Support/Coord users can be added here
    if (actorRole.includes("SUPPORT")) {
      setSelectedRole("support");
      setSelectedName("SELF");
      setStep(kpiType === "sla" ? "select_doc" : "list_ulok");
    }
  }, [isOpen, kpiType, actorRole]);

  // Fetch data when reaching list_ulok step
  useEffect(() => {
    if (step === "list_ulok" && isOpen) {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetchPerformanceDrilldown({
            actor_cabang: actorCabang,
            cabang: cabangFilter,
            coordinator: coordinatorFilter,
            support: supportFilter,
            card_type: kpiType,
            sla_role: selectedRole as any,
            sla_doc: selectedDoc as any,
            person_role: selectedRole as any,
            person_name: selectedName || undefined,
            page: 1,
            limit: 50
          });
          setData(res.data || []);
        } catch (err: any) {
          setError(err.message || "Gagal memuat data ULOK.");
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [step, isOpen, kpiType, actorCabang, cabangFilter, coordinatorFilter, supportFilter, selectedRole, selectedDoc, selectedName]);

  const goBack = () => {
    if (step === "list_ulok") {
      if (kpiType === "sla") setStep("select_doc");
      else setStep("select_name");
    } else if (step === "select_name" || step === "select_doc") {
      setStep("select_role");
    }
  };

  const renderSelectRole = () => {
    let availableRoles = ROLE_OPTIONS;
    if (kpiType === "sla") {
      availableRoles = ROLE_OPTIONS.filter(r => r.id !== "support");
    } else if (kpiType === "ketepatan_st" || kpiType === "sla_ktk") {
      availableRoles = ROLE_OPTIONS.filter(r => r.id === "support");
    } else {
      availableRoles = ROLE_OPTIONS.filter(r => r.id === "coord" || r.id === "support");
    }

    const isSupport = actorRole.toUpperCase().includes("SUPPORT") || actorRole.toUpperCase().includes("PENGAWAS");
    const isManager = actorRole.toUpperCase().includes("MANAGER") || actorRole.toUpperCase().includes("DIREKTUR") || actorRole.toUpperCase().includes("SUPER") || actorCabang.toUpperCase() === "HEAD OFFICE";
    const isCoordinator = !isManager && !isSupport && (actorRole.toUpperCase().includes("KOORDINATOR") || actorRole.toUpperCase().includes("COORD"));

    if (isSupport) {
      availableRoles = availableRoles.filter(r => r.id === "support");
    } else if (isCoordinator) {
      availableRoles = availableRoles.filter(r => r.id === "coord");
    }

    return (
      <div className="p-8">
        <h3 className="mb-6 text-lg font-extrabold text-slate-800">Pilih Role Evaluasi</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableRoles.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRole(r.id);
                setStep(kpiType === "sla" ? "select_doc" : "select_name");
              }}
              className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md", r.tone)}
            >
              <r.icon className="h-10 w-10" />
              <span className="font-bold">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectDoc = () => (
    <div className="p-8">
      <h3 className="mb-6 text-lg font-extrabold text-slate-800">Pilih Tipe Dokumen ({ROLE_OPTIONS.find(r => r.id === selectedRole)?.label})</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_OPTIONS.map(d => (
          <button
            key={d.id}
            onClick={() => {
              setSelectedDoc(d.id);
              setStep("list_ulok");
            }}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-red-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <d.icon className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-700">{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSelectName = () => {
    let nameList: string[] = [];
    if (selectedRole === "coord") {
      nameList = [...availableCoordinators];
    } else if (selectedRole === "support") {
      nameList = [...availableSupports];
    } else {
      nameList = ["SEMUA PERSONIL"];
    }

    if (nameList.length === 0) {
      nameList = ["SEMUA PERSONIL"];
    }

    // Filter out duplicates and empty strings
    nameList = Array.from(new Set(nameList)).filter(Boolean);

    return (
      <div className="p-8">
        <h3 className="mb-6 text-lg font-extrabold text-slate-800">Pilih Personil ({ROLE_OPTIONS.find(r => r.id === selectedRole)?.label})</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[60vh] overflow-y-auto pr-2">
          {nameList.map((name, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedName(name === "SEMUA PERSONIL" ? null : name);
                setStep("list_ulok");
              }}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span className="truncate">{name}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderListUlok = () => (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">ULOK</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Nilai KPI</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedUlok(item)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-red-50/50",
                      selectedUlok?.nomor_ulok === item.nomor_ulok && "bg-red-50"
                    )}
                  >
                    <td className="px-4 py-4">
                      <p className="font-extrabold text-slate-900">{item.nomor_ulok}</p>
                      <p className="text-xs font-medium text-slate-500">{item.nama_toko}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{item.cabang}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                        {item.value_label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ChevronRight className="inline-block h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">Tidak ada data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // CONTEXTUAL DETAIL RENDERER (Crucial requirement)
  const renderDetailPane = () => {
    if (!selectedUlok) return null;
    
    return (
      <aside className="fixed inset-y-0 right-0 z-[110] flex h-[100svh] w-full max-w-lg flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Detail Informasi</p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedUlok.nomor_ulok}</h3>
              <p className="text-sm font-semibold text-slate-600">{selectedUlok.nama_toko}</p>
            </div>
            <button onClick={() => setSelectedUlok(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {kpiType === "sla" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="mb-4 text-sm font-extrabold text-slate-800">Timeline Approval {DOC_OPTIONS.find(d=>d.id===selectedDoc)?.label}</h4>
              {/* Timeline mockup */}
              <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-500">Dokumen Dibuat</p>
                  <p className="font-semibold text-slate-900">12 Aug 2026</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-red-500 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-500">Approved {ROLE_OPTIONS.find(r=>r.id===selectedRole)?.label}</p>
                  <p className="font-semibold text-slate-900">15 Aug 2026</p>
                  <p className="mt-1 text-xs font-bold text-red-600 bg-red-50 inline-block px-2 py-1 rounded">Bottleneck: 3 Hari</p>
                </div>
              </div>
            </div>
          )}

          {kpiType === "cost_m2" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-800">Breakdown Finansial & Luas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Grand Total RAB</p>
                  <p className="font-extrabold text-slate-900">Rp 150.000.000</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Luas Bangunan</p>
                  <p className="font-extrabold text-slate-900">120 m2</p>
                </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-2">
                <p className="text-xs font-bold text-emerald-700">Cost per m2</p>
                <p className="text-2xl font-black text-emerald-800">Rp 1.250.000</p>
              </div>
            </div>
          )}

          {(kpiType === "kerja_tambah" || kpiType === "kerja_kurang") && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-800">Deviasi Final RAB vs Opname</h4>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-500">RAB Approved</p>
                  <p className="font-semibold text-slate-700">Rp 100.000.000</p>
                </div>
                <ChevronRight className="text-slate-300" />
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">Opname Final</p>
                  <p className="font-semibold text-slate-700">Rp 115.000.000</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-xs font-bold text-red-700">Kerja Tambah (Deviasi)</p>
                <p className="text-xl font-black text-red-800">+ Rp 15.000.000</p>
              </div>
            </div>
          )}

          {/* Fallback for others */}
          {kpiType !== "sla" && kpiType !== "cost_m2" && kpiType !== "kerja_tambah" && kpiType !== "kerja_kurang" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-extrabold text-slate-800 mb-2">Detail Metadata</h4>
              <pre className="text-xs text-slate-500 bg-slate-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(selectedUlok.detail, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[85vh] h-[85vh] max-w-5xl flex-col overflow-hidden border-slate-200 bg-slate-50/50 p-0 shadow-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              {step !== "select_role" && (
                <button onClick={goBack} className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle className="text-xl font-extrabold text-slate-900">
                Drilldown: {kpiTitle}
              </DialogTitle>
            </div>
            
            {/* Breadcrumb Steps */}
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className={cn(step === "select_role" ? "text-red-600" : (selectedRole ? "text-slate-700" : ""))}>Role</span>
              <ChevronRight className="h-3 w-3" />
              {kpiType === "sla" ? (
                <>
                  <span className={cn(step === "select_doc" ? "text-red-600" : (selectedDoc ? "text-slate-700" : ""))}>Dokumen</span>
                  <ChevronRight className="h-3 w-3" />
                </>
              ) : (
                <>
                  <span className={cn(step === "select_name" ? "text-red-600" : (selectedName ? "text-slate-700" : ""))}>Personil</span>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className={cn(step === "list_ulok" ? "text-red-600" : "")}>List ULOK</span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {step === "select_role" && renderSelectRole()}
            {step === "select_doc" && renderSelectDoc()}
            {step === "select_name" && renderSelectName()}
            {step === "list_ulok" && renderListUlok()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Slide Over */}
      {selectedUlok && (
        <div className="fixed inset-0 z-[100] isolate overflow-hidden">
          <button className="absolute inset-0 z-0 bg-slate-950/25 backdrop-blur-sm" onClick={() => setSelectedUlok(null)} />
          {renderDetailPane()}
        </div>
      )}
    </>
  );
}
