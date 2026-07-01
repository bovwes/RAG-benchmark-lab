"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listBenchmarks, type BenchmarkFileMeta } from "@/lib/api";
import Spinner from "@/components/Spinner";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from "@/components/DataTable";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type SortCol = "collection" | "saved_at" | "filename";

export default function BenchmarkListPage() {
  const [files, setFiles] = useState<BenchmarkFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const sortedFiles = sortCol
    ? [...files].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : files;

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
        <Link
          href="/benchmark/new"
          className="bg-black text-sm text-white px-4 py-2 hover:underline"
        >
          New Benchmark
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Spinner />
            Loading…
          </div>
        )}

        {!loading && files.length === 0 && (
          <div className="flex items-center justify-center gap-4 h-full">
            <Image
              src={"/images/diamond.svg"}
              height={52}
              width={52}
              alt="Start a benchmark"
            />
            <div className="flex flex-col">
              <p className="font-bold text-xl">Benchmarks</p>
              <p className="text-sm">No saved benchmarks yet</p>
            </div>
          </div>
        )}

        {!loading && files.length > 0 && (
          <DataTable>
            <DataTableHead>
              <DataTableHeader
                className="pr-4"
                onSort={() => handleSort("collection")}
                sortDir={sortCol === "collection" ? sortDir : null}
              >
                Collection
              </DataTableHeader>
              <DataTableHeader
                className="pr-4"
                onSort={() => handleSort("saved_at")}
                sortDir={sortCol === "saved_at" ? sortDir : null}
              >
                Date
              </DataTableHeader>
              <DataTableHeader className="pr-4">Configs</DataTableHeader>
              <DataTableHeader
                onSort={() => handleSort("filename")}
                sortDir={sortCol === "filename" ? sortDir : null}
              >
                File
              </DataTableHeader>
            </DataTableHead>
            <DataTableBody>
              {sortedFiles.map((f) => (
                <DataTableRow key={f.filename}>
                  <DataTableCell className="pr-4 flex gap-3 items-center">
                    <Image
                      src="images/benchmark_file.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="shrink-0"
                    />
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
                    {f.configs.join(" | ")}
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
