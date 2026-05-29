"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Send, Plus, DollarSign, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import { 
  fetchDcParticipantTerms,
  addDcTermSchedule,
  submitDcTermClaim,
  type DcTermSchedule,
  type DcTermClaim
} from "@/lib/api";

export default function DcTerminPage() {
  const { id } = useParams() as { id: string };
  const { user } = useSession();
  
  const [schedules, setSchedules] = useState<DcTermSchedule[]>([]);
  const [claims, setClaims] = useState<DcTermClaim[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add Term Schedule Form
  const [termNo, setTermNo] = useState("");
  const [percentage, setPercentage] = useState("");
  const [amount, setAmount] = useState("");
  const [requirements, setRequirements] = useState("");
  const [addingSchedule, setAddingSchedule] = useState(false);

  // Submit Claim Form
  const [submittingClaim, setSubmittingClaim] = useState<number | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const participantId = Number(id);
      const res = await fetchDcParticipantTerms(participantId, { suppressGlobalError: true });
      setSchedules(res.data.schedules);
      setClaims(res.data.claims);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal memuat data termin", 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatRupiah = (amountStr: string | number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(amountStr));
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termNo || !percentage || !amount) return showMessage("Lengkapi form termin", 'error');
    
    setAddingSchedule(true);
    try {
      await addDcTermSchedule(Number(id), {
        term_no: Number(termNo),
        percentage: Number(percentage),
        amount: Number(amount),
        requirements,
        actor_email: user?.email,
      });
      showMessage("Jadwal termin berhasil ditambahkan", 'success');
      setTermNo(""); setPercentage(""); setAmount(""); setRequirements("");
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal menambah termin", 'error');
    } finally {
      setAddingSchedule(false);
    }
  };

  const handleSubmitClaim = async (termId: number, scheduleAmount: string) => {
    if (!confirm("Ajukan klaim pencairan untuk termin ini?")) return;
    
    setSubmittingClaim(termId);
    try {
      await submitDcTermClaim(termId, {
        claimed_amount: Number(scheduleAmount),
        actor_email: user?.email,
      });
      showMessage("Klaim pencairan berhasil diajukan", 'success');
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal mengajukan klaim", 'error');
    } finally {
      setSubmittingClaim(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#edf2f6] px-4 py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/dc-development/tenders`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Tender
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-800">Manajemen Termin Pembayaran</h1>
            <p className="text-sm text-slate-500 mt-1">Participant ID: {id}</p>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-blue-600" />
                Jadwal & Riwayat Termin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Termin</th>
                      <th className="px-6 py-4 font-semibold">Nominal</th>
                      <th className="px-6 py-4 font-semibold">Status Klaim</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedules.map((schedule) => {
                      const relatedClaim = claims.find(c => c.term_schedule_id === schedule.id);
                      
                      return (
                        <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">Termin {schedule.term_no}</div>
                            <div className="text-xs text-slate-500 mt-1">Bobot: {schedule.percentage}%</div>
                            {schedule.requirements && <div className="text-xs text-amber-600 mt-1">Syarat: {schedule.requirements}</div>}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {formatRupiah(schedule.amount)}
                          </td>
                          <td className="px-6 py-4">
                            {relatedClaim ? (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                relatedClaim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                relatedClaim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {relatedClaim.status}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Belum diklaim</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!relatedClaim && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => handleSubmitClaim(schedule.id, schedule.amount)}
                                disabled={submittingClaim === schedule.id}
                              >
                                {submittingClaim === schedule.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                                Ajukan Pencairan
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {schedules.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          Belum ada jadwal termin. Tambahkan di form samping.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white shadow-sm h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Tambah Jadwal Termin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Termin Ke-</Label>
                    <Input 
                      type="number"
                      min="1"
                      placeholder="Contoh: 1" 
                      value={termNo} 
                      onChange={e => setTermNo(e.target.value)} 
                      className="bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Bobot (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      placeholder="Contoh: 25" 
                      value={percentage} 
                      onChange={e => setPercentage(e.target.value)} 
                      className="bg-slate-50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Nominal Pencairan (Rp)</Label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Contoh: 150000000" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="bg-slate-50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Syarat Pencairan</Label>
                  <Textarea 
                    placeholder="Contoh: BAST 1 ditandatangani" 
                    value={requirements} 
                    onChange={e => setRequirements(e.target.value)} 
                    className="bg-slate-50 min-h-[80px]"
                  />
                </div>
                <Button type="submit" disabled={addingSchedule} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {addingSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Simpan Jadwal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
