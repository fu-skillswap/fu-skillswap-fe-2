/**
 * @file MentorVerificationView.tsx
 * @description Danh sách hồ sơ mentor chờ quản trị viên xác minh.
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
import type { MentorVerificationRequest, MentorVerificationStatus } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { getUserFriendlyErrorMessage, showError } from '@/utils/toast';
import { RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './MentorVerificationView.module.css';

const tabs: Array<{ label: string; value?: MentorVerificationStatus; emptyTitle: string }> = [
  { label: 'Chờ duyệt', value: 'PENDING_REVIEW', emptyTitle: 'Không có hồ sơ chờ duyệt' },
  { label: 'Cần bổ sung', value: 'NEEDS_REVISION', emptyTitle: 'Không có hồ sơ cần bổ sung' },
  { label: 'Đã duyệt', value: 'APPROVED', emptyTitle: 'Chưa có hồ sơ được duyệt' },
  { label: 'Từ chối', value: 'REJECTED', emptyTitle: 'Chưa có hồ sơ bị từ chối' },
  { label: 'Tất cả', emptyTitle: 'Chưa có hồ sơ nào' },
];

const sortOptions = {
  oldest: { label: 'Chờ lâu nhất', direction: 'ASC' },
  newest: { label: 'Mới gửi nhất', direction: 'DESC' },
} as const;
type SortKey = keyof typeof sortOptions;

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
const columnCount = 5;
const dayInMinutes = 24 * 60;
type VerificationCountKey = MentorVerificationStatus | 'ALL';

function formatDate(value: string | null) {
  if (!value) return 'Chưa gửi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return `${time}, ${day}`;
}

function getWaitingMinutes(submittedAt: string | null, now: number) {
  if (!submittedAt) return null;
  const submitted = new Date(submittedAt).getTime();
  return Number.isNaN(submitted) ? null : Math.max(0, Math.floor((now - submitted) / 60000));
}

/** "40 phút", "5 giờ", "1 ngày 2 giờ". */
function formatWaiting(minutes: number) {
  const days = Math.floor(minutes / dayInMinutes);
  const hours = Math.floor((minutes % dayInMinutes) / 60);
  if (days) return hours ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  if (hours) return `${hours} giờ`;
  return `${Math.max(1, minutes)} phút`;
}

function getSubmittedTime(request: MentorVerificationRequest) {
  return new Date(request.submittedAt ?? request.createdAt).getTime();
}

