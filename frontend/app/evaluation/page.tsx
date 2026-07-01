"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { listEvaluationFiles, type EvalFileMeta } from "@/lib/api";
import Spinner from "@/components/Spinner";
import Link from "next/link";
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from "@/components/DataTable";

export default function EvaluationPage() {
  const [files, setFiles] = useState<EvalFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEvaluationFiles()
      .then(setFiles)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Failed to load evaluation files",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Evaluation sets</p>
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
            No evaluation files found. Add a .json file to the{" "}
            <code className="text-xs bg-neutral-100 px-1 py-0.5">
              evaluation/
            </code>{" "}
            folder.
          </p>
        )}

        {!loading && !error && files.length > 0 && (
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
                      src="images/eval_file.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="shrink-0"
                    />
                    <Link
                      href={`/evaluation/${encodeURIComponent(f.filename)}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {f.filename.replace(/\.json$/, "")}{" "}
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
