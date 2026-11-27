/**
 * @file usePaymentReturn.ts
 * @description Logic trang `/payment/return`: tìm booking vừa thanh toán, đọc trạng thái payment
 * order (chờ webhook PayOS thêm vài giây nếu cần) rồi dựng biên nhận khi đã thanh toán.
 */

'use client';

import { clearPendingPayment, readPendingPayment } from '@/lib/pendingPayment';
import { ApiClientError } from '@/models/apiClient';
import type { MentorBookingResponse, PaymentCheckoutResponse } from '@/models/auth';
import { bookingRepo } from '@/repositories/bookingRepo';
import { paymentRepo } from '@/repositories/paymentRepo';
import { getUserFriendlyErrorMessage } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildInvoice, hasInvoice, type Invoice } from '../mentee/invoices/invoice.helpers';

export type ReturnPhase =
  'checking' | 'paid' | 'pending' | 'cancelled' | 'failed' | 'expired' | 'unknown' | 'error';

const POLL_INTERVAL_MS = 3000;
/** ~30 s: PayOS webhooks normally land within a few seconds. */
const MAX_POLLS = 10;
const WAITING = ['PENDING', 'AWAITING_PROVIDER_PAYMENT', 'PARTIALLY_COVERED_BY_CREDIT'];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const upper = (value: unknown) => String(value ?? '').toUpperCase();

function matchesOrder(order: PaymentCheckoutResponse, orderCode: string) {
  return [order.orderCode, order.providerOrderCode].some(
    (code) => code != null && String(code) === orderCode,
  );
}

/** PayOS only sends back its orderCode, so find which of the user's bookings it belongs to. */
async function findBookingId(params: { bookingId?: string; orderCode?: string }) {
  if (params.bookingId) return params.bookingId;
  const pending = readPendingPayment();
  if (
    pending &&
    (!params.orderCode || !pending.orderCode || pending.orderCode === params.orderCode)
  )
    return pending.bookingId;
  if (!params.orderCode) return pending?.bookingId;

  const page = await bookingRepo.listForMenteePlain();
  const candidates = (page.content ?? [])
    .filter(
      (booking) => booking.canPay || ['PENDING', 'PAID'].includes(upper(booking.paymentStatus)),
    )
    .slice(0, 6);
  for (const booking of candidates) {
    const order = await paymentRepo.getOrder(booking.bookingId).catch(() => null);
    if (order && matchesOrder(order, params.orderCode)) return booking.bookingId;
  }
  return pending?.bookingId;
}

function phaseOf(order: PaymentCheckoutResponse, gatewayCancelled: boolean): ReturnPhase {
  const status = upper(order.status);
  if (status === 'PAID') return 'paid';
  if (status === 'EXPIRED') return 'expired';
  if (status === 'FAILED') return 'failed';
  if (status === 'CANCELLED' || gatewayCancelled) return 'cancelled';
  return WAITING.includes(status) ? 'pending' : 'unknown';
}

export function usePaymentReturn() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const bookingIdParam = searchParams.get('bookingId') ?? undefined;
  const orderCode = searchParams.get('orderCode') ?? undefined;
  const gatewayCancelled =
    searchParams.get('cancel') === 'true' || upper(searchParams.get('status')) === 'CANCELLED';

  const [phase, setPhase] = useState<ReturnPhase>('checking');
  const [bookingId, setBookingId] = useState<string>();
  const [booking, setBooking] = useState<MentorBookingResponse>();
  const [order, setOrder] = useState<PaymentCheckoutResponse>();
  const [invoice, setInvoice] = useState<Invoice>();
  const [message, setMessage] = useState<string>();
  const [syncing, setSyncing] = useState(false);
  const runRef = useRef(0);

  const settle = useCallback(
    async (id: string, latest: PaymentCheckoutResponse) => {
      const next = phaseOf(latest, gatewayCancelled);
      setOrder(latest);
      setMessage(latest.userActionMessage?.trim() || undefined);
      if (next === 'paid') {
        const detail = await bookingRepo.detail(id).catch(() => undefined);
        setBooking(detail);
        if (detail && (hasInvoice(detail) || upper(latest.status) === 'PAID')) {
          setInvoice(buildInvoice({ ...detail, paymentStatus: 'PAID' }, latest));
        }
        clearPendingPayment();
        void queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      } else if (next !== 'pending') {
        bookingRepo
          .detail(id)
          .then(setBooking)
          .catch(() => undefined);
      }
      setPhase(next);
    },
    [gatewayCancelled, queryClient],
  );

  const check = useCallback(async () => {
    const run = ++runRef.current;
    setPhase('checking');
    try {
      const id = await findBookingId({ bookingId: bookingIdParam, orderCode });
      if (run !== runRef.current) return;
      if (!id) {
        setPhase('unknown');
        return;
      }
      setBookingId(id);
      let latest = await paymentRepo.getOrder(id);
      // Wait for the PayOS webhook unless the user cancelled on the gateway.
      for (
        let poll = 0;
        !gatewayCancelled && WAITING.includes(upper(latest.status)) && poll < MAX_POLLS;
        poll += 1
      ) {
        await wait(POLL_INTERVAL_MS);
        if (run !== runRef.current) return;
        latest = await paymentRepo.getOrder(id);
      }
      if (run !== runRef.current) return;
      await settle(id, latest);
    } catch (reason) {
      if (run !== runRef.current) return;
      if (reason instanceof ApiClientError && [403, 404].includes(reason.status)) {
        setPhase('unknown');
        return;
      }
      setMessage(getUserFriendlyErrorMessage(reason, 'Chưa kiểm tra được trạng thái thanh toán.'));
      setPhase('error');
    }
  }, [bookingIdParam, gatewayCancelled, orderCode, settle]);

  useEffect(() => {
    void check();
    return () => {
      runRef.current += 1;
    };
  }, [check]);

  /** Asks the BE to re-check PayOS (rate-limited, so only on user request). */
  const syncNow = useCallback(async () => {
    if (!bookingId || syncing) return;
    setSyncing(true);
    try {
      await settle(bookingId, await paymentRepo.syncOrder(bookingId));
    } catch (reason) {
      setMessage(
        reason instanceof ApiClientError && reason.status === 429
          ? 'Bạn vừa kiểm tra rồi. Đợi khoảng một phút rồi thử lại nhé.'
          : getUserFriendlyErrorMessage(reason, 'Chưa kiểm tra lại được. Thử lại sau ít phút.'),
      );
    } finally {
      setSyncing(false);
    }
  }, [bookingId, settle, syncing]);

  return {
    phase,
    bookingId,
    booking,
    order,
    invoice,
    message,
    syncing,
    retry: check,
    syncNow,
  };
}
