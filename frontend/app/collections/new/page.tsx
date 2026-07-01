"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/16/solid";
import { FolderOpenIcon } from "@heroicons/react/16/solid";
import {
  ingestFolder,
  chunkPreview,
  getSampleText,
  getFolderInfo,
  getCollections,
  type ChunkPreviewChunk,
  type ChunkStrategy,
  DEFAULT_SEPARATORS,
} from "@/lib/api";
import FolderPicker from "@/components/FolderPicker";
import ErrorBanner from "@/components/ErrorBanner";
import NumberField from "@/components/NumberField";
import Dropdown from "@/components/Dropdown";
import MultiSelect from "@/components/MultiSelect";
import Image from "next/image";

const EXT_OPTIONS = [".txt", ".md", ".pdf"];

const SEPARATOR_OPTIONS = [
  { value: "\n\n", label: "Double return (↵↵)" },
  { value: "\n", label: "Return (↵)" },
  { value: ". ", label: "Period (. )" },
  { value: " ", label: "Space (·)" },
];

const CHUNK_COLORS = [
  { bg: "#FAEDCB" },
  { bg: "#C9E4DF" },
  { bg: "#C5DEF2" },
  { bg: "#DBCDF0" },
  { bg: "#F2C6DF" },
  { bg: "#F8D9C4" },
];

function displaySep(s: string): string {
  if (s === "") return "∅ empty";
  return s.replace(/\n/g, "↵").replace(/\t/g, "→").replace(/ /g, "·");
}

function parseSep(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
}

