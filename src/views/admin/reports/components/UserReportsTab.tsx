/**
 * @file UserReportsTab.tsx
 * @description Bảng báo cáo do người dùng gửi: "Cần xử lý" (OPEN) hoặc "Đã xử lý".
 */

'use client';

import {
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import type { AdminCaseOwnership, AdminForumReport, ForumReportStatus } from '@/models/admin';
import { useAuth } from '@/providers/AuthProvider';
import { adminRepo } from '@/repositories/adminRepo';
import { RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../ReportModeration.module.css';
import {
  FORUM_REPORT_CASE_TYPE,
  RESOLVED_FILTER_OPTIONS,
  STATUS_UI,
  TARGET_TYPE_FILTER_OPTIONS,
  formatReportTime,
  type TargetType,
} from '../reportModeration.constants';
import {
  OwnerCell,
  ReasonCell,
  ReportContentCell,
  WaitCell,
  type OwnershipEntry,
} from './ReportListCells';
import { StatusPill } from './ReportPills';

const pageSize = 10;
const columnCount = 6;

/**
 * Ownership of every report on the current page, fetched in parallel and cached per report.
 * TODO(api): add assignedAdminUserId / assignedAdminDisplayName to the list item to drop these calls.
 */
function useOwnerships(reports: AdminForumReport[], enabled: boolean) {
  const cache = useRef(new Map<string, AdminCaseOwnership>());
  const [entries, setEntries] = useState<Record<string, OwnershipEntry>>({});

  useEffect(() => {
    if (!enabled || !reports.length) return;
    let cancelled = false;
    const missing = reports.filter((report) => !cache.current.has(report.reportId));
    setEntries(() => {
      const next: Record<string, OwnershipEntry> = {};
      reports.forEach((report) => {
        next[report.reportId] = cache.current.get(report.reportId) ?? 'loading';
      });
      return next;
    });
    missing.forEach((report) => {
      adminRepo
        .getCaseOwnership(FORUM_REPORT_CASE_TYPE, report.reportId)
        .then((ownership) => {
          cache.current.set(report.reportId, ownership);
          if (!cancelled) setEntries((current) => ({ ...current, [report.reportId]: ownership }));
        })
        .catch(() => {
          if (!cancelled) setEntries((current) => ({ ...current, [report.reportId]: 'error' }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, reports]);

  const clear = useCallback(() => cache.current.clear(), []);
  return { entries, clear };
}

export function UserReportsTab({
  mode,
  locale,
  onShowResolved,
  onLoaded,
}: {
  /** `open` lists OPEN reports; `resolved` lists one resolved status at a time. */
  mode: 'open' | 'resolved';
  locale: string;
  onShowResolved: () => void;
  /** Called after each successful load, e.g. to refresh the tab counts. */
  onLoaded?: () => void;
}) {
  const { user } = useAuth();
  const [reports, setReports] = useState<AdminForumReport[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // TODO(api): accept several statuses so "Đã xử lý" can list every resolved report at once.
  const [resolvedStatus, setResolvedStatus] = useState<ForumReportStatus>('RESOLVED_ACTION_TAKEN');
  const [targetType, setTargetType] = useState<'' | TargetType>('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const status: ForumReportStatus = mode === 'open' ? 'OPEN' : resolvedStatus;
  const isOpenMode = mode === 'open';
  const isFiltered = Boolean(keyword || targetType);
  const ownerships = useOwnerships(reports, isOpenMode);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [keywordInput]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      // TODO(api): add a sort param (createdAt ASC) so the queue lists the longest-waiting report
      // first; until then the server order is kept.
      const data = await adminRepo.getForumReports({
        page,
        size: pageSize,
        keyword: keyword || undefined,
        status,
        targetType: targetType || undefined,
      });
      setReports(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      onLoaded?.();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, status, targetType, onLoaded]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const refresh = () => {
    ownerships.clear();
    void loadReports();
  };

  const clearFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setTargetType('');
    setPage(0);
  };

  const first = reports.length ? page * pageSize + 1 : 0;
  const last = page * pageSize + reports.length;
  const resolvedLabel = STATUS_UI[resolvedStatus].label;

  const emptyState = isOpenMode ? (
    <AdminTableState
      variant="empty"
      colSpan={columnCount}
      title="Không còn báo cáo cần xử lý"
      description="Báo cáo mới từ người dùng sẽ hiện ở đây."
      action={
        <button type="button" className="admin-button" onClick={onShowResolved}>
          Xem báo cáo đã xử lý
        </button>
      }
    />
  ) : (
    <AdminTableState
      variant="empty"
      colSpan={columnCount}
      title={`Chưa có báo cáo “${resolvedLabel}”`}
      description="Chọn kết quả xử lý khác để xem các báo cáo còn lại."
    />
  );

  const renderRow = (report: AdminForumReport) => {
    const entry = ownerships.entries[report.reportId];
    const heldByOther =
      isOpenMode &&
      typeof entry === 'object' &&
      entry.assigned &&
      entry.assignedAdminUserId !== user?.id;
    const reviewedByMe = Boolean(user?.id) && report.reviewedByUserId === user?.id;
    return (
      <tr key={report.reportId}>
        <td>
          <ReportContentCell report={report} />
        </td>
        <td>
          <ReasonCell report={report} />
        </td>
        <td>{report.reporterFullName?.trim() || <span className={list.muted}>Không rõ</span>}</td>
        <td>
          {isOpenMode ? (
            <OwnerCell entry={entry} currentUserId={user?.id} />
          ) : (
            <div className={styles.stackCell}>
              <StatusPill status={report.status} />
              {/* TODO(api): add reviewedByDisplayName to show who closed reports of other admins. */}
              {reviewedByMe && <span className={styles.metaLine}>bởi Bạn</span>}
            </div>
          )}
        </td>
        <td>
          {isOpenMode ? (
            <WaitCell from={report.createdAt} />
          ) : (
            <span className={list.date}>{formatReportTime(report.resolvedAt)}</span>
          )}
        </td>
        <td className={`${list.actionCell} ${styles.actionCell}`}>
          <Link
            className={`admin-button ${isOpenMode && !heldByOther ? 'is-primary' : ''}`}
            href={`/${locale}/admin/reports/${report.reportId}`}
          >
            {isOpenMode && !heldByOther ? 'Mở báo cáo' : 'Xem'}
          </Link>
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className={list.toolbar}>
        <label className="admin-search-field admin-toolbar-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Tìm theo nội dung hoặc người báo cáo"
            aria-label="Tìm báo cáo"
          />
        </label>
        <label className={list.selectField}>
          <span>Loại nội dung</span>
          <select
            value={targetType}
            onChange={(event) => {
              setTargetType(event.target.value as '' | TargetType);
              setPage(0);
            }}
          >
            {TARGET_TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {!isOpenMode && (
          <label className={list.selectField}>
            <span>Kết quả</span>
            <select
              value={resolvedStatus}
              onChange={(event) => {
                setResolvedStatus(event.target.value as ForumReportStatus);
                setPage(0);
              }}
            >
              {RESOLVED_FILTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className={`admin-button ${list.toolbarEnd}`}
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw aria-hidden="true" /> Làm mới
        </button>
      </div>
      <div className={list.tableScroll}>
        <table className={`${list.table} ${styles.reportsTable}`}>
          <thead>
            <tr>
              <th>Nội dung bị báo cáo</th>
              <th>Lý do</th>
              <th>Người báo cáo</th>
              <th>{isOpenMode ? 'Người xử lý' : 'Kết quả'}</th>
              <th>{isOpenMode ? 'Đã chờ' : 'Đóng lúc'}</th>
              <th>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <AdminTableState variant="loading" colSpan={columnCount} title="Đang tải báo cáo…" />
            ) : failed ? (
              <AdminTableState
                variant="error"
                colSpan={columnCount}
                title="Không tải được danh sách báo cáo"
                description="Kiểm tra kết nối rồi thử lại. Dữ liệu chưa bị thay đổi."
                onRetry={refresh}
              />
            ) : reports.length ? (
              reports.map(renderRow)
            ) : isFiltered ? (
              <AdminTableState
                variant="no-results"
                colSpan={columnCount}
                title="Không có báo cáo khớp bộ lọc"
                onClearFilters={clearFilters}
              />
            ) : (
              emptyState
            )}
          </tbody>
        </table>
      </div>
      <footer className={list.footer}>
        <span>
          Hiển thị {first}–{last} trong {totalElements} báo cáo
        </span>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          disabled={loading}
          onChange={setPage}
        />
      </footer>
    </>
  );
}
