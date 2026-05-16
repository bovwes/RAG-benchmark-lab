from sentence_transformers import CrossEncoder

from ragbench.core.types import RetrievedChunk

class CrossEncoderReranker:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2", name: str | None = None):
        self.model = CrossEncoder(model_name)
        self.name = name or f"cross-encoder/{model_name.rsplit('/', 1)[-1]}"

    def rerank(self, query: str, chunks: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        if not chunks:
            return []
        
        pairs = [(query, c.text) for c in chunks]
        scores = self.model.predict(pairs)
        ranked = sorted(zip(scores, chunks), key=lambda x: x[0], reverse=True)

        ranked_chunks = []

        for s, c in ranked[:top_k]:
            ranked_chunks.append(RetrievedChunk(
                        text=c.text, 
                        source=c.source, 
                        page=c.page, 
                        score=float(s)
                    ))
            
        return ranked_chunks
