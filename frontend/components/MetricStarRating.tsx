'use client';

import { useId } from 'react';

export interface StarDatum {
  name: string;
  value: number;
}

const STAR_PATH =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
const EMPTY_COLOR = '#e5e7eb';
const STAR_SIZE = 24;

function roundToHalf(v: number) {
  return Math.round(v * 2) / 2;
}

function StarRow({
  value,
  color,
  name,
}: {
  value: number;
  color: string;
  name: string;
}) {
  const gradientId = useId().replace(/:/g, '_');
  const rounded = Math.max(1, Math.min(5, roundToHalf(value)));
  const full = Math.floor(rounded);
  const hasHalf = rounded % 1 === 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center justify-between" title={name}>
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: full }).map((_, i) => (
          <svg key={i} viewBox="0 0 24 24" width={STAR_SIZE} height={STAR_SIZE}>
            <path d={STAR_PATH} fill={color} />
          </svg>
        ))}
        {hasHalf && (
          <svg viewBox="0 0 24 24" width={STAR_SIZE} height={STAR_SIZE}>
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="24"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="50%" stopColor={color} />
                <stop offset="50%" stopColor={EMPTY_COLOR} />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill={`url(#${gradientId})`} />
          </svg>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <svg key={i} viewBox="0 0 24 24" width={STAR_SIZE} height={STAR_SIZE}>
            <path d={STAR_PATH} fill={EMPTY_COLOR} />
          </svg>
        ))}
      </div>
      <span className="text-xs tabular-nums text-neutral-400">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export default function MetricStarRating({
  data,
  colorOf,
}: {
  data: StarDatum[];
  colorOf: (name: string) => string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-neutral-400">No configurations selected.</p>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center gap-1">
      {data.map((d) => (
        <StarRow
          key={d.name}
          value={d.value}
          color={colorOf(d.name)}
          name={d.name}
        />
      ))}
    </div>
  );
}
