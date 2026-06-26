import { ExclamationTriangleIcon } from '@heroicons/react/16/solid';

export default function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-2 text-xs text-white bg-salmon flex gap-3 items-center">
      <ExclamationTriangleIcon className="size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
