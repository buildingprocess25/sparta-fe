"use client";

import React from 'react';

interface CategoryAreaCellProps {
  kategori: string;
  implementasi?: string;
  lokasi?: string;
  className?: string;
}

export function CategoryAreaCell({
  kategori,
  implementasi,
  lokasi,
  className = "",
}: CategoryAreaCellProps) {
  const subDetails = [implementasi, lokasi].filter(Boolean).join(' • ');

  return (
    <div className={`flex flex-col min-w-[120px] max-w-[220px] ${className}`}>
      <span className="font-medium text-slate-800 text-xs truncate" title={kategori}>
        {kategori || '-'}
      </span>
      {subDetails ? (
        <span className="text-[11px] text-slate-400 font-normal truncate mt-0.5" title={subDetails}>
          {subDetails}
        </span>
      ) : (
        <span className="text-[11px] text-slate-400 font-normal mt-0.5">-</span>
      )}
    </div>
  );
}
