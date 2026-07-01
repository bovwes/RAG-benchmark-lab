"use client";

import { useState, useEffect, useRef } from "react";
import {
  runPipeline,
  getCollections,
  getComponents,
  type RunResult,
  type RunRequest,
  type ComponentCategory,
  type ComponentInfo,
} from "@/lib/api";
import PanelHeader from "./PanelHeader";
import ConfigSection from "./ConfigSection";
import NumberField from "./NumberField";
import TextField from "./TextField";
import ComponentSelect, { componentSelectId } from "./ComponentSelect";
import Dropdown from "./Dropdown";
import LatencyBar from "./LatencyBar";
import ChunkCard from "./ChunkCard";
import SemanticScatterplot from "./SemanticScatterplot";
import Spinner from "./Spinner";
import {
  ArrowUpIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import ChatExchange from "./ChatExchange";
import Image from "next/image";

interface Config {
  retriever: string;
  reranker: string;
  generator: string;
  generatorParams: Record<string, string | number>;
  topKRetrieve: number;
  topKRerank: number;
  collection: string;
}

interface Message {
  id: number;
  query: string;
  result: RunResult | null;
  error: string | null;
}

function defaultParamsFor(
  component: ComponentInfo,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const p of component.parameters) {
    if (p.required || p.default === null) continue;
    out[p.name] =
      typeof p.default === "string" || typeof p.default === "number"
        ? p.default
        : String(p.default);
  }
  return out;
}

