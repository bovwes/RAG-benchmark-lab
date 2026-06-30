import time
from dataclasses import dataclass
from typing import Optional

from .types import RetrievedChunk
from backend.components.base import BaseRetriever, BaseReranker, BaseGenerator


@dataclass
class PipelineConfig:
    retriever: BaseRetriever
    generator: BaseGenerator
    reranker: Optional[BaseReranker] = None
    top_k_retrieve: int = 10
    top_k_rerank: int = 5
    name: str = ""
    
    def __post_init__(self):
        if not self.name:
            parts = [self.retriever.name]
            if self.reranker and getattr(self.reranker, "name", "no-rerank") != "no-rerank":
                parts.append(f"rerank:{self.reranker.name}")
            parts.append(f"gen:{self.generator.name}")
            self.name = " | ".join(parts)


@dataclass
class PipelineResult:
    question: str
    answer: str
    chunks: list[RetrievedChunk]
    retrieve_latency_ms: float
    generate_latency_ms: float
    rerank_latency_ms: float = 0.0
    retrieval_query: str = ""

    @property
    def total_latency_ms(self) -> float:
        return self.retrieve_latency_ms + self.rerank_latency_ms + self.generate_latency_ms


class RAGPipeline:
    def __init__(self, config: PipelineConfig):
        self.config = config

    def run(self, question: str, history: list[dict] | None = None) -> PipelineResult:
        cfg = self.config
        history = history or []

        # If this is a multi-turn query, rewrite the last query to contain relevant background information
        retrieval_query = (
            cfg.generator.rewrite_query(question, history) if history else question
        )

        # Retriever
        t0 = time.perf_counter()
        chunks = cfg.retriever.retrieve(retrieval_query, cfg.top_k_retrieve)
        retrieve_ms = (time.perf_counter() - t0) * 1000

        # Reranker (NoReranker is a valid reranker that just truncates)
        rerank_ms = 0.0
        if cfg.reranker is not None:
            t1 = time.perf_counter()
            chunks = cfg.reranker.rerank(retrieval_query, chunks, cfg.top_k_rerank)
            rerank_ms = (time.perf_counter() - t1) * 1000

        # LLM
        t2 = time.perf_counter()
        answer = cfg.generator.generate(question, chunks, history=history)
        generate_ms = (time.perf_counter() - t2) * 1000

        return PipelineResult(
            question=question,
            answer=answer,
            chunks=chunks,
            retrieve_latency_ms=retrieve_ms,
            rerank_latency_ms=rerank_ms,
            generate_latency_ms=generate_ms,
            retrieval_query=retrieval_query if retrieval_query != question else "",
        )
