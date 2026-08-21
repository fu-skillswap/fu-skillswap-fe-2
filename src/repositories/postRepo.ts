import type { Comment, Post } from '@/models/entities';
import { mergePosts } from '@/data/demoPosts';

const posts: Post[] = [
  {
    id: '1',
    title: 'Cần mentor React cơ bản',
    content: 'Mình muốn được định hướng component, state và cách tổ chức dự án React.',
    author: { id: 'u-2', name: 'Minh Anh' },
    tags: ['React', 'Frontend'],
    createdAt: '2026-08-16',
    likes: 12,
  },
  {
    id: '2',
    title: 'Chia sẻ kinh nghiệm phỏng vấn intern',
    content: 'Tổng hợp các câu hỏi và cách chuẩn bị portfolio cho vị trí frontend intern.',
    author: { id: 'u-3', name: 'Quang Huy' },
    tags: ['Career', 'Frontend'],
    createdAt: '2026-08-15',
    likes: 24,
  },
];
const comments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c-1',
      authorName: 'Thanh Hà',
      content: 'Mình có thể hỗ trợ bạn cuối tuần này.',
      createdAt: '2026-08-16',
    },
  ],
};

export const postRepo = {
  async list(): Promise<Post[]> {
    return mergePosts(posts);
  },
  async findById(id: string): Promise<{ post: Post; comments: Comment[] }> {
    const post = mergePosts(posts).find((item) => item.id === id);
    if (!post) throw new Error('Không tìm thấy bài viết.');
    return { post, comments: comments[id] ?? post.previewComments ?? [] };
  },
  async addComment(postId: string, content: string): Promise<Comment> {
    const comment = {
      id: crypto.randomUUID(),
      authorName: 'Bạn',
      content,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    comments[postId] = [...(comments[postId] ?? []), comment];
    return comment;
  },
};
