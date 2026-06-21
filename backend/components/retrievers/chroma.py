from backend.core.types import RetrievedChunk


class ChromaRetriever:
    name = "chroma"

    def __init__(self, collection, embed_model):
        self.collection = collection
        self.embed_model = embed_model

    @classmethod
    def build(cls, *, collection, embed_model, **_):
        return cls(collection, embed_model)

    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]:
        embedding = self.embed_model.encode([query]).tolist()
        results = self.collection.query(
            query_embeddings=embedding,
            n_results=min(top_k, self.collection.count()),
            include=["documents", "metadatas", "distances"],
        )
        chunks = []
        for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
            chunks.append(RetrievedChunk(
                text=doc,
                source=meta.get("source", ""),
                page=meta.get("page", 0),
                score=1.0 - dist,
            ))
        return chunks
