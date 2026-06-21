'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  loadBenchmarkFile,
  type BenchmarkConfigResult,
  type BenchConfigSpec,
} from '@/lib/api';
import BenchmarkResults from '@/components/BenchmarkResults';
import Spinner from '@/components/Spinner';
import { ArrowLeftIcon } from '@heroicons/react/16/solid';

interface LoadedBenchmark {
  results: BenchmarkConfigResult[];
  judge: boolean;
  saved_at: string;
  collection: string;
  configs?: BenchConfigSpec[];
}

export default function BenchmarkResultPage() {
  const params = useParams();
  const filename = decodeURIComponent(params.filename as string);

  const [data, setData] = useState<LoadedBenchmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmarkFile(filename)
      .then((d) =>
        setData({
          results: d.results,
          judge: d.judge,
          saved_at: d.saved_at,
          collection: d.collection,
          configs: d.configs,
        }),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filename]);

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 gap-2 shrink-0 items-center border-b border-neutral-200 pr-4">
        <Link
          href="/benchmark"
          className="text-neutral-400 hover:text-neutral-700 transition-colors h-full w-14 items-center flex justify-center hover:bg-neutral-100"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <p className="text-base font-bold">Benchmark Results</p>
        {data && (
          <div className="ml-auto flex items-center gap-3 text-xs text-neutral-500">
            <span>{data.collection}</span>
            <span>{formatDate(data.saved_at)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-48 gap-2 text-neutral-500 text-sm">
            <Spinner />
            Loading…
          </div>
        )}
        {error && (
          <div className="m-5 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {data && (
          <BenchmarkResults
            results={data.results}
            judge={data.judge}
            configs={data.configs}
          />
        )}
      </div>
    </div>
  );
}
