/**
 * @file MentorBookingsHub.tsx
 * @description Trang "Lịch đặt" của mentor gồm 2 phía: buổi học viên đặt với mentor (dạy) và buổi
 * mentor tự đặt với mentor khác (học). Phía đang xem lưu ở `?view=` để chia sẻ link/quay lại.
 */

'use client';

import { mentorBookingRepo } from '@/repositories/mentorBookingRepo';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Presentation } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MyBookingsView } from '@/views/mentee/my-bookings/MyBookingsView';
import { MentorBookingsView } from './MentorBookingsView';

type HubView = 'teaching' | 'learning';

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20';

export function MentorBookingsHub() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale = 'vi' } = useParams<{ locale: string }>();
  const view: HubView = searchParams.get('view') === 'learning' ? 'learning' : 'teaching';

  const { data: counts } = useQuery({
    queryKey: ['mentor-booking-side-counts'],
    queryFn: async () => {
      const [teaching, learning] = await Promise.all([
        mentorBookingRepo.count('MENTOR').catch(() => undefined),
        mentorBookingRepo.count('MENTEE').catch(() => undefined),
      ]);
      return { teaching, learning };
    },
  });

  const select = (next: HubView) => {
    const query = new URLSearchParams(searchParams.toString());
    if (next === 'learning') query.set('view', 'learning');
    else query.delete('view');
    // A notification focus belongs to the side it was opened on.
    query.delete('focus');
    const search = query.toString();
    router.replace(`${pathname}${search ? `?${search}` : ''}`, { scroll: false });
  };

  const tabs: Array<{ value: HubView; label: string; icon: typeof Presentation; count?: number }> =
    [
      {
        value: 'teaching',
        label: 'Học viên đặt với bạn',
        icon: Presentation,
        count: counts?.teaching,
      },
      {
        value: 'learning',
        label: 'Bạn đặt với mentor khác',
        icon: GraduationCap,
        count: counts?.learning,
      },
    ];

  return (
    <div className="space-y-5">
      {/* Same width as the list below: the learner list is narrower than the mentor inbox. */}
      <div className={`mx-auto ${view === 'learning' ? 'max-w-[880px]' : 'max-w-5xl'}`}>
        <div
          role="tablist"
          aria-label="Loại lịch đặt"
          className="grid grid-cols-2 gap-1 rounded-2xl border border-solid border-border-light bg-white p-1.5 shadow-xs"
        >
          {tabs.map((tab) => {
            const selected = view === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                id={`booking-side-${tab.value}`}
                aria-selected={selected}
                aria-controls="booking-side-panel"
                onClick={() => select(tab.value)}
                className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 px-3 text-sm font-bold transition-colors ${FOCUS_RING} ${
                  selected
                    ? 'bg-primary text-white'
                    : 'bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-main'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                      selected ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-secondary'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div id="booking-side-panel" role="tabpanel" aria-labelledby={`booking-side-${view}`}>
        {view === 'learning' ? (
          <MyBookingsView
            locale={locale}
            title="Lịch bạn đặt với mentor khác"
            subtitle="Những buổi bạn tham gia với vai trò học viên: thanh toán, vào học và xác nhận ở đây."
          />
        ) : (
          <MentorBookingsView />
        )}
      </div>
    </div>
  );
}
