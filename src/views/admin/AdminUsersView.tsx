/**
 * @file AdminUsersView.tsx
 * @description Danh sách mentee và mentor dành cho quản trị viên.
 */

'use client';

import {
  AdminListTabs,
  AdminPagination,
  AdminPersonCell,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import type { AdminMentor, AdminUser } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage, showError } from '@/utils/toast';
import { RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './AdminUsersView.module.css';

const pageSize = 20;

type UserListTab = 'mentee' | 'mentor';
type StatusFilter = '' | 'active' | 'locked';

const userTabs: Array<{ value: UserListTab; label: string }> = [
  { value: 'mentee', label: 'Mentee' },
  { value: 'mentor', label: 'Mentor' },
];

const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đã khóa' },
];

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Chờ kích hoạt',
  SUSPENDED: 'Tạm ngưng',
  BANNED: 'Đã khóa',
};

function getStatusGroup(status: string): Exclude<StatusFilter, ''> | 'other' {
  if (status === 'ACTIVE') return 'active';
  if (status === 'BANNED' || status === 'SUSPENDED') return 'locked';
  return 'other';
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('vi-VN');
}

function StatusBadge({ status }: { status: string }) {
  const group = getStatusGroup(status);
  const tone = group === 'active' ? styles.isActive : group === 'locked' ? styles.isLocked : '';
  return <span className={`${styles.status} ${tone}`}>{getStatusLabel(status)}</span>;
}

