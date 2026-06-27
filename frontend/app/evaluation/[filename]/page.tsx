'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { loadEvaluationFile, type EvalQuestion } from '@/lib/api';
import Spinner from '@/components/Spinner';
import { ArrowLeftIcon } from '@heroicons/react/16/solid';
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/DataTable';

export default function EvaluationFilePage() {
  const params = useParams();
  const filename = decodeURIComponent(params.filename as string);

  const [questions, setQuestions] = useState<EvalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadEvaluationFile(filename)
      .then(setQuestions)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Failed to load file'),
      )
      .finally(() => setLoading(false));
  }, [filename]);

  function toggleExpand(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 gap-2 shrink-0 items-center border-b border-neutral-200">
        <Link
          href="/evaluation"
          className="text-neutral-500 hover:text-neutral-700 transition-colors h-full w-14 items-center flex justify-center hover:bg-neutral-100"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <p className="text-base font-bold truncate">
          {filename.replace(/\.json$/, '')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-500 text-sm p-4">
            <Spinner />
            Loading…
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 p-4">{error}</p>
        )}

        {!loading && !error && questions.length > 0 && (
          <DataTable>
            <DataTableHead>
              <DataTableHeader className="px-2 w-8">#</DataTableHeader>
              <DataTableHeader className="pr-4 w-2/5">Question</DataTableHeader>
              <DataTableHeader className="pr-4 w-1/5">
                Expected answer
              </DataTableHeader>
              <DataTableHeader className="pr-4">Contexts</DataTableHeader>
            </DataTableHead>
            <DataTableBody>
              {questions.map((q, i) => {
                const isExpanded = expanded.has(i);
                return (
                  <DataTableRow key={i} className="align-top">
                    <DataTableCell className="px-2 tabular-nums">
                      {i + 1}
                    </DataTableCell>
                    <DataTableCell className="pr-4 leading-relaxed">
                      {q.question}
                    </DataTableCell>
                    <DataTableCell className="pr-4">{q.answer}</DataTableCell>
                    <DataTableCell className="pr-4">
                      {q.contexts.length === 0 ? (
                        <span className="text-neutral-500">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => toggleExpand(i)}
                            className="text-xs text-left transition-colors w-fit underline underline-offset-4 font-medium hover:cursor-pointer"
                          >
                            {isExpanded
                              ? 'Hide'
                              : `${q.contexts.length} ${q.contexts.length === 1 ? 'context' : 'contexts'}`}
                          </button>
                          {isExpanded && (
                            <ol className="flex flex-col gap-2 mt-1">
                              {q.contexts.map((ctx, j) => (
                                <li key={j} className="flex gap-2">
                                  <span className="text-neutral-500 tabular-nums shrink-0">
                                    {j + 1}.
                                  </span>
                                  <p className="text-xs leading-relaxed">
                                    {ctx}
                                  </p>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
