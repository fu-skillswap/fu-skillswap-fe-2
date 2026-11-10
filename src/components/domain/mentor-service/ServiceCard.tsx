/**
 * @file ServiceCard.tsx
 * @description Mentor service card shown on the mentor profile ("Dịch vụ & Lịch dạy") and, in its
 * `compact` variant, as the live preview inside the service editor.
 * The card height follows its content, but every text block is clamped (and the editor enforces
 * the text limits), so no card can grow past a fully filled one.
 */

import { Button } from '@/components/ui/Button';
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
  /** `profile`: 3-column card on desktop. `compact`: always vertical (editor preview). */
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
      <dt className="text-[13px] text-text-muted">{label}</dt>
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
      className={`overflow-hidden rounded-3xl border border-solid border-border-color bg-surface shadow-sm ${
        isProfile ? 'lg:grid lg:min-h-[215px] lg:grid-cols-[320px_minmax(0,1fr)_272px]' : ''
      }`}
      aria-label={service.title || 'Dịch vụ tư vấn'}
    >
      {/* Left: cover + audience */}
      <div
        className={`flex min-w-0 flex-col gap-3 p-3 ${isProfile ? 'lg:py-6 lg:pr-0 lg:pl-6' : ''}`}
      >
        <ServiceCover
          title={service.title}
          coverImageUrl={service.coverImageUrl}
          className={isProfile ? 'lg:w-[296px]' : ''}
        />
        {audience.length > 0 && (
          <div className="min-w-0 px-1">
            <p className="m-0 text-xs font-semibold text-text-muted">Phù hợp cho</p>
            <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
              {audience.map((entry, index) => (
                <li
                  key={`${index}-${entry}`}
                  className="max-w-full truncate rounded-full border border-primary-border/60 bg-primary-light px-2.5 py-1 text-xs font-medium text-blue-900"
                >
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Middle: title, intro, items, outcome */}
      <div className={`flex min-w-0 flex-col px-5 pb-5 ${isProfile ? 'lg:px-7 lg:py-6' : ''}`}>
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
                className="mt-1 inline-flex min-h-11 w-fit cursor-pointer items-center disabled:cursor-default rounded-lg border-0 bg-transparent p-0 text-sm font-semibold text-primary underline-offset-2 hover:text-primary-hover outline-none hover:underline focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Xem thêm {hiddenCount} nội dung
              </button>
            )}
          </>
        )}

        {outcome && (
          <div className="pt-4 lg:mt-auto">
            <p className="m-0 line-clamp-2 rounded-xl bg-primary-light px-3 py-2.5 text-sm leading-5 text-text-secondary">
              <b className="text-blue-900">Sau buổi:</b> {outcome}
            </p>
          </div>
        )}
      </div>

      {/* Right: pricing panel */}
      <div
        className={`flex min-w-0 flex-col border-0 border-t border-solid border-border-color bg-surface-subtle p-5 ${
          isProfile ? 'lg:min-h-0 lg:border-l lg:border-t-0 lg:p-6' : ''
        }`}
      >
        <p className="m-0 text-[13px] text-text-muted">Chi phí</p>
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
        <div className="mt-4 flex flex-col gap-1 lg:mt-5">
          {/* Same shared primary Button as "Lưu thay đổi"; the preview keeps its normal look. */}
          <Button
            type="button"
            className={`h-11 w-full ${preview ? 'disabled:cursor-default disabled:opacity-100!' : ''}`}
            onClick={onBook}
            disabled={preview}
          >
            Đặt lịch tư vấn
          </Button>
          <button
            type="button"
            onClick={onViewSchedule}
            disabled={preview}
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-sm font-semibold text-primary underline-offset-2 outline-none hover:text-primary-hover hover:underline focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-default"
          >
            Xem lịch trống của mentor
          </button>
        </div>
      </div>
    </article>
  );
}
