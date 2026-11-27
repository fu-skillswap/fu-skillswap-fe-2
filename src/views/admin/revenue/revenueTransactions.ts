/**
 * @file revenueTransactions.ts
 * @description Data loading + pure matching for the "Lịch sử giao dịch" table.
 *
 * The admin API has no payment-order list, and admin bookings carry no paymentOrderId, so the
 * amount actually charged is rebuilt from two sources:
 * - `GET /api/admin/bookings`                       → who paid, which session, list price
 * - `GET /api/admin/coupons/{couponId}/redemptions` → coupon discount per payment, by redeemer
 * A redemption is attached to the redeemer's paid booking created closest before it.
 *
 * TODO(api): `GET /api/admin/payment-orders` (bookingId, paidAt, priceScoin, couponDiscountScoin,
 * campaignCreditAppliedScoin, userCreditAppliedScoin, amountPaidVnd, platformFeeScoin) would make
 * this exact and also cover campaign / S-coin wallet credits, which no admin API exposes today.
 */

import type { AdminBooking } from '@/models/admin';
import type { CouponRedemptionView, CouponView } from '@/models/coupon';
import { adminRepo } from '@/repositories/adminRepo';
import { couponRepo } from '@/repositories/couponRepo';

const PAGE_SIZE = 100;
/** Safety cap per paged list (10 × 100 items). */
const MAX_PAGES = 10;
const MONEY_MOVED_STATUSES = ['PAID', 'REFUNDED'];
/** Redemptions whose discount was given back (payment failed / expired / refunded). */
const RELEASED_REDEMPTION_STATUSES = ['RELEASED', 'CANCELLED', 'EXPIRED', 'FAILED'];

export interface AppliedCoupon {
  code: string;
  discount: number;
}

export interface RevenueTransaction {
  booking: AdminBooking;
  /** Mentee price incl. platform surcharge, before any discount. */
  listPrice: number;
  coupon: AppliedCoupon | null;
  /** listPrice − coupon discount, never below 0. */
  amountPaid: number;
}

export interface RevenueTransactionsData {
  transactions: RevenueTransaction[];
  /** Coupon redemptions that could not be tied to a paid booking. */
  unmatchedRedemptions: number;
  /** False when the coupon lookups failed; amounts then ignore discounts. */
  couponsLoaded: boolean;
}

async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ content?: T[]; last?: boolean } | null | undefined>,
) {
  const items: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchPage(page);
    const content = Array.isArray(response?.content) ? response.content : [];
    items.push(...content);
    if (response?.last !== false || !content.length) break;
  }
  return items;
}

function getListPrice(booking: AdminBooking) {
  return Math.max(
    0,
    booking.servicePriceWithSurchargeScoin ?? booking.servicePriceScoinSnapshot ?? 0,
  );
}

function toTime(value: string | null | undefined) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? undefined : time;
}

type Redemption = CouponRedemptionView & { code: string };

/**
 * Ties each redemption to the redeemer's not-yet-matched paid booking that was created closest
 * before the redemption (checkout always follows booking creation) and can absorb the discount.
 */
export function matchCouponsToBookings(bookings: AdminBooking[], redemptions: Redemption[]) {
  const couponByBooking = new Map<string, AppliedCoupon>();
  let unmatched = 0;
  const ordered = [...redemptions].sort(
    (a, b) => (toTime(a.createdAt) ?? 0) - (toTime(b.createdAt) ?? 0),
  );

  for (const redemption of ordered) {
    const redeemedAt = toTime(redemption.createdAt);
    const candidates = bookings.filter((booking) => {
      if (booking.menteeUserId !== redemption.redeemerUserId) return false;
      if (couponByBooking.has(booking.bookingId)) return false;
      const createdAt = toTime(booking.createdAt);
      if (redeemedAt !== undefined && createdAt !== undefined && createdAt > redeemedAt) {
        return false;
      }
      return getListPrice(booking) >= (redemption.discountScoin ?? 0);
    });
    const best = candidates.sort(
      (a, b) => (toTime(b.createdAt) ?? 0) - (toTime(a.createdAt) ?? 0),
    )[0];
    if (!best) {
      unmatched += 1;
      continue;
    }
    couponByBooking.set(best.bookingId, {
      code: redemption.code,
      discount: Math.max(0, redemption.discountScoin ?? 0),
    });
  }
  return { couponByBooking, unmatched };
}

async function fetchRedemptions(): Promise<Redemption[]> {
  const coupons = await fetchAllPages<CouponView>((page) =>
    couponRepo.listCoupons({ page, size: PAGE_SIZE }),
  );
  const used = coupons.filter((coupon) => (coupon.totalRedemptions ?? 1) > 0);
  const lists = await Promise.all(
    used.map(async (coupon) => {
      const items = await fetchAllPages<CouponRedemptionView>((page) =>
        couponRepo.listRedemptions(coupon.id, { page, size: PAGE_SIZE }),
      );
      return items.map((item) => ({ ...item, code: coupon.code }));
    }),
  );
  return lists
    .flat()
    .filter((item) => !RELEASED_REDEMPTION_STATUSES.includes((item.status ?? '').toUpperCase()));
}

export async function loadRevenueTransactions(): Promise<RevenueTransactionsData> {
  const [bookingsResult, redemptionsResult] = await Promise.allSettled([
    fetchAllPages<AdminBooking>((page) =>
      adminRepo.getBookings({ page, size: PAGE_SIZE, sortBy: 'createdAt', direction: 'DESC' }),
    ),
    fetchRedemptions(),
  ]);
  if (bookingsResult.status === 'rejected') throw bookingsResult.reason;

  const bookings = bookingsResult.value.filter(
    (booking) =>
      !booking.serviceIsFreeSnapshot && MONEY_MOVED_STATUSES.includes(booking.paymentStatus),
  );
  const redemptions = redemptionsResult.status === 'fulfilled' ? redemptionsResult.value : [];
  const { couponByBooking, unmatched } = matchCouponsToBookings(bookings, redemptions);

  return {
    transactions: bookings.map((booking) => {
      const listPrice = getListPrice(booking);
      const coupon = couponByBooking.get(booking.bookingId) ?? null;
      return {
        booking,
        listPrice,
        coupon,
        amountPaid: Math.max(0, listPrice - (coupon?.discount ?? 0)),
      };
    }),
    unmatchedRedemptions: unmatched,
    couponsLoaded: redemptionsResult.status === 'fulfilled',
  };
}
