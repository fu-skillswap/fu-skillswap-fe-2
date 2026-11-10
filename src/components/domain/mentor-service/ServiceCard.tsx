/**
 * @file ServiceCard.tsx
 * @description Fixed-size mentor service card shown on the mentor profile ("Dịch vụ & Lịch dạy")
 * and, in its `compact` variant, as the live preview inside the service editor.
 * Every text block is clamped so old data longer than the new limits cannot grow the card.
 */

import { CheckCircle2 } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { ServiceCover } from './ServiceCover';
import { parseServiceDescription } from './serviceDescription';
import { AUDIENCE_MAX_COUNT, ITEMS_SHOWN_ON_CARD } from './serviceLimits';

/** View model shared by the public profile (mentee) and the mentor editor preview. */
export interface ServiceCardData {
  title: string;
  description: string;
  expectedOutcome: string;
  coverImageUrl?: string | null;
  durationMinutes?: number | null;
  isFree: boolean;
  priceScoin?: number | null;
  maintainPostSessionChat?: boolean;
}

interface ServiceCardProps {
  service: ServiceCardData;
  /** `profile`: 3-column fixed-height card on desktop. `compact`: always vertical (editor preview). */
  variant?: 'profile' | 'compact';
  onBook?: () => void;
  onViewSchedule?: () => void;
  onShowMore?: () => void;
  /** Editor preview: actions are shown but not interactive. */
  preview?: boolean;
}

export const formatServicePrice = (service: Pick<ServiceCardData, 'isFree' | 'priceScoin'>) =>
  service.isFree
    ? 'Miễn phí'
    : service.priceScoin === null || service.priceScoin === undefined
      ? '—'
      : `${new Intl.NumberFormat('vi-VN').format(service.priceScoin)} S-coins`;

function PanelRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="m-0 truncate text-sm font-semibold text-text-main">{value}</dd>
    </div>
  );
}

export function ServiceCard({
  service,
  variant = 'profile',
  onBook,
  onViewSchedule,
  onShowMore,
  preview = false,
}: ServiceCardProps) {
  const parsed = useMemo(() => parseServiceDescription(service.description), [service.description]);
  const outcome = service.expectedOutcome.trim() || parsed.legacyOutcome || '';
  const shownItems = parsed.items.slice(0, ITEMS_SHOWN_ON_CARD);
  const hiddenCount = parsed.items.length - shownItems.length;
  const audience = parsed.audience.slice(0, AUDIENCE_MAX_COUNT);
  const isProfile = variant === 'profile';

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border-color bg-surface shadow-sm ${
        isProfile ? 'lg:grid lg:h-[400px] lg:grid-cols-[320px_minmax(0,1fr)_272px]' : ''
      }`}
      aria-label={service.title || 'Dịch vụ tư vấn'}
    >
      {/* Left: cover + audience */}
      <div className={`flex min-w-0 flex-col gap-3 p-3 ${isProfile ? 'lg:min-h-0' : ''}`}>
        <ServiceCover
          title={service.title}
          coverImageUrl={service.coverImageUrl}
          className={isProfile ? 'lg:h-[167px] lg:w-[296px]' : ''}
        />
        {audience.length > 0 && (
          <div className="min-w-0 px-1">
            <p className="m-0 text-xs font-semibold text-text-muted">Phù hợp cho</p>
            <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
              {audience.map((entry, index) => (
                <li
                  key={`${index}-${entry}`}
                  className="max-w-full truncate rounded-full border border-primary-border/60 bg-primary-light px-2.5 py-1 text-xs font-medium text-sky-800"
                >
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Middle: title, intro, items, outcome */}
      <div
        className={`flex min-w-0 flex-col px-5 pb-5 ${
          isProfile ? 'lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-6' : ''
        }`}
      >
        <h4 className="m-0 line-clamp-2 break-words text-[22px] font-bold leading-7 text-text-main">
          {service.title || 'Tên dịch vụ'}
        </h4>
        {parsed.intro && (
          <p
            className={`m-0 mt-2 break-words text-sm leading-5 text-text-muted ${
              parsed.items.length ? 'line-clamp-2' : 'line-clamp-5'
            }`}
          >
            {parsed.intro}
          </p>
        )}

        {shownItems.length > 0 && (
          <>
            <p className="m-0 mt-4 text-sm font-bold text-text-main">
              Trong buổi tư vấn, mình sẽ giúp bạn
            </p>
            <ul className="m-0 mt-2 list-none space-y-2 p-0">
              {shownItems.map((item, index) => (
                <li key={`${index}-${item}`} className="flex min-w-0 items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="line-clamp-1 break-all text-sm leading-5 text-text-secondary">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={onShowMore}
                disabled={preview}
                className="mt-1 inline-flex min-h-11 w-fit cursor-pointer items-center disabled:cursor-default rounded-lg border-0 bg-transparent p-0 text-sm font-semibold text-sky-700 underline-offset-2 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Xem thêm {hiddenCount} nội dung
              </button>
            )}
          </>
        )}

        {outcome && (
          <p className="m-0 mt-4 line-clamp-2 rounded-xl bg-success-soft px-3 py-2.5 text-sm leading-5 text-emerald-900 lg:mt-auto">
            <b>Sau buổi:</b> {outcome}
          </p>
        )}
      </div>

      {/* Right: pricing panel */}
      <div
        className={`flex min-w-0 flex-col border-0 border-t border-solid border-border-color bg-surface-subtle p-5 ${
          isProfile ? 'lg:min-h-0 lg:border-l lg:border-t-0 lg:p-6' : ''
        }`}
      >
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-muted">Chi phí</p>
        <p
          className={`m-0 mt-1 truncate text-2xl font-extrabold ${
            service.isFree ? 'text-emerald-700' : 'text-text-main'
          }`}
        >
          {formatServicePrice(service)}
        </p>
        <dl className="m-0 mt-3 divide-y divide-border-color">
          <PanelRow
            label="Thời lượng"
            value={service.durationMinutes ? `${service.durationMinutes} phút` : '—'}
          />
          <PanelRow label="Hình thức" value="Tư vấn 1:1" />
          <PanelRow
            label="Chat sau buổi"
            value={
              service.maintainPostSessionChat === undefined
                ? '—'
                : service.maintainPostSessionChat
                  ? 'Có'
                  : 'Không'
            }
          />
        </dl>
        <div className="mt-4 flex flex-col gap-1 lg:mt-auto">
          <button
            type="button"
            onClick={onBook}
            disabled={preview}
            className="inline-flex h-11 w-full cursor-pointer items-center disabled:cursor-default justify-center rounded-xl border-0 bg-sky-700 px-4 text-sm font-bold text-white shadow-xs outline-none transition hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Đặt lịch tư vấn
          </button>
          <button
            type="button"
            onClick={onViewSchedule}
            disabled={preview}
            className="inline-flex min-h-11 w-full cursor-pointer items-center disabled:cursor-default justify-center rounded-xl border-0 bg-transparent text-sm font-semibold text-sky-700 underline-offset-2 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Xem lịch trống của mentor
          </button>
        </div>
      </div>
    </article>
  );
}
