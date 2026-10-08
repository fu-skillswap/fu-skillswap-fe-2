/**
 * @file AiFeatureDetailView.tsx
 * @description Chi tiết một tính năng AI: trạng thái, số liệu hôm nay, cách hoạt động, cài đặt
 * và đánh giá của người dùng. Nội dung từng tính năng lấy từ `AI_FEATURE_DETAILS`.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import {
  AI_FEATURE_DETAILS,
  AI_FEATURE_GROUPS,
  type AiFeatureGroupKey,
} from '@/constants/aiFeatures';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './AiFeatureDetailView.module.css';
import { findFeatureConfig, getFeatureStatus } from './aiFeatureStatus';
import { FEATURE_COPY } from './aiOverview.constants';
import { AiStatusBadge } from './components/AiStatusBadge';
import { DetailStatStrip } from './components/detail/DetailStatStrip';
import { PipelineSteps } from './components/detail/PipelineSteps';
import { RecentFeedbackCard } from './components/detail/RecentFeedbackCard';
import { SettingsCard } from './components/detail/SettingsCard';
import { ToolUsageCard } from './components/detail/ToolUsageCard';
import { useAiFeatureDetail } from './useAiFeatureDetail';

export function AiFeatureDetailView({ featureKey }: { featureKey: AiFeatureGroupKey }) {
  const { locale } = useParams<{ locale: string }>();
  const adminRoot = `/${locale}/admin`;
  const group = AI_FEATURE_GROUPS.find((item) => item.key === featureKey)!;
  const detail = AI_FEATURE_DETAILS[featureKey];
  const copy = FEATURE_COPY[featureKey];
  const Icon = copy.icon;
  const data = useAiFeatureDetail(detail);
  const config =
    data.features.status === 'ready'
      ? findFeatureConfig(featureKey, data.features.data)
      : undefined;
  const status = getFeatureStatus(config);
  const isStopped = status === 'off' || status === 'paused';

  return (
    <main className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <Link href={`${adminRoot}/ai`}>Tổng quan AI</Link> <span>›</span>{' '}
          <b>{group.label}</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-page-content">
        <Link className={styles.backLink} href={`${adminRoot}/ai`}>
          <ArrowLeft aria-hidden="true" /> Tổng quan AI
        </Link>

        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">
            <Icon />
          </span>
          <div className={styles.headerText}>
            <div className={styles.titleRow}>
              <h1>{group.label}</h1>
              <AiStatusBadge status={status} />
            </div>
            <p>{detail.description}</p>
            {isStopped && (
              <p className={styles.stoppedNote}>
                {status === 'paused'
                  ? (config?.pausedReason ?? 'Tạm hoãn')
                  : `Chưa bật trên server AI${copy.enableHint ? `. ${copy.enableHint}.` : '.'}`}
              </p>
            )}
          </div>
          <button
            type="button"
            className={`admin-button ${styles.refresh}`}
            onClick={() => void data.reload()}
          >
            <RefreshCw aria-hidden="true" /> Làm mới
          </button>
        </header>

        <div className={styles.stack}>
          <DetailStatStrip
            group={group}
            stats={detail.stats}
            perUnit={copy.perUnit}
            budget={data.budget}
            usage={data.usage}
            feedbackSummary={data.feedbackSummary}
          />
          <PipelineSteps title={detail.pipelineTitle} steps={detail.steps} />
          <div className={styles.twoColumns}>
            {detail.showToolUsage && <ToolUsageCard />}
            <SettingsCard
              config={config}
              features={data.features}
              defaults={detail.defaultSettings}
            />
          </div>
          {detail.feedbackFeature && (
            <RecentFeedbackCard
              feedback={data.recentFeedback}
              onlyUnhelpful={data.onlyUnhelpful}
              onToggleUnhelpful={() => data.setOnlyUnhelpful((current) => !current)}
              onRetry={() => void data.reloadRecentFeedback()}
              knowledgeHref={`${adminRoot}/ai-knowledge`}
            />
          )}
        </div>
      </div>
    </main>
  );
}
