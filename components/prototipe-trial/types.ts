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

export type JenisLampiranTrial =
  | 'KATALOG'
  | 'TEKNIKAL_SPEK'
  | 'HASIL_UJI'
  | 'SPH'
  | 'FOTO_ITEM';

export interface LampiranFileItem {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  jenisLampiran?: JenisLampiranTrial;
  labelJenis?: string;
  isImage?: boolean;
}

export interface KategoriLampiranConfig {
  key: JenisLampiranTrial;
  label: string;
  shortLabel: string;
  docLabel: string;
  required: boolean;
  multiple: boolean;
  accept: string;
  description: string;
}

export const KATEGORI_LAMPIRAN_TRIAL: KategoriLampiranConfig[] = [
  {
    key: 'KATALOG',
    label: '1. Katalog Material',
    shortLabel: 'Katalog',
    docLabel: 'Katalog Material',
    required: true,
    multiple: false,
    accept: '.pdf,.doc,.docx,image/*',
    description: 'Brosur atau katalog resmi produk dari pabrikan/vendor (PDF/Gambar)',
  },
  {
    key: 'TEKNIKAL_SPEK',
    label: '2. Teknikal Spek',
    shortLabel: 'Teknikal Spek',
    docLabel: 'Spesifikasi Teknis',
    required: false,
    multiple: false,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,image/*',
    description: 'Lembar data teknis spesifikasi material (Data Sheet)',
  },
  {
    key: 'HASIL_UJI',
    label: '3. Hasil Uji',
    shortLabel: 'Hasil Uji',
    docLabel: 'Hasil Uji Lab',
    required: false,
    multiple: false,
    accept: '.pdf,.doc,.docx,image/*',
    description: 'Dokumen hasil pengujian laboratorium atau sertifikat mutu',
  },
  {
    key: 'SPH',
    label: '4. SPH (Surat Penawaran Harga)',
    shortLabel: 'SPH',
    docLabel: 'Surat Penawaran Harga (SPH)',
    required: true,
    multiple: false,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,image/*',
    description: 'Dokumen penawaran harga resmi dari supplier/distributor',
  },
  {
    key: 'FOTO_ITEM',
    label: '5. Foto / Gambar Item',
    shortLabel: 'Foto / Gambar Item',
    docLabel: 'Foto / Gambar Fisik Item',
    required: true,
    multiple: true,
    accept: 'image/*,.pdf',
    description: 'Foto sampel fisik material dan/atau lokasi pemasangan (bisa >1 foto)',
  },
];

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

const ROMAWI_BULAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

/**
 * Menghasilkan nomor dokumen penerbitan trial dengan format:
 * [nomor]/TRIAL/[romawi bulan]/[tahun 2 digit] (contoh: 001/TRIAL/X/26)
 * Nomor urut otomatis di-reset kembali ke 001 setiap pergantian bulan.
 */
export function generateNomorDokumenTrial(
  item: TrialItem,
  allItems: TrialItem[] = [],
  overrideDateStr?: string
): string {
  if (
    !overrideDateStr &&
    item.nomorDokumenTrial &&
    /^\d{3}\/TRIAL\/[IVX]+\/\d{2}$/.test(item.nomorDokumenTrial)
  ) {
    return item.nomorDokumenTrial;
  }

  const refDate = (
    overrideDateStr ||
    item.trialStartDate ||
    item.tanggalPengajuan ||
    new Date().toISOString().split('T')[0]
  ).split(' ')[0];

  const parts = refDate.split('-');
  const yyyy = parts[0] || String(new Date().getFullYear());
  const mm = (parts[1] || String(new Date().getMonth() + 1)).padStart(2, '0');
  const monthIdx = Math.max(0, Math.min(11, (parseInt(mm, 10) || 1) - 1));
  const romanMonth = ROMAWI_BULAN[monthIdx];
  const yearShort = yyyy.slice(-2);
  const targetYearMonth = `${yyyy}-${mm}`;

  if (!allItems || allItems.length === 0) {
    return `001/TRIAL/${romanMonth}/${yearShort}`;
  }

  const sameMonthItems = allItems
    .filter((it) => {
      const itDate =
        it.id === item.id && overrideDateStr
          ? overrideDateStr
          : it.trialStartDate || it.tanggalPengajuan || '';
      return itDate.startsWith(targetYearMonth);
    })
    .sort((a, b) => {
      const dateA =
        a.id === item.id && overrideDateStr
          ? overrideDateStr
          : a.trialStartDate || a.tanggalPengajuan || '';
      const dateB =
        b.id === item.id && overrideDateStr
          ? overrideDateStr
          : b.trialStartDate || b.tanggalPengajuan || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.kode.localeCompare(b.kode);
    });

  const idx = sameMonthItems.findIndex((it) => it.id === item.id);
  const seqNumber = idx !== -1 ? idx + 1 : sameMonthItems.length + 1;
  const paddedNo = String(seqNumber).padStart(3, '0');

  return `${paddedNo}/TRIAL/${romanMonth}/${yearShort}`;
}

