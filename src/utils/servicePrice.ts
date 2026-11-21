/**
 * @file servicePrice.ts
 * @description Reads the optional coupon pricing fields on service/slot objects into one display
 * shape. Pure (no React, no network) so it can be unit tested and used from Server Components.
 * The backend is the source of truth: the discounted price is only derived here when the API
 * omits `discountedPriceScoin`.
 */

import type { ServiceCouponPricingFields } from '@/models/auth';

export interface ServicePriceInput extends ServiceCouponPricingFields {
  priceScoin?: number | null;
}

export interface ServicePriceDisplay {
  /** Price before the coupon. */
  original: number;
  /** Price the mentee pays (after the coupon when there is one). */
  final: number;
  hasDiscount: boolean;
  /** Coupon discount in S-coins; 0 when there is no discount. */
  discount: number;
  code?: string;
  title?: string;
  /** Remaining coupon uses; null means unlimited or unknown. */
  remainingQuota?: number | null;
  isFree: boolean;
}

const toAmount = (value: number | null | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export function getServicePriceDisplay(input: ServicePriceInput): ServicePriceDisplay {
  const couponDiscount = toAmount(input.couponDiscountScoin) ?? 0;
  const hasDiscount = input.hasCouponDiscount === true && couponDiscount > 0;
  const original = toAmount(input.originalPriceScoin) ?? toAmount(input.priceScoin) ?? 0;

  if (!hasDiscount) {
    return { original, final: original, hasDiscount: false, discount: 0, isFree: original === 0 };
  }

  const final = toAmount(input.discountedPriceScoin) ?? Math.max(0, original - couponDiscount);
  const display: ServicePriceDisplay = {
    original,
    final,
    hasDiscount: true,
    discount: couponDiscount,
    isFree: final === 0,
  };
  if (input.couponCode) display.code = input.couponCode;
  if (input.couponTitle) display.title = input.couponTitle;
  if (input.couponRemainingQuota !== undefined) {
    display.remainingQuota = toAmount(input.couponRemainingQuota) ?? null;
  }
  return display;
}
