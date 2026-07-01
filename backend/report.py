import csv
import json

from .core.runner import BenchmarkResult

_STATIC_COLS = [
    ("recall@k",    "recall_at_k"),
    ("prec@k",      "precision_at_k"),
    ("mrr",         "mrr"),
    ("tok-f1",      "token_f1"),
    ("rouge-l",     "rouge_l"),
    ("exact",       "exact_match"),
    ("ret_ms",      "retrieve_ms"),
    ("rerank_ms",   "rerank_ms"),
    ("gen_ms",      "generate_ms"),
    ("total_ms",    "total_ms"),
]

_STATIC_KEYS = {k for _, k in _STATIC_COLS}


def print_table(results: list[BenchmarkResult]) -> None:
    # Collect any judge metric keys present across all results
    extra_keys: list[str] = []
    for r in results:
        for key in r.summary():
            if key not in _STATIC_KEYS and key not in extra_keys:
                extra_keys.append(key)

    all_cols = _STATIC_COLS + [(k, k) for k in extra_keys]

    col_w  = 11
    name_w = max((len(r.config_name) for r in results), default=10) + 2

    headers = ["config"] + [label for label, _ in all_cols]
    widths  = [name_w] + [col_w] * len(all_cols)
    sep     = "-" * sum(widths)

    print(f"\n{'Benchmark Results':^{sum(widths)}}")
    print(sep)
    print("".join(h.ljust(w) for h, w in zip(headers, widths)))
    print(sep)

    for r in results:
        summary = r.summary()
        vals = [r.config_name] + [f"{summary.get(key, 0.0):.3f}" for _, key in all_cols]
        print("".join(str(v).ljust(w) for v, w in zip(vals, widths)))

    print(sep)

def to_dict(results: list[BenchmarkResult]) -> list[dict]:
    """Build the same JSON-serializable structure written by `to_json`,
    without touching the filesystem. Used by both the CLI export and the
    API/web benchmark endpoint.
    """
    return [
        {
            "config": r.config_name,
            "metrics": {k: round(v, 4) for k, v in r.summary().items()},
            "per_question": [
                {
                    "question": ir.item.question,
                    "expected_answer": ir.item.expected_answer,
                    "generated_answer": ir.pipeline_result.answer,
                    "retrieval": {
                        "recall_at_k":    round(ir.retrieval_metrics.recall_at_k, 4),
                        "precision_at_k": round(ir.retrieval_metrics.precision_at_k, 4),
                        "mrr":            round(ir.retrieval_metrics.mrr, 4),
                    },
                    "answer": {
                        "token_f1":    round(ir.answer_metrics.token_f1, 4),
                        "rouge_l":     round(ir.answer_metrics.rouge_l, 4),
                        "exact_match": round(ir.answer_metrics.exact_match, 4),
                    },
                    "judge": {
                        key: round(val, 4)
                        for key, val in (ir.judge_metrics.items() if isinstance(ir.judge_metrics, dict) else {})
                    },
                    "latency_ms": {
                        "retrieve":  round(ir.pipeline_result.retrieve_latency_ms, 2),
                        "rerank":    round(ir.pipeline_result.rerank_latency_ms, 2),
                        "generate":  round(ir.pipeline_result.generate_latency_ms, 2),
                        "total":     round(ir.pipeline_result.total_latency_ms, 2),
                    },
                }
                for ir in r.item_results
            ],
        }
        for r in results
    ]


def to_json(results: list[BenchmarkResult], path: str) -> None:
    if not path.endswith(".json"):
        raise ValueError(f"Export file must be .json, got: {path!r}")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(to_dict(results), f, indent=2)

    print(f"Saved → {path}")
