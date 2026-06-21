'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listBenchmarks, type BenchmarkFileMeta } from '@/lib/api';
import Spinner from '@/components/Spinner';
import TileCard from '@/components/TileCard';
import ViewToggle from '@/components/ViewToggle';
import { useView } from '@/context/ViewContext';
import { PlusCircleIcon } from '@heroicons/react/16/solid';
import Image from 'next/image';
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/DataTable';

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

export default function BenchmarkListPage() {
  const [files, setFiles] = useState<BenchmarkFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { view, setView } = useView();

  useEffect(() => {
    listBenchmarks()
      .then(setFiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Benchmarks</p>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <Link
            href="/benchmark/new"
            className="bg-black text-sm text-white px-4 py-2 hover:underline"
          >
            New Benchmark
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Spinner />
            Loading…
          </div>
        )}

        {!loading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-8 h-full text-center">
            <Image
              src={'/images/diamond_large.svg'}
              height={240}
              width={320}
              alt="Start a benchmark"
            />
            <div className="flex flex-col gap-2">
              <p className="font-bold text-2xl">Benchmarks</p>
              <p>No saved benchmarks yet</p>
            </div>
          </div>
        )}

        {!loading && files.length > 0 && view === 'tile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((f) => (
              <TileCard
                key={f.filename}
                href={`/benchmark/${encodeURIComponent(f.filename)}`}
                icon={
                  <Image
                    src="images/diamond.svg"
                    alt="Benchmark"
                    width={32}
                    height={32}
                  />
                }
                title={f.collection}
                subtitle={formatDate(f.saved_at)}
                footer={f.filename}
              >
                <p className="text-sm p-4 truncate">
                  {f.configs.join('  |  ')}
                </p>
              </TileCard>
            ))}
          </div>
        )}

        {!loading && files.length > 0 && view === 'table' && (
          <DataTable>
            <DataTableHead>
              <DataTableHeader className="pr-4">Collection</DataTableHeader>
              <DataTableHeader className="pr-4">Date</DataTableHeader>
              <DataTableHeader className="pr-4">Configs</DataTableHeader>
              <DataTableHeader>File</DataTableHeader>
            </DataTableHead>
            <DataTableBody>
              {files.map((f) => (
                <DataTableRow key={f.filename}>
                  <DataTableCell className="pr-4">
                    <Link
                      href={`/benchmark/${encodeURIComponent(f.filename)}`}
                      className="font-medium underline-offset-4 underline"
                    >
                      {f.collection}
                    </Link>
                  </DataTableCell>
                  <DataTableCell className="pr-4 text-neutral-500 whitespace-nowrap">
                    {formatDate(f.saved_at)}
                  </DataTableCell>
                  <DataTableCell className="pr-4 text-neutral-500 truncate max-w-xs">
                    {f.configs.join(' | ')}
                  </DataTableCell>
                  <DataTableCell className="text-neutral-400 text-xs truncate max-w-xs">
                    {f.filename}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
