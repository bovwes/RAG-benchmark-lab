'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/16/solid';
import { browseDirs, getDefaultBrowsePath } from '@/lib/api';
import Image from 'next/image';

interface FolderPickerProps {
  initialPath?: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

function basename(p: string): string {
  return (
    p
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() || p
  );
}

export default function FolderPicker({
  initialPath,
  onSelect,
  onClose,
}: FolderPickerProps) {
  const [path, setPath] = useState('');
  const [parent, setParent] = useState<string | null>(null);
  const [dirs, setDirs] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function navigate(target: string) {
    setLoading(true);
    try {
      const result = await browseDirs(target);
      setPath(result.path);
      setParent(result.parent);
      setDirs(result.dirs);
      setFiles(result.files ?? []);
    } catch {
      // stay on current dir
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const start = initialPath || (await getDefaultBrowsePath());
      await navigate(start);
    }
    init();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white border border-black shadow-lg w-xl h-[50vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-200">
          <p className="text-sm font-medium mb-4">Open Folder</p>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() =>
                parent !== null ? navigate(parent) : navigate('')
              }
              disabled={parent === null && path === ''}
              className="text-sm p-2.5 hover:text-neutral-800 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <div className="text-sm truncate bg-neutral-200/50 p-2 w-full">
              {path || 'Select a drive'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-sm text-neutral-400">
              Loading…
            </div>
          ) : dirs.length === 0 && files.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-neutral-400">
              Empty folder
            </div>
          ) : (
            <>
              {dirs.map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => navigate(dir)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 flex items-center gap-2 transition-all hover:cursor-pointer"
                >
                  <Image
                    src="/images/folder.svg"
                    height={24}
                    width={24}
                    alt="Folder"
                  />
                  <span className="truncate">{basename(dir)}</span>
                </button>
              ))}
              {files.map((file) => (
                <div
                  key={file}
                  className="w-full px-4 py-2 text-sm flex items-center gap-2 text-neutral-500"
                >
                  <Image
                    src="/images/file.svg"
                    height={24}
                    width={24}
                    alt="File"
                    className="shrink-0"
                  />
                  <span className="truncate">{basename(file)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-end p-4 border-t border-neutral-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors hover:cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSelect(path)}
              disabled={!path}
              className="text-sm px-3 py-1.5 bg-black text-white hover:underline disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
