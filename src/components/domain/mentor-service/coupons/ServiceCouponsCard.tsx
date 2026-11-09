/**
 * @file ServiceCouponsCard.tsx
 * @description Read-only list of coupons that apply to a mentor's service, shown as tickets.
 */

import {
  computeCouponDiscount,
  couponBadgeText,
  deriveCouponState,
  formatScoin,
  isNearlyExhausted,
  withMenteeSurcharge,
} from '@/lib/coupon';
import type { MentorCouponView } from '@/models/coupon';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const dayMonth = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
});
const dayMonthYear = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function scopeLine(coupon: MentorCouponView, serviceId: string) {
  const mentors = coupon.applicableMentorIds?.length ?? 0;
  const services = coupon.applicableServiceIds ?? [];
  if (!mentors && !services.length) return 'Áp cho mọi mentor';
  if (!mentors && services.includes(serviceId)) return 'Riêng dịch vụ này';
  return `Áp cho ${mentors} mentor`;
}

function CouponTicket({
  coupon,
  serviceId,
  priceWithFee,
  now,
}: {
  coupon: MentorCouponView;
  serviceId: string;
  priceWithFee: number;
  now: number;
}) {
  const scheduled = deriveCouponState(coupon, now) === 'scheduled';
  const start = safeDate(coupon.startAt);
  const end = safeDate(coupon.endAt);
  const period = scheduled
    ? `${start ? dayMonth.format(start) : '—'} – ${end ? dayMonthYear.format(end) : '—'}`
    : `đến ${end ? dayMonthYear.format(end) : '—'}`;
  const capLine =
    coupon.discountType === 'PERCENTAGE'
      ? coupon.maxDiscountScoin
        ? `tối đa ${formatScoin(coupon.maxDiscountScoin)} S-coins`
        : 'không giới hạn mức giảm'
      : 'S-coins';
  const after = priceWithFee - computeCouponDiscount(coupon, priceWithFee);
  const used = coupon.usedCountForService?.[serviceId] ?? 0;
  const remaining =
    coupon.quotaTotal != null ? Math.max(0, coupon.quotaTotal - coupon.totalRedemptions) : null;

  return (
    <li className="grid min-h-36 grid-cols-[128px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border-color bg-white">
      {/* Stub: the notches are white circles over the perforation, matching the card behind. */}
      <div className="relative flex flex-col items-center justify-center gap-1 border-r-2 border-dashed border-[#bfdbfe] bg-primary-light px-2 py-3 text-center before:absolute before:-right-[10px] before:-top-[10px] before:h-[18px] before:w-[18px] before:rounded-full before:border before:border-border-color before:bg-white before:content-[''] after:absolute after:-bottom-[10px] after:-right-[10px] after:h-[18px] after:w-[18px] after:rounded-full after:border after:border-border-color after:bg-white after:content-['']">
        <strong className="text-[34px] font-extrabold leading-none tracking-tight text-primary tabular-nums">
          {couponBadgeText(coupon)}
        </strong>
        <span className="text-xs font-semibold leading-4 text-text-secondary">{capLine}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[17px] font-bold leading-snug text-text-main">
            {coupon.title}
          </h3>
          <code className="shrink-0 rounded-lg border-[1.5px] border-dashed border-primary-border bg-primary-light px-2 py-0.5 font-mono text-xs font-bold tracking-[0.04em] text-text-main">
            {coupon.code}
          </code>
        </div>
        <p className="text-sm text-text-secondary">
          {scopeLine(coupon, serviceId)} · {period}
        </p>
        <p className="text-sm text-text-main">
          Mentee trả <strong className="font-bold">{formatScoin(after)} S-coins</strong> thay vì{' '}
          {formatScoin(priceWithFee)}
        </p>
        <p className="text-sm font-semibold text-emerald-700">
          {used > 0
            ? `${formatScoin(used)} mentee đã dùng cho dịch vụ này`
            : 'Chưa có mentee dùng mã'}
        </p>
        {(scheduled || (remaining !== null && isNearlyExhausted(coupon))) && (
          <div className="mt-0.5 flex flex-wrap gap-2">
            {scheduled && start && (
              <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-[#1d4ed8]">
                Bắt đầu từ {dayMonth.format(start)}
              </span>
            )}
            {remaining !== null && isNearlyExhausted(coupon) && (
              <span className="rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-xs font-bold text-[#c2410c]">
                Còn {formatScoin(remaining)} lượt trên toàn hệ thống
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function ServiceCouponsCard({
  coupons,
  serviceId,
  priceScoin,
  now,
}: {
  coupons: MentorCouponView[];
  serviceId: string;
  priceScoin: number;
  now: number;
}) {
  if (!coupons.length) return null;
  const priceWithFee = withMenteeSurcharge(priceScoin);
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="service-coupons-heading"
    >
      <div className="mb-3 border-b border-slate-100 pb-3">
        <h2 id="service-coupons-heading" className="text-lg font-bold text-text-main">
          Mã giảm giá đang áp cho dịch vụ này
        </h2>
        <p className="mt-0.5 text-sm text-text-muted">
          SkillSwap tạo các mã này. Mentee nhập mã khi thanh toán, bạn không cần thao tác gì thêm.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(380px,1fr))]">
        {coupons.map((coupon) => (
          <CouponTicket
            key={coupon.id}
            coupon={coupon}
            serviceId={serviceId}
            priceWithFee={priceWithFee}
            now={now}
          />
        ))}
      </ul>
      <p className="mt-3 text-sm text-text-muted">
        Giá mentee thấy đã gồm phí nền tảng ({formatScoin(priceScoin)} → {formatScoin(priceWithFee)}{' '}
        S-coins).
        {/* TODO(api): mentor payout rule with coupons — add "Thu nhập của bạn: …" once BE
            confirms who pays the discount. */}
      </p>
    </section>
  );
}
