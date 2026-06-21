import type { Chunk } from '@/lib/api';
import ScoreBadge from './ScoreBadge';

export default function ChunkCard({
  index,
  chunk,
  expanded,
  onToggle,
}: {
  index: number;
  chunk: Chunk;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden transition-all border ${
        expanded
          ? 'bg-white ring-1'
          : 'bg-white border-neutral-300 hover:ring-1 hover:cursor-pointer'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left hover:bg-zinc-50/50 transition-colors h-14"
      >
        <div className="flex items-center w-full">
          <div className="w-14 h-14 shrink-0 flex items-center justify-center border-r border-neutral-300 font-bold text-lg">
            {index + 1}
          </div>
          <div className="h-14 flex flex-col justify-between w-full">
            <div className="h-8 px-3 flex justify-between items-center gap-2">
              {chunk.source && (
                <p className="text-sm truncate">{chunk.source}</p>
              )}
              <ScoreBadge score={chunk.score} />
            </div>
            <div className="bg-neutral-100 items-center w-full px-3 h-6">
              <p>
                {chunk.page > 0 && (
                  <span className="text-xs text-neutral-500">
                    p. {chunk.page}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-300 p-3">
          <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
            {chunk.text}
          </p>
        </div>
      )}
    </div>
  );
}
