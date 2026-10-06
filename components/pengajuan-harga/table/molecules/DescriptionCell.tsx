"use client";

import React from 'react';

interface DescriptionCellProps {
  description: string;
  className?: string;
  onClickDetail?: () => void;
}

export function DescriptionCell({
  description,
  className = "",
  onClickDetail,
}: DescriptionCellProps) {
  if (!description) {
    return <span className="text-slate-400 text-xs italic">-</span>;
  }

  return (
    <div
      className={`min-w-[180px] max-w-[280px] xl:max-w-[340px] ${className}`}
      title={description}
    >
      <p className="text-xs text-slate-700 leading-snug line-clamp-2 font-normal">
        {description}
      </p>
      {onClickDetail && (
        <button
          type="button"
          onClick={onClickDetail}
          className="text-[10px] text-red-600 hover:text-red-700 font-semibold hover:underline mt-0.5 cursor-pointer block"
        >
          Lihat selengkapnya
        </button>
      )}
    </div>
  );
}
