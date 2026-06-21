import type { QuestionResult } from '@/lib/api';

export default function BenchmarkQuestionCard({
  q,
  expanded,
  onToggle,
  showJudge,
}: {
  q: QuestionResult;
  expanded: boolean;
  onToggle: () => void;
  showJudge: boolean;
}) {
  return (
    <div
      className={`overflow-hidden transition-all border ${
        expanded
          ? 'bg-white'
          : 'bg-white border-neutral-300 hover:border-black hover:cursor-pointer'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-zinc-50/50 transition-colors"
      >
        <p className="text-sm truncate">{q.question}</p>
      </button>

      {expanded && (
        <div className="border-t border-neutral-300 p-4 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-1">Expected answer</p>
              <p className="text-neutral-600 whitespace-pre-wrap">
                {q.expected_answer ?? '—'}
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Generated answer</p>
              <p className="text-neutral-600 whitespace-pre-wrap">
                {q.generated_answer}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-neutral-200">
            <div>
              <p className="font-semibold mb-1">Retrieval</p>
              <Metric label="Recall@K" value={q.retrieval.recall_at_k} />
              <Metric label="Precision@K" value={q.retrieval.precision_at_k} />
              <Metric label="MRR" value={q.retrieval.mrr} />
            </div>
            <div>
              <p className="font-semibold mb-1">Answer quality</p>
              <Metric label="Token F1" value={q.answer.token_f1} />
              <Metric label="ROUGE-L" value={q.answer.rouge_l} />
              <Metric label="Exact Match" value={q.answer.exact_match} />
            </div>
            {showJudge && (
              <div>
                <p className="font-semibold mb-1">Judge scores</p>
                <Metric
                  label="Faithfulness"
                  value={q.judge.faithfulness}
                  decimals={1}
                  suffix=" / 5"
                />
                <Metric
                  label="Relevance"
                  value={q.judge.relevance}
                  decimals={1}
                  suffix=" / 5"
                />
              </div>
            )}
            <div>
              <p className="font-semibold mb-1">Latency (ms)</p>
              <Metric
                label="Retrieve"
                value={q.latency_ms.retrieve}
                decimals={0}
              />
              <Metric label="Rerank" value={q.latency_ms.rerank} decimals={0} />
              <Metric
                label="Generate"
                value={q.latency_ms.generate}
                decimals={0}
              />
              <Metric label="Total" value={q.latency_ms.total} decimals={0} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  decimals = 3,
  suffix = '',
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <p className="text-neutral-500">
      {label}{' '}
      <span className="text-neutral-800">
        {value.toFixed(decimals)}
        {suffix}
      </span>
    </p>
  );
}
