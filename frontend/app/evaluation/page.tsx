'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { listEvaluationFiles, type EvalFileMeta } from '@/lib/api';
import Spinner from '@/components/Spinner';
import TileCard from '@/components/TileCard';
import ViewToggle from '@/components/ViewToggle';
import { useView } from '@/context/ViewContext';
import Link from 'next/link';
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/DataTable';

export default function EvaluationPage() {
  const [files, setFiles] = useState<EvalFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { view, setView } = useView();

  useEffect(() => {
    listEvaluationFiles()
      .then(setFiles)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : 'Failed to load evaluation files',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const icon = (
    <Image src="images/star.svg" alt="Evaluation" width={32} height={32} />
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Evaluation sets</p>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Spinner />
            Loading…
          </div>
        )}

        {!loading && error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && files.length === 0 && (
          <p className="text-sm text-neutral-400">
            No evaluation files found. Add a .json file to the{' '}
            <code className="text-xs bg-neutral-100 px-1 py-0.5">
              evaluation/
            </code>{' '}
            folder.
          </p>
        )}

        {!loading && !error && files.length > 0 && view === 'tile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((f) => (
              <TileCard
                key={f.filename}
                href={`/evaluation/${encodeURIComponent(f.filename)}`}
                icon={icon}
                title={f.filename.replace(/\.json$/, '')}
                subtitle={`${f.question_count} ${f.question_count === 1 ? 'question' : 'questions'}`}
              />
            ))}
          </div>
        )}

        {!loading && !error && files.length > 0 && view === 'table' && (
          <DataTable>
            <DataTableHead>
              <DataTableHeader className="pr-4">File</DataTableHeader>
              <DataTableHeader>Questions</DataTableHeader>
            </DataTableHead>
            <DataTableBody>
              {files.map((f) => (
                <DataTableRow key={f.filename}>
                  <DataTableCell className="pr-4 flex items-center gap-3">
                    <Image
                      src="images/star.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="shrink-0"
                    />
                    <Link
                      href={`/evaluation/${encodeURIComponent(f.filename)}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {f.filename.replace(/\.json$/, '')}{' '}
                    </Link>
                  </DataTableCell>
                  <DataTableCell className="text-neutral-500 tabular-nums">
                    {f.question_count}
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
