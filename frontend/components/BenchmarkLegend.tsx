'use client';

import { useState } from 'react';
import { type BenchmarkConfigResult, type BenchConfigSpec } from '@/lib/api';

interface Props {
  results: BenchmarkConfigResult[];
  visible: Set<string>;
  configs?: BenchConfigSpec[];
  colorOf: (name: string) => string;
  onToggle: (name: string) => void;
}

export default function BenchmarkLegend({
  results,
  visible,
  configs,
  colorOf,
  onToggle,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {results.map((r) => {
        const cfg = configs?.find((c) => c.name === r.config);
        return (
          <div key={r.config} className="relative">
            <label
              className="flex items-center gap-2 text-xs cursor-pointer select-none hover:bg-neutral-100 p-2"
              onMouseEnter={() => setHovered(r.config)}
              onMouseLeave={() => setHovered(null)}
            >
              <input
                type="checkbox"
                checked={visible.has(r.config)}
                onChange={() => onToggle(r.config)}
                className="sr-only"
              />
              <span
                className="w-2.5 h-2.5 inline-block shrink-0"
                style={{
                  backgroundColor: visible.has(r.config)
                    ? colorOf(r.config)
                    : '#d4d4d4',
                }}
              />
              <span
                className={
                  visible.has(r.config)
                    ? 'text-neutral-800'
                    : 'text-neutral-400'
                }
              >
                {r.config}
              </span>
            </label>

            {cfg && hovered === r.config && (
              <div className="absolute left-0 top-full mt-1 bg-neutral-800 p-3 min-w-max z-30">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 shrink-0 inline-block"
                    style={{ backgroundColor: colorOf(cfg.name) }}
                  />
                  <span className="text-xs font-medium text-white">
                    {cfg.name}
                  </span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs text-neutral-400 ml-4 max-w-60 truncate">
                  <dt className="text-neutral-300">Retriever</dt>
                  <dd>{cfg.retriever}</dd>
                  <dt className="text-neutral-300">top_k retrieve</dt>
                  <dd>{cfg.top_k_retrieve}</dd>
                  <dt className="text-neutral-300">Reranker</dt>
                  <dd>{cfg.reranker}</dd>
                  <dt className="text-neutral-300">top_k rerank</dt>
                  <dd>{cfg.top_k_rerank}</dd>
                  <dt className="text-neutral-300">Generator</dt>
                  <dd>{cfg.generator}</dd>
                  {Object.entries(cfg.generator_params).flatMap(([k, v]) => [
                    <dt key={`${k}-k`} className="text-neutral-300">
                      {k}
                    </dt>,
                    <dd key={`${k}-v`}>{String(v)}</dd>,
                  ])}
                </dl>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
