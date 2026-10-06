"use client";

import React from 'react';
import { PackageOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableEmptyStateProps {
  title?: string;
  description?: string;
  colSpan?: number;
  onReset?: () => void;
}

export function TableEmptyState({
  title = "Data tidak ditemukan",
  description = "Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.",
  colSpan = 8,
  onReset,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14 text-center">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 shadow-2xs">
            <PackageOpen className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed text-center">
            {description}
          </p>
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="mt-3.5 h-8 text-xs rounded-full gap-1.5 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Filter</span>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
