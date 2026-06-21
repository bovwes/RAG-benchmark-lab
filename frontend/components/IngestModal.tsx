'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon, FolderPlusIcon } from '@heroicons/react/16/solid';
import { ingestFolder, type IngestResult } from '@/lib/api';
import Image from 'next/image';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const EXT_OPTIONS = ['.txt', '.md', '.pdf'];

export default function IngestModal({ onClose, onSuccess }: Props) {
  const [folderPath, setFolderPath] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [extensions, setExtensions] = useState<string[]>([
    '.txt',
    '.md',
    '.pdf',
  ]);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function toggleExt(ext: string) {
    setExtensions((prev) =>
      prev.includes(ext) ? prev.filter((e) => e !== ext) : [...prev, ext],
    );
  }

  function deriveName(path: string) {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    return parts[parts.length - 1] ?? '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!folderPath.trim() || !collectionName.trim() || extensions.length === 0)
      return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await ingestFolder({
        folder_path: folderPath.trim(),
        collection_name: collectionName.trim(),
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        extensions,
        overwrite,
      });
      setResult(res);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-black shadow-xl w-full max-w-md mx-4 flex flex-col overflow-hidden ">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-neutral-200">
          <div className="flex gap-2 items-center text-sm font-semibold">
            <Image
              src={'/images/files.svg'}
              alt="Collections"
              width={120}
              height={120}
              className="w-9 h-9 object-cover"
            />{' '}
            New Collection
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-800 transition-colors hover:cursor-pointer hover:bg-neutral-100 "
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3">
          {/* Folder path */}
          <Field label="Folder path">
            <input
              ref={firstInputRef}
              type="text"
              value={folderPath}
              onChange={(e) => {
                setFolderPath(e.target.value);
              }}
              placeholder="/path/to/your/documents"
              className={inputCls}
              required
            />
          </Field>

          {/* Collection name */}
          <Field label="Collection name">
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="my-collection"
              className={inputCls}
              required
            />
          </Field>

          {/* Chunk size + overlap */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Chunk size — ${chunkSize} chars`}>
              <input
                type="range"
                min={128}
                max={2048}
                step={64}
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </Field>
            <Field label={`Overlap — ${chunkOverlap} chars`}>
              <input
                type="range"
                min={0}
                max={512}
                step={16}
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </Field>
          </div>

          {/* File types */}
          <Field label="File types">
            <div className="flex gap-3">
              {EXT_OPTIONS.map((ext) => (
                <label
                  key={ext}
                  className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={extensions.includes(ext)}
                    onChange={() => toggleExt(ext)}
                    className="accent-indigo-600"
                  />
                  {ext}
                </label>
              ))}
            </div>
          </Field>

          {/* Overwrite */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="accent-indigo-600"
            />
            <span className="text-neutral-600">
              Overwrite if collection already exists
            </span>
          </label>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Success */}
          {result && (
            <p className="text-sm text-emerald-600">
              Done — {result.files_processed} file
              {result.files_processed !== 1 ? 's' : ''},{' '}
              {result.chunks_added.toLocaleString()} chunks added to{' '}
              <strong>{result.collection}</strong>.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-neutral-200 hover:bg-neutral-50 hover:underline hover:cursor-pointer"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                type="submit"
                disabled={loading || extensions.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black text-white hover:underline hover:cursor-pointer disabled:bg-neutral-100 disabled:text-black"
              >
                {loading && <Spinner />}
                {loading ? 'Ingesting…' : 'Ingest'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}

const inputCls =
  'w-full text-sm border border-neutral-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black';
