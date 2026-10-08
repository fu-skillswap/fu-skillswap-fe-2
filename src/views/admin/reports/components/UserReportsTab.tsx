/**
 * @file UserReportsTab.tsx
 * @description Bảng báo cáo do người dùng gửi: đang mở hoặc đã xử lý.
 */

'use client';

import {
  AdminPagination,
  adminListStyles as list,
} from '@/components/domain/admin/AdminListControls';
import { AdminTableState } from '@/components/domain/admin/AdminTableState';
import type { AdminForumReport, ForumReportStatus } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { showError } from '@/utils/toast';
import { RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from '../AdminReportsView.module.css';
import { formatDateTime, labelOf, resolvedStatuses } from '../reports.constants';
import { ContentCell } from './ContentCell';

const pageSize = 10;

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
  const [reports, setReports] = useState<AdminForumReport[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // TODO(api): accept several statuses so "Đã xử lý" can list every resolved report at once.
  const [resolvedStatus, setResolvedStatus] = useState<ForumReportStatus>('RESOLVED_ACTION_TAKEN');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const status: ForumReportStatus = mode === 'open' ? 'OPEN' : resolvedStatus;
  const columnCount = mode === 'open' ? 5 : 6;

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
      const data = await adminRepo.getForumReports({
        page,
        size: pageSize,
        keyword: keyword || undefined,
        status,
      });
      setReports(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      onLoaded?.();
    } catch (reason) {
      setFailed(true);
      showError(reason, { title: 'Không thể tải báo cáo' });
    } finally {
      setLoading(false);
    }
  }, [keyword, page, status, onLoaded]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const clearFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setPage(0);
  };

  const first = reports.length ? page * pageSize + 1 : 0;
  const last = page * pageSize + reports.length;
  const resolvedLabel = resolvedStatuses.find((item) => item.value === resolvedStatus)?.label;

  const emptyState =
    mode === 'open' ? (
      <AdminTableState
        variant="empty"
        colSpan={columnCount}
        title="Không có báo cáo đang mở"
        description="Khi người dùng báo cáo bài viết hoặc bình luận, báo cáo sẽ hiện ở đây."
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
        title={`Chưa có báo cáo "${resolvedLabel}"`}
        description="Chọn kết quả xử lý khác để xem các báo cáo còn lại."
      />
    );

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
        {mode === 'resolved' && (
          <label className={list.selectField}>
            <span>Kết quả</span>
            <select
              value={resolvedStatus}
              onChange={(event) => {
                setResolvedStatus(event.target.value as ForumReportStatus);
                setPage(0);
              }}
            >
              {resolvedStatuses.map((item) => (
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
          onClick={() => void loadReports()}
          disabled={loading}
        >
          <RefreshCw aria-hidden="true" /> Làm mới
        </button>
      </div>
      <div className={list.tableScroll}>
        <table className={`${list.table} ${styles.reportsTable}`} data-mode={mode}>
          <thead>
            <tr>
              <th>Nội dung bị báo cáo</th>
              <th>Người báo cáo</th>
              <th>Lý do</th>
              <th>Gửi lúc</th>
              {mode === 'resolved' && <th>Kết quả</th>}
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
                onRetry={() => void loadReports()}
              />
            ) : reports.length ? (
              reports.map((report) => (
                <tr key={report.reportId}>
                  <td>
                    <ContentCell
                      targetType={report.targetType}
                      title={report.targetTitle}
                      excerpt={report.targetContentPreview}
                      authorName={report.targetAuthorFullName}
                    />
                  </td>
                  <td>
                    {report.reporterFullName ?? <span className={list.muted}>Không xác định</span>}
                  </td>
                  <td>
                    <span className={styles.tag}>{labelOf(report.reasonType)}</span>
                  </td>
                  <td className={list.date}>{formatDateTime(report.createdAt)}</td>
                  {mode === 'resolved' && (
                    <td>
                      <span
                        className={`admin-report-status ${report.status
                          .toLowerCase()
                          .replaceAll('_', '-')}`}
                      >
                        {labelOf(report.status)}
                      </span>
                    </td>
                  )}
                  <td className={list.actionCell}>
                    <Link
                      className={`admin-button ${mode === 'open' ? 'is-primary' : ''}`}
                      href={`/${locale}/admin/reports/${report.reportId}`}
                    >
                      {mode === 'open' ? 'Xử lý' : 'Xem'}
                    </Link>
                  </td>
                </tr>
              ))
            ) : keyword ? (
              <AdminTableState
                variant="no-results"
                colSpan={columnCount}
                searchTerm={keyword}
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
