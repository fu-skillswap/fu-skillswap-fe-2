/**
 * @file aiRepo.ts
 * @description Repository gọi dịch vụ AI (origin riêng `NEXT_PUBLIC_AI_URL`): chat streaming, feedback,
 * số liệu vận hành (ngân sách, mức dùng, tính năng) và kho tri thức. Response của dịch vụ AI là
 * snake_case; repo đổi sang camelCase trước khi trả về.
 * Dùng chung Access Token với Backend qua header `Authorization: Bearer <token>`.
 */

import type {
  AiBudget,
  AiChatEvent,
  AiChatMessageInput,
  AiDocument,
  AiDocumentList,
  AiDocumentsQuery,
  AiDocumentUploadInput,
  AiFeatureConfig,
  AiFeedbackFeature,
  AiFeedbackList,
  AiFeedbackRequest,
  AiKnowledgeSearchResult,
  AiRecommendations,
  AiTextDocumentInput,
  AiUsage,
} from '@/models/ai';
import { ApiClientError, getAccessToken, refreshSession } from '@/models/apiClient';

// TODO(env): set NEXT_PUBLIC_AI_URL (e.g. https://ai.skillswap.asia) for every environment.
const AI_URL = (process.env.NEXT_PUBLIC_AI_URL ?? '').trim().replace(/\/$/, '');

/** Thrown when `NEXT_PUBLIC_AI_URL` is missing so the UI can show the generic AI error state. */
export const AI_NOT_CONFIGURED = 'AI_NOT_CONFIGURED';

async function toApiError(response: Response): Promise<ApiClientError> {
  let code = `HTTP_${response.status}`;
  let message = `AI request failed (${response.status}).`;
  try {
    const body = (await response.json()) as { detail?: unknown; code?: unknown };
    if (typeof body.detail === 'string' && body.detail.trim()) message = body.detail;
    if (typeof body.code === 'string') code = body.code;
  } catch {
    /* Non-JSON error body: keep the generic message. */
  }
  return new ApiClientError(response.status, code, message);
}

function withAuth(init: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

/**
 * Fetches the AI service with the current access token. On 401 it refreshes the session once and
 * retries. Never logs headers or tokens.
 */
export async function aiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!AI_URL) throw new ApiClientError(0, AI_NOT_CONFIGURED, 'AI service URL is not configured.');

  const url = `${AI_URL}${path}`;
  let response = await fetch(url, withAuth(init, getAccessToken()));

  if (response.status === 401) {
    let newToken: string;
    try {
      newToken = await refreshSession();
    } catch {
      throw new ApiClientError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn.');
    }
    response = await fetch(url, withAuth(init, newToken));
    if (response.status === 401) {
      throw new ApiClientError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn.');
    }
  }

  if (!response.ok) throw await toApiError(response);
  return response;
}

/** JSON request helper on top of `aiFetch`. */
async function aiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await aiFetch(path, init);
  return (await response.json()) as T;
}

/**
 * For ops endpoints the AI service has not shipped yet: resolves to `null` on 404 so the admin UI
 * can show its "chưa có dữ liệu" state instead of an error.
 */
