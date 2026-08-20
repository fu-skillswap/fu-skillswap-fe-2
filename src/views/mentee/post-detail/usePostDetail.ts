/**
 * @file usePostDetail.ts
 * @description Custom React Hook quản lý việc gửi bình luận cho bài viết (Post Detail Hook).
 */

"use client";

import type { Comment } from "@/models/entities";
import { postRepo } from "@/repositories/postRepo";
import { validateComment } from "@/models/schemas/postSchema";
import { useState } from "react";

/**
 * Hook xử lý thêm bình luận mới và đồng bộ danh sách bình luận của bài viết.
 * @param postId - ID bài viết
 * @param initialComments - Danh sách bình luận ban đầu
 */
export function usePostDetail(postId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string>();

  /**
   * Validate và gửi bình luận mới
   * @param content - Nội dung bình luận
   */
  const submitComment = async (content: string) => {
    const validationError = validateComment(content);
    if (validationError) return setError(validationError);
    const comment = await postRepo.addComment(postId, content);
    setComments((items) => [...items, comment]);
    setError(undefined);
  };

  return { comments, error, submitComment };
}
