/**
 * @file AdminCouponDetailView.tsx
 * @description Admin coupon detail: header actions, stat cards, redemption history, conditions,
 * and confirm dialogs for pausing / suspending.
 */

'use client';

import { AdminDialog } from '@/components/domain/admin/AdminDialog';
import {
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminLoadingState } from '@/components/domain/admin/AdminLoadingState';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import {
  describeDiscount,
  deriveCouponState,
  formatScoin,
  getCouponStateUi,
  isNearlyExhausted,
  usagePercent,
} from '@/lib/coupon';
import type { CouponView } from '@/models/coupon';
import {
  Ban,
  CalendarClock,
  CircleDollarSign,
  Hourglass,
  LoaderCircle,
  PauseCircle,
  Pencil,
  PlayCircle,
  Ticket,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { formatCouponPeriod } from '../coupons/adminCoupons.constants';
import styles from './AdminCouponDetailView.module.css';
import { describeTimeLeft, formatDateTime, getRedemptionStatusUi } from './couponDetail.constants';
import { useAdminCouponDetail } from './useAdminCouponDetail';

const HISTORY_COLUMNS = 4;

type ConfirmKind = 'suspend' | 'pause';

function scopeText(coupon: CouponView, mentorNames: string[] | undefined) {
  const mentors = coupon.applicableMentorIds?.length ?? 0;
  const services = coupon.applicableServiceIds?.length ?? 0;
  if (!mentors && !services) return 'Tất cả mentor và dịch vụ';
  // TODO(api): admin service lookup by id — service titles are not resolvable yet.
  const mentorPart = mentors
    ? mentorNames?.length
      ? mentorNames.join(', ')
      : `${mentors} mentor`
    : '';
  const servicePart = services ? `${services} dịch vụ` : '';
  return [mentorPart, servicePart].filter(Boolean).join(' · ');
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  children,
}: {
  label: string;
  value: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber' | 'purple';
  children?: ReactNode;
}) {
  return (
    <article className={`is-${tone}`}>
      <i>
        <Icon aria-hidden="true" />
      </i>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {children}
      </div>
      <p>{description}</p>
    </article>
  );
}

function BusyLabel({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean;
  label: string;
  busyLabel: string;
}) {
  return busy ? (
    <>
      <LoaderCircle aria-hidden="true" className="is-spinning" /> {busyLabel}
    </>
  ) : (
    <>{label}</>
  );
}

