/**
 * @file AdminDashboardView.tsx
 * @description Màn hình tổng quan vận hành dành cho quản trị viên.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type {
  AdminDashboardOverviewResponse,
  AdminQueueCardResponse,
  AdminQueueItem,
  AdminQueueKey,
} from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { showError } from '@/utils/toast';
import {
  ArrowRight,
  CalendarDays,
  CirclePlus,
  ClipboardClock,
  ClipboardList,
  FileText,
  Flag,
  Inbox,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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

const queueIcon: Record<AdminQueueKey, LucideIcon> = {
  MENTOR_VERIFICATION: ClipboardList,
  FORUM_REPORT: Flag,
  BOOKING_DISPUTE: CalendarDays,
  PAYOUT_REQUEST: FileText,
  FAILED_PAYMENT_ORDER: FileText,
  EMAIL_OUTBOX_DEAD_LETTER: FileText,
};

function getQueueHref(locale: string, queueKey?: AdminQueueKey) {
  if (queueKey === 'MENTOR_VERIFICATION') return `/${locale}/admin/mentor-verification`;
  if (queueKey === 'FORUM_REPORT') return `/${locale}/admin/reports`;
  if (queueKey === 'BOOKING_DISPUTE') return `/${locale}/admin/bookings`;
  return `/${locale}/admin/dashboard#queue-details`;
}

export function AdminDashboardView() {
  const { locale } = useParams<{ locale: string }>();
  const [overview, setOverview] = useState<AdminDashboardOverviewResponse>();
  const [queues, setQueues] = useState<AdminQueueCardResponse[]>([]);
  const [queueItems, setQueueItems] = useState<AdminQueueItem[]>([]);
  const [activeQueue, setActiveQueue] = useState<AdminQueueKey>();
  const [mentorVerificationCount, setMentorVerificationCount] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [assigningCase, setAssigningCase] = useState<string>();
  const loadDashboard = useCallback(async () => {
    setLoading(true);
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
      showError(reason, { title: 'Không thể tải dữ liệu quản trị' });
    }
  }, []);
  const loadQueueItems = useCallback(async () => {
    if (!activeQueue) return;
    try {
      const page = await adminRepo.getQueueItems({ queueKey: activeQueue, page: 0, size: 4 });
      setQueueItems(page.content);
    } catch (reason) {
      showError(reason, { title: 'Không thể tải dữ liệu xác minh' });
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

  const assignToMe = async (item: AdminQueueItem) => {
    setAssigningCase(item.caseId);
    try {
      await adminRepo.assignCase(item.caseType, item.caseId);
      await loadQueueItems();
      await loadDashboard();
      await loadMentorVerificationSummary();
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật hàng đợi' });
    } finally {
      setAssigningCase(undefined);
    }
  };
  const metrics: Array<{
    label: string;
    description: string;
    value?: number;
    icon: LucideIcon;
    tone: string;
  }> = [
    {
      label: 'Hồ sơ chờ duyệt',
      description: 'Hồ sơ mentor đang chờ xét duyệt',
      value: mentorVerificationCount ?? overview?.pendingMentorVerifications,
      icon: ClipboardList,
      tone: 'blue',
    },
    {
      label: 'Người dùng hoạt động',
      description: 'Người dùng đăng nhập gần đây',
      value: overview?.activeUsers,
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Lịch hẹn đang hoạt động',
      description: 'Các buổi mentoring sắp diễn ra',
      value: overview?.activeBookings,
      icon: CalendarDays,
      tone: 'green',
    },
    {
      label: 'Báo cáo đang mở',
      description: 'Báo cáo cần được xử lý',
      value: overview?.pendingForumReports,
      icon: Flag,
      tone: 'red',
    },
  ];
  return (
    <main className="admin-dashboard">
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
                <FileText aria-hidden="true" />
                Xuất báo cáo
              </button>
              <button
                className="admin-button primary"
                type="button"
                onClick={() => void Promise.all([loadDashboard(), loadMentorVerificationSummary()])}
                disabled={loading}
              >
                <CirclePlus aria-hidden="true" />
                Tạo thông báo
              </button>
            </div>
          </section>
          <section className="admin-metric-grid" aria-label="Tổng quan nền tảng">
            {metrics.map(({ label, description, value, icon: MetricIcon, tone }) => (
              <article key={label} className={`is-${tone}`}>
                <i>
                  <MetricIcon aria-hidden="true" />
                </i>
                <div>
                  <span>{label}</span>
                  <strong>{formatNumber(value)}</strong>
                </div>
                <p>{description}</p>
                <span className="admin-metric-decoration" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                </span>
              </article>
            ))}
          </section>
          <div className="admin-dashboard-columns">
            <section className="admin-panel" id="attention">
              <header className="admin-panel-heading">
                <h2>Cần xử lý</h2>
                <Link href={`/${locale}/admin/mentor-verification`}>
                  Xem tất cả <ArrowRight aria-hidden="true" />
                </Link>
              </header>
              <div className="admin-attention-list">
                {mentorVerificationCount !== undefined && (
                  <div>
                    <i>
                      <ClipboardList aria-hidden="true" />
                    </i>
                    <span>Hồ sơ mentor chờ duyệt</span>
                    <b>{formatNumber(mentorVerificationCount)}</b>
                    <Link href={`/${locale}/admin/mentor-verification`}>
                      Xem <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                )}
                {queues
                  .filter((queue) => queue.queueKey !== 'MENTOR_VERIFICATION')
                  .slice(0, 3)
                  .map((queue) => {
                    const QueueIcon = queueIcon[queue.queueKey];
                    return (
                      <div
                        key={queue.queueKey}
                        className={activeQueue === queue.queueKey ? 'is-selected' : ''}
                      >
                        <i>
                          <QueueIcon aria-hidden="true" />
                        </i>
                        <span>{queue.title}</span>
                        <b className={queue.slaBreachCount ? 'is-danger' : ''}>
                          {formatNumber(queue.pendingCount)}
                        </b>
                        <button type="button" onClick={() => setActiveQueue(queue.queueKey)}>
                          Xem <ArrowRight aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                {!queues.length && mentorVerificationCount === undefined && (
                  <p className="admin-empty-state">Không có mục nào cần xử lý.</p>
                )}
              </div>
            </section>
            <section className="admin-panel" id="reports">
              <header className="admin-panel-heading">
                <h2>Hoạt động quản trị gần đây</h2>
                <Link href={getQueueHref(locale, activeQueue)}>
                  Xem tất cả <ArrowRight aria-hidden="true" />
                </Link>
              </header>
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
                  {!!queueItems.length && (
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
                    </tbody>
                  )}
                </table>
                {!queueItems.length && (
                  <div className="admin-dashboard-empty">
                    <i>
                      <ClipboardClock aria-hidden="true" />
                    </i>
                    <strong>Chưa có hoạt động gần đây.</strong>
                    <span>Các hoạt động quản trị sẽ được hiển thị tại đây.</span>
                  </div>
                )}
              </div>
            </section>
          </div>
          <section className="admin-case-panel" id="queue-details">
            <header className="admin-panel-heading">
              <h2>Chi tiết hàng đợi</h2>
              {!!activeQueue && (
                <Link href={getQueueHref(locale, activeQueue)}>
                  Xem tất cả <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </header>
            {queueItems.length ? (
              <div className="admin-queue-detail-list">
                {queueItems.map((item) => (
                  <article key={item.caseId}>
                    <i>
                      <Inbox aria-hidden="true" />
                    </i>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.caseType} · {formatTime(item.submittedAt)}
                      </span>
                    </div>
                    <span>{item.assignedAdminEmail ?? 'Chưa phân công'}</span>
                    {!item.assignedAdminEmail && (
                      <button
                        type="button"
                        onClick={() => void assignToMe(item)}
                        disabled={assigningCase === item.caseId}
                      >
                        Nhận xử lý
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-queue-empty">
                <i>
                  <Inbox aria-hidden="true" />
                </i>
                <strong>Hiển thị 0 hồ sơ</strong>
                <span>Không có hồ sơ nào trong hàng đợi xử lý.</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
