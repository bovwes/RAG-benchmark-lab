'use client';

import { useState } from 'react';
import { type BenchmarkConfigResult, type BenchConfigSpec } from '@/lib/api';
import Card from './Card';
import MetricBarChart from './MetricBarChart';
import MetricStarRating from './MetricStarRating';
import BenchmarkLatencyChart from './BenchmarkLatencyChart';
import BenchmarkQuestionCard from './BenchmarkQuestionCard';
import BenchmarkLegend from './BenchmarkLegend';

const COLOR_PALETTE = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'];

const METRICS: {
  key: string;
  label: string;
  subtitle: string;
  judge?: boolean;
  domainMin?: number;
  domainMax?: number;
}[] = [
  {
    key: 'recall_at_k',
    label: 'Recall@K',
    subtitle: 'Relevant docs found in top-K',
    domainMin: 0,
    domainMax: 1,
  },
  {
    key: 'precision_at_k',
    label: 'Precision@K',
    subtitle: 'Fraction of top-K docs that are relevant',
    domainMin: 0,
    domainMax: 1,
  },
  {
    key: 'mrr',
    label: 'MRR',
    subtitle: 'Mean reciprocal rank of first relevant result',
    domainMin: 0,
    domainMax: 1,
  },
  {
    key: 'token_f1',
    label: 'Token F1',
    subtitle: 'Token-overlap with reference answer',
    domainMin: 0,
    domainMax: 1,
  },
  {
    key: 'rouge_l',
    label: 'ROUGE-L',
    subtitle: 'Longest common subsequence overlap',
    domainMin: 0,
    domainMax: 1,
  },
  {
    key: 'exact_match',
    label: 'Exact Match',
    subtitle: 'Fraction of exact answer matches',
    domainMin: 0,
    domainMax: 1,
  },
  {
    key: 'faithfulness',
    label: 'Faithfulness',
    subtitle: 'LLM Judge-assigned answer faithfulness score (1-5)',
    judge: true,
    domainMin: 1,
    domainMax: 5,
  },
  {
    key: 'relevance',
    label: 'Relevance',
    subtitle: 'LLM Judge-assigned answer relevance score (1-5)',
    judge: true,
    domainMin: 1,
    domainMax: 5,
  },
];

interface Props {
  results: BenchmarkConfigResult[];
  judge: boolean;
  configs?: BenchConfigSpec[];
}

export default function BenchmarkResults({ results, judge, configs }: Props) {
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(results.map((r) => r.config)),
  );
  const [selectedQConfig, setSelectedQConfig] = useState(
    results[0]?.config ?? '',
  );
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set());

  function toggleVisible(name: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleQ(i: number) {
    setExpandedQ((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function colorOf(name: string): string {
    const idx = results.findIndex((r) => r.config === name);
    return COLOR_PALETTE[idx % COLOR_PALETTE.length] ?? '#999';
  }

  const filtered = results.filter((r) => visible.has(r.config));
  const activeQuestionConfig =
    filtered.find((r) => r.config === selectedQConfig) ?? filtered[0] ?? null;

  return (
    <div className="flex flex-col gap-4 p-5">
      <BenchmarkLegend
        results={results}
        visible={visible}
        configs={configs}
        colorOf={colorOf}
        onToggle={toggleVisible}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="grid xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-4 h-fit">
          {METRICS.filter((m) => !m.judge || judge).map((m) => (
            <Card key={m.key} title={m.label} hint={m.subtitle} square>
              {m.judge ? (
                <MetricStarRating
                  data={filtered.map((r) => ({
                    name: r.config,
                    value: r.metrics[m.key] ?? 0,
                  }))}
                  colorOf={colorOf}
                />
              ) : (
                <MetricBarChart
                  subtitle={m.subtitle}
                  data={filtered.map((r) => ({
                    name: r.config,
                    value: r.metrics[m.key] ?? 0,
                  }))}
                  colorOf={colorOf}
                  domainMin={m.domainMin}
                  domainMax={m.domainMax}
                />
              )}
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Latency">
            <BenchmarkLatencyChart
              data={filtered.map((r) => ({
                name: r.config,
                retrieve: r.metrics.retrieve_ms ?? 0,
                rerank: r.metrics.rerank_ms ?? 0,
                generate: r.metrics.generate_ms ?? 0,
                total: r.metrics.total_ms ?? 0,
              }))}
            />
          </Card>
          <Card title="Per-question results">
            <div className="flex flex-col gap-4">
              <select
                value={selectedQConfig}
                onChange={(e) => {
                  setSelectedQConfig(e.target.value);
                  setExpandedQ(new Set());
                }}
                className="w-full max-w-xs bg-neutral-200/50 px-3 py-1.5 text-sm focus:outline-none transition-colors hover:bg-neutral-200 hover:cursor-pointer"
              >
                {filtered.map((r) => (
                  <option key={r.config} value={r.config}>
                    {r.config}
                  </option>
                ))}
              </select>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {activeQuestionConfig?.per_question.map((q, i) => (
                  <BenchmarkQuestionCard
                    key={i}
                    q={q}
                    expanded={expandedQ.has(i)}
                    onToggle={() => toggleQ(i)}
                    showJudge={judge}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
