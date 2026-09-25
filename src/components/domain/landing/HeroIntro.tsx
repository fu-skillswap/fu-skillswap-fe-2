/**
 * @file HeroIntro.tsx
 * @description Nội dung hero với hiệu ứng xuất hiện tuần tự sau khi client hydrate.
 */

'use client';

import { ArrowRight, CalendarDays, Tag, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';

const trustItems = [
  [Tag, 'Giá rõ ràng'],
  [CalendarDays, 'Lịch linh hoạt'],
  [UsersRound, 'Mentor thực tế'],
] as const;

export function HeroIntro({ locale }: { locale: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const revealClass = `landing-hero-intro-item ${isVisible ? 'landing-hero-intro-visible' : ''}`;
  const delay = (milliseconds: number) =>
    ({ '--landing-intro-delay': `${milliseconds}ms` }) as CSSProperties;

  return (
    <div className="min-w-0 max-w-[620px]">
      <p
        className={`${revealClass} mb-6 flex items-center gap-4 text-sm font-bold tracking-[0.14em] text-primary uppercase`}
        style={delay(100)}
      >
        <span className="h-0.5 w-10 rounded-full bg-primary" aria-hidden="true" />
        Học từ người đi trước
      </p>
      <h1
        className={`${revealClass} max-w-[620px] text-[clamp(2.15rem,10.8vw,3.5rem)] leading-[1.12] font-extrabold tracking-[-0.04em] text-[#12386e] xl:text-[clamp(3.25rem,4.2vw,4.25rem)]`}
        style={delay(220)}
      >
        <span className="block whitespace-nowrap">Học đúng người.</span>
        <span className="block whitespace-nowrap text-primary">Tiến nhanh hơn.</span>
      </h1>
      <p
        className={`${revealClass} mt-6 max-w-[560px] text-base leading-[1.6] text-[#5c718d] sm:mt-[30px] sm:text-[17px] lg:text-lg`}
        style={delay(340)}
      >
        Khám phá mentor phù hợp hoặc các khóa học ngắn
        <br className="hidden sm:block" /> để phát triển kỹ năng theo cách của bạn.
      </p>
      <div
        className={`${revealClass} mt-8 flex flex-col gap-3.5 sm:mt-9 sm:flex-row sm:gap-4.5`}
        style={delay(460)}
      >
        <Link
          href={`/${locale}/mentor-booking`}
          className="inline-flex h-14 min-w-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold whitespace-nowrap text-white shadow-blue transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-[60px] sm:flex-1 2xl:gap-3 2xl:px-6 2xl:text-base"
        >
          Tìm mentor phù hợp
          <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </Link>
        <a
          href="#courses"
          className="inline-flex h-14 min-w-0 items-center justify-center rounded-xl border border-primary bg-white px-4 text-sm font-bold whitespace-nowrap text-primary transition hover:-translate-y-px hover:bg-primary-light hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-[60px] sm:flex-1 2xl:px-5 2xl:text-base"
        >
          Khám phá khóa học
        </a>
      </div>
      <div
        className={`${revealClass} mt-8 grid max-w-[600px] grid-cols-3 items-start text-xs font-medium text-[#435b78] sm:mt-9 sm:text-sm`}
        style={delay(580)}
      >
        {trustItems.map(([Icon, label], index) => (
          <div
            key={label}
            className={`flex min-w-0 flex-col items-center gap-2 px-2 text-center sm:flex-row sm:gap-3 sm:text-left ${index > 0 ? 'border-l border-[#dde8f3]' : ''}`}
          >
            <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
