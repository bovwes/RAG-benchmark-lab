from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter

ChunkStrategy = Literal["char", "recursive_char"]

DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]


@dataclass
class ChunkInfo:
    index: int
    text: str

    @property
    def char_count(self) -> int:
        return len(self.text)


def apply_chunking(
    text: str,
    strategy: ChunkStrategy,
    chunk_size: int,
    overlap: int,
    separators: list[str] = DEFAULT_SEPARATORS,
    keep_separator: bool = False,
) -> list[str]:
    if strategy == "recursive_char":
        splitter = RecursiveCharacterTextSplitter(
            separators=separators,
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            length_function=len,
            keep_separator=keep_separator,
        )
    else:
        splitter = CharacterTextSplitter(
            separator="\n\n",
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            length_function=len,
        )
    return splitter.split_text(text)


def preview_chunks(
    text: str,
    strategy: ChunkStrategy,
    chunk_size: int,
    overlap: int,
    separators: list[str] = DEFAULT_SEPARATORS,
    keep_separator: bool = False,
) -> list[ChunkInfo]:
    raw = apply_chunking(text, strategy, chunk_size, overlap, separators, keep_separator)
    return [ChunkInfo(index=i, text=c) for i, c in enumerate(raw)]
