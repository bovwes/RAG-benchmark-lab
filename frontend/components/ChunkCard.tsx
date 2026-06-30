import type { Chunk } from "@/lib/api";
import ScoreBadge from "./ScoreBadge";

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
    <div className={`overflow-hidden transition-all ${expanded ? "" : ""}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left transition-colors p-2 hover:bg-neutral-100 hover:cursor-pointer"
      >
        <div className="flex gap-4 items-center w-full">
          <div className="shrink-0 text-sm flex items-center justify-center font-bold">
            {index + 1}
          </div>
          <div className="flex flex-col justify-between w-full">
            <div className="flex justify-between items-center gap-2">
              <div className="flex gap-1 text-xs ">
                {chunk.source && <p className="truncate">{chunk.source}</p>}
                {chunk.page > 0 && (
                  <span className="text-neutral-500">p. {chunk.page}</span>
                )}
              </div>
              <ScoreBadge score={chunk.score} />
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-8 p-2">
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-neutral-500">
            {chunk.text}
          </p>
        </div>
      )}
    </div>
  );
}
