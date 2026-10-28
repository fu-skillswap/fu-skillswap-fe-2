/**
 * @file NavBadge.tsx
 * @description Red count pill / dot used on sidebar items, header icons and in-page tabs.
 * Purely visual: the parent link or button carries the accessible label (see navBadgeLabel).
 */

import type { ReactNode } from 'react';
import type { SectionBadge } from './useNavBadges';

const RING = 'shadow-[0_0_0_2px_#fff]';

/** Count pill, "9+" above 9. */
export function BadgeCount({ count, className = '' }: { count: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full bg-badge px-1.5 text-xs leading-none font-bold text-white ${RING} ${className}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** 10px dot, usually pinned to an icon's top-right corner. */
export function BadgeDot({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-2.5 w-2.5 shrink-0 rounded-full bg-badge ${RING} ${className}`}
    />
  );
}

/** "{label}, {n} việc cần bạn xử lý" / "{label}, có cập nhật mới" / plain label. */
export function navBadgeLabel(label: string, badge: SectionBadge) {
  if (badge.count > 0) return `${label}, ${badge.count} việc cần bạn xử lý`;
  if (badge.dot) return `${label}, có cập nhật mới`;
  return undefined;
}

/** Wraps a nav icon; shows the dot on its top-right corner when there is unseen news. */
export function NavIconMark({ badge, children }: { badge: SectionBadge; children: ReactNode }) {
  return (
    <span className="relative inline-flex shrink-0">
      {children}
      {badge.dot && <BadgeDot className="absolute -top-1 -right-1" />}
    </span>
  );
}

/** Count pill pushed to the right end of a nav row. */
export function NavCountMark({ badge }: { badge: SectionBadge }) {
  return badge.count > 0 ? <BadgeCount count={badge.count} className="ml-auto" /> : null;
}
