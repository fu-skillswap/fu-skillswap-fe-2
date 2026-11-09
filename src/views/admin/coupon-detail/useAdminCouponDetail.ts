/**
 * @file useAdminCouponDetail.ts
 * @description Loads a coupon, its redemption history and summary, and changes its status.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type {
  CouponRedemptionView,
  CouponView,
  KnownCouponStatus,
  PageResponse,
} from '@/models/coupon';
import { adminRepo } from '@/repositories/adminRepo';
import { couponRepo } from '@/repositories/couponRepo';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';
import { useCallback, useEffect, useState } from 'react';
import {
  REDEMPTION_PAGE_SIZE,
  REDEMPTION_SUMMARY_SIZE,
  isPaidRedemption,
} from './couponDetail.constants';

/** Mentor names are looked up one by one, so only for a short list. */
const MAX_MENTOR_NAME_LOOKUPS = 5;

const STATUS_TOAST: Record<KnownCouponStatus, (code: string) => string> = {
  ACTIVE: (code) => `Đã bật lại mã ${code}`,
  INACTIVE: (code) => `Đã tạm tắt mã ${code}`,
  SUSPENDED: (code) => `Đã đình chỉ mã ${code}`,
};

export function useAdminCouponDetail(couponId: string) {
  const [coupon, setCoupon] = useState<CouponView>();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'not-found'>(
    'loading',
  );
  const [loadError, setLoadError] = useState<string>();
  const [couponKey, setCouponKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [page, setPage] = useState(0);
  const [redemptions, setRedemptions] = useState<PageResponse<CouponRedemptionView>>();
  const [redemptionsLoading, setRedemptionsLoading] = useState(true);
  const [redemptionsError, setRedemptionsError] = useState<string>();
  const [redemptionsKey, setRedemptionsKey] = useState(0);

  /** Sum of discountScoin over paid redemptions; undefined while unknown. */
  const [paidDiscountTotal, setPaidDiscountTotal] = useState<number | null>();
  const [paidCount, setPaidCount] = useState<number>();
  const [mentorNames, setMentorNames] = useState<string[]>();

  const [statusPending, setStatusPending] = useState<KnownCouponStatus>();

  useEffect(() => {
    let cancelled = false;
    couponRepo
      .getCoupon(couponId)
      .then((result) => {
        if (cancelled) return;
        setCoupon(result);
        setNow(Date.now());
        setLoadState('ready');
      })
      .catch((reason) => {
        if (cancelled) return;
        if (reason instanceof ApiClientError && reason.status === 404) {
          setLoadState('not-found');
          return;
        }
        setLoadError(getUserFriendlyErrorMessage(reason, 'Không tải được mã giảm giá.'));
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [couponId, couponKey]);

  useEffect(() => {
    let cancelled = false;
    setRedemptionsLoading(true);
    setRedemptionsError(undefined);
    couponRepo
      .listRedemptions(couponId, {
        page,
        size: REDEMPTION_PAGE_SIZE,
        sortBy: 'createdAt',
        direction: 'DESC',
      })
      .then((result) => {
        if (!cancelled) setRedemptions(result);
      })
      .catch((reason) => {
        if (!cancelled) {
          setRedemptionsError(getUserFriendlyErrorMessage(reason, 'Không tải được lịch sử.'));
        }
      })
      .finally(() => {
        if (!cancelled) setRedemptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [couponId, page, redemptionsKey]);

  // TODO(api): total discounted S-coins field on CouponView. Until then it is summed from up to
  // REDEMPTION_SUMMARY_SIZE redemptions and left unknown (null) when there are more.
  useEffect(() => {
    let cancelled = false;
    couponRepo
      .listRedemptions(couponId, { page: 0, size: REDEMPTION_SUMMARY_SIZE })
      .then((result) => {
        if (cancelled) return;
        const paid = result.content.filter(isPaidRedemption);
        if (result.totalElements > result.content.length) {
          setPaidDiscountTotal(null);
          setPaidCount(undefined);
          return;
        }
        setPaidCount(paid.length);
        setPaidDiscountTotal(paid.reduce((sum, item) => sum + (item.discountScoin ?? 0), 0));
      })
      .catch(() => {
        if (!cancelled) setPaidDiscountTotal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [couponId, redemptionsKey]);

  const mentorIdsKey = coupon?.applicableMentorIds?.join(',') ?? '';
  useEffect(() => {
    const ids = mentorIdsKey ? mentorIdsKey.split(',') : [];
    if (!ids.length || ids.length > MAX_MENTOR_NAME_LOOKUPS) {
      setMentorNames(undefined);
      return;
    }
    let cancelled = false;
    void Promise.allSettled(ids.map((id) => adminRepo.getMentor(id))).then((results) => {
      if (cancelled) return;
      // Names only when every lookup worked; otherwise fall back to counts.
      const names = results.map((item) =>
        item.status === 'fulfilled' ? item.value.displayName : null,
      );
      setMentorNames(names.every(Boolean) ? (names as string[]) : undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [mentorIdsKey]);

  const changeStatus = useCallback(
    async (status: KnownCouponStatus) => {
      if (!coupon || statusPending) return false;
      setStatusPending(status);
      try {
        const updated = await couponRepo.changeCouponStatus(coupon.id, status);
        setCoupon(updated);
        setNow(Date.now());
        showSuccess(STATUS_TOAST[status](updated.code ?? coupon.code));
        // Refetch to pick up counters the status change may have touched.
        setCouponKey((key) => key + 1);
        setRedemptionsKey((key) => key + 1);
        return true;
      } catch (reason) {
        showError(reason, { title: 'Không đổi được trạng thái mã' });
        return false;
      } finally {
        setStatusPending(undefined);
      }
    },
    [coupon, statusPending],
  );

  return {
    coupon,
    loadState,
    loadError,
    reload: () => {
      setLoadState('loading');
      setCouponKey((key) => key + 1);
    },
    now,
    page,
    setPage,
    redemptions,
    redemptionsLoading,
    redemptionsError,
    reloadRedemptions: () => setRedemptionsKey((key) => key + 1),
    paidDiscountTotal,
    paidCount,
    mentorNames,
    statusPending,
    changeStatus,
  };
}
