/**
 * @file HowItWorksSection.tsx
 * @description "Cách hoạt động": three zigzag steps (KooKoo match → pick a slot → track the session).
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Highlight,
  Mascot,
  SITE_CONTAINER,
  SITE_HEADLINE,
  SITE_PILL_PRIMARY,
  SpeechBubble,
} from '@/components/domain/landing/LandingPrimitives';
import { HOW_IT_WORKS_SAMPLE_MATCHES } from '@/components/domain/landing/landing.constants';
import { findMentorHref } from '@/constants/publicSite';

const FRAME = 'm-0 rounded-3xl bg-white p-4 shadow-site-soft';

function StepText({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <span
        aria-hidden="true"
        className="font-site-display text-[64px] leading-none font-black text-site-blue"
      >
        {number}
      </span>
      <h3 className="m-0 font-site-ui text-[22px] leading-[1.25] font-bold text-site-ink sm:text-[26px]">
        <span className="sr-only">Bước {number}: </span>
        {title}
      </h3>
      <p className="m-0 max-w-[420px] font-site-body text-[17px] leading-[26px] text-site-muted">
        {children}
      </p>
    </div>
  );
}

/** Faithful mini version of the mentor card with KooKoo's "why this fits" box (illustration). */
function SampleMatchPanel() {
  return (
    <div className="relative min-w-0 pt-[84px] sm:pt-[100px]">
      <div className="absolute top-0 right-2 z-[1] flex items-start gap-2 sm:right-6 sm:gap-2.5">
        <SpeechBubble className="mt-3.5 max-w-[200px] px-3 py-2.5 text-[13px] leading-[18px] sm:max-w-[240px] sm:text-sm">
          Mình là KooKoo AI, mình chọn mentor theo mục tiêu của bạn.
        </SpeechBubble>
        <Mascot variant="peek" width={124} className="w-24 sm:w-[124px]" />
      </div>

      <figure className="relative z-[2] m-0 flex flex-col gap-3.5 rounded-3xl bg-white p-4 shadow-site-soft sm:p-5">
        <figcaption className="flex items-center gap-2 font-site-body text-[13px] text-site-muted">
          <Mascot variant="icon" width={28} className="-m-1" />
          KooKoo AI sắp xếp theo mục tiêu học của bạn, cập nhật mỗi ngày
        </figcaption>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          {HOW_IT_WORKS_SAMPLE_MATCHES.map((mentor) => (
            <div
              key={mentor.name}
              className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-solid border-site-line p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-site-ui text-[17px] font-bold text-white ${
                    mentor.tone === 'blue' ? 'bg-site-blue' : 'bg-site-navy'
                  }`}
                >
                  {mentor.initial}
                </span>
                <span className="min-w-0">
                  <b className="block font-site-ui text-base font-semibold text-[#111827]">
                    {mentor.name}
                  </b>
                  <span className="font-site-body text-[13px] text-site-muted">
                    {mentor.subtitle}
                  </span>
                </span>
              </div>
              <p className="m-0 rounded-xl border border-solid border-site-bubble-border bg-site-bubble px-3 py-2.5 font-site-body text-[13px] leading-[19px] text-site-body">
                <b className="font-site-ui">Vì sao phù hợp:</b> {mentor.reason}
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {mentor.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-[#f3f6fa] px-2.5 py-1 font-site-body text-xs text-site-body"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
              <span
                aria-hidden="true"
                className="inline-flex min-h-10 items-center self-end rounded-xl bg-site-blue px-4 font-site-ui text-sm font-semibold whitespace-nowrap text-white"
              >
                Xem lịch trống
              </span>
            </div>
          ))}
        </div>
      </figure>
    </div>
  );
}

export function HowItWorksSection({ locale }: { locale: string }) {
  return (
    <section id="cach-hoat-dong" className="bg-site-tint">
      <div className={`${SITE_CONTAINER} flex flex-col gap-14 py-20 sm:gap-[72px] sm:py-24`}>
        <h2 className={`${SITE_HEADLINE} max-w-[720px]`}>
          Từ lúc bí đến lúc có <Highlight>người chia sẻ</Highlight>
        </h2>

        <ol className="m-0 flex list-none flex-col gap-16 p-0 sm:gap-[88px]">
          <li className="grid items-center gap-10 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] min-[900px]:gap-12">
            <StepText number={1} title="KooKoo AI gợi ý người hợp với bạn">
              Cho biết mục tiêu môn học, KooKoo AI xếp mentor theo kỹ năng và ngành, kèm lý do vì
              sao người đó hợp với bạn.
            </StepText>
            <SampleMatchPanel />
          </li>

          <li className="grid items-center gap-10 min-[900px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] min-[900px]:gap-12">
            <figure className={`${FRAME} order-2 min-w-0 min-[900px]:order-1`}>
              <Image
                src="/images/landing/booking-slots.png"
                alt="Lịch giờ trống theo tuần với khung 21:00–22:00 được chọn và tóm tắt lịch đặt"
                width={1054}
                height={783}
                unoptimized
                loading="lazy"
                className="block h-auto w-full rounded-xl"
              />
            </figure>
            <div className="order-1 min-[900px]:order-2">
              <StepText number={2} title="Chọn giờ mentor đã mở sẵn">
                Lịch rảnh hiện theo tuần. Bấm một khung giờ, xem tóm tắt dịch vụ, thời gian và chi
                phí rồi đặt.
              </StepText>
            </div>
          </li>

          <li className="grid items-center gap-10 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] min-[900px]:gap-12">
            <StepText number={3} title="Theo dõi đến lúc vào học">
              Biết buổi học đang ở bước nào, nhắn mentor khi cần. Mentor sẽ để sẵn link meeting cho
              bạn.
            </StepText>
            <div className="relative min-w-0">
              <figure className={FRAME}>
                <Image
                  src="/images/landing/my-booking.png"
                  alt="Thẻ lịch hẹn sắp diễn ra với các bước Gửi yêu cầu, Mentor đã nhận, Học 1:1, Đánh giá và nút vào Google Meet"
                  width={880}
                  height={351}
                  unoptimized
                  loading="lazy"
                  className="block h-auto w-full rounded-xl"
                />
              </figure>
              <Mascot
                width={120}
                className="absolute bottom-[-48px] left-[-64px] hidden -scale-x-100 rotate-6 drop-shadow-[0_10px_16px_rgba(30,58,138,0.2)] min-[900px]:block"
              />
            </div>
          </li>
        </ol>

        <Link
          href={findMentorHref(locale)}
          className={`site-focus self-center ${SITE_PILL_PRIMARY}`}
        >
          Tìm mentor cho bạn
        </Link>
      </div>
    </section>
  );
}
