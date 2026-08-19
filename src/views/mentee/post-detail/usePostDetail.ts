"use client";

import type { Comment } from "@/models/entities";
import { postRepo } from "@/repositories/postRepo";
import { validateComment } from "@/models/schemas/postSchema";
import { useState } from "react";

export function usePostDetail(postId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string>();
  const submitComment = async (content: string) => {
    const validationError = validateComment(content);
    if (validationError) return setError(validationError);
    const comment = await postRepo.addComment(postId, content);
    setComments((items) => [...items, comment]);
    setError(undefined);
  };
  return { comments, error, submitComment };
}
