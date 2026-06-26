'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/16/solid';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

export default function Dropdown<T extends string = string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`border focus:outline-none hover:bg-neutral-200 hover:cursor-pointer text-sm truncate disabled:opacity-50 disabled:cursor-not-allowed p-2 flex items-center w-full justify-between text-left bg-neutral-200/50 ${open ? 'border-black' : 'border-neutral-200/50'}`}
      >
        <span>{current?.label ?? value}</span>
        <ChevronDownIcon
          className={`size-3 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 bg-white border-x border-b border-black min-w-full">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 hover:cursor-pointer transition-colors flex items-center gap-1.5 ${
                opt.value === value ? 'font-medium' : 'text-neutral-500'
              }`}
            >
              <ChevronRightIcon
                className={`size-3 shrink-0 ${opt.value === value ? 'opacity-100' : 'opacity-0'}`}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
