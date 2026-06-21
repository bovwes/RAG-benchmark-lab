'use client';

import { useRef, useState, useMemo } from 'react';
import { type Chunk } from '@/lib/api';

interface Props {
  chunks: Chunk[];
  contextChunks: Chunk[];
  queryX: number;
  queryY: number;
}

const W = 520;
const H = 420;
const PAD = 0;
const INNER_W = W - PAD * 2;
const INNER_H = H - PAD * 2;

export default function SemanticScatterplot({
  chunks,
  contextChunks,
  queryX,
  queryY,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { points, qx, qy } = useMemo(() => {
    const selectedTexts = new Set(chunks.map((c) => c.text));

    const allX = [queryX, ...contextChunks.map((c) => c.x)];
    const allY = [queryY, ...contextChunks.map((c) => c.y)];
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    // 5% padding so edge points aren't clipped
    const padX = rangeX * 0.05;
    const padY = rangeY * 0.05;

    const toSvgX = (x: number) =>
      PAD + ((x - (minX - padX)) / (rangeX + 2 * padX)) * INNER_W;
    const toSvgY = (y: number) =>
      H - PAD - ((y - (minY - padY)) / (rangeY + 2 * padY)) * INNER_H;

    return {
      qx: toSvgX(queryX),
      qy: toSvgY(queryY),
      points: contextChunks.map((c) => ({
        svgX: toSvgX(c.x),
        svgY: toSvgY(c.y),
        score: c.score,
        source: c.source,
        text: c.text,
        selected: selectedTexts.has(c.text),
      })),
    };
  }, [chunks, contextChunks, queryX, queryY]);

  function handleEnter(e: React.MouseEvent, i: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHovered(i);
  }

  const hov = hovered !== null ? points[hovered] : null;

  // Render unselected first so selected (green) dots sit on top
  const unselected = points
    .map((p, i) => ({ ...p, i }))
    .filter((p) => !p.selected);
  const selected = points
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.selected);

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      {/* Legend */}
      <div className="flex items-center gap-5 mb-3 text-xs ">
        <span className="flex items-center gap-1.5">
          <svg width={12} height={12}>
            <rect width={12} height={12} fill="#E76F51" />
          </svg>
          Question
        </span>
        <span className="flex items-center gap-1.5">
          <svg width={12} height={12}>
            <circle cx={6} cy={6} r={6} fill="#264653" />
          </svg>
          Chunk
        </span>
        <span className="flex items-center gap-1.5">
          <svg width={12} height={12}>
            <circle cx={6} cy={6} r={6} fill="#d1d5db" />
          </svg>
          Not selected Chunk
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block"
        style={{ fontFamily: 'inherit' }}
      >
        {/* Plot background */}
        <rect x={PAD} y={PAD} width={INNER_W} height={INNER_H} fill="#f5f5f5" />

        {/* Grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <g key={t}>
            <line
              x1={PAD + t * INNER_W}
              y1={PAD}
              x2={PAD + t * INNER_W}
              y2={H - PAD}
              stroke="#ffffff"
              strokeWidth={3}
            />
            <line
              x1={PAD}
              y1={PAD + t * INNER_H}
              x2={W - PAD}
              y2={PAD + t * INNER_H}
              stroke="#ffffff"
              strokeWidth={3}
            />
          </g>
        ))}

        {/* Unselected context chunks — gray */}
        {unselected.map((p) => (
          <circle
            key={p.i}
            cx={p.svgX}
            cy={p.svgY}
            r={6}
            fill="#d1d5db"
            stroke="#f5f5f5"
            strokeWidth={1}
            style={{
              cursor: 'pointer',
              opacity: hovered === null || hovered === p.i ? 1 : 0.4,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => handleEnter(e, p.i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Selected (pipeline output) chunks — green, slightly larger */}
        {selected.map((p) => (
          <circle
            key={p.i}
            cx={p.svgX}
            cy={p.svgY}
            r={8}
            fill="#264653"
            stroke="#f5f5f5"
            strokeWidth={1.5}
            style={{
              cursor: 'pointer',
              opacity: hovered === null || hovered === p.i ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => handleEnter(e, p.i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Query point — always on top */}
        <g
          transform={`translate(${qx}, ${qy})`}
          style={{
            opacity: hovered !== null ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <rect
            width={12}
            height={12}
            fill="#E76F51"
            stroke="#f5f5f5"
            strokeWidth={1.5}
          />
        </g>
      </svg>

      {/* Tooltip */}
      {hov && (
        <div
          className="absolute pointer-events-none z-10 bg-white ring-1 ring-neutral-200 px-2.5 py-2 text-xs max-w-3xs"
          style={{
            left: Math.min(tooltipPos.x + 12, W - 240),
            top: Math.max(tooltipPos.y - 60, 0),
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ background: hov.selected ? '#264653' : '#d1d5db' }}
            />
            <span className="font-semibold">Sim: {hov.score.toFixed(3)}</span>
            {hov.selected && (
              <span className="ml-auto text-diamond font-semibold">
                selected
              </span>
            )}
          </div>
          {hov.source && (
            <p className="text-neutral-400 font-mono truncate mb-1">
              {hov.source}
            </p>
          )}
          <p className="text-neutral-600 leading-snug line-clamp-3">
            {hov.text.slice(0, 120)}
            {hov.text.length > 120 ? '…' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
