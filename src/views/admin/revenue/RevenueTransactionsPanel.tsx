/**
 * @file RevenueTransactionsPanel.tsx
 * @description Bảng "Lịch sử giao dịch" trên trang Doanh thu: ai đã trả bao nhiêu, cho buổi học
 * nào, với mentor nào.
 *
 * Data source: `GET /api/admin/bookings` (sorted by `createdAt` DESC), keeping paid services whose
 * payment actually moved money (PAID / REFUNDED). Filtering and paging happen on the client.
 *
 * TODO(api): an admin payment-orders list (`GET /api/admin/payment-orders` with paidAt, amount
 * actually charged after coupon/credit, platform fee and payment-status filter, server paging) is
 * needed; bookings only expose the list price, not what PayOS collected.
 */

'use client';

import {
  AdminListTabs,
  AdminPagination,
  AdminPersonCell,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import type { AdminBooking } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getPaymentStatusClass, getPaymentStatusLabel } from '@/views/admin/AdminBookingsView';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatCount, formatScoinAsVnd } from './revenue.helpers';

const FETCH_PAGE_SIZE = 100;
/** Safety cap: 10 × 100 most recent bookings. */
const MAX_FETCH_PAGES = 10;
const TABLE_PAGE_SIZE = 10;
const COLUMN_COUNT = 5;
const MONEY_MOVED_STATUSES = ['PAID', 'REFUNDED'];

type StatusFilter = 'ALL' | 'PAID' | 'REFUNDED';

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

/** What the mentee was charged before coupon/credit (surcharge included). */
function getBookingAmount(booking: AdminBooking) {
  return booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot ?? 0;
}

function normalize(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('vi-VN').normalize('NFD').replace(/\p{M}/gu, '');
}

async function fetchPaidBookings() {
  const result: AdminBooking[] = [];
  for (let page = 0; page < MAX_FETCH_PAGES; page += 1) {
    const response = await adminRepo.getBookings({
      page,
      size: FETCH_PAGE_SIZE,
      sortBy: 'createdAt',
      direction: 'DESC',
    });
    const content = Array.isArray(response?.content) ? response.content : [];
    result.push(
      ...content.filter(
        (booking) =>
          !booking.serviceIsFreeSnapshot && MONEY_MOVED_STATUSES.includes(booking.paymentStatus),
      ),
    );
    if (response?.last !== false || !content.length) break;
  }
  return result;
}

