from ragbench.core.types import RetrievedChunk


class ChromaRetriever:
    def __init__(self, collection, embed_model, name: str = "chroma-dense"):
        self.collection = collection
        self.embed_model = embed_model
        self.name = name

    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]:
        # Create query embedding
        embedding = self.embed_model.encode([query]).tolist()

        # Query ChromaDB
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
