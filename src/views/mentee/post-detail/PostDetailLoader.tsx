/**
 * @file PostDetailLoader.tsx
 * @description Tải bài viết Forum phía trình duyệt khi server render không lấy được dữ liệu.
 */

'use client';

import type { Comment, Post } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { postRepo } from '@/repositories/postRepo';
import { PostDetailView } from '@/views/mentee/post-detail/PostDetailView';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type LoadedPost = { post: Post; comments: Comment[]; relatedPosts: Post[] };

/**
 * The server render has no user token and may not reach the API, so the page falls back to this
 * component, which loads the post once the browser session is restored.
 */
export function PostDetailLoader({ id, locale }: { id: string; locale: string }) {
  const { isBootstrapping } = useAuth();
  const [data, setData] = useState<LoadedPost | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isBootstrapping) return;
    let cancelled = false;
    postRepo
      .findById(id)
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isBootstrapping]);

  if (data) {
    return (
      <PostDetailView
        post={data.post}
        initialComments={data.comments}
        relatedPosts={data.relatedPosts}
        locale={locale}
      />
    );
  }

  return (
    <div
      className="mx-auto mt-6 max-w-2xl rounded-[18px] border border-solid border-border-light bg-white p-8 text-center"
      role="status"
    >
      {failed ? (
        <>
          <h1 className="m-0 text-base font-extrabold text-text-main">
            Không tìm thấy bài viết hoặc bài viết đã bị xóa.
          </h1>
          <Link
            href={`/${locale}/dashboard`}
            className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
          >
            ← Quay lại Bảng tin
          </Link>
        </>
      ) : (
        <p className="m-0 text-sm text-text-secondary">Đang tải bài viết...</p>
      )}
    </div>
  );
}
