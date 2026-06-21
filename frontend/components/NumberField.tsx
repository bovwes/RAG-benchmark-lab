'use client';

import { useEffect, useState } from 'react';

export default function NumberField({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [inputVal, setInputVal] = useState(String(value));

  function commit(raw: string) {
    const n = Number(raw);
    if (!isNaN(n)) onChange(n);
    setInputVal(String(isNaN(n) ? value : n));
  }

  useEffect(() => {
    setInputVal(String(value));
  }, [value]);

  return (
    <label className="flex items-center justify-between px-2 py-1.5 hover:bg-neutral-200/50 cursor-text w-full">
      <span className="text-sm text-neutral-500 select-none">{label}</span>
      <input
        type="number"
        step={step}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(inputVal)}
        className="w-14 text-right text-salmon text-sm focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none px-1 bg-transparent"
      />
    </label>
  );
}
