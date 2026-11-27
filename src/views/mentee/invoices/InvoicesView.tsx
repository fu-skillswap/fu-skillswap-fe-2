/**
 * @file InvoicesView.tsx
 * @description Trang "Hóa đơn của tôi": mọi buổi học đã thanh toán, số tiền thực trả và trạng thái
 * hoàn tiền. Mỗi dòng mở biên nhận chi tiết để xem, in hoặc lưu PDF.
 */

'use client';

import { findMentorHref } from '@/constants/publicSite';
import { formatScoin } from '@/lib/coupon';
import { ChevronRight, ReceiptText, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { INVOICE_STATUS, formatDateTime, formatVnd, type Invoice } from './invoice.helpers';
import { useInvoices } from './useInvoices';

function InvoiceRow({ invoice, href }: { invoice: Invoice; href: string }) {
  const status = INVOICE_STATUS[invoice.status];
  return (
    <li>
      <Link
        href={href}
        className="grid gap-3 rounded-2xl border border-solid border-border-light bg-white px-4 py-4 text-inherit no-underline transition hover:border-primary-border hover:shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:grid-cols-[minmax(0,1fr)_auto_auto_20px] sm:items-center sm:gap-5 sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary"
            aria-hidden="true"
          >
            <ReceiptText size={20} />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold text-text-main">
              {invoice.serviceTitle}
            </strong>
            <small className="block truncate text-xs text-text-secondary">
              Mentor {invoice.mentorName} · Học lúc {formatDateTime(invoice.start)} · Số{' '}
              {invoice.number}
            </small>
          </span>
        </span>
        <span className="text-sm sm:text-right">
          <strong className="block font-extrabold tabular-nums text-text-main">
            {formatScoin(invoice.paidScoin)} S-coins
          </strong>
          {invoice.couponDiscountScoin > 0 ? (
            <small className="text-xs text-emerald-700">
              Đã giảm {formatScoin(invoice.couponDiscountScoin)}
            </small>
          ) : (
            <small className="text-xs text-text-muted">{formatVnd(invoice.paidVnd)}</small>
          )}
        </span>
        <span
          className={`inline-flex w-fit items-center rounded-full border border-solid px-2.5 py-0.5 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
        <ChevronRight className="hidden text-text-muted sm:block" size={18} aria-hidden="true" />
      </Link>
    </li>
  );
}

export function InvoicesView({ locale }: { locale: string }) {
  const { data, isPending, isError, refetch, isFetching } = useInvoices();
  const invoices = data?.invoices ?? [];
  const totalPaidVnd = invoices.reduce((sum, invoice) => sum + invoice.paidVnd, 0);
  const totalRefunded = invoices.reduce((sum, invoice) => sum + invoice.refundedScoin, 0);

  return (
    <section className="mx-auto w-full max-w-[960px] pb-16">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/profile`}
            className="text-sm font-semibold text-text-secondary no-underline hover:text-primary"
          >
            ← Hồ sơ của tôi
          </Link>
          <h1 className="mb-0 mt-2 text-2xl font-extrabold tracking-tight text-text-main">
            Hóa đơn của tôi
          </h1>
          <p className="m-0 mt-1 text-sm text-text-secondary">
            Biên nhận của mọi buổi học bạn đã thanh toán. Bấm vào một dòng để xem, in hoặc lưu PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-solid border-border-light bg-white px-4 text-sm font-bold text-text-secondary hover:text-primary disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} aria-hidden="true" />
          Làm mới
        </button>
      </header>

      {isPending ? (
        <ul className="m-0 grid list-none gap-3 p-0" aria-busy="true" aria-label="Đang tải hóa đơn">
          {[0, 1, 2].map((key) => (
            <li key={key} className="h-[76px] animate-pulse rounded-2xl bg-surface-subtle" />
          ))}
        </ul>
      ) : isError ? (
        <div
          className="rounded-2xl border border-solid border-rose-200 bg-rose-50 p-5 text-sm"
          role="alert"
        >
          <p className="m-0 font-bold text-rose-800">Chưa tải được hóa đơn.</p>
          <p className="m-0 mt-1 text-rose-700">Kiểm tra kết nối rồi thử lại.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 min-h-10 cursor-pointer rounded-xl border-0 bg-primary px-4 text-sm font-bold text-white"
          >
            Thử lại
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-light bg-white px-6 py-12 text-center">
          <ReceiptText className="mx-auto text-primary" size={36} aria-hidden="true" />
          <h2 className="mb-0 mt-3 text-lg font-extrabold text-text-main">Chưa có hóa đơn nào</h2>
          <p className="mx-auto mb-0 mt-1 max-w-md text-sm text-text-secondary">
            Khi bạn thanh toán một buổi học, biên nhận sẽ được lưu ở đây để bạn xem lại bất cứ lúc
            nào.
          </p>
          <Link
            href={findMentorHref(locale)}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white no-underline"
          >
            <Search size={16} aria-hidden="true" /> Tìm mentor
          </Link>
        </div>
      ) : (
        <>
          <dl className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-solid border-border-light bg-white px-4 py-3">
              <dt className="text-xs font-semibold text-text-muted">Số hóa đơn</dt>
              <dd className="m-0 mt-1 text-xl font-extrabold text-text-main">
                {data?.total ?? invoices.length}
              </dd>
            </div>
            <div className="rounded-2xl border border-solid border-border-light bg-white px-4 py-3">
              <dt className="text-xs font-semibold text-text-muted">Tổng đã chuyển khoản</dt>
              <dd className="m-0 mt-1 text-xl font-extrabold tabular-nums text-text-main">
                {formatVnd(totalPaidVnd)}
              </dd>
            </div>
            <div className="rounded-2xl border border-solid border-border-light bg-white px-4 py-3">
              <dt className="text-xs font-semibold text-text-muted">Đã hoàn vào ví</dt>
              <dd className="m-0 mt-1 text-xl font-extrabold tabular-nums text-text-main">
                {formatScoin(totalRefunded)} S-coins
              </dd>
            </div>
          </dl>
          <ul className="m-0 grid list-none gap-3 p-0">
            {invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.bookingId}
                invoice={invoice}
                href={`/${locale}/invoices/${invoice.bookingId}`}
              />
            ))}
          </ul>
          {data && data.total > invoices.length && (
            <p className="mb-0 mt-3 text-center text-xs text-text-muted">
              Đang hiện {invoices.length} hóa đơn gần nhất trên tổng {data.total}.
            </p>
          )}
        </>
      )}
    </section>
  );
}
