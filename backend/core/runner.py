from dataclasses import dataclass, field
from typing import Optional

from .pipeline import PipelineConfig, PipelineResult, RAGPipeline
from ..metrics.retrieval import RetrievalMetrics, compute_retrieval_metrics
from ..metrics.answer import AnswerMetrics, compute_answer_metrics
from ..metrics.judge import JudgeMetrics


@dataclass
class ItemResult:
    item: object
    pipeline_result: PipelineResult
    retrieval_metrics: object = field(default_factory=object)
    answer_metrics: object = field(default_factory=object)
    judge_metrics: object = field(default_factory=object)


@dataclass
class BenchmarkResult:
    config_name: str
    item_results: list[ItemResult]

    def mean(self, attr_path: str) -> float:
        parts = attr_path.split(".")
        values = []
        for ir in self.item_results:
            obj = ir
            for p in parts:
                obj = getattr(obj, p, None)
                if obj is None:
                    break
            if isinstance(obj, (int, float)):
                values.append(obj)
        return sum(values) / len(values) if values else 0.0

    def summary(self) -> dict[str, float]:
        keys = [
            ("recall_at_k",      "retrieval_metrics.recall_at_k"),
            ("precision_at_k",   "retrieval_metrics.precision_at_k"),
            ("mrr",              "retrieval_metrics.mrr"),
            ("token_f1",         "answer_metrics.token_f1"),
            ("rouge_l",          "answer_metrics.rouge_l"),
            ("exact_match",      "answer_metrics.exact_match"),
            ("faithfulness",     "judge_metrics.faithfulness"),
            ("relevance",        "judge_metrics.relevance"),
            ("retrieve_ms",      "pipeline_result.retrieve_latency_ms"),
            ("rerank_ms",        "pipeline_result.rerank_latency_ms"),
            ("generate_ms",      "pipeline_result.generate_latency_ms"),
            ("total_ms",         "pipeline_result.total_latency_ms"),
        ]
        return {label: self.mean(path) for label, path in keys}


class BenchmarkRunner:
    def __init__(self, dataset, judge=None):
        self.dataset = dataset
        self.judge = judge

    def run(self, configs: list[PipelineConfig]) -> list[BenchmarkResult]:
        
        results = []

        print("Starting benchmark")
        
        for cfg in configs:
            print(f"\nRunning configuration: {cfg.name}")

            pipeline = RAGPipeline(cfg)

            item_results = []

            for i, item in enumerate(self.dataset.items, start=1):
                preview = item.question[:60] + ("..." if len(item.question) > 60 else "")
                print(f"  [{i}/{len(self.dataset)}] {preview:<63}")

                pr = pipeline.run(item.question)
                print(f"  Answer: {pr.answer}")

                item_results.append(ItemResult(
                    item=item,
                    pipeline_result=pr,
                    retrieval_metrics=compute_retrieval_metrics(pr.chunks, item.relevant_contexts),
                    answer_metrics=(
                        compute_answer_metrics(pr.answer, item.expected_answer)
                        if item.expected_answer
                        else AnswerMetrics()
                    ),
                    judge_metrics=(
                        self.judge.score(item.question, pr.answer, pr.chunks)
                        if self.judge
                        else JudgeMetrics()
                    ),
                ))
 
            print(f"  Finished.")
            
            results.append(BenchmarkResult(config_name=cfg.name, item_results=item_results))

        return results
