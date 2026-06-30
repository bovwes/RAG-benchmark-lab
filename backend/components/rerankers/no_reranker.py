from backend.components.base import BaseReranker
from backend.core.types import RetrievedChunk


class NoReranker(BaseReranker):
    """No Reranker (passthrough)"""

    name = "no-rerank"

    @classmethod
    def build(cls, **_):
        return cls()

    def rerank(self, query: str, chunks: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        return chunks[:top_k]
