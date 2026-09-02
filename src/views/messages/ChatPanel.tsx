/**
 * @file ChatPanel.tsx
 * @description Luồng hội thoại và trình soạn tin nhắn local của trang Tin nhắn.
 */

import { ArrowLeft, Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type {
  ConversationReadOnlyReason,
  ConversationResponse,
  MessageResponse,
} from '@/models/message';

function initialsFor(name?: string | null) {
  return (
    (name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function messageDateKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toDateString();
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function readOnlyMessage(reason?: ConversationReadOnlyReason | null) {
  const messages: Partial<Record<ConversationReadOnlyReason, string>> = {
    ADMIN_LOCKED: 'Cuộc trò chuyện đang bị khóa.',
    ACCOUNT_RESTRICTED: 'Tài khoản hiện chưa thể gửi tin nhắn.',
    UNDER_REVIEW: 'Cuộc trò chuyện tạm khóa trong thời gian xem xét booking.',
    PARTICIPANT_BLOCKED: 'Bạn không thể gửi tin nhắn trong cuộc trò chuyện này.',
    GROUP_MEMBERSHIP_REVOKED: 'Bạn không còn quyền gửi tin nhắn vào nhóm này.',
    NO_EFFECTIVE_BOOKING: 'Cần có booking phù hợp để tiếp tục trò chuyện.',
    CHAT_WINDOW_EXPIRED: 'Thời gian hỗ trợ chat của booking đã kết thúc.',
  };
  return (reason && messages[reason]) || 'Cuộc trò chuyện hiện chỉ có thể xem.';
}

interface ChatPanelProps {
  conversation?: ConversationResponse;
  messages: MessageResponse[];
  draft: string;
  mobileVisible: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
  isLoading: boolean;
  isSending: boolean;
  error?: string;
  onRetry: () => void;
}

function canComposeMessage(conversation: ConversationResponse) {
  if (conversation.canSendMessages !== false) return true;

  // Conversation được tạo ngay khi Mentor accept. Một số response detail cũ vẫn trả
  // NO_EFFECTIVE_BOOKING dù conversation đã ACTIVE; API gửi tin nhắn kiểm tra quyền cuối cùng.
  return conversation.status === 'ACTIVE' && conversation.readOnlyReason === 'NO_EFFECTIVE_BOOKING';
}

export function ChatPanel({
  conversation,
  messages,
  draft,
  mobileVisible,
  onDraftChange,
  onSend,
  onBack,
  isLoading,
  isSending,
  error,
  onRetry,
}: ChatPanelProps) {
  const messageListRef = useRef<HTMLDivElement>(null);
  const canCompose = conversation ? canComposeMessage(conversation) : false;

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [conversation?.id, messages]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  if (!conversation) {
    return (
      <section
        className={`${mobileVisible ? 'flex' : 'hidden md:flex'} min-h-0 flex-1 flex-col bg-white`}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-text-muted">
          <MessageCircle aria-hidden="true" />
          <strong>Chọn một cuộc trò chuyện</strong>
          <p>Tin nhắn của bạn sẽ hiển thị ở đây.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${mobileVisible ? 'flex' : 'hidden md:flex'} min-h-0 flex-1 flex-col bg-white`}
    >
      <header className="flex min-h-20 items-center gap-3 border-b border-border-color px-5 py-3">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary hover:bg-surface-subtle md:hidden"
          onClick={onBack}
          aria-label="Quay lại"
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <span
          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 font-bold text-text-secondary"
          aria-hidden="true"
        >
          {conversation.otherUserAvatarUrl ? (
            <img
              className="h-full w-full object-cover"
              src={conversation.otherUserAvatarUrl}
              alt=""
            />
          ) : (
            initialsFor(conversation.otherUserName)
          )}
        </span>
        <div className="grid min-w-0 flex-1 gap-1 [&_span]:text-xs [&_span]:text-primary [&_strong]:truncate [&_strong]:text-base [&_strong]:text-text-main">
          <strong>{conversation.otherUserName || 'Cuộc trò chuyện'}</strong>
          <span>
            {conversation.type === 'GROUP' ? 'Cuộc trò chuyện nhóm' : 'Trò chuyện trực tiếp'}
          </span>
        </div>
        <button
          type="button"
          className="rounded-xl border border-primary-border bg-primary-light px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          disabled
          title="Hồ sơ người trò chuyện sẽ khả dụng khi hệ thống tin nhắn được kết nối."
        >
          Xem hồ sơ
        </button>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7"
        ref={messageListRef}
        aria-live="polite"
      >
        {isLoading ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-text-muted"
            role="status"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            <strong>Đang tải tin nhắn...</strong>
          </div>
        ) : error ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-text-muted"
            role="alert"
          >
            <MessageCircle aria-hidden="true" />
            <strong>Không thể tải tin nhắn</strong>
            <p>{error}</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border-color px-3 py-2 font-semibold"
              onClick={onRetry}
            >
              <RefreshCw aria-hidden="true" /> Thử lại
            </button>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message, index) => {
            const showDate =
              index === 0 ||
              messageDateKey(messages[index - 1].createdAt) !== messageDateKey(message.createdAt);
            return (
              <Fragment key={message.id}>
                {showDate && (
                  <div className="my-4 flex items-center gap-3 text-xs text-text-disabled before:h-px before:flex-1 before:bg-border-light after:h-px after:flex-1 after:bg-border-light">
                    <span>{formatMessageDate(message.createdAt)}</span>
                  </div>
                )}
                <div
                  className={`mb-4 flex items-end gap-2 ${message.isMine ? 'justify-end' : 'justify-start'} ${message.messageType === 'SYSTEM' ? 'justify-center' : ''}`}
                >
                  {!message.isMine && message.messageType !== 'SYSTEM' && (
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-text-secondary"
                      aria-hidden="true"
                    >
                      {initialsFor(message.senderName || conversation.otherUserName)}
                    </span>
                  )}
                  <div
                    className={`grid max-w-[70%] gap-1 ${message.isMine ? 'justify-items-end' : 'justify-items-start'} [&_time]:text-[11px] [&_time]:text-text-disabled`}
                  >
                    <p
                      className={`m-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${message.messageType === 'SYSTEM' ? 'bg-surface-subtle text-text-muted' : message.isMine ? 'bg-primary text-white' : 'bg-slate-100 text-text-main'}`}
                    >
                      {message.state === 'DELETED' ? 'Tin nhắn đã được xóa.' : message.content}
                    </p>
                    <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                  </div>
                </div>
              </Fragment>
            );
          })
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-text-muted">
            <MessageCircle aria-hidden="true" />
            <strong>Chưa có tin nhắn</strong>
            <p>Hãy gửi lời chào để bắt đầu cuộc trò chuyện.</p>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border-color bg-white p-4">
        <label htmlFor="message-composer" className="sr-only">
          Soạn tin nhắn cho {conversation.otherUserName || 'người dùng'}
        </label>
        <textarea
          id="message-composer"
          rows={1}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder={
            !canCompose
              ? readOnlyMessage(conversation.readOnlyReason)
              : `Nhắn tin cho ${conversation.otherUserName || 'người dùng'}...`
          }
          disabled={!canCompose || isSending}
          maxLength={2000}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-0 bg-surface-subtle px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onSend}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-0 bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!draft.trim() || !canCompose || isSending}
          aria-label="Gửi tin nhắn"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
        </button>
      </div>
    </section>
  );
}
