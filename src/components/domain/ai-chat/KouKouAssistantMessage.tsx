/**
 * @file KouKouAssistantMessage.tsx
 * @description Một câu trả lời của KouKou: trạng thái đang nghĩ, công cụ đã dùng, nguồn, mentor gợi ý,
 * đánh giá và hộp lỗi có nút gửi lại.
 */

import { Check, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import type { ChatMessage } from '@/components/domain/ai-chat/types';
import type { AiMentorItem, AiToolName } from '@/models/ai';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { showError, showSuccess } from '@/utils/toast';

const TOOL_LABELS: Record<AiToolName, string> = {
  knowledge_base: 'Đã tra tài liệu',
  search_mentors: 'Đã tìm mentor',
  my_bookings: 'Đã xem lịch của bạn',
};

const MAX_MENTORS = 3;

type KouKouAssistantMessageProps = {
  message: ChatMessage;
  locale: string;
  canRetry: boolean;
  onRetry: (messageId: string) => void;
  onRate: (messageId: string, rating: 1 | -1) => void;
};

export function KouKouAssistantMessage({
  message,
  locale,
  canRetry,
  onRetry,
  onRate,
}: KouKouAssistantMessageProps) {
  const { status, content } = message;
  const isThinking = status === 'thinking' && !content;
  const isStreaming = status === 'streaming' || (status === 'thinking' && Boolean(content));
  const tools = message.tools ?? [];
  const sources = message.sources ?? [];
  const mentors = (message.mentors ?? []).slice(0, MAX_MENTORS);

  return (
    <div className="mb-3 flex items-start gap-2">
      <img src="/images/Koko.png" alt="" className="h-9 w-8 shrink-0 object-contain" />
      <div className="min-w-0 max-w-[86%] flex-1 space-y-2">
        {tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success"
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                {TOOL_LABELS[tool] ?? tool}
              </span>
            ))}
          </div>
        )}

        {status === 'error' ? (
          <ErrorBox message={message} canRetry={canRetry} onRetry={onRetry} />
        ) : (
          <div className="rounded-2xl rounded-tl-md border border-primary-border/40 bg-primary-light px-3.5 py-3 text-xs leading-5 text-text-secondary">
            {isThinking ? (
              <div className="flex items-center gap-2" role="status">
                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary motion-reduce:animate-none"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
                <span>KouKou đang tìm câu trả lời…</span>
              </div>
            ) : (
              <p className="m-0 whitespace-pre-wrap break-words">
                {content || <span className="italic text-text-muted">Đã dừng trả lời.</span>}
                {isStreaming && (
                  <span
                    className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-text-secondary motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
              </p>
            )}
          </div>
        )}

        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1" aria-label="Nguồn tham khảo">
            {sources.map((source, index) => (
              <span
                key={source.documentId}
                className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-bold text-text-secondary"
              >
                {index + 1} {source.title}
              </span>
            ))}
          </div>
        )}

        {mentors.length > 0 && (
          <div className="space-y-2">
            {mentors.map((mentor) => (
              <MentorRow key={mentor.mentorUserId} mentor={mentor} locale={locale} />
            ))}
          </div>
        )}

        {status === 'done' && content && <FeedbackRow message={message} onRate={onRate} />}
      </div>
    </div>
  );
}

function ErrorBox({
  message,
  canRetry,
  onRetry,
}: {
  message: ChatMessage;
  canRetry: boolean;
  onRetry: (messageId: string) => void;
}) {
  const isRateLimited = message.errorKind === 'rate_limited';
  const title = isRateLimited ? 'KouKou đang nhận quá nhiều câu hỏi' : 'KouKou đang gặp sự cố';
  const body =
    message.errorDetail ||
    (isRateLimited
      ? 'Thử gửi lại sau khoảng 1 phút.'
      : 'Câu hỏi của bạn vẫn được giữ. Hãy thử gửi lại sau ít phút.');

  return (
    <div className="rounded-2xl rounded-tl-md border border-warning/40 bg-warning-soft px-3.5 py-3 text-xs leading-5">
      <p className="m-0 font-bold text-text-main">{title}</p>
      <p className="mb-2.5 mt-1 text-text-secondary">{body}</p>
      <Button size="sm" disabled={!canRetry} onClick={() => onRetry(message.id)}>
        Gửi lại
      </Button>
    </div>
  );
}

function MentorRow({ mentor, locale }: { mentor: AiMentorItem; locale: string }) {
  const initials = mentor.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border-color bg-white p-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-extrabold text-primary">
        {mentor.avatarUrl ? (
          <img src={mentor.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-xs font-bold text-text-main">{mentor.name}</strong>
        {mentor.headline && (
          <small className="block truncate text-[11px] text-text-muted">{mentor.headline}</small>
        )}
      </span>
      {/* TODO(route): the app has no mentor detail URL yet (details open inside mentor-booking);
          link to `/${locale}/mentors/${mentor.mentorUserId}` once that route exists. */}
      <Link
        href={`/${locale}/mentor-booking`}
        className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white no-underline hover:bg-primary-hover"
      >
        Đặt lịch
      </Link>
    </div>
  );
}

function FeedbackRow({
  message,
  onRate,
}: {
  message: ChatMessage;
  onRate: (messageId: string, rating: 1 | -1) => void;
}) {
  const rated = message.rating !== undefined;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      showSuccess('Đã sao chép');
    } catch (error) {
      showError(error);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <IconButton
        icon={<ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />}
        aria-label="Hữu ích"
        title="Hữu ích"
        size="sm"
        aria-pressed={message.rating === 1}
        disabled={rated}
        onClick={() => onRate(message.id, 1)}
        variant={message.rating === 1 ? 'outline' : 'ghost'}
        className={message.rating === 1 ? 'disabled:opacity-100' : ''}
      />
      <IconButton
        icon={<ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />}
        aria-label="Chưa hữu ích"
        title="Chưa hữu ích"
        size="sm"
        aria-pressed={message.rating === -1}
        disabled={rated}
        onClick={() => onRate(message.id, -1)}
        variant={message.rating === -1 ? 'outline' : 'ghost'}
        className={message.rating === -1 ? 'disabled:opacity-100' : ''}
      />
      <IconButton
        icon={<Copy className="h-3.5 w-3.5" aria-hidden="true" />}
        aria-label="Sao chép"
        title="Sao chép"
        size="sm"
        onClick={handleCopy}
      />
    </div>
  );
}
