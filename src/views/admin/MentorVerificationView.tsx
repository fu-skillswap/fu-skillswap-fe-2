/**
 * @file MentorVerificationView.tsx
 * @description Danh sách hồ sơ mentor chờ quản trị viên xác minh.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type { MentorVerificationRequest, MentorVerificationStatus } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { RefreshCw, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const tabs: Array<{ label: string; value?: MentorVerificationStatus }> = [
  { label: 'Chờ duyệt', value: 'PENDING_REVIEW' },
  { label: 'Cần bổ sung', value: 'NEEDS_REVISION' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
  { label: 'Tất cả' },
];

const statusLabels: Record<string, string> = {
  DRAFT: 'Chờ duyệt',
  PENDING: 'Chờ duyệt',
  SUBMITTED: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang xem xét',
  PENDING_REVIEW: 'Chờ duyệt',
  NEEDS_REVISION: 'Cần bổ sung',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  WITHDRAWN: 'Đã rút hồ sơ',
};

const allRequestStatuses: MentorVerificationStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
];
const pageSize = 10;
const allStatusesBatchSize = 100;

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError
    ? reason.message
    : 'Không thể tải danh sách hồ sơ mentor.';
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa gửi';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <span className="mentor-initial-avatar">{name.trim().charAt(0).toUpperCase() || '?'}</span>
  );
}

/** Tải toàn bộ trạng thái riêng lẻ vì API không truyền status mặc định chỉ trả hàng chờ duyệt. */
async function getAllMentorVerificationRequests(keyword: string) {
  const initialResponses = await Promise.all(
    allRequestStatuses.map((status) =>
      adminRepo.getMentorVerificationRequests({
        status,
        keyword: keyword || undefined,
        page: 0,
        size: allStatusesBatchSize,
        sortBy: 'updatedAt',
        direction: 'DESC',
      }),
    ),
  );
  const remainingResponses = await Promise.all(
    initialResponses.flatMap((response, statusIndex) =>
      Array.from({ length: Math.max(response.totalPages - 1, 0) }, (_, pageIndex) =>
        adminRepo.getMentorVerificationRequests({
          status: allRequestStatuses[statusIndex],
          keyword: keyword || undefined,
          page: pageIndex + 1,
          size: allStatusesBatchSize,
          sortBy: 'updatedAt',
          direction: 'DESC',
        }),
      ),
    ),
  );
  const uniqueRequests = new Map<string, MentorVerificationRequest>();
  [...initialResponses, ...remainingResponses].forEach((response) => {
    response.content.forEach((request) => uniqueRequests.set(request.requestId, request));
  });
  return [...uniqueRequests.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function MentorVerificationView({ locale }: { locale: string }) {
  const [requests, setRequests] = useState<MentorVerificationRequest[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeStatus, setActiveStatus] = useState<MentorVerificationStatus | undefined>(
    'PENDING_REVIEW',
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const keyword = search.trim();
      if (!activeStatus) {
        const allRequests = await getAllMentorVerificationRequests(keyword);
        setRequests(allRequests.slice(page * pageSize, (page + 1) * pageSize));
        setTotalElements(allRequests.length);
        setTotalPages(Math.ceil(allRequests.length / pageSize));
        return;
      }
      const data = await adminRepo.getMentorVerificationRequests({
        status: activeStatus,
        keyword: keyword || undefined,
        page,
        size: pageSize,
        sortBy: 'updatedAt',
        direction: 'DESC',
      });
      setRequests(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [activeStatus, page, search]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  return (
    <main className="admin-dashboard mentor-verification-page">
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
          <Link href={`/${locale}/admin/dashboard`}>▦ Tổng quan</Link>
          <Link className="is-active" href={`/${locale}/admin/mentor-verification`}>
            ♢ Xác minh mentor
          </Link>
          <a href="#users">♧ Người dùng</a>
          <a href="#bookings">▣ Lịch hẹn</a>
          <a href="#reports">▱ Đánh giá &amp; báo cáo</a>
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
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Quản trị <span>›</span> <b>Xác minh mentor</b>
          </div>
          <AdminTopbarActions />
        </header>
        <div className="mentor-verification-content">
          <section className="mentor-verification-heading">
            <h1>Xác minh mentor</h1>
            <p>Rà soát hồ sơ mentor và xác minh thông tin đã gửi.</p>
          </section>
          {error && (
            <div className="admin-dashboard-toast" role="alert">
              <span>{error}</span>
              <button
                type="button"
                aria-label="Đóng thông báo lỗi"
                onClick={() => setError(undefined)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          )}
          <section className="mentor-verification-table">
            <div className="mentor-tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={activeStatus === tab.value}
                  className={activeStatus === tab.value ? 'is-active' : ''}
                  onClick={() => {
                    setActiveStatus(tab.value);
                    setPage(0);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mentor-table-toolbar">
              <label>
                <Search aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Tìm theo tên hoặc email..."
                />
              </label>
              <button type="button" onClick={() => void loadRequests()}>
                <RefreshCw aria-hidden="true" /> Làm mới
              </button>
            </div>
            <div className="mentor-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ứng viên</th>
                    <th>Trạng thái</th>
                    <th>Số lần bổ sung</th>
                    <th>Gửi lúc</th>
                    <th>Cập nhật lúc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="mentor-table-state">
                        <span className="mentor-inline-loading">Đang tải danh sách hồ sơ...</span>
                      </td>
                    </tr>
                  ) : requests.length ? (
                    requests.map((request) => (
                      <tr key={request.requestId}>
                        <td>
                          <div className="mentor-applicant">
                            {request.mentorAvatarUrl ? (
                              <img src={request.mentorAvatarUrl} alt="" />
                            ) : (
                              <InitialAvatar name={request.mentorFullName} />
                            )}
                            <span>
                              <b>{request.mentorFullName}</b>
                              <small>{request.mentorEmail}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`mentor-status ${request.status.toLowerCase().replaceAll('_', '-')}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td>{request.revisionCount}</td>
                        <td>{formatDate(request.submittedAt)}</td>
                        <td>{formatDate(request.updatedAt)}</td>
                        <td>
                          <Link href={`/${locale}/admin/mentor-verification/${request.requestId}`}>
                            Xem xét
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="mentor-table-state">
                        Không tìm thấy hồ sơ phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="mentor-pagination">
              <span>
                Hiển thị {requests.length ? page * pageSize + 1 : 0}–
                {Math.min((page + 1) * pageSize, totalElements)} trong tổng số {totalElements} hồ sơ
              </span>
              <div>
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Trước
                </button>
                <b>{page + 1}</b>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Sau
                </button>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </main>
  );
}