export function RevenueTransactionsPanel() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setState('loading');
    try {
      setBookings(await fetchPaidBookings());
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      ALL: bookings.length,
      PAID: bookings.filter((booking) => booking.paymentStatus === 'PAID').length,
      REFUNDED: bookings.filter((booking) => booking.paymentStatus === 'REFUNDED').length,
    }),
    [bookings],
  );

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return bookings.filter((booking) => {
      if (status !== 'ALL' && booking.paymentStatus !== status) return false;
      if (!term) return true;
      return [booking.menteeDisplayName, booking.mentorDisplayName, booking.serviceTitle].some(
        (field) => normalize(field).includes(term),
      );
    });
  }, [bookings, search, status]);

  const totalAmount = filtered
    .filter((booking) => booking.paymentStatus === 'PAID')
    .reduce((sum, booking) => sum + getBookingAmount(booking), 0);
  const totalPages = Math.ceil(filtered.length / TABLE_PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = filtered.slice(currentPage * TABLE_PAGE_SIZE, (currentPage + 1) * TABLE_PAGE_SIZE);

  const changeStatus = (value: StatusFilter) => {
    setStatus(value);
    setPage(0);
  };

  return (
    <section className="admin-panel admin-revenue-transactions" aria-labelledby="revenue-tx-title">
      <header className="admin-panel-heading">
        <div>
          <h2 id="revenue-tx-title" className="admin-card-title">
            Lịch sử giao dịch
          </h2>
          <p className="admin-revenue-transactions-sub">
            Ai đã thanh toán, bao nhiêu tiền, cho buổi học nào. Mới nhất ở trên cùng.
          </p>
        </div>
      </header>

      <AdminListTabs
        ariaLabel="Lọc theo trạng thái thanh toán"
        value={status}
        onChange={changeStatus}
        tabs={[
          { value: 'ALL', label: 'Tất cả', count: state === 'ready' ? counts.ALL : undefined },
          {
            value: 'PAID',
            label: 'Đã thanh toán',
            count: state === 'ready' ? counts.PAID : undefined,
          },
          {
            value: 'REFUNDED',
            label: 'Đã hoàn tiền',
            count: state === 'ready' ? counts.REFUNDED : undefined,
          },
        ]}
      />

      <div className={list.toolbar}>
        <label className="admin-search-field admin-toolbar-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="Tìm giao dịch"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo tên mentee, mentor hoặc dịch vụ"
          />
        </label>
        {state === 'ready' && (
          <p className="admin-revenue-transactions-total" aria-live="polite">
            {formatCount(filtered.length)} giao dịch · Đã thu{' '}
            <strong>{formatScoinAsVnd(totalAmount)}</strong>
          </p>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-revenue-transactions-table">
          <thead>
            <tr>
              <th>Người thanh toán</th>
              <th>Mentor nhận</th>
              <th>Buổi học</th>
              <th className="is-numeric">Số tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {state === 'loading' ? (
              <AdminTableState
                variant="loading"
                colSpan={COLUMN_COUNT}
                skeletonRows={5}
                title="Đang tải giao dịch…"
              />
            ) : state === 'error' ? (
              <AdminTableState
                variant="error"
                colSpan={COLUMN_COUNT}
                title="Không tải được lịch sử giao dịch"
                onRetry={() => void load()}
              />
            ) : !bookings.length ? (
              <AdminTableState
                variant="empty"
                colSpan={COLUMN_COUNT}
                title="Chưa có giao dịch nào"
                description="Khi mentee thanh toán một buổi học, giao dịch sẽ hiện ở đây."
              />
            ) : !rows.length ? (
              <AdminTableState
                variant="no-results"
                colSpan={COLUMN_COUNT}
                searchTerm={search.trim() || undefined}
                onClearFilters={() => {
                  setSearch('');
                  changeStatus('ALL');
                }}
              />
            ) : (
              rows.map((booking) => (
                <tr key={booking.bookingId}>
                  <td>
                    <AdminPersonCell
                      name={booking.menteeDisplayName}
                      email={`Đặt lúc ${formatDateTime(booking.createdAt)}`}
                      avatarUrl={booking.menteeAvatarUrl}
                      avatarSize={34}
                    />
                  </td>
                  <td>
                    <AdminPersonCell
                      name={booking.mentorDisplayName}
                      email="Mentor"
                      avatarUrl={booking.mentorAvatarUrl}
                      avatarSize={34}
                    />
                  </td>
                  <td>
                    <strong className="admin-revenue-tx-service">
                      {booking.serviceTitle ?? 'Buổi học'}
                    </strong>
                    <small className="admin-revenue-tx-meta">
                      {formatDateTime(booking.selectedStartTime)}
                      {booking.serviceDurationSnapshot
                        ? ` · ${booking.serviceDurationSnapshot} phút`
                        : ''}
                    </small>
                  </td>
                  <td className="is-numeric">
                    <strong className="admin-revenue-tx-amount">
                      {formatScoinAsVnd(getBookingAmount(booking))}
                    </strong>
                  </td>
                  <td>
                    <span
                      className={`admin-booking-payment ${getPaymentStatusClass(booking.paymentStatus)}`}
                    >
                      {getPaymentStatusLabel(booking.paymentStatus)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {state === 'ready' && totalPages > 1 && (
        <div className="admin-revenue-transactions-footer">
          <span>
            Hiển thị {formatCount(currentPage * TABLE_PAGE_SIZE + 1)}–
            {formatCount(Math.min((currentPage + 1) * TABLE_PAGE_SIZE, filtered.length))} trên{' '}
            {formatCount(filtered.length)} giao dịch
          </span>
          <AdminPagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
      <p className="admin-revenue-transactions-note">
        Số tiền là giá buổi học mentee phải trả (đã gồm phụ phí nền tảng), chưa trừ mã giảm giá hoặc
        số dư S-coin đã dùng.
      </p>
    </section>
  );
}
