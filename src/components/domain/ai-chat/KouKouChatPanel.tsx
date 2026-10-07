/**
 * @file KouKouChatPanel.tsx
 * @description Floating panel hiển thị nội dung trợ lý KouKou.
 */

import { ChevronDown, MessageSquareText, RotateCcw, Search, X } from 'lucide-react';
import { KouKouChatInput } from '@/components/domain/ai-chat/KouKouChatInput';
import { KouKouMessageList } from '@/components/domain/ai-chat/KouKouMessageList';
import {
  KouKouActionRow,
  KouKouQuickActions,
} from '@/components/domain/ai-chat/KouKouQuickActions';
import type { ChatMessage } from '@/components/domain/ai-chat/types';
import { IconButton } from '@/components/ui/IconButton';

type KouKouChatPanelProps = {
  isOpen: boolean;
  locale: string;
  messages: ChatMessage[];
  input: string;
  isSending: boolean;
  isBudgetExhausted: boolean;
  onInputChange: (value: string) => void;
  onQuickAction: (message: string) => void;
  onSend: () => void;
  onStop: () => void;
  onRetry: (messageId: string) => void;
  onRate: (messageId: string, rating: 1 | -1) => void;
  onNewConversation: () => void;
  onAskCommunity: () => void;
  onClose: () => void;
};

export function KouKouChatPanel({
  isOpen,
  locale,
  messages,
  input,
  isSending,
  isBudgetExhausted,
  onInputChange,
  onQuickAction,
  onSend,
  onStop,
  onRetry,
  onRate,
  onNewConversation,
  onAskCommunity,
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
          <p className="text-[11px] text-text-muted">
            {isBudgetExhausted ? 'Tạm nghỉ đến 0:00' : 'Trợ lý AI của SkillSwap'}
          </p>
        </div>
        {messages.length > 0 && (
          <IconButton
            icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
            aria-label="Cuộc trò chuyện mới"
            title="Cuộc trò chuyện mới"
            size="lg"
            onClick={onNewConversation}
          />
        )}
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
      <KouKouMessageList
        messages={messages}
        locale={locale}
        isSending={isSending}
        onRetry={onRetry}
        onRate={onRate}
      />
      {isBudgetExhausted ? (
        <div className="shrink-0 space-y-2 px-3.5 pb-3">
          <div className="rounded-2xl rounded-tl-md border border-primary-border/40 bg-primary-light px-3.5 py-3 text-xs leading-relaxed text-text-secondary">
            <p className="font-semibold text-text-main">KouKou tạm nghỉ đến 0:00</p>
            <p>Hôm nay mình đã trả lời hết lượt. Bạn vẫn có thể hỏi người thật ngay bây giờ.</p>
          </div>
          <KouKouActionRow
            label="Đăng câu hỏi lên cộng đồng"
            icon={MessageSquareText}
            onClick={onAskCommunity}
          />
          <KouKouActionRow
            label="Tìm mentor phù hợp"
            icon={Search}
            href={`/${locale}/mentor-booking`}
            onClick={onClose}
          />
        </div>
      ) : (
        messages.length === 0 && (
          <div className="shrink-0 px-3.5 pb-3">
            <KouKouQuickActions onSelect={onQuickAction} />
          </div>
        )
      )}
      <KouKouChatInput
        value={input}
        isOpen={isOpen}
        isSending={isSending}
        disabled={isBudgetExhausted}
        placeholder={isBudgetExhausted ? 'Mở lại lúc 0:00' : undefined}
        onChange={onInputChange}
        onSend={onSend}
        onStop={onStop}
      />
    </section>
  );
}
