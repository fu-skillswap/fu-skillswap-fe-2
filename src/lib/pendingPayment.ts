/**
 * @file pendingPayment.ts
 * @description Ghi nhớ booking vừa chuyển sang PayOS để trang `/payment/return` biết cần kiểm tra
 * booking nào (PayOS chỉ trả `orderCode`, không trả bookingId).
 */

const STORAGE_KEY = 'skillswap:pending-payment';
/** A PayOS link lives at most a day; older entries are ignored. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingPayment {
  bookingId: string;
  orderCode?: string | null;
  savedAt: number;
}

export function savePendingPayment(bookingId: string, orderCode?: string | null) {
  try {
    const value: PendingPayment = { bookingId, orderCode: orderCode ?? null, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode / storage disabled: the return page falls back to the booking list.
  }
}

export function readPendingPayment(): PendingPayment | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingPayment>;
    if (typeof value.bookingId !== 'string' || typeof value.savedAt !== 'number') return null;
    if (Date.now() - value.savedAt > MAX_AGE_MS) return null;
    return {
      bookingId: value.bookingId,
      orderCode: value.orderCode ?? null,
      savedAt: value.savedAt,
    };
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
