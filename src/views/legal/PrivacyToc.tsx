/**
 * @file PrivacyToc.tsx
 * @description Mục lục trang Chính sách bảo mật: tô sáng mục đang đọc (IntersectionObserver).
 * Desktop: cột dính bên trái. Mobile: khối `<details>` "Mục lục" thu gọn phía trên bài.
 */

'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  title: string;
}

const linkBase =
  'block rounded-lg px-3 py-2 text-sm leading-5 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function TocLinks({ items, activeId }: { items: TocItem[]; activeId?: string }) {
  return (
    <ol className="m-0 grid list-none gap-0.5 p-0">
      {items.map((item, index) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={`${linkBase} ${
                isActive
                  ? 'bg-sky-50 font-bold text-primary'
                  : 'text-[#536a84] hover:bg-sky-50/70 hover:text-[#12386e]'
              }`}
            >
              {index + 1}. {item.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function PrivacyToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!headings.length || typeof IntersectionObserver === 'undefined') return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // The first section (in document order) inside the reading band wins.
        const current = items.find((item) => visible.has(item.id));
        if (current) setActiveId(current.id);
      },
      // Reading band: below the sticky header, upper ~40% of the viewport.
      { rootMargin: '-110px 0px -60% 0px' },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <details className="rounded-2xl border border-solid border-sky-100 bg-white p-2 lg:hidden">
        <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold text-[#12386e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Mục lục
        </summary>
        <nav aria-label="Mục lục" className="mt-1">
          <TocLinks items={items} activeId={activeId} />
        </nav>
      </details>

      <nav
        aria-label="Mục lục"
        className="sticky top-[110px] hidden max-h-[calc(100vh-130px)] overflow-y-auto lg:block"
      >
        <p className="m-0 mb-2 px-3 text-xs font-bold uppercase tracking-wide text-[#61758e]">
          Mục lục
        </p>
        <TocLinks items={items} activeId={activeId} />
      </nav>
    </>
  );
}
