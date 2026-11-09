/**
 * @file AdminCouponsView.tsx
 * @description Admin coupon list: stat cards, filters, table and pagination.
 */

'use client';

import {
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import {
  describeDiscount,
  deriveCouponState,
  formatScoin,
  getCouponStateUi,
  isNearlyExhausted,
  usagePercent,
  type CouponState,
} from '@/lib/coupon';
import type { CouponView } from '@/models/coupon';
import {
  CalendarClock,
  CirclePlus,
  Gauge,
  Repeat2,
  Search,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DISCOUNT_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  describeScope,
  formatCouponPeriod,
} from './adminCoupons.constants';
import styles from './AdminCouponsView.module.css';
import { useAdminCoupons, type CouponSummary } from './useAdminCoupons';

const COLUMN_COUNT = 7;
/** States where the coupon can no longer be redeemed: the usage bar turns grey. */
const DIMMED_STATES: CouponState[] = ['expired', 'exhausted', 'suspended'];

type Metric = {
  label: string;
  value: number | undefined;
  description: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber' | 'purple';
};

function buildMetrics(summary: CouponSummary): Metric[] {
  const sampleNote = summary.partial ? ' (tính trên 100 mã mới nhất)' : '';
  return [
    {
      label: 'Mã đang chạy',
      value: summary.running,
      description: 'Đang trong thời gian hiệu lực và còn lượt dùng.',
      icon: Ticket,
      tone: 'blue',
    },
    {
      label: 'Tổng lượt đổi',
      value: summary.redemptions,
      description: 'Số lần mentee đã dùng mã khi thanh toán.',
      icon: Repeat2,
      tone: 'green',
    },
    {
      label: 'Sắp hết lượt',
      value: summary.nearlyExhausted,
      description: `Mã đang chạy đã dùng từ 80% lượt trở lên${sampleNote}.`,
      icon: Gauge,
      tone: 'amber',
    },
    {
      label: 'Sắp diễn ra',
      value: summary.scheduled,
      description: `Mã chưa đến ngày bắt đầu${sampleNote}.`,
      icon: CalendarClock,
      tone: 'purple',
    },
  ];
}

export function AdminCouponsView() {
  const { locale } = useParams<{ locale: string }>();
  const couponsRoot = `/${locale}/admin/coupons`;
  const state = useAdminCoupons();
  const { filters, coupons, loading, error, isFiltered } = state;

  const createButton = (
    <Link className="admin-button primary" href={`${couponsRoot}/new`}>
      <CirclePlus aria-hidden="true" />
      Tạo mã giảm giá
    </Link>
  );

  const tableState = loading ? (
    <AdminTableState
      variant="loading"
      colSpan={COLUMN_COUNT}
      title="Đang tải danh sách mã giảm giá…"
    />
  ) : error ? (
    <AdminTableState
      variant="error"
      colSpan={COLUMN_COUNT}
      title="Không tải được danh sách mã giảm giá"
      description={error}
      onRetry={state.reload}
    />
  ) : coupons.length ? null : isFiltered ? (
    <AdminTableState
      variant="no-results"
      colSpan={COLUMN_COUNT}
      searchTerm={filters.keyword}
      title={filters.keyword ? undefined : 'Không có mã nào khớp bộ lọc'}
      description={
        filters.keyword ? undefined : 'Chọn trạng thái hoặc loại giảm khác, hoặc xóa bộ lọc.'
      }
      onClearFilters={state.clearFilters}
    />
  ) : (
    <AdminTableState
      variant="empty"
      colSpan={COLUMN_COUNT}
      title="Chưa có mã giảm giá nào"
      description="Tạo mã đầu tiên để mentee dùng khi thanh toán."
      action={createButton}
    />
  );

  return (
    <main className="admin-coupons-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Mã giảm giá</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-coupons-content">
        <section className="admin-page-heading">
          <div>
            <h1>Mã giảm giá</h1>
            <p>Tạo mã cho toàn bộ mentor hoặc từng dịch vụ. Mentee nhập mã khi thanh toán.</p>
          </div>
          <div>{createButton}</div>
        </section>

        <section className="admin-metric-grid" aria-label="Tổng quan mã giảm giá">
          {buildMetrics(state.summary).map(
            ({ label, value, description, icon: MetricIcon, tone }) => (
              <article key={label} className={`is-${tone}`}>
                <i>
                  <MetricIcon aria-hidden="true" />
                </i>
                <div>
                  <span>{label}</span>
                  <strong>{value === undefined ? '—' : formatScoin(value)}</strong>
                </div>
                <p>{description}</p>
                <span className="admin-metric-decoration" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                </span>
              </article>
            ),
          )}
        </section>

        <section className={list.card} aria-label="Danh sách mã giảm giá">
          <div className={list.toolbar}>
            <label className={`admin-search-field admin-toolbar-search ${styles.search}`}>
              <Search aria-hidden="true" />
              <input
                type="search"
                aria-label="Tìm mã giảm giá"
                value={state.searchInput}
                onChange={(event) => state.setSearchInput(event.target.value)}
                placeholder="Tìm theo mã hoặc tên ưu đãi"
              />
            </label>
            <label className={list.selectField}>
              <span>Trạng thái</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  state.setStatus(event.target.value as (typeof filters)['status'])
                }
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={list.selectField}>
              <span>Loại giảm</span>
              <select
                value={filters.discountType}
                onChange={(event) =>
                  state.setDiscountType(event.target.value as (typeof filters)['discountType'])
                }
              >
                {DISCOUNT_TYPE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={list.tableScroll}>
            <table className={`${list.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Ưu đãi</th>
                  <th>Áp dụng cho</th>
                  <th>Đã dùng</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableState ??
                  coupons.map((coupon) => (
                    <CouponRow
                      key={coupon.id}
                      coupon={coupon}
                      href={`${couponsRoot}/${coupon.id}`}
                      now={state.now}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <footer className={list.footer}>
            <span>
              Hiển thị {state.rangeStart}–{state.rangeEnd} trong {formatScoin(state.totalElements)}{' '}
              mã
            </span>
            <AdminPagination
              page={filters.page}
              totalPages={state.totalPages}
              disabled={loading}
              onChange={state.setPage}
            />
          </footer>
        </section>
      </div>
    </main>
  );
}

function CouponRow({ coupon, href, now }: { coupon: CouponView; href: string; now: number }) {
  const couponState = deriveCouponState(coupon, now);
  const stateUi = getCouponStateUi(couponState);
  const period = formatCouponPeriod(coupon.startAt, coupon.endAt, now);
  const used = coupon.totalRedemptions ?? 0;
  const hasQuota = coupon.quotaTotal != null;
  const percent = usagePercent(coupon) ?? 0;
  const barTone = DIMMED_STATES.includes(couponState)
    ? styles.isDimmed
    : isNearlyExhausted(coupon)
      ? styles.isWarning
      : '';

  return (
    <tr>
      <td>
        <Link className={styles.code} href={href} title={`Xem chi tiết mã ${coupon.code}`}>
          {coupon.code}
        </Link>
      </td>
      <td>
        <div className={styles.offer}>
          <strong title={coupon.title}>{coupon.title}</strong>
          <span>{describeDiscount(coupon)}</span>
        </div>
      </td>
      <td className={styles.scope}>{describeScope(coupon)}</td>
      <td>
        <div className={styles.usage}>
          <span className={styles.usageCount}>
            {formatScoin(used)} / {hasQuota ? formatScoin(coupon.quotaTotal) : 'Không giới hạn'}
          </span>
          {hasQuota && (
            <span
              className={`${styles.bar} ${barTone}`}
              role="progressbar"
              aria-label={`Đã dùng ${Math.round(percent)}% lượt`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
            >
              <span style={{ width: `${percent}%` }} />
            </span>
          )}
        </div>
      </td>
      <td className={list.date}>
        <time dateTime={coupon.startAt} title={period.title}>
          {period.label}
        </time>
      </td>
      <td>
        <span
          className={styles.pill}
          style={{
            background: stateUi.tone.background,
            color: stateUi.tone.color,
            border: stateUi.tone.border,
          }}
        >
          {stateUi.label}
        </span>
      </td>
      <td className={list.actionCell}>
        <Link className={styles.viewButton} href={href}>
          Xem
        </Link>
      </td>
    </tr>
  );
}
