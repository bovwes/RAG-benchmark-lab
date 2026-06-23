import type { QuestionResult } from '@/lib/api';
import { CheckIcon } from '@heroicons/react/16/solid';
import Image from 'next/image';

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
          : 'bg-white border-neutral-300 hover:border-black '
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-2 hover:bg-zinc-50/50 transition-colors hover:cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="size-6 flex items-center justify-center shrink-0">
            <Image
              src={
                q.answer.token_f1 === 1
                  ? '/images/smile_icon.svg'
                  : q.answer.token_f1 >= 0.3
                    ? '/images/neutral_icon.svg'
                    : '/images/sad_icon.svg'
              }
              height={30}
              width={30}
              alt={
                q.answer.token_f1 === 1
                  ? 'Good F1 score'
                  : q.answer.token_f1 >= 0.3
                    ? 'Mediocre F1 score'
                    : 'Bad F1 score'
              }
            />
          </div>
          <p className="text-sm truncate">{q.question}</p>
        </div>
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

          <div className="grid xl:grid-cols-2 3xl:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 p-2 bg-neutral-100">
              <p className="font-semibold mb-1">Retrieval</p>
              <Metric label="Recall@K" value={q.retrieval.recall_at_k} />
              <Metric label="Precision@K" value={q.retrieval.precision_at_k} />
              <Metric label="MRR" value={q.retrieval.mrr} />
            </div>
            <div className="flex flex-col gap-1 p-2 bg-neutral-100">
              <p className="font-semibold mb-1">Answer quality</p>
              <Metric label="Token F1" value={q.answer.token_f1} />
              <Metric label="ROUGE-L" value={q.answer.rouge_l} />
              <Metric label="Exact Match" value={q.answer.exact_match} />
            </div>
            {showJudge && (
              <div className="flex flex-col gap-1 p-2 bg-neutral-100">
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
            <div className="flex flex-col gap-1 p-2 bg-neutral-100">
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
    <div className="flex justify-between">
      <p className="text-neutral-600">{label} </p>{' '}
      <p>
        {value.toFixed(decimals)}
        {suffix}
      </p>
    </div>
  );
}
