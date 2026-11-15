/**
 * @file AdminMentorViolationsView.tsx
 * @description Admin "Vi phạm mentor" list: each mentor's current penalty points, violation count
 * and booking lock, with a drawer to reverse ("gỡ") violations without leaving the list.
 */

'use client';

import {
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AdminMentor } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Lock, RefreshCw, Search, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ADMIN_MENTORS_QUERY_KEY,
  ADMIN_VIOLATIONS_STALE_TIME,
  DANGER_OUTLINE_BUTTON_CLASS,
  formatPoints,
  formatViolationDateTime,
  isBookingSuspended,
} from './mentorViolations.helpers';
import { ReverseViolationDrawer } from './ReverseViolationDrawer';
import { useMentorViolationSummary } from './useMentorViolationSummary';

const PAGE_SIZE = 20;
const COLUMN_COUNT = 6;

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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [drawerMentor, setDrawerMentor] = useState<AdminMentor>();

  // TODO(api): quick tabs "Tất cả / Có vi phạm / Đang khóa nhận lịch" need the list filters
  // hasActiveViolations=true and bookingSuspended=true; default sort needs
  // sortBy=activePenaltyScore (DESC). Until then the list keeps the server order.
  const query = useQuery({
    queryKey: [...ADMIN_MENTORS_QUERY_KEY, { keyword, status, page, size: PAGE_SIZE }],
    queryFn: () =>
      adminRepo.getMentors({
        keyword: keyword || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      }),
    retry: false,
    staleTime: ADMIN_VIOLATIONS_STALE_TIME,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setKeyword(searchInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const mentors = query.data?.content ?? [];
  const totalElements = query.data?.totalElements ?? 0;
  const totalPages = query.data?.totalPages ?? 0;
  const loading = query.isLoading;
  const refreshing = query.isFetching;
  const isFiltered = Boolean(keyword || status);
  const rangeStart = mentors.length ? page * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE + mentors.length, totalElements);
  const detailHref = (mentorUserId: string) =>
    `/${locale}/admin/mentors/${mentorUserId}#violations`;

  const clearFilters = () => {
    setSearchInput('');
    setKeyword('');
    setStatus('');
    setPage(0);
  };

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-violations'] });
    void query.refetch();
  };

  const tableState = loading ? (
    <AdminTableState variant="loading" colSpan={COLUMN_COUNT} title="Đang tải danh sách mentor…" />
  ) : query.isError ? (
    <AdminTableState
      variant="error"
      colSpan={COLUMN_COUNT}
      description={getUserFriendlyErrorMessage(query.error, 'Không thể tải danh sách mentor.')}
      onRetry={() => void query.refetch()}
    />
  ) : mentors.length ? null : isFiltered ? (
    <AdminTableState
      variant="no-results"
      colSpan={COLUMN_COUNT}
      searchTerm={keyword}
      title={keyword ? undefined : 'Không có mentor ở trạng thái hồ sơ này'}
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
            <p>Theo dõi điểm phạt, xem lịch sử và gỡ những vi phạm kết luận sai.</p>
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
                placeholder="Tìm theo tên hoặc email"
              />
            </label>
            <label className={list.selectField}>
              <select
                aria-label="Lọc theo trạng thái hồ sơ"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Hồ sơ: {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`admin-button ${list.toolbarEnd}`}
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshCw aria-hidden="true" /> Làm mới
            </button>
          </div>
          <div className={list.tableScroll}>
            <table className={`${list.table} min-w-[1080px]`}>
              <colgroup>
                <col />
                <col className="w-[170px]" />
                <col className="w-[130px]" />
                <col className="w-[190px]" />
                <col className="w-[130px]" />
                <col className="w-[250px]" />
              </colgroup>
              <thead>
                <tr>
                  <th>Mentor</th>
                  <th>Điểm phạt hiện hành</th>
                  <th>Vi phạm</th>
                  <th>Nhận lịch</th>
                  <th>Hồ sơ</th>
                  <th>
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableState ??
                  mentors.map((mentor) => (
                    <MentorViolationRow
                      key={mentor.mentorUserId}
                      mentor={mentor}
                      detailHref={detailHref(mentor.mentorUserId)}
                      onReverse={() => setDrawerMentor(mentor)}
                    />
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
              disabled={refreshing}
              onChange={setPage}
            />
          </footer>
        </section>
      </div>

      {drawerMentor && (
        <ReverseViolationDrawer
          mentor={drawerMentor}
          detailHref={detailHref(drawerMentor.mentorUserId)}
          onClose={() => setDrawerMentor(undefined)}
        />
      )}
    </main>
  );
}

function Skeleton({ className }: { className: string }) {
  return (
    <span
      className={`inline-block animate-pulse rounded-md bg-slate-200 ${className}`}
      aria-hidden="true"
    />
  );
}

function MentorViolationRow({
  mentor,
  detailHref,
  onReverse,
}: {
  mentor: AdminMentor;
  detailHref: string;
  onReverse: () => void;
}) {
  // Fallback until the list item carries the penalty fields (see TODO(api) in models/admin.ts).
  const listHasPenaltyFields = mentor.activePenaltyScore != null;
  const { summary, isLoading, isError } = useMentorViolationSummary(
    mentor.mentorUserId,
    !listHasPenaltyFields,
  );

  const pending = !listHasPenaltyFields && isLoading;
  const unavailable = !listHasPenaltyFields && isError;
  const active = mentor.activePenaltyScore ?? summary?.activePenaltyScore ?? 0;
  const lifetime = mentor.lifetimePenaltyScore ?? summary?.lifetimePenaltyScore ?? 0;
  const total = mentor.totalViolations ?? summary?.totalViolations ?? 0;
  const suspendedUntil =
    mentor.bookingSuspendedUntil !== undefined
      ? mentor.bookingSuspendedUntil
      : summary?.bookingSuspendedUntil;
  const suspended = isBookingSuspended({ bookingSuspendedUntil: suspendedUntil });
  const canReverse = active > 0 || Boolean(summary?.hasUnreversedLatest);

  return (
    <tr className={suspended ? '!bg-[#FFFAFA]' : undefined}>
      <td className={suspended ? 'shadow-[inset_3px_0_0_var(--color-red-600)]' : undefined}>
        <div className="flex min-w-0 items-center gap-3">
          {mentor.avatarUrl ? (
            <img
              src={mentor.avatarUrl}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary"
              aria-hidden="true"
            >
              {mentor.displayName.trim().charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <strong className="truncate text-sm font-bold text-slate-900">
                {mentor.displayName}
              </strong>
              {mentor.primaryLabel && (
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {mentor.primaryLabel}
                </span>
              )}
            </div>
            <span
              className="block break-all text-[12.5px] text-slate-500 max-xl:truncate"
              title={mentor.email}
            >
              {mentor.email}
            </span>
          </div>
        </div>
      </td>
      <td>
        {pending ? (
          <Skeleton className="h-6 w-16" />
        ) : unavailable ? (
          <span className="text-slate-400" title="Không tải được điểm phạt">
            —
          </span>
        ) : (
          <>
            <span className="flex items-baseline gap-1.5">
              <strong
                className={`text-2xl font-extrabold leading-7 ${
                  active > 0 ? 'text-slate-900' : 'text-slate-300'
                }`}
              >
                {formatPoints(active)}
              </strong>
              <span className="text-xs text-slate-500">điểm</span>
            </span>
            {lifetime > 0 && (
              <span className="block text-xs text-slate-500">
                Tích lũy {formatPoints(lifetime)}
              </span>
            )}
          </>
        )}
      </td>
      <td>
        {pending ? (
          <Skeleton className="h-5 w-20" />
        ) : unavailable ? (
          <span className="text-slate-400">—</span>
        ) : total > 0 ? (
          <span className="inline-flex whitespace-nowrap rounded-full border border-solid border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            {formatPoints(total)} vi phạm
          </span>
        ) : (
          <span className="text-[13px] text-slate-500">Không có</span>
        )}
      </td>
      <td>
        {pending ? (
          <Skeleton className="h-5 w-24" />
        ) : unavailable ? (
          <span className="text-slate-400">—</span>
        ) : suspended ? (
          <>
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-red-700">
              <Lock className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              Tạm khóa
            </span>
            <span className="block whitespace-nowrap text-xs text-red-700">
              đến {formatViolationDateTime(suspendedUntil)}
            </span>
          </>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded-full border border-solid border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            Đang nhận lịch
          </span>
        )}
      </td>
      <td>
        <Badge variant={statusVariant(mentor.mentorStatus)}>
          {STATUS_LABELS[mentor.mentorStatus] ?? 'Bản nháp'}
        </Badge>
      </td>
      <td className={list.actionCell}>
        <div className="flex items-center justify-end gap-2">
          {canReverse && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={DANGER_OUTLINE_BUTTON_CLASS}
              leftIcon={<Undo2 className="h-4 w-4" aria-hidden="true" />}
              onClick={onReverse}
            >
              Gỡ vi phạm
            </Button>
          )}
          <Link className="admin-button" href={detailHref}>
            <Eye className="h-4 w-4" aria-hidden="true" /> Chi tiết
          </Link>
        </div>
      </td>
    </tr>
  );
}
