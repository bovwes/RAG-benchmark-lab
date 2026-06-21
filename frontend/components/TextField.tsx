'use client';

import { useEffect, useRef, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/16/solid';
import { createPortal } from 'react-dom';

export default function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function openModal() {
    setDraft(value);
    setOpen(true);
  }

  function save() {
    onChange(draft);
    setOpen(false);
  }

  function cancel() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center justify-between px-2 py-1.5 hover:bg-neutral-200/50 w-full text-left hover:cursor-pointer"
      >
        <span className="text-sm text-neutral-500 select-none">{label}</span>

        <PencilSquareIcon className="size-5 text-salmon" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={cancel} />
            <div className="relative bg-white shadow-xl w-full max-w-lg mx-4 flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-200">
                <span className="text-sm font-medium text-neutral-700">
                  {label}
                </span>
              </div>
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="w-full bg-neutral-100 px-3 py-2 text-xs font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <div className="px-4 py-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  onClick={cancel}
                  className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="px-3 py-1.5 text-sm bg-black text-white focus:outline-none"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
