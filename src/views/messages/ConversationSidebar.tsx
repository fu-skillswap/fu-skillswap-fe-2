/**
 * @file ConversationSidebar.tsx
 * @description Danh sách và tìm kiếm cuộc trò chuyện trong giao diện tin nhắn.
 */

import { Loader2, MessageCircle, RefreshCw, Search } from 'lucide-react';
import type { ConversationResponse } from '@/models/message';

function initialsFor(name?: string | null) {
  const initials = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  return initials.toUpperCase() || '?';
}

function formatConversationTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

interface ConversationSidebarProps {
  conversations: ConversationResponse[];
  activeConversationId?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  mobileHidden: boolean;
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  searchTerm,
  onSearchChange,
  onSelectConversation,
  mobileHidden,
  isLoading,
  error,
  onRetry,
}: ConversationSidebarProps) {
  return (
    <aside
      className={`${mobileHidden ? 'hidden md:flex' : 'flex'} min-h-0 w-full flex-col border-r border-border-color bg-white md:w-80 md:shrink-0`}
    >
      <div className="grid gap-4 border-b border-border-light p-5">
        <h2 className="m-0 text-xl font-extrabold text-text-main">Tin nhắn</h2>
        <label className="flex h-11 items-center gap-2 rounded-xl bg-surface-subtle px-3 text-text-muted focus-within:ring-2 focus-within:ring-primary/15">
          <span className="sr-only">Tìm kiếm cuộc trò chuyện</span>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm kiếm..."
            aria-label="Tìm kiếm cuộc trò chuyện"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            className="flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-text-muted"
            role="status"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            <strong>Đang tải cuộc trò chuyện...</strong>
          </div>
        ) : error ? (
          <div
            className="flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-text-muted"
            role="alert"
          >
            <MessageCircle aria-hidden="true" />
            <strong>Không thể tải cuộc trò chuyện</strong>
            <p>{error}</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border-color bg-white px-3 py-2 font-semibold text-text-main hover:border-primary hover:text-primary"
              onClick={onRetry}
            >
              <RefreshCw aria-hidden="true" /> Thử lại
            </button>
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-0 border-b border-border-light px-4 py-4 text-left transition-colors ${activeConversationId === conversation.id ? 'border-l-4 border-l-primary bg-primary-light' : 'bg-white hover:bg-surface-subtle'}`}
              onClick={() => onSelectConversation(conversation.id)}
              aria-pressed={activeConversationId === conversation.id}
            >
              <span
                className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-slate-100 font-bold text-text-secondary"
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
              <span className="grid min-w-0 gap-1 [&_small]:truncate [&_small]:text-xs [&_small]:text-text-muted [&_strong]:truncate [&_strong]:text-sm [&_strong]:text-text-main">
                <strong>{conversation.otherUserName || 'Cuộc trò chuyện'}</strong>
                <small>{conversation.lastMessageContent || 'Chưa có tin nhắn'}</small>
              </span>
              <span className="grid justify-items-end gap-2 text-[11px] text-text-muted">
                <time dateTime={conversation.lastMessageAt || undefined}>
                  {formatConversationTime(conversation.lastMessageAt)}
                </time>
                {conversation.unreadCount > 0 && (
                  <span
                    className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
                    aria-label={`${conversation.unreadCount} tin nhắn chưa đọc`}
                  >
                    {conversation.unreadCount}
                  </span>
                )}
              </span>
            </button>
          ))
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-text-muted">
            <MessageCircle aria-hidden="true" />
            <strong>Chưa có cuộc trò chuyện nào.</strong>
            <p>Tin nhắn với Mentor hoặc Mentee sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
