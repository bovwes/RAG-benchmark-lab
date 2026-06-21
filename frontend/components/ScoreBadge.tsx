export default function ScoreBadge({ score }: { score: number }) {
  const [textColor] =
    score >= 0.8 ? ['text-emerald-600'] : ['text-neutral-500'];

  return <span className={`text-xs ${textColor}`}>{score.toFixed(2)}</span>;
}
