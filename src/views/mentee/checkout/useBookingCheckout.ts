/**
 * @file useBookingCheckout.ts
 * @description State for the booking checkout confirmation: booking, preview, coupon, pay flow.
 * Amounts always come from the latest successful previewCheckout response.
 */

'use client';

import { formatScoin, mapCouponError } from '@/lib/coupon';
import { ApiClientError } from '@/models/apiClient';
import type { MentorBookingResponse, PaymentCheckoutResponse } from '@/models/auth';
import type { CheckoutPreviewResponse, UserCouponView } from '@/models/coupon';
import { bookingRepo, newIdempotencyKey } from '@/repositories/bookingRepo';
import { couponRepo } from '@/repositories/couponRepo';
import { getUserFriendlyErrorMessage, showSuccess } from '@/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isCouponRejection, isNetworkError } from './checkout.helpers';

type LoadState = 'loading' | 'ready' | 'error' | 'not-found';
type PayState = 'idle' | 'pending' | 'redirecting';

export const COUPON_CARD_ID = 'checkout-coupon';

export function useBookingCheckout(locale: string, bookingId: string) {
  const router = useRouter();
  const bookingsHref = `/${locale}/my-bookings`;

  const [booking, setBooking] = useState<MentorBookingResponse>();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  const [preview, setPreview] = useState<CheckoutPreviewResponse>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string>();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string>();
  const [suggestions, setSuggestions] = useState<UserCouponView[] | null>(null);

  const [consent, setConsent] = useState(false);
  const [payState, setPayState] = useState<PayState>('idle');
  const [payError, setPayError] = useState<{ message: string; retryable: boolean }>();
  /** Live-region text for screen readers (coupon applied / errors). */
  const [announcement, setAnnouncement] = useState('');
  const payingRef = useRef(false);
  /** Guards against an older preview response overwriting a newer one. */
  const previewSeq = useRef(0);

  const runPreview = useCallback(
    async (code: string | null) => {
      const seq = ++previewSeq.current;
      setPreviewLoading(true);
      try {
        const result = await bookingRepo.previewCheckout(bookingId, code);
        if (seq === previewSeq.current) {
          setPreview(result);
          setPreviewError(undefined);
        }
        return result;
      } finally {
        if (seq === previewSeq.current) setPreviewLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    bookingRepo
      .detail(bookingId)
      .then(async (detail) => {
        if (cancelled) return;
        setBooking(detail);
        setLoadState('ready');
        if (!detail.canPay) return;
        try {
          await runPreview(null);
        } catch (reason) {
          if (!cancelled) {
            setPreviewError(
              getUserFriendlyErrorMessage(reason, 'Chưa tính được số tiền. Thử tải lại trang.'),
            );
          }
        }
        // GET /api/me/coupons is account-wide (no bookingId filter): checkout-preview still decides
        // whether a code really applies to this booking.
        couponRepo
          .getMyCoupons()
          .then((list) => {
            if (cancelled) return;
            const visible = Array.isArray(list)
              ? list
                  .filter((coupon) => coupon.remainingQuota == null || coupon.remainingQuota > 0)
                  .sort((a, b) => Number(b.isUsable) - Number(a.isUsable))
              : [];
            setSuggestions(visible.length ? visible : null);
          })
          .catch(() => {
            // Suggestions are optional; manual entry still works.
          });
      })
      .catch((reason) => {
        if (cancelled) return;
        if (reason instanceof ApiClientError && (reason.status === 404 || reason.status === 403)) {
          setLoadState('not-found');
          return;
        }
        setLoadError(getUserFriendlyErrorMessage(reason, 'Không tải được lịch hẹn.'));
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, reloadKey, runPreview]);

  const knownCoupon = useCallback(
    (code: string) => suggestions?.find((item) => item.code.toUpperCase() === code) ?? null,
    [suggestions],
  );

  const applyCoupon = async (raw: string = couponInput) => {
    const code = raw.trim().toUpperCase();
    if (!code || previewLoading) return;
    setCouponInput(code);
    setCouponError(undefined);
    try {
      const result = await runPreview(code);
      if ((result.couponDiscountScoin ?? 0) > 0) {
        setAppliedCode(code);
        setAnnouncement(
          `Đã áp dụng mã ${code}. Còn phải trả ${formatScoin(result.estimatedFinalPayableScoin)} S-coins.`,
        );
      } else {
        // Accepted by the API but gives no discount on this booking.
        setAppliedCode(null);
        const message = mapCouponError({ code: 'NOT_APPLICABLE' }, code);
        setCouponError(message);
        setAnnouncement(message);
      }
    } catch (reason) {
      const message = mapCouponError(reason, code, {
        minOrderValueScoin: knownCoupon(code)?.minOrderValueScoin,
      });
      setCouponError(message);
      setAnnouncement(message);
    }
  };

  const removeCoupon = async () => {
    if (previewLoading) return;
    const previous = appliedCode;
    setCouponError(undefined);
    try {
      const result = await runPreview(null);
      setAppliedCode(null);
      setAnnouncement(
        `Đã bỏ mã ${previous ?? ''}. Còn phải trả ${formatScoin(result.estimatedFinalPayableScoin)} S-coins.`,
      );
    } catch (reason) {
      setCouponError(getUserFriendlyErrorMessage(reason, 'Chưa bỏ được mã. Thử lại.'));
    }
  };

  const handleCheckoutResult = (result: PaymentCheckoutResponse) => {
    const status = String(result.status ?? '').toUpperCase();
    if (status === 'PAID') {
      showSuccess('Đã thanh toán. Buổi học đã được giữ chỗ.');
      router.push(bookingsHref);
      return;
    }
    if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED') {
      setPayError({
        message:
          result.userActionMessage?.trim() ||
          (status === 'EXPIRED' ? 'Phiên thanh toán đã hết hạn.' : 'Thanh toán chưa thành công.'),
        retryable: status === 'EXPIRED' || result.retryable !== false,
      });
      setPayState('idle');
      return;
    }
    // PENDING / AWAITING_PROVIDER_PAYMENT / PARTIALLY_COVERED_BY_CREDIT: go to PayOS.
    // The URL is temporary; it is never stored.
    if (result.checkoutUrl) {
      setPayState('redirecting');
      window.location.assign(result.checkoutUrl);
      return;
    }
    setPayError({
      message:
        result.userActionMessage?.trim() || 'Chưa mở được trang thanh toán. Bạn thử lại nhé.',
      retryable: true,
    });
    setPayState('idle');
  };

  const pay = async () => {
    if (!consent || payingRef.current || !preview) return;
    payingRef.current = true;
    setPayState('pending');
    setPayError(undefined);
    // One key per attempt; the single timeout retry below reuses it.
    const key = newIdempotencyKey();
    try {
      let result: PaymentCheckoutResponse;
      try {
        result = await bookingRepo.checkout(bookingId, appliedCode, key);
      } catch (reason) {
        if (!isNetworkError(reason)) throw reason;
        result = await bookingRepo.checkout(bookingId, appliedCode, key);
      }
      handleCheckoutResult(result);
    } catch (reason) {
      setPayState('idle');
      if (appliedCode && isCouponRejection(reason)) {
        const code = appliedCode;
        const message = mapCouponError(reason, code);
        setAppliedCode(null);
        setCouponInput(code);
        setCouponError(message);
        setAnnouncement(`${message} Số tiền đã được tính lại không có mã.`);
        void runPreview(null).catch(() => undefined);
        document
          .getElementById(COUPON_CARD_ID)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const message = getUserFriendlyErrorMessage(reason, 'Chưa tạo được phiên thanh toán.');
      setPayError({ message, retryable: true });
      setAnnouncement(message);
    } finally {
      payingRef.current = false;
    }
  };

  return {
    bookingsHref,
    booking,
    loadState,
    loadError,
    reload: () => setReloadKey((key) => key + 1),
    preview,
    previewLoading,
    previewError,
    retryPreview: () => {
      void runPreview(appliedCode).catch((reason) =>
        setPreviewError(getUserFriendlyErrorMessage(reason, 'Chưa tính được số tiền.')),
      );
    },
    couponInput,
    setCouponInput: (value: string) => {
      setCouponInput(value.toUpperCase().replace(/\s+/g, ''));
      if (couponError) setCouponError(undefined);
    },
    appliedCode,
    appliedCoupon: appliedCode ? knownCoupon(appliedCode) : null,
    couponError,
    suggestions,
    applyCoupon,
    removeCoupon,
    consent,
    setConsent,
    payState,
    payError,
    pay,
    announcement,
  };
}
