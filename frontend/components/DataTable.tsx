import { type ReactNode } from 'react';

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
    <tr
      className={`border-b border-neutral-100 ${className ? ` ${className}` : ''}`}
    >
      {children}
    </tr>
  );
}

export function DataTableHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th className={`py-2 font-medium${className ? ` ${className}` : ''}`}>
      {children}
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
    <td className={`py-2${className ? ` ${className}` : ''}`}>{children}</td>
  );
}
