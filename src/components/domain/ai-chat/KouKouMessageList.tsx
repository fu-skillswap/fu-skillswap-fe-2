/**
 * @file KouKouMessageList.tsx
 * @description Danh sách hội thoại cục bộ của trợ lý KouKou.
 */

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/components/domain/ai-chat/types';

export function KouKouMessageList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={listRef}
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
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-3 flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <img src="/images/Koko.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
          )}
          <p
            className={`m-0 max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-primary-light text-text-main' : 'rounded-bl-md border border-border-color bg-white text-text-secondary'}`}
          >
            {message.content}
          </p>
        </div>
      ))}
    </div>
  );
}
