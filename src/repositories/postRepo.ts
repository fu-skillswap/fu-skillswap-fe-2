/**
 * @file postRepo.ts
 * @description Repository diễn đàn cộng đồng, ánh xạ Forum API sang entity feed hiện tại.
 */

import type {
  ForumCommentPageResponse,
  ForumCommentResponse,
  ForumCommentUpsertRequest,
  ForumPostPageResponse,
  ForumPostResponse,
  ForumPostUpsertRequest,
  ForumReactionRequest,
  ForumReportCreateRequest,
  ForumTopicResponse,
} from '@/models/auth';
import { apiClient } from '@/models/apiClient';
import type { Comment, Post } from '@/models/entities';

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${day} lúc ${time}`;
}

function mapForumPost(post: ForumPostResponse): Post {
  return {
    id: post.postId,
    title: post.title,
    content: post.content,
    author: {
      id: post.authorUserId || 'forum-user',
      name: post.authorFullName || 'Thành viên SkillSwap',
      avatarUrl: post.authorAvatarUrl ?? undefined,
    },
    tags: post.forumTopic ? [post.forumTopic.nameVi] : [],
    topicId: post.forumTopic?.id,
    createdAt: formatDate(post.createdAt),
    likes: post.reactionCount ?? 0,
    likedByCurrentUser: post.reactedByCurrentUser ?? false,
    commentCount: post.commentCount ?? 0,
    mediaUrl: post.imageUrls?.[0],
    imageUrls: post.imageUrls,
  };
}

function mapForumComment(comment: ForumCommentResponse): Comment {
  return {
    id: comment.commentId,
    authorId: comment.authorUserId,
    authorName: comment.authorFullName || 'Thành viên SkillSwap',
    authorAvatarUrl: comment.authorAvatarUrl,
    authorRole: comment.authorRole,
    content: comment.content,
    createdAt: formatDate(comment.createdAt),
    reactionCount: comment.reactionCount ?? 0,
    reactedByCurrentUser: comment.reactedByCurrentUser ?? false,
    replyCount: comment.replyCount ?? 0,
    replyToCommentId: comment.replyToCommentId,
  };
}

export const postRepo = {
  mapResponse: mapForumPost,
  listTopics: (): Promise<ForumTopicResponse[]> =>
    apiClient<ForumTopicResponse[]>('/api/forum/topics'),

  create: (data: ForumPostUpsertRequest): Promise<ForumPostResponse> =>
    apiClient<ForumPostResponse>('/api/forum/posts', { method: 'POST', data }),

  update: (postId: string, data: ForumPostUpsertRequest): Promise<ForumPostResponse> =>
    apiClient<ForumPostResponse>(`/api/forum/posts/${postId}`, { method: 'PUT', data }),

  delete: (postId: string): Promise<ForumPostResponse> =>
    apiClient<ForumPostResponse>(`/api/forum/posts/${postId}`, { method: 'DELETE' }),

  reactToPost: (postId: string): Promise<ForumPostResponse> => {
    const data: ForumReactionRequest = { reactionType: 'LIKE' };
    return apiClient<ForumPostResponse>(`/api/forum/posts/${postId}/reaction`, {
      method: 'PUT',
      data,
    });
  },

  removePostReaction: (postId: string): Promise<ForumPostResponse> =>
    apiClient<ForumPostResponse>(`/api/forum/posts/${postId}/reaction`, { method: 'DELETE' }),

  reactToComment: (commentId: string): Promise<ForumCommentResponse> => {
    const data: ForumReactionRequest = { reactionType: 'LIKE' };
    return apiClient<ForumCommentResponse>(`/api/forum/comments/${commentId}/reaction`, {
      method: 'PUT',
      data,
    });
  },

  removeCommentReaction: (commentId: string): Promise<ForumCommentResponse> =>
    apiClient<ForumCommentResponse>(`/api/forum/comments/${commentId}/reaction`, {
      method: 'DELETE',
    }),

  report: (data: ForumReportCreateRequest): Promise<void> =>
    apiClient<void>('/api/forum/reports', { method: 'POST', data }),

  getFeedPage: (cursor?: string): Promise<ForumPostPageResponse> => {
    const search = new URLSearchParams({ limit: '20' });
    if (cursor) search.set('cursor', cursor);
    return apiClient<ForumPostPageResponse>(`/api/forum/feed?${search.toString()}`);
  },

  getPostsPage: (
    options: {
      cursor?: string;
      keyword?: string;
      forumTopicId?: string;
      mine?: boolean;
    } = {},
  ): Promise<ForumPostPageResponse> => {
    const search = new URLSearchParams({ limit: '20' });
    if (options.cursor) search.set('cursor', options.cursor);
    if (options.keyword) search.set('keyword', options.keyword);
    if (options.forumTopicId) search.set('forumTopicId', options.forumTopicId);
    if (options.mine) search.set('mine', 'true');
    return apiClient<ForumPostPageResponse>(`/api/forum/posts?${search.toString()}`);
  },

  async list(): Promise<Post[]> {
    const page = await apiClient<ForumPostPageResponse>('/api/forum/posts?limit=20');
    return page.items.filter((post) => post.status !== 'HIDDEN').map(mapForumPost);
  },

  async findById(id: string): Promise<{ post: Post; comments: Comment[]; relatedPosts: Post[] }> {
    const post = await apiClient<ForumPostResponse>(`/api/forum/posts/${id}`);
    const relatedPath = post.forumTopic?.id
      ? `/api/forum/posts?limit=4&forumTopicId=${encodeURIComponent(post.forumTopic.id)}`
      : undefined;
    const [comments, relatedPage] = await Promise.all([
      apiClient<ForumCommentPageResponse>(`/api/forum/posts/${id}/comments?limit=50`),
      relatedPath
        ? apiClient<ForumPostPageResponse>(relatedPath).catch(() => undefined)
        : Promise.resolve(undefined),
    ]);
    return {
      post: mapForumPost(post),
      comments: comments.items
        .filter((comment) => comment.status !== 'HIDDEN')
        .map(mapForumComment),
      relatedPosts: (relatedPage?.items ?? [])
        .filter((item) => item.status !== 'HIDDEN' && item.postId !== id)
        .slice(0, 3)
        .map(mapForumPost),
    };
  },

  async listComments(postId: string): Promise<Comment[]> {
    const page = await apiClient<ForumCommentPageResponse>(
      `/api/forum/posts/${postId}/comments?limit=50`,
    );
    return page.items.filter((comment) => comment.status !== 'HIDDEN').map(mapForumComment);
  },

  async listCommentReplies(commentId: string): Promise<Comment[]> {
    const page = await apiClient<ForumCommentPageResponse>(
      `/api/forum/comments/${commentId}/replies?limit=50`,
    );
    return page.items.filter((comment) => comment.status !== 'HIDDEN').map(mapForumComment);
  },

  async addComment(postId: string, content: string, replyToCommentId?: string): Promise<Comment> {
    const data: ForumCommentUpsertRequest = { content: content.trim(), replyToCommentId };
    const comment = await apiClient<ForumCommentResponse>(`/api/forum/posts/${postId}/comments`, {
      method: 'POST',
      data,
    });
    return mapForumComment(comment);
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const data: ForumCommentUpsertRequest = { content: content.trim() };
    const comment = await apiClient<ForumCommentResponse>(`/api/forum/comments/${commentId}`, {
      method: 'PUT',
      data,
    });
    return mapForumComment(comment);
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient<ForumCommentResponse>(`/api/forum/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
