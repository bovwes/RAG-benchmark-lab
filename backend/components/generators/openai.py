from backend.components.base import BaseGenerator
from backend.core.types import RetrievedChunk

_DEFAULT_PROMPT = (
    "Answer the question using ONLY the context below. "
    "Answer very consisely. "
    "If the answer is not in the context, say so clearly.\n\n"
    "Context:\n{context}\n\n"
    "Question: {question}"
)


class OpenAIGenerator(BaseGenerator):
    """Default OpenAI Generator. Work with any OpenAI SDK-enabled model"""
    
    name = "openai"

    def __init__(
        self,
        client,
        model: str,
        prompt_template: str = _DEFAULT_PROMPT,
        max_tokens: int = 500,
        temperature: float = 0.3,
    ):
        self.client = client
        self.model = model
        self.name = model
        self.prompt_template = prompt_template
        self.max_tokens = max_tokens
        self.temperature = temperature

    @classmethod
    def build(
        cls,
        *,
        llm_client,
        llm_model,
        prompt_template: str = _DEFAULT_PROMPT,
        max_tokens: int = 500,
        temperature: float = 0.3,
        **_,
    ):
        return cls(
            llm_client,
            llm_model,
            prompt_template=prompt_template,
            max_tokens=max_tokens,
            temperature=temperature,
        )

    def generate(self, query: str, chunks: list[RetrievedChunk]) -> str:
        context = "\n\n---\n\n".join(
            f"[Source: {c.source}, Page {c.page}]\n{c.text}" for c in chunks
        )
        prompt = self.prompt_template.format(context=context, question=query)
        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
