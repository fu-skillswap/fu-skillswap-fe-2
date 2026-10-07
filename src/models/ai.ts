/**
 * @file ai.ts
 * @description Kiểu dữ liệu cho dịch vụ AI (KouKou chat, feedback) chạy ở origin riêng.
 */

export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessageInput {
  role: AiChatRole;
  content: string;
}

export interface AiChatRequest {
  messages: AiChatMessageInput[];
  stream: true;
}

export type AiToolName = 'knowledge_base' | 'search_mentors' | 'my_bookings';

export interface AiSourceItem {
  documentId: string;
  title: string;
}

export interface AiMentorItem {
  mentorUserId: string;
  name: string;
  headline?: string;
  avatarUrl?: string | null;
}

export type AiStreamErrorCode = 'RATE_LIMITED' | 'AI_ERROR';

/** Server-sent events emitted by `POST /v1/chat` when `stream: true`. */
export type AiChatEvent =
  | { type: 'tool'; data: { name: AiToolName } }
  | { type: 'sources'; data: { items: AiSourceItem[] } }
  | { type: 'mentors'; data: { items: AiMentorItem[] } }
  | { type: 'text'; data: { text: string } }
  | { type: 'done'; data: { requestId?: string } }
  | { type: 'error'; data: { error: AiStreamErrorCode; requestId?: string } };

export type AiFeedbackFeature = 'chat' | 'forum_answer' | 'rerank';

export interface AiFeedbackRequest {
  feature: AiFeedbackFeature;
  rating: 1 | -1;
  messageExcerpt?: string;
}
