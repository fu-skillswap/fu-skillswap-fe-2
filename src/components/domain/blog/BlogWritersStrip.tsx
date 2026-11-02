/**
 * @file BlogWritersStrip.tsx
 * @description Dải "Đặt lịch với người viết": tối đa 3 Mentor có bài trong danh sách đang hiển thị,
 * mỗi thẻ dẫn tới trang đặt lịch với Mentor đó.
 */

'use client';

import type { BlogPostReaderCardResponse } from '@/models/blog';
import { blogRepo } from '@/repositories/blogRepo';
import Link from 'next/link';
import { BlogAuthorAvatar, BlogAuthorName } from './BlogPostCard';
import { blogSessionId } from './blogFormat';

const MAX_WRITERS = 3;

interface Writer {
  mentorUserId: string;
  /** One of their posts, used for the avatar/name and the CTA event. */
  post: BlogPostReaderCardResponse;
  postCount: number;
}

/** Distinct mentor authors of the loaded posts, in order of first appearance. */
export function pickBlogWriters(posts: BlogPostReaderCardResponse[]): Writer[] {
  const writers = new Map<string, Writer>();
  for (const post of posts) {
    const mentorUserId = post.authorConversion?.mentorUserId;
    if (post.author?.authorType === 'PLATFORM' || !mentorUserId) continue;
    const writer = writers.get(mentorUserId);
    if (writer) writer.postCount += 1;
    else writers.set(mentorUserId, { mentorUserId, post, postCount: 1 });
  }
  return Array.from(writers.values()).slice(0, MAX_WRITERS);
}

export function BlogWritersStrip({
  writers,
  locale,
  title = 'Đọc xong muốn hỏi thêm? Đặt lịch với người viết',
}: {
  writers: Writer[];
  locale: string;
  title?: string;
}) {
  if (!writers.length) return null;

  return (
    <section
      className="rounded-[20px] border border-solid border-slate-200 bg-white p-5"
      aria-labelledby="blog-writers-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="blog-writers-heading" className="m-0 text-base font-extrabold text-text-main">
          {title}
        </h2>
        <Link
          href={`/${locale}/mentor-booking`}
          className="text-sm font-bold text-primary no-underline hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Tìm mentor khác
        </Link>
      </div>
      <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {writers.map(({ mentorUserId, post, postCount }) => {
          const headline = post.authorConversion?.headline?.trim();
          return (
            <li key={mentorUserId} className="min-w-0">
              <Link
                href={`/${locale}/mentor-booking?mentorId=${encodeURIComponent(mentorUserId)}`}
                onClick={() => {
                  blogRepo
                    .recordAuthorCtaClick(post.id, blogSessionId(), 'BOOK_MENTOR')
                    .catch(() => {});
                }}
                className="flex items-center gap-3 rounded-2xl border border-solid border-slate-200 p-3 text-inherit no-underline transition-colors hover:border-primary-border hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <BlogAuthorAvatar post={post} size={44} />
                <span className="min-w-0 flex-1">
                  <BlogAuthorName post={post} className="text-sm" />
                  <span className="block truncate text-xs text-text-muted">
                    {headline ? `${headline} · ` : ''}
                    {postCount} bài
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
