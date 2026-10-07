"use client";

import React from 'react';
import Link from 'next/link';

interface DescriptionCellProps {
  description: string;
  className?: string;
  detailHref?: string;
}

export function DescriptionCell({
  description,
  className = "",
  detailHref,
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
      {detailHref && (
        <Link
          href={detailHref}
          className="text-[10px] text-red-600 hover:text-red-700 font-semibold hover:underline mt-0.5 inline-block"
        >
          Lihat selengkapnya
        </Link>
      )}
    </div>
  );
}
