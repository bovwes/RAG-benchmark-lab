from dataclasses import dataclass

from backend.core.types import RetrievedChunk
from .answer import _token_f1


@dataclass
class RetrievalMetrics:
    recall_at_k: float = 0.0
    precision_at_k: float = 0.0
    mrr: float = 0.0


def _chunks_match(retrieved: str, relevant: str) -> bool:
    r, rv = retrieved.lower().strip(), relevant.lower().strip()
    return rv in r or r in rv or _token_f1(r, rv) > 0.7


def compute_retrieval_metrics(chunks: list[RetrievedChunk], relevant_contexts: list[str]) -> RetrievalMetrics:
    if not relevant_contexts:
        return RetrievalMetrics()

    retrieved_texts = [c.text for c in chunks]

    recall = sum(
        any(_chunks_match(ret, rel) for ret in retrieved_texts)
        for rel in relevant_contexts
    ) / len(relevant_contexts)

    precision = (
        sum(
            any(_chunks_match(ret, rel) for rel in relevant_contexts)
            for ret in retrieved_texts
        ) / len(retrieved_texts)
        if retrieved_texts
        else 0.0
    )

    mrr = 0.0
    for rank, ret in enumerate(retrieved_texts, start=1):
        if any(_chunks_match(ret, rel) for rel in relevant_contexts):
            mrr = 1.0 / rank
            break

    return RetrievalMetrics(recall_at_k=recall, precision_at_k=precision, mrr=mrr)
