from sentence_transformers import CrossEncoder

from backend.components.base import BaseReranker
from backend.core.types import RetrievedChunk


class CrossEncoderReranker(BaseReranker):
    """Default CrossEncoder Reranker"""

    name = "cross-encoder"

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model_name)

    @classmethod
    def build(cls, **_):
        return cls()

    def rerank(self, query: str, chunks: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        if not chunks:
            return []
        pairs = [(query, c.text) for c in chunks]
        scores = self.model.predict(pairs)
        ranked = sorted(zip(scores, chunks), key=lambda x: x[0], reverse=True)
        return [
            RetrievedChunk(text=c.text, source=c.source, page=c.page, score=float(s))
            for s, c in ranked[:top_k]
        ]
