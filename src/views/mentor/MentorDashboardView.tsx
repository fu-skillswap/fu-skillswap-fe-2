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
    <div className="mentor-reference-dashboard">
      <section className="mentor-reference-welcome">
        <h1>
          Chào mừng trở lại, {displayName}{' '}
          <Hand aria-hidden="true" className="mentor-reference-wave" />
        </h1>
        <p>Dưới đây là tổng quan về hoạt động cố vấn của bạn trong tuần này.</p>
      </section>

      {error && (
        <p className="mentor-reference-error" role="alert">
          {error}
        </p>
      )}

      <section className="mentor-reference-metrics" aria-label="Chỉ số hoạt động Mentor">
        <MetricCard icon={<Banknote />} label="Thu nhập tháng này" caption="S-coin" tone="income" />
        <MetricCard
          icon={<CalendarDays />}
          label="Các phiên họp sắp tới"
          caption="chưa có dữ liệu"
          tone="booking"
        />
        <MetricCard
          icon={<Star />}
          label="Đánh giá trung bình"
          caption="chưa có dữ liệu"
          tone="rating"
        />
        <MetricCard
          icon={<Users />}
          label="Tổng số người được hướng dẫn"
          caption="chưa có dữ liệu"
          tone="mentee"
        />
      </section>

      <div className="mentor-reference-grid">
        <section className="mentor-reference-card" aria-labelledby="upcoming-bookings-heading">
          <header>
            <h2 id="upcoming-bookings-heading">Đặt chỗ sắp tới</h2>
            <Link href={`/${locale}/mentor/schedule-manage`}>Xem tất cả</Link>
          </header>
          <EmptyPanel message="Chưa có dữ liệu lịch hẹn sắp tới." />
        </section>

        <section className="mentor-reference-card" aria-labelledby="recent-reviews-heading">
          <header>
            <h2 id="recent-reviews-heading">Đánh giá gần đây</h2>
          </header>
          <EmptyPanel message="Chưa có dữ liệu đánh giá gần đây." />
        </section>
      </div>

      <div className="mentor-reference-grid mentor-reference-bottom-grid">
        <section
          className="mentor-reference-card mentor-reference-actions"
          aria-labelledby="quick-actions-heading"
        >
          <header>
            <h2 id="quick-actions-heading">Hành động nhanh</h2>
          </header>
          <div>
            <Link href={`/${locale}/mentor/schedule-manage`}>
              <Settings aria-hidden="true" />
              <span>Quản lý Dịch vụ &amp; Lịch trình</span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/mentor/my-courses`}>
              <CalendarDays aria-hidden="true" />
              <span>Xem tất cả các đặt phòng</span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/mentor/my-courses`}>
              <FileText aria-hidden="true" />
              <span>Tạo bài đăng mới</span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/mentor/my-courses`}>
              <GraduationCap aria-hidden="true" />
              <span>Thêm Bài học Khóa học</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section
          className="mentor-reference-card mentor-reference-chart"
          aria-labelledby="income-chart-heading"
        >
          <header>
            <h2 id="income-chart-heading">Thu nhập — 7 ngày gần nhất</h2>
          </header>
          <EmptyPanel
            message={loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu thu nhập 7 ngày gần nhất.'}
          />
        </section>
      </div>
    </div>
  );
}

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
    <article className={`mentor-reference-metric ${tone}`}>
      <i>{icon}</i>
      <strong>—</strong>
      <small>{caption}</small>
      <span>{label}</span>
    </article>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return <p className="mentor-reference-empty">{message}</p>;
}
