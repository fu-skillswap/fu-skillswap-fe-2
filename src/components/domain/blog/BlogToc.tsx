/**
 * @file BlogToc.tsx
 * @description Mục lục bài Blog từ các tiêu đề "## ". Desktop: thẻ dính ở cột phải.
 * Mobile: khối `<details>` "Mục lục" thu gọn phía trên nội dung.
 */

import type { BlogHeading } from './BlogMarkdown';

function TocLinks({ headings }: { headings: BlogHeading[] }) {
  return (
    <ol className="m-0 grid list-none gap-0.5 p-0">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className="block rounded-lg px-3 py-2 text-sm leading-5 text-text-secondary no-underline transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {heading.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function BlogToc({
  headings,
  variant,
}: {
  headings: BlogHeading[];
  variant: 'mobile' | 'desktop';
}) {
  if (headings.length < 2) return null;

  if (variant === 'mobile') {
    return (
      <details className="mt-5 rounded-2xl border border-solid border-border-light bg-surface-subtle/50 p-2 lg:hidden">
        <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Mục lục
        </summary>
        <nav aria-label="Mục lục bài viết" className="mt-1">
          <TocLinks headings={headings} />
        </nav>
      </details>
    );
  }

  return (
    <nav
      aria-label="Mục lục bài viết"
      className="hidden max-h-[calc(100vh-112px)] overflow-y-auto rounded-3xl border border-solid border-border-light bg-white p-4 lg:sticky lg:top-20 lg:block"
    >
      <p className="m-0 mb-2 px-3 text-xs font-bold uppercase tracking-wide text-text-muted">
        Mục lục
      </p>
      <TocLinks headings={headings} />
    </nav>
  );
}
