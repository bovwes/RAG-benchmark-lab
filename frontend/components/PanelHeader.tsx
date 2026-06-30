export default function PanelHeader({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <p className="font-bold text-sm">{title}</p>
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
  );
}
