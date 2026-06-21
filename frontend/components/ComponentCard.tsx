import type { ComponentInfo } from '@/lib/api';
import Image from 'next/image';
import TileCard from '@/components/TileCard';

const CATEGORY_ICONS: Record<string, string> = {
  retrievers: 'images/cube_1.svg',
  rerankers: 'images/cube_2.svg',
  generators: 'images/cube_3.svg',
};

export default function ComponentCard({
  component,
  category,
}: {
  component: ComponentInfo;
  category: string;
}) {
  const icon = (
    <Image
      src={CATEGORY_ICONS[category] ?? 'images/cube_1.svg'}
      alt={category}
      width={32}
      height={32}
    />
  );

  const subtitle = component.default_name ?? undefined;

  return (
    <TileCard icon={icon} title={component.name} subtitle={subtitle} footer={component.module}>
      <div className="p-4">
        {component.docstring && (
          <p className="text-xs text-neutral-500">{component.docstring}</p>
        )}

        {component.parameters.length > 0 && (
          <table className="text-sm p-4 table-fixed w-full">
            <tbody>
              {component.parameters.map((p) => (
                <tr key={p.name}>
                  <td className="text-neutral-500 p-1 align-top truncate w-1/4">
                    {p.name}
                  </td>
                  <td className="truncate p-1 px-3 align-top w-1/3">
                    {p.type ?? 'any'}
                  </td>
                  <td className="truncate p-1 px-3 align-top text-neutral-500">
                    {p.required ? (
                      <span className="text-salmon">required</span>
                    ) : (
                      p.default
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TileCard>
  );
}
