"use client";

import React from 'react';

interface TableLoadingSkeletonProps {
  colSpan?: number;
  rowCount?: number;
}

export function TableLoadingSkeleton({
  colSpan = 8,
  rowCount = 5,
}: TableLoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, idx) => (
        <tr key={idx} className="animate-pulse border-b border-slate-100">
          <td className="px-3 py-4 text-center">
            <div className="h-4 w-5 bg-slate-200 rounded mx-auto" />
          </td>
          <td className="px-3.5 py-4">
            <div className="h-5 w-20 bg-slate-200 rounded-md" />
          </td>
          <td className="px-3.5 py-4 space-y-1.5">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </td>
          <td className="px-3.5 py-4 space-y-1.5">
            <div className="h-3 w-48 bg-slate-100 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </td>
          <td className="px-3.5 py-4 space-y-1.5">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </td>
          <td className="px-3.5 py-4">
            <div className="h-4 w-20 bg-slate-200 rounded ml-auto" />
          </td>
          <td className="px-3.5 py-4 text-center">
            <div className="h-5 w-24 bg-slate-200 rounded-full mx-auto" />
          </td>
          <td className="px-3 py-4 text-center">
            <div className="h-7 w-20 bg-slate-200 rounded-lg mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
