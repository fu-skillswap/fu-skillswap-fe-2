/**
 * @file AdminMentorViolationsView.tsx
 * @description Admin entry page for mentor violations: search a mentor, then open their violation
 * history (penalty score, record a violation, reverse a wrong one) on the mentor detail page.
 */

'use client';

import {
  AdminPagination,
  AdminPersonCell,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { Badge } from '@/components/ui/Badge';
import type { AdminMentor } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { RefreshCw, Search, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;
const COLUMN_COUNT = 5;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'PAUSED', label: 'Tạm dừng' },
  { value: 'SUSPENDED', label: 'Tạm ngưng' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.filter((option) => option.value).map((option) => [option.value, option.label]),
);

function statusVariant(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED' || status === 'REJECTED') return 'danger';
  if (status === 'PAUSED' || status === 'PENDING_VERIFICATION') return 'warning';
  return 'neutral';
}

export function AdminMentorViolationsView() {
  const { locale } = useParams<{ locale: string }>();
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadMentors = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await adminRepo.getMentors({
        keyword: keyword || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      });
      setMentors(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch (reason) {
      setError(getUserFriendlyErrorMessage(reason, 'Không thể tải danh sách mentor.'));
    } finally {
      setLoading(false);
    }
  }, [keyword, status, page]);

  useEffect(() => {
    void loadMentors();
  }, [loadMentors]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setKeyword(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const isFiltered = Boolean(keyword || status);
  const rangeStart = mentors.length ? page * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE + mentors.length, totalElements);

  const clearFilters = () => {
    setSearchInput('');
    setKeyword('');
    setStatus('');
    setPage(0);
  };

  const tableState = loading ? (
    <AdminTableState variant="loading" colSpan={COLUMN_COUNT} title="Đang tải danh sách mentor…" />
  ) : error ? (
    <AdminTableState
      variant="error"
      colSpan={COLUMN_COUNT}
      description={error}
      onRetry={() => void loadMentors()}
    />
  ) : mentors.length ? null : isFiltered ? (
    <AdminTableState
      variant="no-results"
      colSpan={COLUMN_COUNT}
      searchTerm={keyword}
      title={keyword ? undefined : 'Không có mentor ở trạng thái này'}
      onClearFilters={clearFilters}
    />
  ) : (
    <AdminTableState
      variant="empty"
      colSpan={COLUMN_COUNT}
      title="Chưa có mentor nào"
      description="Mentor đã đăng ký sẽ xuất hiện tại đây."
    />
  );

  return (
    <main className="admin-users-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Vi phạm mentor</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-users-content">
        <section className="admin-page-heading">
          <div>
            <h1>Vi phạm mentor</h1>
            <p>
              Chọn một mentor để xem điểm phạt, ghi nhận vi phạm đã xác minh hoặc đảo vi phạm kết
              luận sai.
            </p>
          </div>
        </section>
        <section className={list.card} aria-label="Danh sách mentor">
          <div className={list.toolbar}>
            <label className="admin-search-field admin-toolbar-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                aria-label="Tìm mentor"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email hoặc tiêu đề chuyên môn"
              />
            </label>
            <label className={list.selectField}>
              <span>Trạng thái</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`admin-button ${list.toolbarEnd}`}
              onClick={() => void loadMentors()}
              disabled={loading}
            >
              <RefreshCw aria-hidden="true" /> Làm mới
            </button>
          </div>
          <div className={list.tableScroll}>
            <table className={`${list.table} min-w-[760px]`}>
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Chuyên môn</th>
                  <th>Buổi hoàn thành</th>
                  <th>Trạng thái</th>
                  <th>
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableState ??
                  mentors.map((mentor) => (
                    <tr key={mentor.mentorUserId}>
                      <td>
                        <AdminPersonCell
                          name={mentor.displayName}
                          email={mentor.email}
                          avatarUrl={mentor.avatarUrl}
                          avatarSize={36}
                        />
                      </td>
                      <td>
                        {mentor.primaryLabel ?? <span className={list.muted}>Chưa cập nhật</span>}
                      </td>
                      <td>{mentor.completedSessions}</td>
                      <td>
                        <Badge variant={statusVariant(mentor.mentorStatus)}>
                          {STATUS_LABELS[mentor.mentorStatus] ?? mentor.mentorStatus}
                        </Badge>
                      </td>
                      <td className={list.actionCell}>
                        <Link
                          className="admin-button"
                          href={`/${locale}/admin/mentors/${mentor.mentorUserId}#violations`}
                        >
                          <ShieldAlert aria-hidden="true" /> Xem vi phạm
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <footer className={list.footer}>
            <span>
              Hiển thị {rangeStart}–{rangeEnd} trong {totalElements} mentor
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
