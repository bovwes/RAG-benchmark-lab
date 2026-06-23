export default function Card({
  title,
  hint,
  children,
  className = '',
  square = false,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  square?: boolean;
}) {
  return (
    <div
      className={`h-fit bg-white ring-1 ring-neutral-200 ${square ? 'aspect-square flex flex-col' : ''} ${className}`}
    >
      <div className="flex items-center gap-2 p-4 border-b border-neutral-200 shrink-0">
        <p className="font-medium text-sm">{title}</p>
        {hint && (
          <span className="relative group ml-1 cursor-default">
            <span className="flex items-center justify-center w-5 h-5 bg-neutral-200/50 text-neutral-500 text-xs leading-none select-none">
              i
            </span>
            <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 w-48 bg-neutral-800 px-2 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {hint}
            </span>
          </span>
        )}
      </div>
      <div className={`p-4 ${square ? 'flex-1 min-h-0' : ''}`}>{children}</div>
    </div>
  );
}
