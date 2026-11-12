/**
 * @file coupon.ts
 * @description Pure coupon helpers (formatting, state derivation, error mapping). No React, no
 * network — safe to unit test and to use from both Server and Client Components.
 */

import type { MentorServiceManagementResponse } from '@/models/auth';
import type { CouponView, UserCouponView } from '@/models/coupon';

const scoinFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** vi-VN grouping: 16500 → "16.500". Non-finite input renders as "0". */
export function formatScoin(value: number | null | undefined): string {
  return scoinFormatter.format(Number.isFinite(value) ? (value as number) : 0);
}

/** True for percentage coupons: `PERCENTAGE` (admin endpoints) or `PERCENT` (/api/me/coupons). */
export function isPercentDiscount(discountType: string | null | undefined): boolean {
  return discountType === 'PERCENTAGE' || discountType === 'PERCENT';
}

/** True for fixed-amount coupons: `FIXED_SCOIN` (admin endpoints) or `FIXED` (/api/me/coupons). */
export function isFixedDiscount(discountType: string | null | undefined): boolean {
  return discountType === 'FIXED_SCOIN' || discountType === 'FIXED';
}

type DiscountFields = Pick<
  CouponView,
  'discountType' | 'discountValue' | 'maxDiscountScoin' | 'minOrderValueScoin'
>;

/**
 * "Giảm 20%, tối đa 3.000 S-coins" | "Giảm 2.000 S-coins" (+ ", đơn từ 10.000").
 * Unknown discount types fall back to the raw type and value.
 */
export function describeDiscount(coupon: DiscountFields): string {
  let text: string;
  if (isPercentDiscount(coupon.discountType)) {
    text = `Giảm ${coupon.discountValue}%`;
    if (coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0) {
      text += `, tối đa ${formatScoin(coupon.maxDiscountScoin)} S-coins`;
    }
  } else if (isFixedDiscount(coupon.discountType)) {
    text = `Giảm ${formatScoin(coupon.discountValue)} S-coins`;
  } else {
    text = `Giảm ${formatScoin(coupon.discountValue)} (${coupon.discountType || 'không rõ'})`;
  }
  if (coupon.minOrderValueScoin != null && coupon.minOrderValueScoin > 0) {
    text += `, đơn từ ${formatScoin(coupon.minOrderValueScoin)}`;
  }
  return text;
}

/** "-20%" | "-2.000". Unknown types show the plain value. */
export function couponBadgeText(coupon: Pick<CouponView, 'discountType' | 'discountValue'>) {
  if (isPercentDiscount(coupon.discountType)) return `-${coupon.discountValue}%`;
  return `-${formatScoin(coupon.discountValue)}`;
}

export type CouponState =
  'running' | 'scheduled' | 'expired' | 'exhausted' | 'inactive' | 'suspended';

type StateFields = Pick<
  CouponView,
  'status' | 'startAt' | 'endAt' | 'quotaTotal' | 'totalRedemptions'
>;

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Display state, in priority order: suspended → inactive → scheduled → expired → exhausted →
 * running. An unknown `status` is treated like ACTIVE so dates/quota still decide the state.
 */
export function deriveCouponState(
  coupon: StateFields,
  now: Date | number = Date.now(),
): CouponState {
  const nowTime = typeof now === 'number' ? now : now.getTime();
  if (coupon.status === 'SUSPENDED') return 'suspended';
  if (coupon.status === 'INACTIVE') return 'inactive';

  const start = toTime(coupon.startAt);
  const end = toTime(coupon.endAt);
  if (start !== null && nowTime < start) return 'scheduled';
  if (end !== null && nowTime > end) return 'expired';
  if (coupon.quotaTotal != null && coupon.totalRedemptions >= coupon.quotaTotal) {
    return 'exhausted';
  }
  return 'running';
}

export interface CouponStateTone {
  /** CSS values, token first with the spec hex as fallback. */
  background: string;
  color: string;
  border: string;
}

export interface CouponStateUi {
  label: string;
  tone: CouponStateTone;
}

const NEUTRAL_TONE: CouponStateTone = {
  background: 'var(--border-light, #f1f5f9)',
  color: 'var(--text-secondary, #475569)',
  border: '1px solid transparent',
};

