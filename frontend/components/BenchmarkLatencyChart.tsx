export interface LatencyDatum {
  name: string;
  retrieve: number;
  rerank: number;
  generate: number;
  total: number;
}

const PHASES = [
  { key: 'retrieve', label: 'Retrieve', className: 'bg-sky-300' },
  { key: 'rerank', label: 'Rerank', className: 'bg-sky-400' },
  { key: 'generate', label: 'Generate', className: 'bg-sky-500' },
] as const;

export default function BenchmarkLatencyChart({
  data,
}: {
  data: LatencyDatum[];
}) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 text-xs text-neutral-500">
        {PHASES.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 inline-block ${p.className}`} />
            {p.label}
          </span>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-neutral-400">No configurations selected.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="w-24 shrink-0 truncate text-xs text-neutral-500"
                title={d.name}
              >
                {d.name}
              </span>
              <div className="flex-1 h-6 bg-neutral-200/50 flex overflow-hidden">
                {PHASES.map((p) => {
                  const ms = d[p.key];
                  if (!ms) return null;
                  return (
                    <div
                      key={p.key}
                      className={`${p.className} transition-all`}
                      style={{ width: `${(ms / max) * 100}%` }}
                    />
                  );
                })}
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums">
                {d.total.toFixed(0)} ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
