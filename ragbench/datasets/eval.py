import csv
import json
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class EvalItem:
    question: str
    expected_answer: Optional[str] = None
    relevant_contexts: list[str] = field(default_factory=list)


@dataclass
class EvalDataset:
    items: list[EvalItem]
    name: str = "dataset"

    @classmethod
    def from_list(cls, data: list[dict], name: str = "dataset") -> "EvalDataset":
        items = [
            EvalItem(
                question=d["question"],
                expected_answer=d.get("answer") or d.get("expected_answer"),
                relevant_contexts=d.get("contexts") or d.get("relevant_contexts") or [],
            )
            for d in data
        ]
        return cls(items=items, name=name)

    @classmethod
    def from_json(cls, path: str) -> "EvalDataset":
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        name = path.replace("\\", "/").rsplit("/", 1)[-1].rsplit(".", 1)[0]
        return cls.from_list(data, name=name)

    @classmethod
    def from_csv(cls, path: str) -> "EvalDataset":
        with open(path, newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        name = path.replace("\\", "/").rsplit("/", 1)[-1].rsplit(".", 1)[0]
        return cls.from_list(rows, name=name)

    def __len__(self) -> int:
        return len(self.items)

    def __iter__(self):
        return iter(self.items)