async function aiJsonOrMissing<T>(path: string): Promise<T | null> {
  try {
    return await aiJson<T>(path);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

/* ---------------------------- snake_case payloads --------------------------- */

type RawBudget = {
  day: string;
  spent_vnd: number;
  budget_vnd: number;
  remaining_vnd: number;
  by_feature: Record<string, number>;
};

type RawUsage = {
  days: Array<{ day: string; spent_vnd: number }>;
  today: Array<{
    feature: string;
    calls: number;
    input_tokens: number;
    output_tokens: number;
    cost_vnd: number;
  }>;
};

type RawFeature = {
  key: string;
  enabled: boolean;
  paused_reason?: string | null;
  model_main: string;
  model_classify?: string | null;
  limits?: Record<string, number>;
};

type RawFeedbackList = {
  items: Array<{
    id: number;
    feature: string;
    rating: 1 | -1;
    message_excerpt: string | null;
    prompt_version: string | null;
    created_at: string;
  }>;
  total: number;
};

type RawDocument = {
  id: string;
  title: string;
  source_type: string;
  school_code: string | null;
  topic: string | null;
  filename: string | null;
  size_bytes: number | null;
  status: string;
  error: string | null;
  chunk_count: number;
  is_active: boolean;
  created_at: string;
  indexed_at: string | null;
};

type RawSearch = {
  query: string;
  passages: Array<{
    chunk_id: string;
    document_id: string;
    document_title: string;
    heading: string | null;
    content: string;
    score: number;
  }>;
};

function toDocument(raw: RawDocument): AiDocument {
  return {
    id: raw.id,
    title: raw.title,
    sourceType: raw.source_type,
    schoolCode: raw.school_code,
    topic: raw.topic,
    filename: raw.filename,
    sizeBytes: raw.size_bytes,
    status: raw.status,
    error: raw.error,
    chunkCount: raw.chunk_count,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    indexedAt: raw.indexed_at,
  };
}

/** Parses one SSE block (`event: <name>` + `data: <json>` lines) into an event. */
function parseSseBlock(block: string): AiChatEvent | null {
  let type = 'message';
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) type = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  try {
    return { type, data: JSON.parse(dataLines.join('\n')) } as AiChatEvent;
  } catch {
    return null;
  }
}

export const aiRepo = {
  /**
   * Streams a chat answer from `POST /v1/chat`. Uses fetch + ReadableStream instead of EventSource
   * because EventSource cannot send the Authorization header. HTTP errors (400/401/429/502/503)
   * reject before any event is emitted.
   */
  async streamChat({
    messages,
    signal,
    onEvent,
  }: {
    messages: AiChatMessageInput[];
    signal?: AbortSignal;
    onEvent: (event: AiChatEvent) => void;
  }): Promise<void> {
    const response = await aiFetch('/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages, stream: true }),
      signal,
    });
    if (!response.body) throw new ApiClientError(502, 'AI_ERROR', 'Empty AI response.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const event = parseSseBlock(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (event) onEvent(event);
        boundary = buffer.indexOf('\n\n');
      }
    }
    buffer += decoder.decode();
    const tail = buffer.trim() ? parseSseBlock(buffer.trim()) : null;
    if (tail) onEvent(tail);
  },

  /** Sends a thumbs up/down rating to `POST /v1/feedback` (responds 204). */
  async sendFeedback(data: AiFeedbackRequest): Promise<void> {
    await aiFetch('/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Mentor recommendations reranked by the AI (`GET /v1/recommendations`, max 20). Items are the
   * backend's recommendation items plus an optional `aiReason`. Client-side only: the server has
   * no user token. Rejects on any failure so callers can fall back to the backend endpoint.
   */
  async getRecommendations(limit = 6): Promise<AiRecommendations> {
    const raw = await aiJson<Partial<AiRecommendations>>(
      `/v1/recommendations${toQuery({ limit })}`,
    );
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      reranked: Boolean(raw.reranked),
      cached: Boolean(raw.cached),
      requestId: raw.requestId ?? '',
    };
  },

  /* ------------------------------- Ops (admin) ------------------------------ */

  /** `GET /v1/ops/budget` — today's spend vs the daily budget, per ledger feature. */
  async getBudget(): Promise<AiBudget> {
    const raw = await aiJson<RawBudget>('/v1/ops/budget');
    return {
      day: raw.day,
      spentVnd: raw.spent_vnd,
      budgetVnd: raw.budget_vnd,
      remainingVnd: raw.remaining_vnd,
      byFeature: raw.by_feature ?? {},
    };
  },

  /**
   * Daily spend for the last `days` days plus today's calls/tokens per feature.
   * Resolves to `null` while the endpoint does not exist (404).
   * TODO(api): GET /v1/ops/usage?days=7 →
   *   { days: [{ day, spent_vnd }], today: [{ feature, calls, input_tokens, output_tokens, cost_vnd }] }
   */
  async getUsage(days = 7): Promise<AiUsage | null> {
    const raw = await aiJsonOrMissing<RawUsage>(`/v1/ops/usage${toQuery({ days })}`);
    if (!raw) return null;
    return {
      days: raw.days.map((item) => ({ day: item.day, spentVnd: item.spent_vnd })),
      today: raw.today.map((item) => ({
        feature: item.feature,
        calls: item.calls,
        inputTokens: item.input_tokens,
        outputTokens: item.output_tokens,
        costVnd: item.cost_vnd,
      })),
    };
  },

  /**
   * Feature switches, models and limits. Resolves to `null` while the endpoint does not exist (404).
   * TODO(api): GET /v1/ops/features →
   *   [{ key, enabled, paused_reason?, model_main, model_classify?, limits: { ... } }]
   */
  async getFeatures(): Promise<AiFeatureConfig[] | null> {
    const raw = await aiJsonOrMissing<RawFeature[]>('/v1/ops/features');
    if (!raw) return null;
    return raw.map((item) => ({
      key: item.key,
      enabled: item.enabled,
      pausedReason: item.paused_reason ?? null,
      modelMain: item.model_main,
      modelClassify: item.model_classify ?? null,
      limits: item.limits ?? {},
    }));
  },

  /**
   * Thumbs up/down ratings stored in the `ai_feedback` table. Resolves to `null` while the
   * endpoint does not exist (404).
   * TODO(api): GET /v1/ops/feedback?feature=chat&rating=-1&limit=&offset= →
   *   { items: [{ id, feature, rating, message_excerpt, prompt_version, created_at }], total }
   */
  async getFeedback(
    feature: AiFeedbackFeature,
    rating?: 1 | -1,
    page: { limit?: number; offset?: number } = {},
  ): Promise<AiFeedbackList | null> {
    const raw = await aiJsonOrMissing<RawFeedbackList>(
      `/v1/ops/feedback${toQuery({ feature, rating, limit: page.limit, offset: page.offset })}`,
    );
    if (!raw) return null;
    return {
      total: raw.total,
      items: raw.items.map((item) => ({
        id: item.id,
        feature: item.feature,
        rating: item.rating,
        messageExcerpt: item.message_excerpt,
        promptVersion: item.prompt_version,
        createdAt: item.created_at,
      })),
    };
  },

  /* ----------------------------- Knowledge base ----------------------------- */

  /** `GET /v1/documents` (admin). */
  async listDocuments(query: AiDocumentsQuery = {}): Promise<AiDocumentList> {
    const raw = await aiJson<{ items: RawDocument[]; total: number }>(
      `/v1/documents${toQuery({
        status: query.status,
        school_code: query.schoolCode,
        topic: query.topic,
        limit: query.limit,
        offset: query.offset,
      })}`,
    );
    return { items: raw.items.map(toDocument), total: raw.total };
  },

  /** `GET /v1/documents/{id}` — poll this while a document is `pending` / `processing`. */
  async getDocument(documentId: string): Promise<AiDocument> {
    return toDocument(await aiJson<RawDocument>(`/v1/documents/${encodeURIComponent(documentId)}`));
  },

  /**
   * `POST /v1/documents` (multipart) — PDF, DOCX, MD, TXT up to 20MB. Indexing runs in the
   * background, so the returned document starts as `pending`. 409 = duplicate, 413 = too large,
   * 415 = unsupported type.
   */
  async uploadDocument({
    file,
    title,
    schoolCode,
    topic,
  }: AiDocumentUploadInput): Promise<AiDocument> {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    if (schoolCode) form.append('school_code', schoolCode);
    if (topic) form.append('topic', topic);
    // No Content-Type header: the browser sets the multipart boundary.
    return toDocument(await aiJson<RawDocument>('/v1/documents', { method: 'POST', body: form }));
  },

  /** `POST /v1/documents/text` — pasted text (at least 50 characters). */
  async createTextDocument({
    title,
    content,
    schoolCode,
    topic,
  }: AiTextDocumentInput): Promise<AiDocument> {
    return toDocument(
      await aiJson<RawDocument>('/v1/documents/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, school_code: schoolCode, topic }),
      }),
    );
  },

  /** `GET /v1/documents/{id}/download` — presigned URL of the original file. */
  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    const { url } = await aiJson<{ url: string }>(
      `/v1/documents/${encodeURIComponent(documentId)}/download`,
    );
    return url;
  },

  /** `POST /v1/documents/{id}/reindex` — 409 when the original file was not stored. */
  async reindexDocument(documentId: string): Promise<AiDocument> {
    return toDocument(
      await aiJson<RawDocument>(`/v1/documents/${encodeURIComponent(documentId)}/reindex`, {
        method: 'POST',
      }),
    );
  },

  /** `DELETE /v1/documents/{id}` (responds 204; chunks are deleted too). */
  async deleteDocument(documentId: string): Promise<void> {
    await aiFetch(`/v1/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' });
  },

  /**
   * `GET /v1/knowledge/search` — retrieval only (no generated answer), to check which passages
   * the chatbot would use. `q` must be 2–500 characters; `topK` 1–20 (default 5).
   */
  async searchKnowledge({
    q,
    topK,
    schoolCode,
  }: {
    q: string;
    topK?: number;
    schoolCode?: string;
  }): Promise<AiKnowledgeSearchResult> {
    const raw = await aiJson<RawSearch>(
      `/v1/knowledge/search${toQuery({ q, top_k: topK, school_code: schoolCode })}`,
    );
    return {
      query: raw.query,
      passages: raw.passages.map((item) => ({
        chunkId: item.chunk_id,
        documentId: item.document_id,
        documentTitle: item.document_title,
        heading: item.heading,
        content: item.content,
        score: item.score,
      })),
    };
  },
};
