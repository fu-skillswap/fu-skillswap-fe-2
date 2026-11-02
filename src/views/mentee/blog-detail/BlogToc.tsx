/**
 * @file BlogToc.tsx
 * @description Mục lục "Trong bài này" của bài Blog: tô sáng mục đang đọc và hiển thị phần trăm đã đọc.
 * Desktop: cột dính bên trái. Mobile: khối `<details>` thu gọn phía trên bài.
 */

'use client';

import { useEffect, useState, type MouseEvent, type RefObject } from 'react';
import type { BlogTocItem } from '@/components/domain/blog/BlogMarkdown';

// Sticky shell header (64px) plus breathing room.
const HEADER_OFFSET = 96;

function scrollToHeading(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

function useActiveHeading(items: BlogTocItem[]) {
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
        // The first heading (in document order) inside the reading band wins.
        const current = items.find((item) => visible.has(item.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -60% 0px` },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return activeId;
}

/** Percentage of the article scrolled past, measured at most once per animation frame. */
function useReadingProgress(articleRef?: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!articleRef) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight + HEADER_OFFSET;
      const read =
        scrollable > 0
          ? (HEADER_OFFSET - rect.top) / scrollable
          : rect.top <= HEADER_OFFSET
            ? 1
            : 0;
      setProgress(Math.round(Math.min(1, Math.max(0, read)) * 100));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [articleRef]);

  return progress;
}

function TocLinks({ items, activeId }: { items: BlogTocItem[]; activeId?: string }) {
  return (
    <ol className="m-0 grid list-none gap-0.5 p-0">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={(event) => scrollToHeading(event, item.id)}
              className={`block rounded-r-lg border-0 border-l-2 border-solid py-1.5 pr-2 text-[13px] leading-5 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                item.level === 3 ? 'pl-6' : 'pl-3'
              } ${
                isActive
                  ? 'border-primary bg-primary-light font-bold text-sky-800'
                  : 'border-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-main'
              }`}
            >
              {item.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Mobile: collapsible "Trong bài này" above the article. Hidden with fewer than 2 headings. */
export function BlogTocMobile({ items }: { items: BlogTocItem[] }) {
  const activeId = useActiveHeading(items);
  if (items.length < 2) return null;
  return (
    <details className="mb-6 rounded-2xl border border-solid border-border-light bg-white p-2 min-[1380px]:hidden">
      <summary className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-bold text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        Trong bài này
      </summary>
      <nav aria-label="Trong bài này" className="mt-1 pb-1">
        <TocLinks items={items} activeId={activeId} />
      </nav>
    </details>
  );
}

/** Desktop: sticky left column with the reading-progress bar. Hidden with fewer than 2 headings. */
export function BlogToc({
  items,
  articleRef,
}: {
  items: BlogTocItem[];
  articleRef: RefObject<HTMLElement | null>;
}) {
  const activeId = useActiveHeading(items);
  const progress = useReadingProgress(items.length >= 2 ? articleRef : undefined);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Trong bài này"
      className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto"
    >
      <p className="m-0 mb-2 pl-3 text-xs font-bold text-text-main">Trong bài này</p>
      <TocLinks items={items} activeId={activeId} />
      <div className="mt-5 pl-3">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-surface-subtle"
          role="progressbar"
          aria-label="Tiến độ đọc"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="m-0 mt-1.5 text-xs text-text-muted">Đã đọc {progress}%</p>
      </div>
    </nav>
  );
}
