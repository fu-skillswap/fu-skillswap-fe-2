/**
 * @file MenteeCtaBanner.tsx
 * @description Full-width blue "book your first session" banner after the mentor section.
 */

import Link from 'next/link';
import { Mascot, SITE_CONTAINER } from '@/components/domain/landing/LandingPrimitives';
import { findMentorHref } from '@/constants/publicSite';

export function MenteeCtaBanner({ locale }: { locale: string }) {
  return (
    <section className="bg-white">
      <div className={`${SITE_CONTAINER} pb-20 sm:pb-24`}>
        <div className="site-on-blue relative flex min-h-[220px] flex-col items-start gap-3.5 overflow-hidden rounded-[32px] bg-site-blue px-7 py-10 text-white sm:px-12 sm:py-11">
          <svg
            aria-hidden="true"
            viewBox="0 0 300 300"
            className="pointer-events-none absolute top-[-110px] right-[-90px] h-[280px] w-[280px] min-[900px]:right-[160px]"
          >
            <circle
              cx="150"
              cy="150"
              r="120"
              fill="none"
              className="stroke-site-cyan"
              strokeWidth="40"
              opacity=".45"
            />
          </svg>
          <h2 className="relative m-0 max-w-[560px] font-site-display text-[28px] leading-[1.05] font-black uppercase sm:text-[34px]">
            Sắp thi rồi? Đặt buổi đầu ngay hôm nay.
          </h2>
          <p className="relative m-0 font-site-body text-base leading-6 text-site-on-blue">
            Đăng nhập bằng Gmail, chọn mentor, chọn giờ. Xong.
          </p>
          <Link
            href={findMentorHref(locale)}
            className="relative inline-flex min-h-14 items-center rounded-full bg-white px-[30px] font-site-ui text-[17px] font-bold whitespace-nowrap text-site-ink no-underline transition-colors hover:bg-site-chip"
          >
            Tìm mentor ngay
          </Link>
          <Mascot
            width={180}
            className="absolute right-12 bottom-[-40px] hidden rotate-6 drop-shadow-[0_12px_18px_rgba(0,28,100,0.3)] min-[900px]:block"
          />
        </div>
      </div>
    </section>
  );
}
