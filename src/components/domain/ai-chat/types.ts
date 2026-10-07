import type { AiMentorItem, AiSourceItem, AiToolName } from '@/models/ai';

export type ChatMessageStatus = 'thinking' | 'streaming' | 'done' | 'error';

export type ChatErrorKind = 'rate_limited' | 'ai_error' | 'budget' | 'network';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  status?: ChatMessageStatus;
  tools?: AiToolName[];
  sources?: AiSourceItem[];
  mentors?: AiMentorItem[];
  errorKind?: ChatErrorKind;
  /** Server `detail` text shown in the error box, when available. */
  errorDetail?: string;
  requestId?: string;
  rating?: 1 | -1;
};
