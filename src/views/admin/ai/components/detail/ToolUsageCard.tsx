/**
 * @file ToolUsageCard.tsx
 * @description "Hôm nay KouKou đã dùng dữ liệu gì": tỷ lệ câu trả lời dùng từng nguồn dữ liệu.
 */

import styles from '../../AiFeatureDetailView.module.css';
import { formatCount } from '../../aiOverview.constants';

/** Answers that used each data source today; one answer can use several. */
export interface ChatToolUsage {
  answers: number;
  knowledgeBase: number;
  searchMentors: number;
  myBookings: number;
  none: number;
}

const rows: Array<[keyof Omit<ChatToolUsage, 'answers'>, string]> = [
  ['knowledgeBase', 'Tra kho tri thức'],
  ['searchMentors', 'Tìm mentor'],
  ['myBookings', 'Xem lịch'],
  ['none', 'Không cần thêm'],
];

/**
 * TODO(api): tool counts are not in GET /v1/ops/usage yet. Expected addition:
 *   chat_tools: { answers, knowledge_base, search_mentors, my_bookings, none }
 * (ai-skillswap already records `tools_used` per answer in services/chat.py).
 */
export function ToolUsageCard({ usage }: { usage?: ChatToolUsage }) {
  return (
    <section className={styles.card} aria-labelledby="ai-tools-title">
      <header className={styles.cardHeader}>
        <h2 id="ai-tools-title" className="admin-card-title">
          Hôm nay KouKou đã dùng dữ liệu gì
        </h2>
        <span className={styles.cardMeta}>
          Một câu có thể dùng nhiều nguồn, nên tổng có thể quá 100%
        </span>
      </header>
      {usage && usage.answers > 0 ? (
        <ul className={styles.toolBars}>
          {rows.map(([key, label]) => {
            const percent = Math.round((usage[key] / usage.answers) * 100);
            return (
              <li key={key}>
                <span className={styles.toolLabel}>{label}</span>
                <span
                  className={styles.toolTrack}
                  role="img"
                  aria-label={`${label}: ${percent}% câu trả lời (${formatCount(usage[key])} câu)`}
                >
                  <span style={{ width: `${Math.min(percent, 100)}%` }} />
                </span>
                <span className={styles.toolValue}>
                  {percent}% <small>({formatCount(usage[key])} câu)</small>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.emptyNote}>
          {usage
            ? 'Hôm nay KouKou chưa trả lời câu nào.'
            : 'Chưa có dữ liệu. Cần số lượt dùng từng nguồn dữ liệu trong API /v1/ops/usage từ dịch vụ AI.'}
        </p>
      )}
    </section>
  );
}
