/**
 * @file BlogPopularList.tsx
 * @description Khối "Được đọc nhiều" cạnh bài nổi bật: 4 bài có lượt đọc cao nhất.
 */

'use client';

import type { BlogPostReaderCardResponse } from '@/models/blog';
import Link from 'next/link';
import { blogPostHref } from './BlogPostCard';
import { formatCount } from './blogFormat';

const MIN_VIEWS = 10;
const MAX_ITEMS = 4;
/** Below this many qualifying posts the block is hidden. */
export const MIN_POPULAR_ITEMS = 3;

/**
 * Most-read posts among the loaded ones.
 * TODO(api): server-side sort=popular — today this ranks only the loaded page.
 */
export function pickPopularPosts(
  posts: BlogPostReaderCardResponse[],
  excludeId?: string,
): BlogPostReaderCardResponse[] {
  return posts
    .filter((post) => post.id !== excludeId && (post.viewCount ?? 0) >= MIN_VIEWS)
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, MAX_ITEMS);
}

export function BlogPopularList({
  posts,
  locale,
}: {
  posts: BlogPostReaderCardResponse[];
  locale: string;
}) {
  return (
    <aside
      className="rounded-[24px] border border-solid border-slate-200 bg-white p-5"
      aria-labelledby="blog-popular-heading"
    >
      <h2 id="blog-popular-heading" className="m-0 text-base font-extrabold text-text-main">
        Được đọc nhiều
      </h2>
      <ol className="m-0 mt-3 list-none space-y-1 p-0">
        {posts.map((post, index) => (
          <li key={post.id}>
            <Link
              href={blogPostHref(locale, post)}
              className="group flex gap-3 rounded-xl p-2 text-inherit no-underline hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <span
                className="w-6 shrink-0 text-[22px] font-extrabold leading-none text-sky-300"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-bold leading-snug text-text-main group-hover:text-primary">
                  {post.title}
                </span>
                <span className="mt-1 block truncate text-xs text-text-muted">
                  {post.author?.displayName ?? 'SkillSwap'} · {formatCount(post.viewCount)} lượt đọc
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
