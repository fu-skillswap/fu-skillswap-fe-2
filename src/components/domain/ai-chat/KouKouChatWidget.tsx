/**
 * @file KouKouChatWidget.tsx
 * @description Widget trợ lý KouKou dạng overlay dùng chung cho khu vực mentee và mentor.
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KouKouChatPanel } from '@/components/domain/ai-chat/KouKouChatPanel';
import { useKouKouChat } from '@/components/domain/ai-chat/useKouKouChat';
import { useAuth } from '@/providers/AuthProvider';
import { MenteeQuestionModal } from '@/views/mentee/dashboard/MenteeQuestionModal';

export function KouKouChatWidget() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? 'vi';
  const { isAuthenticated, showAuthRequiredModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const chat = useKouKouChat();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('skillswap:open-koukou', openChat);
    return () => window.removeEventListener('skillswap:open-koukou', openChat);
  }, []);

  const handleAskCommunity = () => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để đăng câu hỏi và nhận hỗ trợ từ mentor.');
      return;
    }
    setIsOpen(false);
    setIsQuestionOpen(true);
  };

  return (
    <>
      <KouKouChatPanel
        isOpen={isOpen}
        locale={locale}
        messages={chat.messages}
        input={chat.input}
        isSending={chat.isSending}
        isBudgetExhausted={chat.isBudgetExhausted}
        onInputChange={chat.setInput}
        onQuickAction={(message) => chat.send(message)}
        onSend={() => chat.send()}
        onStop={chat.stop}
        onRetry={chat.retry}
        onRate={(messageId, rating) => void chat.rate(messageId, rating)}
        onNewConversation={chat.resetConversation}
        onAskCommunity={handleAskCommunity}
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
      <MenteeQuestionModal
        open={isQuestionOpen}
        onClose={() => setIsQuestionOpen(false)}
        onCreated={() => setIsQuestionOpen(false)}
      />
    </>
  );
}
