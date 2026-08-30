/**
 * @file MyBookingsView.tsx
 * @description Màn hình danh sách Booking của tôi (Mentee My Bookings View).
 * Lấy dữ liệu từ API GET /api/me/bookings và hiển thị dạng danh sách thẻ lịch đặt.
 */

'use client';

import Link from 'next/link';
import { Calendar, Clock, FileText, RefreshCw, User, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useMyBookings } from './useMyBookings';
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

function StatusBadge({ status }: { status: string }) {
  const upper = (status || 'PENDING').toUpperCase();

  if (upper === 'CONFIRMED' || upper === 'ACCEPTED') {
    return (
      <span
        className="ui-badge ui-badge-success"
        style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', gap: '6px', fontWeight: '600' }}
      >
        <CheckCircle2 className="w-4 h-4" /> Đã xác nhận
      </span>
    );
  }
  if (upper === 'CANCELLED' || upper === 'REJECTED') {
    return (
      <span
        className="ui-badge ui-badge-danger"
        style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', gap: '6px', fontWeight: '600' }}
      >
        <XCircle className="w-4 h-4" /> Đã hủy
      </span>
    );
  }
  return (
    <span
      className="ui-badge ui-badge-warning"
      style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', gap: '6px', fontWeight: '600' }}
    >
      <AlertCircle className="w-4 h-4" /> Đang chờ
    </span>
  );
}

export function MyBookingsView({ locale }: { locale: string }) {
  const { bookings, totalCount, isLoading, error, activeTab, setActiveTab, refresh } = useMyBookings();
  const { setHeaderTitle } = useMenteeShell();

  useEffect(() => {
    setHeaderTitle('Booking của tôi');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  return (
    <section className="page-shell" style={{ paddingTop: '24px' }}>
      <div className="section-heading" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
            Booking của tôi
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Quản lý và theo dõi trạng thái các buổi tư vấn mentoring đã đặt ({totalCount} booking)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={refresh}
            className="ui-btn ui-btn-outline"
            disabled={isLoading}
            style={{
              height: '42px',
              padding: '0 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              gap: '6px',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <Link
            href={`/${locale}/mentor-booking`}
            className="ui-btn ui-btn-primary"
            style={{
              height: '42px',
              padding: '0 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            + Đặt lịch mới
          </Link>
        </div>
      </div>

      {/* Tabs lọc trạng thái */}
      <div className="ui-tabs-list" style={{ marginBottom: '24px', padding: '6px', borderRadius: '14px', gap: '6px' }}>
        <button
          type="button"
          className={`ui-tab-button ${activeTab === 'ALL' ? 'ui-tab-active' : ''}`}
          onClick={() => setActiveTab('ALL')}
          style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13.5px' }}
        >
          Tất cả ({totalCount})
        </button>
        <button
          type="button"
          className={`ui-tab-button ${activeTab === 'PENDING' ? 'ui-tab-active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
          style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13.5px' }}
        >
          Chờ xác nhận (PENDING)
        </button>
        <button
          type="button"
          className={`ui-tab-button ${activeTab === 'CONFIRMED' ? 'ui-tab-active' : ''}`}
          onClick={() => setActiveTab('CONFIRMED')}
          style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13.5px' }}
        >
          Đã xác nhận
        </button>
        <button
          type="button"
          className={`ui-tab-button ${activeTab === 'CANCELLED' ? 'ui-tab-active' : ''}`}
          onClick={() => setActiveTab('CANCELLED')}
          style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13.5px' }}
        >
          Đã hủy
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="ui-badge ui-badge-danger" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--primary)]" />
          <p>Đang tải danh sách đặt lịch từ hệ thống...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <Calendar className="w-12 h-12 mx-auto text-[var(--text-disabled)] mb-3" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 6px', color: 'var(--text-main)' }}>
            Hiện tại chưa có booking nào
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Không tìm thấy lịch đặt nào từ hệ thống. Hãy chọn Mentor và gửi yêu cầu đặt lịch!
          </p>
          <Link
            href={`/${locale}/mentor-booking`}
            className="ui-btn ui-btn-primary"
            style={{
              height: '42px',
              padding: '0 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            Tìm Mentor ngay
          </Link>
        </div>
      ) : (
        /* Danh sách thẻ Booking */
        <div style={{ display: 'grid', gap: '16px' }}>
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
                <StatusBadge status={item.status} />
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
