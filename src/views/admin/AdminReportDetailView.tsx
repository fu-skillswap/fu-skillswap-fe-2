/**
 * @file AdminReportDetailView.tsx
 * @description Chi tiết và quyền xử lý một báo cáo nội dung cộng đồng.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { ApiClientError } from '@/models/apiClient';
import type { AdminCaseActivity, AdminCaseOwnership, AdminForumReport } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { showError } from '@/utils/toast';
import { ArrowLeft, ClipboardCheck, LoaderCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const caseType = 'FORUM_REPORT';

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError ? reason.message : 'Không thể tải chi tiết báo cáo.';
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function labelOf(value: string) {
  const labels: Record<string, string> = {
    OPEN: 'Đang mở',
    RESOLVED_NO_ACTION: 'Đã xử lý, không tác động',
    RESOLVED_ACTION_TAKEN: 'Đã xử lý',
    DISMISSED: 'Đã bỏ qua',
    POST: 'Bài viết',
    COMMENT: 'Bình luận',
  };
  return labels[value] ?? value.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

export function AdminReportDetailView({ locale, reportId }: { locale: string; reportId: string }) {
  const [report, setReport] = useState<AdminForumReport>();
  const [ownership, setOwnership] = useState<AdminCaseOwnership>();
  const [activity, setActivity] = useState<AdminCaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>();

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [reportResult, ownershipResult, activityResult] = await Promise.all([
        adminRepo.getForumReport(reportId),
        adminRepo.getCaseOwnership(caseType, reportId),
        adminRepo.getCaseActivity(caseType, reportId, {
          page: 0,
          size: 20,
          sortBy: 'occurredAt',
          direction: 'DESC',
        }),
      ]);
      setReport(reportResult);
      setOwnership(ownershipResult);
      setActivity(activityResult.content);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => void loadDetail(), [loadDetail]);

  const updateOwnership = async () => {
    setUpdating(true);
    setError(undefined);
    try {
      const result = ownership?.assigned
        ? await adminRepo.unassignCase(caseType, reportId)
        : await adminRepo.assignCase(caseType, reportId);
      setOwnership(result);
      const latestActivity = await adminRepo.getCaseActivity(caseType, reportId, {
        page: 0,
        size: 20,
        sortBy: 'occurredAt',
        direction: 'DESC',
      });
      setActivity(latestActivity.content);
    } catch (reason) {
      showError(reason, { title: 'Không thể cập nhật báo cáo' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <main className="admin-report-detail-state">
        <LoaderCircle aria-hidden="true" /> Đang tải chi tiết báo cáo...
      </main>
    );
  if (!report)
    return (
      <main className="admin-report-detail-state">
        <p>{error ?? 'Không tìm thấy báo cáo.'}</p>
        <Link href={`/${locale}/admin/reports`}>Quay lại danh sách báo cáo</Link>
      </main>
    );

  return (
    <main className="admin-report-detail-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span>{' '}
          <Link href={`/${locale}/admin/reports`}>Đánh giá &amp; báo cáo</Link> <span>›</span>{' '}
          <b>Chi tiết</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-report-detail-content">
        <Link className="admin-user-back-link" href={`/${locale}/admin/reports`}>
          <ArrowLeft aria-hidden="true" /> Quay lại danh sách báo cáo
        </Link>
        <div className="admin-report-detail-title">
          <h1>Báo cáo nội dung</h1>
          <span
            className={`admin-report-status ${report.status.toLowerCase().replaceAll('_', '-')}`}
          >
            {labelOf(report.status)}
          </span>
        </div>
        <div className="admin-report-detail-grid">
          <div>
            <section className="admin-report-card">
              <h2>Thông tin báo cáo</h2>
              <dl className="admin-report-fields">
                <div>
                  <dt>Loại nội dung</dt>
                  <dd>{labelOf(report.targetType)}</dd>
                </div>
                <div>
                  <dt>Người báo cáo</dt>
                  <dd>{report.reporterFullName ?? 'Không xác định'}</dd>
                </div>
                <div>
                  <dt>Lý do</dt>
                  <dd>{labelOf(report.reasonType)}</dd>
                </div>
                <div>
                  <dt>Gửi lúc</dt>
                  <dd>{formatDate(report.createdAt)}</dd>
                </div>
              </dl>
            </section>
            <section className="admin-report-card admin-report-reason">
              <h2>Lý do và mô tả</h2>
              <p>{report.description ?? 'Người dùng không cung cấp mô tả bổ sung.'}</p>
            </section>
            <section className="admin-report-card">
              <h2>Nội dung bị báo cáo</h2>
              <div className="admin-report-content">
                <h3>{report.targetTitle ?? 'Không có tiêu đề'}</h3>
                <p>{report.targetContentPreview ?? 'Không có nội dung xem trước.'}</p>
              </div>
              <dl className="admin-report-fields compact">
                <div>
                  <dt>Tác giả nội dung</dt>
                  <dd>{report.targetAuthorFullName ?? 'Không xác định'}</dd>
                </div>
                <div>
                  <dt>Trạng thái nội dung</dt>
                  <dd>{report.targetStatus ?? 'Chưa cập nhật'}</dd>
                </div>
              </dl>
            </section>
            <section className="admin-report-card">
              <h2>Hoạt động xử lý</h2>
              {activity.length ? (
                <ol className="admin-report-activity">
                  {activity.map((item, index) => (
                    <li key={`${item.occurredAt}-${index}`}>
                      <span />
                      <div>
                        <b>{item.title}</b>
                        <p>{item.description ?? 'Không có mô tả.'}</p>
                        <small>
                          {item.actorDisplayName ?? 'Hệ thống'} · {formatDate(item.occurredAt)}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="admin-report-empty">Chưa có hoạt động xử lý.</p>
              )}
            </section>
          </div>
          <aside>
            <section className="admin-report-card">
              <h2>
                <UserRound aria-hidden="true" /> Phân công xử lý
              </h2>
              <p className="admin-report-owner">
                {ownership?.assigned
                  ? `Đang do ${ownership.assignedAdminDisplayName ?? 'một quản trị viên'} xử lý.`
                  : 'Chưa có quản trị viên nhận xử lý báo cáo này.'}
              </p>
              <button
                className="admin-report-owner-action"
                type="button"
                disabled={updating}
                onClick={() => void updateOwnership()}
              >
                {updating ? 'Đang cập nhật...' : ownership?.assigned ? 'Nhả xử lý' : 'Nhận xử lý'}
              </button>
              {ownership?.assignedAt && <small>Nhận lúc {formatDate(ownership.assignedAt)}</small>}
            </section>
            <section className="admin-report-card">
              <h2>
                <ClipboardCheck aria-hidden="true" /> Mã vụ việc
              </h2>
              <dl className="admin-report-fields compact">
                <div>
                  <dt>Mã báo cáo</dt>
                  <dd>{report.reportId}</dd>
                </div>
                <div>
                  <dt>Loại vụ việc</dt>
                  <dd>Báo cáo cộng đồng</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
