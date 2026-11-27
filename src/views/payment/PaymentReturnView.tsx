/**
 * @file PaymentReturnView.tsx
 * @description Trang kết quả sau khi người dùng rời PayOS (`/[locale]/payment/return`): xác nhận
 * trạng thái với backend, báo rõ việc tiếp theo và hiện biên nhận khi đã thanh toán thành công.
 */

'use client';

import { formatScoin } from '@/lib/coupon';
import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock,
  LoaderCircle,
  Printer,
  ReceiptText,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { InvoiceDocument } from '../mentee/invoices/components/InvoiceDocument';
import { formatDateTime } from '../mentee/invoices/invoice.helpers';
import invoiceStyles from '../mentee/invoices/invoices.module.css';
import { getMentorName, toDate } from '../mentee/my-bookings/bookingStatusConfig';
import { usePaymentReturn, type ReturnPhase } from './usePaymentReturn';
import { useAuth } from '@/providers/AuthProvider';

const TONES: Record<ReturnPhase, { icon: LucideIcon; className: string }> = {
  checking: { icon: LoaderCircle, className: 'bg-primary-light text-primary' },
  paid: { icon: CircleCheck, className: 'bg-emerald-50 text-emerald-600' },
  pending: { icon: Clock, className: 'bg-amber-50 text-amber-600' },
  cancelled: { icon: CircleAlert, className: 'bg-slate-100 text-slate-600' },
  failed: { icon: CircleAlert, className: 'bg-rose-50 text-rose-600' },
  expired: { icon: Clock, className: 'bg-slate-100 text-slate-600' },
  unknown: { icon: CircleAlert, className: 'bg-slate-100 text-slate-600' },
  error: { icon: CircleAlert, className: 'bg-rose-50 text-rose-600' },
};

const primaryButton =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-primary px-5 text-sm font-bold text-white no-underline hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70';
const secondaryButton =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-solid border-border-light bg-white px-5 text-sm font-bold text-text-main no-underline hover:border-primary-border hover:text-primary';

