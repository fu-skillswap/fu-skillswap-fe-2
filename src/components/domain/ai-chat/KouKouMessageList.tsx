/**
 * @file KouKouMessageList.tsx
 * @description Danh sách hội thoại cục bộ của trợ lý KouKou.
 */

import { useEffect, useRef } from 'react';
import { KouKouAssistantMessage } from '@/components/domain/ai-chat/KouKouAssistantMessage';
import type { ChatMessage } from '@/components/domain/ai-chat/types';

/** Distance (px) from the bottom within which the list keeps following new content. */
const STICK_THRESHOLD = 48;

type KouKouMessageListProps = {
  messages: ChatMessage[];
  locale: string;
  isSending: boolean;
  onRetry: (messageId: string) => void;
  onRate: (messageId: string, rating: 1 | -1) => void;
};

export function KouKouMessageList({
  messages,
  locale,
  isSending,
  onRetry,
  onRate,
}: KouKouMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    stickToBottomRef.current =
      list.scrollHeight - list.scrollTop - list.clientHeight <= STICK_THRESHOLD;
  };

  // A newly sent question always brings the user back to the bottom. Declared before the scroll
  // effect so it runs first in the same commit.
  const lastUserMessageId = [...messages].reverse().find((message) => message.role === 'user')?.id;
  useEffect(() => {
    stickToBottomRef.current = true;
  }, [lastUserMessageId]);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottomRef.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      aria-live="polite"
    >
      <div className="mb-4 flex items-start gap-2.5">
        <img src="/images/Koko.png" alt="" className="h-14 w-14 shrink-0 object-contain" />
        <div className="rounded-2xl rounded-tl-md border border-primary-border/40 bg-primary-light px-3.5 py-3 text-xs leading-relaxed text-text-secondary">
          <p className="font-semibold text-text-main">Xin chào! 👋</p>
          <p>Mình là KouKou, trợ lý AI của SkillSwap. Mình có thể giúp gì cho bạn hôm nay?</p>
        </div>
      </div>
      {messages.map((message) =>
        message.role === 'assistant' ? (
          <KouKouAssistantMessage
            key={message.id}
            message={message}
            locale={locale}
            canRetry={!isSending}
            onRetry={onRetry}
            onRate={onRate}
          />
        ) : (
          <div key={message.id} className="mb-3 flex justify-end">
            <p className="m-0 max-w-[82%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-xs leading-5 text-white">
              {message.content}
            </p>
          </div>
        ),
      )}
    </div>
  );
}
