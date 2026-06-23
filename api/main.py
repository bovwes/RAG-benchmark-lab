import asyncio
import contextlib
import io
import json
import os
import re
import sys
import threading
import uuid
from datetime import datetime
from pathlib import Path
from queue import Queue
from typing import Any, Optional

import chromadb
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import backend as rb

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
VECTOR_DB_DIR = os.path.join(PROJECT_ROOT, "chroma_db")
BENCHMARKS_DIR = os.path.join(PROJECT_ROOT, "benchmarks")
EVALUATION_DIR = os.path.join(PROJECT_ROOT, "evaluation")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

app = FastAPI(title="RAG Benchmark Lab API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

###################################
# STARTUP RESOURCES
###################################

_embed_model: Optional[SentenceTransformer] = None
_chroma_client: Optional[chromadb.PersistentClient] = None
_llm_client: Optional[OpenAI] = None
_llm_model: Optional[str] = None
_components: dict[str, type] = {}


@app.on_event("startup")
def startup():
    global _embed_model, _chroma_client, _llm_client, _llm_model, _components
    _embed_model = SentenceTransformer(EMBEDDING_MODEL)
    _chroma_client = chromadb.PersistentClient(path=VECTOR_DB_DIR)
    api_key = os.getenv("LLM_API_KEY", "none")
    base_url = os.getenv("LLM_BASE_URL")
    _llm_model = os.getenv("LLM_MODEL_NAME")
    if not base_url or not _llm_model:
        raise RuntimeError("LLM_BASE_URL and LLM_MODEL_NAME must be set in .env")
    _llm_client = OpenAI(base_url=base_url, api_key=api_key)
    _components = rb.resolve_components()


def _instantiate(name: str, **resources):
    cls = _components.get(name)
    if cls is None:
        raise HTTPException(status_code=400, detail=f"Unknown component: '{name}'")
    return cls.build(**resources)


###################################
# REQ/RESPONSE MODELS
###################################

class IngestRequest(BaseModel):
    folder_path: str
    collection_name: str
    chunk_size: int = 512
    chunk_overlap: int = 64
    extensions: list[str] = [".txt", ".md", ".pdf"]
    overwrite: bool = False


class IngestResponse(BaseModel):
    collection: str
    files_processed: int
    chunks_added: int


class RunRequest(BaseModel):
    query: str
    collection: str = "documents"
    retriever: str = "hybrid"
    reranker: str = "no-rerank"
    generator: str = "openai"
    generator_params: dict[str, Any] = {}
    top_k_retrieve: int = 10
    top_k_rerank: int = 5


class ChunkOut(BaseModel):
    text: str
    source: str
    page: int
    score: float
    x: float = 0.0
    y: float = 0.0


class LatencyOut(BaseModel):
    retrieve_ms: float
    rerank_ms: float
    generate_ms: float
    total_ms: float


class RunResponse(BaseModel):
    answer: str
    chunks: list[ChunkOut]
    context_chunks: list[ChunkOut] = []
    latency: LatencyOut
    pipeline_name: str
    query_x: float = 0.0
    query_y: float = 0.0


class BenchConfigSpec(BaseModel):
    name: str = ""
    retriever: str = "hybrid"
    reranker: str = "no-rerank"
    generator: str = "openai"
    generator_params: dict[str, Any] = {}
    top_k_retrieve: int = 10
    top_k_rerank: int = 5


class BenchmarkRequest(BaseModel):
    eval_dataset_path: str
    collection: str = "documents"
    judge: bool = False
    configs: list[BenchConfigSpec]


class BenchmarkResponse(BaseModel):
    results: list[dict]
    saved_as: str


###################################
# ENDPOINTS
###################################

def _read_file(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return path.read_text(encoding="utf-8", errors="ignore")


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end].strip())
        start += chunk_size - overlap
    return [c for c in chunks if c]


