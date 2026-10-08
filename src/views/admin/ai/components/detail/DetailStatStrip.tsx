/**
 * @file DetailStatStrip.tsx
 * @description Dải số liệu dưới tiêu đề trang chi tiết tính năng AI.
 */

import {
  getUnitCount,
  groupSpendByFeature,
  type AiDetailStat,
  type AiFeatureGroup,
} from '@/constants/aiFeatures';
import type { AiBudget, AiUsage } from '@/models/ai';
import styles from '../../AiFeatureDetailView.module.css';
import { formatCount, formatUnitVnd, formatVnd } from '../../aiOverview.constants';
import type { FeedbackSummary } from '../../useAiFeatureDetail';
import type { Section } from '../../useAiOverview';

type Stat = { label: string; value: string; sub?: string; muted?: boolean };

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('vi-VN') + value.slice(1);
}

export function DetailStatStrip({
  group,
  stats,
  perUnit,
  budget,
  usage,
  feedbackSummary,
}: {
  group: AiFeatureGroup;
  stats: AiDetailStat[];
  perUnit?: string;
  budget: Section<AiBudget>;
  usage: Section<AiUsage>;
  feedbackSummary: Section<FeedbackSummary>;
}) {
  const units =
    usage.status === 'ready'
      ? (getUnitCount(group, usage.data.today) ??
        usage.data.today
          .filter((row) => group.ledgerKeys.includes(row.feature))
          .reduce((sum, row) => sum + row.calls, 0))
      : undefined;
  const cost =
    budget.status === 'ready'
      ? (groupSpendByFeature(budget.data.byFeature).groups.find(
          (item) => item.group.key === group.key,
        )?.costVnd ?? 0)
      : undefined;

  const pending = (section: Section<unknown>, api: string): Stat['sub'] =>
    section.status === 'loading'
      ? 'Đang tải…'
      : section.status === 'missing'
        ? `Cần API ${api}`
        : 'Không tải được';

  const build = (stat: AiDetailStat): Stat => {
    switch (stat) {
      case 'units':
        // TODO(api): number of distinct students per feature in /v1/ops/usage.
        return {
          label: group.unit ? `${capitalize(group.unit)} hôm nay` : 'Lượt gọi AI hôm nay',
          value: units === undefined ? '—' : formatCount(units),
          sub: units === undefined ? pending(usage, '/v1/ops/usage') : undefined,
          muted: units === undefined,
        };
      case 'cost':
        return {
          label: 'Chi phí hôm nay',
          value: cost === undefined ? '—' : formatVnd(cost),
          sub:
            cost === undefined
              ? pending(budget, '/v1/ops/budget')
              : units && perUnit
                ? `≈ ${formatUnitVnd(cost / units)} / ${perUnit}`
                : undefined,
          muted: cost === undefined,
        };
      case 'feedback': {
        if (feedbackSummary.status !== 'ready') {
          return {
            label: 'Được đánh giá hữu ích',
            value: '—',
            sub: pending(feedbackSummary, '/v1/ops/feedback'),
            muted: true,
          };
        }
        const { total, unhelpful } = feedbackSummary.data;
        return total
          ? {
              label: 'Được đánh giá hữu ích',
              value: `${Math.round(((total - unhelpful) / total) * 100)}%`,
              sub: `trên ${formatCount(total)} đánh giá`,
            }
          : { label: 'Được đánh giá hữu ích', value: '—', sub: 'Chưa có đánh giá', muted: true };
      }
      case 'rateLimited':
        // TODO(api): count of 429 RATE_LIMITED responses per day in /v1/ops/usage.
        return {
          label: 'Bị chặn vì hỏi quá nhiều',
          value: '—',
          sub: 'Cần số lượt bị chặn từ /v1/ops/usage',
          muted: true,
        };
    }
  };

  return (
    <dl className={styles.statStrip}>
      {stats.map((stat) => {
        const item = build(stat);
        return (
          <div key={stat}>
            <dt>{item.label}</dt>
            <dd className={item.muted ? styles.muted : undefined}>{item.value}</dd>
            {item.sub && <dd className={styles.statSub}>{item.sub}</dd>}
          </div>
        );
      })}
    </dl>
  );
}
