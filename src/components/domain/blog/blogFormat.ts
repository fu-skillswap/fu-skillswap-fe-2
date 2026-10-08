/**
 * @file blogFormat.ts
 * @description Helper định dạng dùng chung cho các màn Blog phía người đọc.
 */

export function formatBlogDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatCount(value?: number | null) {
  return new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value ?? 0);
}

export function authorInitials(name?: string | null) {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'SS'
  );
}

const SESSION_KEY = 'SS_BLOG_SESSION';

/** Per-tab id the backend uses to deduplicate view / CTA events. */
export function blogSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
