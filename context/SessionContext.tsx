"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, CalendarDays, Clock3, LogOut, ShieldAlert } from 'lucide-react';
import { hasRegionalManagerRole, hasSuperHumanRole } from '@/lib/constants';
import { fetchSystemMaintenanceStatus, fetchSystemAccessSchedule, type SystemMaintenanceStatus, type SystemAccessSchedule } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface UserSession {
  email: string;
  cabang: string;
  role: string;
  namaLengkap: string;
  namaPt: string;
  alamatCabang: string;
  /** Array of roles (split by comma & uppercased) */
  roles: string[];
  /** true jika cabang === "HEAD OFFICE" */
  isHO: boolean;
  /** true jika jabatan === "BUILDING & MAINTENANCE SUPER HUMAN" — akses penuh ke semua cabang & aksi */
  isSuperHuman: boolean;
  /** true jika jabatan === "BUILDING & MAINTENANCE REGIONAL MANAGER" */
  isRegionalManager: boolean;
}

interface SessionContextValue {
  user: UserSession | null;
  isLoading: boolean;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Constants ───────────────────────────────────────────────────────────────
/** Routes that do NOT require authentication */
const PUBLIC_PATHS = ['/', '/auth', '/about', '/manual'];

/**
 * ============================================================================
 * [FALLBACK BATASAN WAKTU DAN HARI AKSES]
 * ============================================================================
 * Fallback jika API gagal membaca konfigurasi jadwal akses.
 * Konfigurasi sebenarnya dikelola melalui halaman Pemeliharaan Sistem.
 */
const FALLBACK_OPERATING_START_MINUTES = 6 * 60;
const FALLBACK_GENERAL_OPERATING_END_MINUTES = 24 * 60;
const FALLBACK_CONTRACTOR_OPERATING_END_MINUTES = 24 * 60;

const isContractorRole = (roles: string[]): boolean =>
  roles.some((role) => role.includes('KONTRAKTOR'));

const formatMinutesAsTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

function isWithinOperatingHours(roles: string[], schedule: SystemAccessSchedule | null): boolean {
  // Jika schedule tidak diaktifkan, izinkan akses
  if (!schedule || !schedule.is_enabled) {
    return true;
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const totalMinutes = now.getHours() * 60 + now.getMinutes();

  // Cek apakah hari ini adalah weekend (Sabtu/Minggu)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 1. BATASAN HARI
  if (isWeekend && !schedule.weekend_enabled) {
    return false;
  }
  if (!isWeekend && !schedule.weekday_enabled) {
    return false;
  }

  // 2. BATASAN WAKTU
  const isContractor = isContractorRole(roles);
  const startMinutes = isContractor ? schedule.contractor_start_minutes : schedule.general_start_minutes;
  const endMinutes = isContractor ? schedule.contractor_end_minutes : schedule.general_end_minutes;

  return totalMinutes >= startMinutes && totalMinutes < endMinutes;
}

function getOperatingHoursLabel(roles: string[], schedule: SystemAccessSchedule | null): string {
  if (!schedule) {
    const start = formatMinutesAsTime(FALLBACK_OPERATING_START_MINUTES);
    const end = formatMinutesAsTime(
      isContractorRole(roles) ? FALLBACK_CONTRACTOR_OPERATING_END_MINUTES : FALLBACK_GENERAL_OPERATING_END_MINUTES
    );
    return `${start} - ${end}`;
  }

  const isContractor = isContractorRole(roles);
  const start = formatMinutesAsTime(isContractor ? schedule.contractor_start_minutes : schedule.general_start_minutes);
  const end = formatMinutesAsTime(isContractor ? schedule.contractor_end_minutes : schedule.general_end_minutes);
  return `${start} - ${end}`;
}

function getDayAccessLabel(schedule: SystemAccessSchedule | null): string {
  if (!schedule || !schedule.is_enabled) {
    return 'Setiap hari';
  }

  if (schedule.weekday_enabled && schedule.weekend_enabled) {
    return 'Setiap hari';
  }
  if (schedule.weekday_enabled && !schedule.weekend_enabled) {
    return 'Senin – Jumat';
  }
  if (!schedule.weekday_enabled && schedule.weekend_enabled) {
    return 'Sabtu – Minggu';
  }
  return 'Tidak ada akses';
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTimeBlocked, setIsTimeBlocked] = useState(false);
  const [isMaintenanceBlocked, setIsMaintenanceBlocked] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<SystemMaintenanceStatus | null>(null);
  const [accessSchedule, setAccessSchedule] = useState<SystemAccessSchedule | null>(null);

  const logout = useCallback(() => {
    sessionStorage.clear();
    setUser(null);
    setIsTimeBlocked(false);
    setIsMaintenanceBlocked(false);
    setMaintenanceStatus(null);
    setAccessSchedule(null);
    router.push('/');
  }, [router]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith('/auth')
    );

    if (isPublic) {
      setIsLoading(false);
      setIsTimeBlocked(false);
      setIsMaintenanceBlocked(false);
      setMaintenanceStatus(null);
      setAccessSchedule(null);
      return () => {
        ignore = true;
      };
    }

    // Read session data
    const authenticated = sessionStorage.getItem('authenticated') === 'true';
    const role = sessionStorage.getItem('userRole') || '';
    const email = sessionStorage.getItem('loggedInUserEmail') || '';
    const cabang = sessionStorage.getItem('loggedInUserCabang') || '';
    const namaLengkap =
      sessionStorage.getItem('nama_lengkap') || email.split('@')[0];
    const namaPt = sessionStorage.getItem('nama_pt') || '';
    const alamatCabang = sessionStorage.getItem('alamat_cabang') || '';

    // If not authenticated → redirect to login
    if (!authenticated || !role) {
      router.push('/auth');
      return () => {
        ignore = true;
      };
    }

    const isHO = cabang.trim().toUpperCase() === 'HEAD OFFICE';
    const roles = role
      .split(',')
      .map((r: string) => r.trim().toUpperCase())
      .filter(Boolean);

    const isSuperHuman = hasSuperHumanRole(roles);
    const isRegionalManager = hasRegionalManagerRole(roles);

    const sessionUser: UserSession = {
      email,
      cabang,
      role,
      namaLengkap,
      namaPt,
      alamatCabang,
      roles,
      isHO,
      isSuperHuman,
      isRegionalManager,
    };

    const hydrateSession = async () => {
      let nextMaintenanceStatus: SystemMaintenanceStatus | null = null;
      let nextMaintenanceBlocked = false;
      let nextAccessSchedule: SystemAccessSchedule | null = null;

      if (!isSuperHuman) {
        try {
          const [maintenanceResult, scheduleResult] = await Promise.all([
            fetchSystemMaintenanceStatus({ suppressGlobalError: true }),
            fetchSystemAccessSchedule({ suppressGlobalError: true }),
          ]);
          nextMaintenanceStatus = maintenanceResult.data;
          nextMaintenanceBlocked = Boolean(maintenanceResult.data?.is_active);
          nextAccessSchedule = scheduleResult.data;
        } catch (error) {
          console.warn('Gagal membaca status sistem:', error);
        }
      }

      if (ignore) return;

      setUser(sessionUser);
      setMaintenanceStatus(nextMaintenanceStatus);
      setIsMaintenanceBlocked(nextMaintenanceBlocked);
      setAccessSchedule(nextAccessSchedule);
      setIsTimeBlocked(!isSuperHuman && !isWithinOperatingHours(roles, nextAccessSchedule));
      setIsLoading(false);
    };

    hydrateSession();

    return () => {
      ignore = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!user) return;

    const refreshSystemStatus = async () => {
      try {
        const [maintenanceResult, scheduleResult] = await Promise.all([
          fetchSystemMaintenanceStatus({ suppressGlobalError: true }),
          fetchSystemAccessSchedule({ suppressGlobalError: true }),
        ]);
        setMaintenanceStatus(maintenanceResult.data);
        setIsMaintenanceBlocked(Boolean(maintenanceResult.data?.is_active && !user.isSuperHuman));
        setAccessSchedule(scheduleResult.data);
        setIsTimeBlocked(!user.isSuperHuman && !isWithinOperatingHours(user.roles, scheduleResult.data));
      } catch (error) {
        console.warn('Gagal membaca status sistem:', error);
      }
    };

    refreshSystemStatus();
    const timer = window.setInterval(refreshSystemStatus, 15_000);
    return () => window.clearInterval(timer);
  }, [user]);

  if (!isLoading && isMaintenanceBlocked && user) {
    return <MaintenanceBlockedScreen user={user} onLogout={logout} status={maintenanceStatus} />;
  }

  // Show time-blocked screen instead of children
  if (!isLoading && isTimeBlocked && user) {
    return <TimeBlockedScreen user={user} onLogout={logout} schedule={accessSchedule} />;
  }

  return (
    <SessionContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession() must be called inside <SessionProvider>');
  }
  return ctx;
}

