"use client";

import React from 'react';

interface MaterialSpecCellProps {
  item: string;
  merk?: string;
  ukuran?: string;
  className?: string;
}

export function MaterialSpecCell({
  item,
  merk,
  ukuran,
  className = "",
}: MaterialSpecCellProps) {
  const subDetails = [merk, ukuran].filter(Boolean).join(' • ');

  return (
    <div className={`flex flex-col min-w-[140px] max-w-[260px] ${className}`}>
      <span className="font-semibold text-slate-900 text-xs tracking-tight line-clamp-1" title={item}>
        {item}
      </span>
      {subDetails && (
        <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={subDetails}>
          {subDetails}
        </span>
      )}
    </div>
  );
}
