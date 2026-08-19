/**
 * @file postRepo.ts
 * @description Repository bài viết thảo luận và bình luận (Post & Comment Repository) dành cho môi trường demo.
 */

import type { Comment, Post } from "@/models/entities";
import { mergePosts } from "@/data/demoPosts";

/** Danh sách bài viết mẫu khởi tạo ban đầu */
const posts: Post[] = [
  {
    id: "1",
    title: "Cần mentor React cơ bản",
    content:
      "Mình muốn được định hướng component, state và cách tổ chức dự án React.",
    author: { id: "u-2", name: "Minh Anh" },
    tags: ["React", "Frontend"],
    createdAt: "2026-08-16",
    likes: 12,
  },
  {
    id: "2",
    title: "Chia sẻ kinh nghiệm phỏng vấn intern",
    content:
      "Tổng hợp các câu hỏi và cách chuẩn bị portfolio cho vị trí frontend intern.",
    author: { id: "u-3", name: "Quang Huy" },
    tags: ["Career", "Frontend"],
    createdAt: "2026-08-15",
    likes: 24,
  },
];

/** Bản đồ lưu trữ danh sách bình luận theo postId */
const comments: Record<string, Comment[]> = {
  "1": [
    {
      id: "c-1",
      authorName: "Thanh Hà",
      content: "Mình có thể hỗ trợ bạn cuối tuần này.",
      createdAt: "2026-08-16",
    },
  ],
};

export const postRepo = {
  /**
   * Truy xuất danh sách bài viết thảo luận cộng đồng (gộp dữ liệu gốc và dữ liệu demo).
   * @returns Promise chứa danh sách bài viết (`Post[]`)
   */
  async list(): Promise<Post[]> {
    return mergePosts(posts);
  },

  /**
   * Tìm bài viết theo ID và lấy danh sách các bình luận tương ứng.
   * @param id - Mã ID bài viết
   * @returns Promise chứa bài viết và danh sách bình luận
   * @throws {Error} Nếu không tìm thấy bài viết theo ID
   */
  async findById(id: string): Promise<{ post: Post; comments: Comment[] }> {
    const post = mergePosts(posts).find((item) => item.id === id);
    if (!post) throw new Error("Không tìm thấy bài viết.");
    return { post, comments: comments[id] ?? post.previewComments ?? [] };
  },

  /**
   * Thêm bình luận mới vào bài viết cụ thể.
   * @param postId - ID bài viết được bình luận
   * @param content - Nội dung văn bản bình luận
   * @returns Promise chứa bình luận vừa tạo
   */
  async addComment(postId: string, content: string): Promise<Comment> {
    const comment = {
      id: crypto.randomUUID(),
      authorName: "Bạn",
      content,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    comments[postId] = [...(comments[postId] ?? []), comment];
    return comment;
  },
};
