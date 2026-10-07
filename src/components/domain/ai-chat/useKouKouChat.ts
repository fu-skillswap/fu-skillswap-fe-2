/**
 * @file useKouKouChat.ts
 * @description Trạng thái hội thoại KouKou: gửi câu hỏi, nhận câu trả lời dạng stream, dừng, gửi lại, đánh giá.
 * Dịch vụ AI không lưu lịch sử nên toàn bộ hội thoại chỉ nằm trong state của component.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatErrorKind, ChatMessage } from '@/components/domain/ai-chat/types';
import type { AiChatEvent, AiChatMessageInput } from '@/models/ai';
import { ApiClientError, getAccessToken } from '@/models/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { aiRepo } from '@/repositories/aiRepo';
import { showError } from '@/utils/toast';

/** Number of past messages sent as context with each question. */
const HISTORY_LIMIT = 20;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const todayKey = () => new Date().toDateString();

function toHistory(messages: ChatMessage[]): AiChatMessageInput[] {
  return messages
    .filter((message) => message.status !== 'error' && message.content.trim())
    .slice(-HISTORY_LIMIT)
    .map(({ role, content }) => ({ role, content }));
}

function classifyError(error: unknown): { kind: ChatErrorKind | 'auth'; detail?: string } {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return { kind: 'auth' };
    if (error.status === 429) return { kind: 'rate_limited', detail: error.message };
    if (error.status === 503) return { kind: 'budget' };
    if (error.status === 400) return { kind: 'ai_error', detail: error.message };
    return { kind: 'ai_error' };
  }
  return { kind: 'network' };
}

export function useKouKouChat() {
  const { isAuthenticated, showAuthRequiredModal } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [budgetDay, setBudgetDay] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The daily AI budget resets at 0:00 local time.
  const isBudgetExhausted = budgetDay === todayKey();

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateMessage = useCallback(
    (id: string, update: (message: ChatMessage) => ChatMessage) =>
      setMessages((current) =>
        current.map((message) => (message.id === id ? update(message) : message)),
      ),
    [],
  );

  /** Streams an answer for `history` into a new assistant message appended after it. */
  const runChat = useCallback(
    async (history: ChatMessage[]) => {
      const assistantId = createId();
      setMessages([
        ...history,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          status: 'thinking',
        },
      ]);
      setIsSending(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const handleEvent = (event: AiChatEvent) => {
        updateMessage(assistantId, (message) => {
          switch (event.type) {
            case 'tool':
              return message.tools?.includes(event.data.name)
                ? message
                : { ...message, tools: [...(message.tools ?? []), event.data.name] };
            case 'sources':
              return { ...message, sources: event.data.items ?? [] };
            case 'mentors':
              return { ...message, mentors: event.data.items ?? [] };
            case 'text':
              return {
                ...message,
                status: 'streaming',
                content: message.content + (event.data.text ?? ''),
              };
            case 'done':
              return { ...message, status: 'done', requestId: event.data.requestId };
            case 'error':
              return {
                ...message,
                status: 'error',
                errorKind: event.data.error === 'RATE_LIMITED' ? 'rate_limited' : 'ai_error',
                requestId: event.data.requestId,
              };
            default:
              return message;
          }
        });
      };

      try {
        await aiRepo.streamChat({
          messages: toHistory(history),
          signal: controller.signal,
          onEvent: handleEvent,
        });
        // The stream may close without a `done` event: keep whatever arrived.
        updateMessage(assistantId, (message) =>
          message.status === 'thinking' || message.status === 'streaming'
            ? message.content
              ? { ...message, status: 'done' }
              : { ...message, status: 'error', errorKind: 'ai_error' }
            : message,
        );
      } catch (error) {
        if (controller.signal.aborted) {
          updateMessage(assistantId, (message) => ({ ...message, status: 'done' }));
          return;
        }
        const { kind, detail } = classifyError(error);
        if (kind === 'auth' || kind === 'budget') {
          // These states are shown outside the message list: drop the empty assistant slot.
          setMessages((current) => current.filter((message) => message.id !== assistantId));
          if (kind === 'auth') {
            showAuthRequiredModal('Bạn cần đăng nhập để trò chuyện với KouKou.');
          } else {
            setBudgetDay(todayKey());
          }
          return;
        }
        updateMessage(assistantId, (message) => ({
          ...message,
          status: 'error',
          errorKind: kind,
          errorDetail: detail,
        }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsSending(false);
      }
    },
    [showAuthRequiredModal, updateMessage],
  );

  const send = useCallback(
    (text: string = input) => {
      const content = text.trim();
      if (!content || isSending || isBudgetExhausted) return;
      if (!isAuthenticated || !getAccessToken()) {
        showAuthRequiredModal('Bạn cần đăng nhập để trò chuyện với KouKou.');
        return;
      }
      setInput('');
      void runChat([
        ...messages,
        { id: createId(), role: 'user', content, createdAt: new Date(), status: 'done' },
      ]);
    },
    [
      input,
      isAuthenticated,
      isBudgetExhausted,
      isSending,
      messages,
      runChat,
      showAuthRequiredModal,
    ],
  );

  /** Re-sends the history that led to the failed assistant message `messageId`. */
  const retry = useCallback(
    (messageId: string) => {
      if (isSending) return;
      const index = messages.findIndex((message) => message.id === messageId);
      if (index <= 0) return;
      void runChat(messages.slice(0, index));
    },
    [isSending, messages, runChat],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const resetConversation = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
  }, []);

  const rate = useCallback(
    async (messageId: string, rating: 1 | -1) => {
      const target = messages.find((message) => message.id === messageId);
      if (!target || target.rating) return;
      updateMessage(messageId, (message) => ({ ...message, rating }));
      try {
        await aiRepo.sendFeedback({
          feature: 'chat',
          rating,
          messageExcerpt: target.content.slice(0, 500),
        });
      } catch (error) {
        updateMessage(messageId, (message) => ({ ...message, rating: undefined }));
        showError(error);
      }
    },
    [messages, updateMessage],
  );

  return {
    messages,
    input,
    setInput,
    isSending,
    isBudgetExhausted,
    send,
    stop,
    retry,
    rate,
    resetConversation,
  };
}