export const COUPON_STATE_UI: Record<CouponState, CouponStateUi> = {
  running: {
    label: 'Đang chạy',
    tone: {
      background: 'var(--success-soft, #ecfdf5)',
      color: '#047857',
      border: '1px solid transparent',
    },
  },
  scheduled: {
    label: 'Sắp diễn ra',
    tone: {
      background: 'var(--primary-light, #eff6ff)',
      color: 'var(--site-blue-hover, #1d4ed8)',
      border: '1px solid transparent',
    },
  },
  expired: { label: 'Hết hạn', tone: NEUTRAL_TONE },
  exhausted: { label: 'Hết lượt', tone: NEUTRAL_TONE },
  inactive: {
    label: 'Tạm tắt',
    tone: {
      background: 'var(--surface, #ffffff)',
      color: 'var(--text-secondary, #475569)',
      border: '1px solid var(--border-strong, #cbd5e1)',
    },
  },
  suspended: {
    label: 'Đình chỉ',
    tone: {
      background: 'var(--danger-soft, #fef2f2)',
      color: '#b91c1c',
      border: '1px solid transparent',
    },
  },
};

/** UI for any state string; unknown values render the raw value with the neutral tone. */
export function getCouponStateUi(state: string): CouponStateUi {
  return (
    (COUPON_STATE_UI as Record<string, CouponStateUi | undefined>)[state] ?? {
      label: state || 'Không rõ',
      tone: NEUTRAL_TONE,
    }
  );
}

/** 0–100 share of the total quota already used; null when the quota is unlimited. */
export function usagePercent(
  coupon: Pick<CouponView, 'quotaTotal' | 'totalRedemptions'>,
): number | null {
  if (coupon.quotaTotal == null) return null;
  if (coupon.quotaTotal <= 0) return 100;
  return Math.min(100, Math.max(0, (coupon.totalRedemptions / coupon.quotaTotal) * 100));
}

export function isNearlyExhausted(coupon: Pick<CouponView, 'quotaTotal' | 'totalRedemptions'>) {
  const percent = usagePercent(coupon);
  return percent !== null && percent >= 80;
}

interface CouponErrorLike {
  status?: number;
  code?: string;
  message?: string;
}

function asErrorLike(error: unknown): CouponErrorLike {
  if (!error || typeof error !== 'object') return {};
  const { status, code, message } = error as Record<string, unknown>;
  return {
    status: typeof status === 'number' ? status : undefined,
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
  };
}

/**
 * Vietnamese message for a failed coupon preview/checkout. Accepts an `ApiClientError` or any
 * `{ status, code, message }` object.
 * TODO(api): replace heuristics with BE error codes.
 */
export function mapCouponError(
  error: unknown,
  couponCode: string,
  options: { minOrderValueScoin?: number | null } = {},
): string {
  const { status, code = '', message } = asErrorLike(error);
  const upper = code.toUpperCase();
  const label = couponCode.trim().toUpperCase();

  if (upper.includes('EXPIRED')) return `Mã ${label} đã hết hạn.`;
  if (upper.includes('NOT_STARTED')) return `Mã ${label} chưa đến ngày dùng.`;
  if (upper.includes('QUOTA')) return `Mã ${label} đã hết lượt dùng.`;
  if (upper.includes('MIN_ORDER')) {
    return options.minOrderValueScoin != null
      ? `Đơn chưa đạt tối thiểu ${formatScoin(options.minOrderValueScoin)} S-coins để dùng mã ${label}.`
      : `Đơn chưa đạt giá trị tối thiểu để dùng mã ${label}.`;
  }
  if (upper.includes('NOT_APPLICABLE')) return `Mã ${label} không áp dụng cho dịch vụ này.`;
  if (upper.includes('NOT_FOUND') || status === 404) {
    return `Không tìm thấy mã ${label}. Kiểm tra lại chính tả.`;
  }
  return message?.trim() || 'Không áp dụng được mã này.';
}

/**
 * Discount a coupon gives on an order of `orderScoin` (the price the mentee pays, surcharge
 * included). 0 when the minimum order is not met or the value is not usable.
 * TODO(api): confirm rounding with BE (FE floors percentage discounts).
 */
export function computeCouponDiscount(
  coupon: Pick<
    CouponView,
    'discountType' | 'discountValue' | 'maxDiscountScoin' | 'minOrderValueScoin'
  >,
  orderScoin: number,
): number {
  if (!Number.isFinite(orderScoin) || orderScoin <= 0) return 0;
  if (!Number.isFinite(coupon.discountValue) || coupon.discountValue <= 0) return 0;
  if (coupon.minOrderValueScoin != null && orderScoin < coupon.minOrderValueScoin) return 0;
  let discount: number;
  if (isPercentDiscount(coupon.discountType)) {
    discount = Math.floor((orderScoin * Math.min(coupon.discountValue, 100)) / 100);
    if (coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0) {
      discount = Math.min(discount, coupon.maxDiscountScoin);
    }
  } else {
    discount = coupon.discountValue;
  }
  return Math.max(0, Math.min(discount, orderScoin));
}

