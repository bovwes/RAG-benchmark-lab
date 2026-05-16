from dataclasses import dataclass


@dataclass
class RetrievedChunk:
    text: str
    source: str = ""
    page: int = 0
    score: float = 0.0
