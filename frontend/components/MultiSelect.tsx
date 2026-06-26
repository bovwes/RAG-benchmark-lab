'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/16/solid';

export interface MultiSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export default function MultiSelect<T extends string = string>({
  values,
  options,
  onChange,
  placeholder = 'Select…',
  allowCustom = false,
  customPlaceholder = 'Add…',
  formatCustom,
}: {
  values: T[];
  options: MultiSelectOption<T>[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  formatCustom?: (raw: string) => { value: T; label: string };
}) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const [extraOptions, setExtraOptions] = useState<MultiSelectOption<T>[]>(
    () => {
      const baseValues = new Set(options.map((o) => o.value));
      return values
        .filter((v) => !baseValues.has(v))
        .map((v) => ({ value: v, label: v }));
    },
  );

  const allOptions = [...options, ...extraOptions];

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

  function toggle(value: T) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  function addCustom() {
    const raw = customInput.trim();
    if (!raw) return;
    const { value, label } = formatCustom
      ? formatCustom(raw)
      : { value: raw as T, label: raw };
    if (!allOptions.some((o) => o.value === value)) {
      setExtraOptions((prev) => [...prev, { value, label }]);
    }
    if (!values.includes(value)) {
      onChange([...values, value]);
    }
    setCustomInput('');
  }

  let label: string;
  if (values.length === 0) {
    label = placeholder;
  } else if (values.length === 1) {
    label = allOptions.find((o) => o.value === values[0])?.label ?? values[0];
  } else {
    label = `${values.length} selected`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`border focus:outline-none hover:bg-neutral-200 hover:cursor-pointer text-sm truncate disabled:opacity-50 disabled:cursor-not-allowed p-2 flex items-center w-full justify-between text-left bg-neutral-200/50 ${open ? 'border-black' : 'border-neutral-200/50'}`}
      >
        <span className={values.length === 0 ? 'text-neutral-400' : ''}>
          {label}
        </span>
        <ChevronDownIcon
          className={`size-3 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 bg-white border-x border-b border-black min-w-full max-w-full">
          {allOptions.map((opt) => {
            const selected = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 hover:cursor-pointer transition-colors flex items-center gap-2"
              >
                <CheckIcon
                  className={`size-3 shrink-0 ${selected ? 'text-black' : 'invisible'}`}
                />
                <span className={selected ? 'font-medium' : 'text-neutral-500'}>
                  {opt.label}
                </span>
              </button>
            );
          })}
          {allowCustom && (
            <div className="flex border-t border-neutral-200">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder={customPlaceholder}
                className="flex-1 text-xs px-3 py-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustom}
                className="w-8 justify-center items-center flex text-xs hover:bg-neutral-100 hover:cursor-pointer border-l border-neutral-200"
              >
                <PlusIcon className="size-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
