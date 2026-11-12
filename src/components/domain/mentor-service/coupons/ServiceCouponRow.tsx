/**
 * @file ServiceCouponRow.tsx
 * @description Bottom row of a paid mentor service card: the best coupon a mentee can use on it
 * (from GET /api/me/coupons) and what the mentee pays. Nothing when no coupon fits.
 */

'use client';

import {
  bestCouponFor,
  couponBadgeText,
  formatScoin,
  menteePriceAfter,
  menteePriceOf,
} from '@/lib/coupon';
import type { MentorServiceManagementResponse } from '@/models/auth';
import type { UserCouponView } from '@/models/coupon';
import styles from './couponOffers.module.css';

export function ServiceCouponRow({
  service,
  coupons,
  onOpen,
}: {
  service: MentorServiceManagementResponse;
  /** Coupons that fit this service. */
  coupons: UserCouponView[];
  onOpen: (trigger: HTMLElement) => void;
}) {
  const before = menteePriceOf(service);
  const best = bestCouponFor(coupons, before);
  if (!best || !(before > 0)) return null;
  const after = menteePriceAfter(best, before);
  const more = coupons.length - 1;

  return (
    <div className={`${styles.cardRow} ${styles.appliedRow}`}>
      <span className={styles.appliedBadge}>{couponBadgeText(best)}</span>
      <span className={styles.appliedText}>
        <strong>{best.code}</strong> · mentee trả <strong>{formatScoin(after)}</strong>{' '}
        <s className={styles.strike}>{formatScoin(before)}</s>
        {more > 0 && <> · +{more} mã</>}
      </span>
      <button
        type="button"
        className={styles.textButton}
        aria-haspopup="dialog"
        aria-label={`Xem mã giảm giá của ${service.title}`}
        onClick={(event) => onOpen(event.currentTarget)}
      >
        Xem
      </button>
    </div>
  );
}
