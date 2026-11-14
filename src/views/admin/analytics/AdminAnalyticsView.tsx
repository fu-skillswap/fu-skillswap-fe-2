/**
 * @file AdminAnalyticsView.tsx
 * @description Trang "Thống kê truy cập" cho quản trị viên: số liệu hệ thống từ
 * `/api/admin/dashboard/overview` và báo cáo Google Analytics nhúng từ Looker Studio.
 * The browser cannot call the GA Data API securely, so traffic data comes only from the embed.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type { AdminDashboardOverviewResponse } from '@/models/admin';
import { ACTIVE_BOOKING_STATUSES, sumStatuses } from '@/views/admin/dashboard.helpers';
import { adminRepo } from '@/repositories/adminRepo';
import {
  Activity,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  LockKeyhole,
  RefreshCw,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLookerReportConfig } from './lookerEmbed';

const GA_HOME_URL = 'https://analytics.google.com';
const GA_REALTIME_URL = 'https://analytics.google.com/analytics/web/#/realtime';

type OverviewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: AdminDashboardOverviewResponse };

interface Metric {
  label: string;
  description: string;
  value: (data: AdminDashboardOverviewResponse) => number | undefined;
  icon: LucideIcon;
  tone: 'blue' | 'green';
}

const METRICS: Metric[] = [
  {
    label: 'Tổng người dùng',
    description: 'Tài khoản đã đăng ký trên SkillSwap',
    value: (data) => data.users?.total,
    icon: Users,
    tone: 'blue',
  },
  {
    label: 'Người dùng hoạt động',
    description: 'Tài khoản đang hoạt động, chưa bị khóa',
    value: (data) => data.users?.active,
    icon: Activity,
    tone: 'blue',
  },
  {
    label: 'Mentor đang chia sẻ',
    description: 'Mentor đang hoạt động trên nền tảng',
    value: (data) => data.users?.mentor,
    icon: GraduationCap,
    tone: 'green',
  },
  {
    label: 'Lịch hẹn đang hoạt động',
    description: 'Lịch hẹn chưa kết thúc',
    value: (data) => sumStatuses(data.bookings, ACTIVE_BOOKING_STATUSES),
    icon: CalendarDays,
    tone: 'green',
  },
];

const formatNumber = (value?: number) =>
  value === undefined || value === null ? '—' : new Intl.NumberFormat('vi-VN').format(value);

function ExternalButton({ href, children }: { href?: string; children: string }) {
  if (!href) {
    return (
      <button
        type="button"
        className="admin-button secondary"
        disabled
        title="Cần cấu hình báo cáo Looker Studio trước"
      >
        <ExternalLink aria-hidden="true" />
        {children}
      </button>
    );
  }
  return (
    <a className="admin-button secondary" href={href} target="_blank" rel="noopener noreferrer">
      <ExternalLink aria-hidden="true" />
      {children}
      <span className="sr-only"> (mở trong tab mới)</span>
    </a>
  );
}

function SetupGuide({ invalidValue }: { invalidValue?: string }) {
  return (
    <div className="admin-analytics-setup" role="status">
      <div className="admin-analytics-setup-copy">
        <h3>{invalidValue ? 'Đường dẫn báo cáo chưa đúng' : 'Chưa kết nối báo cáo'}</h3>
        <p>
          {invalidValue
            ? 'Biến NEXT_PUBLIC_LOOKER_EMBED_URL phải là đường dẫn https của Looker Studio (lookerstudio.google.com). Kiểm tra lại giá trị rồi triển khai lại.'
            : 'Báo cáo truy cập sẽ hiện ở đây sau khi gắn một báo cáo Looker Studio. Làm theo các bước sau:'}
        </p>
      </div>
      <ol className="admin-analytics-steps">
        <li>
          <strong>Tạo báo cáo</strong>
          <span>
            Mở Looker Studio, tạo báo cáo mới với nguồn dữ liệu Google Analytics 4 của SkillSwap.
          </span>
        </li>
        <li>
          <strong>Bật nhúng báo cáo</strong>
          <span>Vào Tệp → Nhúng báo cáo, bật “Cho phép nhúng báo cáo” rồi sao chép URL nhúng.</span>
        </li>
        <li>
          <strong>Chia sẻ cho quản trị viên</strong>
          <span>Chia sẻ báo cáo cho tài khoản Google của từng quản trị viên (quyền xem).</span>
        </li>
        <li>
          <strong>Khai báo đường dẫn</strong>
          <span>
            Đặt URL vào biến <code>NEXT_PUBLIC_LOOKER_EMBED_URL</code> trong{' '}
            <code>.env.production</code> rồi triển khai lại.
          </span>
        </li>
      </ol>
    </div>
  );
}

function ReportFrame({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="admin-analytics-frame" aria-busy={!loaded}>
      {!loaded && (
        <div className="admin-analytics-frame-loading" role="status">
          <span className="admin-skeleton" />
          <span className="admin-skeleton" />
          <div className="admin-analytics-frame-loading-blocks" aria-hidden="true">
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
          </div>
          <span className="admin-skeleton is-tall" />
          <span className="sr-only">Đang tải báo cáo…</span>
        </div>
      )}
      <iframe
        src={src}
        title="Báo cáo Google Analytics trên Looker Studio"
        allow="fullscreen"
        allowFullScreen
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export function AdminAnalyticsView() {
  const [overview, setOverview] = useState<OverviewState>({ status: 'loading' });
  const looker = useMemo(() => getLookerReportConfig(), []);

  const loadOverview = useCallback(async () => {
    setOverview({ status: 'loading' });
    try {
      setOverview({ status: 'ready', data: await adminRepo.getOverview() });
    } catch {
      setOverview({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return (
    <main className="admin-dashboard admin-analytics-page">
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Quản trị <span>›</span> <b>Thống kê</b>
          </div>
          <AdminTopbarActions />
        </header>

        <div className="admin-page-content">
          <section className="admin-page-heading">
            <div>
              <h1>Thống kê truy cập</h1>
              <p>Lượt truy cập và hành vi người dùng trên SkillSwap, lấy từ Google Analytics.</p>
            </div>
          </section>

          <section aria-labelledby="analytics-system-heading" className="admin-analytics-section">
            <h2 id="analytics-system-heading" className="admin-analytics-section-title">
              Số liệu hệ thống
            </h2>
            {overview.status === 'error' ? (
              <div className="admin-analytics-alert" role="alert">
                <p>Chưa tải được số liệu hệ thống. Báo cáo truy cập bên dưới vẫn dùng được.</p>
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => void loadOverview()}
                >
                  <RefreshCw aria-hidden="true" />
                  Tải lại
                </button>
              </div>
            ) : (
              <div className="admin-metric-grid" aria-busy={overview.status === 'loading'}>
                {METRICS.map(({ label, description, value, icon: Icon, tone }) => (
                  <article key={label} className={`is-${tone}`}>
                    <i>
                      <Icon aria-hidden="true" />
                    </i>
                    <div>
                      <span>{label}</span>
                      {overview.status === 'ready' ? (
                        <strong>{formatNumber(value(overview.data))}</strong>
                      ) : (
                        <strong className="admin-analytics-metric-loading">
                          <span className="admin-skeleton" />
                          <span className="sr-only">Đang tải</span>
                        </strong>
                      )}
                    </div>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            className="admin-panel admin-analytics-report"
            aria-labelledby="analytics-report-heading"
          >
            <header className="admin-panel-heading">
              <h2 id="analytics-report-heading" className="admin-card-title">
                Báo cáo Google Analytics
              </h2>
              <nav className="admin-analytics-links" aria-label="Mở công cụ Google">
                <ExternalButton href={GA_HOME_URL}>Mở Google Analytics</ExternalButton>
                <ExternalButton href={looker.status === 'ready' ? looker.reportUrl : undefined}>
                  Mở Looker Studio
                </ExternalButton>
                <ExternalButton href={GA_REALTIME_URL}>Xem realtime</ExternalButton>
              </nav>
            </header>

            {looker.status === 'ready' ? (
              <>
                <p className="admin-analytics-note">
                  <LockKeyhole aria-hidden="true" />
                  Bạn cần đăng nhập Google bằng tài khoản đã được chia sẻ báo cáo.
                </p>
                <ReportFrame src={looker.embedUrl} />
              </>
            ) : (
              <SetupGuide invalidValue={looker.status === 'invalid' ? looker.value : undefined} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
