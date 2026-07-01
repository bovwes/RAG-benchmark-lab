"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from "@/components/DataTable";
import { getCollectionsDetail, type CollectionDetail } from "@/lib/api";

export default function IngestPage() {
  const [collections, setCollections] = useState<CollectionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCollections() {
    setLoading(true);
    setError(null);
    try {
      setCollections(await getCollectionsDetail());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Collections</p>
        <Link
          href="/collections/new"
          className="bg-black text-sm text-white px-4 py-2 hover:underline"
        >
          New collection
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {!loading && !error && collections.length === 0 && (
          <p className="text-sm text-neutral-400">
            No collections found in ChromaDB.
          </p>
        )}

        {!loading && !error && collections.length > 0 && (
          <DataTable>
            <DataTableHead>
              <DataTableHeader className="pr-4">Name</DataTableHeader>
              <DataTableHeader className="pr-4">Chunks</DataTableHeader>
              <DataTableHeader>Metadata</DataTableHeader>
            </DataTableHead>
            <DataTableBody>
              {collections.map((col) => {
                const metaEntries = Object.entries(col.metadata);
                return (
                  <DataTableRow key={col.name}>
                    <DataTableCell className="pr-4">
                      <div className="flex items-center gap-3 font-medium">
                        <Image
                          src="images/vector_file.svg"
                          alt=""
                          width={24}
                          height={24}
                          className="shrink-0"
                        />
                        {col.name}
                      </div>
                    </DataTableCell>
                    <DataTableCell className="pr-4 text-neutral-500 tabular-nums whitespace-nowrap">
                      {col.count.toLocaleString()}
                    </DataTableCell>
                    <DataTableCell className="text-neutral-500 text-xs">
                      {metaEntries.length > 0
                        ? metaEntries.map(([k, v]) => `${k}=${v}`).join("  ·  ")
                        : "—"}
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
