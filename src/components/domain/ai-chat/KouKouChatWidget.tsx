/**
 * @file KouKouChatWidget.tsx
 * @description Widget trợ lý KouKou dạng overlay dùng chung cho khu vực mentee và mentor.
 */

'use client';

import { useEffect, useState } from 'react';
import { KouKouChatPanel } from '@/components/domain/ai-chat/KouKouChatPanel';
import type { ChatMessage } from '@/components/domain/ai-chat/types';

export function KouKouChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const handleSendMessage = (message = input) => {
    const content = message.trim();
    if (!content || isSending) return;
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-${current.length}`, role: 'user', content, createdAt: new Date() },
    ]);
    setInput('');
  };

  return (
    <>
      <KouKouChatPanel
        isOpen={isOpen}
        messages={messages}
        input={input}
        isSending={isSending}
        onInputChange={setInput}
        onQuickAction={handleSendMessage}
        onSend={() => handleSendMessage()}
        onClose={() => setIsOpen(false)}
      />
      <button
        type="button"
        aria-label={isOpen ? 'Đóng trợ lý KouKou' : 'Mở trợ lý KouKou'}
        aria-expanded={isOpen}
        aria-controls="koukou-chat-panel"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed right-4 bottom-4 z-40 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-primary-border bg-white p-1 shadow-[0_6px_20px_rgba(15,23,42,0.14)] outline-none transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-blue active:translate-y-0 active:scale-95 focus-visible:ring-4 focus-visible:ring-primary/25 sm:right-6 sm:bottom-6"
      >
        <img src="/images/Koko.png" alt="" className="h-full w-full object-contain" />
        <span
          className="absolute top-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-success shadow-xs"
          aria-hidden="true"
        />
      </button>
    </>
  );
}
