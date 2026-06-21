from typing import Protocol, runtime_checkable

from backend.core.types import RetrievedChunk

from .chroma import ChromaRetriever
from .bm25 import BM25Retriever
from .hybrid import HybridRetriever


@runtime_checkable
class BaseRetriever(Protocol):
    name: str

    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]: ...


__all__ = ["BaseRetriever", "ChromaRetriever", "BM25Retriever", "HybridRetriever"]
