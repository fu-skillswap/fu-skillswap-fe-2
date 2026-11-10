/**
 * @file ServiceCouponPill.tsx
 * @description Small "{n} mã giảm giá" pill for a mentor service.
 */

import { Ticket } from 'lucide-react';

export function ServiceCouponPill({
  count,
  compact = false,
}: {
  count: number;
  compact?: boolean;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] font-bold text-[#c2410c] ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <Ticket className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {count} mã giảm giá
    </span>
  );
}