export function PaymentReturnView({ locale }: { locale: string }) {
  const { user } = useAuth();
  const { phase, bookingId, booking, order, invoice, message, syncing, retry, syncNow } =
    usePaymentReturn();
  const bookingsHref = `/${locale}/my-bookings`;
  const invoicesHref = `/${locale}/invoices`;
  const checkoutHref = bookingId ? `/${locale}/my-bookings/${bookingId}/checkout` : bookingsHref;
  const canPayAgain = Boolean(booking?.canPay ?? order?.retryable);
  const start = toDate(booking?.selectedStartTime);
  const expiresAt = toDate(order?.expiresAt);
  const session = booking
    ? `${booking.serviceTitle?.trim() || 'Buổi học'} với ${getMentorName(booking)}${
        start ? ` lúc ${formatDateTime(start)}` : ''
      }`
    : 'Buổi học của bạn';

  let title: string;
  let body: ReactNode;
  let actions: ReactNode;

  switch (phase) {
    case 'checking':
      title = 'Đang xác nhận thanh toán…';
      body =
        'SkillSwap đang kiểm tra giao dịch với PayOS. Thường chỉ mất vài giây, đừng đóng trang.';
      actions = null;
      break;
    case 'paid':
      title = 'Thanh toán thành công';
      body = (
        <>
          {session} đã được giữ chỗ.
          {order?.remainingPayableScoin != null && (
            <>
              {' '}
              Bạn đã trả <b>{formatScoin(order.remainingPayableScoin)} S-coins</b>.
            </>
          )}{' '}
          Biên nhận được lưu trong <b>Hồ sơ → Hóa đơn của tôi</b>.
        </>
      );
      actions = (
        <>
          <Link href={bookingsHref} className={primaryButton}>
            <CalendarDays size={17} aria-hidden="true" /> Xem buổi học
          </Link>
          {invoice && (
            <button type="button" className={secondaryButton} onClick={() => window.print()}>
              <Printer size={17} aria-hidden="true" /> In / Lưu PDF
            </button>
          )}
          <Link href={invoicesHref} className={secondaryButton}>
            <ReceiptText size={17} aria-hidden="true" /> Hóa đơn của tôi
          </Link>
        </>
      );
      break;
    case 'pending':
      title = 'Đang chờ PayOS xác nhận';
      body = (
        <>
          Nếu bạn đã chuyển khoản, giao dịch sẽ được ghi nhận trong vài phút.{' '}
          <b>Đừng chuyển lại lần nữa.</b> Bấm &quot;Kiểm tra lại&quot; sau ít phút hoặc xem trạng
          thái trong Booking của tôi.
        </>
      );
      actions = (
        <>
          <button
            type="button"
            className={primaryButton}
            disabled={syncing}
            aria-busy={syncing}
            onClick={() => void syncNow()}
          >
            <RefreshCw size={17} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {syncing ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
          </button>
          <Link href={bookingsHref} className={secondaryButton}>
            Về Booking của tôi
          </Link>
        </>
      );
      break;
    case 'cancelled':
    case 'failed':
    case 'expired':
      title =
        phase === 'cancelled'
          ? 'Bạn đã hủy thanh toán'
          : phase === 'expired'
            ? 'Phiên thanh toán đã hết hạn'
            : 'Thanh toán chưa thành công';
      body = (
        <>
          Bạn chưa bị trừ tiền.{' '}
          {canPayAgain
            ? `${session} vẫn đang chờ thanh toán${
                expiresAt ? ` đến ${formatDateTime(expiresAt)}` : ''
              }, bạn có thể thanh toán lại.`
            : 'Lịch hẹn này không còn thanh toán được nữa, hãy đặt lịch mới nếu bạn vẫn muốn học.'}
        </>
      );
      actions = (
        <>
          {canPayAgain && (
            <Link href={checkoutHref} className={primaryButton}>
              Thanh toán lại
            </Link>
          )}
          <Link href={bookingsHref} className={canPayAgain ? secondaryButton : primaryButton}>
            Về Booking của tôi
          </Link>
        </>
      );
      break;
    case 'unknown':
      title = 'Không tìm thấy giao dịch';
      body =
        'SkillSwap chưa xác định được bạn vừa thanh toán buổi học nào. Nếu tài khoản đã bị trừ tiền, buổi học và biên nhận sẽ hiện trong Booking của tôi và Hóa đơn của tôi sau vài phút.';
      actions = (
        <>
          <Link href={bookingsHref} className={primaryButton}>
            Về Booking của tôi
          </Link>
          <Link href={invoicesHref} className={secondaryButton}>
            Hóa đơn của tôi
          </Link>
        </>
      );
      break;
    default:
      title = 'Chưa kiểm tra được thanh toán';
      body = 'Kết nối đang gặp trục trặc. Giao dịch của bạn không bị ảnh hưởng, hãy thử lại.';
      actions = (
        <>
          <button type="button" className={primaryButton} onClick={() => void retry()}>
            <RefreshCw size={17} aria-hidden="true" /> Thử lại
          </button>
          <Link href={bookingsHref} className={secondaryButton}>
            Về Booking của tôi
          </Link>
        </>
      );
  }

  const tone = TONES[phase];
  const Icon = tone.icon;
  const showServerMessage = message && phase !== 'paid' && phase !== 'checking';

  return (
    <section className="mx-auto grid w-full max-w-[760px] gap-5 pb-16">
      <div
        className={`${invoiceStyles.noPrint} rounded-3xl border border-solid border-border-light bg-white px-5 py-8 text-center shadow-xs sm:px-10`}
        role={phase === 'checking' ? 'status' : undefined}
        aria-live="polite"
      >
        <span
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${tone.className}`}
          aria-hidden="true"
        >
          <Icon size={34} className={phase === 'checking' ? 'animate-spin' : ''} />
        </span>
        <h1 className="mb-0 mt-4 text-2xl font-extrabold tracking-tight text-text-main">{title}</h1>
        <p className="mx-auto mb-0 mt-2 max-w-[560px] text-[15px] leading-6 text-text-secondary">
          {body}
        </p>
        {showServerMessage && (
          <p className="mx-auto mb-0 mt-3 max-w-[560px] rounded-xl bg-surface-subtle px-3 py-2 text-sm text-text-secondary">
            {message}
          </p>
        )}
        {actions && <div className="mt-6 flex flex-wrap justify-center gap-2.5">{actions}</div>}
      </div>

      {phase === 'paid' && invoice && (
        <InvoiceDocument invoice={invoice} buyerEmail={user?.email} />
      )}
    </section>
  );
}
