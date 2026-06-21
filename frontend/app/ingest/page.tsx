'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import IngestModal from '@/components/IngestModal';
import TileCard from '@/components/TileCard';
import ViewToggle from '@/components/ViewToggle';
import { useView } from '@/context/ViewContext';
import {
  DataTable,
  DataTableHead,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/DataTable';

type Collection = {
  name: string;
  count: number;
  metadata: Record<string, string | number | boolean>;
};

export default function IngestPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { view, setView } = useView();

  async function fetchCollections() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/collections`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCollections(data.collections);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  const collectionIcon = (
    <Image src="images/files.svg" alt="Collection" width={32} height={32} />
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Collections</p>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-sm text-white px-4 py-2 hover:underline hover:cursor-pointer"
          >
            New collection
          </button>
        </div>
      </div>

      {showModal && (
        <IngestModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchCollections}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {!loading && !error && collections.length === 0 && (
          <p className="text-sm text-neutral-400">
            No collections found in ChromaDB.
          </p>
        )}

        {!loading && !error && collections.length > 0 && view === 'tile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collections.map((col) => {
              const metaEntries = Object.entries(col.metadata);
              return (
                <TileCard
                  key={col.name}
                  icon={collectionIcon}
                  title={col.name}
                  subtitle={`${col.count.toLocaleString()} ${col.count === 1 ? 'chunk' : 'chunks'}`}
                >
                  {metaEntries.length > 0 ? (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm p-4">
                      {metaEntries.map(([k, v]) => (
                        <>
                          <dt key={`${k}-k`} className="text-neutral-400">
                            {k}
                          </dt>
                          <dd
                            key={`${k}-v`}
                            className="text-neutral-700 truncate"
                          >
                            {String(v)}
                          </dd>
                        </>
                      ))}
                    </dl>
                  ) : (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm p-4 text-neutral-500">
                      No metadata
                    </dl>
                  )}
                </TileCard>
              );
            })}
          </div>
        )}

        {!loading && !error && collections.length > 0 && view === 'table' && (
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
                          src="images/files.svg"
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
                        ? metaEntries.map(([k, v]) => `${k}=${v}`).join('  ·  ')
                        : '—'}
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
