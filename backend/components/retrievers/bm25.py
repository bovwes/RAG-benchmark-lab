from backend.components.base import BaseRetriever
from backend.core.types import RetrievedChunk


class BM25Retriever(BaseRetriever):
    """Default BM25 Retriever"""

    name = "bm25"

    def __init__(self, collection):
        from rank_bm25 import BM25Okapi

        self.documents = self._load_corpus(collection)
        tokenized = [doc["text"].lower().split() for doc in self.documents]
        self.bm25 = BM25Okapi(tokenized)

    @classmethod
    def build(cls, *, collection, **_):
        return cls(collection)

    @staticmethod
    def _load_corpus(collection) -> list[dict]:
        result = collection.get(include=["documents", "metadatas"])
        return [
            {
                "text": doc,
                "source": meta.get("source", ""),
                "page": meta.get("page", 0),
            }
            for doc, meta in zip(result["documents"], result["metadatas"])
        ]

    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]:
        scores = self.bm25.get_scores(query.lower().split())
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        return [
            RetrievedChunk(
                text=self.documents[idx]["text"],
                source=self.documents[idx].get("source", ""),
                page=self.documents[idx].get("page", 0),
                score=float(scores[idx]),
            )
            for idx in top_indices
        ]
