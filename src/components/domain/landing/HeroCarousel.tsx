/**
 * @file HeroCarousel.tsx
 * @description Carousel hero nhẹ, tự chạy và hỗ trợ điều khiển bàn phím/touch.
 */

'use client';

import { ChevronLeft, ChevronRight, Search, Star } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const slides = [
  { eyebrow: 'Học theo mục tiêu', title: 'Kết nối với người có kinh nghiệm phù hợp.' },
  { eyebrow: 'Linh hoạt thời gian', title: 'Chọn hình thức học phù hợp với nhịp sống của bạn.' },
  { eyebrow: 'Rõ ràng trước khi đặt', title: 'Xem thời lượng và mức giá của từng dịch vụ.' },
] as const;

export function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const move = (direction: -1 | 1) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <div
      className="landing-load-reveal landing-load-delay-3 relative mx-auto mt-8 min-w-0 w-full max-w-[780px] xl:mt-0 xl:ml-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => {
        touchStartRef.current = event.touches[0]?.clientX;
      }}
      onTouchEnd={(event) => {
        const start = touchStartRef.current;
        const end = event.changedTouches[0]?.clientX;
        if (start === undefined || end === undefined || Math.abs(start - end) < 45) return;
        move(start > end ? 1 : -1);
      }}
      aria-roledescription="carousel"
      aria-label="Giới thiệu SkillSwap"
    >
      <div className="relative aspect-[1.38/1] overflow-hidden rounded-[24px] border border-[rgba(74,157,234,0.16)] bg-[#e9f5ff] sm:rounded-[28px]">
        {slides.map((slide, index) => (
          <article
            key={slide.eyebrow}
            aria-hidden={index !== activeSlide}
            className={`absolute inset-0 overflow-hidden bg-[linear-gradient(120deg,#f5fbff_0%,#dceeff_100%)] transition-[opacity,transform] duration-500 ease-out ${index === activeSlide ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'}`}
          >
            <span className="sr-only">
              {slide.eyebrow}: {slide.title}
            </span>
            <Image
              src="/images/landing/hero-learner-v3.png"
              alt="Người học đang sử dụng máy tính xách tay"
              width={500}
              height={595}
              priority={index === 0}
              className="absolute inset-y-0 left-0 h-full w-[60%] object-cover object-top"
            />

            <div className="absolute top-[7%] right-[4.5%] z-10 w-[55%] overflow-hidden rounded-2xl border border-[#e7eff8] bg-white/96 shadow-[0_12px_35px_rgba(23,81,140,0.10)] sm:rounded-[20px]">
              <div className="flex items-center justify-between border-b border-[#edf3f9] px-3 py-2.5 sm:px-4 sm:py-3">
                <Image
                  src="/images/SkillSwapLogo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                />
                <span className="h-7 w-7 overflow-hidden rounded-full bg-primary-light sm:h-8 sm:w-8">
                  <Image
                    src="/images/landing/hero-learner-v3.png"
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full object-cover object-top"
                  />
                </span>
              </div>
              <div className="mx-3 mt-2.5 flex h-8 items-center gap-2 rounded-lg border border-[#dce8f4] px-2.5 text-[9px] text-text-muted sm:mx-4 sm:mt-3 sm:h-9 sm:text-[11px]">
                <Search className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} aria-hidden="true" />
                Tìm mentor theo kỹ năng...
              </div>
              <div className="m-3 rounded-xl border border-[#e7eff8] bg-white p-3 sm:m-4 sm:rounded-2xl sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-light sm:h-12 sm:w-12">
                    <Image
                      src="/images/landing/hero-learner-v3.png"
                      alt="Mentor SkillSwap"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover object-top"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-[#123568] sm:text-sm">
                      Mentor SkillSwap
                    </p>
                    <p className="truncate text-[8px] text-text-muted sm:text-[10px]">
                      Kinh nghiệm thực tế
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[8px] font-semibold text-primary sm:text-[10px]">
                      <Star className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
                      Đánh giá từ cộng đồng
                    </p>
                  </div>
                </div>
                <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                  {['Kỹ năng', 'Mục tiêu', 'Lộ trình'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-primary-light px-2 py-1 text-[9px] font-medium text-primary"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid h-8 place-items-center rounded-lg bg-primary text-[9px] font-bold text-white sm:h-9 sm:text-[11px]">
                  Đặt lịch trao đổi
                </div>
              </div>
            </div>

            <Image
              src="/images/Koko.png"
              alt="KouKou, linh vật của SkillSwap"
              width={1500}
              height={1500}
              priority={index === 0}
              className="absolute right-[1.5%] -bottom-1 z-20 h-[clamp(125px,14vw,220px)] w-auto object-contain"
            />
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => move(-1)}
        aria-label="Slide trước"
        className="absolute top-1/2 left-2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#e4ecf5] bg-white text-[#16366a] shadow-sm outline-none transition hover:-translate-y-[52%] hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary sm:-left-4 xl:-left-[27px] xl:h-14 xl:w-14"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Slide tiếp theo"
        className="absolute top-1/2 right-2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[#e4ecf5] bg-white text-[#16366a] shadow-sm outline-none transition hover:-translate-y-[52%] hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary sm:-right-4 xl:-right-[27px] xl:h-14 xl:w-14"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="mt-3.5 flex justify-center gap-2" aria-label="Chọn slide">
        {slides.map((slide, index) => (
          <button
            key={slide.eyebrow}
            type="button"
            aria-label={`Hiển thị slide ${index + 1}`}
            aria-current={activeSlide === index ? 'true' : undefined}
            onClick={() => setActiveSlide(index)}
            className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-7 bg-primary' : 'w-2 bg-slate-300 hover:bg-primary-border'}`}
          />
        ))}
      </div>
    </div>
  );
}
