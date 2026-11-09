/**
 * @file ServiceCouponPriceNote.tsx
 * @description Amber note under the price field when the service has coupons.
 */

import { Ticket } from 'lucide-react';

export function ServiceCouponPriceNote({ count, id }: { count: number; id?: string }) {
  if (count <= 0) return null;
  return (
    <p
      id={id}
      className="mt-2 flex items-start gap-2 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3 py-2.5 text-xs leading-5 text-[#9a3412]"
    >
      <Ticket className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Dịch vụ đang có {count} mã giảm giá. Đổi giá thì số S-coins mentee được giảm cũng đổi theo.
        Chuyển sang miễn phí sẽ không áp được mã.
      </span>
    </p>
  );
}
