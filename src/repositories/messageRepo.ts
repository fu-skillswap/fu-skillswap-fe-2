/**
 * @file messageRepo.ts
 * @description Repository cho các thao tác đọc và gửi tin nhắn của người dùng hiện tại.
 */

import { apiClient } from '@/models/apiClient';
import type {
  ConversationCursorPageResponse,
  ConversationReadRequest,
  ConversationReadResponse,
  ConversationResponse,
  MessageResponse,
  SendMessageRequest,
} from '@/models/message';

function queryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export const messageRepo = {
  getConversations: (query: { cursor?: string; limit?: number } = {}) =>
    apiClient<ConversationCursorPageResponse>(`/api/me/conversations${queryString(query)}`),

  getConversationDetail: (conversationId: string) =>
    apiClient<ConversationResponse>(`/api/me/conversations/${conversationId}`),

  getMessages: (
    conversationId: string,
    query: { beforeSequence?: number; afterSequence?: number; limit?: number } = {},
  ) =>
    apiClient<MessageResponse[]>(
      `/api/me/conversations/${conversationId}/messages${queryString(query)}`,
    ),

  sendMessage: (conversationId: string, payload: SendMessageRequest) =>
    apiClient<MessageResponse>(`/api/me/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markAsRead: (conversationId: string, payload: ConversationReadRequest) =>
    apiClient<ConversationReadResponse>(`/api/me/conversations/${conversationId}/read`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
