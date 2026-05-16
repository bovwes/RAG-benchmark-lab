from typing import Protocol, runtime_checkable

from ragbench.core.types import RetrievedChunk

from .openai import OpenAIGenerator


@runtime_checkable
class BaseGenerator(Protocol):
    name: str

    def generate(self, query: str, chunks: list[RetrievedChunk]) -> str: ...


__all__ = ["BaseGenerator", "OpenAIGenerator"]
