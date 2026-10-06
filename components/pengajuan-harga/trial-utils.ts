// =============================================================================
// components/pengajuan-harga/trial-utils.ts
// Helper Kalkulasi Masa Aktif Trial 3 Bulan & Status Evaluasi "Perlu Tindakan"
// =============================================================================

import { PengajuanHargaItem } from './types';

export const DEFAULT_TRIAL_DURATION_DAYS = 90; // Standar 3 Bulan
export const WARNING_THRESHOLD_DAYS = 14; // Ambang batas 14 hari menuju "Perlu Tindakan"

/**
 * Menghitung sisa hari masa aktif trial
 * @param startDateStr Tanggal mulai trial (format: YYYY-MM-DD)
 * @param durationDays Total durasi dalam hari (default: 90 hari / 3 bulan)
 * @returns Jumlah sisa hari (bisa bernilai negatif jika sudah lewat batas)
 */
export function calculateRemainingTrialDays(
  startDateStr?: string,
  durationDays: number = DEFAULT_TRIAL_DURATION_DAYS
): number {
  if (!startDateStr) return durationDays;

  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return durationDays;

  // Tanggal berakhir = tanggal mulai + durasi hari
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  const today = new Date();
  // Normalisasi waktu ke jam 00:00:00 untuk komparasi tanggal murni
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Mengecek apakah item trial telah mendekati atau melewati masa 3 bulan
 * sehingga memerlukan tindakan evaluasi lanjut oleh S&B Specialist
 */
export function isTrialActionRequired(remainingDays: number): boolean {
  return remainingDays <= WARNING_THRESHOLD_DAYS;
}

export interface TrialBadgeInfo {
  remainingDays: number;
  isActionRequired: boolean;
  isExpired: boolean;
  label: string;
  badgeClass: string;
  dotColorClass: string;
  statusText: string;
}

/**
 * Mengembalikan informasi visual badge durasi dan urgensi tindakan trial
 */
export function getTrialBadgeInfo(item: PengajuanHargaItem): TrialBadgeInfo {
  // Jika sedang dalam proses promosi berjenjang
  if (item.status === 'TRIAL_PROMOSI_BM_MGR') {
    return {
      remainingDays: 0,
      isActionRequired: false,
      isExpired: false,
      label: 'Promosi: Review B&M Mgr',
      badgeClass: 'bg-purple-600 text-white',
      dotColorClass: 'bg-purple-500',
      statusText: 'Menunggu Persetujuan B&M Manager',
    };
  }
  if (item.status === 'TRIAL_PROMOSI_REGIONAL_MGR') {
    return {
      remainingDays: 0,
      isActionRequired: false,
      isExpired: false,
      label: 'Promosi: Review Reg. Mgr',
      badgeClass: 'bg-purple-600 text-white',
      dotColorClass: 'bg-purple-500',
      statusText: 'Menunggu Persetujuan Regional Manager',
    };
  }
  if (item.status === 'TRIAL_PROMOSI_KONTRAKTOR') {
    return {
      remainingDays: 0,
      isActionRequired: false,
      isExpired: false,
      label: 'Promosi: Review Kontraktor',
      badgeClass: 'bg-indigo-600 text-white',
      dotColorClass: 'bg-indigo-500',
      statusText: 'Menunggu Kesepakatan Kontraktor',
    };
  }

  const duration = item.trialDurationDays || DEFAULT_TRIAL_DURATION_DAYS;
  const remaining = calculateRemainingTrialDays(item.trialStartDate, duration);
  const actionRequired = isTrialActionRequired(remaining);
  const expired = remaining <= 0;

  if (expired) {
    return {
      remainingDays: remaining,
      isActionRequired: true,
      isExpired: true,
      label: 'Masa Trial Habis',
      badgeClass: 'bg-rose-600 text-white',
      dotColorClass: 'bg-rose-500',
      statusText: 'Masa uji coba 3 bulan telah berakhir. Segera lakukan evaluasi.',
    };
  }

  if (actionRequired) {
    return {
      remainingDays: remaining,
      isActionRequired: true,
      isExpired: false,
      label: `${remaining} Hari Lagi (Perlu Tindakan)`,
      badgeClass: 'bg-amber-600 text-white',
      dotColorClass: 'bg-amber-500',
      statusText: `Masa trial tersisa ${remaining} hari. Perlu tindakan evaluasi promosi atau nonaktif.`,
    };
  }

  return {
    remainingDays: remaining,
    isActionRequired: false,
    isExpired: false,
    label: `${remaining} Hari Tersisa`,
    badgeClass: 'bg-sky-600 text-white',
    dotColorClass: 'bg-sky-500',
    statusText: `Aktif masa uji coba (${remaining} dari ${duration} hari tersisa).`,
  };
}
