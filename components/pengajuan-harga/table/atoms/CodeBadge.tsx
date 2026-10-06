"use client";

import React from 'react';

interface CodeBadgeProps {
  code: string;
  codeMaster?: string;
  showMaster?: boolean;
  isTrial?: boolean;
  className?: string;
}

export function CodeBadge({
  code,
  codeMaster,
  showMaster = false,
  isTrial = false,
  className = "",
}: CodeBadgeProps) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <span className={`inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded-md border shadow-2xs whitespace-nowrap ${
        isTrial
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      }`}>
        {code}
      </span>
      {showMaster && codeMaster && (
        <span
          className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] text-center"
          title={codeMaster}
        >
          {codeMaster}
        </span>
      )}
    </div>
  );
}