export default function NewCollectionPage() {
  const router = useRouter();

  const [folderPath, setFolderPath] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [extensions, setExtensions] = useState<string[]>([
    ".txt",
    ".md",
    ".pdf",
  ]);
  const [existingCollections, setExistingCollections] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<ChunkStrategy>("char");
  const [separators, setSeparators] = useState<string[]>([
    ...DEFAULT_SEPARATORS,
  ]);
  const [keepSeparator, setKeepSeparator] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewText, setPreviewText] = useState("");
  const [sampleFilename, setSampleFilename] = useState("");
  const [previewChunks, setPreviewChunks] = useState<ChunkPreviewChunk[]>([]);
  const [previewStats, setPreviewStats] = useState<{
    total: number;
    avg: number;
    min: number;
    max: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [folderFileCount, setFolderFileCount] = useState<number | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sampleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    getCollections()
      .then(setExistingCollections)
      .catch(() => {});
  }, []);

  const runPreview = useCallback(
    (
      text: string,
      strat: ChunkStrategy,
      size: number,
      overlap: number,
      seps: string[],
      keepSep: boolean,
    ) => {
      if (previewDebounce.current) clearTimeout(previewDebounce.current);
      if (!text.trim()) {
        setPreviewChunks([]);
        setPreviewStats(null);
        return;
      }
      previewDebounce.current = setTimeout(async () => {
        setPreviewLoading(true);
        try {
          const res = await chunkPreview({
            text,
            strategy: strat,
            chunk_size: size,
            chunk_overlap: overlap,
            separators: seps,
            keep_separator: keepSep,
          });
          setPreviewChunks(res.chunks);
          setPreviewStats({
            total: res.total_chunks,
            avg: res.avg_chunk_size,
            min: res.min_chunk_size,
            max: res.max_chunk_size,
          });
        } catch {
          setPreviewChunks([]);
          setPreviewStats(null);
        } finally {
          setPreviewLoading(false);
        }
      }, 300);
    },
    [],
  );

  useEffect(() => {
    runPreview(
      previewText,
      strategy,
      chunkSize,
      chunkOverlap,
      separators,
      keepSeparator,
    );
  }, [
    previewText,
    strategy,
    chunkSize,
    chunkOverlap,
    separators,
    keepSeparator,
    runPreview,
  ]);

  useEffect(() => {
    if (sampleDebounce.current) clearTimeout(sampleDebounce.current);
    if (!folderPath.trim()) {
      setFolderFileCount(null);
      return;
    }
    sampleDebounce.current = setTimeout(async () => {
      try {
        const { text, filename } = await getSampleText(
          folderPath.trim(),
          extensions,
        );
        setPreviewText(text);
        setSampleFilename(filename);
      } catch {
        // silently ignore — user can paste their own text
      }
      try {
        const info = await getFolderInfo(folderPath.trim(), extensions);
        setFolderFileCount(info.file_count);
      } catch {
        setFolderFileCount(null);
      }
    }, 600);
    return () => {
      if (sampleDebounce.current) clearTimeout(sampleDebounce.current);
    };
  }, [folderPath, extensions]);

  async function handleSubmit() {
    if (!folderPath.trim() || !collectionName.trim() || extensions.length === 0)
      return;
    setLoading(true);
    setError(null);
    try {
      await ingestFolder({
        folder_path: folderPath.trim(),
        collection_name: collectionName.trim(),
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        extensions,
        overwrite: true,
        strategy,
        separators,
        keep_separator: keepSeparator,
      });
      router.push("/collections");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200">
          <Link
            href="/collections"
            className="text-neutral-400 hover:text-neutral-700 transition-colors h-full w-14 flex items-center justify-center hover:bg-neutral-100"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
          <p className="text-base font-bold">New Collection</p>
        </div>

        {/* Body — two panes */}
        <div className="flex flex-1 min-h-0">
          {/* Left — settings form */}
          <aside className="w-md border-r border-neutral-200 overflow-y-auto flex flex-col divide-y divide-neutral-200 text-sm">
            <div className="flex flex-col p-4 w-full gap-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Name</span>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="New collection"
                  className={inputCls}
                  required
                />
              </div>
              {existingCollections.includes(collectionName.trim()) &&
                collectionName.trim() && (
                  <ErrorBanner>
                    A collection named{" "}
                    <span className="underline">{collectionName.trim()}</span>{" "}
                    already exists and will be overwritten
                  </ErrorBanner>
                )}
            </div>

            <div className="flex items-center justify-between p-4 w-full gap-3">
              <span className="text-neutral-500">Folder</span>
              <div className="flex items-center gap-1 w-2/3">
                <input
                  ref={firstInputRef}
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="collections/"
                  className="bg-transparent transition-all focus:outline-none ring-1 ring-transparent hover:ring-black focus:ring-black hover:bg-neutral-100 focus:bg-neutral-100 p-2 min-w-0 flex-1 text-left text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  title="Browse folders"
                  className="shrink-0 p-1 hover:bg-neutral-200/50  hover:cursor-pointer transition-colors"
                >
                  <Image
                    src="/images/open_folder.svg"
                    height={30}
                    width={30}
                    alt="Open folder"
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-neutral-500">File types</span>
              <div className="w-2/3">
                <MultiSelect
                  values={extensions}
                  options={EXT_OPTIONS.map((ext) => ({
                    value: ext,
                    label: ext,
                  }))}
                  onChange={setExtensions}
                  placeholder="None selected"
                />
              </div>
            </div>
            <div className="flex items-start justify-between p-4">
              <span className="text-neutral-500">Strategy</span>
              <div className="flex flex-col gap-1 w-2/3">
                <Dropdown
                  value={strategy}
                  options={[
                    { value: "char" as ChunkStrategy, label: "Character" },
                    {
                      value: "recursive_char" as ChunkStrategy,
                      label: "Recursive character",
                    },
                  ]}
                  onChange={setStrategy}
                />
                <NumberField
                  label="Chunk size"
                  value={chunkSize}
                  step={64}
                  onChange={setChunkSize}
                />
                <NumberField
                  label="Chunk overlap"
                  value={chunkOverlap}
                  step={16}
                  onChange={setChunkOverlap}
                />
                <Link
                  href="https://reference.langchain.com/python/langchain-text-splitters"
                  target="_blank"
                  className="px-2 mt-2 text-xs justify-end text-neutral-400 hover:underline hover:text-neutral-500 flex gap-1 items-center"
                >
                  Reference <ArrowUpRightIcon className="size-4" />
                </Link>
              </div>
            </div>
            {strategy === "recursive_char" && (
              <>
                <div className="flex items-center justify-between p-4">
                  <span className="text-neutral-500">Separators</span>
                  <div className="w-2/3">
                    <MultiSelect
                      values={separators}
                      options={SEPARATOR_OPTIONS}
                      onChange={setSeparators}
                      placeholder="None selected"
                      allowCustom
                      customPlaceholder="\n or any string"
                      formatCustom={(raw) => {
                        const val = parseSep(raw);
                        return { value: val, label: displaySep(val) };
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4">
                  <span
                    className={`${keepSeparator ? "text-neutral-500" : "text-neutral-300"}`}
                  >
                    Keep separator
                  </span>
                  <div className=" flex items-center justify-end">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={keepSeparator}
                      onClick={() => setKeepSeparator((v) => !v)}
                      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-200 hover:cursor-pointer focus:outline-none ${keepSeparator ? "bg-salmon" : "bg-neutral-200"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${keepSeparator ? "translate-x-7" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col mt-auto p-4 gap-2">
              {error && <ErrorBanner>{error}</ErrorBanner>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  extensions.length === 0 ||
                  !collectionName.trim() ||
                  !folderPath.trim()
                }
                className="flex w-full items-center justify-center gap-2 text-sm px-4 py-3 bg-black text-white hover:underline disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                {loading && <Spinner />}
                {loading
                  ? "Ingesting…"
                  : `Ingest ${folderFileCount === null ? "" : `${folderFileCount} `}${folderFileCount === 1 ? "file" : "files"}`}
              </button>
            </div>
          </aside>
          {/* Right — live preview */}
          <div className="grid grid-cols-2 overflow-hidden w-full">
            <div className="flex flex-col border-r border-neutral-200 flex-shrink-0">
              <div className="h-12 px-4 border-b border-neutral-200 text-sm font-medium flex items-center gap-3 shrink-0 justify-between">
                Preview
              </div>
              <div className="flex items-center">
                {previewLoading && (
                  <ArrowPathIcon className="size-3.5 animate-spin text-neutral-400" />
                )}
              </div>
              <textarea
                value={previewText}
                onChange={(e) => {
                  setPreviewText(e.target.value);
                  setSampleFilename("");
                }}
                spellCheck="false"
                placeholder="Paste text here to preview chunking, or open a folder to load a sample"
                className="w-full text-sm p-4 resize-none focus:outline-none leading-relaxed h-full transition-all"
              />
            </div>

            <div className="flex flex-col min-h-0">
              <div className="h-12 px-4 border-b border-neutral-200 text-sm font-medium flex items-center gap-3 shrink-0 justify-between">
                <span>{previewStats && previewStats.total} Chunks</span>
                {previewStats && (
                  <div className="font-normal flex items-center gap-3 text-xs text-neutral-500">
                    <div className="border border-neutral-300 flex divide-x divide-neutral-300 items-center">
                      {" "}
                      <div className="p-1.5"> AVG</div>{" "}
                      <div className="p-1.5 text-neutral-800 bg-neutral-100">
                        {previewStats.avg.toFixed()}
                      </div>
                    </div>{" "}
                    <div className="border border-neutral-300 flex divide-x divide-neutral-300 items-center">
                      <div className="p-1.5"> MIN</div>
                      <div className="p-1.5 text-neutral-800 bg-neutral-100">
                        {previewStats.min}
                      </div>
                    </div>
                    <div className="border border-neutral-300 flex divide-x divide-neutral-300 items-center">
                      {" "}
                      <div className="p-1.5"> MAX</div>{" "}
                      <div className="p-1.5 text-neutral-800 bg-neutral-100">
                        {previewStats.max}
                      </div>
                    </div>
                    chars
                  </div>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {previewText.trim() &&
                  previewChunks.length === 0 &&
                  !previewLoading && (
                    <p className="text-neutral-500 text-center mt-8 text-sm">
                      Can't create any chunks. Try reducing adjusing the chunk
                      size.
                    </p>
                  )}
                {previewChunks.map((chunk) => {
                  const color = CHUNK_COLORS[chunk.index % CHUNK_COLORS.length];
                  return (
                    <div
                      key={chunk.index}
                      className="rounded-none px-4 py-3 flex flex-col gap-1"
                    >
                      <p className="text-sm text-black opacity-80 whitespace-pre-wrap break-words leading-relaxed">
                        <mark
                          style={{ backgroundColor: color.bg }}
                          className="text-inherit"
                        >
                          {chunk.text}
                        </mark>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <FolderPicker
          initialPath={folderPath.trim()}
          onSelect={(path) => {
            setFolderPath(path);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

function Spinner() {
  return (
    <span className="inline-block size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}

const inputCls =
  "bg-transparent transition-all focus:outline-none ring-1 ring-transparent max-w-2/3 hover:ring-black focus:ring-black hover:bg-neutral-100 focus:bg-neutral-100 p-2 min-w-40 w-full text-left";
