/**
 * @file usePostCard.ts
 * @description Custom hook quản lý trạng thái Thích/Bỏ thích bài viết (Post Like State Hook).
 */

'use client';

import { postRepo } from '@/repositories/postRepo';
import { useState } from 'react';

/**
 * Hook quản lý số lượng like và trạng thái yêu thích của một bài viết.
 * @param initialLikes - Số lượt thích ban đầu của bài viết
 */
export function usePostCard(postId: string, initialLikes: number, initiallyLiked = false) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initiallyLiked);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const toggleLike = async () => {
    if (isUpdatingLike) return;
    const previousLiked = liked;
    const previousLikes = likes;
    setLiked(!previousLiked);
    setLikes(Math.max(0, previousLikes + (previousLiked ? -1 : 1)));
    setIsUpdatingLike(true);
    try {
      const response = previousLiked
        ? await postRepo.removePostReaction(postId)
        : await postRepo.reactToPost(postId);
      setLiked(response.reactedByCurrentUser ?? !previousLiked);
      setLikes(response.reactionCount ?? previousLikes);
    } catch {
      setLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setIsUpdatingLike(false);
    }
  };
  return { likes, liked, isUpdatingLike, toggleLike };
}
