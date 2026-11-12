/**
 * @file CouponPromoStrip.tsx
 * @description Gradient strip above the mentor's service cards announcing SkillSwap-funded coupons.
 * Renders nothing when there are no running/scheduled offers.
 */

'use client';

import { offerBadge } from '@/lib/coupon';
import type { MentorCouponOffer } from '@/models/coupon';
import type { CouponDrawerTab } from './CouponOffersDrawer';
import styles from './couponOffers.module.css';

export const COUPON_STRIP_ACTION_ID = 'mentor-coupon-strip-action';

export function CouponPromoStrip({
  offers,
  bestOffer,
  onOpen,
}: {
  /** Visible (non-ended) offers. */
  offers: MentorCouponOffer[];
  /** Offer whose badge is shown on the mini ticket. */
  bestOffer: MentorCouponOffer | null;
  /** `tab` picks the drawer tab: "Ưu đãi" or "Cơ chế hoạt động". */
  onOpen: (trigger: HTMLElement, tab: CouponDrawerTab) => void;
}) {
  if (!offers.length) return null;
  const newCount = offers.filter((offer) => offer.isNew).length;
  const badge = offerBadge(bestOffer ?? offers[0]);

  return (
    <div className={styles.strip}>
      <div className={styles.stack} aria-hidden="true">
        <span className={styles.stackBack} />
        <span className={styles.stackFront}>{badge}</span>
      </div>
      <div className={styles.stripText}>
        <p className={styles.stripTitle}>
          <span>SkillSwap tài trợ {offers.length} mã giảm giá cho dịch vụ của bạn</span>
          {newCount > 0 && <span className={styles.newPill}>{newCount} mã mới</span>}
        </p>
        <p className={styles.stripSub}>
          Áp mã để mentee đặt lịch rẻ hơn. Bạn vẫn nhận đủ giá dịch vụ.
        </p>
      </div>
      <div className={styles.stripActions}>
        <button
          type="button"
          className={styles.stripLink}
          aria-haspopup="dialog"
          onClick={(event) => onOpen(event.currentTarget, 'how')}
        >
          Cơ chế hoạt động
        </button>
        <button
          id={COUPON_STRIP_ACTION_ID}
          type="button"
          className={styles.stripAction}
          aria-haspopup="dialog"
          onClick={(event) => onOpen(event.currentTarget, 'offers')}
        >
          Xem ưu đãi
        </button>
      </div>
    </div>
  );
}
