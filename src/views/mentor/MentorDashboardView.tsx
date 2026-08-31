/**
 * @file MentorDashboardView.tsx
 * @description Bảng điều khiển dành cho Mentor.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { MentorProfileResponse } from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  FileText,
  GraduationCap,
  Hand,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

type MetricTone = 'income' | 'booking' | 'rating' | 'mentee';

export function MentorDashboardView({ locale }: { locale: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfileResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void mentorProfileRepo
      .get(true)
      .then(setProfile)
      .catch((reason) =>
        setError(
          reason instanceof ApiClientError
            ? reason.message
            : 'Không thể tải thông tin hồ sơ Mentor.',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.displayName || user?.fullName || 'Mentor';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main flex items-center gap-2 m-0">
          Chào mừng trở lại, {displayName}{' '}
          <Hand aria-hidden="true" className="w-7 h-7 text-amber-500 animate-bounce" />
        </h1>
        <p className="text-sm text-text-secondary m-0">Dưới đây là tổng quan về hoạt động cố vấn của bạn trong tuần này.</p>
      </section>

      {error && (
        <p className="p-4 rounded-2xl bg-danger-soft border border-solid border-red-200 text-danger text-xs font-medium" role="alert">
          {error}
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Chỉ số hoạt động Mentor">
        <MetricCard icon={<Banknote className="w-5 h-5 text-emerald-600" />} label="Thu nhập tháng này" caption="S-coin" tone="income" />
        <MetricCard
          icon={<CalendarDays className="w-5 h-5 text-sky-600" />}
          label="Các phiên họp sắp tới"
          caption="chưa có dữ liệu"
          tone="booking"
        />
        <MetricCard
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Đánh giá trung bình"
          caption="chưa có dữ liệu"
          tone="rating"
        />
        <MetricCard
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          label="Tổng số người được hướng dẫn"
          caption="chưa có dữ liệu"
          tone="mentee"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4" aria-labelledby="upcoming-bookings-heading">
          <header className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-main m-0" id="upcoming-bookings-heading">Đặt chỗ sắp tới</h2>
            <Link href={`/${locale}/mentor/schedule-manage`} className="text-xs font-semibold text-primary hover:underline">Xem tất cả</Link>
          </header>
          <EmptyPanel message="Chưa có dữ liệu lịch hẹn sắp tới." />
        </section>

        <section className="bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4" aria-labelledby="recent-reviews-heading">
          <header className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-main m-0" id="recent-reviews-heading">Đánh giá gần đây</h2>
          </header>
          <EmptyPanel message="Chưa có dữ liệu đánh giá gần đây." />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4"
          aria-labelledby="quick-actions-heading"
        >
          <header>
            <h2 className="text-base font-bold text-text-main m-0" id="quick-actions-heading">Hành động nhanh</h2>
          </header>
          <div className="grid grid-cols-1 gap-2.5">
            <Link href={`/${locale}/mentor/schedule-manage`} className="flex items-center justify-between p-3.5 rounded-xl border border-solid border-border-color hover:border-primary-border hover:bg-primary-light/50 text-text-main hover:text-primary font-medium text-xs transition-all group">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
                <span>Quản lý Dịch vụ &amp; Lịch trình</span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/mentor/my-courses`} className="flex items-center justify-between p-3.5 rounded-xl border border-solid border-border-color hover:border-primary-border hover:bg-primary-light/50 text-text-main hover:text-primary font-medium text-xs transition-all group">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
                <span>Xem tất cả các đặt phòng</span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/mentor/my-courses`} className="flex items-center justify-between p-3.5 rounded-xl border border-solid border-border-color hover:border-primary-border hover:bg-primary-light/50 text-text-main hover:text-primary font-medium text-xs transition-all group">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
                <span>Tạo bài đăng mới</span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/mentor/my-courses`} className="flex items-center justify-between p-3.5 rounded-xl border border-solid border-border-color hover:border-primary-border hover:bg-primary-light/50 text-text-main hover:text-primary font-medium text-xs transition-all group">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
                <span>Thêm Bài học Khóa học</span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section
          className="bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs flex flex-col gap-4"
          aria-labelledby="income-chart-heading"
        >
          <header>
            <h2 className="text-base font-bold text-text-main m-0" id="income-chart-heading">Thu nhập — 7 ngày gần nhất</h2>
          </header>
          <EmptyPanel
            message={loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu thu nhập 7 ngày gần nhất.'}
          />
        </section>
      </div>
    </div>
  );
}

const toneStyles: Record<MetricTone, string> = {
  income: 'border-l-4 border-l-emerald-500',
  booking: 'border-l-4 border-l-sky-500',
  rating: 'border-l-4 border-l-amber-500',
  mentee: 'border-l-4 border-l-indigo-500',
};

function MetricCard({
  icon,
  label,
  caption,
  tone,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
  tone: MetricTone;
}) {
  return (
    <article className={`p-5 rounded-2xl border border-solid border-border-light bg-white flex flex-col gap-2 shadow-xs ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between">
        <i className="not-italic w-9 h-9 rounded-xl flex items-center justify-center bg-surface-subtle">{icon}</i>
        <small className="text-[11px] text-text-muted font-medium">{caption}</small>
      </div>
      <strong className="text-2xl font-black text-text-main">—</strong>
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
    </article>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return <p className="p-8 text-center text-xs text-text-muted bg-surface-subtle rounded-2xl border border-dashed border-border-color m-0">{message}</p>;
}
