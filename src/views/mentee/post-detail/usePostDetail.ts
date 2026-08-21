/**
 * @file usePostDetail.ts
 * @description Custom React Hook quản lý việc gửi bình luận cho bài viết (Post Detail Hook) sử dụng React Hook Form & Yup.
 */

"use client";

import type { Comment } from "@/models/entities";
import {
  commentSchema,
  type CommentFormValues,
} from "@/models/schemas/postSchema";
import { useAuth } from "@/providers/AuthProvider";
import { postRepo } from "@/repositories/postRepo";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";

/**
 * Hook xử lý thêm bình luận mới và đồng bộ danh sách bình luận của bài viết.
 * @param postId - ID bài viết
 * @param initialComments - Danh sách bình luận ban đầu
 */
export function usePostDetail(postId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState(initialComments);
  const [serverError, setServerError] = useState<string>();
  const { isAuthenticated, showAuthRequiredModal } = useAuth();

  const form = useForm<CommentFormValues>({
    resolver: yupResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  /**
   * Validate và gửi bình luận mới
   * @param values - Form values từ React Hook Form
   */
  const submitComment = async (values: CommentFormValues) => {
    setServerError(undefined);
    if (!isAuthenticated) {
      showAuthRequiredModal(
        "Bạn cần Đăng nhập hoặc Đăng ký tài khoản để gửi bình luận.",
      );
      return;
    }
    try {
      const comment = await postRepo.addComment(postId, values.content);
      setComments((items) => [...items, comment]);
      reset({ content: "" });
    } catch {
      setServerError("Không thể gửi bình luận lúc này. Vui lòng thử lại.");
    }
  };

  return {
    form,
    register,
    errors,
    serverError,
    comments,
    submitComment: handleSubmit(submitComment),
  };
}
