/**
 * @file ReviewTimeline.tsx
 * @description Thẻ "Lịch sử xử lý" dạng dòng thời gian, mới nhất ở trên.
 */

import type { MentorVerificationTimelineItem } from '@/models/admin';
import styles from '../MentorVerificationDetailView.module.css';
import { describeTimelineEvent, formatDateTime } from '../mentorVerificationDetail.constants';

export function ReviewTimeline({ events }: { events: MentorVerificationTimelineItem[] }) {
  const sorted = [...events].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );

  return (
    <section className={styles.card}>
      <h2 className="admin-card-title">Lịch sử xử lý</h2>
      {sorted.length ? (
        <ol className={styles.timeline}>
          {sorted.map((event) => (
            <li key={event.id}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <p>
                {describeTimelineEvent(event)}
                {event.note && <q className={styles.timelineNote}>{event.note}</q>}
              </p>
              <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.muted}>Chưa có lịch sử xử lý.</p>
      )}
    </section>
  );
}
