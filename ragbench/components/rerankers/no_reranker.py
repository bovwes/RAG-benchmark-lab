from ragbench.core.types import RetrievedChunk


class NoReranker:
    name = "no-rerank"

    def rerank(self, query: str, chunks: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        return chunks[:top_k]
