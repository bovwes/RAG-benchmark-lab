import PipelineLab from '@/components/PipelineLab';

export default function QueryPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-3 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">Playground</p>
      </div>
      <div className="flex flex-1 min-h-0">
        <PipelineLab />
      </div>
    </div>
  );
}
