import { type ReactNode } from 'react';
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/16/solid';

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="w-full text-sm border-collapse">{children}</table>;
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-neutral-200 text-left text-neutral-500 text-xs">
        {children}
      </tr>
    </thead>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={`even:bg-neutral-100 ${className ? ` ${className}` : ''}`}>
      {children}
    </tr>
  );
}

export function DataTableHeader({
  children,
  className,
  sortDir,
  onSort,
}: {
  children: ReactNode;
  className?: string;
  sortDir?: 'asc' | 'desc' | null;
  onSort?: () => void;
}) {
  const SortIcon =
    sortDir === 'asc'
      ? ChevronUpIcon
      : sortDir === 'desc'
        ? ChevronDownIcon
        : ChevronUpDownIcon;

  return (
    <th className={`px-1 pb-2 font-medium${className ? ` ${className}` : ''}`}>
      {onSort ? (
        <button
          onClick={onSort}
          className={`p-1 flex items-center gap-2 hover:text-black hover:bg-neutral-100 hover:cursor-pointer transition-colors ${sortDir ? 'text-black' : 'text-neutral-400'}`}
        >
          {children}

          <SortIcon
            className={`size-4 shrink-0 ${sortDir ? 'text-black' : 'text-neutral-400'}`}
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function DataTableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`p-2 ${className ? ` ${className}` : ''}`}>{children}</td>
  );
}
