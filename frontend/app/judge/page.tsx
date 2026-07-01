'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/16/solid';
import {
  getJudgeConfig,
  saveJudgeConfig,
  type JudgeConfig,
  type JudgeMetric,
} from '@/lib/api';
import Spinner from '@/components/Spinner';
import ErrorBanner from '@/components/ErrorBanner';
import TextField from '@/components/TextField';

const thCls =
  'px-3 py-2 text-left text-xs text-neutral-500 font-normal whitespace-nowrap';
const tdCls = 'px-1 py-1.5 border-b border-neutral-100';
const numberInputCls =
  'w-16 text-center text-sm bg-transparent transition-all ring-1 ring-transparent hover:ring-1 hover:ring-black hover:bg-neutral-100 focus:bg-neutral-100 focus:ring-1 focus:ring-black focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none p-2';

function blankMetric(): JudgeMetric {
  return {
    name: '',
    prompt:
      'Score ... (1-5).\nReply with ONLY a single integer.\n\nContext:\n{context}\n\nQuestion: {question}\nAnswer: {answer}\n\nScore:',
  };
}

function ConfigTile({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col border border-neutral-200 w-full max-w-3xl ${className ?? ''}`}
    >
      <div className="text-sm p-4 border-b border-neutral-200 font-bold">
        {title}
      </div>
      {children}
    </div>
  );
}

function TileFooter({
  changed,
  saving,
  onSave,
  onUndo,
}: {
  changed: boolean;
  saving: boolean;
  onSave: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="h-12 px-4 items-center bg-neutral-100 flex justify-end">
      {changed ? (
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={saving}
            className="text-sm text-black px-3 h-8 hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-neutral-200 hover:cursor-pointer"
          >
            Undo
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="text-sm px-3 h-8 text-white bg-black hover:underline disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : (
        <span className="text-sm text-neutral-500">Up to date</span>
      )}
    </div>
  );
}

export default function JudgePage() {
  const [saved, setSaved] = useState<JudgeConfig>({
    metrics: [],
    max_tokens: 5,
    temperature: 0,
  });
  const [metrics, setMetrics] = useState<JudgeMetric[]>([]);
  const [maxTokens, setMaxTokens] = useState(5);
  const [temperature, setTemperature] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'metrics' | 'hyperparams' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metricsChanged =
    JSON.stringify(metrics) !== JSON.stringify(saved.metrics);
  const hyperparamsChanged =
    maxTokens !== saved.max_tokens || temperature !== saved.temperature;

  useEffect(() => {
    getJudgeConfig()
      .then((cfg) => {
        setSaved(cfg);
        setMetrics(cfg.metrics);
        setMaxTokens(cfg.max_tokens ?? 5);
        setTemperature(cfg.temperature ?? 0);
      })
      .catch(() => setError('Could not load judge config'))
      .finally(() => setLoading(false));
  }, []);

  function updateMetric(i: number, patch: Partial<JudgeMetric>) {
    setMetrics((ms) =>
      ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    );
  }

  async function handleSave(section: 'metrics' | 'hyperparams') {
    setSaving(section);
    setError(null);
    const cfg: JudgeConfig =
      section === 'metrics'
        ? {
            metrics,
            max_tokens: saved.max_tokens,
            temperature: saved.temperature,
          }
        : { metrics: saved.metrics, max_tokens: maxTokens, temperature };
    try {
      const updated = await saveJudgeConfig(cfg);
      setSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  function handleUndo(section: 'metrics' | 'hyperparams') {
    if (section === 'metrics') {
      setMetrics(saved.metrics);
    } else {
      setMaxTokens(saved.max_tokens);
      setTemperature(saved.temperature);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-4 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">LLM Judge</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm p-4">
            <Spinner />
            Loading…
          </div>
        )}

        {error && (
          <div className="p-4">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        {!loading && (
          <div className="p-4 flex flex-col items-center gap-4">
            <ConfigTile title="Metrics" className="overflow-x-auto">
              <div className="p-4 gap-4">
                {metrics.length === 0 ? (
                  <div className="flex items-center py-4 text-sm text-neutral-400">
                    No metrics configured.
                  </div>
                ) : (
                  <table className="text-sm border-collapse w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-white sticky top-0 z-10">
                        <th className={thCls}>Name</th>
                        <th className={`${thCls} w-full`}>Prompt</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric, i) => (
                        <tr key={i} className="group">
                          <td className={tdCls}>
                            <input
                              type="text"
                              value={metric.name}
                              onChange={(e) =>
                                updateMetric(i, { name: e.target.value })
                              }
                              placeholder="Metric name"
                              className="bg-transparent transition-all focus:outline-none ring-1 ring-transparent hover:ring-black focus:ring-black hover:bg-neutral-100 focus:bg-neutral-100 p-2 min-w-40 w-full text-left"
                            />
                          </td>
                          <td className={`${tdCls} w-full`}>
                            <TextField
                              label="Edit prompt"
                              value={metric.prompt}
                              onChange={(v) => updateMetric(i, { prompt: v })}
                            />
                          </td>
                          <td className={`${tdCls} text-right`}>
                            <button
                              onClick={() =>
                                setMetrics((ms) =>
                                  ms.filter((_, idx) => idx !== i),
                                )
                              }
                              className="p-2 text-neutral-500 hover:text-black hover:cursor-pointer hover:bg-neutral-200/50 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <XMarkIcon className="size-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <button
                  onClick={() => setMetrics((ms) => [...ms, blankMetric()])}
                  className="mt-4 text-sm font-medium flex gap-2 pb-1 hover:cursor-pointer border-b border-transparent hover:border-black"
                >
                  <PlusIcon className="size-5" /> Add metric
                </button>
              </div>
              <TileFooter
                changed={metricsChanged}
                saving={saving === 'metrics'}
                onSave={() => handleSave('metrics')}
                onUndo={() => handleUndo('metrics')}
              />
            </ConfigTile>

            <ConfigTile title="Hyperparameters">
              <div className="p-4 flex flex-col gap-2 max-w-xs">
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-neutral-600 whitespace-nowrap">
                    Max tokens
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className={numberInputCls}
                  />
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-neutral-600 whitespace-nowrap">
                    Temperature
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className={numberInputCls}
                  />
                </label>
              </div>
              <TileFooter
                changed={hyperparamsChanged}
                saving={saving === 'hyperparams'}
                onSave={() => handleSave('hyperparams')}
                onUndo={() => handleUndo('hyperparams')}
              />
            </ConfigTile>
          </div>
        )}
      </div>
    </div>
  );
}
