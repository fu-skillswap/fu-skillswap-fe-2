/**
 * @file aiRepo.ts
 * @description Repository gọi dịch vụ AI (origin riêng `NEXT_PUBLIC_AI_URL`): chat streaming và feedback.
 * Dùng chung Access Token với Backend qua header `Authorization: Bearer <token>`.
 */

import type { AiChatEvent, AiChatMessageInput, AiFeedbackRequest } from '@/models/ai';
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
};
