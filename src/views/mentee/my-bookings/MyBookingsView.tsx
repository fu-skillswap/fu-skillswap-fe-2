/**
 * @file MyBookingsView.tsx
 * @description Màn hình danh sách Booking của tôi (Mentee My Bookings View).
 * Lấy dữ liệu từ API GET /api/me/bookings và hiển thị dạng danh sách thẻ lịch đặt.
 */

'use client';

import Link from 'next/link';
import { Calendar, Clock, FileText, RefreshCw, User, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { FILTER_TABS, useMyBookings } from './useMyBookings';
import { BookingStatusBadge } from '@/components/ui/BookingStatusBadge';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { useEffect } from 'react';

function formatDateTimeRange(startAt?: string, endAt?: string) {
  if (!startAt) return '—';
  try {
    const trimmed = String(startAt).trim();
    const hasOffset = /[+-]\d{2}:\d{2}$/.test(trimmed);
    const isoCandidate = trimmed.includes('Z') || hasOffset ? trimmed : `${trimmed}Z`;
    const startD = new Date(isoCandidate);
    if (isNaN(startD.getTime())) return startAt;

    const dateStr = startD.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const startTime = startD.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (endAt) {
      const endTrimmed = String(endAt).trim();
      const endHasOffset = /[+-]\d{2}:\d{2}$/.test(endTrimmed);
      const endIsoCandidate = endTrimmed.includes('Z') || endHasOffset ? endTrimmed : `${endTrimmed}Z`;
      const endD = new Date(endIsoCandidate);
      if (!isNaN(endD.getTime())) {
        const endTime = endD.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${dateStr} · ${startTime} – ${endTime}`;
      }
    }
    return `${dateStr} · ${startTime}`;
  } catch {
    return startAt;
  }
}

export function MyBookingsView({ locale }: { locale: string }) {
  const { bookings, totalCount, counts, isLoading, error, activeTab, setActiveTab, refresh } = useMyBookings();
  const { setHeaderTitle } = useMenteeShell();

  useEffect(() => {
    setHeaderTitle('Booking của tôi');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-main m-0">
            Booking của tôi
          </h1>
          <p className="text-xs text-text-muted mt-1 m-0">
            Quản lý và theo dõi trạng thái các buổi tư vấn mentoring đã đặt ({totalCount} booking)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            className="h-10 px-4 rounded-xl border border-solid border-border-color bg-white hover:bg-surface-subtle text-text-secondary font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <Link
            href={`/${locale}/mentor-booking`}
            className="h-10 px-5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center justify-center text-center cursor-pointer"
          >
            + Đặt lịch mới
          </Link>
        </div>
      </header>

      {/* Tabs lọc trạng thái */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-solid border-border-light shadow-xs overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const count = counts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              type="button"
              key={tab.key}
              className={`h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border border-solid cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-primary-light border-primary-border text-primary font-bold shadow-xs'
                  : 'bg-surface-subtle border-transparent text-text-secondary hover:text-text-main hover:bg-slate-200/50'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-soft border border-solid border-red-200 text-danger text-xs font-medium" role="alert">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-muted">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          <p>Đang tải danh sách đặt lịch từ hệ thống...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-solid border-border-light shadow-xs flex flex-col items-center gap-3">
          <Calendar className="w-12 h-12 text-text-disabled mb-1" />
          <h3 className="text-base font-bold text-text-main m-0">
            Hiện tại chưa có booking nào
          </h3>
          <p className="text-xs text-text-muted m-0">
            Không tìm thấy lịch đặt nào từ hệ thống. Hãy chọn Mentor và gửi yêu cầu đặt lịch!
          </p>
          <Link
            href={`/${locale}/mentor-booking`}
            className="mt-2 h-10 px-6 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center justify-center"
          >
            Tìm Mentor ngay
          </Link>
        </div>
      ) : (
        /* Danh sách thẻ Booking */
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Card Top: Avatar Mentor + Service Title + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {item.mentorAvatarUrl ? (
                    <img
                      src={item.mentorAvatarUrl}
                      alt={item.mentorDisplayName || item.mentorName || 'Mentor'}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: '700',
                      }}
                    >
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {item.serviceTitle || item.serviceName || 'Dịch vụ tư vấn Mentoring'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Mentor: <strong>{item.mentorDisplayName || item.mentorName || 'Mentor'}</strong>
                    </p>
                  </div>
                </div>
                <BookingStatusBadge status={item.bookingStatus || item.status} />
              </div>

              {/* Time & Duration row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--surface-subtle)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.875rem',
                  color: 'var(--text-main)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <Calendar className="w-4 h-4 text-[var(--primary)]" />
                  <span>
                    {formatDateTimeRange(
                      item.selectedStartTime || item.startAt || item.startsAt,
                      item.selectedEndTime || item.endAt || item.endsAt,
                    )}
                  </span>
                </div>
                {item.durationMinutes && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.durationMinutes} phút</span>
                  </div>
                )}
              </div>

              {/* Goal Title & Description */}
              {(item.learningGoalTitle || item.learningGoalDescription) && (
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    <FileText className="w-4.5 h-4.5 text-[var(--primary)] flex-shrink-0" />
                    <span>{item.learningGoalTitle || 'Mục tiêu học tập'}</span>
                  </div>
                  {item.learningGoalDescription && (
                    <p style={{ margin: '6px 0 0 26px', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
                      {item.learningGoalDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
