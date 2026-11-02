/**
 * @file MobileStickyCta.tsx
 * @description Sticky "Tìm mentor" bar at the bottom of the landing page, below 900px only.
 * It is the page's last element, so at the end of the scroll it sits under the footer instead of
 * covering it.
 */

import Link from 'next/link';
import { Mascot } from '@/components/domain/landing/LandingPrimitives';
import { findMentorHref } from '@/constants/publicSite';

export function MobileStickyCta({ locale }: { locale: string }) {
  return (
    <div className="sticky bottom-0 z-30 flex h-[var(--site-mobile-bar-height)] items-center gap-2.5 bg-white px-4 shadow-[0_-8px_24px_rgba(0,28,100,0.12)] min-[900px]:hidden">
      <Mascot variant="icon" width={52} className="-mx-1.5" />
      <span className="flex-1 font-site-body text-sm leading-[19px] text-site-body">
        Có mentor mở lịch tuần này
      </span>
      <Link
        href={findMentorHref(locale)}
        className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-site-blue px-[22px] font-site-ui text-[15px] font-bold whitespace-nowrap text-white no-underline"
      >
        Tìm mentor
      </Link>
    </div>
  );
}
