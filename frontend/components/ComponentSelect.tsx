'use client';

import { type ComponentInfo } from '@/lib/api';
import Dropdown from './Dropdown';

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
  const options = loading
    ? [{ value: '', label: 'Loading…' }]
    : components.map((c) => ({ value: componentSelectId(c), label: c.name }));

  return (
    <Dropdown
      value={loading ? '' : value}
      options={options}
      onChange={onChange}
      disabled={loading}
    />
  );
}
