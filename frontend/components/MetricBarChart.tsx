import { useState } from 'react';

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
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const min = domainMin ?? 0;
  const max = domainMax ?? Math.max(...data.map((d) => d.value), min + 0.0001);
  const range = max - min;
  const fmt = format ?? ((v: number) => v.toFixed(2));

  const hovered = hoveredName ? data.find((d) => d.name === hoveredName) : null;

  return (
    <div className="h-full">
      {data.length === 0 ? (
        <p className="text-xs text-neutral-400">No configurations selected.</p>
      ) : (
        <div className="flex gap-2 h-full">
          <div className="relative flex flex-col justify-between items-end shrink-0 h-full">
            {hovered && (
              <span
                className="absolute text-sm tabular-nums leading-none right-0 transition-all p-1 text-white "
                style={{
                  background: colorOf(hovered.name),
                  bottom: `${Math.min(100, ((hovered.value - min) / range) * 100)}%`,
                  transform: 'translateY(100%)',
                }}
              >
                {fmt(hovered.value)}
              </span>
            )}
            <span
              className={`text-xs tabular-nums leading-none transition-all ${
                hovered ? 'text-neutral-300' : 'text-neutral-400'
              }`}
            >
              {fmt(max)}
            </span>

            <span
              className={`text-xs tabular-nums leading-none transition-opacity transition-all ${
                hovered ? 'text-neutral-300' : 'text-neutral-400'
              }`}
            >
              {fmt(min + range / 2)}
            </span>

            <span
              className={`text-xs tabular-nums leading-none transition-opacity transition-all ${
                hovered ? 'text-neutral-300' : 'text-neutral-400'
              }`}
            >
              {fmt(min)}
            </span>
          </div>
          <div className="flex flex-1 items-end justify-center">
            {data.map((d) => (
              <div
                key={d.name}
                title={d.name}
                className="h-full flex items-end px-0.5"
                onMouseEnter={() => setHoveredName(d.name)}
                onMouseLeave={() => setHoveredName(null)}
              >
                <div
                  className="w-5 shrink-0 transition-all"
                  style={{
                    height: `${Math.min(100, ((d.value - min) / range) * 100)}%`,
                    backgroundColor: colorOf(d.name),
                    opacity: hoveredName && hoveredName !== d.name ? 0.25 : 1,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
