/**
 * @file InvoiceDetailView.tsx
 * @description Biên nhận chi tiết của một buổi học đã thanh toán, có nút In / Lưu PDF
 * (dùng hộp thoại in của trình duyệt, chỉ in phần biên nhận).
 */

'use client';

import { ApiClientError } from '@/models/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { ArrowLeft, CalendarDays, Printer } from 'lucide-react';
import Link from 'next/link';
import { InvoiceDocument } from './components/InvoiceDocument';
import styles from './invoices.module.css';
import { useInvoice } from './useInvoices';

export function InvoiceDetailView({ locale, bookingId }: { locale: string; bookingId: string }) {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useInvoice(bookingId);
  const invoicesHref = `/${locale}/invoices`;
  const notFound = error instanceof ApiClientError && [403, 404].includes(error.status);

  return (
    <section className="mx-auto w-full max-w-[760px] pb-16">
      <div className={`${styles.noPrint} mb-4 flex flex-wrap items-center justify-between gap-3`}>
        <Link
          href={invoicesHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary no-underline hover:text-primary"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Hóa đơn của tôi
        </Link>
        {data?.invoice && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/my-bookings`}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-solid border-border-light bg-white px-4 text-sm font-bold text-text-secondary no-underline hover:text-primary"
            >
              <CalendarDays size={16} aria-hidden="true" /> Xem buổi học
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover"
            >
              <Printer size={16} aria-hidden="true" /> In / Lưu PDF
            </button>
          </div>
        )}
      </div>

      {isPending ? (
        <div className="h-[560px] animate-pulse rounded-3xl bg-surface-subtle" aria-busy="true">
          <span className="sr-only">Đang tải hóa đơn…</span>
        </div>
      ) : isError || !data?.invoice ? (
        <div
          className="rounded-3xl border border-solid border-border-light bg-white p-8 text-center"
          role="alert"
        >
          <h1 className="m-0 text-lg font-extrabold text-text-main">
            {isError && !notFound ? 'Chưa tải được hóa đơn' : 'Không có hóa đơn cho buổi học này'}
          </h1>
          <p className="mx-auto mb-0 mt-1 max-w-md text-sm text-text-secondary">
            {isError && !notFound
              ? 'Kiểm tra kết nối rồi thử lại.'
              : 'Buổi học chưa được thanh toán, là buổi miễn phí, hoặc không thuộc tài khoản của bạn.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {isError && !notFound && (
              <button
                type="button"
                onClick={() => void refetch()}
                className="min-h-10 cursor-pointer rounded-xl border-0 bg-primary px-4 text-sm font-bold text-white"
              >
                Thử lại
              </button>
            )}
            <Link
              href={invoicesHref}
              className="inline-flex min-h-10 items-center rounded-xl border border-solid border-border-light bg-white px-4 text-sm font-bold text-text-secondary no-underline"
            >
              Về danh sách hóa đơn
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h1 className="sr-only">Hóa đơn {data.invoice.number}</h1>
          <InvoiceDocument invoice={data.invoice} buyerEmail={user?.email} />
        </>
      )}
    </section>
  );
}
