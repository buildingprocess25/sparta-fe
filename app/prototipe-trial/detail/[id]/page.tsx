// =============================================================================
// app/prototipe-trial/detail/[id]/page.tsx
// Halaman Pengalih Cerdas (Smart Redirect) ke Arsitektur Detail Berbasis Peran
// Mengarahkan pengguna ke halaman detail spesifik peran sesuai status item
// =============================================================================

"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { TrialStatus } from '@/components/prototipe-trial/types';

function getRoleDetailHref(itemId: string, status?: TrialStatus): string {
  switch (status) {
    case 'TRIAL_PENDING_PP_MGR':
      return `/prototipe-trial/pp-manager/${itemId}`;
    case 'TRIAL_PENDING_BM_GM':
      return `/prototipe-trial/bm-general-manager/${itemId}`;
    case 'TRIAL_PENDING_SB_CONFIG':
    case 'TRIAL_REVISI_SB':
      return `/prototipe-trial/sb-specialist/${itemId}`;
    case 'TRIAL_PENDING_BM_REG_CONFIG':
    case 'TRIAL_PENDING_FINAL_BM_REG':
      return `/prototipe-trial/regional-manager/${itemId}`;
    case 'TRIAL_AKTIF':
      return `/prototipe-trial/monitoring-trial/${itemId}`;
    case 'TRIAL_EVALUASI_VOTING':
      return `/prototipe-trial/evaluasi-tim/${itemId}`;
    case 'TRIAL_PROMOTED_MASTER':
      return `/prototipe-trial/master-harga/${itemId}`;
    case 'TRIAL_DRAFT':
    case 'TRIAL_REVISI_MAKER':
    case 'TRIAL_DITOLAK_REG_MGR':
    case 'TRIAL_EVALUASI_TIDAK_LANJUT':
    default:
      return `/prototipe-trial/maker/${itemId}`;
  }
}

export default function SmartRedirectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';
  const { items, mounted } = useTrialStore();

  useEffect(() => {
    if (!mounted || !itemId) return;
    const item = items.find((i) => i.id === itemId);
    const targetUrl = getRoleDetailHref(itemId, item?.status);
    router.replace(targetUrl);
  }, [mounted, itemId, items, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-xs text-slate-500">
      Mengarahkan ke halaman detail peran terkait...
    </div>
  );
}
