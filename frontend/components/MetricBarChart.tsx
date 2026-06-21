export interface MetricBarDatum {
  name: string;
  value: number;
}

export default function MetricBarChart({
  data,
  colorOf,
  domainMin,
  domainMax,
  format,
}: {
  subtitle?: string;
  data: MetricBarDatum[];
  colorOf: (name: string) => string;
  domainMin?: number;
  domainMax?: number;
  format?: (v: number) => string;
}) {
  const min = domainMin ?? 0;
  const max = domainMax ?? Math.max(...data.map((d) => d.value), min + 0.0001);
  const range = max - min;
  const fmt = format ?? ((v: number) => v.toFixed(2));

  return (
    <div className="h-full">
      {data.length === 0 ? (
        <p className="text-xs text-neutral-400">No configurations selected.</p>
      ) : (
        <div className="flex gap-2 h-full">
          <div className="flex flex-col justify-between items-end shrink-0">
            <span className="text-xs tabular-nums text-neutral-400 leading-none">
              {fmt(max)}
            </span>
            <span className="text-xs tabular-nums text-neutral-400 leading-none">
              {fmt(min + range / 2)}
            </span>
            <span className="text-xs tabular-nums text-neutral-400 leading-none">
              {fmt(min)}
            </span>
          </div>
          <div className="flex flex-1 items-end justify-center gap-1">
            {data.map((d) => (
              <div
                key={d.name}
                className="w-5 shrink-0 transition-all"
                title={d.name}
                style={{
                  height: `${Math.min(100, ((d.value - min) / range) * 100)}%`,
                  backgroundColor: colorOf(d.name),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
