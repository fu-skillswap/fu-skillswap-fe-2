"use client";

import Link from "next/link";
import type { Comment, Post } from "@/models/entities";
import { Button } from "@/components/ui/Button";
import { usePostDetail } from "./usePostDetail";

export function PostDetailView({
  post,
  initialComments,
  locale,
}: {
  post: Post;
  initialComments: Comment[];
  locale: string;
}) {
  const { comments, error, submitComment } = usePostDetail(
    post.id,
    initialComments,
  );
  return (
    <main className="page-shell narrow">
      <Link href={`/${locale}/dashboard`} className="back-link">
        ← Quay về trang chủ
      </Link>
      <article className="card post-detail">
        <div className="post-meta">
          {post.author.name} · {post.createdAt}
        </div>
        <h1>{post.title}</h1>
        <p>{post.content}</p>
        <div className="tags">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </article>
      <section className="comments">
        <h2>Thảo luận ({comments.length})</h2>
        {comments.map((comment) => (
          <article className="comment" key={comment.id}>
            <strong>{comment.authorName}</strong>
            <span>{comment.createdAt}</span>
            <p>{comment.content}</p>
          </article>
        ))}
        <form
          className="comment-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            void submitComment(String(new FormData(form).get("content"))).then(
              () => form.reset(),
            );
          }}
        >
          <textarea
            name="content"
            placeholder="Viết bình luận của bạn..."
            rows={4}
          />
          {error && <p className="error">{error}</p>}
          <Button type="submit">Gửi bình luận</Button>
        </form>
      </section>
    </main>
  );
}
