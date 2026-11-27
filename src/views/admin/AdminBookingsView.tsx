/**
 * @file AdminBookingsView.tsx
 * @description Danh sách lịch hẹn trên nền tảng dành cho quản trị viên.
 */

'use client';

import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type { AdminBooking } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { showError } from '@/utils/toast';
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { BookingStatusBadge, getBookingStatusConfig } from '@/components/ui/BookingStatusBadge';

const pageSize = 10;

/** Raw booking statuses accepted by `GET /api/admin/bookings?status=` (Swagger enum). */
const BOOKING_STATUSES = [
  'REQUESTED',
  'WAITING_PAYMENT',
  'CONFIRMED',
  'UNDER_REVIEW',
  'COMPLETED',
  'REJECTED_BY_MENTOR',
  'CANCELED_BY_MENTEE',
  'CANCELED_BY_MENTOR',
  'REQUEST_EXPIRED',
  'PAYMENT_EXPIRED',
] as const;

/** Upper bound when listing confirmed bookings to find sessions whose time has passed. */
const CONFIRMED_SCAN_SIZE = 200;

interface BookingCounts {
  total: number;
  requested: number;
  completed: number;
  underReview: number;
  /** CONFIRMED bookings whose end time has passed: waiting for the session to be confirmed. */
  awaitingCompletion: number;
}

function isPastSession(booking: AdminBooking, now = Date.now()) {
  const end = booking.selectedEndTime ? new Date(booking.selectedEndTime).getTime() : NaN;
  return booking.bookingStatus === 'CONFIRMED' && Number.isFinite(end) && end < now;
}

/** System-wide counts: the dashboard breakdown by raw status, or one count query per status. */
async function loadBookingCounts(): Promise<BookingCounts> {
  const confirmedPromise = adminRepo
    .getBookings({ status: 'CONFIRMED', page: 0, size: CONFIRMED_SCAN_SIZE })
    .then((data) => data.content.filter((booking) => isPastSession(booking)).length);
  const breakdown = await adminRepo
    .getOverview()
    .then((overview) => overview.bookings ?? null)
    .catch(() => null);
  const countOf = async (status: string) =>
    breakdown
      ? (breakdown[status] ?? 0)
      : (await adminRepo.getBookings({ status, page: 0, size: 1 })).totalElements;
  const total = breakdown
    ? Object.values(breakdown).reduce((sum, value) => sum + (Number(value) || 0), 0)
    : (await adminRepo.getBookings({ page: 0, size: 1 })).totalElements;
  const [requested, completed, underReview, awaitingCompletion] = await Promise.all([
    countOf('REQUESTED'),
    countOf('COMPLETED'),
    countOf('UNDER_REVIEW'),
    confirmedPromise,
  ]);
  return { total, requested, completed, underReview, awaitingCompletion };
}

