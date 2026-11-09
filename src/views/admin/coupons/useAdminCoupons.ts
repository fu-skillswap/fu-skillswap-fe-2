/**
 * @file useAdminCoupons.ts
 * @description State for the admin coupon list: URL-synced filters/page, list + summary loading.
 */

'use client';

import type { CouponDiscountType, CouponStatus, CouponView, PageResponse } from '@/models/coupon';
import { adminRepo } from '@/repositories/adminRepo';
import { couponRepo } from '@/repositories/couponRepo';
import { deriveCouponState, isNearlyExhausted } from '@/lib/coupon';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  COUPON_PAGE_SIZE,
  COUPON_SUMMARY_SIZE,
  DISCOUNT_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  parseOption,
} from './adminCoupons.constants';

type Filters = {
  keyword: string;
  status: '' | CouponStatus;
  discountType: '' | CouponDiscountType;
  /** Zero-based. */
  page: number;
};

export type CouponSummary = {
  running?: number;
  redemptions?: number;
  nearlyExhausted?: number;
  scheduled?: number;
  /** True when the stats computed on the client only cover part of the coupons. */
  partial: boolean;
};

function readFilters(searchParams: URLSearchParams): Filters {
  const page = Number.parseInt(searchParams.get('page') ?? '', 10);
  return {
    keyword: searchParams.get('q')?.trim() ?? '',
    status: parseOption(STATUS_FILTER_OPTIONS, searchParams.get('status')),
    discountType: parseOption(DISCOUNT_TYPE_FILTER_OPTIONS, searchParams.get('type')),
    // URL page is 1-based for humans.
    page: Number.isFinite(page) && page > 1 ? page - 1 : 0,
  };
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.keyword) params.set('q', filters.keyword);
  if (filters.status) params.set('status', filters.status);
  if (filters.discountType) params.set('type', filters.discountType);
  if (filters.page > 0) params.set('page', String(filters.page + 1));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useAdminCoupons() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(filters.keyword);
  const [data, setData] = useState<PageResponse<CouponView>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [summary, setSummary] = useState<CouponSummary>({ partial: false });
  const [now, setNow] = useState(() => Date.now());
  const [reloadKey, setReloadKey] = useState(0);

  // The URL is the source of truth for filters and page (shareable, back button works).
  const updateFilters = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, page: 0, ...patch };
      router.replace(`${pathname}${buildQuery(next)}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  // Keep the input in sync when the URL changes from outside (back button, "Xóa bộ lọc").
  useEffect(() => {
    setSearchInput((current) => (current.trim() === filters.keyword ? current : filters.keyword));
  }, [filters.keyword]);

  useEffect(() => {
    const keyword = searchInput.trim();
    if (keyword === filters.keyword) return;
    const timeout = window.setTimeout(() => updateFilters({ keyword }), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput, filters.keyword, updateFilters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    couponRepo
      .listCoupons({
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
        discountType: filters.discountType || undefined,
        page: filters.page,
        size: COUPON_PAGE_SIZE,
        // Newest first, so new coupons show on page 1.
        sortBy: 'createdAt',
        direction: 'DESC',
      })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setNow(Date.now());
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(getUserFriendlyErrorMessage(reason, 'Không tải được danh sách mã giảm giá.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.keyword, filters.status, filters.discountType, filters.page, reloadKey]);

  // Stat cards are independent of the table filters.
  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      adminRepo.getOverview(),
      // Sorted so the "100 mã mới nhất" note on the stat cards is accurate.
      couponRepo.listCoupons({
        page: 0,
        size: COUPON_SUMMARY_SIZE,
        sortBy: 'createdAt',
        direction: 'DESC',
      }),
    ]).then(([overviewResult, listResult]) => {
      if (cancelled) return;
      const campaigns =
        overviewResult.status === 'fulfilled' ? overviewResult.value?.campaigns : undefined;
      const list = listResult.status === 'fulfilled' ? listResult.value : undefined;
      const current = Date.now();
      const coupons = list?.content ?? [];
      const states = coupons.map((coupon) => deriveCouponState(coupon, current));
      // TODO(api): coupon summary endpoint (nearly-exhausted + scheduled counts). Until then these
      // are computed from the first COUPON_SUMMARY_SIZE coupons, which is exact only when the
      // whole list fits in one page (`partial` flags the other case in the UI).
      const computed = list
        ? {
            running: states.filter((state) => state === 'running').length,
            redemptions: coupons.reduce((sum, coupon) => sum + (coupon.totalRedemptions ?? 0), 0),
            nearlyExhausted: coupons.filter(
              (coupon, index) => states[index] === 'running' && isNearlyExhausted(coupon),
            ).length,
            scheduled: states.filter((state) => state === 'scheduled').length,
          }
        : undefined;
      setSummary({
        running: campaigns?.activeCouponCount ?? computed?.running,
        redemptions: campaigns?.totalCouponRedemptions ?? computed?.redemptions,
        nearlyExhausted: computed?.nearlyExhausted,
        scheduled: computed?.scheduled,
        partial: Boolean(list && list.totalPages > 1),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const clearFilters = () => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  };

  const coupons = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const isFiltered = Boolean(filters.keyword || filters.status || filters.discountType);
  const rangeStart = coupons.length ? filters.page * COUPON_PAGE_SIZE + 1 : 0;
  const rangeEnd = filters.page * COUPON_PAGE_SIZE + coupons.length;

  return {
    filters,
    searchInput,
    setSearchInput,
    setStatus: (status: Filters['status']) => updateFilters({ status }),
    setDiscountType: (discountType: Filters['discountType']) => updateFilters({ discountType }),
    setPage: (page: number) => updateFilters({ ...filters, page }),
    clearFilters,
    reload: () => setReloadKey((key) => key + 1),
    coupons,
    totalElements,
    totalPages: data?.totalPages ?? 0,
    rangeStart,
    rangeEnd,
    loading,
    error,
    isFiltered,
    summary,
    now,
  };
}
