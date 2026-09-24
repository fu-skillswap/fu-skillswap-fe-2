/**
 * @file LandingSections.tsx
 * @description Các section nội dung tĩnh, không phụ thuộc API của landing page SkillSwap.
 */

import { BookOpen, CalendarDays, Play, ShieldCheck, UsersRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/domain/landing/Reveal';
import { SectionHeading } from '@/components/domain/landing/SectionHeading';

const benefits = [
  {
    title: 'Chọn mentor phù hợp',
    description: 'Kết nối với người có kinh nghiệm đúng với nhu cầu của bạn.',
    visual: 'from-sky-100 to-blue-50',
  },
  {
    title: 'Học 1:1 hoặc khóa học ngắn',
    description: 'Linh hoạt lựa chọn hình thức học phù hợp với thời gian và mục tiêu.',
    visual: 'from-blue-50 to-cyan-50',
  },
  {
    title: 'Đặt mục tiêu rõ ràng',
    description: 'Học có định hướng và áp dụng kiến thức vào thực tế.',
    visual: 'from-indigo-50 to-sky-100',
  },
] as const;

const learningSteps = [
  ['01', 'Chọn mục tiêu', 'Xác định kỹ năng bạn muốn học.'],
  ['02', 'Tìm mentor hoặc khóa học', 'Khám phá lựa chọn phù hợp.'],
  ['03', 'Đặt lịch hoặc mua khóa học', 'Chọn thời gian và hình thức học.'],
  ['04', 'Học và phát triển', 'Bắt đầu hành trình của bạn.'],
] as const;

const mentorSteps = [
  ['01', 'Tạo hồ sơ', 'Tạo tài khoản và hồ sơ cơ bản.'],
  ['02', 'Hoàn thiện thông tin', 'Giới thiệu kinh nghiệm và kỹ năng.'],
  ['03', 'Thiết lập học vụ và mức giá', 'Tạo lịch học và dịch vụ của bạn.'],
  ['04', 'Bắt đầu nhận booking', 'Kết nối với mentee phù hợp.'],
] as const;

function LearningVisual({ index }: { index: number }) {
  return (
    <div
      className="relative h-full min-h-44 overflow-hidden bg-[linear-gradient(135deg,#e8f3ff,#f8fbff)]"
      aria-hidden="true"
    >
      <div
        className={`absolute h-32 w-44 rounded-2xl border border-white bg-white/80 shadow-sm ${index === 0 ? 'top-7 left-7 -rotate-3' : index === 1 ? 'top-6 left-1/2 -translate-x-1/2 rotate-2' : 'top-8 right-7 rotate-3'}`}
      >
        <div className="m-4 h-2 w-20 rounded-full bg-primary/20" />
        <div className="mx-4 mt-3 h-2 w-28 rounded-full bg-slate-200" />
        <div className="mx-4 mt-3 h-2 w-16 rounded-full bg-slate-200" />
        <div className="absolute right-4 bottom-4 h-9 w-9 rounded-full bg-primary/15" />
      </div>
      <div
        className={`absolute h-28 w-28 rounded-full bg-gradient-to-br ${benefits[index].visual} ${index === 1 ? '-right-3 -bottom-5' : '-left-4 -bottom-6'}`}
      />
    </div>
  );
}

export function TrustStrip() {
  const values = [
    {
      icon: UsersRound,
      title: 'Mentor chất lượng',
      description: 'Học từ những người đi trước có kinh nghiệm thực tế',
    },
    {
      icon: BookOpen,
      title: 'Khóa học ngắn',
      description: 'Nâng cấp kỹ năng với các khóa học cô đọng, thực tiễn',
    },
    {
      icon: ShieldCheck,
      title: 'Giá hiển thị trước khi đặt',
      description: 'Minh bạch, rõ ràng, không phát sinh chi phí',
    },
    {
      icon: CalendarDays,
      title: 'Đặt lịch linh hoạt',
      description: 'Chủ động chọn thời gian phù hợp với bạn',
    },
  ] as const;

  return (
    <section
      aria-label="Giá trị SkillSwap"
      className="mx-auto w-[calc(100%_-_40px)] max-w-[1440px] md:w-[calc(100%_-_64px)] xl:w-[calc(100%_-_96px)]"
    >
      <div className="grid min-h-32 overflow-hidden rounded-[22px] border border-[#e3edf7] bg-white/82 shadow-[0_8px_28px_rgba(27,84,138,0.04)] sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, title, description }, index) => (
          <Reveal key={title} delay={index * 80} className="h-full">
            <div
              className={`flex h-full items-center gap-4 px-6 py-6 lg:px-7 ${index > 0 ? 'border-t border-[#e3edf7] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#ecf6ff] text-primary">
                <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <strong className="block text-sm font-extrabold text-[#123568]">{title}</strong>
                <span className="mt-1.5 block text-xs leading-5 text-[#5b6f89]">{description}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function MenteeBenefits() {
  return (
    <section id="mentee" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <SectionHeading
          eyebrow="Dành cho mentee"
          title="Học nhanh, đúng nhu cầu, chi phí hợp lý"
          description="SkillSwap giúp bạn tiếp cận tri thức từ những người có kinh nghiệm thực tế, theo cách linh hoạt và rõ ràng."
          centered
        />
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 100} className="h-full">
              <article className="h-full overflow-hidden rounded-2xl border border-[#dfe8f3] bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <LearningVisual index={index} />
                <div className="p-5">
                  <h3 className="text-base font-bold text-[#102a56]">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5b6f89]">{benefit.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedCourses() {
  return (
    <section id="courses" className="landing-section scroll-mt-24 bg-[#f8fbff]">
      <div className="landing-container">
        <SectionHeading
          title="Khóa học ngắn nổi bật"
          description="Nội dung nổi bật sẽ được hiển thị từ danh mục khóa học chính thức của SkillSwap."
        />
        <Reveal>
          <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-primary-border bg-white px-6 py-12 text-center">
            <div className="max-w-lg">
              <p className="text-lg font-bold text-[#102a56]">
                Danh mục khóa học đang được hoàn thiện
              </p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                SkillSwap sẽ cập nhật các khóa học có thông tin mentor, thời lượng và mức giá đã
                được xác nhận.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <SectionHeading title="Cách SkillSwap hoạt động" />
        <div className="relative grid gap-3 md:grid-cols-4 md:before:absolute md:before:top-6 md:before:right-[12%] md:before:left-[12%] md:before:h-px md:before:bg-primary-border/60">
          {learningSteps.map(([number, title, description], index) => (
            <Reveal key={number} delay={index * 90}>
              <article className="relative z-10 rounded-2xl bg-white p-4 md:text-center">
                <span className="inline-grid h-12 w-12 place-items-center rounded-full bg-primary text-sm font-extrabold text-white ring-8 ring-white">
                  {number}
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#102a56]">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VideoIntro() {
  return (
    <section className="landing-section bg-[#f7faff]">
      <div className="landing-container grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-primary-border/40 bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#d9ebff_55%,#bddbff_100%)]">
            <div className="absolute inset-0 grid place-items-center">
              <button
                type="button"
                disabled
                title="Video sẽ được cập nhật khi có nguồn chính thức"
                aria-label="Video giới thiệu đang được cập nhật"
                className="grid h-16 w-16 cursor-not-allowed place-items-center rounded-full border border-white bg-white/95 text-primary shadow-md"
              >
                <Play className="ml-1 h-6 w-6 fill-current" aria-hidden="true" />
              </button>
            </div>
            <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-xl bg-[#102a56]/85 px-4 py-3 text-xs font-semibold text-white">
              <span>Video giới thiệu</span>
              <span>Đang cập nhật</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <SectionHeading
            title="Xem SkillSwap hoạt động như thế nào"
            description="Khám phá cách SkillSwap giúp bạn kết nối với mentor, học kỹ năng mới và tiến gần hơn đến mục tiêu."
          />
          <span className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-xs font-bold text-white opacity-60">
            Video sắp ra mắt
          </span>
        </Reveal>
      </div>
    </section>
  );
}

export function MentorSection({ locale }: { locale: string }) {
  return (
    <section id="mentor" className="landing-section scroll-mt-24">
      <div className="landing-container grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            eyebrow="Dành cho mentor"
            title="Chia sẻ kiến thức và tạo thu nhập minh bạch"
            description="Tạo dịch vụ mentoring hoặc khóa học ngắn, thiết lập lịch học và mức giá của riêng bạn."
          />
          <Link
            href={`/${locale}/mentor-registration`}
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-xs transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Đăng ký làm mentor
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <div className="relative min-h-80 overflow-hidden rounded-2xl border border-primary-border/40 bg-[#eef6ff] p-6 sm:p-8">
            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-border-light pb-4">
                <span className="h-10 w-10 rounded-full bg-primary-light" />
                <div className="flex-1">
                  <div className="h-2 w-28 rounded bg-slate-200" />
                  <div className="mt-2 h-2 w-20 rounded bg-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Lịch học', 'Dịch vụ', 'Booking'].map((label) => (
                  <div key={label} className="rounded-xl bg-[#f7faff] p-3">
                    <span className="text-[10px] font-semibold text-text-muted">{label}</span>
                    <div className="mt-4 h-3 w-10 rounded bg-primary/20" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-20 rounded-xl bg-[linear-gradient(180deg,#f7faff,#edf5ff)]" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function MentorSteps() {
  return (
    <section className="pb-20 sm:pb-24">
      <div className="landing-container">
        <SectionHeading title="Cách đăng ký làm mentor" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {mentorSteps.map(([number, title, description], index) => (
            <Reveal key={number} delay={index * 90}>
              <article className="h-full rounded-2xl bg-[#f7faff] p-5">
                <span className="text-xl font-extrabold text-primary">{number}</span>
                <h3 className="mt-4 text-sm font-bold text-[#102a56]">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-text-muted">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TransparentPricing() {
  const options = [
    ['Dịch vụ mentoring', 'Thời lượng cụ thể', 'Giá do mentor công khai'],
    ['Khóa học ngắn', 'Nội dung rõ ràng', 'Chi phí hiển thị trước'],
    ['Lộ trình chuyên sâu', 'Theo từng dịch vụ', 'Quyết định trước khi thanh toán'],
  ] as const;
  return (
    <section id="pricing" className="landing-section scroll-mt-24 bg-[#f8fbff]">
      <div className="landing-container">
        <SectionHeading
          title="Giá rõ ràng trước khi bạn quyết định"
          description="Mỗi mentor hiển thị mức giá và thời lượng cụ thể cho từng dịch vụ."
          centered
        />
        <div className="grid gap-5 md:grid-cols-3">
          {options.map(([title, meta, value], index) => (
            <Reveal key={title} delay={index * 100}>
              <article className="h-full rounded-2xl border border-[#dfe8f3] bg-white p-6 text-center">
                <p className="text-[11px] font-bold tracking-[0.12em] text-primary uppercase">
                  {title}
                </p>
                <p className="mt-5 text-lg font-extrabold text-[#102a56]">{meta}</p>
                <p className="mt-2 text-sm text-text-muted">{value}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SocialProof() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <SectionHeading title="Người dùng nói gì về SkillSwap" />
        <div className="rounded-2xl border border-dashed border-primary-border bg-[#f8fbff] px-6 py-10 text-center text-sm text-text-muted">
          Các đánh giá đã xác minh từ cộng đồng sẽ được hiển thị tại đây.
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ locale }: { locale: string }) {
  return (
    <section className="px-5 pb-20 lg:px-7">
      <div className="relative mx-auto max-w-[1220px] overflow-hidden rounded-[22px] bg-[linear-gradient(110deg,#087ff5,#62b4ff)] px-6 py-10 text-white sm:px-10 lg:py-12">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl leading-tight font-extrabold sm:text-3xl">
            Bắt đầu hành trình học tập và chia sẻ cùng SkillSwap
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50">
            Kết nối với những người phù hợp và phát triển kỹ năng theo cách của bạn.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/mentor-booking`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-xs font-bold text-primary transition hover:-translate-y-px"
            >
              Khám phá mentor
            </Link>
            <Link
              href={`/${locale}/mentor-registration`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/70 px-5 text-xs font-bold text-white transition hover:-translate-y-px hover:bg-white/10"
            >
              Đăng ký làm mentor
            </Link>
          </div>
        </div>
        <Image
          src="/images/Koko.png"
          alt="KouKou"
          width={1500}
          height={1500}
          className="absolute right-6 -bottom-8 hidden h-[190px] w-auto object-contain lg:block"
        />
      </div>
    </section>
  );
}
