export type RetrieverType = string;
export type RerankerType = string;

export interface RunRequest {
  query: string;
  collection: string;
  retriever: RetrieverType;
  reranker: RerankerType;
  generator: string;
  generator_params: Record<string, string | number>;
  top_k_retrieve: number;
  top_k_rerank: number;
}

export interface Chunk {
  text: string;
  source: string;
  page: number;
  score: number;
  x: number;
  y: number;
}

export interface Latency {
  retrieve_ms: number;
  rerank_ms: number;
  generate_ms: number;
  total_ms: number;
}

export interface RunResult {
  answer: string;
  chunks: Chunk[];
  context_chunks: Chunk[];
  latency: Latency;
  pipeline_name: string;
  query_x: number;
  query_y: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function runPipeline(req: RunRequest): Promise<RunResult> {
  const res = await fetch(`${API_URL}/api/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'Request failed');
  }
  return res.json() as Promise<RunResult>;
}

export type ChunkStrategy = 'char' | 'recursive_char';

export const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' '];

export interface IngestRequest {
  folder_path: string;
  collection_name: string;
  chunk_size: number;
  chunk_overlap: number;
  extensions: string[];
  overwrite: boolean;
  strategy: ChunkStrategy;
  separators: string[];
  keep_separator: boolean;
}

export interface ChunkPreviewRequest {
  text: string;
  strategy: ChunkStrategy;
  chunk_size: number;
  chunk_overlap: number;
  separators: string[];
  keep_separator: boolean;
}

export interface ChunkPreviewChunk {
  index: number;
  text: string;
  char_count: number;
}

export interface ChunkPreviewResponse {
  chunks: ChunkPreviewChunk[];
  total_chunks: number;
  avg_chunk_size: number;
  min_chunk_size: number;
  max_chunk_size: number;
}

export interface IngestResult {
  collection: string;
  files_processed: number;
  chunks_added: number;
}

export async function ingestFolder(req: IngestRequest): Promise<IngestResult> {
  const res = await fetch(`${API_URL}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'Ingest failed');
  }
  return res.json() as Promise<IngestResult>;
}

export async function chunkPreview(
  req: ChunkPreviewRequest,
): Promise<ChunkPreviewResponse> {
  const res = await fetch(`${API_URL}/api/chunk-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'Preview failed');
  }
  return res.json() as Promise<ChunkPreviewResponse>;
}

export async function getSampleText(
  folderPath: string,
  extensions: string[],
): Promise<{ text: string; filename: string }> {
  const params = new URLSearchParams({
    folder_path: folderPath,
    extensions: extensions.join(','),
  });
  const res = await fetch(`${API_URL}/api/sample-text?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      (err as { detail?: string }).detail ?? 'Could not load sample',
    );
  }
  return res.json() as Promise<{ text: string; filename: string }>;
}

export async function getFolderInfo(
  folderPath: string,
  extensions: string[],
): Promise<{ file_count: number }> {
  const params = new URLSearchParams({
    folder_path: folderPath,
    extensions: extensions.join(','),
  });
  const res = await fetch(`${API_URL}/api/folder-info?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      (err as { detail?: string }).detail ?? 'Could not read folder',
    );
  }
  return res.json() as Promise<{ file_count: number }>;
}

export async function getCollections(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/collections`);
  if (!res.ok) throw new Error('Could not load collections');
  const data = (await res.json()) as { collections: { name: string }[] };
  return data.collections.map((c) => c.name);
}

export interface ComponentParam {
  name: string;
  type: string | null;
  default: string | number | boolean | null;
  required: boolean;
}

export interface ComponentInfo {
  name: string;
  module: string;
  docstring: string | null;
  default_name: string | null;
  parameters: ComponentParam[];
}

export interface ComponentCategory {
  category: string;
  components: ComponentInfo[];
}

export async function getComponents(): Promise<ComponentCategory[]> {
  const res = await fetch(`${API_URL}/api/components`);
  if (!res.ok) throw new Error('Could not load components');
  const data = (await res.json()) as { categories: ComponentCategory[] };
  return data.categories;
}

