/**
 * @file KouKouChatInput.tsx
 * @description Ô nhập tin nhắn có giới hạn chiều cao cho trợ lý KouKou.
 */

import { Send, Square } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { IconButton } from '@/components/ui/IconButton';

type KouKouChatInputProps = {
  value: string;
  isOpen: boolean;
  isSending: boolean;
  /** Disables the input (e.g. daily AI budget used up). */
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

export function KouKouChatInput({
  value,
  isOpen,
  isSending,
  disabled = false,
  placeholder = 'Nhập câu hỏi của bạn...',
  onChange,
  onSend,
  onStop,
}: KouKouChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isSending) onSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-border-color bg-white px-3 pt-3 pb-2">
      <div className="flex items-end gap-2">
        <label htmlFor="koukou-chat-input" className="sr-only">
          Nhập câu hỏi cho KouKou
        </label>
        <textarea
          ref={inputRef}
          id="koukou-chat-input"
          rows={1}
          value={value}
          maxLength={1000}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-24 min-h-11 flex-1 resize-none overflow-y-auto rounded-xl border border-border-color bg-surface-subtle px-3.5 py-3 text-xs leading-5 text-text-main outline-none transition-colors placeholder:text-text-disabled focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed"
        />
        {isSending ? (
          <IconButton
            icon={<Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />}
            aria-label="Dừng"
            title="Dừng"
            variant="outline"
            size="lg"
            onClick={onStop}
            className="shrink-0 rounded-xl"
          />
        ) : (
          <IconButton
            icon={<Send className="h-4.5 w-4.5" aria-hidden="true" />}
            aria-label="Gửi câu hỏi"
            variant="primary"
            size="lg"
            disabled={!value.trim() || disabled}
            onClick={onSend}
            className="shrink-0 rounded-xl"
          />
        )}
      </div>
      <p className="m-0 mt-1.5 text-[10.5px] text-text-muted">
        KouKou có thể sai, hãy kiểm tra lại với nguồn được dẫn.
      </p>
    </div>
  );
}
