/**
 * @file RevenueSummaryPanel.tsx
 * @description Thẻ tóm tắt doanh thu trên trang Tổng quan quản trị; dùng khối `financial`
 * đã có trong `GET /api/admin/dashboard/overview` nên không gọi thêm API.
 */

'use client';

import type { AdminDashboardFinancialOverview } from '@/models/admin';
import { ArrowRight, Coins, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  REVENUE_PERIODS,
  formatCount,
  formatPercent,
  formatScoinAsVnd,
  getTakeRate,
  type RevenuePeriod,
} from './revenue.helpers';

type RevenueSummaryPanelProps = {
  locale: string;
  financial?: AdminDashboardFinancialOverview | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

export function RevenueSummaryPanel({
  locale,
  financial,
  loading,
  failed,
  onRetry,
}: RevenueSummaryPanelProps) {
  const [period, setPeriod] = useState<RevenuePeriod>('thisMonth');
  const periodMeta = REVENUE_PERIODS.find((item) => item.value === period) ?? REVENUE_PERIODS[0];
  const metrics = financial?.[period];
  const pending = loading && !financial;

  return (
    <section className="admin-panel admin-revenue-summary" aria-labelledby="revenue-summary-title">
      <header className="admin-panel-heading">
        <h2 id="revenue-summary-title" className="admin-card-title">
          Doanh thu nền tảng
        </h2>
        <Link href={`/${locale}/admin/revenue`}>
          Xem chi tiết <ArrowRight aria-hidden="true" />
        </Link>
      </header>

      {failed && !financial ? (
        <div className="admin-revenue-summary-empty" role="alert">
          <p>Chưa tải được số liệu doanh thu.</p>
          <button type="button" className="admin-button secondary" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="admin-revenue-segment" role="radiogroup" aria-label="Chọn kỳ xem">
            {REVENUE_PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={period === item.value}
                className={period === item.value ? 'is-active' : ''}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="admin-revenue-summary-hero" aria-busy={pending}>
            <i>
              <Coins aria-hidden="true" />
            </i>
            <div>
              <span>Doanh thu {periodMeta.noun}</span>
              <strong>{pending ? '…' : formatScoinAsVnd(metrics?.platformFeeScoin)}</strong>
            </div>
          </div>

          <dl className="admin-revenue-summary-list">
            <div>
              <dt>Tổng giá trị giao dịch</dt>
              <dd>{pending ? '…' : formatScoinAsVnd(metrics?.gmvScoin)}</dd>
            </div>
            <div>
              <dt>Giao dịch thành công</dt>
              <dd>{pending ? '…' : formatCount(metrics?.totalTransactions)}</dd>
            </div>
            <div>
              <dt>Tỷ lệ phí nền tảng</dt>
              <dd>{pending ? '…' : formatPercent(getTakeRate(metrics))}</dd>
            </div>
          </dl>
          <p className="admin-revenue-summary-foot">
            Doanh thu là phần phí SkillSwap giữ lại; phần còn lại thuộc về mentor.
          </p>
        </>
      )}
    </section>
  );
}
