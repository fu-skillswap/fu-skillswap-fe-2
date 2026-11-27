/**
 * @file invoice.helpers.ts
 * @description Dựng hóa đơn của một buổi học từ booking + payment order.
 * TODO(api): no invoice/receipt endpoint yet. A `GET /api/me/invoices` (number, paidAt, buyer and
 * seller details, line items) would replace this; paidAt is missing from the payment order today.
 */

import type { MentorBookingResponse, PaymentCheckoutResponse } from '@/models/auth';
import { SCOIN_TO_VND } from '@/constants/legal';
import { getMentorName, getPlatformLabel, toDate } from '../my-bookings/bookingStatusConfig';

export type InvoiceStatus = 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface Invoice {
  bookingId: string;
  /** PayOS order code when known, otherwise a short booking reference. */
  number: string;
  status: InvoiceStatus;
  serviceTitle: string;
  mentorName: string;
  menteeName: string;
  start?: Date;
  end?: Date;
  durationMinutes: number;
  platform?: string;
  /** Price before discounts and credit. */
  priceScoin: number;
  couponDiscountScoin: number;
  campaignCreditScoin: number;
  userCreditScoin: number;
  /** What the user actually paid through PayOS. */
  paidScoin: number;
  paidVnd: number;
  refundedScoin: number;
  method: string;
  /** False when the payment order could not be loaded (amounts fall back to the list price). */
  hasOrderDetails: boolean;
}

const toNumber = (value: unknown) => Math.max(0, Number(value) || 0);

export function getListPriceScoin(booking: MentorBookingResponse) {
  return toNumber(booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot);
}

/** Bookings that have a receipt: paid (or later refunded), never free sessions. */
export function hasInvoice(booking: MentorBookingResponse) {
  if (booking.serviceIsFreeSnapshot || getListPriceScoin(booking) <= 0) return false;
  const status = String(booking.paymentStatus ?? '').toUpperCase();
  return status === 'PAID' || status === 'REFUNDED';
}

export function shortReference(bookingId: string) {
  return bookingId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function buildInvoice(
  booking: MentorBookingResponse,
  order?: PaymentCheckoutResponse | null,
): Invoice {
  const listPrice = getListPriceScoin(booking);
  const priceScoin = order?.priceScoin != null ? toNumber(order.priceScoin) : listPrice;
  const couponDiscountScoin = toNumber(order?.couponDiscountScoin);
  const campaignCreditScoin = toNumber(order?.campaignCreditAppliedScoin);
  const userCreditScoin = toNumber(order?.userCreditAppliedScoin);
  const paidScoin =
    order?.remainingPayableScoin != null
      ? toNumber(order.remainingPayableScoin)
      : Math.max(0, priceScoin - couponDiscountScoin - campaignCreditScoin - userCreditScoin);
  const paidVnd =
    order?.remainingPayableVnd != null
      ? toNumber(order.remainingPayableVnd)
      : paidScoin * (SCOIN_TO_VND ?? 1);
  const refundedScoin = toNumber(booking.refundedScoin);
  const paymentStatus = String(booking.paymentStatus ?? '').toUpperCase();
  const totalPaid = paidScoin + userCreditScoin;
  const status: InvoiceStatus =
    paymentStatus === 'REFUNDED' || booking.settlementStatus === 'REFUNDED'
      ? refundedScoin > 0 && refundedScoin < totalPaid
        ? 'PARTIALLY_REFUNDED'
        : 'REFUNDED'
      : refundedScoin > 0
        ? 'PARTIALLY_REFUNDED'
        : 'PAID';
  const start = toDate(booking.selectedStartTime);
  const end = toDate(booking.selectedEndTime);
  const durationMinutes =
    booking.serviceDurationSnapshot ||
    (start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0);

  return {
    bookingId: booking.bookingId,
    number: order?.orderCode ? String(order.orderCode) : shortReference(booking.bookingId),
    status,
    serviceTitle: booking.serviceTitle?.trim() || booking.learningGoalTitle || 'Buổi mentoring 1:1',
    mentorName: getMentorName(booking),
    menteeName: booking.menteeDisplayName,
    start,
    end,
    durationMinutes,
    platform: getPlatformLabel(booking),
    priceScoin,
    couponDiscountScoin,
    campaignCreditScoin,
    userCreditScoin,
    paidScoin,
    paidVnd,
    refundedScoin,
    method: paidScoin > 0 ? 'Chuyển khoản qua PayOS' : 'Mã giảm giá / ví S-coins',
    hasOrderDetails: Boolean(order),
  };
}

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  PAID: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  PARTIALLY_REFUNDED: {
    label: 'Hoàn một phần',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

const vndFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export function formatVnd(value: number) {
  return `${vndFormatter.format(Math.round(value))} VNĐ`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDateTime(date?: Date) {
  return date ? dateTimeFormatter.format(date) : '—';
}