export function AdminCouponDetailView({ couponId }: { couponId: string }) {
  const { locale } = useParams<{ locale: string }>();
  const couponsRoot = `/${locale}/admin/coupons`;
  const detail = useAdminCouponDetail(couponId);
  const { coupon, now } = detail;
  const [confirm, setConfirm] = useState<ConfirmKind>();

  const shell = (crumb: ReactNode, content: ReactNode) => (
    <main className="admin-coupons-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span>{' '}
          <Link className={styles.crumb} href={couponsRoot}>
            Mã giảm giá
          </Link>{' '}
          <span>›</span> <b>{crumb}</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-coupons-content">{content}</div>
    </main>
  );

  if (detail.loadState === 'loading') {
    return shell('…', <AdminLoadingState message="Đang tải mã giảm giá…" />);
  }
  if (detail.loadState !== 'ready' || !coupon) {
    const notFound = detail.loadState === 'not-found';
    return shell(
      notFound ? 'Không tìm thấy' : 'Lỗi',
      <section className={styles.stateCard} role="alert">
        <TriangleAlert aria-hidden="true" />
        <h1>{notFound ? 'Không tìm thấy mã giảm giá' : 'Không tải được mã giảm giá'}</h1>
        <p>{notFound ? 'Mã có thể đã bị xóa hoặc đường dẫn không đúng.' : detail.loadError}</p>
        <div>
          {!notFound && (
            <button type="button" className="admin-button primary" onClick={detail.reload}>
              Thử lại
            </button>
          )}
          <Link className="admin-button" href={couponsRoot}>
            Về danh sách mã
          </Link>
        </div>
      </section>,
    );
  }

  const state = deriveCouponState(coupon, now);
  const stateUi = getCouponStateUi(state);
  const used = coupon.totalRedemptions ?? 0;
  const active = coupon.activeRedemptions ?? 0;
  const percent = usagePercent(coupon);
  const period = formatCouponPeriod(coupon.startAt, coupon.endAt, now);
  const perUser = coupon.quotaPerUser ?? 1;
  const paidCount = detail.paidCount ?? Math.max(0, used - active);
  const canPause = coupon.status === 'ACTIVE';
  const canResume = coupon.status === 'INACTIVE' || coupon.status === 'SUSPENDED';
  const canSuspend = coupon.status !== 'SUSPENDED';
  const busy = Boolean(detail.statusPending);
  const barTone =
    state === 'expired' || state === 'exhausted' || state === 'suspended'
      ? styles.isDimmed
      : isNearlyExhausted(coupon)
        ? styles.isWarning
        : '';

  const runConfirmed = async (kind: ConfirmKind) => {
    const ok = await detail.changeStatus(kind === 'suspend' ? 'SUSPENDED' : 'INACTIVE');
    if (ok) setConfirm(undefined);
  };

  const history = detail.redemptions?.content ?? [];
  const historyState = detail.redemptionsLoading ? (
    <AdminTableState
      variant="loading"
      colSpan={HISTORY_COLUMNS}
      skeletonRows={4}
      title="Đang tải lịch sử lượt đổi…"
    />
  ) : detail.redemptionsError ? (
    <AdminTableState
      variant="error"
      colSpan={HISTORY_COLUMNS}
      title="Không tải được lịch sử lượt đổi"
      description={detail.redemptionsError}
      onRetry={detail.reloadRedemptions}
    />
  ) : history.length ? null : (
    <AdminTableState
      variant="empty"
      colSpan={HISTORY_COLUMNS}
      title="Chưa có ai dùng mã này"
      description="Lượt đổi mới sẽ hiện ở đây khi mentee nhập mã lúc thanh toán."
    />
  );
  const historyPage = detail.redemptions;
  const rangeStart = history.length ? detail.page * (historyPage?.size ?? 10) + 1 : 0;
  const rangeEnd = rangeStart ? rangeStart + history.length - 1 : 0;

  return shell(
    coupon.code,
    <>
      <section className={`admin-page-heading ${styles.heading}`}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.codeTitle}>{coupon.code}</h1>
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
          </div>
          <p>
            {coupon.title} · {describeDiscount(coupon)}
          </p>
        </div>
        <div>
          <Link className="admin-button" href={`${couponsRoot}/${coupon.id}/edit`}>
            <Pencil aria-hidden="true" />
            Sửa mã
          </Link>
          {canPause && (
            <button
              type="button"
              className="admin-button"
              disabled={busy}
              onClick={() => setConfirm('pause')}
            >
              <PauseCircle aria-hidden="true" />
              Tạm tắt
            </button>
          )}
          {canResume && (
            <button
              type="button"
              className="admin-button"
              disabled={busy}
              aria-busy={detail.statusPending === 'ACTIVE' || undefined}
              onClick={() => void detail.changeStatus('ACTIVE')}
            >
              {detail.statusPending === 'ACTIVE' ? (
                <LoaderCircle aria-hidden="true" className="is-spinning" />
              ) : (
                <PlayCircle aria-hidden="true" />
              )}
              {detail.statusPending === 'ACTIVE' ? 'Đang bật…' : 'Bật lại'}
            </button>
          )}
          {canSuspend && (
            <button
              type="button"
              className={`admin-button ${styles.dangerOutline}`}
              disabled={busy}
              onClick={() => setConfirm('suspend')}
            >
              <Ban aria-hidden="true" />
              Đình chỉ
            </button>
          )}
        </div>
      </section>

      <section className="admin-metric-grid" aria-label="Số liệu mã giảm giá">
        <StatCard
          label="Đã dùng"
          icon={Ticket}
          tone="blue"
          value={
            <span className={styles.ratio}>
              {formatScoin(used)}
              <small>
                {' '}
                / {coupon.quotaTotal == null ? 'Không giới hạn' : formatScoin(coupon.quotaTotal)}
              </small>
            </span>
          }
          description={
            percent === null
              ? 'Không giới hạn tổng số lượt.'
              : `Đã dùng ${Math.round(percent)}% số lượt.`
          }
        >
          {percent !== null && (
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
        </StatCard>
        {/* TODO(api): confirm activeRedemptions meaning (assumed: reserved, payment not finished). */}
        <StatCard
          label="Đang thanh toán"
          icon={Hourglass}
          tone="amber"
          value={formatScoin(active)}
          description="Mentee đã nhập mã, chưa trả xong."
        />
        <StatCard
          label="S-coins đã giảm"
          icon={CircleDollarSign}
          tone="green"
          value={detail.paidDiscountTotal == null ? '—' : formatScoin(detail.paidDiscountTotal)}
          description={
            detail.paidDiscountTotal === null
              ? 'Chưa tính được tổng cho mã có nhiều lượt dùng.'
              : 'Tổng mức giảm của các lượt đã thanh toán.'
          }
        />
        <StatCard
          label="Thời gian"
          icon={CalendarClock}
          tone="purple"
          value={<span className={styles.timeValue}>{describeTimeLeft(coupon, now)}</span>}
          description={
            <span title={period.title}>
              {period.label} · {perUser} lần cho mỗi mentee
            </span>
          }
        />
      </section>

      <div className={styles.columns}>
        <section className={list.card} aria-labelledby="coupon-history-title">
          <h2 id="coupon-history-title" className={styles.cardTitle}>
            Lịch sử lượt đổi
          </h2>
          <div className={list.tableScroll}>
            <table className={`${list.table} ${styles.historyTable}`}>
              <thead>
                <tr>
                  <th>Mentee</th>
                  <th>Giảm</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {historyState ??
                  history.map((item) => {
                    const statusUi = getRedemptionStatusUi(item.status);
                    return (
                      <tr key={item.id}>
                        <td>
                          <Link
                            className={styles.menteeLink}
                            href={`/${locale}/admin/users/${item.redeemerUserId}`}
                          >
                            {item.redeemerFullName || 'Mentee'}
                          </Link>
                        </td>
                        <td className={styles.discount}>
                          −{formatScoin(item.discountScoin)} S-coins
                        </td>
                        <td>
                          <span className={`${styles.pill} ${styles[`tone-${statusUi.tone}`]}`}>
                            {statusUi.label}
                          </span>
                        </td>
                        <td className={list.date}>{formatDateTime(item.createdAt)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {(historyPage?.totalElements ?? 0) > 0 && (
            <footer className={list.footer}>
              <span>
                Hiển thị {rangeStart}–{rangeEnd} trong {formatScoin(historyPage?.totalElements)}{' '}
                lượt
              </span>
              <AdminPagination
                page={detail.page}
                totalPages={historyPage?.totalPages ?? 0}
                disabled={detail.redemptionsLoading}
                onChange={detail.setPage}
              />
            </footer>
          )}
        </section>

        <section className={styles.conditions} aria-labelledby="coupon-conditions-title">
          <h2 id="coupon-conditions-title" className={styles.cardTitle}>
            Điều kiện
          </h2>
          <dl>
            <div>
              <dt>Áp dụng</dt>
              <dd>{scopeText(coupon, detail.mentorNames)}</dd>
            </div>
            <div>
              <dt>Đơn tối thiểu</dt>
              <dd>
                {coupon.minOrderValueScoin
                  ? `${formatScoin(coupon.minOrderValueScoin)} S-coins`
                  : 'Không yêu cầu'}
              </dd>
            </div>
            <div>
              <dt>Mỗi mentee</dt>
              <dd>{perUser} lần</dd>
            </div>
            <div>
              <dt>Tạo lúc</dt>
              <dd>{formatDateTime(coupon.createdAt)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {confirm === 'suspend' && (
        <AdminDialog
          titleId="coupon-suspend-title"
          tone="danger"
          icon={<Ban aria-hidden="true" />}
          title={`Đình chỉ mã ${coupon.code}?`}
          busy={busy}
          onClose={() => setConfirm(undefined)}
          footerStart="Bạn có thể bật lại mã ở trang này."
          footer={
            <>
              <button
                type="button"
                className="admin-button"
                disabled={busy}
                onClick={() => setConfirm(undefined)}
              >
                Giữ mã
              </button>
              <button
                type="button"
                className="admin-button is-danger-solid"
                disabled={busy}
                aria-busy={busy || undefined}
                onClick={() => void runConfirmed('suspend')}
              >
                <BusyLabel busy={busy} label="Đình chỉ mã" busyLabel="Đang đình chỉ…" />
              </button>
            </>
          }
        >
          <ul className="admin-dialog-list">
            <li>Mentee không áp được mã này cho đơn mới.</li>
            <li>{formatScoin(paidCount)} lượt đã thanh toán giữ nguyên mức giảm.</li>
            {active > 0 && (
              <li>
                {formatScoin(active)} mentee đang thanh toán có thể bị từ chối mã khi bấm trả.
              </li>
            )}
          </ul>
        </AdminDialog>
      )}

      {confirm === 'pause' && (
        <AdminDialog
          titleId="coupon-pause-title"
          tone="info"
          icon={<PauseCircle aria-hidden="true" />}
          title={`Tạm tắt mã ${coupon.code}?`}
          busy={busy}
          onClose={() => setConfirm(undefined)}
          footer={
            <>
              <button
                type="button"
                className="admin-button"
                disabled={busy}
                onClick={() => setConfirm(undefined)}
              >
                Giữ mã
              </button>
              <button
                type="button"
                className="admin-button is-primary"
                disabled={busy}
                aria-busy={busy || undefined}
                onClick={() => void runConfirmed('pause')}
              >
                <BusyLabel busy={busy} label="Tạm tắt" busyLabel="Đang tạm tắt…" />
              </button>
            </>
          }
        >
          <p className="admin-dialog-text">Mentee không áp được mã cho tới khi bạn bật lại.</p>
        </AdminDialog>
      )}
    </>,
  );
}
