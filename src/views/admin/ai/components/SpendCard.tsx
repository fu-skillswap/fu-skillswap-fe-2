/**
 * @file SpendCard.tsx
 * @description Thẻ "Chi phí AI hôm nay": số tiền đã dùng, ước tính còn bao nhiêu câu trả lời và
 * thanh chồng theo nhóm tính năng.
 */

import { groupSpendByFeature } from '@/constants/aiFeatures';
import type { AiBudget, AiUsage } from '@/models/ai';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import styles from '../AiOverviewView.module.css';
import {
  FALLBACK_CHAT_COST_PER_ANSWER_VND,
  GROUP_COLORS,
  OTHER_COLOR,
  formatCount,
  formatVnd,
  roundEstimate,
} from '../aiOverview.constants';
import type { Section } from '../useAiOverview';

type Segment = { key: string; label: string; color: string; vnd: number };

function getChatCostPerAnswer(budget: AiBudget, usage: Section<AiUsage>) {
  if (usage.status !== 'ready') return FALLBACK_CHAT_COST_PER_ANSWER_VND;
  const chatCalls = usage.data.today
    .filter((row) => row.feature === 'chat')
    .reduce((sum, row) => sum + row.calls, 0);
  const chatCost = groupSpendByFeature(budget.byFeature).groups.find(
    (item) => item.group.key === 'chatbot',
  )?.costVnd;
  return chatCalls > 0 && chatCost ? chatCost / chatCalls : FALLBACK_CHAT_COST_PER_ANSWER_VND;
}

export function SpendCard({
  budget,
  usage,
  costHref,
  onRetry,
}: {
  budget: Section<AiBudget>;
  usage: Section<AiUsage>;
  costHref: string;
  onRetry: () => void;
}) {
  const sideNote = (
    <aside className={styles.sideNote}>
      <strong>
        Khi chạm trần{' '}
        {budget.status === 'ready' ? formatVnd(budget.data.budgetVnd) : formatVnd(25_000)}
      </strong>
      <p>
        KouKou và bot diễn đàn tạm nghỉ đến 0:00. Kiểm duyệt vẫn cho đăng bài bình thường, chỉ không
        chấm điểm nữa.
      </p>
      <Link href={costHref}>Xem tiền được tính thế nào</Link>
    </aside>
  );

  if (budget.status === 'loading' || budget.status === 'missing') {
    return (
      <section className={`${styles.card} ${styles.spendCard}`} aria-busy="true">
        <div className={styles.spendMain}>
          <span className={styles.eyebrow}>Chi phí AI hôm nay</span>
          <span className={`${styles.skeleton} ${styles.skeletonHero}`} />
          <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
          <span className={`${styles.skeleton} ${styles.skeletonBar}`} />
          <span className="sr-only" role="status">
            Đang tải chi phí AI…
          </span>
        </div>
        {sideNote}
      </section>
    );
  }

  if (budget.status === 'error') {
    return (
      <section className={`${styles.card} ${styles.spendCard}`}>
        <div className={styles.spendMain}>
          <span className={styles.eyebrow}>Chi phí AI hôm nay</span>
          <p className={styles.errorText} role="alert">
            Không tải được chi phí từ dịch vụ AI. {budget.message}
          </p>
          <button type="button" className="admin-button" onClick={onRetry}>
            <RefreshCw aria-hidden="true" /> Thử lại
          </button>
        </div>
        {sideNote}
      </section>
    );
  }

  const { spentVnd, budgetVnd, remainingVnd, byFeature } = budget.data;
  const { groups, otherVnd } = groupSpendByFeature(byFeature);
  const segments: Segment[] = groups.map(({ group, costVnd }) => ({
    key: group.key,
    label: group.label,
    color: GROUP_COLORS[group.key],
    vnd: costVnd,
  }));
  if (otherVnd > 0) {
    segments.push({ key: 'other', label: 'Khác', color: OTHER_COLOR, vnd: otherVnd });
  }
  const answersLeft = roundEstimate(remainingVnd / getChatCostPerAnswer(budget.data, usage));
  const barLabel = [
    `Đã dùng ${formatVnd(spentVnd)} trên ${formatVnd(budgetVnd)}`,
    segments.length
      ? `: ${segments.map((segment) => `${segment.label} ${formatVnd(segment.vnd)}`).join(', ')}`
      : '',
    `; còn lại ${formatVnd(remainingVnd)}.`,
  ].join('');

  return (
    <section className={`${styles.card} ${styles.spendCard}`}>
      <div className={styles.spendMain}>
        <span className={styles.eyebrow}>Chi phí AI hôm nay</span>
        <p className={styles.hero}>
          <strong>{formatVnd(spentVnd)}</strong> <span>trên trần {formatVnd(budgetVnd)}</span>
        </p>
        <p className={styles.spendSentence}>
          {remainingVnd > 0 ? (
            <>
              Còn <b>{formatVnd(remainingVnd)}</b>, đủ cho khoảng{' '}
              <b>{formatCount(answersLeft)} câu trả lời chatbot</b> nữa trước 0:00.
            </>
          ) : (
            <>Đã chạm trần hôm nay. KouKou và bot diễn đàn tạm nghỉ đến 0:00.</>
          )}
        </p>
        <div className={styles.stackBar} role="img" aria-label={barLabel}>
          {segments.map((segment) =>
            segment.vnd > 0 ? (
              <span
                key={segment.key}
                title={`${segment.label}: ${formatVnd(segment.vnd)}`}
                style={{ flex: `${segment.vnd} 1 0`, background: segment.color }}
              />
            ) : null,
          )}
          {remainingVnd > 0 && (
            <span
              className={styles.stackRemaining}
              title={`Còn lại: ${formatVnd(remainingVnd)}`}
              style={{ flex: `${remainingVnd} 1 0` }}
            />
          )}
        </div>
        <ul className={styles.legend}>
          {segments.map((segment) => (
            <li key={segment.key}>
              <span className={styles.swatch} style={{ background: segment.color }} />
              {segment.label} <b>{formatVnd(segment.vnd)}</b>
            </li>
          ))}
          <li>
            <span className={`${styles.swatch} ${styles.swatchRemaining}`} />
            Còn lại <b>{formatVnd(remainingVnd)}</b>
          </li>
        </ul>
      </div>
      {sideNote}
    </section>
  );
}
