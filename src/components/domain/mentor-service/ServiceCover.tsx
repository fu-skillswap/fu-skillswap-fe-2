/**
 * @file ServiceCover.tsx
 * @description 16:9 cover of a mentor service. Falls back to the shared default cover (brand
 * tint, soft wave, briefcase badge, service title) so every mentor without an image looks the same.
 */

import { BriefcaseBusiness } from 'lucide-react';

interface ServiceCoverProps {
  title: string;
  coverImageUrl?: string | null;
  className?: string;
}

export function DefaultServiceCover({
  title,
  className = '',
}: Omit<ServiceCoverProps, 'coverImageUrl'>) {
  return (
    <div
      className={`relative flex aspect-video w-full flex-col justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary-light px-5 ${className}`.trim()}
      role="img"
      aria-label={title || 'Ảnh bìa mặc định'}
    >
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full"
        viewBox="0 0 320 90"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 46 C 60 18, 120 70, 190 44 S 290 22, 320 40 L 320 90 L 0 90 Z"
          className="fill-primary/10"
        />
        <path
          d="M0 66 C 70 44, 140 86, 210 62 S 300 50, 320 60 L 320 90 L 0 90 Z"
          className="fill-primary/15"
        />
      </svg>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-blue">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="relative line-clamp-2 break-words text-base font-bold leading-snug text-text-main">
        {title || 'Tên dịch vụ'}
      </span>
    </div>
  );
}

export function ServiceCover({ title, coverImageUrl, className = '' }: ServiceCoverProps) {
  if (!coverImageUrl) return <DefaultServiceCover title={title} className={className} />;
  return (
    <img
      src={coverImageUrl}
      alt={title}
      className={`aspect-video w-full rounded-2xl bg-surface-subtle object-cover ${className}`.trim()}
      loading="lazy"
    />
  );
}
