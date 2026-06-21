'use client';

import { useState } from 'react';
import { type BenchConfigSpec } from '@/lib/api';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid';

interface Props {
  configs: BenchConfigSpec[];
  colorOf: (name: string) => string;
}

export default function ConfigDetailsPanel({ configs, colorOf }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-neutral-200 text-sm">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 hover:cursor-pointer transition-colors"
      >
        <span className="text-sm font-medium">Configuration Summary</span>
        {open ? (
          <ChevronUpIcon className="size-3.5 text-neutral-400" />
        ) : (
          <ChevronDownIcon className="size-3.5 text-neutral-400" />
        )}
      </button>

      {open && (
        <div className="flex border-t border-neutral-200">
          {configs.map((cfg, i) => (
            <div key={i} className="px-8 py-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 shrink-0 inline-block"
                  style={{ backgroundColor: colorOf(cfg.name) }}
                />
                <span className="font-medium">{cfg.name}</span>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs text-neutral-500 ml-4.5">
                <dt className="text-neutral-400">Retriever</dt>
                <dd>{cfg.retriever}</dd>
                <dt className="text-neutral-400">top_k retrieve</dt>
                <dd>{cfg.top_k_retrieve}</dd>
                <dt className="text-neutral-400">Reranker</dt>
                <dd>{cfg.reranker}</dd>
                <dt className="text-neutral-400">top_k rerank</dt>
                <dd>{cfg.top_k_rerank}</dd>
                <dt className="text-neutral-400">Generator</dt>
                <dd>{cfg.generator}</dd>
                {Object.entries(cfg.generator_params).map(([k, v]) =>
                  k === 'prompt_template' ? null : (
                    <>
                      <dt key={`${k}-k`} className="text-neutral-400">
                        {k}
                      </dt>
                      <dd key={`${k}-v`}>{String(v)}</dd>
                    </>
                  ),
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
