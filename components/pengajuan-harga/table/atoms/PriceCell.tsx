"use client";

import React from 'react';

interface PriceCellProps {
  price?: number;
  satuan?: string;
  className?: string;
}

export function PriceCell({ price, satuan, className = "" }: PriceCellProps) {
  if (price === undefined || price === null || isNaN(price) || price <= 0) {
    return (
      <div className={`text-slate-400 font-medium text-xs ${className}`}>
        -
      </div>
    );
  }

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <span className="font-bold text-slate-900 font-mono text-xs tracking-tight">
        {formatted}
      </span>
      {satuan && (
        <span className="text-[10px] text-slate-400 font-medium">
          / {satuan}
        </span>
      )}
    </div>
  );
}