function getLabel(value: string | null) {
  if (!value) return 'Chưa cập nhật';
  return getBookingStatusConfig(value).label;
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa xếp lịch';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(0, Math.min(currentPage - 2, Math.max(totalPages - 5, 0)));
  const end = Math.min(totalPages, start + 5);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export function getPaymentStatusClass(value: string | null) {
  return value?.trim().toLowerCase().replaceAll('_', '-') ?? '';
}

export function getPaymentStatusLabel(value: string | null) {
  if (!value) return 'Chưa cập nhật';
  const labels: Record<string, string> = {
    PENDING: 'Đang chờ',
    UNPAID: 'Chưa thanh toán',
    REQUIRES_PAYMENT: 'Chờ thanh toán',
    PROCESSING: 'Đang xử lý',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Đã thanh toán',
    SUCCEEDED: 'Đã thanh toán',
    FAILED: 'Thất bại',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
  };
  return labels[value] ?? value.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

export function AdminBookingsView() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [counts, setCounts] = useState<BookingCounts>();

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await loadBookingCounts());
    } catch {
      setCounts(undefined);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await adminRepo.getBookings({
        status: statusFilter || undefined,
        page,
        size: pageSize,
      });
      setBookings(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (reason) {
      setFailed(true);
      showError(reason, { title: 'Không thể tải lịch hẹn' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const refresh = () => {
    void loadBookings();
    void loadCounts();
  };

  const visibleBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase('vi-VN');
    // Status is filtered by the API; search only covers the loaded page.
    return bookings.filter((booking) => {
      const matchingKeyword =
        !keyword ||
        [
          booking.bookingId,
          booking.mentorDisplayName,
          booking.menteeDisplayName,
          booking.serviceTitle,
        ].some((value) => value?.toLocaleLowerCase('vi-VN').includes(keyword));
      return matchingKeyword;
    });
  }, [bookings, searchTerm]);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);
  const firstEntry = visibleBookings.length ? page * pageSize + 1 : 0;
  const lastEntry = visibleBookings.length ? Math.min((page + 1) * pageSize, totalElements) : 0;

  return (
    <main className="admin-bookings-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Lịch hẹn</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-bookings-content">
        <section className="admin-page-heading">
          <div>
            <h1>Lịch hẹn</h1>
            <p>Theo dõi các buổi mentoring và những lịch hẹn cần được xử lý.</p>
          </div>
        </section>
        <section className="admin-booking-metrics" aria-label="Tổng quan lịch hẹn">
          <BookingMetric
            icon={<ClipboardList aria-hidden="true" />}
            label="Tổng lịch hẹn"
            value={counts?.total}
            hint="Toàn hệ thống"
          />
          <BookingMetric
            icon={<CalendarCheck2 aria-hidden="true" />}
            label="Chờ mentor phản hồi"
            value={counts?.requested}
            hint="Mentor chưa nhận hoặc từ chối"
            tone="pending"
          />
          <BookingMetric
            icon={<CalendarCheck2 aria-hidden="true" />}
            label="Buổi đã hoàn thành"
            value={counts?.completed}
            hint={
              counts?.awaitingCompletion
                ? `+${counts.awaitingCompletion} buổi đã qua giờ học, chờ xác nhận hoàn tất`
                : 'Đã được xác nhận hoàn tất'
            }
            tone="completed"
          />
          <BookingMetric
            icon={<CircleAlert aria-hidden="true" />}
            label="Đang xử lý sự cố"
            value={counts?.underReview}
            hint="Mentee hoặc mentor đã báo sự cố"
            tone="issues"
          />
        </section>
        <section className="admin-bookings-table" aria-labelledby="admin-bookings-title">
          <div className="admin-bookings-toolbar">
            <label className="admin-search-field admin-toolbar-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm mentor hoặc mentee..."
                aria-label="Tìm lịch hẹn"
              />
            </label>
            <div>
              <label className="admin-users-status-filter">
                <span>Trạng thái</span>
                <select
                  aria-label="Lọc trạng thái lịch hẹn"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">Tất cả</option>
                  {BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={refresh} disabled={loading}>
                <RefreshCw aria-hidden="true" /> Làm mới
              </button>
            </div>
          </div>
          <div className="admin-bookings-scroll">
            <table>
              <thead>
                <tr>
                  <th id="admin-bookings-title">Người tham gia</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <AdminTableState
                    variant="loading"
                    colSpan={5}
                    title="Đang tải danh sách lịch hẹn…"
                  />
                ) : failed ? (
                  <AdminTableState
                    variant="error"
                    colSpan={5}
                    onRetry={() => void loadBookings()}
                  />
                ) : visibleBookings.length ? (
                  visibleBookings.map((booking) => (
                    <BookingRow key={booking.bookingId} booking={booking} />
                  ))
                ) : statusFilter || searchTerm.trim() ? (
                  <AdminTableState
                    variant="no-results"
                    colSpan={5}
                    searchTerm={searchTerm}
                    title={
                      searchTerm.trim()
                        ? undefined
                        : `Không có lịch hẹn ở trạng thái "${getLabel(statusFilter)}"`
                    }
                    description={
                      searchTerm.trim() && statusFilter
                        ? `Kiểm tra lại chính tả, hoặc bỏ lọc trạng thái "${getLabel(statusFilter)}".`
                        : searchTerm.trim()
                          ? undefined
                          : 'Chọn trạng thái khác hoặc xóa bộ lọc.'
                    }
                    onClearFilters={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setPage(0);
                    }}
                  />
                ) : (
                  <AdminTableState
                    variant="empty"
                    colSpan={5}
                    title="Chưa có lịch hẹn nào"
                    description="Khi mentee đặt lịch với mentor, lịch hẹn sẽ hiện ở đây."
                  />
                )}
              </tbody>
            </table>
          </div>
          <footer className="admin-users-pagination">
            <span>
              Hiển thị {firstEntry}–{lastEntry} / {totalElements} lịch hẹn
            </span>
            <div aria-label="Phân trang">
              <button
                type="button"
                aria-label="Trang trước"
                disabled={loading || page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === page ? 'is-active' : ''}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  disabled={loading}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber + 1}
                </button>
              ))}
              <button
                type="button"
                aria-label="Trang sau"
                disabled={loading || page >= totalPages - 1}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function BookingMetric({
  icon,
  label,
  value,
  hint,
  tone = '',
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  hint?: string;
  tone?: string;
}) {
  return (
    <article className={tone}>
      <i>{icon}</i>
      <div>
        <span>{label}</span>
        <strong>{value === undefined ? '—' : new Intl.NumberFormat('vi-VN').format(value)}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}

function BookingRow({ booking }: { booking: AdminBooking }) {
  return (
    <tr>
      <td>
        <div className="admin-booking-participants">
          <Participant name={booking.menteeDisplayName} role="Mentee" />
          <Participant name={booking.mentorDisplayName} role="Mentor" />
        </div>
      </td>
      <td>
        <b>{booking.serviceTitle ?? 'Chưa cập nhật dịch vụ'}</b>
        <small>
          {booking.serviceDurationSnapshot !== null
            ? `${booking.serviceDurationSnapshot} phút`
            : (booking.learningGoalTitle ?? '—')}
        </small>
      </td>
      <td>
        <b>{formatDate(booking.selectedStartTime)}</b>
        <small>
          {booking.selectedEndTime ? `Kết thúc ${formatDate(booking.selectedEndTime)}` : '—'}
        </small>
      </td>
      <td>
        <BookingStatusBadge status={booking.bookingStatus} />
        {isPastSession(booking) && (
          <small className="admin-booking-overdue">Đã qua giờ học · chờ xác nhận hoàn tất</small>
        )}
        {booking.issueType && (
          <small className="admin-booking-issue">Sự cố: {getLabel(booking.issueType)}</small>
        )}
      </td>
      <td>
        {!booking.serviceIsFreeSnapshot && booking.paymentStatus !== 'NOT_REQUIRED' && (
          <span className={`admin-booking-payment ${getPaymentStatusClass(booking.paymentStatus)}`}>
            {getPaymentStatusLabel(booking.paymentStatus)}
          </span>
        )}
        <small className="admin-booking-price">
          {booking.serviceIsFreeSnapshot
            ? 'Miễn phí'
            : `${booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot ?? 0} Scoin`}
        </small>
      </td>
    </tr>
  );
}

function Participant({ name, role }: { name: string; role: string }) {
  return (
    <span className="admin-booking-person">
      <span>
        <b>{name}</b>
        <small>{role}</small>
      </span>
    </span>
  );
}
