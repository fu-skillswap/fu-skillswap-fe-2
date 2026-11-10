/**
 * @file ServiceDescriptionDetail.tsx
 * @description Full (unclamped) service description: cover, intro, every session item and the
 * audience chips. Used by the mentor "Chi tiết dịch vụ" page and the mentee "Xem thêm" dialog.
 */

import { CheckCircle2 } from 'lucide-react';
import { ServiceCover } from './ServiceCover';
import type { ParsedServiceDescription } from './serviceDescription';

interface ServiceDescriptionDetailProps {
  title: string;
  coverImageUrl?: string | null;
  parsed: ParsedServiceDescription;
}

export function ServiceDescriptionDetail({
  title,
  coverImageUrl,
  parsed,
}: ServiceDescriptionDetailProps) {
  return (
    <div className="space-y-4">
      <div className="max-w-[640px]">
        <ServiceCover title={title} coverImageUrl={coverImageUrl} />
      </div>

      {parsed.intro && (
        <p className="m-0 whitespace-pre-line break-words text-sm leading-6 text-text-secondary">
          {parsed.intro}
        </p>
      )}

      {parsed.items.length > 0 && (
        <div>
          <p className="m-0 text-sm font-bold text-text-main">
            Trong buổi tư vấn, mình sẽ giúp bạn
          </p>
          <ul className="m-0 mt-2 list-none space-y-2 p-0">
            {parsed.items.map((item, index) => (
              <li key={`${index}-${item}`} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span className="break-words text-sm leading-5 text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {parsed.audience.length > 0 && (
        <div>
          <p className="m-0 text-xs font-semibold text-text-muted">Phù hợp cho</p>
          <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
            {parsed.audience.map((entry, index) => (
              <li
                key={`${index}-${entry}`}
                className="rounded-full border border-primary-border/60 bg-primary-light px-2.5 py-1 text-xs font-medium text-sky-800"
              >
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
