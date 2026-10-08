/**
 * @file AiOverviewView.tsx
 * @description Tổng quan AI: chi phí hôm nay, trạng thái từng tính năng và các giới hạn chi phí.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import styles from './AiOverviewView.module.css';
import { FeatureRows } from './components/FeatureRows';
import { GuardrailsCard } from './components/GuardrailsCard';
import { LinkCards } from './components/LinkCards';
import { SpendCard } from './components/SpendCard';
import { useAiOverview } from './useAiOverview';

export function AiOverviewView() {
  const { locale } = useParams<{ locale: string }>();
  const adminRoot = `/${locale}/admin`;
  const { budget, usage, features, knowledge, reload } = useAiOverview();
  const isLoading = [budget, usage, features, knowledge].some(
    (section) => section.status === 'loading',
  );

  return (
    <main className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> Trợ lý AI <span>›</span> <b>Tổng quan AI</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-page-content">
        <section className="admin-page-heading">
          <div>
            <h1>Tổng quan AI</h1>
            <p>
              AI đang làm những việc gì cho SkillSwap và tốn bao nhiêu tiền. Số liệu tính từ 0:00
              hôm nay.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="admin-button"
              disabled={isLoading}
              onClick={() => void reload()}
            >
              <RefreshCw aria-hidden="true" /> Làm mới
            </button>
          </div>
        </section>

        <div className={styles.stack}>
          <SpendCard
            budget={budget}
            usage={usage}
            costHref={`${adminRoot}/ai/cost`}
            onRetry={() => void reload()}
          />
          <FeatureRows
            budget={budget}
            usage={usage}
            features={features}
            hrefFor={(key) => `${adminRoot}/ai/features/${key}`}
          />
          <div className={styles.bottomGrid}>
            <GuardrailsCard budget={budget} features={features} />
            <LinkCards
              knowledge={knowledge}
              knowledgeHref={`${adminRoot}/ai-knowledge`}
              flaggedHref={`${adminRoot}/reports?source=ai`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
