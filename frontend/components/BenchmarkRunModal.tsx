'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/16/solid';

export interface BenchmarkRunConfig {
  name: string;
  retriever: string;
  reranker: string;
  generator: string;
  top_k_retrieve: number;
  top_k_rerank: number;
  generatorParams: Record<string, string | number>;
}

interface Props {
  open: boolean;
  configs: BenchmarkRunConfig[];
  questionCount: number;
  evalDatasetPath: string;
  collection: string;
  judge: boolean;
  logLines?: string[];
}

function formatElapsed(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function componentLabel(id: string) {
  return id.split(':').pop() ?? id;
}

export default function BenchmarkRunModal({
  open,
  configs,
  questionCount,
  evalDatasetPath,
  collection,
  judge,
  logLines = [],
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      setExpanded(new Set());
      return;
    }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logLines]);

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  if (!open) return null;

  const evalFilename = evalDatasetPath.split('/').pop() ?? evalDatasetPath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs">
      <div className="flex items-stretch gap-3 px-4 max-h-[80vh]">
        {/* Main modal */}
        <div className="bg-white border border-black shadow-xl flex flex-col w-md overflow-hidden shrink-0">
          {/* Header */}
          <div className="p-6 pb-4 flex flex-col gap-4 shrink-0 border-b border-neutral-200">
            <p className="text-sm font-bold">Running Benchmark</p>
            <div className="h-0.5 w-full bg-neutral-200 overflow-hidden relative">
              <div
                className="absolute h-full w-2/5 bg-black"
                style={{
                  animation: 'bench-indeterminate 1.5s ease-in-out infinite',
                }}
              />
            </div>
            <p className="text-xs text-neutral-500">
              {configs.length} config{configs.length !== 1 ? 's' : ''}
              {questionCount > 0 &&
                ` · ${questionCount} question${questionCount !== 1 ? 's' : ''}`}
              {' · '}
              {formatElapsed(elapsed)} elapsed
            </p>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-col gap-5 p-6 overflow-y-auto flex-1 min-h-0">
            <div className="flex flex-col gap-1.5">
              <MetaRow label="Dataset" value={evalFilename} />
              <MetaRow label="Collection" value={collection} />
              <MetaRow
                label="LLM Judge"
                value={judge ? 'Enabled' : 'Disabled'}
                muted={!judge}
              />
            </div>

            <div className="flex flex-col -mt-1">
              {configs.map((cfg, i) => {
                const isOpen = expanded.has(i);
                const params = Object.entries(cfg.generatorParams);
                return (
                  <div key={i} className="py-2.5">
                    <button
                      onClick={() => toggle(i)}
                      className="flex w-full items-center gap-2 text-sm text-left hover:cursor-pointer group"
                    >
                      {isOpen ? (
                        <ChevronDownIcon className="size-3.5 text-neutral-500 shrink-0" />
                      ) : (
                        <ChevronRightIcon className="size-3.5 text-neutral-500 shrink-0" />
                      )}
                      <span className="font-medium truncate group-hover:underline">
                        {cfg.name}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mt-2.5 ml-6 flex flex-col gap-1 text-xs">
                        <DetailRow
                          label="Retriever"
                          value={componentLabel(cfg.retriever)}
                        />
                        <DetailRow
                          label="top_k_retrieve"
                          value={String(cfg.top_k_retrieve)}
                        />
                        <DetailRow
                          label="Reranker"
                          value={componentLabel(cfg.reranker)}
                        />
                        <DetailRow
                          label="top_k_rerank"
                          value={String(cfg.top_k_rerank)}
                        />
                        <DetailRow
                          label="Generator"
                          value={componentLabel(cfg.generator)}
                        />
                        {params.map(([k, v]) => (
                          <DetailRow key={k} label={k} value={String(v)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Console panel */}

        <div className="bg-neutral-800 border border-neutral-800 shadow-xl w-2xl flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-neutral-600 shrink-0">
            <p className="text-xs text-neutral-400">Teminal output</p>
          </div>
          <div
            ref={consoleRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs text-neutral-300 leading-5"
          >
            {logLines.length > 0 &&
              logLines.map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {line}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-neutral-500">{label}</span>
      <span
        className={muted ? 'text-neutral-300' : 'text-neutral-800 font-medium'}
      >
        {value}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-800 truncate max-w-[60%] text-right">
        {value}
      </span>
    </div>
  );
}
