from backend.components.base import BaseGenerator
from backend.core.types import RetrievedChunk

_REWRITE_PROMPT = (
    "Given the conversation history and a follow-up question, rewrite the "
    "follow-up into a single standalone question that can be understood without "
    "the conversation history. Output only the rewritten question, nothing else.\n\n"
    "Conversation history:\n{history}\n\n"
    "Follow-up question: {question}\n\n"
    "Standalone question:"
)

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

    def rewrite_query(self, query: str, history: list[dict]) -> str:
        history_text = "\n".join(
            f"User: {t['query']}\nAssistant: {t['answer']}" for t in history
        )
        prompt = _REWRITE_PROMPT.format(history=history_text, question=query)
        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=512,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip()

    def generate(self, query: str, chunks: list[RetrievedChunk], history: list[dict] | None = None) -> str:
        context = "\n\n---\n\n".join(
            f"[Source: {c.source}, Page {c.page}]\n{c.text}" for c in chunks
        )
        prompt = self.prompt_template.format(context=context, question=query)

        messages = []
        for turn in (history or []):
            messages.append({"role": "user", "content": turn["query"]})
            messages.append({"role": "assistant", "content": turn["answer"]})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            messages=messages,
        )
        return response.choices[0].message.content
