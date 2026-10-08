/**
 * @file MentorServiceCard.tsx
 * @description Thẻ dịch vụ tư vấn 1:1 trên hồ sơ mentor: nội dung bên trái, khung đặt lịch bên phải.
 */

'use client';

import type { MentorService } from '@/models/entities';
import { Button } from '@/components/ui/Button';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock,
  FileCheck2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { parseServiceDescription, splitOutcome } from './parseServiceDescription';

interface MentorServiceCardProps {
  service: MentorService;
  priceText: string;
  /** Starts the existing booking flow with this service preselected. */
  onBook: (service: MentorService) => void;
  /** Opens the mentor's free slots for this service. */
  onViewSchedule: (service: MentorService) => void;
}

export function MentorServiceCard({
  service,
  priceText,
  onBook,
  onViewSchedule,
}: MentorServiceCardProps) {
  const parsed = useMemo(
    () => parseServiceDescription(service.description ?? ''),
    [service.description],
  );
  const hasStructure = parsed.items.length > 0;
  const isFree = service.priceScoins === 0;
  const outcome = parsed.outcome ? splitOutcome(parsed.outcome) : null;
  const titleId = `service-${service.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="grid overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            <h4 id={titleId} className="m-0 text-[22px] font-bold leading-tight text-slate-900">
              {service.name}
            </h4>
            {hasStructure && parsed.intro && (
              <p className="m-0 text-sm leading-relaxed text-slate-600">{parsed.intro}</p>
            )}
          </div>
        </div>

        {!hasStructure && service.description && (
          <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {service.description}
          </p>
        )}

        {parsed.audience.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-slate-600">Phù hợp cho</span>
            {parsed.audience.map((item) => (
              <span
                key={item}
                className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-sky-800"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {hasStructure && (
          <div className="space-y-3">
            <h5 className="m-0 text-[15px] font-semibold text-slate-900">
              Trong buổi tư vấn, mình sẽ giúp bạn
            </h5>
            <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-2.5 p-0 sm:grid-cols-2">
              {parsed.items.map((item, index) => (
                <li
                  key={`${index}-${item}`}
                  className="flex items-start gap-2 text-sm leading-snug text-slate-700"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {outcome && (
          <div className="flex items-start gap-3 rounded-xl bg-primary-light px-4 py-3 text-sm leading-relaxed text-slate-700">
            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="m-0">
              {outcome.lead ? (
                <>
                  <b className="font-semibold text-slate-900">{outcome.lead}:</b> {outcome.rest}
                </>
              ) : (
                outcome.rest
              )}
            </p>
          </div>
        )}
      </div>

      <aside
        aria-label={`Đặt lịch ${service.name}`}
        className="flex flex-col gap-4 border-t border-slate-200/80 bg-primary-light/50 p-5 sm:p-6 lg:border-t-0 lg:border-l"
      >
        <div>
          <span className="text-[13px] font-medium text-slate-600">Chi phí</span>
          <div className="flex items-baseline gap-1.5">
            <strong
              className={`text-[30px] font-bold leading-tight ${isFree ? 'text-emerald-700' : 'text-slate-900'}`}
            >
              {isFree ? 'Miễn phí' : priceText}
            </strong>
            {!isFree && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                S-coins
              </span>
            )}
          </div>
        </div>

        <dl className="m-0 space-y-2.5 border-t border-slate-200/80 pt-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" aria-hidden="true" /> Thời lượng
            </dt>
            <dd className="m-0 font-semibold text-slate-900">{service.durationMinutes} phút</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-600">
              <UserRound className="h-4 w-4" aria-hidden="true" /> Hình thức
            </dt>
            <dd className="m-0 font-semibold text-slate-900">Tư vấn 1:1</dd>
          </div>
          {service.completedCount !== undefined && (
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-600">
                <UsersRound className="h-4 w-4" aria-hidden="true" /> Đã hoàn thành
              </dt>
              <dd className="m-0 font-semibold text-slate-900">{service.completedCount} phiên</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto space-y-1 pt-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            leftIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            onClick={() => onBook(service)}
          >
            Đặt lịch tư vấn
          </Button>
          <button
            type="button"
            onClick={() => onViewSchedule(service)}
            className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-sm font-semibold text-sky-800 underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Xem lịch trống của mentor
          </button>
        </div>
      </aside>
    </article>
  );
}
