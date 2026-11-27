/**
 * @file aiKnowledge.constants.ts
 * @description Nhãn, giới hạn và bảng giá cho trang "Kho tri thức & chi phí".
 * Facts mirror ai-skillswap (`app/routers/documents.py`, `app/schemas.py`, `app/config.py`,
 * `app/llm/pricing.py`, `app/services/*.py`) — update both sides together.
 */

import type { AiDocumentStatus } from '@/models/ai';

export const PAGE_SIZE = 20;
/** Poll interval while a document on screen is still being indexed. */
export const POLL_INTERVAL_MS = 4000;

/** `POST /v1/documents` limits. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.md', '.txt'];
/** `TextDocumentIn` limits. */
export const TITLE_MAX = 500;
export const TEXT_MIN = 50;
export const SCHOOL_CODE_MAX = 32;
export const TOPIC_MAX = 128;
/** `GET /v1/knowledge/search` limits. */
export const QUERY_MIN = 2;
export const QUERY_MAX = 500;
export const TOP_K_OPTIONS = [3, 5, 10];

export type DocumentStatusFilter = 'ALL' | 'indexed' | 'pending' | 'processing' | 'failed';

export const DOCUMENT_STATUS: Record<
  string,
  { label: string; tone: 'success' | 'pending' | 'danger' | 'neutral'; hint: string }
> = {
  indexed: {
    label: 'Sẵn sàng',
    tone: 'success',
    hint: 'Chatbot và bot diễn đàn đã dùng được tài liệu này.',
  },
  pending: { label: 'Đang chờ', tone: 'pending', hint: 'Đang xếp hàng để đọc và cắt đoạn.' },
  processing: {
    label: 'Đang xử lý',
    tone: 'pending',
    hint: 'Đang cắt đoạn và tạo vector, thường mất vài chục giây.',
  },
  failed: { label: 'Lỗi', tone: 'danger', hint: 'Không nạp được. Xem lý do rồi nạp lại.' },
};

export function getDocumentStatus(status: AiDocumentStatus) {
  return DOCUMENT_STATUS[status] ?? { label: status, tone: 'neutral' as const, hint: '' };
}

export function isIndexing(status: AiDocumentStatus) {
  return status === 'pending' || status === 'processing';
}

/** Human label for each `ai_usage.feature` ledger key (one step of a feature). */
export const LEDGER_STEP_LABELS: Record<string, string> = {
  chat: 'Viết câu trả lời',
  chat_triage: 'Phân loại câu hỏi',
  chat_rag: 'Tìm tài liệu liên quan',
  moderation: 'Chấm điểm vi phạm',
  recommend: 'Xếp hạng mentor',
  recommendation: 'Xếp hạng mentor',
  forum_triage: 'Phân loại bài viết',
  forum_rag: 'Tìm tài liệu liên quan',
  forum_answer: 'Viết câu trả lời',
  transcribe: 'Chép lời ghi âm',
  meeting_summary: 'Tóm tắt buổi học',
  embedding: 'Đọc tài liệu mới nạp',
  rag_translate: 'Dịch câu hỏi để tìm tài liệu',
};

/** `app/config.py` exchange rate used to turn USD prices into VNĐ. */
export const USD_TO_VND = 26_300;
/** `app/config.py` daily_budget_vnd default. */
export const DEFAULT_DAILY_BUDGET_VND = 25_000;

/** Models in use today, with FPT AI Marketplace list prices (USD / 1M tokens, 09/08/2026). */
export const MODEL_PRICES: Array<{
  model: string;
  usedFor: string;
  inputUsd: number;
  outputUsd: number;
}> = [
  {
    model: 'DeepSeek-V4-Flash',
    usedFor: 'KouKou và bot diễn đàn viết câu trả lời',
    inputUsd: 0.14,
    outputUsd: 0.28,
  },
  {
    model: 'gemma-4-26B-A4B-it',
    usedFor: 'Phân loại câu hỏi và bài viết, kiểm duyệt, dịch câu hỏi',
    inputUsd: 0.14,
    outputUsd: 0.4,
  },
  {
    model: 'gpt-oss-120b',
    usedFor: 'Gợi ý mentor, tóm tắt buổi học',
    inputUsd: 0.143,
    outputUsd: 0.605,
  },
  {
    model: 'Vietnamese_Embedding',
    usedFor: 'Đọc tài liệu và câu hỏi để tìm đoạn liên quan',
    inputUsd: 0.011,
    outputUsd: 0,
  },
  {
    model: 'bge-reranker-v2-m3',
    usedFor: 'Sắp xếp lại các đoạn tìm được',
    inputUsd: 0.022,
    outputUsd: 0,
  },
];

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

/** "1,2 MB", "830 KB". */
export function formatBytes(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(size)} ${units[unit]}`;
}

export function getFileExtension(name: string) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}
