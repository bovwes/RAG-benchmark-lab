'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getComponents, type ComponentCategory } from '@/lib/api';
import ComponentCard from '@/components/ComponentCard';
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

const CATEGORY_ICONS: Record<string, string> = {
  retrievers: 'images/cube_1.svg',
  rerankers: 'images/cube_2.svg',
  generators: 'images/cube_3.svg',
};

const CATEGORY_LABELS: Record<string, string> = {
  retrievers: 'Retrievers',
  rerankers: 'Rerankers',
  generators: 'Generators',
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export default function ComponentsPage() {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { view, setView } = useView();

  useEffect(() => {
    getComponents()
      .then(setCategories)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Failed to load components'),
      )
      .finally(() => setLoading(false));
  }, []);

  const totalComponents = categories.reduce(
    (sum, cat) => sum + cat.components.length,
    0,
  );

  const allComponents = categories.flatMap((cat) =>
    cat.components.map((c) => ({ ...c, category: cat.category })),
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Components</p>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <p className="text-sm text-neutral-400 p-4">Loading components…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 p-4">{error}</p>
        )}

        {!loading && !error && totalComponents === 0 && (
          <p className="text-sm text-neutral-400 p-4">No components found.</p>
        )}

        {!loading && !error && totalComponents > 0 && view === 'tile' && (
          <div className="flex flex-col gap-6">
            {categories.map((cat) => (
              <div key={cat.category} className="flex flex-col">
                <div className="flex items-center gap-2 pb-4">
                  <p className="text-neutral-500">
                    {categoryLabel(cat.category)}
                  </p>
                </div>

                {cat.components.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">
                    No components found in this category.
                  </p>
                ) : (
                  <div className="columns-1 xl:columns-2 gap-3">
                    {cat.components.map((component) => (
                      <div key={component.name} className="mb-3 break-inside-avoid">
                        <ComponentCard
                          component={component}
                          category={cat.category}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && totalComponents > 0 && view === 'table' && (
          <DataTable>
            <DataTableHead>
              <DataTableHeader className="pr-4">Name</DataTableHeader>
              <DataTableHeader className="pr-4">Category</DataTableHeader>
              <DataTableHeader className="pr-4">Default</DataTableHeader>
              <DataTableHeader className="pr-4">Module</DataTableHeader>
              <DataTableHeader>Description</DataTableHeader>
            </DataTableHead>
            <DataTableBody>
              {allComponents.map((c) => (
                <DataTableRow key={`${c.category}/${c.name}`}>
                  <DataTableCell className="pr-4">
                    <div className="flex items-center gap-3 font-medium">
                      <Image
                        src={CATEGORY_ICONS[c.category] ?? 'images/cube_1.svg'}
                        alt=""
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                      {c.name}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="pr-4 text-neutral-500">
                    {categoryLabel(c.category)}
                  </DataTableCell>
                  <DataTableCell className="pr-4 text-neutral-500">
                    {c.default_name ?? '—'}
                  </DataTableCell>
                  <DataTableCell className="pr-4 text-neutral-400 text-xs truncate max-w-xs">
                    {c.module}
                  </DataTableCell>
                  <DataTableCell className="text-neutral-500 text-xs truncate max-w-sm">
                    {c.docstring ?? '—'}
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
