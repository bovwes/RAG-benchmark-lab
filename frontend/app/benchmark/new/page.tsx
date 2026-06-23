'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  runBenchmark,
  getCollections,
  getComponents,
  listEvaluationFiles,
  type BenchConfigSpec,
  type ComponentCategory,
  type ComponentInfo,
  type EvalFileMeta,
} from '@/lib/api';
import { componentSelectId } from '@/components/ComponentSelect';
import TextField from '@/components/TextField';
import Spinner from '@/components/Spinner';
import BenchmarkRunModal from '@/components/BenchmarkRunModal';
import { ArrowLeftIcon, XMarkIcon, PlusIcon } from '@heroicons/react/16/solid';

interface ConfigFormState {
  name: string;
  retriever: string;
  reranker: string;
  generator: string;
  generatorParams: Record<string, string | number>;
  top_k_retrieve: number;
  top_k_rerank: number;
}

function defaultParamsFor(
  component: ComponentInfo,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const p of component.parameters) {
    if (p.required || p.default === null) continue;
    out[p.name] =
      typeof p.default === 'string' || typeof p.default === 'number'
        ? p.default
        : String(p.default);
  }
  return out;
}

function blankConfig(
  index: number,
  retrievers: ComponentInfo[],
  rerankers: ComponentInfo[],
  generators: ComponentInfo[],
): ConfigFormState {
  const firstGen = generators[0];
  return {
    name: `Config ${index + 1}`,
    retriever: retrievers[0] ? componentSelectId(retrievers[0]) : '',
    reranker: rerankers[0] ? componentSelectId(rerankers[0]) : '',
    generator: firstGen ? componentSelectId(firstGen) : '',
    generatorParams: firstGen ? defaultParamsFor(firstGen) : {},
    top_k_retrieve: 10,
    top_k_rerank: 5,
  };
}

function InlineNum({
  value,
  step = 1,
  onChange,
}: {
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  function commit(s: string) {
    const n = Number(s);
    if (!isNaN(n)) onChange(n);
    setRaw(String(isNaN(n) ? value : n));
  }

  return (
    <input
      type="number"
      step={step}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && commit(raw)}
      className="w-16 text-sm bg-transparent transition-all ring-1 ring-transparent hover:ring-1 hover:ring-black focus:bg-neutral-100 focus:ring-1 focus:ring-black focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none p-2"
    />
  );
}

function InlineSelect({
  value,
  components,
  loading,
  onChange,
}: {
  value: string;
  components: ComponentInfo[];
  loading: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full bg-transparent text-sm focus:outline-none hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200/50 p-2"
    >
      {loading ? (
        <option value="">Loading…</option>
      ) : (
        components.map((c) => (
          <option key={componentSelectId(c)} value={componentSelectId(c)}>
            {c.name}
          </option>
        ))
      )}
    </select>
  );
}

