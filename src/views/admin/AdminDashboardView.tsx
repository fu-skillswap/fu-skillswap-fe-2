/**
 * @file AdminDashboardView.tsx
 * @description Màn hình tổng quan vận hành dành cho quản trị viên.
 *
 * Data sources (Swagger):
 * - `GET /api/admin/dashboard/overview`     → metric cards (nested users / bookings / reports…)
 * - `GET /api/admin/dashboard/queues`       → "Cần xử lý" list
 * - `GET /api/admin/dashboard/queue-items`  → "Chi tiết hàng đợi"
 * - `GET /api/admin/audit-logs`             → "Hoạt động quản trị gần đây"
 */

'use client';

import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type {
  AdminAuditLogItem,
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
import {
  ACTIVE_BOOKING_STATUSES,
  apiPathToAdminRoute,
  auditEntityToAdminRoute,
  formatRelativeTime,
  getActionLabel,
  getEntityLabel,
  getQueueLabel,
  queueKeyToAdminRoute,
  sumStatuses,
} from './dashboard.helpers';

const RECENT_ACTIVITY_SIZE = 6;

function formatNumber(value?: number | null) {
  return value === undefined || value === null ? '—' : new Intl.NumberFormat('vi-VN').format(value);
}

function getQueueIcon(queueKey: string): LucideIcon {
  const key = queueKey.toLowerCase();
  if (key.startsWith('mentor_verification')) return ClipboardList;
  if (key.includes('report')) return Flag;
  if (key.startsWith('booking')) return CalendarDays;
  return FileText;
}

function getQueueHref(locale: string, queue?: Pick<AdminQueueCardResponse, 'key' | 'targetPath'>) {
  if (!queue) return undefined;
  return apiPathToAdminRoute(locale, queue.targetPath) ?? queueKeyToAdminRoute(locale, queue.key);
}

export function AdminDashboardView() {
  const { locale } = useParams<{ locale: string }>();
  const [overview, setOverview] = useState<AdminDashboardOverviewResponse>();
  const [queues, setQueues] = useState<AdminQueueCardResponse[]>([]);
  const [queueItems, setQueueItems] = useState<AdminQueueItem[]>([]);
  const [activeQueue, setActiveQueue] = useState<AdminQueueKey>();
  const [loading, setLoading] = useState(true);
  const [assigningCase, setAssigningCase] = useState<string>();
  const [queueItemsStatus, setQueueItemsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [auditStatus, setAuditStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResult, queueResult] = await Promise.allSettled([
        adminRepo.getOverview(),
        adminRepo.getQueues(),
      ]);
      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value);
      } else {
        showError(overviewResult.reason, { title: 'Không thể tải số liệu tổng quan' });
      }
      if (queueResult.status === 'fulfilled') {
        const queueCards = Array.isArray(queueResult.value?.items) ? queueResult.value.items : [];
        const sorted = [...queueCards].sort((a, b) => a.priorityOrder - b.priorityOrder);
        setQueues(sorted);
        setActiveQueue(
          (current) => current ?? (sorted.find((queue) => queue.count > 0) ?? sorted[0])?.key,
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQueueItems = useCallback(async () => {
    if (!activeQueue) return;
    setQueueItemsStatus('loading');
    try {
      const page = await adminRepo.getQueueItems({ queueKey: activeQueue, page: 0, size: 4 });
      setQueueItems(Array.isArray(page?.content) ? page.content : []);
      setQueueItemsStatus('ready');
    } catch (reason) {
      setQueueItemsStatus('error');
      showError(reason, { title: 'Không thể tải chi tiết hàng đợi' });
    }
  }, [activeQueue]);

  const loadAuditLogs = useCallback(async () => {
    setAuditStatus('loading');
    try {
      const page = await adminRepo.getAuditLogs({
        page: 0,
        size: RECENT_ACTIVITY_SIZE,
        sortBy: 'createdAt',
        direction: 'DESC',
      });
      setAuditLogs(Array.isArray(page?.content) ? page.content : []);
      setAuditStatus('ready');
    } catch {
      setAuditStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    void loadAuditLogs();
  }, [loadDashboard, loadAuditLogs]);
  useEffect(() => {
    void loadQueueItems();
  }, [loadQueueItems]);

  const assignToMe = async (item: AdminQueueItem) => {
    setAssigningCase(item.caseId);
    try {
      await adminRepo.assignCase(item.caseType, item.caseId);
      await Promise.all([loadQueueItems(), loadDashboard(), loadAuditLogs()]);
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật hàng đợi' });
    } finally {
      setAssigningCase(undefined);
    }
  };

  const adminRoot = `/${locale}/admin`;
  const users = overview?.users;
  const retention = overview?.retention;
  const activeBookings = sumStatuses(overview?.bookings, ACTIVE_BOOKING_STATUSES);
  const underReviewBookings = sumStatuses(overview?.bookings, ['UNDER_REVIEW']);
  const openReports = sumStatuses(overview?.forumReports, ['OPEN']);
  const pendingVerifications = overview?.mentorVerification?.pendingReview;

  const metrics: Array<{
    label: string;
    description: string;
    value?: number;
    icon: LucideIcon;
    tone: string;
    href: string;
  }> = [
    {
      label: 'Hồ sơ chờ duyệt',
      description:
        overview?.mentorVerification?.needsRevision !== undefined
          ? `${formatNumber(overview.mentorVerification.needsRevision)} hồ sơ đang chờ mentor bổ sung`
          : 'Hồ sơ mentor đang chờ xét duyệt',
      value: pendingVerifications,
      icon: ClipboardList,
      tone: 'blue',
      href: `${adminRoot}/mentor-verification`,
    },
    {
      label: 'Người dùng hoạt động',
      description:
        users?.total !== undefined
          ? `Trên tổng ${formatNumber(users.total)} tài khoản` +
            (retention?.mau !== undefined ? ` · MAU ${formatNumber(retention.mau)}` : '')
          : 'Tài khoản đang hoạt động',
      value: users?.active,
      icon: Users,
      tone: 'blue',
      href: `${adminRoot}/users`,
    },
    {
      label: 'Lịch hẹn đang hoạt động',
      description: underReviewBookings
        ? `${formatNumber(underReviewBookings)} lịch hẹn đang khiếu nại`
        : 'Lịch hẹn chưa kết thúc',
      value: activeBookings,
      icon: CalendarDays,
      tone: 'green',
      href: `${adminRoot}/bookings`,
    },
    {
      label: 'Báo cáo đang mở',
      description: 'Báo cáo diễn đàn cần được xử lý',
      value: openReports,
      icon: Flag,
      tone: 'red',
      href: `${adminRoot}/reports`,
    },
  ];

  const activeQueueCard = queues.find((queue) => queue.key === activeQueue);
  const activeQueueHref = getQueueHref(locale, activeQueueCard);
  const firstQueueHref = queues.map((queue) => getQueueHref(locale, queue)).find(Boolean);

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
                onClick={() => void Promise.all([loadDashboard(), loadAuditLogs()])}
                disabled={loading}
              >
                <CirclePlus aria-hidden="true" />
                Tạo thông báo
              </button>
            </div>
          </section>
          <section
            className="admin-metric-grid"
            aria-label="Tổng quan nền tảng"
            aria-busy={loading}
          >
            {metrics.map(({ label, description, value, icon: MetricIcon, tone, href }) => (
              <article key={label} className={`is-${tone} is-clickable`}>
                <i>
                  <MetricIcon aria-hidden="true" />
                </i>
                <div>
                  <span>{label}</span>
                  <strong>{loading && value === undefined ? '…' : formatNumber(value)}</strong>
                </div>
                <p>{description}</p>
                <span className="admin-metric-decoration" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                </span>
                <Link className="admin-metric-link" href={href} aria-label={`Xem ${label}`} />
              </article>
            ))}
          </section>
          <div className="admin-dashboard-columns">
            <section className="admin-panel" id="attention">
              <header className="admin-panel-heading">
                <h2 className="admin-card-title">Cần xử lý</h2>
                <Link href={firstQueueHref ?? `${adminRoot}/mentor-verification`}>
                  Xem tất cả <ArrowRight aria-hidden="true" />
                </Link>
              </header>
              <div className="admin-attention-list">
                {queues.map((queue) => {
                  const QueueIcon = getQueueIcon(queue.key);
                  const href = getQueueHref(locale, queue);
                  return (
                    <div key={queue.key} className={activeQueue === queue.key ? 'is-selected' : ''}>
                      <i>
                        <QueueIcon aria-hidden="true" />
                      </i>
                      <span>
                        <button
                          type="button"
                          className="admin-link-button"
                          onClick={() => setActiveQueue(queue.key)}
                          title="Xem chi tiết hàng đợi bên dưới"
                        >
                          {getQueueLabel(queue.key, queue.label)}
                        </button>
                      </span>
                      <b className={queue.severity === 'high' && queue.count ? 'is-danger' : ''}>
                        {formatNumber(queue.count)}
                      </b>
                      {href ? (
                        <Link href={href}>
                          Xem <ArrowRight aria-hidden="true" />
                        </Link>
                      ) : (
                        <button type="button" onClick={() => setActiveQueue(queue.key)}>
                          Xem <ArrowRight aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {!queues.length && !loading && (
                  <p className="admin-empty-state">Không có mục nào cần xử lý.</p>
                )}
              </div>
            </section>
            <section className="admin-panel" id="reports">
              <header className="admin-panel-heading">
                <h2 className="admin-card-title">Hoạt động quản trị gần đây</h2>
                {/* TODO(api): no admin audit-log screen yet; GET /api/admin/audit-logs is ready for one. */}
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
                  <tbody>
                    {auditStatus === 'loading' ? (
                      <AdminTableState
                        variant="loading"
                        colSpan={4}
                        skeletonRows={4}
                        title="Đang tải hoạt động gần đây…"
                      />
                    ) : auditStatus === 'error' ? (
                      <AdminTableState
                        variant="error"
                        colSpan={4}
                        onRetry={() => void loadAuditLogs()}
                      />
                    ) : !auditLogs.length ? (
                      <AdminTableState
                        variant="empty"
                        colSpan={4}
                        title="Chưa có hoạt động gần đây"
                        description="Khi quản trị viên duyệt hồ sơ, xử lý báo cáo hoặc khóa tài khoản, hoạt động sẽ hiện ở đây."
                      />
                    ) : (
                      auditLogs.map((log) => {
                        const href = auditEntityToAdminRoute(locale, log.entityType, log.entityId);
                        const entityLabel = getEntityLabel(log.entityType);
                        return (
                          <tr key={log.auditLogId}>
                            <td>
                              <i className="status" />
                              {getActionLabel(log.action)}
                            </td>
                            <td>{href ? <Link href={href}>{entityLabel}</Link> : entityLabel}</td>
                            <td>{log.actorDisplayName ?? 'Hệ thống'}</td>
                            <td>{formatRelativeTime(log.createdAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <section className="admin-case-panel" id="queue-details">
            <header className="admin-panel-heading">
              <h2 className="admin-card-title">
                Chi tiết hàng đợi
                {activeQueueCard
                  ? ` · ${getQueueLabel(activeQueueCard.key, activeQueueCard.label)}`
                  : ''}
              </h2>
              {!!activeQueueHref && (
                <Link href={activeQueueHref}>
                  Xem tất cả <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </header>
            {queueItemsStatus === 'loading' ? (
              <div className="admin-queue-empty" role="status">
                <i>
                  <Inbox aria-hidden="true" />
                </i>
                <strong>Đang tải hàng đợi…</strong>
              </div>
            ) : queueItemsStatus === 'error' ? (
              <div className="admin-queue-empty" role="alert">
                <i>
                  <Inbox aria-hidden="true" />
                </i>
                <strong>Không thể tải hàng đợi</strong>
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => void loadQueueItems()}
                >
                  Thử lại
                </button>
              </div>
            ) : queueItems.length ? (
              <div className="admin-queue-detail-list">
                {queueItems.map((item) => {
                  const detailHref =
                    apiPathToAdminRoute(locale, item.detailPath) ??
                    queueKeyToAdminRoute(locale, item.queueKey ?? activeQueue);
                  return (
                    <article key={item.caseId}>
                      <i>
                        <Inbox aria-hidden="true" />
                      </i>
                      <div>
                        <strong>
                          {detailHref ? <Link href={detailHref}>{item.title}</Link> : item.title}
                        </strong>
                        <span>
                          {item.subtitle ? `${item.subtitle} · ` : ''}
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <span>{item.assignedAdminDisplayName ?? 'Chưa phân công'}</span>
                      {!item.assignedAdminUserId && (
                        <button
                          type="button"
                          onClick={() => void assignToMe(item)}
                          disabled={assigningCase === item.caseId}
                        >
                          Nhận xử lý
                        </button>
                      )}
                    </article>
                  );
                })}
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
