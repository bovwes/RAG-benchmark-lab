import re
from dataclasses import dataclass

from backend.core.types import RetrievedChunk


@dataclass
class JudgeMetric:
    name: str
    prompt_template: str


class LLMJudge:

    def __init__(self, client, model: str, metrics: list[JudgeMetric], max_tokens: int = 5, temperature: float = 0.0):
        self.client = client
        self.model = model
        self.metrics = metrics
        self.max_tokens = max_tokens
        self.temperature = temperature

    def _query_llm_judge(self, prompt: str) -> float:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.choices[0].message.content.strip()
            score_match = re.search(r"[1-5]", text)
            return float(score_match.group()) if score_match else 0.0
        except Exception:
            return 0.0

    def score(self, question: str, answer: str, chunks: list[RetrievedChunk]) -> dict[str, float]:
        context = "\n\n".join(c.text for c in chunks)
        return {
            metric.name: self._query_llm_judge(
                metric.prompt_template.format(context=context, question=question, answer=answer)
            )
            for metric in self.metrics
        }
