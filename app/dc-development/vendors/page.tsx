"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import { createDcVendor, fetchDcVendors, type DcVendor } from "@/lib/api";

const serviceOptions = [
  { value: "SOIL_INVESTIGATION", label: "Soil Investigation" },
  { value: "PLANNER", label: "Konsultan Perencana" },
  { value: "SUPERVISOR_MK", label: "Konsultan Pengawas / MK" },
  { value: "CONTRACTOR", label: "Kontraktor" },
];

export default function DcVendorsPage() {
  const { user } = useSession();
  const [vendors, setVendors] = useState<DcVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [form, setForm] = useState({
    company_name: "",
    npwp: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
  });

  const loadVendors = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetchDcVendors({ suppressGlobalError: true });
      setVendors(res.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat vendor DC");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const toggleService = (value: string) => {
    setSelectedServices((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const submitVendor = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await createDcVendor({
        ...form,
        company_name: form.company_name.trim(),
        npwp: form.npwp.trim() || undefined,
        contact_name: form.contact_name.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        address: form.address.trim() || undefined,
        service_types: selectedServices,
        created_by_email: user?.email,
      });
      setForm({ company_name: "", npwp: "", contact_name: "", contact_email: "", contact_phone: "", address: "" });
      setSelectedServices([]);
      await loadVendors();
      setMessage("Vendor DC berhasil dibuat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat vendor DC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dc-development" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              DC Development
            </Link>
            <h1 className="mt-2 text-xl font-bold text-slate-800">Master Vendor</h1>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={loadVendors} disabled={loading}>
            <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{message}</div>}

        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          <Card className="rounded-lg bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Tambah Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitVendor} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input value={form.company_name} onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input value={form.npwp} onChange={(e) => setForm((prev) => ({ ...prev, npwp: e.target.value }))} />
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Kontak</Label>
                    <Input value={form.contact_name} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.contact_email} onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input value={form.contact_phone} onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Textarea value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="space-y-3">
                  <Label>Layanan</Label>
                  {serviceOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <Checkbox checked={selectedServices.includes(option.value)} onCheckedChange={() => toggleService(option.value)} />
                      {option.label}
                    </label>
                  ))}
                </div>
                <Button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-700 text-white hover:bg-blue-800">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Simpan Vendor
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-white">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-bold">Daftar Vendor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Perusahaan</th>
                      <th className="px-5 py-3">Kontak</th>
                      <th className="px-5 py-3">Layanan</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="px-5 py-4 font-bold">{vendor.company_name}</td>
                        <td className="px-5 py-4">
                          <div>{vendor.contact_name || "-"}</div>
                          <div className="text-xs text-slate-500">{vendor.contact_email || "-"}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{vendor.service_types?.join(", ") || "-"}</td>
                        <td className="px-5 py-4 text-blue-700">{vendor.status}</td>
                      </tr>
                    ))}
                    {loading && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!loading && vendors.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">Belum ada vendor DC.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