export default function PipelineLab() {
  const [config, setConfig] = useState<Config>({
    retriever: "",
    reranker: "",
    generator: "",
    generatorParams: {},
    topKRetrieve: 10,
    topKRerank: 5,
    collection: "documents",
  });
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<
    Record<number, Set<number>>
  >({});
  const [activePanel, setActivePanel] = useState<{
    id: number;
    panel: "latency" | "context";
  } | null>(null);
  const [collections, setCollections] = useState<string[]>(["documents"]);
  const [componentCategories, setComponentCategories] = useState<
    ComponentCategory[]
  >([]);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const retrievers =
    componentCategories.find((c) => c.category === "retrievers")?.components ??
    [];
  const rerankers =
    componentCategories.find((c) => c.category === "rerankers")?.components ??
    [];
  const generators =
    componentCategories.find((c) => c.category === "generators")?.components ??
    [];

  useEffect(() => {
    getCollections()
      .then(setCollections)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getComponents()
      .then((cats) => {
        setComponentCategories(cats);
        const firstRetriever = cats.find((c) => c.category === "retrievers")
          ?.components[0];
        const firstReranker = cats.find((c) => c.category === "rerankers")
          ?.components[0];
        const firstGenerator = cats.find((c) => c.category === "generators")
          ?.components[0];
        setConfig((prev) => ({
          ...prev,
          retriever: firstRetriever
            ? componentSelectId(firstRetriever)
            : prev.retriever,
          reranker: firstReranker
            ? componentSelectId(firstReranker)
            : prev.reranker,
          generator: firstGenerator
            ? componentSelectId(firstGenerator)
            : prev.generator,
          generatorParams: firstGenerator
            ? defaultParamsFor(firstGenerator)
            : prev.generatorParams,
        }));
      })
      .catch(() => {})
      .finally(() => setComponentsLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleGeneratorChange(generatorId: string) {
    const gen = generators.find((g) => componentSelectId(g) === generatorId);
    setConfig((c) => ({
      ...c,
      generator: generatorId,
      generatorParams: gen ? defaultParamsFor(gen) : {},
    }));
  }

  async function handleRun() {
    if (!query.trim() || loading) return;
    setSidebarOpen(false);
    const id = Date.now();
    const currentQuery = query.trim();
    setQuery("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setMessages((prev) => [
      ...prev,
      { id, query: currentQuery, result: null, error: null },
    ]);
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.result?.answer)
        .map((m) => ({ query: m.query, answer: m.result!.answer }));

      const req: RunRequest = {
        query: currentQuery,
        collection: config.collection,
        retriever: config.retriever,
        reranker: config.reranker,
        generator: config.generator,
        generator_params: config.generatorParams,
        top_k_retrieve: config.topKRetrieve,
        top_k_rerank: config.topKRerank,
        history,
      };
      const result = await runPipeline(req);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, result } : m)),
      );
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, error } : m)),
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleChunk(msgId: number, i: number) {
    setExpandedChunks((prev) => {
      const set = new Set(prev[msgId] ?? []);
      set.has(i) ? set.delete(i) : set.add(i);
      return { ...prev, [msgId]: set };
    });
  }

  const selectedGenerator = generators.find(
    (g) => componentSelectId(g) === config.generator,
  );

  const hasQueried = messages.length > 0;
  const activePanelMessage = activePanel
    ? messages.find((m) => m.id === activePanel.id)
    : null;

  return (
    <>
      <div className="relative shrink-0">
        <div
          className={`overflow-hidden h-full border-r border-neutral-200 ${sidebarOpen ? "w-sm" : "hidden"}`}
        >
          <aside className="overflow-y-auto h-full flex flex-col text-sm divide-y divide-neutral-200">
            <ConfigSection title="Collection">
              <Dropdown
                value={config.collection}
                options={collections.map((col) => ({ value: col, label: col }))}
                onChange={(v) => setConfig((c) => ({ ...c, collection: v }))}
              />
            </ConfigSection>

            <ConfigSection title="Retriever">
              <ComponentSelect
                value={config.retriever}
                components={retrievers}
                loading={componentsLoading}
                onChange={(v) => setConfig((c) => ({ ...c, retriever: v }))}
              />
              <NumberField
                label="top_k retrieve"
                value={config.topKRetrieve}
                onChange={(v) => setConfig((c) => ({ ...c, topKRetrieve: v }))}
              />
            </ConfigSection>

            <ConfigSection title="Reranker">
              <ComponentSelect
                value={config.reranker}
                components={rerankers}
                loading={componentsLoading}
                onChange={(v) => setConfig((c) => ({ ...c, reranker: v }))}
              />
              <NumberField
                label="top_k rerank"
                value={config.topKRerank}
                onChange={(v) => setConfig((c) => ({ ...c, topKRerank: v }))}
              />
            </ConfigSection>

            <ConfigSection title="Generator">
              <ComponentSelect
                value={config.generator}
                components={generators}
                loading={componentsLoading}
                onChange={handleGeneratorChange}
              />
              {selectedGenerator?.parameters
                .filter((p) => !p.required)
                .map((p) => {
                  const value =
                    config.generatorParams[p.name] ??
                    (p.default as string | number) ??
                    "";
                  const onChange = (v: string | number) =>
                    setConfig((c) => ({
                      ...c,
                      generatorParams: { ...c.generatorParams, [p.name]: v },
                    }));
                  if (p.type === "int") {
                    return (
                      <NumberField
                        key={p.name}
                        label={p.name}
                        value={value as number}
                        onChange={onChange as (v: number) => void}
                      />
                    );
                  }
                  if (p.type === "float") {
                    return (
                      <NumberField
                        key={p.name}
                        label={p.name}
                        value={value as number}
                        step={0.1}
                        onChange={onChange as (v: number) => void}
                      />
                    );
                  }
                  return (
                    <TextField
                      key={p.name}
                      label={p.name}
                      value={value as string}
                      onChange={onChange as (v: string) => void}
                    />
                  );
                })}
            </ConfigSection>
          </aside>
        </div>
        <div className="absolute top-0 right-0 p-2 translate-x-full">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="z-10 flex items-center justify-center w-8 h-8 bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 hover:cursor-pointer transition-colors"
          >
            <ChevronLeftIcon
              className={`size-5 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────── */}
      <main className="bg-neutral-50 flex-1 min-w-0 flex flex-col overflow-hidden">
        {!hasQueried ? (
          <div className="flex flex-col items-center justify-center p-4 h-full gap-6">
            <div className="flex gap-2 items-center">
              <Image
                src={"/images/chat.svg"}
                height={52}
                width={52}
                alt="Ask a question"
              />
              <div className="flex flex-col">
                <p className="font-bold text-xl">Playground</p>
                <p className="text-sm">Test your RAG-pipeline</p>
              </div>
            </div>
            <div className="w-full max-w-2xl mx-auto ring-1 ring-neutral-300 bg-white flex items-center gap-2 p-2 pl-4">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    handleRun();
                }}
                placeholder="Ask a question"
                spellCheck={false}
                rows={1}
                style={{ maxHeight: "8rem" }}
                className="flex-1 text-sm resize-none overflow-y-hidden focus:outline-none transition-all placeholder:text-neutral-500"
              />
              <button
                onClick={handleRun}
                disabled={loading || !query.trim()}
                className="shrink-0 w-9 h-9 flex items-center justify-center bg-salmon text-white hover:bg-salmon-500 active:bg-salmon-700 disabled:bg-neutral-200 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Spinner /> : <ArrowUpIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex min-h-0">
            {/* Chat column: messages + query bar */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 flex flex-col gap-8 min-w-0"
              >
                <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
                  {messages.map((msg, idx) => (
                    <div key={msg.id} className="flex flex-col gap-3">
                      {msg.error ? (
                        <>
                          <ChatExchange query={msg.query} answer="" />
                          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                            <span className="font-semibold">Error: </span>
                            {msg.error}
                          </div>
                        </>
                      ) : (
                        <ChatExchange
                          query={msg.query}
                          answer={msg.result?.answer ?? ""}
                          retrieval_query={msg.result?.retrieval_query}
                          loading={
                            loading &&
                            idx === messages.length - 1 &&
                            !msg.result
                          }
                        />
                      )}
                      {msg.result && (
                        <div className="flex gap-2">
                          {[
                            {
                              id: "latency" as const,
                              label: `${msg.result.latency.total_ms} ms`,
                              icon: <ChartBarIcon className="size-4" />,
                            },
                            {
                              id: "context" as const,
                              label: "Context",
                              icon: <DocumentTextIcon className="size-4" />,
                            },
                          ].map(({ id, label, icon }) => (
                            <button
                              key={id}
                              onClick={() =>
                                setActivePanel((prev) =>
                                  prev?.id === msg.id && prev.panel === id
                                    ? null
                                    : { id: msg.id, panel: id },
                                )
                              }
                              className={`flex gap-1 items-center p-1 text-xs font-medium transition-colors hover:cursor-pointer ${
                                activePanel?.id === msg.id &&
                                activePanel.panel === id
                                  ? "bg-salmon text-white"
                                  : "text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-800"
                              }`}
                            >
                              {icon}
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Query bar — stays under the chat column */}
              <div className="p-4">
                <div className="w-full max-w-2xl mx-auto ring-1 ring-neutral-300 bg-white flex items-center gap-2 p-2 pl-4">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        handleRun();
                    }}
                    placeholder="Ask a question"
                    spellCheck={false}
                    rows={1}
                    style={{ maxHeight: "8rem" }}
                    className="flex-1 text-sm resize-none overflow-y-hidden focus:outline-none transition-all placeholder:text-neutral-500"
                  />
                  <button
                    onClick={handleRun}
                    disabled={loading || !query.trim()}
                    className="shrink-0 w-9 h-9 flex items-center justify-center bg-salmon text-white hover:bg-salmon-500 active:bg-salmon-700 disabled:bg-neutral-200 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Spinner />
                    ) : (
                      <ArrowUpIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right detail panel */}
            {activePanel && activePanelMessage?.result && (
              <div className="w-1/2 max-w-lg bg-white shrink-0 flex flex-col overflow-y-auto border-l border-neutral-200">
                {activePanel.panel === "latency" && (
                  <div>
                    <div className="sticky top-0 bg-white z-20 px-5 py-3 border-b border-neutral-200 text-lg font-bold flex items-center justify-between">
                      Latency
                      <button
                        onClick={() => setActivePanel(null)}
                        className="text-neutral-400 hover:text-neutral-700 transition-colors p-2 hover:bg-neutral-100 hover:cursor-pointer"
                      >
                        <XMarkIcon className="size-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-5 p-5">
                      <PanelHeader
                        title="Latency"
                        hint="Time spent in each pipeline stage: retrieval, reranking, and generation."
                      />
                      <LatencyBar latency={activePanelMessage.result.latency} />
                    </div>
                  </div>
                )}
                {activePanel.panel === "context" && (
                  <div>
                    <div className="sticky top-0 bg-white z-20 px-5 py-3 border-b border-neutral-200 text-lg font-bold flex items-center justify-between">
                      Context
                      <button
                        onClick={() => setActivePanel(null)}
                        className="text-neutral-400 hover:text-neutral-700 transition-colors p-2 hover:bg-neutral-100 hover:cursor-pointer"
                      >
                        <XMarkIcon className="size-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-5 p-5">
                      <div className="bg-neutral-100 p-3 gap-3 flex flex-col text-xs text-neutral-500">
                        <p>
                          <span className="font-medium mr-2 text-black">
                            Question:
                          </span>
                          {activePanelMessage.query}
                        </p>
                        {activePanelMessage.result.retrieval_query && (
                          <p>
                            <span className="font-medium mr-2 text-black">
                              Contextualized:
                            </span>
                            {activePanelMessage.result.retrieval_query}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-5 p-5">
                      <PanelHeader
                        title="Retrieved Chunks"
                        hint="Documents returned by the retriever and optionally reranked. Chunks passed to the LLM as context are marked."
                      />
                      <div className="flex flex-col">
                        {activePanelMessage.result.chunks.map((chunk, i) => (
                          <ChunkCard
                            key={i}
                            index={i}
                            chunk={chunk}
                            expanded={
                              expandedChunks[activePanel.id]?.has(i) ?? false
                            }
                            onToggle={() => toggleChunk(activePanel.id, i)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-5 p-5">
                      <PanelHeader
                        title="Semantic Space"
                        hint="2-D projection of chunk embeddings. Chunks kept as context are highlighted; the query is shown as a distinct point."
                      />
                      <SemanticScatterplot
                        chunks={activePanelMessage.result.chunks}
                        contextChunks={activePanelMessage.result.context_chunks}
                        queryX={activePanelMessage.result.query_x}
                        queryY={activePanelMessage.result.query_y}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
