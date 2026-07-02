"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const now = new Date();
  const operatingHoursLabel = getOperatingHoursLabel(user.roles, schedule);
  const dayAccessLabel = getDayAccessLabel(schedule);
  const currentTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
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
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        {/* Clock Icon */}
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="none"
            viewBox="0 0 24 24"
            stroke="rgba(248,113,113,1)"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f1f5f9',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em',
          }}
        >
          Akses Terbatas
        </h1>

        <p style={{ color: '#94a3b8', marginBottom: '0.25rem', fontSize: '0.9375rem' }}>
          Halo,{' '}
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
            {user.namaLengkap}
          </span>{' '}
          ({user.cabang})
        </p>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          Aplikasi SPARTA Building hanya dapat diakses pada jam operasional.
        </p>

        {/* Time Box */}
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '1rem',
            padding: '1.5rem 2rem',
            marginBottom: '1.25rem',
            backdropFilter: 'blur(12px)',
          }}
        >
          <p
            style={{
              color: '#f87171',
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontSize: '2.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              marginBottom: '0.25rem',
            }}
          >
            {operatingHoursLabel}
          </p>
          <p style={{ color: '#475569', fontSize: '0.75rem' }}>
            {dayAccessLabel} &nbsp;|&nbsp; WIB
          </p>
        </div>

        {/* Current time */}
        <p style={{ color: '#475569', fontSize: '0.8125rem', marginBottom: '2rem' }}>
          Waktu saat ini:{' '}
          <span
            style={{
              color: '#94a3b8',
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontWeight: 600,
            }}
          >
            {currentTime}
          </span>{' '}
          WIB
        </p>

        {/* Logout button */}
        <button
          onClick={onLogout}
          style={{
            padding: '0.75rem 2rem',
            background: 'rgba(51,65,85,0.8)',
            color: '#e2e8f0',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '0.75rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLButtonElement).style.background = 'rgba(71,85,105,0.9)')
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLButtonElement).style.background = 'rgba(51,65,85,0.8)')
          }
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
