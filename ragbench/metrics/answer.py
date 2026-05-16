import logging
import re
from dataclasses import dataclass

from rouge_score import rouge_scorer


@dataclass
class AnswerMetrics:
    token_f1: float = 0.0
    rouge_l: float = 0.0
    exact_match: float = 0.0


_rouge = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


def _token_f1(pred: str, ref: str) -> float:
    p_tokens, r_tokens = _tokenize(pred), _tokenize(ref)

    if not p_tokens or not r_tokens:
        return 0.0

    common = set(p_tokens) & set(r_tokens)

    if not common:
        return 0.0

    prec = sum(1 for t in p_tokens if t in common) / len(p_tokens)
    rec  = sum(1 for t in r_tokens if t in common) / len(r_tokens)

    return 2 * prec * rec / (prec + rec)


def compute_answer_metrics(predicted: str, expected: str) -> AnswerMetrics:
    rouge_l = _rouge.score(expected, predicted)["rougeL"].fmeasure

    return AnswerMetrics(
        token_f1=_token_f1(predicted, expected),
        rouge_l=rouge_l,
        exact_match=float(predicted.strip().lower() == expected.strip().lower()),
    )