/** Tải toàn bộ trạng thái riêng lẻ vì API không truyền status mặc định chỉ trả hàng chờ duyệt. */
async function getAllMentorVerificationRequests(keyword: string, sort: SortKey) {
  const { direction } = sortOptions[sort];
  const initialResponses = await Promise.all(
    allRequestStatuses.map((status) =>
      adminRepo.getMentorVerificationRequests({
        status,
        keyword: keyword || undefined,
        page: 0,
        size: allStatusesBatchSize,
        sortBy: 'submittedAt',
        direction,
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
          sortBy: 'submittedAt',
          direction,
        }),
      ),
    ),
  );
  const uniqueRequests = new Map<string, MentorVerificationRequest>();
  [...initialResponses, ...remainingResponses].forEach((response) => {
    response.content.forEach((request) => uniqueRequests.set(request.requestId, request));
  });
  const sign = direction === 'ASC' ? 1 : -1;
  return [...uniqueRequests.values()].sort(
    (left, right) => sign * (getSubmittedTime(left) - getSubmittedTime(right)),
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
  const [sort, setSort] = useState<SortKey>('oldest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const [statusCounts, setStatusCounts] = useState<Partial<Record<VerificationCountKey, number>>>(
    {},
  );

  const loadStatusCounts = useCallback(async () => {
    try {
      const responses = await Promise.all(
        allRequestStatuses.map((status) =>
          adminRepo.getMentorVerificationRequests({ status, page: 0, size: 1 }),
        ),
      );
      const nextCounts: Partial<Record<VerificationCountKey, number>> = { ALL: 0 };
      responses.forEach((response, index) => {
        const status = allRequestStatuses[index];
        nextCounts[status] = response.totalElements;
        nextCounts.ALL = (nextCounts.ALL ?? 0) + response.totalElements;
      });
      setStatusCounts(nextCounts);
    } catch {
      // Count phụ trợ không được làm gián đoạn danh sách xác minh chính.
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setNow(Date.now());
    try {
      const keyword = search.trim();
      if (!activeStatus) {
        const allRequests = await getAllMentorVerificationRequests(keyword, sort);
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
        sortBy: 'submittedAt',
        direction: sortOptions[sort].direction,
      });
      setRequests(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (reason) {
      setRequests([]);
      setError(getUserFriendlyErrorMessage(reason, 'Không thể tải hồ sơ xác minh.'));
      showError(reason, { title: 'Không thể tải hồ sơ xác minh' });
    } finally {
      setLoading(false);
    }
  }, [activeStatus, page, search, sort]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    void loadStatusCounts();
  }, [loadStatusCounts]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const refresh = () => void Promise.all([loadRequests(), loadStatusCounts()]);
  const activeTab = tabs.find((tab) => tab.value === activeStatus) ?? tabs[tabs.length - 1];
  const rangeStart = requests.length ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize + requests.length, totalElements);

  return (
    <main className="admin-dashboard mentor-verification-page">
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Quản trị <span>›</span> <b>Xác minh mentor</b>
          </div>
          <AdminTopbarActions />
        </header>
        <div className="mentor-verification-content">
          <section className="admin-page-heading">
            <div>
              <h1>Xác minh mentor</h1>
              <p>Hồ sơ chờ lâu nhất hiện ở đầu danh sách. Mở hồ sơ để nhận xử lý.</p>
            </div>
            <div>
              <button type="button" className="admin-button" disabled={loading} onClick={refresh}>
                <RefreshCw aria-hidden="true" /> Làm mới
              </button>
            </div>
          </section>

          <section className={list.card} aria-label="Danh sách hồ sơ xác minh">
            <AdminListTabs
              ariaLabel="Trạng thái hồ sơ"
              tabs={tabs.map((tab) => ({
                value: tab.value,
                label: tab.label,
                count: statusCounts[tab.value ?? 'ALL'],
              }))}
              value={activeStatus}
              onChange={(value) => {
                setActiveStatus(value);
                setPage(0);
              }}
            />

            <div className={list.toolbar}>
              <label className="admin-search-field admin-toolbar-search">
                <Search aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Tìm hồ sơ"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Tìm theo tên, email hoặc mã sinh viên"
                />
              </label>
              <label className={list.selectField}>
                <span>Sắp xếp</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortKey);
                    setPage(0);
                  }}
                >
                  {Object.entries(sortOptions).map(([key, option]) => (
                    <option key={key} value={key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={list.tableScroll}>
              <table className={`${list.table} ${styles.table}`}>
                <thead>
                  <tr>
                    <th>Ứng viên</th>
                    <th>Đã chờ</th>
                    {/* TODO(api): add lockedByAdminFullName + lockExpiresAt to list items to show "Người xử lý" */}
                    <th>Lần bổ sung</th>
                    <th>Gửi lúc</th>
                    <th>
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <AdminTableState
                      variant="loading"
                      colSpan={columnCount}
                      title="Đang tải danh sách hồ sơ…"
                    />
                  ) : error ? (
                    <AdminTableState variant="error" colSpan={columnCount} onRetry={refresh} />
                  ) : requests.length ? (
                    requests.map((request) => {
                      const waiting = getWaitingMinutes(request.submittedAt, now);
                      return (
                        <tr key={request.requestId}>
                          <td>
                            <AdminPersonCell
                              name={request.mentorFullName}
                              email={request.mentorEmail}
                              avatarUrl={request.mentorAvatarUrl}
                            />
                          </td>
                          <td>
                            {waiting === null ? (
                              <span className={list.muted}>—</span>
                            ) : (
                              <span
                                className={`${styles.waiting} ${
                                  waiting >= dayInMinutes ? styles.isOverdue : ''
                                }`}
                              >
                                {formatWaiting(waiting)}
                              </span>
                            )}
                          </td>
                          <td>{request.revisionCount}</td>
                          <td className={list.date}>{formatDate(request.submittedAt)}</td>
                          <td className={list.actionCell}>
                            <Link
                              className="admin-button is-primary"
                              href={`/${locale}/admin/mentor-verification/${request.requestId}`}
                            >
                              Mở hồ sơ
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : search.trim() ? (
                    <AdminTableState
                      variant="no-results"
                      colSpan={columnCount}
                      searchTerm={search}
                      description="Kiểm tra lại chính tả, hoặc chuyển sang tab khác."
                      onClearFilters={() => {
                        setSearch('');
                        setPage(0);
                      }}
                    />
                  ) : (
                    <AdminTableState
                      variant="empty"
                      colSpan={columnCount}
                      title={activeTab.emptyTitle}
                      description="Hồ sơ mới gửi sẽ hiện ở đây."
                    />
                  )}
                </tbody>
              </table>
            </div>

            <footer className={list.footer}>
              <span>
                Hiển thị {rangeStart}–{rangeEnd} trong {totalElements} hồ sơ
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
      </div>
    </main>
  );
}
