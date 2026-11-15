/**
 * @file useAdminCouponForm.ts
 * @description State and submit logic for the admin coupon create/edit screen.
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import type { CouponView } from '@/models/coupon';
import { adminRepo } from '@/repositories/adminRepo';
import { couponRepo } from '@/repositories/couponRepo';
import {
  confirmAction,
  getUserFriendlyErrorMessage,
  showSuccess,
  showWarning,
} from '@/utils/toast';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FIELD_ORDER,
  couponToForm,
  emptyCouponForm,
  fieldId,
  formSnapshot,
  formToCommand,
  isMentorOptInSupported,
  validateCouponForm,
  type CouponFormErrors,
  type CouponFormField,
  type CouponFormValues,
  type CouponTarget,
} from './couponForm';

export type CouponFormMode = 'create' | 'edit';

const DUPLICATE_CODE_MESSAGE = 'Mã này đã tồn tại. Chọn mã khác.';

/** Backend field names → form fields, for server-side validation errors. */
const API_FIELD_MAP: Record<string, CouponFormField> = {
  code: 'code',
  title: 'title',
  description: 'description',
  discountValue: 'discountValue',
  maxDiscountScoin: 'maxDiscountScoin',
  minOrderValueScoin: 'minOrderValueScoin',
  startAt: 'startAt',
  endAt: 'endAt',
  quotaTotal: 'quotaTotal',
  quotaPerUser: 'quotaPerUser',
  applicableMentorIds: 'targets',
  applicableServiceIds: 'targets',
};

// TODO(api): replace with the BE duplicate-code error code once documented.
function isDuplicateCodeError(error: ApiClientError) {
  const code = error.code.toUpperCase();
  return (
    error.status === 409 ||
    (code.includes('COUPON') && (code.includes('DUPLICATE') || code.includes('EXIST')))
  );
}

