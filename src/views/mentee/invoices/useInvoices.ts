/**
 * @file useInvoices.ts
 * @description Tải hóa đơn của người dùng: các booking đã thanh toán + payment order của từng
 * booking (để biết giảm giá, credit và số tiền thực trả).
 */

'use client';

import type { MentorBookingResponse, PaymentCheckoutResponse } from '@/models/auth';
import { bookingRepo } from '@/repositories/bookingRepo';
import { paymentRepo } from '@/repositories/paymentRepo';
import { useQuery } from '@tanstack/react-query';
import { buildInvoice, hasInvoice, type Invoice } from './invoice.helpers';

/** Keeps the number of payment-order requests reasonable on accounts with many sessions. */
const MAX_INVOICES = 50;

async function loadOrder(bookingId: string): Promise<PaymentCheckoutResponse | null> {
  try {
    return await paymentRepo.getOrder(bookingId);
  } catch {
    return null;
  }
}

export async function loadInvoice(booking: MentorBookingResponse): Promise<Invoice> {
  return buildInvoice(booking, await loadOrder(booking.bookingId));
}

export function useInvoices(options: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['my-invoices', options.limit ?? MAX_INVOICES],
    queryFn: async () => {
      const page = await bookingRepo.listForMenteePlain();
      const paid = (page.content ?? []).filter(hasInvoice);
      const visible = paid.slice(0, options.limit ?? MAX_INVOICES);
      return { invoices: await Promise.all(visible.map(loadInvoice)), total: paid.length };
    },
  });
}

export function useInvoice(bookingId: string) {
  return useQuery({
    queryKey: ['my-invoice', bookingId],
    queryFn: async () => {
      const booking = await bookingRepo.detail(bookingId);
      return { booking, invoice: hasInvoice(booking) ? await loadInvoice(booking) : null };
    },
  });
}
