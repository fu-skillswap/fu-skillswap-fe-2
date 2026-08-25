/**
 * @file AdminReportsView.tsx
 * @description Danh sách báo cáo nội dung cộng đồng dành cho quản trị viên.
 */

'use client';

import { AdminTopbarActions } from '@/components/domain/admin/AdminTopbarActions';
import { ApiClientError } from '@/models/apiClient';
import type { AdminForumReport, ForumReportStatus } from '@/models/admin';
import { adminRepo } from '@/repositories/adminRepo';
import { ChevronLeft, ChevronRight, Filter, RefreshCw, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

const pageSize = 10;
const statuses: Array<{ value: ForumReportStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'RESOLVED_NO_ACTION', label: 'Đã xử lý, không tác động' },
  { value: 'RESOLVED_ACTION_TAKEN', label: 'Đã xử lý' },
  { value: 'DISMISSED', label: 'Đã bỏ qua' },
];

function getErrorMessage(reason: unknown) {
  return reason instanceof ApiClientError ? reason.message : 'Không thể tải danh sách báo cáo.';
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

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getPageNumbers(page: number, totalPages: number) {
  const start = Math.max(0, Math.min(page - 2, Math.max(totalPages - 5, 0)));
  return Array.from(
    { length: Math.min(totalPages, start + 5) - start },
    (_, index) => start + index,
  );
}

export function AdminReportsView() {
  const { locale } = useParams<{ locale: string }>();
  const [reports, setReports] = useState<AdminForumReport[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<ForumReportStatus | ''>('OPEN');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await adminRepo.getForumReports({
        page,
        size: pageSize,
        keyword: keyword.trim() || undefined,
        status: status || undefined,
      });
      setReports(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [keyword, page, status]);

  useEffect(() => void loadReports(), [loadReports]);
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);
  const first = reports.length ? page * pageSize + 1 : 0;
  const last = reports.length ? Math.min((page + 1) * pageSize, totalElements) : 0;

  return (
    <main className="admin-reports-page">
      <header className="admin-topbar">
        <div className="admin-breadcrumb">
          Quản trị <span>›</span> <b>Đánh giá &amp; báo cáo</b>
        </div>
        <AdminTopbarActions />
      </header>
      <div className="admin-reports-content">
        <section className="admin-page-heading">
          <div>
            <h1>Báo cáo cộng đồng</h1>
            <p>Rà soát các báo cáo nội dung do người dùng gửi.</p>
          </div>
        </section>
        {error && (
          <div className="admin-dashboard-toast" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(undefined)} aria-label="Đóng thông báo">
              <X aria-hidden="true" />
            </button>
          </div>
        )}
        <section className="admin-reports-table" aria-labelledby="admin-reports-title">
          <div className="admin-reports-toolbar">
            <label>
              <Search aria-hidden="true" />
              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(0);
                }}
                placeholder="Tìm nội dung hoặc người báo cáo..."
                aria-label="Tìm báo cáo"
              />
            </label>
            <div>
              <label className="admin-users-status-filter">
                <Filter aria-hidden="true" />
                <span>Trạng thái</span>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as ForumReportStatus | '');
                    setPage(0);
                  }}
                  aria-label="Lọc trạng thái"
                >
                  {statuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void loadReports()} disabled={loading}>
                <RefreshCw aria-hidden="true" /> Làm mới
              </button>
            </div>
          </div>
          <div className="admin-reports-scroll">
            <table>
              <thead>
                <tr>
                  <th id="admin-reports-title">Nội dung bị báo cáo</th>
                  <th>Người báo cáo</th>
                  <th>Lý do</th>
                  <th>Gửi lúc</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <StateRow message="Đang tải báo cáo..." />
                ) : reports.length ? (
                  reports.map((report) => (
                    <ReportRow key={report.reportId} report={report} locale={locale} />
                  ))
                ) : (
                  <StateRow message="Không tìm thấy báo cáo phù hợp." />
                )}
              </tbody>
            </table>
          </div>
          <footer className="admin-users-pagination">
            <span>
              Hiển thị {first}–{last} / {totalElements} báo cáo
            </span>
            <div>
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

function StateRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={6} className="admin-users-state">
        <span>{message}</span>
      </td>
    </tr>
  );
}

function ReportRow({ report, locale }: { report: AdminForumReport; locale: string }) {
  return (
    <tr>
      <td>
        <b>
          {labelOf(report.targetType)}: {report.targetTitle ?? 'Không có tiêu đề'}
        </b>
        <small>{report.targetContentPreview ?? 'Không có nội dung xem trước.'}</small>
      </td>
      <td>{report.reporterFullName ?? 'Không xác định'}</td>
      <td>{labelOf(report.reasonType)}</td>
      <td>{formatDate(report.createdAt)}</td>
      <td>
        <span className={`admin-report-status ${report.status.toLowerCase().replaceAll('_', '-')}`}>
          {labelOf(report.status)}
        </span>
      </td>
      <td>
        <Link href={`/${locale}/admin/reports/${report.reportId}`}>Xem</Link>
      </td>
    </tr>
  );
}