export function useAdminCouponForm(mode: CouponFormMode, couponId?: string) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const couponsRoot = `/${locale}/admin/coupons`;

  const [values, setValues] = useState<CouponFormValues>(() => emptyCouponForm());
  const [initialSnapshot, setInitialSnapshot] = useState(() => formSnapshot(values));
  const [errors, setErrors] = useState<CouponFormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [coupon, setCoupon] = useState<CouponView>();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'not-found'>(
    mode === 'edit' ? 'loading' : 'ready',
  );
  const [loadError, setLoadError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const [activateNow, setActivateNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  /** Set right before navigating away after a save, so the unsaved-changes guard stays quiet. */
  const leavingRef = useRef(false);

  useEffect(() => {
    if (mode !== 'edit' || !couponId) return;
    let cancelled = false;
    setLoadState('loading');
    couponRepo
      .getCoupon(couponId)
      .then((result) => {
        if (cancelled) return;
        const next = couponToForm(result);
        setCoupon(result);
        setValues(next);
        setInitialSnapshot(formSnapshot(next));
        setLoadState('ready');
        // Replace short ids with mentor names; failures keep the short id.
        const mentorIds = result.applicableMentorIds ?? [];
        void Promise.allSettled(mentorIds.map((id) => adminRepo.getMentor(id))).then((results) => {
          if (cancelled) return;
          const names = new Map<string, string>();
          results.forEach((item, index) => {
            if (item.status === 'fulfilled' && item.value.displayName) {
              names.set(mentorIds[index], item.value.displayName);
            }
          });
          setValues((current) => ({
            ...current,
            targets: current.targets.map((target) =>
              target.kind === 'mentor' && names.has(target.id)
                ? { ...target, label: names.get(target.id)! }
                : target,
            ),
          }));
        });
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
  }, [mode, couponId, reloadKey]);

  const isDirty = useMemo(
    () => loadState === 'ready' && formSnapshot(values) !== initialSnapshot,
    [values, initialSnapshot, loadState],
  );

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const mentorOptInSupported = isMentorOptInSupported(mode, coupon);

  const setField = useCallback(
    <K extends keyof CouponFormValues>(field: K, value: CouponFormValues[K]) => {
      setValues((current) => ({ ...current, [field]: value }));
      // Clear the field's error as soon as it is edited; it is re-checked on submit.
      const errorKey = (field === 'scope' ? 'targets' : field) as CouponFormField;
      setErrors((current) => (current[errorKey] ? { ...current, [errorKey]: undefined } : current));
    },
    [],
  );

  const addTarget = useCallback((target: CouponTarget) => {
    setValues((current) =>
      current.targets.some((item) => item.kind === target.kind && item.id === target.id)
        ? current
        : { ...current, targets: [...current.targets, target] },
    );
    setErrors((current) => ({ ...current, targets: undefined }));
  }, []);

  const removeTarget = useCallback((target: CouponTarget) => {
    setValues((current) => ({
      ...current,
      targets: current.targets.filter(
        (item) => !(item.kind === target.kind && item.id === target.id),
      ),
    }));
  }, []);

  const focusFirstError = (nextErrors: CouponFormErrors) => {
    const first = FIELD_ORDER.find((field) => nextErrors[field]);
    if (!first) return;
    // Wait for the error text to render so screen readers announce it after focus moves.
    window.requestAnimationFrame(() => {
      const element = document.getElementById(fieldId(first));
      element?.focus();
      element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const goTo = (href: string) => {
    leavingRef.current = true;
    router.push(href);
  };

  const submit = async () => {
    if (submittingRef.current) return;
    setFormError(undefined);
    const nextErrors = validateCouponForm(values, { mode });
    setErrors(nextErrors);
    if (FIELD_ORDER.some((field) => nextErrors[field])) {
      focusFirstError(nextErrors);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    const command = formToCommand(values, { mentorOptInSupported });
    try {
      if (mode === 'create') {
        const created = await couponRepo.createCoupon(command);
        const wanted = activateNow ? 'ACTIVE' : 'INACTIVE';
        if (created.status !== wanted) {
          try {
            await couponRepo.changeCouponStatus(created.id, wanted);
          } catch {
            showWarning({
              title: `Đã tạo mã ${created.code}`,
              description: activateNow
                ? 'Chưa bật được mã. Bật lại ở trang chi tiết.'
                : 'Chưa tắt được mã. Tắt lại ở trang chi tiết.',
            });
            goTo(`${couponsRoot}/${created.id}`);
            return;
          }
        }
        showSuccess(`Đã tạo mã ${created.code}`);
        goTo(`${couponsRoot}/${created.id}`);
      } else if (couponId) {
        const updated = await couponRepo.updateCoupon(couponId, command);
        showSuccess(`Đã lưu mã ${updated.code ?? command.code}`);
        goTo(`${couponsRoot}/${couponId}`);
      }
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (isDuplicateCodeError(reason)) {
          const next = { code: DUPLICATE_CODE_MESSAGE };
          setErrors(next);
          focusFirstError(next);
          return;
        }
        const fieldErrors: CouponFormErrors = {};
        reason.data?.forEach((item) => {
          const field = item.field ? API_FIELD_MAP[item.field] : undefined;
          if (field && !fieldErrors[field]) fieldErrors[field] = item.message;
        });
        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
          focusFirstError(fieldErrors);
          return;
        }
      }
      setFormError(
        getUserFriendlyErrorMessage(
          reason,
          mode === 'create' ? 'Không tạo được mã giảm giá.' : 'Không lưu được thay đổi.',
        ),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (isDirty) {
      const confirmed = await confirmAction({
        title: 'Bỏ các thay đổi chưa lưu?',
        message: 'Các thông tin bạn vừa nhập sẽ không được lưu.',
        confirmText: 'Bỏ thay đổi',
        cancelText: 'Tiếp tục sửa',
        variant: 'warning',
      });
      if (!confirmed) return;
    }
    leavingRef.current = true;
    if (window.history.length > 1) router.back();
    else router.push(mode === 'edit' && couponId ? `${couponsRoot}/${couponId}` : couponsRoot);
  };

  return {
    couponsRoot,
    values,
    errors,
    formError,
    coupon,
    loadState,
    loadError,
    reload: () => setReloadKey((key) => key + 1),
    activateNow,
    setActivateNow,
    submitting,
    isDirty,
    /** Edit mode: a coupon that has been redeemed keeps its code. */
    codeLocked: mode === 'edit' && (coupon?.totalRedemptions ?? 0) > 0,
    /** Offer the "Để mentor tự chọn dịch vụ áp mã" scope (TODO(api): mentorOptIn field). */
    mentorOptInSupported,
    setField,
    addTarget,
    removeTarget,
    submit,
    cancel,
  };
}
