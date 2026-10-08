/**
 * @file MyBlogPostsSection.tsx
 * @description Khối "Bài viết đã xuất bản" trong Hồ sơ của tôi (chỉ Mentor): các bài Blog đang
 * hiển thị với cộng đồng, kèm nhắc số bản nháp chưa xuất bản.
 */

'use client';

import { MentorBlogPostGrid } from '@/components/domain/blog/MentorBlogPostGrid';
import { Button } from '@/components/ui/Button';
import type { BlogPostReaderCardResponse } from '@/models/blog';
import { mentorPostRepo } from '@/repositories/mentorPostRepo';
import { useQuery } from '@tanstack/react-query';
import { FileText, PenLine } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MyBlogPostsSectionProps {
  locale: string;
  authorName: string;
  authorAvatarUrl?: string | null;
}

export function MyBlogPostsSection({
  locale,
  authorName,
  authorAvatarUrl,
}: MyBlogPostsSectionProps) {
  const router = useRouter();
  const managePath = `/${locale}/mentor/posts`;
  const { data, isPending, isError } = useQuery({
    queryKey: ['my-blog-posts'],
    queryFn: mentorPostRepo.list,
  });

  const posts = data ?? [];
  const draftCount = posts.filter((post) => post.status === 'DRAFT').length;
  const published: BlogPostReaderCardResponse[] = posts
    .filter((post) => post.status === 'PUBLISHED' && post.slug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime(),
    )
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug as string,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      categories: post.categories,
      tags: post.tags,
      featured: post.featured,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      author: { id: 'me', displayName: authorName, avatarUrl: authorAvatarUrl },
    }));

  return (
    <section
      className="space-y-4 rounded-2xl border border-solid border-border-light bg-white p-5 shadow-xs"
      aria-labelledby="my-blog-posts-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="my-blog-posts-title" className="m-0 text-base font-extrabold text-text-main">
              Bài viết đã xuất bản{published.length ? ` (${published.length})` : ''}
            </h2>
            <p className="m-0 mt-0.5 text-xs text-text-secondary">
              Mentee và Mentor khác thấy các bài này ở hồ sơ của bạn và trang Blog.
            </p>
          </div>
        </div>
        <Link
          href={managePath}
          className="text-sm font-bold text-primary no-underline hover:underline"
        >
          Quản lý bài viết
        </Link>
      </div>

      {draftCount > 0 && (
        <p className="m-0 rounded-xl bg-surface-subtle px-3.5 py-2.5 text-xs text-text-secondary">
          Bạn có <b className="text-text-main">{draftCount} bản nháp</b> chưa xuất bản. Bản nháp chỉ
          mình bạn thấy — hãy bấm <b className="text-text-main">Xuất bản</b> trong{' '}
          <Link href={managePath} className="font-bold text-primary">
            Bài viết của tôi
          </Link>{' '}
          để bài hiện với cộng đồng.
        </p>
      )}

      <MentorBlogPostGrid
        posts={published}
        locale={locale}
        isLoading={isPending}
        isError={isError}
        emptyText="Bạn chưa xuất bản bài viết nào."
        emptyAction={
          <Button
            type="button"
            size="sm"
            leftIcon={<PenLine />}
            onClick={() => router.push(`${managePath}?create=1`)}
          >
            Viết bài mới
          </Button>
        }
      />
    </section>
  );
}
