"use client";

import { useState, useEffect } from "react";
import {
  runPipeline,
  getCollections,
  getComponents,
  type RunResult,
  type RunRequest,
  type ComponentCategory,
  type ComponentInfo,
} from "@/lib/api";
import Card from "./Card";
import ConfigSection from "./ConfigSection";
import NumberField from "./NumberField";
import TextField from "./TextField";
import ComponentSelect, { componentSelectId } from "./ComponentSelect";
import Dropdown from "./Dropdown";
import LatencyBar from "./LatencyBar";
import ChunkCard from "./ChunkCard";
import SemanticScatterplot from "./SemanticScatterplot";
import Spinner from "./Spinner";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
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
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>(["documents"]);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [hasQueried, setHasQueried] = useState(false);
  const [componentCategories, setComponentCategories] = useState<
    ComponentCategory[]
  >([]);
  const [componentsLoading, setComponentsLoading] = useState(true);

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
    setHasQueried(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedChunks(new Set());
    try {
      const req: RunRequest = {
        query: query.trim(),
        collection: config.collection,
        retriever: config.retriever,
        reranker: config.reranker,
        generator: config.generator,
        generator_params: config.generatorParams,
        top_k_retrieve: config.topKRetrieve,
        top_k_rerank: config.topKRerank,
      };
      setResult(await runPipeline(req));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function toggleChunk(i: number) {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const selectedGenerator = generators.find(
    (g) => componentSelectId(g) === config.generator,
  );

  return (
    <>
      <aside className="w-1/2 max-w-sm shrink-0 border-r border-neutral-200 overflow-y-auto flex flex-col text-sm divide-y divide-neutral-200">
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

      {/* ── Main area ──────────────────────────────────────────── */}
      <main className="bg-neutral-50 flex-1 min-w-0 flex flex-col overflow-hidden">
        {hasQueried && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <span className="font-semibold">Error: </span>
                {error}
              </div>
            )}

            {result && (
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
                <ChatExchange query={query} answer={result.answer} />
                <div className="flex flex-col gap-5">
                  <Card
                    title="Latency"
                    hint="Time spent in each pipeline stage: retrieval, reranking, and generation."
                  >
                    <LatencyBar latency={result.latency} />
                  </Card>
                  <div className="grid grid-cols-1 3xl:grid-cols-2 gap-5">
                    <Card
                      title="Semantic Space"
                      hint="2-D projection of chunk embeddings. Chunks kept as context are highlighted; the query is shown as a distinct point."
                    >
                      <SemanticScatterplot
                        chunks={result.chunks}
                        contextChunks={result.context_chunks}
                        queryX={result.query_x}
                        queryY={result.query_y}
                      />
                    </Card>

                    <Card
                      title="Retrieved Chunks"
                      hint="Documents returned by the retriever and optionally reranked. Chunks passed to the LLM as context are marked."
                    >
                      <div className="flex flex-col gap-2">
                        {result.chunks.map((chunk, i) => (
                          <ChunkCard
                            key={i}
                            index={i}
                            chunk={chunk}
                            expanded={expandedChunks.has(i)}
                            onToggle={() => toggleChunk(i)}
                          />
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={
            !hasQueried
              ? "flex flex-col items-center justify-center p-4 h-full gap-6"
              : "p-4"
          }
        >
          {!hasQueried && (
            <>
              <Image
                src={"/images/chat_large.svg"}
                height={120}
                width={180}
                alt="Ask a question"
              />
              <p className="font-bold text-xl">Playground</p>
            </>
          )}
          <div className="w-full max-w-2xl mx-auto ring-1 ring-neutral-300 bg-white flex items-center gap-2 p-2 pl-4">
            <textarea
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun();
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
      </main>
    </>
  );
}
