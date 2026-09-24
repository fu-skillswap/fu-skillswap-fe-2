/**
 * @file KouKouChatPanel.tsx
 * @description Floating panel hiển thị nội dung trợ lý KouKou.
 */

import { ChevronDown, X } from 'lucide-react';
import { KouKouChatInput } from '@/components/domain/ai-chat/KouKouChatInput';
import { KouKouMessageList } from '@/components/domain/ai-chat/KouKouMessageList';
import { KouKouQuickActions } from '@/components/domain/ai-chat/KouKouQuickActions';
import type { ChatMessage } from '@/components/domain/ai-chat/types';
import { IconButton } from '@/components/ui/IconButton';

type KouKouChatPanelProps = {
  isOpen: boolean;
  messages: ChatMessage[];
  input: string;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onQuickAction: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
};

export function KouKouChatPanel({
  isOpen,
  messages,
  input,
  isSending,
  onInputChange,
  onQuickAction,
  onSend,
  onClose,
}: KouKouChatPanelProps) {
  return (
    <section
      id="koukou-chat-panel"
      role="dialog"
      aria-label="Trợ lý KouKou"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed right-3 bottom-24 z-40 flex h-[540px] max-h-[75dvh] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-border-color bg-white shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-[opacity,transform] duration-200 ease-out sm:right-6 sm:bottom-[108px] sm:max-h-[calc(100dvh-132px)] sm:w-[360px] ${isOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2.5 scale-[0.985] opacity-0'}`}
    >
      <header className="flex min-h-16 shrink-0 items-center gap-2 border-b border-border-color px-3.5 py-2.5">
        <img src="/images/Koko.png" alt="" className="h-10 w-10 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-main">KouKou AI</h2>
            <span className="rounded-md bg-primary-light px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary">
              BETA
            </span>
          </div>
          <p className="text-[11px] text-text-muted">Trợ lý AI của SkillSwap</p>
        </div>
        <IconButton
          icon={<ChevronDown className="h-4.5 w-4.5" aria-hidden="true" />}
          aria-label="Thu gọn trợ lý KouKou"
          size="lg"
          onClick={onClose}
        />
        <IconButton
          icon={<X className="h-4.5 w-4.5" aria-hidden="true" />}
          aria-label="Đóng trợ lý KouKou"
          size="lg"
          onClick={onClose}
        />
      </header>
      <KouKouMessageList messages={messages} />
      {messages.length === 0 && (
        <div className="shrink-0 px-3.5 pb-3">
          <KouKouQuickActions onSelect={onQuickAction} />
        </div>
      )}
      <KouKouChatInput
        value={input}
        isOpen={isOpen}
        isSending={isSending}
        onChange={onInputChange}
        onSend={onSend}
      />
    </section>
  );
}
