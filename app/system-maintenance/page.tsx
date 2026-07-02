"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { useSession } from "@/context/SessionContext";
import {
  fetchSystemMaintenanceStatus,
  updateSystemMaintenanceStatus,
  fetchSystemAccessSchedule,
  updateSystemAccessSchedule,
  type SystemMaintenanceStatus,
  type SystemAccessSchedule,
} from "@/lib/api";
import { AlertTriangle, CheckCircle2, Clock, Loader2, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";

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

const formatMinutesAsTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export default function SystemMaintenancePage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { showAlert } = useGlobalAlert();
  const [maintenanceStatus, setMaintenanceStatus] = useState<SystemMaintenanceStatus | null>(null);
  const [accessSchedule, setAccessSchedule] = useState<SystemAccessSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Form state untuk schedule
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [weekdayEnabled, setWeekdayEnabled] = useState(true);
  const [weekendEnabled, setWeekendEnabled] = useState(false);
  const [generalStartTime, setGeneralStartTime] = useState("06:00");
  const [generalEndTime, setGeneralEndTime] = useState("24:00");
  const [contractorStartTime, setContractorStartTime] = useState("06:00");
  const [contractorEndTime, setContractorEndTime] = useState("24:00");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [maintenanceResult, scheduleResult] = await Promise.all([
        fetchSystemMaintenanceStatus({ suppressGlobalError: true }),
        fetchSystemAccessSchedule({ suppressGlobalError: true }),
      ]);
      setMaintenanceStatus(maintenanceResult.data);
      setAccessSchedule(scheduleResult.data);

      // Populate form dengan data dari API
      const schedule = scheduleResult.data;
      setScheduleEnabled(schedule.is_enabled);
      setWeekdayEnabled(schedule.weekday_enabled);
      setWeekendEnabled(schedule.weekend_enabled);
      setGeneralStartTime(formatMinutesAsTime(schedule.general_start_minutes));
      setGeneralEndTime(formatMinutesAsTime(schedule.general_end_minutes));
      setContractorStartTime(formatMinutesAsTime(schedule.contractor_start_minutes));
      setContractorEndTime(formatMinutesAsTime(schedule.contractor_end_minutes));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat status sistem.";
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

  const setMaintenanceActive = async (nextActive: boolean) => {
    if (savingMaintenance) return;
    setSavingMaintenance(true);
    try {
      const result = await updateSystemMaintenanceStatus(nextActive, { suppressGlobalError: true });
      setMaintenanceStatus(result.data);
      showAlert({
        title: nextActive ? "Pemeliharaan Diaktifkan" : "Pemeliharaan Dinonaktifkan",
        message: result.message,
        type: nextActive ? "warning" : "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Status pemeliharaan gagal diperbarui.";
      showAlert({ title: "Perubahan Gagal", message, type: "error" });
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (savingSchedule) return;

    // Validasi client-side
    const generalStart = parseTimeToMinutes(generalStartTime);
    const generalEnd = parseTimeToMinutes(generalEndTime);
    const contractorStart = parseTimeToMinutes(contractorStartTime);
    const contractorEnd = parseTimeToMinutes(contractorEndTime);

    if (scheduleEnabled && !weekdayEnabled && !weekendEnabled) {
      showAlert({
        title: "Validasi Gagal",
        message: "Minimal satu hari akses harus diaktifkan jika jadwal akses diaktifkan.",
        type: "error",
      });
      return;
    }

    if (generalStart >= generalEnd && generalEnd !== 1440) {
      showAlert({
        title: "Validasi Gagal",
        message: "Jam mulai akses umum harus lebih kecil dari jam selesai.",
        type: "error",
      });
      return;
    }

    if (contractorStart >= contractorEnd && contractorEnd !== 1440) {
      showAlert({
        title: "Validasi Gagal",
        message: "Jam mulai akses kontraktor harus lebih kecil dari jam selesai.",
        type: "error",
      });
      return;
    }

    setSavingSchedule(true);
    try {
      const result = await updateSystemAccessSchedule(
        {
          is_enabled: scheduleEnabled,
          weekday_enabled: weekdayEnabled,
          weekend_enabled: weekendEnabled,
          general_start_minutes: generalStart,
          general_end_minutes: generalEnd,
          contractor_start_minutes: contractorStart,
          contractor_end_minutes: contractorEnd,
        },
        { suppressGlobalError: true }
      );
      setAccessSchedule(result.data);
      showAlert({
        title: "Jadwal Akses Diperbarui",
        message: result.message,
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Jadwal akses gagal diperbarui.";
      showAlert({ title: "Perubahan Gagal", message, type: "error" });
    } finally {
      setSavingSchedule(false);
    }
  };

  const isMaintenanceActive = Boolean(maintenanceStatus?.is_active);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <AppNavbar title="KONTROL SISTEM" showBackButton backHref="/dashboard" showBuildingLogo />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Kontrol akses aplikasi</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950">Pemeliharaan & Jadwal Akses</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Kelola mode pemeliharaan sistem dan atur jam akses aplikasi untuk user umum dan kontraktor.
            </p>
          </div>
          <Button variant="outline" onClick={loadStatus} disabled={loading || savingMaintenance || savingSchedule} className="h-10 rounded-lg border-slate-200 bg-white shadow-sm">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid gap-5">
          {/* Panel 1: Mode Pemeliharaan Sistem */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${isMaintenanceActive ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {isMaintenanceActive ? <LockKeyhole className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <Badge className={`rounded-md border px-2.5 py-1 text-[11px] font-black ${isMaintenanceActive ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {isMaintenanceActive ? "AKTIF" : "NORMAL"}
                </Badge>
                <h2 className="mt-3 text-lg font-black text-slate-950">Mode Pemeliharaan Sistem</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isMaintenanceActive
                    ? "Akses pengguna sedang dibatasi. Pengguna umum akan melihat layar pembatasan akses."
                    : "Aplikasi berjalan normal sesuai jadwal akses yang dikonfigurasi."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Template pesan pengguna</p>
              <div>
                <p className="text-sm font-black text-slate-900">{maintenanceStatus?.title || "Sistem sedang dalam pemeliharaan"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {maintenanceStatus?.message || "Akses sementara dibatasi agar pembaruan dapat berjalan stabil. Silakan kembali beberapa saat lagi."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                disabled={loading || savingMaintenance || isMaintenanceActive}
                onClick={() => setMaintenanceActive(true)}
                className="h-11 rounded-lg bg-red-700 px-5 font-black text-white hover:bg-red-800"
              >
                {savingMaintenance && !isMaintenanceActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                Aktifkan Pemeliharaan
              </Button>
              <Button
                type="button"
                disabled={loading || savingMaintenance || !isMaintenanceActive}
                onClick={() => setMaintenanceActive(false)}
                variant="outline"
                className="h-11 rounded-lg border-emerald-200 bg-white px-5 font-black text-emerald-700 hover:bg-emerald-50"
              >
                {savingMaintenance && isMaintenanceActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Nonaktifkan
              </Button>
            </div>

            <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Informasi status</p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold text-slate-400">Terakhir diperbarui</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatDateTime(maintenanceStatus?.updated_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-slate-400">Operator terakhir</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-800">{maintenanceStatus?.updated_by_email || "-"}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Panel 2: Jadwal Akses Aplikasi */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-950">Jadwal Akses Aplikasi</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Atur jam akses aplikasi untuk user umum dan kontraktor. Pengelola sistem dapat akses kapan saja.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <Label htmlFor="schedule-enabled" className="text-sm font-bold text-slate-900">Aktifkan Jadwal Akses</Label>
                  <p className="mt-1 text-xs text-slate-500">Jika dinonaktifkan, aplikasi dapat diakses sepanjang waktu.</p>
                </div>
                <Switch id="schedule-enabled" checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} disabled={loading || savingSchedule} />
              </div>

              {scheduleEnabled && (
                <>
                  <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Hari akses</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                        <Switch id="weekday-enabled" checked={weekdayEnabled} onCheckedChange={setWeekdayEnabled} disabled={loading || savingSchedule} />
                        <Label htmlFor="weekday-enabled" className="cursor-pointer text-sm font-semibold text-slate-900">Senin – Jumat</Label>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                        <Switch id="weekend-enabled" checked={weekendEnabled} onCheckedChange={setWeekendEnabled} disabled={loading || savingSchedule} />
                        <Label htmlFor="weekend-enabled" className="cursor-pointer text-sm font-semibold text-slate-900">Sabtu – Minggu</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-4">Jam akses user umum</p>
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor="general-start" className="text-xs font-bold text-slate-900">Jam Mulai</Label>
                          <Input id="general-start" type="time" value={generalStartTime} onChange={(e) => setGeneralStartTime(e.target.value)} disabled={loading || savingSchedule} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="general-end" className="text-xs font-bold text-slate-900">Jam Selesai</Label>
                          <Input id="general-end" type="time" value={generalEndTime} onChange={(e) => setGeneralEndTime(e.target.value)} disabled={loading || savingSchedule} className="mt-1" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-4">Jam akses kontraktor</p>
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor="contractor-start" className="text-xs font-bold text-slate-900">Jam Mulai</Label>
                          <Input id="contractor-start" type="time" value={contractorStartTime} onChange={(e) => setContractorStartTime(e.target.value)} disabled={loading || savingSchedule} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="contractor-end" className="text-xs font-bold text-slate-900">Jam Selesai</Label>
                          <Input id="contractor-end" type="time" value={contractorEndTime} onChange={(e) => setContractorEndTime(e.target.value)} disabled={loading || savingSchedule} className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="button"
                onClick={handleSaveSchedule}
                disabled={loading || savingSchedule}
                className="h-11 rounded-lg bg-blue-700 px-5 font-black text-white hover:bg-blue-800"
              >
                {savingSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Simpan Jadwal Akses
              </Button>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-3">Informasi jadwal</p>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold text-slate-400">Terakhir diperbarui</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{formatDateTime(accessSchedule?.updated_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-slate-400">Operator terakhir</dt>
                    <dd className="mt-1 break-words font-semibold text-slate-800">{accessSchedule?.updated_by_email || "-"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