// ─── Time Blocked UI ─────────────────────────────────────────────────────────
function MaintenanceBlockedScreen({
  user,
  onLogout,
  status,
}: {
  user: UserSession;
  onLogout: () => void;
  status: SystemMaintenanceStatus | null;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily:
          "var(--font-sans, 'Inter', system-ui, -apple-system, sans-serif)",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 24px 70px rgba(15,23,42,0.12)',
          padding: '2rem',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '0.8rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#b91c1c"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h3m-6.5 5h10m-8.5 5h7m-9-13h11a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: '0.5rem',
            letterSpacing: '0',
          }}
        >
          {status?.title || 'Sistem sedang dalam pemeliharaan'}
        </h1>

        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
          {status?.message || 'Akses sementara dibatasi agar pembaruan dapat berjalan stabil. Silakan kembali beberapa saat lagi.'}
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            color: '#64748b',
          }}
        >
          <p style={{ marginBottom: '0.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
            Sesi pengguna
          </p>
          <p style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>{user.namaLengkap}</p>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>{user.cabang}</p>
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: '0.8rem 1.5rem',
            background: '#991b1b',
            color: '#ffffff',
            border: '1px solid #991b1b',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Keluar
        </button>
      </div>
    </div>
  );
}

function TimeBlockedScreen({
  user,
  onLogout,
  schedule,
}: {
  user: UserSession;
  onLogout: () => void;
  schedule: SystemAccessSchedule | null;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const operatingHoursLabel = getOperatingHoursLabel(user.roles, schedule);
  const dayAccessLabel = getDayAccessLabel(schedule);
  const [openTime, closeTime] = operatingHoursLabel.split(' - ');
  const currentTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const currentDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-900">
      <div className="absolute inset-x-0 top-0 h-2 bg-red-600" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-[920px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.14)]">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative border-b border-slate-200 bg-slate-950 p-6 text-white md:border-b-0 md:border-r">
              <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">SPARTA Building</p>
                  <p className="text-sm font-black text-white">Access Control</p>
                </div>
              </div>

              <div className="mt-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-100">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Di luar jam operasional
                </div>
                <h1 className="mt-5 text-3xl font-black leading-tight text-white">Akses belum dibuka</h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                  Akun Anda tetap aktif. Silakan masuk kembali saat jadwal operasional dibuka.
                </p>
              </div>

              <div className="mt-10 rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Sesi pengguna</p>
                <p className="mt-2 text-sm font-black text-white">{user.namaLengkap}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{user.cabang || 'Cabang tidak tersedia'}</p>
              </div>
            </aside>

            <main className="p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Jadwal Akses</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Operasional Sistem</h2>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-400">WIB</p>
                  <p className="font-mono text-sm font-black text-slate-900">{currentTime}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <Clock3 className="h-4 w-4 text-emerald-600" />
                    Mulai
                  </div>
                  <p className="mt-3 font-mono text-3xl font-black text-slate-950">{openTime || '--:--'}</p>
                </div>
                <div className="rounded-md border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-red-500">
                    <Clock3 className="h-4 w-4" />
                    Selesai
                  </div>
                  <p className="mt-3 font-mono text-3xl font-black text-red-700">{closeTime || '--:--'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{dayAccessLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">{currentDate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">
                Aktivitas kontraktor dibatasi sesuai jadwal yang ditentukan tim Building. Data pekerjaan Anda aman dan dapat dilanjutkan saat akses dibuka.
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Butuh akses di luar jadwal? Hubungi admin Building cabang.
                </p>
                <button
                  onClick={onLogout}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-black text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </main>
          </div>
        </section>
      </div>
    </div>
  );
}
