from typing import Protocol, runtime_checkable

from ragbench.core.types import RetrievedChunk

from .no_reranker import NoReranker
from .cross_encoder import CrossEncoderReranker


@runtime_checkable
class BaseReranker(Protocol):
    name: str

    def rerank(self, query: str, chunks: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]: ...


__all__ = ["BaseReranker", "NoReranker", "CrossEncoderReranker"]
