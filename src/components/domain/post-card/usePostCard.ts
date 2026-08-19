"use client";

import { useState } from "react";

export function usePostCard(initialLikes: number) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked((value) => !value);
    setLikes((value) => value + (liked ? -1 : 1));
  };
  return { likes, liked, toggleLike };
}
