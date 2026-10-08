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

/* -------------------------------------------------------------------------- */
/* Admin ops (budget, usage, features, feedback) — camelCase after mapping    */
/* -------------------------------------------------------------------------- */

/** `GET /v1/ops/budget` — today's spend per ledger feature. */
export interface AiBudget {
  /** YYYY-MM-DD (server date). */
  day: string;
  spentVnd: number;
  budgetVnd: number;
  remainingVnd: number;
  /** Ledger feature key (e.g. `chat_rag`) → VND spent today. */
  byFeature: Record<string, number>;
}

export interface AiUsageDay {
  day: string;
  spentVnd: number;
}

export interface AiUsageFeatureToday {
  feature: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costVnd: number;
}

/** `GET /v1/ops/usage?days=N` (not deployed yet). */
export interface AiUsage {
  days: AiUsageDay[];
  today: AiUsageFeatureToday[];
}

/** `GET /v1/ops/features` (not deployed yet). */
export interface AiFeatureConfig {
  key: string;
  enabled: boolean;
  pausedReason: string | null;
  modelMain: string;
  modelClassify: string | null;
  limits: Record<string, number>;
}

export interface AiFeedbackEntry {
  id: number;
  feature: string;
  rating: 1 | -1;
  messageExcerpt: string | null;
  promptVersion: string | null;
  createdAt: string;
}

/** `GET /v1/ops/feedback?feature=…&rating=…` (not deployed yet). */
export interface AiFeedbackList {
  items: AiFeedbackEntry[];
  total: number;
}

/* -------------------------------------------------------------------------- */
/* Knowledge base (documents + retrieval test)                                */
/* -------------------------------------------------------------------------- */

/** Values written by ai-skillswap `services/ingest.py`. */
export type AiDocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed' | (string & {});

export interface AiDocument {
  id: string;
  title: string;
  /** `upload` (file) or `manual` (pasted text). */
  sourceType: string;
  schoolCode: string | null;
  topic: string | null;
  filename: string | null;
  sizeBytes: number | null;
  status: AiDocumentStatus;
  error: string | null;
  chunkCount: number;
  isActive: boolean;
  createdAt: string;
  indexedAt: string | null;
}

export interface AiDocumentList {
  items: AiDocument[];
  total: number;
}

export interface AiDocumentsQuery {
  status?: string;
  schoolCode?: string;
  topic?: string;
  /** Max 200 (server default 50). */
  limit?: number;
  offset?: number;
}

export interface AiDocumentUploadInput {
  file: File;
  title?: string;
  schoolCode?: string;
  topic?: string;
}

export interface AiTextDocumentInput {
  title: string;
  /** At least 50 characters. */
  content: string;
  schoolCode?: string;
  topic?: string;
}

export interface AiKnowledgePassage {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  heading: string | null;
  content: string;
  score: number;
}

export interface AiKnowledgeSearchResult {
  query: string;
  passages: AiKnowledgePassage[];
}

/* -------------------------------------------------------------------------- */
/* Mentor recommendations                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One item of the backend's `/api/mentors/recommendations`, passed through unchanged by the AI
 * service. `mentor` is the grouped card (identity / mentoring / evidence / reputation); the mentor
 * id lives only in `mentor.identity.mentorUserId`. Parse it with `mapApiMentorToEntity`.
 */
export interface MentorRecommendationItem {
  mentor: Record<string, unknown>;
  matchScore?: number;
  /** Rule-based reasons from the backend (strings, or objects with a text field). */
  matchReasons?: unknown[];
  /** Personalised reason added by the AI when `reranked` is true. */
  aiReason?: string;
}

/** `GET /v1/recommendations?limit=N` (camelCase). 502 when the backend list failed. */
export interface AiRecommendations {
  items: MentorRecommendationItem[];
  reranked: boolean;
  cached: boolean;
  requestId: string;
}
