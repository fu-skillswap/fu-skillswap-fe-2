/**
 * @file CouponPromoStrip.tsx
 * @description Gradient strip above the mentor's service cards announcing the SkillSwap coupons
 * from GET /api/me/coupons. Renders nothing when there are none.
 */

'use client';

import { couponBadgeText } from '@/lib/coupon';
import type { UserCouponView } from '@/models/coupon';
import type { CouponDrawerTab } from './CouponOffersDrawer';
import styles from './couponOffers.module.css';

export const COUPON_STRIP_ACTION_ID = 'mentor-coupon-strip-action';

export function CouponPromoStrip({
  coupons,
  bestCoupon,
  onOpen,
}: {
  coupons: UserCouponView[];
  /** Coupon whose badge is shown on the mini ticket. */
  bestCoupon: UserCouponView | null;
  /** `tab` picks the drawer tab: "Ưu đãi" or "Cơ chế hoạt động". */
  onOpen: (trigger: HTMLElement, tab: CouponDrawerTab) => void;
}) {
  if (!coupons.length) return null;

  return (
    <div className={styles.strip}>
      <div className={styles.stack} aria-hidden="true">
        <span className={styles.stackBack} />
        <span className={styles.stackFront}>{couponBadgeText(bestCoupon ?? coupons[0])}</span>
      </div>
      <div className={styles.stripText}>
        <p className={styles.stripTitle}>
          SkillSwap tài trợ {coupons.length} mã giảm giá cho dịch vụ của bạn
        </p>
        <p className={styles.stripSub}>
          Mentee nhập mã khi thanh toán để đặt lịch rẻ hơn. Bạn vẫn nhận đủ giá dịch vụ.
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
