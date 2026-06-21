import type { Latency } from '@/lib/api';

const segments = [
  {
    key: 'retrieve_ms' as keyof Latency,
    label: 'Retrieval',
    bar: 'bg-sky-300',
    card: 'border-sky-300',
  },
  {
    key: 'rerank_ms' as keyof Latency,
    label: 'Reranking',
    bar: 'bg-sky-400',
    card: 'border-sky-400',
  },
  {
    key: 'generate_ms' as keyof Latency,
    label: 'Generation',
    bar: 'bg-sky-500',
    card: 'border-sky-500',
  },
];

export default function LatencyBar({ latency }: { latency: Latency }) {
  const total = latency.total_ms || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="h-4 w-full overflow-hidden flex">
        {segments.map((s) => {
          const ms = latency[s.key] as number;
          if (!ms) return null;
          return (
            <div
              key={s.label}
              style={{ width: `${(ms / total) * 100}%` }}
              className={`${s.bar} transition-all`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {segments.map((s) => {
          const ms = latency[s.key] as number;
          return (
            <div key={s.label} className={`px-3 border-l-3  ${s.card}`}>
              <div className="text-xs mb-0.5 text-neutral-500">{s.label}</div>
              <div className="text-base">
                {ms ?? 0}
                <span className="font-normal ml-1">ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
