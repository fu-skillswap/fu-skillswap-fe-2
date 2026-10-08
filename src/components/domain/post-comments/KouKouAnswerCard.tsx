/**
 * @file KouKouAnswerCard.tsx
 * @description Thẻ câu trả lời tự động của KouKou (bot diễn đàn) trên một bài viết: nội dung,
 * góp ý Hữu ích / Chưa đúng và lối tắt tìm mentor.
 */

'use client';

import { ForumReportModal } from '@/components/domain/post-card/ForumReportModal';
import { Button } from '@/components/ui/Button';
import type { Comment } from '@/models/entities';
import { useAuth } from '@/providers/AuthProvider';
import { aiRepo } from '@/repositories/aiRepo';
import { showError, showSuccess } from '@/utils/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { stripBotFooter } from './koukouComment';

const chipBase =
  'h-9 shrink-0 rounded-[11px] border border-solid px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed';
const chipIdle =
  'border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary disabled:opacity-60 disabled:hover:border-border-light disabled:hover:text-text-secondary';
const chipActive = 'border-primary bg-primary text-white';

export function KouKouAnswerCard({ comment, locale }: { comment: Comment; locale: string }) {
  const router = useRouter();
  const { isAuthenticated, showAuthRequiredModal } = useAuth();
  const [rating, setRating] = useState<1 | -1>();
  const [isSending, setIsSending] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const content = stripBotFooter(comment.content);

  const sendRating = async (value: 1 | -1) => {
    if (!isAuthenticated) {
      showAuthRequiredModal('Bạn cần đăng nhập để góp ý cho câu trả lời của KouKou.');
      return;
    }
    setIsSending(true);
    setRating(value);
    try {
      await aiRepo.sendFeedback({
        feature: 'forum_answer',
        rating: value,
        messageExcerpt: content.slice(0, 500),
      });
      showSuccess('Cảm ơn bạn đã góp ý');
    } catch (reason) {
      setRating(undefined);
      showError(reason, { title: 'Chưa gửi được góp ý' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section
      className="rounded-[18px] border border-solid border-primary-border/60 bg-white p-5 shadow-[0_3px_12px_rgba(16,50,90,0.035)]"
      aria-label="Câu trả lời tự động của KouKou AI"
    >
      <header className="flex items-center gap-3">
        <img src="/images/Koko.png" alt="" className="h-10 w-9 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-sm font-bold text-text-main">KouKou AI</h2>
            <span className="rounded-md bg-primary-light px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary">
              TỰ ĐỘNG
            </span>
          </div>
          <p className="m-0 text-[11px] text-text-muted">
            Gợi ý ban đầu trong lúc chờ mentor và các bạn trả lời
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="shrink-0 border-none bg-transparent p-0 text-xs font-bold text-text-muted hover:text-text-main"
        >
          Báo cáo
        </button>
      </header>

      {/* Plain text only: React escapes it; line breaks are kept with whitespace-pre-line. */}
      <p className="mb-0 mt-4 whitespace-pre-line break-words rounded-2xl rounded-tl-md border border-solid border-primary-border/40 bg-primary-light px-4 py-3.5 text-sm leading-7 text-text-secondary">
        {content}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-subtle px-3 py-2.5">
        <span className="text-sm font-bold text-text-main">Cần người kèm 1:1?</span>
        {/* TODO(api): structured mentor suggestions from the bot comment (it only names mentors
            inline today), so this links to the mentor list. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/mentor-booking`)}
        >
          Tìm mentor phù hợp
        </Button>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-text-muted">Câu trả lời tự động, có thể chưa chính xác.</span>
        <div className="flex gap-2" role="group" aria-label="Góp ý cho câu trả lời">
          {(
            [
              [1, 'Hữu ích'],
              [-1, 'Chưa đúng'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              disabled={rating !== undefined || isSending}
              onClick={() => void sendRating(value)}
              className={`${chipBase} ${rating === value ? chipActive : chipIdle}`}
            >
              {label}
            </button>
          ))}
        </div>
      </footer>

      {isReportOpen && (
        <ForumReportModal
          open
          targetId={comment.id}
          targetType="COMMENT"
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </section>
  );
}