/** Order price from which a percentage coupon hits its cap; null when there is no cap. */
export function capReachedAtScoin(
  coupon: Pick<CouponView, 'discountType' | 'discountValue' | 'maxDiscountScoin'>,
): number | null {
  if (!isPercentDiscount(coupon.discountType)) return null;
  if (!coupon.maxDiscountScoin || coupon.maxDiscountScoin <= 0 || coupon.discountValue <= 0) {
    return null;
  }
  return Math.ceil((coupon.maxDiscountScoin * 100) / Math.min(coupon.discountValue, 100));
}

/**
 * Mentee platform surcharge applied on top of the service price.
 * TODO: read PAYMENT_MENTEE_SURCHARGE_BPS from BE (no FE constant or config endpoint yet).
 */
export const MENTEE_SURCHARGE_RATE = 0.1;
/** Same surcharge in basis points (10% = 1000), for integer money maths. */
export const MENTEE_SURCHARGE_BPS = Math.round(MENTEE_SURCHARGE_RATE * 10_000);

/** Price the mentee sees for a service price (platform surcharge included). */
export function withMenteeSurcharge(priceScoin: number): number {
  return Math.round(priceScoin * (1 + MENTEE_SURCHARGE_RATE));
}

// --- Mentor coupon views (GET /api/me/coupons) ---

type CouponDiscount = Pick<UserCouponView, 'discountType' | 'discountValue' | 'maxDiscountScoin'>;
type ServicePricing = Pick<MentorServiceManagementResponse, 'isFree' | 'publicPriceScoin'>;

/** Price the mentee sees for a mentor service (surcharge included); 0 for free services. */
export function menteePriceOf(service: ServicePricing): number {
  if (service.isFree) return 0;
  return withMenteeSurcharge(service.publicPriceScoin ?? 0);
}

/**
 * What the mentee pays after the coupon. `menteePrice` is the price the mentee sees (platform
 * surcharge included). PERCENT: price − min(floor(price × v / 100), cap); FIXED: max(0, price − v).
 * Unknown discount types leave the price unchanged.
 */
export function menteePriceAfter(coupon: CouponDiscount, menteePrice: number): number {
  if (!Number.isFinite(menteePrice) || menteePrice <= 0) return 0;
  const value = Number.isFinite(coupon.discountValue) ? Math.max(0, coupon.discountValue) : 0;
  if (isPercentDiscount(coupon.discountType)) {
    const cap =
      coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0
        ? coupon.maxDiscountScoin
        : Infinity;
    const discount = Math.min(Math.floor((menteePrice * Math.min(value, 100)) / 100), cap);
    return Math.max(0, menteePrice - discount);
  }
  if (isFixedDiscount(coupon.discountType)) return Math.max(0, menteePrice - value);
  return menteePrice;
}

/** Second line of the ticket stub: "tối đa 3.000" | "không giới hạn" | "S-coins". */
export function couponCap(coupon: CouponDiscount): string {
  if (isPercentDiscount(coupon.discountType)) {
    return coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0
      ? `tối đa ${formatScoin(coupon.maxDiscountScoin)}`
      : 'không giới hạn';
  }
  return 'S-coins';
}

/** "20%, tối đa 3.000 S-coins" | "20%" | "2.000 S-coins". */
export function couponRule(coupon: CouponDiscount): string {
  if (isPercentDiscount(coupon.discountType)) {
    return coupon.maxDiscountScoin != null && coupon.maxDiscountScoin > 0
      ? `${coupon.discountValue}%, tối đa ${formatScoin(coupon.maxDiscountScoin)} S-coins`
      : `${coupon.discountValue}%`;
  }
  return `${formatScoin(coupon.discountValue)} S-coins`;
}

export interface CouponMoneyFlow {
  /** What the session costs the mentee before the coupon (service price + platform surcharge). */
  priceWithSurcharge: number;
  /** Part SkillSwap pays for the mentee. */
  discount: number;
  menteePays: number;
  /** Always the full service price: the coupon never reduces the mentor's share. */
  mentorGets: number;
  /** priceWithSurcharge − service price. */
  platformFee: number;
}

/**
 * Where the money of one coupon-discounted session goes. `surchargeBps` is the mentee platform
 * surcharge in basis points (1000 = 10%); a missing coupon means no discount.
 * Example: 16.500 S-coins, 10%, 20% capped at 3.000 → 18.150 / 3.000 / 15.150 / 16.500 / 1.650.
 */
