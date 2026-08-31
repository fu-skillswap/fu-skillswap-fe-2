/**
 * @file AdminBookingsView.tsx
 * @description Danh sách lịch hẹn trên nền tảng dành cho quản trị viên.
 */

'use client';

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

import { BookingStatusBadge, BOOKING_STATUS_MAP, getBookingStatusConfig } from '@/components/ui/BookingStatusBadge';

const pageSize = 10;

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

function InitialAvatar({ name }: { name: string }) {
  return (
    <span className="admin-booking-initial">{name.trim().charAt(0).toUpperCase() || '?'}</span>
  );
}

export function AdminBookingsView() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRepo.getBookings({ page, size: pageSize });
      setBookings(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (reason) {
      showError(reason, { title: 'Không thể tải lịch hẹn' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const visibleBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase('vi-VN');
    return bookings.filter((booking) => {
      const matchingStatus = !statusFilter || booking.bookingStatus === statusFilter;
      const matchingKeyword =
        !keyword ||
        [
          booking.bookingId,
          booking.mentorDisplayName,
          booking.menteeDisplayName,
          booking.serviceTitle,
        ].some((value) => value?.toLocaleLowerCase('vi-VN').includes(keyword));
      return matchingStatus && matchingKeyword;
    });
  }, [bookings, searchTerm, statusFilter]);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);
  const completedCount = bookings.filter((booking) => booking.bookingStatus === 'COMPLETED').length;
  const pendingCount = bookings.filter((booking) => booking.bookingStatus === 'REQUESTED').length;
  const issueCount = bookings.filter((booking) => booking.issueType).length;
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
            value={totalElements}
          />
          <BookingMetric
            icon={<CalendarCheck2 aria-hidden="true" />}
            label="Chờ phản hồi trên trang"
            value={pendingCount}
            tone="pending"
          />
          <BookingMetric
            icon={<CalendarCheck2 aria-hidden="true" />}
            label="Hoàn thành trên trang"
            value={completedCount}
            tone="completed"
          />
          <BookingMetric
            icon={<CircleAlert aria-hidden="true" />}
            label="Có sự cố trên trang"
            value={issueCount}
            tone="issues"
          />
        </section>
        <section className="admin-bookings-table" aria-labelledby="admin-bookings-title">
          <div className="admin-bookings-toolbar">
            <label className="admin-bookings-search">
              <Search aria-hidden="true" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm mã lịch, mentor hoặc mentee..."
                aria-label="Tìm lịch hẹn"
              />
            </label>
            <div>
              <label className="admin-users-status-filter">
                <span>Trạng thái</span>
                <select
                  aria-label="Lọc trạng thái lịch hẹn"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Tất cả</option>
                  {Object.entries(BOOKING_STATUS_MAP).map(([statusKey, config]) => (
                    <option key={statusKey} value={statusKey}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void loadBookings()} disabled={loading}>
                <RefreshCw aria-hidden="true" /> Làm mới
              </button>
            </div>
          </div>
          <div className="admin-bookings-scroll">
            <table>
              <thead>
                <tr>
                  <th id="admin-bookings-title">Lịch hẹn</th>
                  <th>Người tham gia</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <BookingStateRow message="Đang tải danh sách lịch hẹn..." />
                ) : visibleBookings.length ? (
                  visibleBookings.map((booking) => (
                    <BookingRow key={booking.bookingId} booking={booking} />
                  ))
                ) : (
                  <BookingStateRow
                    message={
                      statusFilter || searchTerm
                        ? 'Không tìm thấy lịch hẹn phù hợp.'
                        : 'Chưa có lịch hẹn nào.'
                    }
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
  tone = '',
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <article className={tone}>
      <i>{icon}</i>
      <div>
        <span>{label}</span>
        <strong>{new Intl.NumberFormat('vi-VN').format(value)}</strong>
      </div>
    </article>
  );
}

function BookingStateRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={6} className="admin-users-state">
        <span>{message}</span>
      </td>
    </tr>
  );
}

function BookingRow({ booking }: { booking: AdminBooking }) {
  return (
    <tr>
      <td>
        <b>{booking.bookingId}</b>
        <small>{booking.displayState ? getLabel(booking.displayState) : '—'}</small>
      </td>
      <td>
        <div className="admin-booking-participants">
          <Participant
            avatarUrl={booking.menteeAvatarUrl}
            name={booking.menteeDisplayName}
            role="Mentee"
          />
          <Participant
            avatarUrl={booking.mentorAvatarUrl}
            name={booking.mentorDisplayName}
            role="Mentor"
          />
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
        {booking.issueType && (
          <small className="admin-booking-issue">Sự cố: {getLabel(booking.issueType)}</small>
        )}
      </td>
      <td>
        <span className="admin-booking-payment">{getLabel(booking.paymentStatus)}</span>
        <small>
          {booking.serviceIsFreeSnapshot
            ? 'Miễn phí'
            : `${booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot ?? 0} Scoin`}
        </small>
      </td>
    </tr>
  );
}

function Participant({
  avatarUrl,
  name,
  role,
}: {
  avatarUrl: string | null;
  name: string;
  role: string;
}) {
  return (
    <span className="admin-booking-person">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : <InitialAvatar name={name} />}
      <span>
        <b>{name}</b>
        <small>{role}</small>
      </span>
    </span>
  );
}
