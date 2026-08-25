/**
 * @file AdminDashboardView.tsx
 * @description Màn hình tổng quan vận hành dành cho quản trị viên.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type {
  AdminDashboardOverviewResponse,
  AdminQueueCardResponse,
  AdminQueueItem,
  AdminQueueKey,
} from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

type IconName =
  | 'bell'
  | 'booking'
  | 'clipboard'
  | 'flag'
  | 'grid'
  | 'report'
  | 'search'
  | 'settings'
  | 'shield'
  | 'users';

const iconPaths: Record<IconName, ReactNode> = {
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  booking: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M12 14v3" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5V3h6v2M9 11h6M9 15h6" />
    </>
  ),
  flag: <path d="M5 21V4m0 1h11l-1 4 1 4H5" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  report: (
    <>
      <path d="M3 21V3h18v12H8z" />
      <path d="m10 15 2-2 2 1 3-4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3.5-10 2.2 2.2 4.8-4.8" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
};

const iconComponents: Record<IconName, LucideIcon> = {
  bell: Bell,
  booking: CalendarDays,
  clipboard: ClipboardList,
  flag: Flag,
  grid: LayoutDashboard,
  report: ClipboardList,
  search: Search,
  settings: Settings,
  shield: ShieldCheck,
  users: Users,
};

function Icon({ name }: { name: IconName }) {
  const Component = iconComponents[name];
  return <Component aria-hidden="true" className="admin-icon" />;
}

function formatNumber(value?: number) {
  return value === undefined ? '—' : new Intl.NumberFormat('vi-VN').format(value);
}

function formatTime(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 60
    ? `${minutes}m ago`
    : minutes < 1440
      ? `${Math.round(minutes / 60)}h ago`
      : `${Math.round(minutes / 1440)}d ago`;
}

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError ? reason.message : 'Không thể tải dữ liệu quản trị.';
}

const queueIcon: Record<AdminQueueKey, IconName> = {
  MENTOR_VERIFICATION: 'clipboard',
  FORUM_REPORT: 'report',
  BOOKING_DISPUTE: 'booking',
  PAYOUT_REQUEST: 'flag',
  FAILED_PAYMENT_ORDER: 'flag',
  EMAIL_OUTBOX_DEAD_LETTER: 'report',
};

export function AdminDashboardView() {
  const { locale } = useParams<{ locale: string }>();
  const [overview, setOverview] = useState<AdminDashboardOverviewResponse>();
  const [queues, setQueues] = useState<AdminQueueCardResponse[]>([]);
  const [queueItems, setQueueItems] = useState<AdminQueueItem[]>([]);
  const [activeQueue, setActiveQueue] = useState<AdminQueueKey>();
  const [mentorVerificationCount, setMentorVerificationCount] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [assigningCase, setAssigningCase] = useState<string>();
  const [error, setError] = useState<string>();
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [overviewResult, queueResult] = await Promise.allSettled([
        adminRepo.getOverview(),
        adminRepo.getQueues(),
      ]);
      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value);
      }
      if (queueResult.status === 'fulfilled') {
        const queueCards = Array.isArray(queueResult.value.queues) ? queueResult.value.queues : [];
        const sorted = [...queueCards].sort((a, b) => a.priorityOrder - b.priorityOrder);
        setQueues(sorted);
        setActiveQueue((current) => current ?? sorted[0]?.queueKey);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  const loadMentorVerificationSummary = useCallback(async () => {
    try {
      const response = await adminRepo.getMentorVerificationRequests({ page: 0, size: 1 });
      setMentorVerificationCount(response.totalElements);
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  }, []);
  const loadQueueItems = useCallback(async () => {
    if (!activeQueue) return;
    try {
      const page = await adminRepo.getQueueItems({ queueKey: activeQueue, page: 0, size: 4 });
      setQueueItems(page.content);
    } catch (reason) {
      setError(getErrorMessage(reason));
    }
  }, [activeQueue]);
  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    void loadMentorVerificationSummary();
  }, [loadMentorVerificationSummary]);
  useEffect(() => {
    void loadQueueItems();
  }, [loadQueueItems]);

  useEffect(() => {
    if (!error) return;

    const timer = window.setTimeout(() => setError(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);
  const assignToMe = async (item: AdminQueueItem) => {
    setAssigningCase(item.caseId);
    try {
      await adminRepo.assignCase(item.caseType, item.caseId);
      await loadQueueItems();
      await loadDashboard();
      await loadMentorVerificationSummary();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setAssigningCase(undefined);
    }
  };
  const metrics: Array<{ label: string; value?: number; icon: IconName; tone?: string }> = [
    {
      label: 'Hồ sơ chờ duyệt',
      value: mentorVerificationCount ?? overview?.pendingMentorVerifications,
      icon: 'clipboard',
    },
    { label: 'Người dùng hoạt động', value: overview?.activeUsers, icon: 'users' },
    { label: 'Lịch hẹn đang hoạt động', value: overview?.activeBookings, icon: 'booking' },
    {
      label: 'Báo cáo đang mở',
      value: overview?.pendingForumReports,
      icon: 'flag',
      tone: 'danger',
    },
  ];
  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/images/SkillSwapLogo.png" alt="SkillSwap" />
          <div>
            <strong>
              SkillSwap
              <br />
              Admin
            </strong>
            <span>
              Academic
              <br />
              Management
            </span>
          </div>
        </div>
        <nav aria-label="Điều hướng quản trị">
          <a className="is-active" href="#overview">
            <Icon name="grid" />
            Tổng quan
          </a>
          <Link href={`/${locale}/admin/mentor-verification`}>
            <Icon name="shield" />
            Xác minh mentor
          </Link>
          <a href="#users">
            <Icon name="users" />
            Người dùng
          </a>
          <a href="#bookings">
            <Icon name="booking" />
            Lịch hẹn
          </a>
          <a href="#reports">
            <Icon name="report" />
            Đánh giá &amp; báo cáo
          </a>
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer">
            ↗ <span>Xem SkillSwap</span>
          </a>
          <a href="#profile">
            ◎ <span>Hồ sơ</span>
          </a>
        </div>
      </aside>
      <div className="admin-workspace" id="overview">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Quản trị <span>›</span> <b>Tổng quan</b>
          </div>
          <AdminTopbarActions />
        </header>
        <div className="admin-page-content">
          <section className="admin-page-heading">
            <div>
              <h1>Tổng quan</h1>
              <p>Theo dõi hoạt động nền tảng và các mục cần được xử lý.</p>
            </div>
            <div>
              <button
                className="admin-button secondary"
                type="button"
                onClick={() => window.print()}
              >
                Xuất báo cáo
              </button>
              <button
                className="admin-button primary"
                type="button"
                onClick={() => void Promise.all([loadDashboard(), loadMentorVerificationSummary()])}
                disabled={loading}
              >
                Tạo thông báo
              </button>
            </div>
          </section>
          {error && (
            <div className="admin-dashboard-toast" role="alert">
              <span>{error}</span>
              <button
                type="button"
                aria-label="Đóng thông báo lỗi"
                onClick={() => setError(undefined)}
              >
                ×
              </button>
            </div>
          )}
          <section className="admin-metric-grid" aria-label="Platform overview">
            {metrics.map((metric) => (
              <article key={metric.label}>
                <span>{metric.label}</span>
                <i className={metric.tone}>
                  <Icon name={metric.icon} />
                </i>
                <strong>{formatNumber(metric.value)}</strong>
              </article>
            ))}
          </section>
          <div className="admin-dashboard-columns">
            <section className="admin-panel" id="attention">
              <h2>Cần xử lý</h2>
              <div className="admin-attention-list">
                {mentorVerificationCount !== undefined && (
                  <div>
                    <Icon name="clipboard" />
                    <span>Hồ sơ mentor chờ duyệt</span>
                    <b>{formatNumber(mentorVerificationCount)}</b>
                    <Link href={`/${locale}/admin/mentor-verification`}>Xem</Link>
                  </div>
                )}
                {queues.slice(0, 4).map((queue) => (
                  <div
                    key={queue.queueKey}
                    className={activeQueue === queue.queueKey ? 'is-selected' : ''}
                  >
                    <Icon name={queueIcon[queue.queueKey]} />
                    <span>{queue.title}</span>
                    <b className={queue.slaBreachCount ? 'is-danger' : ''}>
                      {formatNumber(queue.pendingCount)}
                    </b>
                    <button type="button" onClick={() => setActiveQueue(queue.queueKey)}>
                      Xem
                    </button>
                  </div>
                ))}
                {!queues.length && mentorVerificationCount === undefined && (
                  <p className="admin-empty-state">Không có mục nào cần xử lý.</p>
                )}
              </div>
            </section>
            <section className="admin-panel" id="reports">
              <h2>Hoạt động quản trị gần đây</h2>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hoạt động</th>
                      <th>Đối tượng</th>
                      <th>Quản trị viên</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueItems.map((item) => (
                      <tr key={item.caseId}>
                        <td>
                          <i
                            className={item.slaRemainingMinutes < 0 ? 'status danger' : 'status'}
                          />
                          {item.title}
                        </td>
                        <td>{item.caseType}</td>
                        <td>{item.assignedAdminEmail ?? 'Chưa phân công'}</td>
                        <td>{formatTime(item.submittedAt)}</td>
                      </tr>
                    ))}
                    {!queueItems.length && (
                      <tr>
                        <td colSpan={4}>Chưa có hoạt động gần đây.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <section className="admin-case-panel">
            <div>
              <h2>
                {queues.find((queue) => queue.queueKey === activeQueue)?.title ??
                  'Chi tiết hàng đợi'}
              </h2>
              <span>Hiển thị {queueItems.length} hồ sơ</span>
            </div>
            {queueItems.some((item) => !item.assignedAdminEmail) && (
              <div className="admin-case-actions">
                {queueItems
                  .filter((item) => !item.assignedAdminEmail)
                  .map((item) => (
                    <button
                      key={item.caseId}
                      type="button"
                      onClick={() => void assignToMe(item)}
                      disabled={assigningCase === item.caseId}
                    >
                      Nhận xử lý: {item.title}
                    </button>
                  ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
