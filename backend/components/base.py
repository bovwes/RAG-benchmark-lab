from abc import ABC, abstractmethod
from typing import ClassVar

from backend.core.types import RetrievedChunk


class BaseRetriever(ABC):
    name: ClassVar[str]

    @classmethod
    @abstractmethod
    def build(cls, **resources) -> "BaseRetriever": ...

    @abstractmethod
    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]: ...


class BaseReranker(ABC):
    name: ClassVar[str]

    @classmethod
    @abstractmethod
    def build(cls, **resources) -> "BaseReranker": ...

    @abstractmethod
    def rerank(self, query: str, chunks: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]: ...


class BaseGenerator(ABC):
    name: ClassVar[str]

    @classmethod
    @abstractmethod
    def build(cls, **resources) -> "BaseGenerator": ...

    @abstractmethod
    def generate(self, query: str, chunks: list[RetrievedChunk]) -> str: ...
