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
  action?: ReactNode;
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
    description: 'Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả.',
  },
  error: {
    icon: TriangleAlert,
    title: 'Không thể tải dữ liệu',
    description: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
  },
};

export function AdminTableState({
  variant,
  colSpan,
  title,
  description,
  action,
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
          <strong>{title ?? content.title}</strong>
          <p>{description ?? content.description}</p>
          {action && <div className="admin-table-feedback-action">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
