// =============================================================================
// components/prototipe-trial/types.ts
// Kontrak Data Domain Prototipe Alur Pengajuan Trial Baru Sparta
// Prinsip: Clean Architecture, Strict Typing, Tanpa Any
// =============================================================================

export type TrialStatus =
  | 'TRIAL_DRAFT'
  | 'TRIAL_PENDING_PP_MGR'
  | 'TRIAL_REVISI_MAKER'
  | 'TRIAL_PENDING_BM_GM'
  | 'TRIAL_PENDING_SB_CONFIG'
  | 'TRIAL_PENDING_BM_REG_CONFIG'
  | 'TRIAL_REVISI_SB'
  | 'TRIAL_AKTIF'
  | 'TRIAL_EVALUASI_VOTING'
  | 'TRIAL_PENDING_FINAL_BM_REG'
  | 'TRIAL_EVALUASI_TIDAK_LANJUT'
  | 'TRIAL_DITOLAK_REG_MGR'
  | 'TRIAL_PROMOTED_MASTER';

export type RoleTrial =
  | 'MAKER'
  | 'PP_MANAGER'
  | 'BM_GM'
  | 'SB_SPECIALIST'
  | 'BM_REGIONAL_MGR'
  | 'MONITORING'
  | 'EVALUATOR'
  | 'MASTER_HARGA';

export interface KoefisienItem {
  id: string;
  label: string;
  unit: string;
  value: number;
  hargaAcuan: number;
  jenis: 'UPAH' | 'MATERIAL' | 'BONGKARAN';
}

export interface LampiranFileItem {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface FormEvaluasiTim {
  tim: 'TIM_PP' | 'TIM_BMES' | 'TIM_SB';
  namaPenilai: string;
  keputusan: 'LANJUT' | 'TIDAK_LANJUT';
  catatan: string;
  lampiranName?: string;
  lampiranUrl?: string;
  lampiranList?: LampiranFileItem[];
  tanggal: string;
}

export interface TrialHistoryLog {
  role: string;
  namaUser?: string;
  action: 'SUBMIT' | 'APPROVE' | 'REVISE' | 'CONFIG' | 'EVALUATE' | 'PROMOTE' | 'RE_ENTRY';
  tanggal: string;
  catatan?: string;
}

export interface TrialItem {
  id: string;
  kode: string; // contoh: "SIP-001"
  kodeMaster?: string; // contoh: "KRK-001-A-Keramik-60x60"
  item: string;
  kategori: string;
  ukuran: string;
  merk: string;
  warna: string;
  tipe: string;
  permukaan: string;
  tebal: string;
  toleransi: string;
  implementasi: string;
  lokasi: string;
  cabang: string;
  satuan: string;
  deskripsiOtomatis: string;
  informasiTambahan?: string;
  alasanTrial: string;

  // Parameter Khusus Inisiasi Trial
  durasiBulan: 2 | 3 | 4;
  durasiHari: number; // 60 | 90 | 120
  estimasiHargaMaker: number;
  isTermasukBongkaran: boolean;
  lampiranMakerName?: string;
  lampiranMakerUrl?: string;
  lampiranMakerList?: LampiranFileItem[];
  makerRole: 'MAKER_SENIOR' | 'MAKER_JUNIOR' | 'PP_MANAGER';
  makerNama: string;
  tanggalPengajuan: string;

  // Status & Siklus
  status: TrialStatus;
  revisiCatatan?: string;
  revisiOleh?: string;

  // Konfigurasi Harga oleh S&B Specialist
  koefisienUpah?: KoefisienItem[];
  koefisienMaterial?: KoefisienItem[];
  koefisienBongkaran?: KoefisienItem[];
  marginUpah?: number;
  marginMaterial?: number;
  hargaTrialFinal?: number;

  // Masa Aktif Pelaksanaan Trial
  nomorDokumenTrial?: string;
  trialStartDate?: string;
  trialEndDate?: string;

  // Penilaian Pasca-Trial 3 Tim Mandiri
  evaluasiPP?: FormEvaluasiTim;
  evaluasiBMES?: FormEvaluasiTim;
  evaluasiSB?: FormEvaluasiTim;

  // Riwayat Jejak Audit
  historyLog: TrialHistoryLog[];
}

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotColor: string;
}

export const TRIAL_STATUS_MAP: Record<TrialStatus, StatusMeta> = {
  TRIAL_DRAFT: {
    label: 'Draft',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
  },
  TRIAL_PENDING_PP_MGR: {
    label: 'Menunggu PP Mgr',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  TRIAL_REVISI_MAKER: {
    label: 'Perlu Revisi Maker',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-500',
  },
  TRIAL_PENDING_BM_GM: {
    label: 'Menunggu BM GM',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  TRIAL_PENDING_SB_CONFIG: {
    label: 'Menunggu S&B',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500',
  },
  TRIAL_PENDING_BM_REG_CONFIG: {
    label: 'Menunggu Approval Reg Mgr',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    dotColor: 'bg-purple-500',
  },
  TRIAL_REVISI_SB: {
    label: 'Perlu Revisi S&B',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-500',
  },
  TRIAL_AKTIF: {
    label: 'Trial Aktif',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  TRIAL_EVALUASI_VOTING: {
    label: 'Menunggu Evaluasi',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300',
    dotColor: 'bg-orange-500',
  },
  TRIAL_PENDING_FINAL_BM_REG: {
    label: 'Menunggu Penetapan Master',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  TRIAL_EVALUASI_TIDAK_LANJUT: {
    label: 'Tidak Lanjut',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-400',
    dotColor: 'bg-slate-500',
  },
  TRIAL_DITOLAK_REG_MGR: {
    label: 'Ditolak Reg Mgr (Bisa Diajukan Lagi)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-500',
  },
  TRIAL_PROMOTED_MASTER: {
    label: 'Master Harga',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-400',
    dotColor: 'bg-teal-600',
  },
};

/**
 * Menghitung sisa hari masa aktif trial
 */
export function getRemainingDays(startDateStr?: string, durationDays: number = 90): number {
  if (!startDateStr) return durationDays;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return durationDays;

  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Helper rekapitulasi kuorum voting 2 dari 3
 */
export function calculateEvaluationQuorum(item: TrialItem): {
  approvedCount: number;
  rejectedCount: number;
  totalVoted: number;
  isQuorumApproved: boolean;
  isQuorumRejected: boolean;
  agreeCount: number;
  rejectCount: number;
  filledCount: number;
  isQuorumMet: boolean;
  isComplete: boolean;
} {
  const votes = [item.evaluasiPP, item.evaluasiBMES, item.evaluasiSB].filter(Boolean) as FormEvaluasiTim[];
  const approvedCount = votes.filter((v) => v.keputusan === 'LANJUT').length;
  const rejectedCount = votes.filter((v) => v.keputusan === 'TIDAK_LANJUT').length;
  const totalVoted = votes.length;
  const isQuorumApproved = approvedCount >= 2;
  const isQuorumRejected = rejectedCount >= 2;

  return {
    approvedCount,
    rejectedCount,
    totalVoted,
    isQuorumApproved,
    isQuorumRejected,
    agreeCount: approvedCount,
    rejectCount: rejectedCount,
    filledCount: totalVoted,
    isQuorumMet: isQuorumApproved,
    isComplete: totalVoted >= 3,
  };
}
