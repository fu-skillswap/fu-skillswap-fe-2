/**
 * @file paymentRepo.ts
 * @description Repository trạng thái payment order của người dùng hiện tại
 * (`/api/me/payment-orders/{targetType}/{targetId}`).
 */

import { apiClient } from '@/models/apiClient';
import type { PaymentCheckoutResponse } from '@/models/auth';

export type PaymentTargetType = 'BOOKING' | 'COURSE_ENROLLMENT';

export const paymentRepo = {
  /** Read-only: the stored status after the user comes back from the payment gateway. */
  getOrder: (targetId: string, targetType: PaymentTargetType = 'BOOKING') =>
    apiClient<PaymentCheckoutResponse>(
      `/api/me/payment-orders/${targetType}/${encodeURIComponent(targetId)}`,
    ),
  /**
   * Asks the BE to re-check the gateway when its callback has not arrived yet. Rate-limited by the
   * BE: only call it when the user presses "Kiểm tra lại", never to poll.
   */
  syncOrder: (targetId: string, targetType: PaymentTargetType = 'BOOKING') =>
    apiClient<PaymentCheckoutResponse>(
      `/api/me/payment-orders/${targetType}/${encodeURIComponent(targetId)}/sync`,
      { method: 'POST' },
    ),
};
