/**
 * @file AdminUsersView.tsx
 * @description Danh sách mentee và mentor dành cho quản trị viên.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { ApiClientError } from '@/models/apiClient';
import type { AdminMentor, AdminUser } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { ChevronLeft, ChevronRight, RefreshCw, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const pageSize = 10;

type UserListTab = 'mentee' | 'mentor';

const userTabs: Array<{ value: UserListTab; label: string }> = [
  { value: 'mentee', label: 'Mentee' },
  { value: 'mentor', label: 'Mentor' },
];

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Chờ kích hoạt',
  SUSPENDED: 'Tạm ngưng',
  BANNED: 'Đã khóa',
};

const statusOptions = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'];

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError ? reason.message : 'Không thể tải danh sách người dùng.';
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa đăng nhập';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';

  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatRating(value: number | null) {
  return value === null ? 'Chưa có' : value.toFixed(1);
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

function InitialAvatar({ name }: { name: string }) {
  return <span className="admin-user-initial">{name.trim().charAt(0).toUpperCase() || '?'}</span>;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(0, Math.min(currentPage - 2, Math.max(totalPages - 5, 0)));
  const end = Math.min(totalPages, start + 5);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export function AdminUsersView() {
  const { locale } = useParams<{ locale: string }>();
  const [activeTab, setActiveTab] = useState<UserListTab>('mentee');
  const [mentees, setMentees] = useState<AdminUser[]>([]);
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      if (activeTab === 'mentee') {
        const data = await adminRepo.getUsers({ page, size: pageSize });
        setMentees(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      } else {
        const data = await adminRepo.getMentors({ page, size: pageSize });
        setMentors(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      }
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const visibleMentees = useMemo(
    () =>
      mentees.filter(
        (mentee) =>
          mentee.roles.includes('MENTEE') && (!statusFilter || mentee.status === statusFilter),
      ),
    [mentees, statusFilter],
  );
  const visibleMentors = useMemo(
    () => mentors.filter((mentor) => !statusFilter || mentor.mentorStatus === statusFilter),
    [mentors, statusFilter],
  );
  const displayedCount = activeTab === 'mentee' ? visibleMentees.length : visibleMentors.length;
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);
  const firstEntry = displayedCount ? page * pageSize + 1 : 0;
  const lastEntry = Math.min((page + 1) * pageSize, totalElements);
  const activeLabel = activeTab === 'mentee' ? 'mentee' : 'mentor';

  const selectTab = (tab: UserListTab) => {
    setActiveTab(tab);
    setPage(0);
    setStatusFilter('');
  };

  return (
    <main className="admin-users-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Người dùng</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-users-content">
        <section className="admin-page-heading">
          <div>
            <h1>Quản lý người dùng</h1>
            <p>Theo dõi các tài khoản mentee và mentor trên nền tảng.</p>
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
              <X aria-hidden="true" />
            </button>
          </div>
        )}
        <section className="admin-users-table" aria-labelledby="admin-users-title">
          <div className="admin-users-toolbar">
            <div>
              <Users aria-hidden="true" />
              <span id="admin-users-title">Danh sách tài khoản</span>
            </div>
            <div className="admin-users-toolbar-controls">
              <div className="admin-users-tabs" role="tablist" aria-label="Loại người dùng">
                {userTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.value}
                    className={activeTab === tab.value ? 'is-active' : ''}
                    onClick={() => selectTab(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <label className="admin-users-status-filter">
                <span>Trạng thái</span>
                <select
                  aria-label="Lọc trạng thái"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Tất cả</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void loadAccounts()} disabled={loading}>
                <RefreshCw aria-hidden="true" /> Làm mới
              </button>
            </div>
          </div>
          <div className="admin-users-table-scroll">
            {activeTab === 'mentee' ? (
              <MenteeTable
                users={visibleMentees}
                locale={locale}
                loading={loading}
                statusFilter={statusFilter}
              />
            ) : (
              <MentorTable
                mentors={visibleMentors}
                locale={locale}
                loading={loading}
                statusFilter={statusFilter}
              />
            )}
          </div>
          <footer className="admin-users-pagination">
            <span>
              Hiển thị {firstEntry}–{lastEntry} / {totalElements} {activeLabel}
            </span>
            <div aria-label="Phân trang">
              <button
                type="button"
                aria-label="Trang trước"
                disabled={loading || page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === page ? 'is-active' : ''}
                  aria-label={`Trang ${pageNumber + 1}`}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  disabled={loading}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber + 1}
                </button>
              ))}
              <button
                type="button"
                aria-label="Trang sau"
                disabled={loading || page >= totalPages - 1}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function MenteeTable({
  users,
  locale,
  loading,
  statusFilter,
}: {
  users: AdminUser[];
  locale: string;
  loading: boolean;
  statusFilter: string;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Người dùng</th>
          <th>Mã sinh viên</th>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th>Đăng nhập gần nhất</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <LoadingRow message="Đang tải danh sách mentee..." />
        ) : users.length ? (
          users.map((user) => <MenteeRow key={user.userId} user={user} locale={locale} />)
        ) : (
          <EmptyRow statusFilter={statusFilter} label="mentee" />
        )}
      </tbody>
    </table>
  );
}

function MentorTable({
  mentors,
  locale,
  loading,
  statusFilter,
}: {
  mentors: AdminMentor[];
  locale: string;
  loading: boolean;
  statusFilter: string;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Mentor</th>
          <th>Chuyên môn</th>
          <th>Buổi hoàn thành</th>
          <th>Điểm đánh giá</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <LoadingRow message="Đang tải danh sách mentor..." />
        ) : mentors.length ? (
          mentors.map((mentor) => (
            <MentorRow key={mentor.mentorUserId} mentor={mentor} locale={locale} />
          ))
        ) : (
          <EmptyRow statusFilter={statusFilter} label="mentor" />
        )}
      </tbody>
    </table>
  );
}

function LoadingRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={6} className="admin-users-state">
        <span>{message}</span>
      </td>
    </tr>
  );
}

function EmptyRow({ statusFilter, label }: { statusFilter: string; label: string }) {
  return (
    <tr>
      <td colSpan={6} className="admin-users-state">
        {statusFilter ? `Không có ${label} ở trạng thái đã chọn.` : `Chưa có ${label} nào.`}
      </td>
    </tr>
  );
}

function MenteeRow({ user, locale }: { user: AdminUser; locale: string }) {
  return (
    <tr>
      <td>
        <Link className="admin-user-profile" href={`/${locale}/admin/users/${user.userId}`}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            <InitialAvatar name={user.fullName} />
          )}
          <span>
            <b>{user.fullName}</b>
            <small>{user.email}</small>
          </span>
        </Link>
      </td>
      <td>{user.academicProfile?.claimedStudentCode ?? 'Chưa cập nhật'}</td>
      <td>{user.roles.length ? user.roles.join(', ') : 'Chưa phân quyền'}</td>
      <td>
        <span className={`admin-user-status ${user.status.toLowerCase().replaceAll('_', '-')}`}>
          {getStatusLabel(user.status)}
        </span>
      </td>
      <td>{formatDate(user.lastLoginAt)}</td>
      <td>{formatDate(user.createdAt)}</td>
    </tr>
  );
}

function MentorRow({ mentor, locale }: { mentor: AdminMentor; locale: string }) {
  return (
    <tr>
      <td>
        <Link
          className="admin-user-profile"
          href={`/${locale}/admin/mentors/${mentor.mentorUserId}`}
        >
          {mentor.avatarUrl ? (
            <img src={mentor.avatarUrl} alt="" />
          ) : (
            <InitialAvatar name={mentor.displayName} />
          )}
          <span>
            <b>{mentor.displayName}</b>
            <small>{mentor.email}</small>
          </span>
        </Link>
      </td>
      <td>{mentor.primaryLabel ?? 'Chưa cập nhật'}</td>
      <td>{mentor.completedSessions}</td>
      <td>{formatRating(mentor.ratingAverage)}</td>
      <td>
        <span
          className={`admin-user-status ${mentor.mentorStatus.toLowerCase().replaceAll('_', '-')}`}
        >
          {getStatusLabel(mentor.mentorStatus)}
        </span>
      </td>
      <td>{formatDate(mentor.createdAt)}</td>
    </tr>
  );
}
