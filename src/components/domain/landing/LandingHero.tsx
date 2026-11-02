/**
 * @file LandingHero.tsx
 * @description Landing hero: headline, mentor search (plain GET form to the find-mentor page),
 * popular searches and the product moment (real screenshots + KooKoo).
 */

import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import {
  Mascot,
  SITE_CONTAINER,
  SpeechBubble,
} from '@/components/domain/landing/LandingPrimitives';
import { HERO_QUICK_SEARCHES } from '@/components/domain/landing/landing.constants';
import { findMentorHref } from '@/constants/publicSite';

function HeroSwoosh() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 900"
      className="pointer-events-none absolute top-[-120px] right-[-420px] h-[960px] w-[960px] lg:right-[-200px]"
    >
      <path
        d="M640 120 C 420 40, 200 160, 300 330 C 380 470, 640 420, 640 600 C 640 760, 420 820, 260 760"
        fill="none"
        className="stroke-site-chip"
        strokeWidth="170"
        strokeLinecap="round"
      />
      <path
        d="M640 120 C 420 40, 200 160, 300 330 C 380 470, 640 420, 640 600 C 640 760, 420 820, 260 760"
        fill="none"
        className="stroke-site-sky"
        strokeWidth="2"
        strokeDasharray="6 14"
      />
    </svg>
  );
}

function HeroSearch({ locale }: { locale: string }) {
  return (
    <form
      role="search"
      action={findMentorHref(locale)}
      method="get"
      className="flex w-full max-w-[600px] items-center gap-2 rounded-full border-[1.5px] border-solid border-site-chip-border bg-white py-2 pr-2 pl-4 shadow-[0_16px_40px_rgba(37,99,235,0.14)] sm:pl-[22px]"
    >
      <Search
        className="h-[22px] w-[22px] shrink-0 text-site-muted"
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <label htmlFor="landing-mentor-search" className="sr-only">
        Bạn cần mentor cho môn hay việc gì?
      </label>
      <input
        id="landing-mentor-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Nhập mã môn, OJT, đồ án EXE…"
        className="h-12 min-w-0 flex-1 border-0 bg-transparent font-site-body text-base text-site-body outline-none placeholder:text-site-muted sm:text-[17px]"
      />
      <button
        type="submit"
        className="min-h-[52px] shrink-0 cursor-pointer rounded-full border-0 bg-site-blue px-5 font-site-ui text-base font-bold whitespace-nowrap text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)] transition-colors hover:bg-site-blue-hover sm:px-7"
      >
        Tìm mentor
      </button>
    </form>
  );
}

function HeroProductMoment() {
  return (
    <div className="relative flex min-w-0 flex-col gap-4 lg:block lg:min-h-[560px]">
      <figure className="m-0 overflow-hidden rounded-[20px] border border-solid border-site-line-strong bg-white shadow-site-lift lg:absolute lg:top-0 lg:right-0 lg:w-[92%]">
        <div aria-hidden="true" className="flex h-[30px] items-center gap-1.5 bg-site-tint px-3.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[#c3d4e6]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#c3d4e6]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#c3d4e6]" />
        </div>
        <Image
          src="/images/landing/service-card.png"
          alt="Thẻ dịch vụ Hỗ trợ Review CV OJT: miễn phí, 60 phút, tư vấn 1:1, nút Đặt lịch tư vấn"
          width={1057}
          height={425}
          unoptimized
          priority
          className="block h-auto w-full"
        />
      </figure>

      <figure className="m-0 overflow-hidden rounded-[18px] border-4 border-solid border-white bg-white shadow-[0_24px_60px_rgba(30,58,138,0.22)] lg:absolute lg:top-[214px] lg:left-0 lg:z-[1] lg:w-[58%]">
        <Image
          src="/images/landing/booking-slots.png"
          alt="Bảng chọn giờ trống trong tuần, khung 21:00–22:00 thứ Sáu đang được chọn, kèm tóm tắt lịch đặt"
          width={1054}
          height={783}
          unoptimized
          loading="lazy"
          className="block h-auto w-full"
        />
      </figure>

      <div className="flex items-end justify-end gap-1 lg:absolute lg:right-0 lg:bottom-[-10px] lg:z-[2]">
        <SpeechBubble tail="right" className="mb-14 max-w-[190px] lg:mb-[120px]">
          Giờ trống mentor mở sẵn, bấm là đặt được liền nè!
        </SpeechBubble>
        <Mascot
          width={170}
          eager
          className="site-bob w-[110px] drop-shadow-[0_14px_20px_rgba(30,58,138,0.25)] lg:w-[170px]"
        />
      </div>
    </div>
  );
}

export function LandingHero({ locale }: { locale: string }) {
  return (
    <section id="top" className="relative overflow-hidden bg-white">
      <HeroSwoosh />
      <div
        className={`${SITE_CONTAINER} relative grid items-center gap-12 pt-10 pb-16 sm:pt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:pb-[104px]`}
      >
        <div className="flex min-w-0 flex-col items-start gap-6">
          <p className="m-0 inline-flex items-center gap-2 rounded-full bg-site-chip px-3.5 py-1.5 font-site-ui text-sm font-semibold text-site-navy">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-site-blue" />
            Mentor 1:1 cho sinh viên FPTU HCM
          </p>
          <h1 className="m-0 font-site-display text-[clamp(44px,6vw,80px)] leading-[0.98] font-black tracking-[-0.015em] text-site-ink uppercase">
            Môn này khó?
            <br />
            <span className="text-site-blue">Có người vừa qua rồi.</span>
          </h1>
          <p className="m-0 max-w-[540px] font-site-body text-lg leading-7 text-site-muted">
            Đặt lịch 1:1 với sinh viên FPT đã qua đúng môn, đã trải nghiệm, để nghe chia sẻ kinh
            nghiệm thực tế. Giá cả, thời gian đều minh bạch rõ ràng từ đầu, bạn không cần phải inbox
            hỏi thêm.
          </p>

          <HeroSearch locale={locale} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-site-body text-sm text-site-muted">
              Đang được tìm nhiều:
            </span>
            {HERO_QUICK_SEARCHES.map(({ label, query }) => (
              <Link
                key={label}
                href={findMentorHref(locale, query ?? undefined)}
                className="site-focus inline-flex min-h-11 items-center rounded-full border border-solid border-site-chip-border bg-white px-3.5 font-site-ui text-sm font-semibold text-site-navy no-underline transition-colors hover:border-site-blue hover:text-site-blue"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <HeroProductMoment />
      </div>
    </section>
  );
}
