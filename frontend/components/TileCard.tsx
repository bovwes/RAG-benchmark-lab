import Link from 'next/link';

interface TileCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: string;
  children?: React.ReactNode;
  href?: string;
}

export default function TileCard({
  icon,
  title,
  subtitle,
  footer,
  children,
  href,
}: TileCardProps) {
  const inner = (
    <>
      <div className="px-4 py-2 border-b border-neutral-200 flex gap-4 items-center">
        <div className="shrink-0">{icon}</div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className="flex-1">{children}</div>}
      {footer && (
        <p className="text-xs text-neutral-500 truncate px-4 py-1 bg-neutral-100">
          {footer}
        </p>
      )}
    </>
  );

  const cls =
    'border border-neutral-200 hover:border-black transition-colors flex flex-col h-fit';

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}
