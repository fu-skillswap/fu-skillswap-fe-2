/**
 * @file CommentComposer.tsx
 * @description Ô nhập bình luận gọn, tự tăng chiều cao và dùng được cho bình luận hoặc trả lời.
 */

'use client';

import { Send } from 'lucide-react';
import type { FormEvent, KeyboardEvent } from 'react';

interface CommentComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  authorName?: string;
  avatarUrl?: string | null;
  placeholder?: string;
  isSubmitting?: boolean;
  error?: string;
  compact?: boolean;
}

export function CommentComposer({
  value,
  onChange,
  onSubmit,
  authorName = 'Bạn',
  avatarUrl,
  placeholder = 'Viết bình luận của bạn…',
  isSubmitting = false,
  error,
  compact = false,
}: CommentComposerProps) {
  const initials = authorName
    .split(' ')
    .map((part) => part[0])
    .slice(-2)
    .join('');

  const resize = (element: HTMLTextAreaElement) => {
    element.style.height = '44px';
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`;
  };

  const handleShortcut = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && value.trim()) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form className="flex items-start gap-2.5" onSubmit={onSubmit} noValidate>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${compact ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs'} flex shrink-0 items-center justify-center rounded-full bg-primary-light font-extrabold text-primary`}
          aria-hidden="true"
        >
          {initials || 'B'}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-end gap-2">
          <textarea
            aria-label={placeholder}
            aria-invalid={Boolean(error)}
            value={value}
            rows={1}
            maxLength={500}
            placeholder={placeholder}
            onChange={(event) => {
              onChange(event.target.value);
              resize(event.target);
            }}
            onFocus={(event) => resize(event.currentTarget)}
            onKeyDown={handleShortcut}
            className="min-h-11 max-h-[132px] min-w-0 flex-1 resize-none overflow-y-auto rounded-[13px] border border-solid border-border-light bg-white px-3.5 py-3 text-sm leading-5 text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="submit"
            disabled={!value.trim() || isSubmitting}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border-none bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4 sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">{isSubmitting ? 'Đang gửi…' : 'Gửi bình luận'}</span>
          </button>
        </div>
        {error && <p className="mb-0 mt-1.5 text-xs font-medium text-danger">{error}</p>}
      </div>
    </form>
  );
}