export default function NewBenchmarkPage() {
  const router = useRouter();

  const [evalDatasetPath, setEvalDatasetPath] = useState('');
  const [evalFiles, setEvalFiles] = useState<EvalFileMeta[]>([]);
  const [collection, setCollection] = useState('documents');
  const [collections, setCollections] = useState<string[]>(['documents']);
  const [judge, setJudge] = useState(false);
  const [configs, setConfigs] = useState<ConfigFormState[]>([]);
  const [componentCategories, setComponentCategories] = useState<
    ComponentCategory[]
  >([]);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionCount =
    evalFiles.find((f) => `evaluation/${f.filename}` === evalDatasetPath)
      ?.question_count ?? 0;

  const retrievers =
    componentCategories.find((c) => c.category === 'retrievers')?.components ??
    [];
  const rerankers =
    componentCategories.find((c) => c.category === 'rerankers')?.components ??
    [];
  const generators =
    componentCategories.find((c) => c.category === 'generators')?.components ??
    [];

  const allParamDefs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const gen of generators) {
      for (const p of gen.parameters) {
        if (!p.required && !seen.has(p.name)) {
          seen.set(p.name, p.type as string);
        }
      }
    }
    return [...seen.entries()].map(([name, type]) => ({ name, type }));
  }, [generators]);

  useEffect(() => {
    listEvaluationFiles()
      .then((files) => {
        setEvalFiles(files);
        if (files.length > 0)
          setEvalDatasetPath(`evaluation/${files[0].filename}`);
      })
      .catch(() => {});
    getCollections()
      .then(setCollections)
      .catch(() => {});
    getComponents()
      .then((cats) => {
        setComponentCategories(cats);
        const rs =
          cats.find((c) => c.category === 'retrievers')?.components ?? [];
        const rr =
          cats.find((c) => c.category === 'rerankers')?.components ?? [];
        const gs =
          cats.find((c) => c.category === 'generators')?.components ?? [];
        setConfigs([0, 1, 2].map((i) => blankConfig(i, rs, rr, gs)));
      })
      .catch(() => {})
      .finally(() => setComponentsLoading(false));
  }, []);

  function updateConfig(i: number, patch: Partial<ConfigFormState>) {
    setConfigs((cs) =>
      cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  }

  function addConfig() {
    setConfigs((cs) => [
      ...cs,
      blankConfig(cs.length, retrievers, rerankers, generators),
    ]);
  }

  function removeConfig(i: number) {
    setConfigs((cs) => cs.filter((_, idx) => idx !== i));
  }

  function handleGeneratorChange(i: number, id: string) {
    const gen = generators.find((g) => componentSelectId(g) === id);
    updateConfig(i, {
      generator: id,
      generatorParams: gen ? defaultParamsFor(gen) : {},
    });
  }

  async function handleRun() {
    if (!evalDatasetPath.trim() || configs.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const apiConfigs: BenchConfigSpec[] = configs.map((cfg) => ({
        name: cfg.name,
        retriever: cfg.retriever,
        reranker: cfg.reranker,
        generator: cfg.generator,
        generator_params: cfg.generatorParams,
        top_k_retrieve: cfg.top_k_retrieve,
        top_k_rerank: cfg.top_k_rerank,
      }));
      const data = await runBenchmark({
        eval_dataset_path: evalDatasetPath.trim(),
        collection,
        judge,
        configs: apiConfigs,
      });
      router.push('/benchmark/' + encodeURIComponent(data.saved_as));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
  }

  const thCls =
    'px-5 py-4 text-left text-xs text-neutral-500 whitespace-nowrap';
  const tdCls = 'px-3 py-1.5 border-b border-neutral-100';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
      <BenchmarkRunModal
        open={loading}
        configs={configs}
        questionCount={questionCount}
        evalDatasetPath={evalDatasetPath}
        collection={collection}
        judge={judge}
      />
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200">
        <Link
          href="/benchmark"
          className="text-neutral-400 hover:text-neutral-700 transition-colors h-full w-14 flex items-center justify-center hover:bg-neutral-100"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <p className="text-base font-bold">New Benchmark</p>
        <div className="ml-auto flex items-center gap-2 pr-3">
          <button
            onClick={handleRun}
            disabled={
              loading ||
              componentsLoading ||
              !evalDatasetPath.trim() ||
              configs.length === 0
            }
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-black text-white hover:underline disabled:bg-neutral-300 disabled:cursor-not-allowed hover:cursor-pointer transition-colors"
          >
            {loading && <Spinner />}
            {loading ? 'Running…' : 'Start'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: global settings */}
        <aside className="w-lg border-r border-neutral-200 overflow-y-auto flex flex-col divide-y divide-neutral-200 text-sm">
          <div className="flex items-center justify-between p-4">
            <span className="text-neutral-500">Eval dataset</span>
            <select
              value={evalDatasetPath}
              onChange={(e) => setEvalDatasetPath(e.target.value)}
              disabled={evalFiles.length === 0}
              className="bg-neutral-200/50 focus:outline-none hover:bg-neutral-200 hover:cursor-pointer text-sm truncate disabled:opacity-50 disabled:cursor-not-allowed p-2 w-fit text-left"
            >
              {evalFiles.length === 0 ? (
                <option value="">No eval files found</option>
              ) : (
                evalFiles.map((f) => (
                  <option key={f.filename} value={`evaluation/${f.filename}`}>
                    {f.filename} ({f.question_count}q)
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <span className="text-neutral-500">Collection</span>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="bg-neutral-200/50 text-left hover:bg-neutral-200 focus:outline-none hover:bg-neutral-50 hover:cursor-pointer text-sm max-w-[110px] truncate p-2 w-fit"
            >
              {collections.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <span
              className={`${judge ? 'text-neutral-500' : 'text-neutral-300'}`}
            >
              LLM Judge
            </span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={judge}
                onClick={() => setJudge((v) => !v)}
                className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-200 hover:cursor-pointer focus:outline-none ${judge ? 'bg-salmon' : 'bg-neutral-200'}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${judge ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </label>
          </div>

          {loading && (
            <div className="p-4 flex items-center gap-2 text-sm text-neutral-400">
              <Spinner />
              <span>
                {configs.length} config{configs.length !== 1 ? 's' : ''}…
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-600">
              <p className="font-semibold mb-1">Error</p>
              <p className="break-words">{error}</p>
            </div>
          )}
        </aside>

        {/* Right: config table */}
        <main className="min-w-0 w-full overflow-x-auto">
          {componentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400 p-4">
              <Spinner />
              Loading components…
            </div>
          ) : configs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-neutral-400">
              Add at least one configuration to run a benchmark.
            </div>
          ) : (
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-white sticky top-0 z-10">
                  <th className={thCls}>Name</th>
                  <th className={thCls}>Retriever</th>
                  <th className={thCls}>top_k retrieve</th>
                  <th className={thCls}>Reranker</th>
                  <th className={thCls}>top_k rerank</th>
                  <th className={thCls}>Generator</th>
                  {allParamDefs.map(({ name }) => (
                    <th key={name} className={thCls}>
                      {name}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {configs.map((cfg, i) => {
                  const selectedGenerator = generators.find(
                    (g) => componentSelectId(g) === cfg.generator,
                  );
                  return (
                    <tr key={i} className="hover:bg-neutral-100 group">
                      <td className={tdCls}>
                        <input
                          type="text"
                          value={cfg.name}
                          onChange={(e) =>
                            updateConfig(i, { name: e.target.value })
                          }
                          placeholder={`Config ${i + 1}`}
                          onBlur={(e) => {
                            e.target.scrollLeft = 0;
                          }}
                          className="bg-transparent transition-all focus:outline-none ring-1 ring-transparent hover:ring-black focus:ring-black hover:bg-neutral-100 focus:bg-neutral-100 p-2 min-w-40 w-full text-left"
                        />
                      </td>
                      <td className={tdCls}>
                        <InlineSelect
                          value={cfg.retriever}
                          components={retrievers}
                          loading={componentsLoading}
                          onChange={(v) => updateConfig(i, { retriever: v })}
                        />
                      </td>
                      <td className={tdCls}>
                        <InlineNum
                          value={cfg.top_k_retrieve}
                          onChange={(v) =>
                            updateConfig(i, { top_k_retrieve: v })
                          }
                        />
                      </td>
                      <td className={tdCls}>
                        <InlineSelect
                          value={cfg.reranker}
                          components={rerankers}
                          loading={componentsLoading}
                          onChange={(v) => updateConfig(i, { reranker: v })}
                        />
                      </td>
                      <td className={tdCls}>
                        <InlineNum
                          value={cfg.top_k_rerank}
                          onChange={(v) => updateConfig(i, { top_k_rerank: v })}
                        />
                      </td>
                      <td className={tdCls}>
                        <InlineSelect
                          value={cfg.generator}
                          components={generators}
                          loading={componentsLoading}
                          onChange={(v) => handleGeneratorChange(i, v)}
                        />
                      </td>
                      {allParamDefs.map(({ name, type }) => {
                        const param = selectedGenerator?.parameters.find(
                          (p) => p.name === name,
                        );
                        if (!param) {
                          return (
                            <td
                              key={name}
                              className={`${tdCls} text-neutral-300`}
                            >
                              —
                            </td>
                          );
                        }
                        const value =
                          cfg.generatorParams[name] ??
                          (param.default as string | number) ??
                          '';
                        const onParamChange = (v: string | number) =>
                          updateConfig(i, {
                            generatorParams: {
                              ...cfg.generatorParams,
                              [name]: v,
                            },
                          });
                        if (type === 'int') {
                          return (
                            <td key={name} className={tdCls}>
                              <InlineNum
                                value={value as number}
                                onChange={onParamChange as (v: number) => void}
                              />
                            </td>
                          );
                        }
                        if (type === 'float') {
                          return (
                            <td key={name} className={tdCls}>
                              <InlineNum
                                value={value as number}
                                step={0.1}
                                onChange={onParamChange as (v: number) => void}
                              />
                            </td>
                          );
                        }
                        return (
                          <td key={name} className={tdCls}>
                            <TextField
                              label={name}
                              value={value as string}
                              onChange={onParamChange as (v: string) => void}
                            />
                          </td>
                        );
                      })}
                      <td className={`${tdCls} text-right`}>
                        {configs.length > 1 && (
                          <button
                            onClick={() => removeConfig(i)}
                            className="p-2 text-neutral-500 hover:text-black hover:cursor-pointer hover:bg-neutral-200/50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <XMarkIcon className="size-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="p-4">
            {configs.length < 5 && (
              <button
                onClick={addConfig}
                disabled={componentsLoading}
                className="text-sm font-medium flex gap-2 pb-1 hover:cursor-pointer hover:border-b"
              >
                <PlusIcon className="size-5" /> Add config
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
