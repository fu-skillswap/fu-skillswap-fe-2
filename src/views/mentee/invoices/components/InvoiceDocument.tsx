/**
 * @file InvoiceDocument.tsx
 * @description Hóa đơn (biên nhận thanh toán) của một buổi học. Dùng ở trang chi tiết hóa đơn và
 * trang kết quả thanh toán; khi in chỉ phần này được in ra.
 */

import { PLATFORM_OPERATOR } from '@/constants/legal';
import { formatScoin } from '@/lib/coupon';
import Image from 'next/image';
import {
  INVOICE_STATUS,
  formatDateTime,
  formatVnd,
  shortReference,
  type Invoice,
} from '../invoice.helpers';
import { formatTime } from '../../my-bookings/bookingStatusConfig';

function AmountRow({
  label,
  value,
  negative,
  strong,
}: {
  label: string;
  value: number;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? 'text-base' : ''}`}
    >
      <dt className={strong ? 'font-extrabold text-text-main' : 'text-text-secondary'}>{label}</dt>
      <dd
        className={`m-0 tabular-nums ${strong ? 'font-extrabold text-text-main' : 'font-semibold text-text-main'}`}
      >
        {negative && value > 0 ? '−' : ''}
        {formatScoin(value)} S-coins
      </dd>
    </div>
  );
}

export function InvoiceDocument({
  invoice,
  buyerEmail,
}: {
  invoice: Invoice;
  buyerEmail?: string;
}) {
  const status = INVOICE_STATUS[invoice.status];
  const timeRange = invoice.start
    ? `${formatDateTime(invoice.start)}${invoice.end ? ` – ${formatTime(invoice.end)}` : ''}`
    : '—';

  return (
    <article
      data-print-root
      className={`rounded-3xl border border-solid border-border-light bg-white p-5 shadow-xs sm:p-8`}
      aria-label={`Hóa đơn ${invoice.number}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-0 border-b border-solid border-border-light pb-5">
        <div>
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={150}
            height={48}
            className="h-10 w-auto object-contain"
          />
          <h2 className="mb-0 mt-3 text-xl font-extrabold tracking-tight text-text-main">
            Biên nhận thanh toán
          </h2>
          <p className="m-0 mt-1 text-sm text-text-secondary">
            Số <b className="text-text-main">{invoice.number}</b> · Mã booking{' '}
            {shortReference(invoice.bookingId)}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border border-solid px-3 py-1 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </header>

      <section className="grid gap-4 border-0 border-b border-solid border-border-light py-5 sm:grid-cols-2">
        <div>
          <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-text-muted">
            Người thanh toán
          </h3>
          <p className="m-0 mt-1.5 font-bold text-text-main">{invoice.menteeName}</p>
          {buyerEmail && <p className="m-0 text-sm text-text-secondary">{buyerEmail}</p>}
        </div>
        <div>
          <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-text-muted">
            Đơn vị vận hành
          </h3>
          <p className="m-0 mt-1.5 font-bold text-text-main">{PLATFORM_OPERATOR.operatorName}</p>
          <p className="m-0 text-sm text-text-secondary">{PLATFORM_OPERATOR.email}</p>
        </div>
      </section>

      <section className="border-0 border-b border-solid border-border-light py-5">
        <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-text-muted">Dịch vụ</h3>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 font-bold text-text-main">{invoice.serviceTitle}</p>
            <p className="m-0 mt-1 text-sm text-text-secondary">
              Mentor {invoice.mentorName}
              {invoice.durationMinutes > 0 ? ` · ${invoice.durationMinutes} phút` : ''}
              {invoice.platform ? ` · ${invoice.platform}` : ''}
            </p>
            <p className="m-0 text-sm text-text-secondary">Thời gian học: {timeRange}</p>
          </div>
          <p className="m-0 font-bold tabular-nums text-text-main">
            {formatScoin(invoice.priceScoin)} S-coins
          </p>
        </div>
      </section>

      <section className="py-5">
        <dl className="m-0 text-sm">
          <AmountRow label="Giá buổi học (đã gồm phí nền tảng)" value={invoice.priceScoin} />
          {invoice.couponDiscountScoin > 0 && (
            <AmountRow label="Giảm từ mã giảm giá" value={invoice.couponDiscountScoin} negative />
          )}
          {invoice.campaignCreditScoin > 0 && (
            <AmountRow label="Ưu đãi khuyến mãi" value={invoice.campaignCreditScoin} negative />
          )}
          {invoice.userCreditScoin > 0 && (
            <AmountRow label="Trừ từ ví S-coins" value={invoice.userCreditScoin} negative />
          )}
          <div className="my-2 border-0 border-t border-dashed border-border-light" />
          <AmountRow label="Đã thanh toán" value={invoice.paidScoin} strong />
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-text-secondary">Số tiền đã chuyển</dt>
            <dd className="m-0 font-semibold tabular-nums text-text-main">
              {formatVnd(invoice.paidVnd)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-text-secondary">Hình thức</dt>
            <dd className="m-0 font-semibold text-text-main">{invoice.method}</dd>
          </div>
          {invoice.refundedScoin > 0 && (
            <div className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="text-text-secondary">Đã hoàn vào ví S-coins</dt>
              <dd className="m-0 font-semibold tabular-nums text-emerald-700">
                {formatScoin(invoice.refundedScoin)} S-coins
              </dd>
            </div>
          )}
        </dl>
        {!invoice.hasOrderDetails && (
          <p className="mb-0 mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Chưa tải được chi tiết giảm giá của đơn này, số tiền đang hiện theo giá niêm yết.
          </p>
        )}
      </section>

      <footer className="rounded-2xl bg-surface-subtle px-4 py-3 text-xs leading-5 text-text-secondary">
        Biên nhận xác nhận bạn đã thanh toán buổi học trên SkillSwap. Đây không phải hóa đơn giá trị
        gia tăng (VAT). Cần hỗ trợ, gửi email tới {PLATFORM_OPERATOR.email} kèm số biên nhận.
      </footer>
    </article>
  );
}
