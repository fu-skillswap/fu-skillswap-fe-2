/**
 * @file AdminTableState.tsx
 * @description Trạng thái tải / trống / không có kết quả / lỗi dùng chung cho các bảng quản trị.
 * Luôn render một hàng trải hết chiều rộng bảng.
 */

import { CircleCheck, Search, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type AdminTableStateVariant = 'loading' | 'empty' | 'no-results' | 'error';

type AdminTableStateProps = {
  variant: AdminTableStateVariant;
  colSpan: number;
  title?: string;
  description?: string;
  /** Custom action; overrides the `onRetry` / `onClearFilters` buttons. */
  action?: ReactNode;
  /** no-results: the searched text, shown as `Không tìm thấy "<term>"`. */
  searchTerm?: string;
  /** error: renders a primary "Thử lại" button. */
  onRetry?: () => void;
  /** no-results: renders a "Xóa bộ lọc" button. */
  onClearFilters?: () => void;
  skeletonRows?: number;
};

const variantContent: Record<
  Exclude<AdminTableStateVariant, 'loading'>,
  { icon: LucideIcon; title: string; description: string }
> = {
  empty: {
    icon: CircleCheck,
    title: 'Chưa có dữ liệu',
    description: 'Dữ liệu mới sẽ xuất hiện tại đây.',
  },
  'no-results': {
    icon: Search,
    title: 'Không tìm thấy kết quả phù hợp',
    description: 'Kiểm tra lại chính tả hoặc bỏ bớt bộ lọc.',
  },
  error: {
    icon: TriangleAlert,
    title: 'Không tải được danh sách',
    description: 'Máy chủ không phản hồi. Dữ liệu chưa bị thay đổi, bạn có thể thử lại.',
  },
};

export function AdminTableState({
  variant,
  colSpan,
  title,
  description,
  action,
  searchTerm,
  onRetry,
  onClearFilters,
  skeletonRows = 5,
}: AdminTableStateProps) {
  if (variant === 'loading') {
    const bars = Math.max(colSpan - 1, 0);
    return (
      <tr className="admin-table-state-row">
        <td colSpan={colSpan} className="admin-table-state-cell" aria-busy="true">
          <span className="sr-only" role="status">
            {title ?? 'Đang tải…'}
          </span>
          <div className="admin-table-skeleton" aria-hidden="true">
            {Array.from({ length: skeletonRows }, (_, row) => (
              <div key={row} className="admin-table-skeleton-row">
                <div className="admin-table-skeleton-lead">
                  <span className="admin-skeleton is-circle" />
                  <span className="admin-table-skeleton-lines">
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton is-short" />
                  </span>
                </div>
                {Array.from({ length: bars }, (_, column) => (
                  <span key={column} className="admin-skeleton" />
                ))}
              </div>
            ))}
          </div>
        </td>
      </tr>
    );
  }

  const content = variantContent[variant];
  const Icon = content.icon;
  const term = searchTerm?.trim();
  const resolvedTitle =
    title ?? (variant === 'no-results' && term ? `Không tìm thấy "${term}"` : content.title);
  const resolvedAction =
    action ??
    (variant === 'error' && onRetry ? (
      <button type="button" className="admin-button is-primary" onClick={onRetry}>
        Thử lại
      </button>
    ) : variant === 'no-results' && onClearFilters ? (
      <button type="button" className="admin-button" onClick={onClearFilters}>
        Xóa bộ lọc
      </button>
    ) : null);

  return (
    <tr className="admin-table-state-row">
      <td colSpan={colSpan} className="admin-table-state-cell">
        <div
          className={`admin-table-feedback is-${variant}`}
          role={variant === 'error' ? 'alert' : undefined}
        >
          <span className="admin-table-feedback-icon" aria-hidden="true">
            <Icon />
          </span>
          <strong>{resolvedTitle}</strong>
          <p>{description ?? content.description}</p>
          {resolvedAction && <div className="admin-table-feedback-action">{resolvedAction}</div>}
        </div>
      </td>
    </tr>
  );
}
