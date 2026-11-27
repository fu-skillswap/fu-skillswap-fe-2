/**
 * @file HeldEarningsPanel.tsx
 * @description Khối "Đang giữ chờ buổi học" trong Ví S-coins của mentor: tiền mentee đã trả nhưng
 * chưa vào ví, từng buổi đang ở bước nào và khi nào tiền được chuyển.
 */

'use client';

import { mentorBookingRepo } from '@/repositories/mentorBookingRepo';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Hourglass, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HELD_STEP_COPY, getHeldEarnings, type HeldEarning } from '../heldEarnings';

const numberFormatter = new Intl.NumberFormat('vi-VN');
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});

const formatScoin = (value: number) => `${numberFormatter.format(value)} S-coins`;
const formatDate = (date?: Date) => (date ? dateFormatter.format(date) : '—');

function nextStepText(item: HeldEarning) {
  switch (item.step) {
    case 'upcoming':
      return `Học lúc ${formatDate(item.start)}. Tiền vào ví sau khi buổi học hoàn tất.`;
    case 'inSession':
      return 'Buổi học đang diễn ra. Xong buổi, hãy bấm "Xác nhận hoàn tất" trong Lịch đặt.';
    case 'needsMentor':
      return `Bấm "Xác nhận hoàn tất" để mentee xác nhận. Nếu không có sự cố, tiền tự vào ví trước ${formatDate(item.releaseBy)}.`;
    case 'waitingMentee':
      return `Mentee có thể xác nhận ngay; nếu không, tiền tự vào ví trước ${formatDate(item.releaseBy)} khi không có báo sự cố.`;
    case 'underReview':
      return 'Mentee đã báo sự cố. Tiền giữ nguyên cho tới khi SkillSwap xử lý xong.';
  }
}

export function HeldEarningsPanel() {
  const { locale } = useParams<{ locale: string }>();
  const bookingsHref = `/${locale}/mentor/bookings`;
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['mentor-held-earnings'],
    queryFn: async () => getHeldEarnings((await mentorBookingRepo.list()).content ?? []),
  });
  const items = data ?? [];
  const total = items.reduce((sum, item) => sum + item.priceScoin, 0);
  const needsAction = items.filter((item) => item.step === 'needsMentor').length;

  return (
    <section
      className="overflow-hidden rounded-xl border border-border-light bg-white shadow-xs"
      aria-labelledby="held-earnings-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
            aria-hidden="true"
          >
            <Hourglass className="h-5 w-5" />
          </span>
          <div>
            <h2 id="held-earnings-title" className="m-0 text-sm font-extrabold text-text-main">
              Đang giữ chờ buổi học{' '}
              {!isPending && !isError && (
                <span className="tabular-nums text-amber-700">· {formatScoin(total)}</span>
              )}
            </h2>
            <p className="m-0 text-[11px] text-text-muted">
              Tiền mentee đã trả được SkillSwap giữ an toàn, chuyển vào ví sau khi buổi học hoàn
              tất. Số nhận về sau khi trừ phí nền tảng.
            </p>
          </div>
        </div>
        {needsAction > 0 && (
          <Link
            href={bookingsHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white no-underline hover:bg-primary-hover"
          >
            Xác nhận {needsAction} buổi đã dạy <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </header>

      {isPending ? (
        <div className="space-y-2 p-4" aria-busy="true">
          <div className="h-12 animate-pulse rounded-lg bg-surface-subtle" />
          <div className="h-12 animate-pulse rounded-lg bg-surface-subtle" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 px-4 py-4 text-xs text-text-secondary sm:px-5">
          <span>Chưa tải được các buổi đang giữ tiền.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-bold text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="m-0 px-4 py-4 text-xs text-text-muted sm:px-5">
          Không có khoản nào đang giữ. Khi mentee thanh toán một buổi học, số tiền sẽ hiện ở đây cho
          tới lúc vào ví.
        </p>
      ) : (
        <ul className="m-0 max-h-[300px] list-none divide-y divide-border-light overflow-y-auto p-0">
          {items.map((item) => {
            const step = HELD_STEP_COPY[item.step];
            return (
              <li
                key={item.bookingId}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-sm font-bold text-text-main">
                      {item.serviceTitle}
                    </strong>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${step.className}`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="m-0 mt-0.5 text-[11px] text-text-secondary">
                    {item.menteeName} · {formatDate(item.start)}
                  </p>
                  <p className="m-0 mt-0.5 text-[11px] text-text-muted">{nextStepText(item)}</p>
                </div>
                <strong className="text-sm font-extrabold tabular-nums text-text-main sm:text-right">
                  {formatScoin(item.priceScoin)}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
