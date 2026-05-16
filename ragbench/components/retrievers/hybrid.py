from ragbench.core.types import RetrievedChunk
from .chroma import ChromaRetriever
from .bm25 import BM25Retriever


class HybridRetriever:
    def __init__(
        self,
        dense: ChromaRetriever,
        sparse: BM25Retriever,
        k_rrf: int = 60,
        name: str = "hybrid-rrf",
    ):
        self.dense = dense
        self.sparse = sparse
        self.k_rrf = k_rrf
        self.name = name

    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]:
        fetch_k = top_k * 3
        dense_results = self.dense.retrieve(query, fetch_k)
        sparse_results = self.sparse.retrieve(query, fetch_k)

        rrf_scores: dict[str, float] = {}
        chunk_map: dict[str, RetrievedChunk] = {}

        for rank, chunk in enumerate(dense_results):
            rrf_scores[chunk.text] = rrf_scores.get(chunk.text, 0.0) + 1.0 / (self.k_rrf + rank + 1)
            chunk_map[chunk.text] = chunk

        for rank, chunk in enumerate(sparse_results):
            rrf_scores[chunk.text] = rrf_scores.get(chunk.text, 0.0) + 1.0 / (self.k_rrf + rank + 1)
            chunk_map[chunk.text] = chunk

        top_texts = sorted(rrf_scores, key=lambda t: rrf_scores[t], reverse=True)[:top_k]
        return [
            RetrievedChunk(
                text=t,
                source=chunk_map[t].source,
                page=chunk_map[t].page,
                score=rrf_scores[t],
            )
            for t in top_texts
        ]
