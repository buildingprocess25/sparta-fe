"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronsUpDown, Check, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CreatableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CreatableCombobox({
  value,
  onChange,
  options: initialOptions,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari atau ketik baru...",
  className,
  disabled = false,
  required = false,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<string[]>(initialOptions);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync options if prop changes
  useEffect(() => {
    setOptions(prev => {
      const merged = Array.from(new Set([...prev, ...initialOptions]));
      return merged;
    });
  }, [initialOptions]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [open]);

  // Filter options based on search query
  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Check if current search query already exists exactly in options
  const searchTrimmed = search.trim();
  const exactMatch = options.some(
    opt => opt.toLowerCase() === searchTrimmed.toLowerCase()
  );

  const handleSelect = (selectedVal: string) => {
    onChange(selectedVal);
    setOpen(false);
  };

  const handleCreate = () => {
    if (!searchTrimmed) return;
    if (!options.includes(searchTrimmed)) {
      setOptions(prev => [searchTrimmed, ...prev]);
    }
    onChange(searchTrimmed);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && exactMatch) {
        handleSelect(filtered[0]);
      } else if (searchTrimmed) {
        handleCreate();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {required && (
        <input
          tabIndex={-1}
          required={required}
          value={value}
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      )}
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-9 justify-between font-normal text-xs px-3 rounded-lg border-slate-200 bg-white hover:bg-slate-50",
            !value && "text-slate-400",
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-2 rounded-xl shadow-xl border-slate-200 bg-white z-[9999]"
      >
        {/* Search Input Box */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="pl-8 h-8 text-xs rounded-lg border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-red-500"
          />
        </div>

        {/* Options List */}
        <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
          {filtered.map(opt => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors",
                  isSelected
                    ? "bg-red-50 text-red-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <span className="truncate">{opt}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
              </button>
            );
          })}

          {/* Option to Add New Value if not matching exactly */}
          {searchTrimmed && !exactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 rounded-md text-left text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition-colors font-medium border border-blue-200/60"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">
                Tambah <strong>&ldquo;{searchTrimmed}&rdquo;</strong>
              </span>
            </button>
          )}

          {filtered.length === 0 && !searchTrimmed && (
            <div className="py-3 text-center text-xs text-slate-400">
              Tidak ada data. Ketik untuk menambah baru.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