function formatDay(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** "Vừa xong", "5 phút trước", "2 giờ trước", "Hôm qua", "12 ngày trước", then dd/MM/yyyy. */
function formatRelative(value: string, now: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.floor((now - date.getTime()) / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const dayDiff = Math.round(
    (new Date(now).setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (dayDiff <= 0) return `${Math.floor(minutes / 60)} giờ trước`;
  if (dayDiff === 1) return 'Hôm qua';
  if (dayDiff < 30) return `${dayDiff} ngày trước`;
  return formatDay(value);
}

function formatRating(value: number | null) {
  return value === null ? 'Chưa có' : value.toFixed(1);
}

function matchesKeyword(keyword: string, ...fields: Array<string | null | undefined>) {
  return fields.some((field) => field?.toLocaleLowerCase('vi-VN').includes(keyword));
}

function matchesStatus(filter: StatusFilter, status: string) {
  return !filter || getStatusGroup(status) === filter;
}

export function AdminUsersView() {
  const { locale } = useParams<{ locale: string }>();
  const [activeTab, setActiveTab] = useState<UserListTab>('mentee');
  const [mentees, setMentees] = useState<AdminUser[]>([]);
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(() => Date.now());

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setNow(Date.now());
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
      setError(getUserFriendlyErrorMessage(reason, 'Không thể tải danh sách người dùng.'));
      showError(reason, { title: 'Không thể tải danh sách người dùng' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // TODO(api): keyword search + status filter on /api/admin/users and /api/admin/mentors.
  // Until then both filters only apply to the page already loaded.
  const keyword = search.toLocaleLowerCase('vi-VN');
  const visibleMentees = useMemo(
    () =>
      mentees.filter(
        (mentee) =>
          mentee.roles.includes('MENTEE') &&
          matchesStatus(statusFilter, mentee.status) &&
          (!keyword ||
            matchesKeyword(
              keyword,
              mentee.fullName,
              mentee.email,
              mentee.academicProfile?.claimedStudentCode,
            )),
      ),
    [mentees, statusFilter, keyword],
  );
  const visibleMentors = useMemo(
    () =>
      mentors.filter(
        (mentor) =>
          matchesStatus(statusFilter, mentor.mentorStatus) &&
          (!keyword ||
            matchesKeyword(keyword, mentor.displayName, mentor.email, mentor.primaryLabel)),
      ),
    [mentors, statusFilter, keyword],
  );

  const isMenteeTab = activeTab === 'mentee';
  const loadedCount = isMenteeTab ? mentees.length : mentors.length;
  const visibleCount = isMenteeTab ? visibleMentees.length : visibleMentors.length;
  const columnCount = isMenteeTab ? 6 : 7;
  const isFiltered = Boolean(search || statusFilter);
  const rangeStart = loadedCount ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize + loadedCount, totalElements);

  const selectTab = (tab: UserListTab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
  };

  const statusFilterLabel =
    statusFilterOptions.find((option) => option.value === statusFilter)?.label ?? '';

  const tableState = loading ? (
    <AdminTableState
      variant="loading"
      colSpan={columnCount}
      title={`Đang tải danh sách ${activeTab}…`}
    />
  ) : error ? (
    <AdminTableState variant="error" colSpan={columnCount} onRetry={() => void loadAccounts()} />
  ) : visibleCount ? null : isFiltered ? (
    <AdminTableState
      variant="no-results"
      colSpan={columnCount}
      searchTerm={search}
      title={search ? undefined : `Không có ${activeTab} ở trạng thái "${statusFilterLabel}"`}
      description={
        search && statusFilter
          ? `Kiểm tra lại chính tả, hoặc bỏ lọc trạng thái "${statusFilterLabel}".`
          : search
            ? undefined
            : 'Chọn trạng thái khác hoặc xóa bộ lọc để xem toàn bộ danh sách.'
      }
      onClearFilters={clearFilters}
    />
  ) : (
    <AdminTableState
      variant="empty"
      colSpan={columnCount}
      title={`Chưa có ${activeTab} nào`}
      description="Tài khoản mới sẽ xuất hiện tại đây."
    />
  );

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
            <h1>Người dùng</h1>
            <p>Tài khoản mentee và mentor trên nền tảng.</p>
          </div>
        </section>
        <section className={list.card} aria-label="Danh sách người dùng">
          <AdminListTabs
            ariaLabel="Loại người dùng"
            tabs={userTabs}
            value={activeTab}
            onChange={selectTab}
          />
          <div className={list.toolbar}>
            <label className="admin-search-field admin-toolbar-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                aria-label="Tìm người dùng"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email hoặc mã sinh viên"
              />
            </label>
            <label className={list.selectField}>
              <span>Trạng thái</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                {statusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`admin-button ${list.toolbarEnd}`}
              onClick={() => void loadAccounts()}
              disabled={loading}
            >
              <RefreshCw aria-hidden="true" /> Làm mới
            </button>
          </div>
          <div className={list.tableScroll}>
            {isMenteeTab ? (
              <table className={`${list.table} ${styles.menteeTable}`}>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Mã sinh viên</th>
                    <th>Trạng thái</th>
                    <th>Đăng nhập gần nhất</th>
                    <th>Ngày tạo</th>
                    <th>
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableState ??
                    visibleMentees.map((user) => (
                      <MenteeRow key={user.userId} user={user} locale={locale} now={now} />
                    ))}
                </tbody>
              </table>
            ) : (
              <table className={`${list.table} ${styles.mentorTable}`}>
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Chuyên môn</th>
                    <th>Buổi hoàn thành</th>
                    <th>Điểm đánh giá</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableState ??
                    visibleMentors.map((mentor) => (
                      <MentorRow key={mentor.mentorUserId} mentor={mentor} locale={locale} />
                    ))}
                </tbody>
              </table>
            )}
          </div>
          <footer className={list.footer}>
            <span>
              Hiển thị {rangeStart}–{rangeEnd} trong {totalElements} {activeTab}
              {isFiltered && !loading && ` · ${visibleCount} kết quả lọc trên trang này`}
            </span>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              disabled={loading}
              onChange={setPage}
            />
          </footer>
        </section>
      </div>
    </main>
  );
}

function MenteeRow({ user, locale, now }: { user: AdminUser; locale: string; now: number }) {
  const studentCode = user.academicProfile?.claimedStudentCode;
  return (
    <tr>
      <td>
        <AdminPersonCell
          name={user.fullName}
          email={user.email}
          avatarUrl={user.avatarUrl}
          avatarSize={36}
        />
      </td>
      <td>{studentCode ?? <span className={list.muted}>Chưa có</span>}</td>
      <td>
        <StatusBadge status={user.status} />
      </td>
      <td className={list.date}>
        {user.lastLoginAt ? (
          <time
            dateTime={user.lastLoginAt}
            title={new Date(user.lastLoginAt).toLocaleString('vi-VN')}
          >
            {formatRelative(user.lastLoginAt, now)}
          </time>
        ) : (
          <span className={list.muted}>Chưa đăng nhập</span>
        )}
      </td>
      <td className={list.date}>{formatDay(user.createdAt)}</td>
      <td className={list.actionCell}>
        <Link className="admin-button" href={`/${locale}/admin/users/${user.userId}`}>
          Xem
        </Link>
      </td>
    </tr>
  );
}

function MentorRow({ mentor, locale }: { mentor: AdminMentor; locale: string }) {
  return (
    <tr>
      <td>
        <AdminPersonCell
          name={mentor.displayName}
          email={mentor.email}
          avatarUrl={mentor.avatarUrl}
          avatarSize={36}
        />
      </td>
      <td>{mentor.primaryLabel ?? <span className={list.muted}>Chưa cập nhật</span>}</td>
      <td>{mentor.completedSessions}</td>
      <td>{formatRating(mentor.ratingAverage)}</td>
      <td>
        <StatusBadge status={mentor.mentorStatus} />
      </td>
      <td className={list.date}>{formatDay(mentor.createdAt)}</td>
      <td className={list.actionCell}>
        <Link className="admin-button" href={`/${locale}/admin/mentors/${mentor.mentorUserId}`}>
          Xem
        </Link>
      </td>
    </tr>
  );
}
