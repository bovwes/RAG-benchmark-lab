'use client';

import { type ComponentInfo } from '@/lib/api';

export function componentSelectId(c: ComponentInfo): string {
  return c.default_name ?? c.name;
}

export default function ComponentSelect({
  value,
  components,
  loading,
  onChange,
}: {
  value: string;
  components: ComponentInfo[];
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-52 bg-neutral-200/50 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors hover:bg-neutral-200 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <option value="">Loading…</option>
      ) : (
        components.map((c) => (
          <option key={componentSelectId(c)} value={componentSelectId(c)}>
            {c.name}
          </option>
        ))
      )}
    </select>
  );
}
