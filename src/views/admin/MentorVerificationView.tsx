/**
 * @file MentorVerificationView.tsx
 * @description Danh sách hồ sơ mentor chờ quản trị viên xác minh.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { MentorVerificationRequest, MentorVerificationStatus } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { Bell, LoaderCircle, RefreshCw, Search, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const tabs: Array<{ label: string; value?: MentorVerificationStatus }> = [
  { label: 'Chờ duyệt', value: 'PENDING' },
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
};

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

function isPendingStatus(status: string) {
  return ['DRAFT', 'PENDING', 'SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(status);
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <span className="mentor-initial-avatar">{name.trim().charAt(0).toUpperCase() || '?'}</span>
  );
}

export function MentorVerificationView({ locale }: { locale: string }) {
  const [requests, setRequests] = useState<MentorVerificationRequest[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeStatus, setActiveStatus] = useState<MentorVerificationStatus | undefined>('PENDING');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRepo.getMentorVerificationRequests({ page, size: 10 });
      setRequests(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN');
    return requests.filter((request) => {
      const matchesStatus =
        !activeStatus ||
        request.status === activeStatus ||
        (activeStatus === 'PENDING' && isPendingStatus(request.status));
      const matchesSearch =
        !normalizedSearch ||
        request.mentorFullName.toLocaleLowerCase('vi-VN').includes(normalizedSearch) ||
        request.mentorEmail.toLocaleLowerCase('vi-VN').includes(normalizedSearch) ||
        request.mentorUserId.toLocaleLowerCase('vi-VN').includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, requests, search]);

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
          <p>
            <i />
            Trạng thái hệ thống: Hoạt động
          </p>
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
          <div className="admin-topbar-actions">
            <label>
              <Search aria-hidden="true" />
              <input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." />
            </label>
            <button aria-label="Thông báo" type="button">
              <Bell aria-hidden="true" />
            </button>
            <button aria-label="Cài đặt" type="button">
              <Settings aria-hidden="true" />
            </button>
            <div className="admin-avatar">A</div>
          </div>
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
                  {tab.value === 'PENDING' && totalElements ? ` (${totalElements})` : ''}
                </button>
              ))}
            </div>
            <div className="mentor-table-toolbar">
              <label>
                <Search aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                        <span className="mentor-inline-loading">
                          <LoaderCircle aria-hidden="true" />
                          Đang tải danh sách hồ sơ...
                        </span>
                      </td>
                    </tr>
                  ) : filteredRequests.length ? (
                    filteredRequests.map((request) => (
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
                Hiển thị {filteredRequests.length ? page * 10 + 1 : 0}–
                {Math.min((page + 1) * 10, totalElements)} trong tổng số {totalElements} hồ sơ
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
