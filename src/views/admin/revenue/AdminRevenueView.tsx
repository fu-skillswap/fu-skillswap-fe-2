/**
 * @file AdminRevenueView.tsx
 * @description Màn hình "Doanh thu" cho quản trị viên: doanh thu nền tảng, tổng giá trị giao dịch,
 * tiền đang giữ hộ và xu hướng thanh toán 30 ngày.
 *
 * Data sources (Swagger):
 * - `GET /api/admin/dashboard/overview`   → `financial`, `paymentOrders`, `payoutRequests`, `campaigns`
 * - `GET /api/admin/dashboard/timeseries` → `paymentOrdersPaid` per day (last 30 days)
 * - `GET /api/admin/bookings`             → "Lịch sử giao dịch" (see RevenueTransactionsPanel)
 *
 * TODO(api): a revenue-by-day endpoint (platform fee / GMV per day, custom date range) is needed
 * to chart money instead of the number of paid orders.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type {
  AdminDashboardOverviewResponse,
  AdminDashboardTimeseriesResponse,
  AdminFinancialPeriodMetrics,
} from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import {
  Coins,
  HandCoins,
  Info,
  Landmark,
  Percent,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  REVENUE_PERIODS,
  formatCount,
  formatPercent,
  formatScoinAsVnd,
  formatShortDate,
  formatSnapshotTime,
  formatVnd,
  getAverageOrderValue,
  getPaymentOrderRows,
  getTakeRate,
  type RevenuePeriod,
} from './revenue.helpers';
import { RevenueTransactionsPanel } from './RevenueTransactionsPanel';

type LoadState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

interface KpiCard {
  label: string;
  value: string;
  hint?: string;
  description: string;
  icon: LucideIcon;
  tone: 'blue' | 'green';
}

function buildKpis(metrics: AdminFinancialPeriodMetrics | null | undefined, noun: string) {
  const averageOrder = getAverageOrderValue(metrics);
  const cards: KpiCard[] = [
    {
      label: 'Doanh thu nền tảng',
      value: formatScoinAsVnd(metrics?.platformFeeScoin),
      description: `Phí SkillSwap giữ lại từ các buổi học đã thanh toán ${noun}`,
      icon: Coins,
      tone: 'green',
    },
    {
      label: 'Tổng giá trị giao dịch',
      value: formatScoinAsVnd(metrics?.gmvScoin),
      description: 'Tổng số tiền mentee đã thanh toán, gồm cả phần của mentor',
      icon: ShoppingBag,
      tone: 'blue',
    },
    {
      label: 'Giao dịch thành công',
      value: formatCount(metrics?.totalTransactions),
      hint:
        averageOrder !== undefined
          ? `Trung bình ${formatScoinAsVnd(Math.round(averageOrder))}/giao dịch`
          : undefined,
      description: `Số đơn thanh toán đã hoàn tất ${noun}`,
      icon: Receipt,
      tone: 'blue',
    },
    {
      label: 'Tỷ lệ phí nền tảng',
      value: formatPercent(getTakeRate(metrics)),
      description: 'Phần trăm doanh thu nền tảng trên tổng giá trị giao dịch',
      icon: Percent,
      tone: 'green',
    },
  ];
  return cards;
}

function PaidOrdersChart({ data }: { data: AdminDashboardTimeseriesResponse }) {
  const points = Array.isArray(data.points) ? data.points : [];
  const [activeIndex, setActiveIndex] = useState<number>();
  const values = points.map((point) => Number(point.paymentOrdersPaid) || 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const max = Math.max(1, ...values);
  // Round the axis top up to a "nice" integer so gridlines land on whole orders.
  const axisMax = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const active = activeIndex !== undefined ? points[activeIndex] : undefined;

  if (!points.length) {
    return <p className="admin-empty-state">Chưa có dữ liệu thanh toán trong 30 ngày qua.</p>;
  }

  return (
    <div className="admin-revenue-chart">
      <div className="admin-revenue-chart-summary">
        <strong>{formatCount(total)}</strong>
        <span>
          đơn thanh toán thành công từ {formatShortDate(data.fromDate ?? points[0].date)} đến{' '}
          {formatShortDate(data.toDate ?? points[points.length - 1].date)}
        </span>
      </div>
      <p className="admin-revenue-chart-readout" aria-live="polite">
        {active
          ? `${formatShortDate(active.date)}: ${formatCount(values[activeIndex ?? 0])} đơn đã thanh toán`
          : 'Di chuột hoặc chọn một cột để xem số đơn trong ngày.'}
      </p>
      <div className="admin-revenue-chart-plot" onMouseLeave={() => setActiveIndex(undefined)}>
        <div className="admin-revenue-chart-axis" aria-hidden="true">
          <span>{formatCount(axisMax)}</span>
          <span>{formatCount(axisMax / 2)}</span>
          <span>0</span>
        </div>
        <div
          className="admin-revenue-chart-bars"
          role="group"
          aria-label="Số đơn đã thanh toán theo ngày"
        >
          {points.map((point, index) => {
            const value = values[index];
            const label = `${formatShortDate(point.date)}: ${formatCount(value)} đơn`;
            return (
              <button
                key={point.date}
                type="button"
                className={activeIndex === index ? 'is-active' : ''}
                aria-label={label}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(undefined)}
              >
                <span style={{ height: value ? `${(value / axisMax) * 100}%` : 0 }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="admin-revenue-chart-dates" aria-hidden="true">
        <span>{formatShortDate(points[0].date)}</span>
        <span>{formatShortDate(points[Math.floor(points.length / 2)].date)}</span>
        <span>{formatShortDate(points[points.length - 1].date)}</span>
      </div>
      <details className="admin-revenue-table-toggle">
        <summary>Xem dạng bảng</summary>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Đơn đã thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={point.date}>
                  <td>{formatShortDate(point.date)}</td>
                  <td>{formatCount(values[index])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="admin-analytics-alert" role="alert">
      <p>{message}</p>
      <button type="button" className="admin-button secondary" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Thử lại
      </button>
    </div>
  );
}

export function AdminRevenueView() {
  const [overview, setOverview] = useState<LoadState<AdminDashboardOverviewResponse>>({
    status: 'loading',
  });
  const [timeseries, setTimeseries] = useState<LoadState<AdminDashboardTimeseriesResponse>>({
    status: 'loading',
  });
  const [period, setPeriod] = useState<RevenuePeriod>('thisMonth');

  const loadOverview = useCallback(async () => {
    setOverview({ status: 'loading' });
    try {
      setOverview({ status: 'ready', data: await adminRepo.getOverview() });
    } catch {
      setOverview({ status: 'error' });
    }
  }, []);

  const loadTimeseries = useCallback(async () => {
    setTimeseries({ status: 'loading' });
    try {
      setTimeseries({ status: 'ready', data: await adminRepo.getTimeseries() });
    } catch {
      setTimeseries({ status: 'error' });
    }
  }, []);

  const reloadAll = useCallback(() => {
    void loadOverview();
    void loadTimeseries();
  }, [loadOverview, loadTimeseries]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const data = overview.status === 'ready' ? overview.data : undefined;
  const financial = data?.financial;
  const periodMeta = REVENUE_PERIODS.find((item) => item.value === period) ?? REVENUE_PERIODS[0];
  const kpis = useMemo(
    () => buildKpis(financial?.[period], periodMeta.noun),
    [financial, period, periodMeta.noun],
  );
  const paymentRows = getPaymentOrderRows(data?.paymentOrders);
  const paymentTotal = paymentRows.reduce((sum, row) => sum + row.count, 0);
  const pendingPayouts = Number(data?.payoutRequests?.REQUESTED) || 0;
  const approvedPayouts = Number(data?.payoutRequests?.APPROVED) || 0;
  const campaigns = data?.campaigns;
  const budgetTotal = campaigns?.totalBudgetScoin ?? undefined;
  const budgetUsed = campaigns?.totalBudgetUsedScoin ?? undefined;
  const budgetShare =
    budgetTotal && budgetUsed !== undefined ? Math.min(100, (budgetUsed / budgetTotal) * 100) : 0;
  const snapshotTime = formatSnapshotTime(data?.snapshotAt);
  const isLoading = overview.status === 'loading';

  return (
    <main className="admin-dashboard admin-revenue-page">
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Quản trị <span>›</span> <b>Doanh thu</b>
          </div>
          <AdminTopbarActions />
        </header>

        <div className="admin-page-content">
          <section className="admin-page-heading">
            <div>
              <h1>Doanh thu</h1>
              <p>
                Theo dõi số tiền SkillSwap thu được và dòng tiền thanh toán trên nền tảng.
                {snapshotTime ? ` Cập nhật lúc ${snapshotTime}.` : ''}
              </p>
            </div>
            <div>
              <button
                type="button"
                className="admin-button secondary"
                onClick={reloadAll}
                disabled={isLoading}
              >
                <RefreshCw aria-hidden="true" />
                {isLoading ? 'Đang tải…' : 'Tải lại'}
              </button>
            </div>
          </section>

          {overview.status === 'error' ? (
            <SectionError
              message="Chưa tải được số liệu doanh thu. Dữ liệu không bị thay đổi, bạn có thể thử lại."
              onRetry={() => void loadOverview()}
            />
          ) : (
            <section aria-labelledby="revenue-kpi-heading" className="admin-analytics-section">
              <div className="admin-revenue-section-head">
                <h2 id="revenue-kpi-heading" className="admin-analytics-section-title">
                  Kết quả {periodMeta.noun}
                </h2>
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
              </div>

              {overview.status === 'ready' && !financial ? (
                <p className="admin-analytics-alert">
                  Hệ thống chưa trả về số liệu tài chính. Số liệu sẽ hiện ở đây khi có giao dịch.
                </p>
              ) : (
                <div className="admin-metric-grid" aria-busy={isLoading}>
                  {kpis.map(({ label, value, hint, description, icon: Icon, tone }) => (
                    <article key={label} className={`is-${tone}`}>
                      <i>
                        <Icon aria-hidden="true" />
                      </i>
                      <div>
                        <span>{label}</span>
                        {isLoading ? (
                          <strong className="admin-analytics-metric-loading">
                            <span className="admin-skeleton" />
                            <span className="sr-only">Đang tải</span>
                          </strong>
                        ) : (
                          <strong className="admin-revenue-value">{value}</strong>
                        )}
                        {!isLoading && hint && <em className="admin-revenue-hint">{hint}</em>}
                      </div>
                      <p>{description}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="admin-dashboard-columns">
            <section className="admin-panel" aria-labelledby="revenue-trend-heading">
              <header className="admin-panel-heading">
                <h2 id="revenue-trend-heading" className="admin-card-title">
                  Đơn thanh toán 30 ngày qua
                </h2>
              </header>
              {timeseries.status === 'loading' ? (
                <div className="admin-revenue-chart-loading" role="status">
                  <span className="admin-skeleton is-tall" />
                  <span className="sr-only">Đang tải biểu đồ…</span>
                </div>
              ) : timeseries.status === 'error' ? (
                <SectionError
                  message="Chưa tải được biểu đồ thanh toán."
                  onRetry={() => void loadTimeseries()}
                />
              ) : (
                <PaidOrdersChart data={timeseries.data} />
              )}
            </section>

            <section className="admin-panel" aria-labelledby="revenue-compare-heading">
              <header className="admin-panel-heading">
                <h2 id="revenue-compare-heading" className="admin-card-title">
                  So sánh theo kỳ
                </h2>
              </header>
              <div className="admin-table-wrap">
                <table className="admin-revenue-compare">
                  <thead>
                    <tr>
                      <th>Kỳ</th>
                      <th>Doanh thu</th>
                      <th>Giao dịch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REVENUE_PERIODS.map((item) => {
                      const metrics = financial?.[item.value];
                      return (
                        <tr
                          key={item.value}
                          className={period === item.value ? 'is-selected' : undefined}
                        >
                          <th scope="row">{item.label}</th>
                          <td>
                            {isLoading ? '…' : formatScoinAsVnd(metrics?.platformFeeScoin)}
                            <small>
                              Tổng giao dịch {isLoading ? '…' : formatScoinAsVnd(metrics?.gmvScoin)}
                            </small>
                          </td>
                          <td>{isLoading ? '…' : formatCount(metrics?.totalTransactions)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <RevenueTransactionsPanel />

          <div className="admin-revenue-columns">
            <section className="admin-panel" aria-labelledby="revenue-held-heading">
              <header className="admin-panel-heading">
                <h2 id="revenue-held-heading" className="admin-card-title">
                  Tiền đang giữ hộ
                </h2>
              </header>
              <p className="admin-revenue-note">
                <Info aria-hidden="true" />
                Đây là tiền của người dùng, không tính vào doanh thu của SkillSwap.
              </p>
              <dl className="admin-revenue-list">
                <div>
                  <dt>
                    <Landmark aria-hidden="true" />
                    Tiền tạm giữ cho mentor
                  </dt>
                  <dd>{isLoading ? '…' : formatVnd(financial?.totalEscrowVnd)}</dd>
                  <p>Thu nhập của mentor chờ buổi học hoàn tất trước khi được rút.</p>
                </div>
                <div>
                  <dt>
                    <Wallet aria-hidden="true" />
                    Số dư S-coin của người dùng
                  </dt>
                  <dd>{isLoading ? '…' : formatScoinAsVnd(financial?.totalCreditLedgerScoin)}</dd>
                  <p>
                    Tổng số dư ví S-coin của mentee (quy đổi VNĐ), dùng được cho lần đặt lịch sau.
                  </p>
                </div>
                <div>
                  <dt>
                    <HandCoins aria-hidden="true" />
                    Yêu cầu rút tiền chưa chi trả
                  </dt>
                  <dd>{isLoading ? '…' : formatCount(pendingPayouts + approvedPayouts)}</dd>
                  <p>
                    {formatCount(pendingPayouts)} chờ duyệt · {formatCount(approvedPayouts)} đã
                    duyệt, chờ chuyển khoản.
                  </p>
                </div>
              </dl>
            </section>

            <section className="admin-panel" aria-labelledby="revenue-orders-heading">
              <header className="admin-panel-heading">
                <h2 id="revenue-orders-heading" className="admin-card-title">
                  Trạng thái đơn thanh toán
                </h2>
              </header>
              {isLoading ? (
                <p className="admin-empty-state">Đang tải…</p>
              ) : !paymentRows.length ? (
                <p className="admin-empty-state">Chưa có đơn thanh toán nào.</p>
              ) : (
                <ul className="admin-revenue-status-list">
                  {paymentRows.map((row) => (
                    <li key={row.key}>
                      <span className={`admin-revenue-dot is-${row.tone}`} aria-hidden="true" />
                      <span>{row.label}</span>
                      <b>{formatCount(row.count)}</b>
                      <small>
                        {paymentTotal ? formatPercent((row.count / paymentTotal) * 100) : '—'}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-panel" aria-labelledby="revenue-promo-heading">
              <header className="admin-panel-heading">
                <h2 id="revenue-promo-heading" className="admin-card-title">
                  Chi phí khuyến mãi
                </h2>
              </header>
              {isLoading ? (
                <p className="admin-empty-state">Đang tải…</p>
              ) : !campaigns ? (
                <p className="admin-empty-state">Chưa có chiến dịch khuyến mãi.</p>
              ) : (
                <div className="admin-revenue-budget">
                  <div>
                    <Ticket aria-hidden="true" />
                    <strong>{formatScoinAsVnd(budgetUsed)}</strong>
                    <span>đã dùng trên {formatScoinAsVnd(budgetTotal)} ngân sách</span>
                  </div>
                  <div
                    className="admin-revenue-progress"
                    role="progressbar"
                    aria-label="Ngân sách khuyến mãi đã dùng"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(budgetShare)}
                  >
                    <span style={{ width: `${budgetShare}%` }} />
                  </div>
                  <p>
                    {formatCount(campaigns.activeCampaignCount)} chiến dịch đang chạy ·{' '}
                    {formatCount(campaigns.activeCouponCount)} mã giảm giá hoạt động ·{' '}
                    {formatCount(campaigns.totalCouponRedemptions)} lượt dùng mã
                  </p>
                </div>
              )}
            </section>
          </div>

          <section className="admin-revenue-glossary" aria-labelledby="revenue-glossary-heading">
            <h2 id="revenue-glossary-heading">Cách hiểu các số liệu</h2>
            <dl>
              <div>
                <dt>Tổng giá trị giao dịch</dt>
                <dd>Toàn bộ số tiền mentee đã thanh toán thành công cho các buổi học.</dd>
              </div>
              <div>
                <dt>Doanh thu nền tảng</dt>
                <dd>Phần phí SkillSwap giữ lại; phần còn lại thuộc về mentor.</dd>
              </div>
              <div>
                <dt>Đơn vị tiền</dt>
                <dd>Mọi số tiền hiển thị bằng VNĐ (1 S-coin = 1 VNĐ).</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
