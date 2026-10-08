/**
 * @file AdminListControls.tsx
 * @description Thành phần dùng chung cho các trang danh sách quản trị: tab gạch chân, ô người dùng
 * (ảnh + tên / email), phân trang.
 */

'use client';

import type { CSSProperties } from 'react';
import styles from './AdminList.module.css';

export { styles as adminListStyles };

type ListTab<T> = { value: T; label: string; count?: number };

export function AdminListTabs<T extends string | undefined>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: Array<ListTab<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={selected}
            className={selected ? styles.isActive : undefined}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {'count' in tab && (
              <span className={styles.tabCount}>{tab.count === undefined ? '—' : tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
  return letters.toUpperCase();
}

export function AdminPersonCell({
  name,
  email,
  avatarUrl,
  avatarSize = 38,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  avatarSize?: number;
}) {
  const sizeStyle = { '--avatar-size': `${avatarSize}px` } as CSSProperties;
  return (
    <div className={styles.person}>
      {avatarUrl ? (
        <img className={styles.avatar} style={sizeStyle} src={avatarUrl} alt="" loading="lazy" />
      ) : (
        <span className={styles.avatar} style={sizeStyle} aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
      <div>
        <strong title={name}>{name}</strong>
        <span title={email}>{email}</span>
      </div>
    </div>
  );
}

/** Page numbers with gaps, e.g. [0, 'gap', 3, 4, 5, 'gap', 9]. */
function getPageItems(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 0 && page < total).sort((a, b) => a - b);
  return sorted.flatMap((page, index) =>
    index > 0 && page - sorted[index - 1] > 1 ? (['gap', page] as const) : [page],
  );
}

export function AdminPagination({
  page,
  totalPages,
  disabled = false,
  onChange,
}: {
  /** Zero-based current page. */
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 0) return null;
  return (
    <nav className={styles.pagination} aria-label="Phân trang">
      <button type="button" disabled={page === 0 || disabled} onClick={() => onChange(page - 1)}>
        Trước
      </button>
      {getPageItems(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className={styles.pageGap} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={item === page ? styles.isCurrent : undefined}
            aria-label={`Trang ${item + 1}`}
            aria-current={item === page ? 'page' : undefined}
            disabled={disabled}
            onClick={() => onChange(item)}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages - 1 || disabled}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </button>
    </nav>
  );
}
