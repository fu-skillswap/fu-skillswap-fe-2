/**
 * @file RevenueTransactionsPanel.tsx
 * @description Bảng "Lịch sử giao dịch" trên trang Doanh thu: ai đã trả bao nhiêu, cho buổi học
 * nào, với mentor nào, có dùng mã giảm giá không. Data loading/matching lives in
 * `revenueTransactions.ts`; filtering and paging happen on the client.
 */

'use client';

import {
  AdminListTabs,
  AdminPagination,
  AdminPersonCell,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { getPaymentStatusClass, getPaymentStatusLabel } from '@/views/admin/AdminBookingsView';
import { Search, Ticket } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatCount, formatScoinAsVnd } from './revenue.helpers';
import { loadRevenueTransactions, type RevenueTransactionsData } from './revenueTransactions';

const TABLE_PAGE_SIZE = 10;
const COLUMN_COUNT = 5;

type StatusFilter = 'ALL' | 'PAID' | 'COUPON' | 'REFUNDED';

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

function normalize(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('vi-VN').normalize('NFD').replace(/\p{M}/gu, '');
}

type LoadState =
  { status: 'loading' } | { status: 'error' } | ({ status: 'ready' } & RevenueTransactionsData);

export function RevenueTransactionsPanel() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', ...(await loadRevenueTransactions()) });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const transactions = useMemo(() => (state.status === 'ready' ? state.transactions : []), [state]);
  const ready = state.status === 'ready';

  const counts = useMemo(
    () => ({
      ALL: transactions.length,
      PAID: transactions.filter((tx) => tx.booking.paymentStatus === 'PAID').length,
      COUPON: transactions.filter((tx) => tx.coupon).length,
      REFUNDED: transactions.filter((tx) => tx.booking.paymentStatus === 'REFUNDED').length,
    }),
    [transactions],
  );

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return transactions.filter((tx) => {
      if (filter === 'COUPON' && !tx.coupon) return false;
      if ((filter === 'PAID' || filter === 'REFUNDED') && tx.booking.paymentStatus !== filter) {
        return false;
      }
      if (!term) return true;
      return [
        tx.booking.menteeDisplayName,
        tx.booking.mentorDisplayName,
        tx.booking.serviceTitle,
        tx.coupon?.code,
      ].some((field) => normalize(field).includes(term));
    });
  }, [transactions, search, filter]);

  const paid = filtered.filter((tx) => tx.booking.paymentStatus === 'PAID');
  const totalCollected = paid.reduce((sum, tx) => sum + tx.amountPaid, 0);
  const totalDiscount = paid.reduce((sum, tx) => sum + (tx.coupon?.discount ?? 0), 0);
  const totalPages = Math.ceil(filtered.length / TABLE_PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = filtered.slice(currentPage * TABLE_PAGE_SIZE, (currentPage + 1) * TABLE_PAGE_SIZE);

  const changeFilter = (value: StatusFilter) => {
    setFilter(value);
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
            Ai đã thanh toán, thực trả bao nhiêu, cho buổi học nào. Mới nhất ở trên cùng.
          </p>
        </div>
      </header>

      <AdminListTabs
        ariaLabel="Lọc giao dịch"
        value={filter}
        onChange={changeFilter}
        tabs={[
          { value: 'ALL', label: 'Tất cả', count: ready ? counts.ALL : undefined },
          { value: 'PAID', label: 'Đã thanh toán', count: ready ? counts.PAID : undefined },
          { value: 'COUPON', label: 'Có dùng mã', count: ready ? counts.COUPON : undefined },
          { value: 'REFUNDED', label: 'Đã hoàn tiền', count: ready ? counts.REFUNDED : undefined },
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
            placeholder="Tìm theo mentee, mentor, dịch vụ hoặc mã giảm giá"
          />
        </label>
        {ready && (
          <p className="admin-revenue-transactions-total" aria-live="polite">
            {formatCount(filtered.length)} giao dịch · Thực thu{' '}
            <strong>{formatScoinAsVnd(totalCollected)}</strong>
            {totalDiscount > 0 && <> · Đã giảm {formatScoinAsVnd(totalDiscount)}</>}
          </p>
        )}
      </div>

      {state.status === 'ready' && !state.couponsLoaded && (
        <p className="admin-revenue-transactions-warning" role="status">
          Chưa tải được dữ liệu mã giảm giá, nên số tiền đang là giá gốc. Tải lại trang để thử lại.
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-revenue-transactions-table">
          <thead>
            <tr>
              <th>Người thanh toán</th>
              <th>Mentor nhận</th>
              <th>Buổi học</th>
              <th className="is-numeric">Thực trả</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {state.status === 'loading' ? (
              <AdminTableState
                variant="loading"
                colSpan={COLUMN_COUNT}
                skeletonRows={5}
                title="Đang tải giao dịch…"
              />
            ) : state.status === 'error' ? (
              <AdminTableState
                variant="error"
                colSpan={COLUMN_COUNT}
                title="Không tải được lịch sử giao dịch"
                onRetry={() => void load()}
              />
            ) : !transactions.length ? (
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
                  changeFilter('ALL');
                }}
              />
            ) : (
              rows.map(({ booking, listPrice, coupon, amountPaid }) => (
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
                      {formatScoinAsVnd(amountPaid)}
                    </strong>
                    {coupon && (
                      <>
                        <small className="admin-revenue-tx-original">
                          <span className="sr-only">Giá gốc </span>
                          <s>{formatScoinAsVnd(listPrice)}</s>
                        </small>
                        <span className="admin-revenue-tx-coupon">
                          <Ticket aria-hidden="true" />
                          {coupon.code} −{formatScoinAsVnd(coupon.discount)}
                        </span>
                      </>
                    )}
                  </td>
                  <td>
                    <span
                      className={`admin-booking-payment ${getPaymentStatusClass(booking.paymentStatus)}`}
                    >
                      {amountPaid === 0 && booking.paymentStatus === 'PAID'
                        ? 'Miễn phí nhờ mã'
                        : getPaymentStatusLabel(booking.paymentStatus)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {ready && totalPages > 1 && (
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
        Thực trả = giá buổi học (đã gồm phụ phí nền tảng) trừ mã giảm giá. Mã giảm giá được ghép với
        buổi học theo người dùng mã và thời điểm thanh toán. Phần trả bằng số dư S-coin hoặc ưu đãi
        chiến dịch chưa có dữ liệu chi tiết nên chưa được trừ.
        {state.status === 'ready' && state.unmatchedRedemptions > 0
          ? ` Có ${formatCount(state.unmatchedRedemptions)} lượt dùng mã chưa ghép được với buổi học nào.`
          : ''}
      </p>
    </section>
  );
}
