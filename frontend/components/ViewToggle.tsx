import Image from 'next/image';

export type ViewMode = 'table' | 'tile';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex border border-neutral-200">
      <button
        onClick={() => onChange('table')}
        className={`p-2 border-neutral-200 transition-opacity ${view === 'table' ? 'bg-neutral-100' : 'hover:bg-neutral-50 opacity-25 hover:opacity-100 hover:cursor-pointer'}`}
        title="Table view"
      >
        <Image
          src="/images/table_icon.svg"
          alt="Table view"
          height={20}
          width={20}
        />
      </button>
      <button
        onClick={() => onChange('tile')}
        className={`p-2 transition-opacity ${view === 'tile' ? 'bg-neutral-100' : 'hover:bg-neutral-50 opacity-25 hover:opacity-100 hover:cursor-pointer'}`}
        title="Tile view"
      >
        <Image
          src="/images/tiles_icon.svg"
          alt="Tile view"
          height={20}
          width={20}
        />
      </button>
    </div>
  );
}
