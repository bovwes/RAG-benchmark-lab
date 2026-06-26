'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const navGroups = [
  {
    label: 'Context',
    items: [
      { href: '/collections', label: 'Collections', Icon: 'images/files.svg' },
      {
        href: '/evaluation',
        label: 'Evaluation sets',
        Icon: 'images/star.svg',
      },
    ],
  },
  {
    label: 'RAG',
    items: [
      { href: '/components', label: 'Components', Icon: 'images/blocks.svg' },
      {
        href: '/playground',
        label: 'Playground',
        Icon: 'images/chat.svg',
      },
      { href: '/benchmark', label: 'Benchmarks', Icon: 'images/diamond.svg' },
    ],
  },
];

export default function NavSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-3xs shrink-0 flex flex-col overflow-y-auto border-r border-neutral-200 bg-neutral-50">
      <div className="h-4 grid grid-cols-5">
        <div className="bg-[#264653]" />
        <div className="bg-[#2A9D8F]" />
        <div className="bg-[#E9C46A]" />
        <div className="bg-[#F4A261]" />
        <div className="bg-[#E76F51]" />
      </div>
      <nav className="py-3 flex flex-col gap-4 ">
        {navGroups.map(({ label, items }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <div className="px-14 py-1 text-xs text-neutral-400">{label}</div>
            {items.map(({ href, label: itemLabel, Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 py-1 px-3 text-sm underline-offset-4 ${
                    active ? '' : 'hover:underline'
                  }`}
                  style={
                    active
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)',
                        }
                      : undefined
                  }
                >
                  <Image
                    src={Icon}
                    alt={itemLabel}
                    width={20}
                    height={20}
                    className="w-8 h-8 object-cover"
                  />
                  {itemLabel}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
