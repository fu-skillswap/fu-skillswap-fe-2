/**
 * @file usePostCard.ts
 * @description Custom hook quản lý trạng thái Thích/Bỏ thích bài viết (Post Like State Hook).
 */

'use client';

import { useState } from 'react';

/**
 * Hook quản lý số lượng like và trạng thái yêu thích của một bài viết.
 * @param initialLikes - Số lượt thích ban đầu của bài viết
 */
export function usePostCard(initialLikes: number) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked((value) => !value);
    setLikes((value) => value + (liked ? -1 : 1));
  };
  return { likes, liked, toggleLike };
}