@app.post("/api/ingest", response_model=IngestResponse)
def ingest_folder(req: IngestRequest):
    folder = Path(req.folder_path)
    if not folder.is_dir():
        raise HTTPException(status_code=400, detail=f"Not a directory: {req.folder_path}")

    exts = {e.lower() if e.startswith(".") else f".{e.lower()}" for e in req.extensions}
    files = [p for p in folder.rglob("*") if p.is_file() and p.suffix.lower() in exts]
    if not files:
        raise HTTPException(status_code=400, detail="No matching files found in folder")

    if req.overwrite:
        try:
            _chroma_client.delete_collection(req.collection_name)
        except Exception:
            pass
    try:
        collection = _chroma_client.get_or_create_collection(req.collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    all_chunks, all_ids, all_metas = [], [], []
    for file in files:
        try:
            text = _read_file(file)
        except Exception:
            continue
        for chunk in _chunk_text(text, req.chunk_size, req.chunk_overlap):
            all_chunks.append(chunk)
            all_ids.append(str(uuid.uuid4()))
            all_metas.append({"source": file.name, "page": 0})

    if not all_chunks:
        raise HTTPException(status_code=400, detail="No text could be extracted from the files")

    batch = 512
    embeddings = []
    for i in range(0, len(all_chunks), batch):
        embeddings.extend(_embed_model.encode(all_chunks[i:i+batch]).tolist())

    collection.add(documents=all_chunks, embeddings=embeddings, ids=all_ids, metadatas=all_metas)

    return IngestResponse(
        collection=req.collection_name,
        files_processed=len(files),
        chunks_added=len(all_chunks),
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "model": _llm_model}


@app.get("/api/components")
def list_components():
    return {"categories": rb.discover_components()}


@app.get("/api/collections")
def list_collections():
    collections = []
    for c in _chroma_client.list_collections():
        col = _chroma_client.get_collection(c.name)
        collections.append({
            "name": c.name,
            "count": col.count(),
            "metadata": col.metadata or {},
        })
    return {"collections": collections}


# Run pipeline

@app.post("/api/run", response_model=RunResponse)
def run_pipeline(req: RunRequest):
    try:
        collection = _chroma_client.get_collection(req.collection)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Collection '{req.collection}' not found")

    resources = dict(collection=collection, embed_model=_embed_model,
                     llm_client=_llm_client, llm_model=_llm_model)
    retriever = _instantiate(req.retriever, **resources)
    reranker = _instantiate(req.reranker, **resources)
    generator = _instantiate(req.generator, **resources, **req.generator_params)

    config = rb.PipelineConfig(
        retriever=retriever,
        generator=generator,
        reranker=reranker,
        top_k_retrieve=req.top_k_retrieve,
        top_k_rerank=req.top_k_rerank,
    )

    result = rb.RAGPipeline(config).run(req.query)

    chunks_out = [
        ChunkOut(text=c.text, source=c.source, page=c.page, score=round(c.score, 4))
        for c in result.chunks
    ]

    # Fetch 50 semantic neighbours for the scatter (always use Chroma similarity)
    query_emb = _embed_model.encode([req.query])
    n_context = min(50, collection.count())
    ctx_result = collection.query(
        query_embeddings=query_emb.tolist(),
        n_results=n_context,
        include=["documents", "metadatas", "distances", "embeddings"],
    )

    context_chunks_out: list[ChunkOut] = []
    query_x, query_y = 0.0, 0.0

    if ctx_result["documents"] and ctx_result["documents"][0]:
        ctx_docs = ctx_result["documents"][0]
        ctx_metas = ctx_result["metadatas"][0]
        ctx_dists = ctx_result["distances"][0]
        ctx_embs = np.array(ctx_result["embeddings"][0])

        for doc, meta, dist in zip(ctx_docs, ctx_metas, ctx_dists):
            context_chunks_out.append(ChunkOut(
                text=doc,
                source=meta.get("source", ""),
                page=meta.get("page", 0),
                score=round(max(0.0, 1.0 - float(dist)), 4),
            ))

        # PCA over query + 50 context embeddings
        all_embs = np.vstack([query_emb, ctx_embs])
        n_components = min(2, all_embs.shape[0], all_embs.shape[1])
        if n_components == 2:
            coords = PCA(n_components=2).fit_transform(all_embs)
        else:
            c1 = PCA(n_components=1).fit_transform(all_embs)
            coords = np.hstack([c1, np.zeros((all_embs.shape[0], 1))])

        query_x = round(float(coords[0, 0]), 4)
        query_y = round(float(coords[0, 1]), 4)
        for i, chunk in enumerate(context_chunks_out):
            chunk.x = round(float(coords[i + 1, 0]), 4)
            chunk.y = round(float(coords[i + 1, 1]), 4)

        # Assign the same PCA coords to pipeline chunks by text match
        ctx_coords_by_text = {c.text: (c.x, c.y) for c in context_chunks_out}
        for chunk in chunks_out:
            if chunk.text in ctx_coords_by_text:
                chunk.x, chunk.y = ctx_coords_by_text[chunk.text]

    return RunResponse(
        answer=result.answer,
        chunks=chunks_out,
        context_chunks=context_chunks_out,
        latency=LatencyOut(
            retrieve_ms=round(result.retrieve_latency_ms, 1),
            rerank_ms=round(result.rerank_latency_ms, 1),
            generate_ms=round(result.generate_latency_ms, 1),
            total_ms=round(result.total_latency_ms, 1),
        ),
        pipeline_name=config.name,
        query_x=query_x,
        query_y=query_y,
    )



# Run benchmark

@app.post("/api/benchmark", response_model=BenchmarkResponse)
def run_benchmark(req: BenchmarkRequest):
    if not req.configs:
        raise HTTPException(status_code=400, detail="At least one configuration is required")

    dataset_path = req.eval_dataset_path
    if not os.path.isabs(dataset_path):
        dataset_path = os.path.join(PROJECT_ROOT, dataset_path)
    if not os.path.isfile(dataset_path):
        raise HTTPException(status_code=400, detail=f"Eval dataset not found: {req.eval_dataset_path}")

    try:
        if dataset_path.endswith(".csv"):
            dataset = rb.EvalDataset.from_csv(dataset_path)
        else:
            dataset = rb.EvalDataset.from_json(dataset_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not load eval dataset: {e}")

    try:
        collection = _chroma_client.get_collection(req.collection)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Collection '{req.collection}' not found")

    judge = rb.LLMJudge(_llm_client, _llm_model) if req.judge else None

    resources = dict(collection=collection, embed_model=_embed_model,
                     llm_client=_llm_client, llm_model=_llm_model)
    pipeline_configs = [
        rb.PipelineConfig(
            name=spec.name or "",
            retriever=_instantiate(spec.retriever, **resources),
            reranker=_instantiate(spec.reranker, **resources),
            generator=_instantiate(spec.generator, **resources, **spec.generator_params),
            top_k_retrieve=spec.top_k_retrieve,
            top_k_rerank=spec.top_k_rerank,
        )
        for spec in req.configs
    ]

    runner = rb.BenchmarkRunner(dataset, judge=judge)
    results = runner.run(pipeline_configs)
    results_dict = rb.to_dict(results)

    os.makedirs(BENCHMARKS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    def _slug(name: str) -> str:
        return re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-')[:25]
    config_slug = '_'.join(_slug(spec.name or f"Config{i+1}") for i, spec in enumerate(req.configs[:3]))
    filename = f"{timestamp}_{config_slug}.json"
    payload = {
        "saved_at": datetime.now().isoformat(),
        "eval_dataset_path": req.eval_dataset_path,
        "collection": req.collection,
        "judge": req.judge,
        "configs": [spec.model_dump() for spec in req.configs],
        "results": results_dict,
    }
    with open(os.path.join(BENCHMARKS_DIR, filename), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return BenchmarkResponse(results=results_dict, saved_as=filename)


# Stream benchmark

class _LineCapture(io.TextIOBase):
    """Forwards print() lines into a queue for SSE streaming."""
    def __init__(self, queue: "Queue[str | None]"):
        self._queue = queue

    def write(self, s: str) -> int:
        for line in s.splitlines():
            if line.strip():
                self._queue.put(line)
        return len(s)

    def flush(self):
        pass


@app.post("/api/benchmark/stream")
async def run_benchmark_stream(req: BenchmarkRequest):
    if not req.configs:
        raise HTTPException(status_code=400, detail="At least one configuration is required")

    dataset_path = req.eval_dataset_path
    if not os.path.isabs(dataset_path):
        dataset_path = os.path.join(PROJECT_ROOT, dataset_path)
    if not os.path.isfile(dataset_path):
        raise HTTPException(status_code=400, detail=f"Eval dataset not found: {req.eval_dataset_path}")

    try:
        if dataset_path.endswith(".csv"):
            dataset = rb.EvalDataset.from_csv(dataset_path)
        else:
            dataset = rb.EvalDataset.from_json(dataset_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not load eval dataset: {e}")

    try:
        collection = _chroma_client.get_collection(req.collection)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Collection '{req.collection}' not found")

    judge = rb.LLMJudge(_llm_client, _llm_model) if req.judge else None

    resources = dict(collection=collection, embed_model=_embed_model,
                     llm_client=_llm_client, llm_model=_llm_model)
    pipeline_configs = [
        rb.PipelineConfig(
            name=spec.name or "",
            retriever=_instantiate(spec.retriever, **resources),
            reranker=_instantiate(spec.reranker, **resources),
            generator=_instantiate(spec.generator, **resources, **spec.generator_params),
            top_k_retrieve=spec.top_k_retrieve,
            top_k_rerank=spec.top_k_rerank,
        )
        for spec in req.configs
    ]

    log_queue: "Queue[str | None]" = Queue()
    result_container: dict = {}

    def _run():
        with contextlib.redirect_stdout(_LineCapture(log_queue)):
            try:
                runner = rb.BenchmarkRunner(dataset, judge=judge)
                results = runner.run(pipeline_configs)
                results_dict = rb.to_dict(results)

                os.makedirs(BENCHMARKS_DIR, exist_ok=True)
                timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
                def _slug(name: str) -> str:
                    return re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-')[:25]
                config_slug = '_'.join(_slug(spec.name or f"Config{i+1}") for i, spec in enumerate(req.configs[:3]))
                filename = f"{timestamp}_{config_slug}.json"
                payload = {
                    "saved_at": datetime.now().isoformat(),
                    "eval_dataset_path": req.eval_dataset_path,
                    "collection": req.collection,
                    "judge": req.judge,
                    "configs": [spec.model_dump() for spec in req.configs],
                    "results": results_dict,
                }
                with open(os.path.join(BENCHMARKS_DIR, filename), "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2)

                result_container['result'] = {"results": results_dict, "saved_as": filename}
            except Exception as e:
                result_container['error'] = str(e)
            finally:
                log_queue.put(None)

    threading.Thread(target=_run, daemon=True).start()

    async def _generate():
        loop = asyncio.get_event_loop()
        while True:
            item = await loop.run_in_executor(None, log_queue.get)
            if item is None:
                if 'error' in result_container:
                    yield f"data: {json.dumps({'type': 'error', 'message': result_container['error']})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'done', 'result': result_container['result']})}\n\n"
                break
            yield f"data: {json.dumps({'type': 'log', 'line': item})}\n\n"

    return StreamingResponse(
        _generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/benchmarks")
def list_benchmarks():
    os.makedirs(BENCHMARKS_DIR, exist_ok=True)
    files = sorted(Path(BENCHMARKS_DIR).glob("*.json"), key=lambda p: p.name, reverse=True)
    out = []
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            out.append({
                "filename": f.name,
                "saved_at": data.get("saved_at", ""),
                "collection": data.get("collection", ""),
                "configs": [r["config"] for r in data.get("results", [])],
            })
        except Exception:
            continue
    return {"benchmarks": out}


@app.get("/api/evaluation")
def list_evaluation_files():
    eval_dir = Path(EVALUATION_DIR)
    if not eval_dir.is_dir():
        return {"files": []}
    files = sorted(eval_dir.glob("*.json"), key=lambda p: p.name)
    out = []
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            count = len(data) if isinstance(data, list) else 0
            out.append({"filename": f.name, "question_count": count})
        except Exception:
            continue
    return {"files": out}


@app.get("/api/evaluation/{filename}")
def get_evaluation_file(filename: str):
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = Path(EVALUATION_DIR) / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Evaluation file not found")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/benchmarks/{filename}")
def get_benchmark(filename: str):
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = Path(BENCHMARKS_DIR) / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Benchmark not found")
    return json.loads(path.read_text(encoding="utf-8"))
