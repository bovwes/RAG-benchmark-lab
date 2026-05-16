import re
from dataclasses import dataclass

from ragbench.core.types import RetrievedChunk


@dataclass
class JudgeMetrics:
    faithfulness: float = 0.0
    relevance: float = 0.0


class LLMJudge:

    _FAITHFULNESS = (
        "Score the faithfulness of the answer given the context (1-5).\n"
        "1 = hallucinated, 5 = fully grounded.\n"
        "Reply with ONLY a single integer.\n\n"
        "Context:\n{context}\n\nQuestion: {question}\nAnswer: {answer}\n\nScore:"
    )

    _RELEVANCE = (
        "Score how well the answer addresses the question (1-5).\n"
        "1 = irrelevant, 5 = perfect.\n"
        "Reply with ONLY a single integer.\n\n"
        "Question: {question}\nAnswer: {answer}\n\nScore:"
    )

    def __init__(self, client, model: str):
        self.client = client
        self.model = model

    def _query_llm_judge(self, prompt: str) -> float:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=5,
                temperature=0,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.choices[0].message.content.strip()

            score_match = re.search(r"[1-5]", text) # extract the score from the output

            return float(score_match.group()) if score_match else 0.0
        
        except Exception:
            return 0.0

    def score(self, question: str, answer: str, chunks: list[RetrievedChunk]) -> JudgeMetrics:
        context = "\n\n".join(c.text for c in chunks)

        return JudgeMetrics(
            faithfulness = self._query_llm_judge(self._FAITHFULNESS.format(context=context, question=question, answer=answer)),
            relevance = self._query_llm_judge(self._RELEVANCE.format(question=question, answer=answer))
        )