export interface BenchConfigSpec {
  name: string;
  retriever: RetrieverType;
  reranker: RerankerType;
  generator: string;
  generator_params: Record<string, string | number>;
  top_k_retrieve: number;
  top_k_rerank: number;
}

export interface BenchmarkRequest {
  eval_dataset_path: string;
  collection: string;
  judge: boolean;
  configs: BenchConfigSpec[];
}

export interface QuestionResult {
  question: string;
  expected_answer: string | null;
  generated_answer: string;
  retrieval: { recall_at_k: number; precision_at_k: number; mrr: number };
  answer: { token_f1: number; rouge_l: number; exact_match: number };
  judge: { faithfulness: number; relevance: number };
  latency_ms: {
    retrieve: number;
    rerank: number;
    generate: number;
    total: number;
  };
}

export interface BenchmarkConfigResult {
  config: string;
  metrics: Record<string, number>;
  per_question: QuestionResult[];
}

export interface RunBenchmarkResult {
  results: BenchmarkConfigResult[];
  saved_as: string;
}

export async function runBenchmark(
  req: BenchmarkRequest,
): Promise<RunBenchmarkResult> {
  const res = await fetch(`${API_URL}/api/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'Benchmark failed');
  }
  return res.json() as Promise<RunBenchmarkResult>;
}

type BenchmarkStreamEvent =
  | { type: 'log'; line: string }
  | { type: 'done'; result: RunBenchmarkResult }
  | { type: 'error'; message: string };

export async function* streamBenchmark(
  req: BenchmarkRequest,
): AsyncGenerator<BenchmarkStreamEvent> {
  const res = await fetch(`${API_URL}/api/benchmark/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'Benchmark failed');
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6)) as BenchmarkStreamEvent;
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  }
}

export interface BenchmarkFileMeta {
  filename: string;
  saved_at: string;
  collection: string;
  configs: string[];
}

export interface SavedBenchmark {
  saved_at: string;
  eval_dataset_path: string;
  collection: string;
  judge: boolean;
  configs?: BenchConfigSpec[];
  results: BenchmarkConfigResult[];
}

export interface EvalFileMeta {
  filename: string;
  question_count: number;
}

export interface EvalQuestion {
  question: string;
  answer: string;
  contexts: string[];
}

export async function browseDirs(
  path: string,
): Promise<{ path: string; parent: string | null; dirs: string[]; files: string[] }> {
  const params = new URLSearchParams({ path });
  const res = await fetch(`${API_URL}/api/browse-dirs?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'Browse failed');
  }
  return res.json() as Promise<{ path: string; parent: string | null; dirs: string[]; files: string[] }>;
}

export async function getDefaultBrowsePath(): Promise<string> {
  const res = await fetch(`${API_URL}/api/browse-dirs/default`);
  if (!res.ok) return '';
  const data = (await res.json()) as { path: string };
  return data.path;
}

export async function listEvaluationFiles(): Promise<EvalFileMeta[]> {
  const res = await fetch(`${API_URL}/api/evaluation`);
  if (!res.ok) throw new Error('Could not list evaluation files');
  const data = (await res.json()) as { files: EvalFileMeta[] };
  return data.files;
}

export async function loadEvaluationFile(
  filename: string,
): Promise<EvalQuestion[]> {
  const res = await fetch(
    `${API_URL}/api/evaluation/${encodeURIComponent(filename)}`,
  );
  if (!res.ok) throw new Error('Could not load evaluation file');
  return res.json() as Promise<EvalQuestion[]>;
}

export async function listBenchmarks(): Promise<BenchmarkFileMeta[]> {
  const res = await fetch(`${API_URL}/api/benchmarks`);
  if (!res.ok) throw new Error('Could not list benchmarks');
  const data = (await res.json()) as { benchmarks: BenchmarkFileMeta[] };
  return data.benchmarks;
}

export async function loadBenchmarkFile(
  filename: string,
): Promise<SavedBenchmark> {
  const res = await fetch(
    `${API_URL}/api/benchmarks/${encodeURIComponent(filename)}`,
  );
  if (!res.ok) throw new Error('Could not load benchmark file');
  return res.json() as Promise<SavedBenchmark>;
}
