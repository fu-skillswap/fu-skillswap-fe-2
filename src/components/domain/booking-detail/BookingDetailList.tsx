/**
 * @file BookingDetailList.tsx
 * @description Label | value rows of the booking detail dialogs. Labels are sentence case; on
 * phones each label sits above its value.
 */

import type { ReactNode } from 'react';

export function BookingDetailList({ children }: { children: ReactNode }) {
  return (
    <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-y-4">
      {children}
    </dl>
  );
}

export function BookingDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-3 text-sm text-text-secondary first-of-type:pt-0 sm:pt-0.5">{label}</dt>
      <dd className="m-0 min-w-0 text-[15px] leading-relaxed font-normal break-words text-text-main">
        {children}
      </dd>
    </>
  );
}
