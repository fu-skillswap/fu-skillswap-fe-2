/**
 * @file PaymentReturnNotice.tsx
 * @description Shows one toast after the payment gateway sends the mentee back to
 * "Lịch đặt của tôi", then removes `?payment=` from the URL so a reload does not repeat it.
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { showInfo, showSuccess } from '@/utils/toast';

export type PaymentReturnResult = 'cancelled' | 'success';

export function PaymentReturnNotice({ result }: { result?: PaymentReturnResult }) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (!result || shown.current) return;
    shown.current = true;
    if (result === 'cancelled') {
      showInfo({
        title: 'Bạn chưa thanh toán',
        description: 'Lịch vẫn đang chờ thanh toán. Bấm "Thanh toán" trên lịch để tiếp tục.',
      });
    } else {
      showSuccess({
        title: 'Đã ghi nhận thanh toán',
        description: 'Trạng thái lịch sẽ được cập nhật trong giây lát.',
      });
    }
    router.replace(pathname, { scroll: false });
  }, [pathname, result, router]);

  return null;
}
