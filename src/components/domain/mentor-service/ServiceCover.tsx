/**
 * @file ServiceCover.tsx
 * @description 16:9 cover of a mentor service. Falls back to the shared default cover (brand tint,
 * two soft waves and a briefcase badge) so every mentor without an image looks the same.
 * The default cover is decorative: the service title is always shown next to it.
 */

import { BriefcaseBusiness } from 'lucide-react';

interface ServiceCoverProps {
  title: string;
  coverImageUrl?: string | null;
  className?: string;
}

/** Wave colors of the default cover (light steps of the brand blue). */
const WAVE_BACK = '#cfe9fd';
const WAVE_FRONT = '#a8d8fc';

export function DefaultServiceCover({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-primary-light ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] w-full"
        viewBox="0 0 320 80"
        preserveAspectRatio="none"
      >
        <path
          d="M0 34 C 60 8, 125 58, 195 32 S 290 12, 320 28 L 320 80 L 0 80 Z"
          fill={WAVE_BACK}
        />
        <path
          d="M0 56 C 70 34, 140 76, 210 52 S 300 40, 320 50 L 320 80 L 0 80 Z"
          fill={WAVE_FRONT}
        />
      </svg>
      <span className="relative flex h-16 w-16 -translate-y-6 items-center justify-center rounded-full bg-primary text-white shadow-blue">
        <BriefcaseBusiness className="h-[30px] w-[30px]" />
      </span>
    </div>
  );
}

export function ServiceCover({ title, coverImageUrl, className = '' }: ServiceCoverProps) {
  if (!coverImageUrl) return <DefaultServiceCover className={className} />;
  return (
    <img
      src={coverImageUrl}
      alt={title}
      className={`aspect-video w-full rounded-2xl bg-surface-subtle object-cover object-center ${className}`.trim()}
      loading="lazy"
    />
  );
}
