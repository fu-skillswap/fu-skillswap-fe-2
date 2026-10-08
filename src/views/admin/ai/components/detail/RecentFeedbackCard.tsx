/**
 * @file RecentFeedbackCard.tsx
 * @description "Đánh giá gần đây": các lượt 👍/👎 của người dùng cho một tính năng AI.
 */

import { adminListStyles as list } from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import type { AiFeedbackList } from '@/models/ai';
import Link from 'next/link';
import styles from '../../AiFeatureDetailView.module.css';
import type { Section } from '../../useAiOverview';

const COLUMN_COUNT = 4;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
  return `${time}, ${day}`;
}

export function RecentFeedbackCard({
  feedback,
  onlyUnhelpful,
  onToggleUnhelpful,
  onRetry,
  knowledgeHref,
}: {
  feedback: Section<AiFeedbackList>;
  onlyUnhelpful: boolean;
  onToggleUnhelpful: () => void;
  onRetry: () => void;
  knowledgeHref: string;
}) {
  return (
    <section className={`${styles.card} ${styles.flushCard}`} aria-labelledby="ai-feedback-title">
      <header className={`${styles.cardHeader} ${styles.flushHeader}`}>
        <h2 id="ai-feedback-title" className="admin-card-title">
          Đánh giá gần đây
        </h2>
        <button
          type="button"
          className={styles.textButton}
          aria-pressed={onlyUnhelpful}
          onClick={onToggleUnhelpful}
        >
          {onlyUnhelpful ? 'Xem tất cả đánh giá' : 'Chỉ xem chưa hữu ích'}
        </button>
      </header>
      <div className={list.tableScroll}>
        <table className={`${list.table} ${styles.feedbackTable}`}>
          <thead>
            <tr>
              <th>Đánh giá</th>
              <th>Nội dung</th>
              <th>Thời gian</th>
              <th>Phiên bản prompt</th>
            </tr>
          </thead>
          <tbody>
            {feedback.status === 'loading' ? (
              <AdminTableState
                variant="loading"
                colSpan={COLUMN_COUNT}
                skeletonRows={3}
                title="Đang tải đánh giá…"
              />
            ) : feedback.status === 'missing' ? (
              <AdminTableState
                variant="empty"
                colSpan={COLUMN_COUNT}
                title="Chưa có dữ liệu"
                description="Cần API /v1/ops/feedback từ dịch vụ AI."
              />
            ) : feedback.status === 'error' ? (
              <AdminTableState variant="error" colSpan={COLUMN_COUNT} onRetry={onRetry} />
            ) : feedback.data.items.length ? (
              feedback.data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span
                      className={`${styles.ratingBadge} ${
                        item.rating === 1 ? styles.helpful : styles.unhelpful
                      }`}
                    >
                      {item.rating === 1 ? 'Hữu ích' : 'Chưa hữu ích'}
                    </span>
                  </td>
                  <td>
                    {item.messageExcerpt ? (
                      <p className={styles.excerpt}>{item.messageExcerpt}</p>
                    ) : (
                      <span className={list.muted}>Không có trích đoạn</span>
                    )}
                  </td>
                  <td className={list.date}>{formatDateTime(item.createdAt)}</td>
                  <td>
                    {item.promptVersion ? (
                      <span className={styles.modelChip}>{item.promptVersion}</span>
                    ) : (
                      <span className={list.muted}>—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <AdminTableState
                variant="empty"
                colSpan={COLUMN_COUNT}
                title={onlyUnhelpful ? 'Không có đánh giá chưa hữu ích' : 'Chưa có đánh giá nào'}
                description="Khi người dùng bấm 👍 hoặc 👎 cho câu trả lời, đánh giá sẽ hiện ở đây."
              />
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.feedbackHint}>
        Câu bị đánh giá chưa hữu ích thường do kho tri thức thiếu tài liệu về chủ đề đó.{' '}
        <Link href={knowledgeHref}>Kiểm tra kho tri thức</Link>
      </p>
    </section>
  );
}
