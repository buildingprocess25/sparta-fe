// =============================================================================
// components/ui/sweetalert.tsx
// Komponen & Utilitas Dialog Alert Terintegrasi SweetAlert2 untuk Sparta
// Menyelaraskan SweetAlert2 dengan Standar Desain Sparta:
// Font: Geist (font-sans), Radius: Rounded-2xl, Tombol: Solid Pastel
// =============================================================================

"use client";

import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export interface ConfirmAlertOptions {
  title: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmTone?: 'amber' | 'emerald' | 'rose' | 'indigo';
  showCancelButton?: boolean;
}

const getConfirmButtonClass = (tone: ConfirmAlertOptions['confirmTone'] = 'emerald') => {
  switch (tone) {
    case 'amber':
      return 'bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 font-semibold px-4 py-2.5 rounded-xl text-xs border-0 shadow-2xs transition-colors cursor-pointer';
    case 'rose':
      return 'bg-rose-200 hover:bg-rose-300 active:bg-rose-400 text-rose-950 font-semibold px-4 py-2.5 rounded-xl text-xs border-0 shadow-2xs transition-colors cursor-pointer';
    case 'indigo':
      return 'bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 text-indigo-950 font-semibold px-4 py-2.5 rounded-xl text-xs border-0 shadow-2xs transition-colors cursor-pointer';
    case 'emerald':
    default:
      return 'bg-emerald-200 hover:bg-emerald-300 active:bg-emerald-400 text-emerald-950 font-semibold px-4 py-2.5 rounded-xl text-xs border-0 shadow-2xs transition-colors cursor-pointer';
  }
};

const getCancelButtonClass = () => {
  return 'bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs border-0 shadow-2xs transition-colors cursor-pointer';
};

/**
 * Tampilkan dialog konfirmasi interaktif dengan SweetAlert2 dan tombol solid pastel
 */
export async function confirmAlert(options: ConfirmAlertOptions): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    html: options.html,
    icon: options.icon ?? 'question',
    showCancelButton: options.showCancelButton ?? true,
    confirmButtonText: options.confirmButtonText ?? 'Ya, Lanjutkan',
    cancelButtonText: options.cancelButtonText ?? 'Batal',
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl p-6 font-sans shadow-xl border border-slate-200 bg-white max-w-md w-full',
      title: 'text-base font-bold text-slate-900 tracking-tight',
      htmlContainer: 'text-xs text-slate-600 leading-relaxed mt-2',
      confirmButton: getConfirmButtonClass(options.confirmTone),
      cancelButton: getCancelButtonClass(),
      actions: 'gap-2.5 mt-5 flex items-center justify-center',
    },
    reverseButtons: true,
  });

  return result.isConfirmed;
}

/**
 * Tampilkan notifikasi sukses
 */
export async function successAlert(title: string, text?: string, confirmText = 'Tutup'): Promise<void> {
  await Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: confirmText,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl p-6 font-sans shadow-xl border border-slate-200 bg-white max-w-md w-full',
      title: 'text-base font-bold text-slate-900 tracking-tight',
      htmlContainer: 'text-xs text-slate-600 leading-relaxed mt-2',
      confirmButton: getConfirmButtonClass('emerald'),
      actions: 'mt-5 flex justify-center',
    },
  });
}

/**
 * Tampilkan notifikasi error/peringatan
 */
export async function errorAlert(title: string, text?: string, confirmText = 'Mengerti'): Promise<void> {
  await Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: confirmText,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl p-6 font-sans shadow-xl border border-slate-200 bg-white max-w-md w-full',
      title: 'text-base font-bold text-slate-900 tracking-tight',
      htmlContainer: 'text-xs text-slate-600 leading-relaxed mt-2',
      confirmButton: getConfirmButtonClass('rose'),
      actions: 'mt-5 flex justify-center',
    },
  });
}

/**
 * Tampilkan notifikasi peringatan (warning)
 */
export async function warningAlert(title: string, text?: string, confirmText = 'Mengerti'): Promise<void> {
  await Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonText: confirmText,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl p-6 font-sans shadow-xl border border-slate-200 bg-white max-w-md w-full',
      title: 'text-base font-bold text-slate-900 tracking-tight',
      htmlContainer: 'text-xs text-slate-600 leading-relaxed mt-2',
      confirmButton: getConfirmButtonClass('amber'),
      actions: 'mt-5 flex justify-center',
    },
  });
}

/**
 * Custom alert dengan konfigurasi penuh SweetAlert2
 */
export async function customAlert(options: SweetAlertOptions) {
  return Swal.fire({
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl p-6 font-sans shadow-xl border border-slate-200 bg-white max-w-md w-full',
      title: 'text-base font-bold text-slate-900 tracking-tight',
      htmlContainer: 'text-xs text-slate-600 leading-relaxed mt-2',
      confirmButton: getConfirmButtonClass('emerald'),
      cancelButton: getCancelButtonClass(),
      actions: 'gap-2.5 mt-5 flex items-center justify-center',
    },
    ...options,
  });
}

/**
 * Objek helper utama SweetAlert untuk Sparta
 */
export const SpartaAlert = {
  confirm: confirmAlert,
  success: successAlert,
  error: errorAlert,
  warning: warningAlert,
  custom: customAlert,
  raw: Swal,
};

export default SpartaAlert;
