/**
 * @file RecentInvoicesSection.tsx
 * @description Khối "Hóa đơn thanh toán" trong Hồ sơ của tôi: 3 biên nhận gần nhất và lối vào
 * trang Hóa đơn của tôi.
 */

'use client';

import { formatScoin } from '@/lib/coupon';
import { ChevronRight, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { INVOICE_STATUS, formatDateTime } from './invoice.helpers';
import { useInvoices } from './useInvoices';

const PREVIEW_COUNT = 3;

export function RecentInvoicesSection({ locale }: { locale: string }) {
  const { data, isPending, isError } = useInvoices({ limit: PREVIEW_COUNT });
  const invoicesHref = `/${locale}/invoices`;
  const invoices = data?.invoices ?? [];

  return (
    <section
      className="mt-6 rounded-3xl border border-solid border-border-light bg-white p-5 sm:p-6"
      aria-labelledby="profile-invoices-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-primary"
            aria-hidden="true"
          >
            <ReceiptText size={20} />
          </span>
          <div>
            <h2
              id="profile-invoices-title"
              className="m-0 text-lg font-extrabold tracking-tight text-text-main"
            >
              Hóa đơn thanh toán
            </h2>
            <p className="m-0 text-sm text-text-secondary">
              Biên nhận các buổi học bạn đã thanh toán.
            </p>
          </div>
        </div>
        <Link
          href={invoicesHref}
          className="inline-flex items-center gap-1 text-sm font-bold text-primary no-underline hover:underline"
        >
          Xem tất cả{data?.total ? ` (${data.total})` : ''}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {isPending ? (
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-surface-subtle" aria-busy="true" />
      ) : isError ? (
        <p className="mb-0 mt-4 text-sm text-text-secondary">
          Chưa tải được hóa đơn. Mở <Link href={invoicesHref}>Hóa đơn của tôi</Link> để thử lại.
        </p>
      ) : invoices.length === 0 ? (
        <p className="mb-0 mt-4 rounded-2xl bg-surface-subtle px-4 py-3 text-sm text-text-secondary">
          Chưa có hóa đơn nào. Biên nhận sẽ tự lưu ở đây sau khi bạn thanh toán một buổi học.
        </p>
      ) : (
        <ul className="m-0 mt-4 grid list-none gap-2 p-0">
          {invoices.map((invoice) => {
            const status = INVOICE_STATUS[invoice.status];
            return (
              <li key={invoice.bookingId}>
                <Link
                  href={`${invoicesHref}/${invoice.bookingId}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-solid border-border-light px-4 py-3 text-inherit no-underline hover:border-primary-border"
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-text-main">
                      {invoice.serviceTitle}
                    </strong>
                    <small className="block truncate text-xs text-text-secondary">
                      {invoice.mentorName} · {formatDateTime(invoice.start)}
                    </small>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className="block text-sm font-extrabold tabular-nums text-text-main">
                      {formatScoin(invoice.paidScoin)} S-coins
                    </strong>
                    <small
                      className={`mt-0.5 inline-flex rounded-full border border-solid px-2 text-[11px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </small>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
