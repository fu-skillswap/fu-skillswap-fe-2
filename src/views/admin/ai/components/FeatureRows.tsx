/**
 * @file FeatureRows.tsx
 * @description Thẻ "Các tính năng AI": mỗi tính năng một hàng với trạng thái, việc đã làm hôm nay
 * và chi phí.
 */

import {
  AI_FEATURE_GROUPS,
  getUnitCount,
  groupSpendByFeature,
  type AiFeatureGroupKey,
} from '@/constants/aiFeatures';
import type { AiBudget, AiFeatureConfig, AiUsage } from '@/models/ai';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import styles from '../AiOverviewView.module.css';
import {
  FEATURE_COPY,
  FEATURE_ROW_KEYS,
  formatCount,
  formatUnitVnd,
  formatVnd,
} from '../aiOverview.constants';
import { findFeatureConfig, getFeatureStatus, type AiFeatureStatus } from '../aiFeatureStatus';
import type { Section } from '../useAiOverview';
import { AiStatusBadge } from './AiStatusBadge';

export function FeatureRows({
  budget,
  usage,
  features,
  hrefFor,
}: {
  budget: Section<AiBudget>;
  usage: Section<AiUsage>;
  features: Section<AiFeatureConfig[]>;
  hrefFor: (key: AiFeatureGroupKey) => string;
}) {
  const configs = features.status === 'ready' ? features.data : [];
  const costs =
    budget.status === 'ready' ? groupSpendByFeature(budget.data.byFeature).groups : undefined;
  const rows = FEATURE_ROW_KEYS.map((key) => {
    const group = AI_FEATURE_GROUPS.find((item) => item.key === key)!;
    const config = findFeatureConfig(group.key, configs);
    return { group, config, status: getFeatureStatus(config) };
  });

  const counts = rows.reduce<Record<AiFeatureStatus, number>>(
    (total, row) => ({ ...total, [row.status]: total[row.status] + 1 }),
    { running: 0, off: 0, paused: 0, unknown: 0 },
  );

  const summary =
    features.status === 'ready' ? (
      [`${counts.running} đang chạy`, `${counts.off} đang tắt`, `${counts.paused} tạm hoãn`].join(
        ' · ',
      )
    ) : features.status === 'loading' ? (
      'Đang tải…'
    ) : (
      // TODO(api): GET /v1/ops/features — statuses, models and limits per feature.
      <span className={styles.muted}>
        {features.status === 'missing'
          ? 'Cần API /v1/ops/features để biết trạng thái'
          : 'Không tải được trạng thái'}
      </span>
    );

  return (
    <section className={styles.card} aria-labelledby="ai-features-title">
      <header className={styles.cardHeader}>
        <h2 id="ai-features-title" className="admin-card-title">
          Các tính năng AI
        </h2>
        <span className={styles.cardMeta}>{summary}</span>
      </header>
      <div className={styles.featureHead} aria-hidden="true">
        <span>Tính năng</span>
        <span>Trạng thái</span>
        <span>Hôm nay đã làm</span>
        <span>Chi phí</span>
        <span />
      </div>
      <ul className={styles.featureList}>
        {rows.map(({ group, config, status }) => {
          const copy = FEATURE_COPY[group.key];
          const Icon = copy.icon;
          const cost = costs?.find((item) => item.group.key === group.key)?.costVnd ?? 0;
          const units =
            usage.status === 'ready' ? getUnitCount(group, usage.data.today) : undefined;
          const isStopped = status === 'off' || status === 'paused';

          let work: { main: string; sub?: string; muted?: boolean };
          if (isStopped) {
            work = {
              main:
                status === 'paused'
                  ? (config?.pausedReason ?? 'Tạm hoãn')
                  : 'Chưa bật trên server AI',
              sub: copy.enableHint,
              muted: true,
            };
          } else if (usage.status === 'loading') {
            work = { main: 'Đang tải…', muted: true };
          } else if (usage.status === 'ready') {
            work =
              units === undefined
                ? { main: 'Không đếm theo lượt', muted: true }
                : { main: `${formatCount(units)} ${group.unit}` };
            // TODO(api): secondary lines — "% được đánh giá hữu ích" (feedback), "x gắn cờ · y bị
            // chặn" (moderation stats), "x lượt lấy lại từ bộ nhớ" (recommendation cache hits).
          } else {
            work = {
              main: '—',
              sub: usage.status === 'missing' ? 'Cần API /v1/ops/usage' : 'Không tải được số liệu',
              muted: true,
            };
          }

          return (
            <li key={group.key} className={styles.featureRow}>
              <div className={styles.featureName}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span>
                  {/* The name link covers the whole row (see .rowLink::after). */}
                  <Link href={hrefFor(group.key)} className={styles.rowLink}>
                    {group.label}
                  </Link>
                  <small>{copy.description}</small>
                </span>
              </div>
              <div>
                <span className="sr-only">Trạng thái: </span>
                <AiStatusBadge status={status} />
              </div>
              <div className={styles.featureWork}>
                <span className="sr-only">Hôm nay đã làm: </span>
                <span className={work.muted ? styles.muted : undefined}>{work.main}</span>
                {work.sub && <small>{work.sub}</small>}
              </div>
              <div className={styles.featureCost}>
                <span className="sr-only">Chi phí: </span>
                <strong>{budget.status === 'ready' ? formatVnd(cost) : '—'}</strong>
                {units !== undefined && units > 0 && copy.perUnit && (
                  <small>
                    ≈ {formatUnitVnd(cost / units)} / {copy.perUnit}
                  </small>
                )}
              </div>
              <span className={styles.featureChevron} aria-hidden="true">
                <ChevronRight />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
