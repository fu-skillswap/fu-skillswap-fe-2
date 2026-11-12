/**
 * @file ServiceCouponRow.tsx
 * @description Bottom row of a paid mentor service card: the applied SkillSwap coupon, or an
 * "Áp mã giảm giá" button. Nothing for free services.
 */

'use client';

import { formatScoin, menteePriceAfter, menteePriceOf, offerBadge } from '@/lib/coupon';
import type { MentorServiceManagementResponse } from '@/models/auth';
import type { MentorCouponOffer } from '@/models/coupon';
import { Ticket } from 'lucide-react';
import styles from './couponOffers.module.css';

export function ServiceCouponRow({
  service,
  appliedOffer,
  onOpen,
}: {
  service: MentorServiceManagementResponse;
  appliedOffer: MentorCouponOffer | null;
  onOpen: (trigger: HTMLElement, serviceId: string) => void;
}) {
  if (service.isFree || !((service.publicPriceScoin ?? 0) > 0)) return null;

  if (!appliedOffer) {
    return (
      <div className={styles.cardRow}>
        <button
          type="button"
          className={styles.applyRowButton}
          aria-haspopup="dialog"
          aria-label={`Áp mã giảm giá cho ${service.title}`}
          onClick={(event) => onOpen(event.currentTarget, service.serviceId)}
        >
          <Ticket className="h-4 w-4" aria-hidden="true" />
          Áp mã giảm giá
        </button>
      </div>
    );
  }

  const before = menteePriceOf(service);
  const after = menteePriceAfter(appliedOffer, before);
  return (
    <div className={`${styles.cardRow} ${styles.appliedRow}`}>
      <span className={styles.appliedBadge}>{offerBadge(appliedOffer)}</span>
      <span className={styles.appliedText}>
        <strong>{appliedOffer.code}</strong> · mentee trả <strong>{formatScoin(after)}</strong>{' '}
        <s className={styles.strike}>{formatScoin(before)}</s>
      </span>
      <button
        type="button"
        className={styles.textButton}
        aria-haspopup="dialog"
        aria-label={`Đổi mã giảm giá của ${service.title}`}
        onClick={(event) => onOpen(event.currentTarget, service.serviceId)}
      >
        Đổi
      </button>
    </div>
  );
}
