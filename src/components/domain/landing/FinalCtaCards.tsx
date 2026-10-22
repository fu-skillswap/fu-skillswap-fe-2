/**
 * @file FinalCtaCards.tsx
 * @description Two closing CTA cards (#lam-mentor): book a first session / become a mentor.
 */

import Link from 'next/link';
import { Highlight, Mascot, SITE_CONTAINER } from '@/components/domain/landing/LandingPrimitives';
import { findMentorHref, publicHref } from '@/constants/publicSite';

const CARD =
  'relative flex min-h-[300px] min-w-0 flex-col items-start gap-[18px] overflow-hidden rounded-[32px] px-8 pt-8 sm:px-11 sm:pt-11';
const CARD_TITLE =
  'relative m-0 font-site-display text-[28px] leading-[1.05] font-black uppercase sm:text-[34px]';
const CARD_PILL =
  'relative inline-flex min-h-14 items-center rounded-full px-[30px] font-site-ui text-[17px] font-bold whitespace-nowrap no-underline transition-colors';

export function FinalCtaCards({ locale }: { locale: string }) {
  const registrationHref = publicHref(locale, 'mentorRegistration') ?? findMentorHref(locale);

  return (
    <section id="lam-mentor" className="bg-white">
      <div className={`${SITE_CONTAINER} grid gap-5 py-20 sm:py-24 min-[900px]:grid-cols-2`}>
        <div className={`${CARD} site-on-blue bg-site-blue pb-40 text-white xl:pb-11`}>
          <svg
            aria-hidden="true"
            viewBox="0 0 300 300"
            className="pointer-events-none absolute top-[-70px] right-[-60px] h-[280px] w-[280px]"
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
          <h2 className={`${CARD_TITLE} max-w-[360px]`}>Sắp thi rồi? Đặt buổi đầu ngay hôm nay.</h2>
          <p className="relative m-0 max-w-[330px] font-site-body text-base leading-6 text-site-on-blue">
            Đăng nhập bằng Gmail, chọn mentor, chọn giờ. Xong.
          </p>
          <Link
            href={findMentorHref(locale)}
            className={`${CARD_PILL} bg-white text-site-ink hover:bg-site-chip`}
          >
            Tìm mentor ngay
          </Link>
          <Mascot
            width={170}
            className="absolute right-6 bottom-[-36px] w-[130px] rotate-6 drop-shadow-[0_12px_18px_rgba(0,28,100,0.3)] xl:w-[170px]"
          />
        </div>

        <div className={`${CARD} bg-site-chip pb-36 text-site-ink sm:pb-11`}>
          <span className="relative rounded-full bg-site-navy px-3 py-1.5 font-site-ui text-sm font-bold text-white">
            0% hoa hồng năm học này
          </span>
          <h2 className={`${CARD_TITLE} max-w-[380px]`}>
            Bạn qua môn đó rồi? <Highlight>Chia sẻ lại cho bạn khác.</Highlight>
          </h2>
          <p className="relative m-0 max-w-[330px] font-site-body text-base leading-6 text-site-body">
            Tự đặt giá, tự mở giờ rảnh. Nhận lịch khi bạn sẵn sàng.
          </p>
          <Link
            href={registrationHref}
            className={`${CARD_PILL} bg-site-navy text-white hover:bg-site-ink`}
          >
            Đăng ký làm mentor
          </Link>
          <Mascot
            variant="peek"
            width={150}
            className="absolute right-5 bottom-[-6px] w-[120px] -scale-x-100 sm:w-[150px]"
          />
        </div>
      </div>
    </section>
  );
}