export function couponMoneyFlow(
  servicePrice: number,
  surchargeBps: number,
  coupon: CouponDiscount | null,
): CouponMoneyFlow {
  const price = Number.isFinite(servicePrice) ? Math.max(0, Math.round(servicePrice)) : 0;
  const bps = Number.isFinite(surchargeBps) ? Math.max(0, surchargeBps) : 0;
  const priceWithSurcharge = Math.round((price * (10_000 + bps)) / 10_000);
  const menteePays = coupon ? menteePriceAfter(coupon, priceWithSurcharge) : priceWithSurcharge;
  return {
    priceWithSurcharge,
    discount: priceWithSurcharge - menteePays,
    menteePays,
    mentorGets: price,
    platformFee: priceWithSurcharge - price,
  };
}

type MatchFields = Pick<UserCouponView, 'remainingQuota' | 'minOrderValueScoin'> & {
  applicableServiceIds?: string[] | null;
};

/**
 * True when a mentee could use the coupon on this service: paid service, quota left, minimum met
 * on the mentee price, and — only when the API returns `applicableServiceIds` — the service listed.
 * `isUsable` is ignored on purpose: it describes the signed-in mentor's account, not the mentees.
 */
export function couponFitsService(
  coupon: MatchFields,
  service: ServicePricing & { serviceId: string },
): boolean {
  const price = menteePriceOf(service);
  if (!(price > 0)) return false;
  if (coupon.remainingQuota != null && coupon.remainingQuota <= 0) return false;
  if (coupon.minOrderValueScoin != null && price < coupon.minOrderValueScoin) return false;
  const ids = coupon.applicableServiceIds;
  return !ids?.length || ids.includes(service.serviceId);
}

/** True when at most 20% of the total quota is left (same threshold as `isNearlyExhausted`). */
export function isNearlyExhaustedQuota(
  coupon: Pick<UserCouponView, 'quotaTotal' | 'remainingQuota'>,
): boolean {
  if (coupon.quotaTotal == null || coupon.remainingQuota == null || coupon.quotaTotal <= 0) {
    return false;
  }
  return coupon.remainingQuota / coupon.quotaTotal <= 0.2;
}

/** Coupon giving the largest discount on `menteePrice` (first one on ties); null for none. */
export function bestCouponFor<C extends CouponDiscount>(
  coupons: readonly C[],
  menteePrice: number,
): C | null {
  if (!coupons.length) return null;
  return coupons.reduce((best, coupon) =>
    menteePriceAfter(coupon, menteePrice) < menteePriceAfter(best, menteePrice) ? coupon : best,
  );
}

/**
 * Service + coupon for the "Tiền đi như thế nào" example, from the mentor's own data: the first
 * paid service that some coupon fits, with the coupon giving it the largest discount.
 */
export function pickMoneyFlowExample<
  S extends ServicePricing & { serviceId: string },
  C extends CouponDiscount & MatchFields,
>(services: readonly S[], coupons: readonly C[]): { service: S; coupon: C } | null {
  for (const service of services) {
    const fits = coupons.filter((coupon) => couponFitsService(coupon, service));
    const coupon = bestCouponFor(fits, menteePriceOf(service));
    if (coupon) return { service, coupon };
  }
  return null;
}

// --- Wallet history ---

interface WalletCouponFields {
  originType?: string | null;
  sourceType?: string | null;
  memo?: string | null;
}

/** True for wallet entries paid by SkillSwap for a coupon discount. */
export function isCouponSponsorEntry(entry: WalletCouponFields): boolean {
  return entry.originType === 'COUPON_BONUS' || entry.sourceType === 'COUPON';
}

const MEMO_CODE_PATTERN = /(?:mã|coupon|code)\s*[:#]?\s*([A-Za-z0-9]{4,20})(?![A-Za-z0-9])/i;

/** Upper-case coupon code named in the memo of a wallet entry ("… mã CHAOK19 …"), or null. */
export function walletEntryCouponCode(entry: WalletCouponFields): string | null {
  const match = entry.memo?.match(MEMO_CODE_PATTERN)?.[1];
  return match && /^[A-Z0-9]+$/.test(match) && /[A-Z]/.test(match) ? match : null;
}

/**
 * Label of a coupon wallet entry: "SkillSwap tài trợ mã {CODE}", or the memo as is when the code is
 * unknown. null for non-coupon entries.
 */
export function walletCouponLabel(entry: WalletCouponFields): string | null {
  if (!isCouponSponsorEntry(entry)) return null;
  const code = walletEntryCouponCode(entry);
  if (code) return `SkillSwap tài trợ mã ${code}`;
  return entry.memo?.trim() || 'SkillSwap tài trợ mã giảm giá';
}
