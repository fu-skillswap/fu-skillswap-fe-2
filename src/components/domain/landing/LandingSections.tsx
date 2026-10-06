/**
 * @file LandingSections.tsx
 * @description Các section nội dung tĩnh, không phụ thuộc API của landing page SkillSwap.
 */

import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChartNoAxesCombined,
  ChevronRight,
  Circle,
  CircleDollarSign,
  Clock,
  Clock3,
  FileText,
  Info,
  Megaphone,
  Monitor,
  MoreHorizontal,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Target,
  UserRoundCheck,
  UserRoundPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { DemoFrame } from '@/components/domain/landing/DemoFrame';
import { Reveal } from '@/components/domain/landing/Reveal';
import { SectionHeading } from '@/components/domain/landing/SectionHeading';
import { PLATFORM_FEE_NOTE } from '@/constants/pricing';

const benefits = [
  {
    title: 'Chọn mentor phù hợp',
    description: 'Tìm kiếm mentor theo kỹ năng, lĩnh vực và mức giá phù hợp với nhu cầu của bạn.',
    image: '/images/landing/mentee-1.png',
    destination: 'mentor-booking',
    requiresLogin: false,
  },
  {
    title: 'Học 1:1 hoặc khóa học ngắn',
    description: 'Linh hoạt lựa chọn hình thức học phù hợp với thời gian và mục tiêu.',
    image: '/images/landing/mentee-2.png',
    destination: 'courses',
    requiresLogin: false,
  },
  {
    title: 'Đặt mục tiêu rõ ràng',
    description: 'Xây dựng lộ trình học tập cá nhân hóa và theo dõi tiến độ dễ dàng.',
    image: '/images/landing/mentee-3.png',
    destination: 'dashboard',
    requiresLogin: true,
  },
] as const;

const mentorBenefits = [
  {
    title: 'Tạo hồ sơ mentor',
    description: 'Giới thiệu kinh nghiệm, kỹ năng và lĩnh vực bạn có thể đồng hành cùng mentee.',
  },
  {
    title: 'Thiết lập dịch vụ và mức giá',
    description: 'Tự quyết định mức giá và thời lượng cho từng dịch vụ của bạn.',
  },
  {
    title: 'Nhận booking và phát triển',
    description: 'Quản lý lịch học, theo dõi booking và xây dựng hành trình học tập chuyên nghiệp.',
  },
] as const;

const learningSteps = [
  ['01', 'Chọn mục tiêu', 'Xác định kỹ năng và lĩnh vực bạn muốn học.'],
  ['02', 'Tìm mentor hoặc khóa học', 'Khám phá mentor và khóa học phù hợp với nhu cầu của bạn.'],
  ['03', 'Đặt lịch hoặc mua khóa học', 'Chọn thời gian, hình thức học và hoàn tất đăng ký.'],
  ['04', 'Học và phát triển', 'Bắt đầu hành trình và theo dõi tiến trình học tập của bạn.'],
] as const;

const mentorSteps = [
  {
    number: '01',
    title: 'Tạo hồ sơ',
    description: 'Tạo tài khoản và hồ sơ cơ bản.',
    icon: UserRoundPlus,
  },
  {
    number: '02',
    title: 'Hoàn thiện thông tin',
    description: 'Giới thiệu kinh nghiệm và kỹ năng.',
    icon: UserRoundCheck,
  },
  {
    number: '03',
    title: 'Thiết lập học vụ và mức giá',
    description: 'Tạo lịch học và dịch vụ của bạn.',
    icon: SlidersHorizontal,
  },
  {
    number: '04',
    title: 'Bắt đầu nhận booking',
    description: 'Kết nối với mentee phù hợp.',
    icon: CalendarCheck2,
  },
] as const;

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
      description: 'Mỗi mentor tự đặt giá, bạn xem được trước khi đặt lịch',
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
      className="mx-auto w-[calc(100%_-_40px)] max-w-[1480px] md:w-[calc(100%_-_64px)] xl:w-[calc(100%_-_96px)]"
    >
      <div className="grid min-h-32 overflow-hidden rounded-[24px] border border-[#e0ebf5] bg-white/90 shadow-[0_10px_34px_rgba(27,84,138,0.05)] sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, title, description }, index) => (
          <Reveal key={title} delay={index * 80} className="h-full">
            <div
              className={`group flex h-full cursor-default items-center gap-4 px-6 py-6 transition-colors duration-200 hover:bg-[#f4faff] lg:px-7 ${index > 0 ? 'border-t border-[#e0ebf5] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#eff8ff] text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-white group-hover:shadow-[0_8px_20px_rgba(17,156,247,0.14)]">
                <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <strong className="block text-sm font-extrabold text-[#123568] transition-colors duration-200 group-hover:text-primary">
                  {title}
                </strong>
                <span className="mt-1.5 block text-xs leading-5 text-[#5b6f89]">{description}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-white px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[980px] text-center">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase sm:text-[13px]">
            Về SkillSwap
          </p>
          <h2 className="mt-3 text-[clamp(1.875rem,4vw,2.75rem)] leading-tight font-extrabold tracking-[-0.03em] text-[#12386e]">
            Kết nối người muốn học với người sẵn sàng chia sẻ
          </h2>
          {/* TODO: Thay bằng nội dung sứ mệnh chính thức của SkillSwap khi được cung cấp. */}
          <p className="mx-auto mt-4 max-w-[760px] text-[15px] leading-7 text-[#5c718b] sm:text-[17px]">
            SkillSwap giúp mentee tìm mentor có kinh nghiệm thực tế và lựa chọn cách học phù hợp.
            Mentor có thể chia sẻ kiến thức, tự thiết lập dịch vụ và đồng hành cùng người học trong
            quá trình phát triển kỹ năng.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function MenteeBenefits({ locale }: { locale: string }) {
  return (
    <section
      id="mentee"
      className="scroll-mt-24 bg-[radial-gradient(circle_at_68%_28%,rgba(75,179,255,0.15),transparent_34%),radial-gradient(circle_at_10%_78%,rgba(81,178,255,0.09),transparent_28%),linear-gradient(180deg,#f7fcff_0%,#eef8ff_52%,#f8fcff_100%)] py-12 sm:py-14 lg:py-9"
    >
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-5 md:px-8">
        <Reveal>
          <div className="mx-auto max-w-[1080px] text-center">
            <p className="m-0 text-xs font-bold tracking-[0.12em] text-primary uppercase sm:text-[13px] sm:tracking-[0.14em]">
              Dành cho mentee
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,8vw,2.125rem)] leading-[1.17] font-bold tracking-[-0.02em] text-[#123568] sm:text-[clamp(2rem,2.5vw,2.25rem)] sm:leading-[1.12] sm:tracking-[-0.025em]">
              Học nhanh, đúng nhu cầu, tự chọn mức chi phí phù hợp
            </h2>
            <p className="mx-auto mt-3 max-w-[760px] text-[15px] leading-[1.55] text-text-muted sm:text-base">
              SkillSwap giúp bạn tiếp cận tri thức từ những người có kinh nghiệm thực tế,
              <br className="hidden sm:block" /> theo cách linh hoạt và rõ ràng.
            </p>
          </div>
        </Reveal>

        <div className="mt-7 grid items-stretch gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2 lg:mt-6 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 90} className="h-full">
              <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#dce8f4] bg-white shadow-[0_8px_24px_rgba(32,79,126,0.05)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(32,79,126,0.09)] sm:rounded-[18px]">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f3f9ff] lg:aspect-[16/8.5]">
                  <Image
                    src={benefit.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center"
                  />
                </div>
                <div className="grid flex-1 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 p-4 sm:p-[18px] lg:p-4">
                  <div className="min-w-0">
                    <h3 className="m-0 text-base leading-[1.3] font-bold text-[#123568] sm:text-lg sm:leading-[1.25]">
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 mb-0 text-[13px] leading-[1.5] text-[#5b6f89] sm:text-sm sm:leading-[1.5]">
                      {benefit.description}
                    </p>
                    {benefit.requiresLogin ? (
                      <span className="mt-2 inline-flex rounded-full bg-[#fff7e8] px-2.5 py-1 text-[11px] font-bold text-[#8a5a12]">
                        Cần đăng nhập
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={
                      benefit.destination === 'courses'
                        ? '#courses'
                        : benefit.requiresLogin
                          ? `/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard`)}`
                          : `/${locale}/${benefit.destination}`
                    }
                    aria-label={`Xem ${benefit.title.toLowerCase()}`}
                    className="grid h-11 w-11 place-items-center self-center rounded-full bg-[#f0f7ff] text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <ArrowRight className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedCourses({ locale }: { locale: string }) {
  return (
    <section id="courses" className="landing-section scroll-mt-24 bg-[#f8fbff]">
      <div className="landing-container">
        <SectionHeading
          title="Khóa học ngắn"
          description="Khám phá các hình thức học ngắn gọn, tập trung vào kỹ năng và mục tiêu cụ thể cùng mentor phù hợp."
        />
        <Reveal>
          <div className="grid min-h-52 place-items-center rounded-2xl border border-primary-border bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(32,79,126,0.05)]">
            <div className="max-w-lg">
              <BookOpen
                className="mx-auto h-10 w-10 text-primary"
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <p className="mt-4 text-lg font-bold text-[#102a56]">Tìm hình thức học phù hợp</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Xem thông tin mentor, nội dung, thời lượng và mức giá của từng dịch vụ trước khi lựa
                chọn.
              </p>
              <Link
                href={`/${locale}/mentor-booking`}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Xem mentor và khóa học
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LearningStepPreview({ stepIndex }: { stepIndex: number }) {
  if (stepIndex === 0) {
    const skills = [
      { icon: Monitor, label: 'UI/UX', selected: true },
      { icon: BarChart3, label: 'Data', selected: false },
      { icon: Megaphone, label: 'Marketing', selected: false },
      { icon: MoreHorizontal, label: 'Khác', selected: false },
    ];

    return (
      <div className="grid grid-cols-2 gap-2.5">
        {skills.map(({ icon: Icon, label, selected }) => (
          <div
            key={label}
            className={`flex min-w-0 items-center gap-1.5 rounded-2xl border px-2.5 py-3 text-xs font-semibold sm:min-h-[58px] sm:rounded-full ${selected ? 'border-primary bg-[#f4f9ff] text-primary' : 'border-[#e2ecf7] bg-white text-[#5f728c]'}`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span className="min-w-0 truncate">{label}</span>
            {selected && (
              <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (stepIndex === 1) {
    // TODO: Thay dữ liệu minh họa bằng mentor thật khi landing page có nguồn API phù hợp.
    const mentors = [
      {
        initials: 'A',
        name: 'Mentor A',
        role: 'Product Designer',
        rating: 'Điểm đánh giá minh họa',
      },
      {
        initials: 'B',
        name: 'Mentor B',
        role: 'Data Analyst',
        rating: 'Điểm đánh giá minh họa',
      },
    ];

    return (
      <div className="space-y-3">
        {mentors.map((mentor, index) => (
          <div
            key={mentor.name}
            className="flex min-w-0 items-center gap-3 rounded-[14px] border border-[#e7eff7] bg-white p-3 shadow-[0_4px_14px_rgba(32,79,126,0.035)] sm:p-3.5"
          >
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold ${index === 0 ? 'bg-[#e7f4ff] text-[#087ef1]' : 'bg-[#eef1ff] text-[#5267c9]'}`}
              aria-hidden="true"
            >
              {mentor.initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-bold text-[#12386e]">
                {mentor.name}
              </strong>
              <span className="block truncate text-xs text-[#6f829b]">{mentor.role}</span>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-[#687c96]">
                <Star
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {mentor.rating}
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[#6f829b]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    );
  }

  if (stepIndex === 2) {
    const days = [
      ['T2', '10'],
      ['T3', '11'],
      ['T4', '12'],
      ['T5', '13'],
      ['T6', '14'],
    ];
    const times = ['09:00', '14:00', '19:00'];

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e2ecf7] bg-[#fbfdff]">
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#405a7a]">
            <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
            Chọn lịch học
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {days.map(([day, date], index) => (
              <div
                key={day}
                className={`grid min-w-0 place-items-center rounded-xl border px-1 py-2 text-center ${index === 1 ? 'border-primary bg-primary text-white shadow-[0_5px_14px_rgba(17,156,247,0.2)]' : 'border-[#e1ebf6] bg-white text-[#5f728c]'}`}
              >
                <span className="text-[10px] font-semibold">{day}</span>
                <strong className="text-sm">{date}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[#e7eff7] p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#405a7a]">
            <Clock className="h-5 w-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
            Chọn khung giờ
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {times.map((time) => (
              <span
                key={time}
                className={`grid min-w-0 place-items-center rounded-xl border px-1 py-2.5 text-xs font-semibold ${time === '14:00' ? 'border-primary bg-primary text-white' : 'border-[#dce8f4] bg-white text-[#5f728c]'}`}
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progressItems = [
    { completed: true, label: 'Hoàn thành bài học 1' },
    { completed: true, label: 'Thực hành dự án nhỏ' },
    { completed: false, label: 'Nhận phản hồi từ mentor' },
  ];

  return (
    <div className="rounded-2xl border border-[#e2ecf7] bg-[#fbfdff] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#405a7a]">
        <BookOpen className="h-5 w-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <span className="min-w-0 flex-1">Tiến trình khóa học</span>
        <strong className="text-[#12386e]">70%</strong>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f1fb]">
        <div className="h-full w-[70%] rounded-full bg-primary" />
      </div>
      <div className="mt-4 divide-y divide-[#e7eff7]">
        {progressItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 py-3 text-xs text-[#536984]">
            {item.completed ? (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              </span>
            ) : (
              <Circle
                className="h-6 w-6 shrink-0 text-[#9fbce0]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
            <span className={item.completed ? 'line-through opacity-65' : ''}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-[radial-gradient(circle_at_68%_28%,rgba(75,179,255,0.15),transparent_34%),radial-gradient(circle_at_10%_78%,rgba(81,178,255,0.09),transparent_28%),linear-gradient(180deg,#f7fcff_0%,#eef8ff_52%,#f8fcff_100%)] px-4 py-16 sm:px-5 sm:py-[72px] lg:py-14"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <Reveal>
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="m-0 text-[clamp(1.875rem,8vw,2.125rem)] leading-[1.15] font-extrabold tracking-[-0.025em] text-[#12386e] sm:text-[clamp(2.25rem,3vw,2.625rem)] sm:leading-[1.1] sm:tracking-[-0.03em]">
              Các bước để bắt đầu
            </h2>
            <p className="mt-3 mb-0 text-[15px] leading-[1.6] text-[#5f728c] sm:text-[18px] sm:leading-[1.55]">
              Từ tìm kiếm mentor đến học tập và phát triển chỉ trong vài bước đơn giản.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-20 xl:grid-cols-4 xl:gap-y-6">
          {learningSteps.map(([number, title, description], index) => (
            <Reveal key={number} delay={index * 80} className="h-full overflow-visible">
              <article className="group relative flex h-full min-h-[400px] min-w-0 flex-col overflow-visible rounded-[18px] border border-[#dce8f4] bg-white p-5 shadow-[0_8px_24px_rgba(32,79,126,0.045)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_14px_30px_rgba(32,79,126,0.08)] sm:min-h-[430px] sm:rounded-[20px] xl:min-h-[420px]">
                {index === 3 && (
                  <>
                    <div className="absolute -top-[78px] right-0 z-20 hidden h-[124px] w-[124px] md:block xl:right-1 xl:h-[132px] xl:w-[132px]">
                      <Image
                        src="/images/Koko.png"
                        alt="KouKou"
                        fill
                        sizes="132px"
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute -top-[62px] right-[112px] z-20 hidden rotate-[-5deg] rounded-[13px] border border-[#ddeaf7] bg-[#f5faff] px-3 py-2 text-center text-xs leading-4 font-semibold text-[#12386e] shadow-[0_6px_18px_rgba(32,79,126,0.06)] md:block xl:right-[120px]">
                      Chỉ 4 bước
                      <br /> để bắt đầu!
                    </div>
                  </>
                )}

                {index < learningSteps.length - 1 && (
                  <ArrowRight
                    className="absolute top-1/2 -right-[35px] z-20 hidden h-8 w-8 -translate-y-1/2 text-primary xl:block"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                )}

                <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-[#eaf5ff] text-xl font-bold text-primary">
                  {number}
                </span>
                <h3 className="mt-4 text-xl leading-[1.2] font-bold tracking-[-0.02em] text-[#12386e] xl:text-[19px]">
                  {title}
                </h3>
                <p className="mt-2 mb-0 text-sm leading-[1.5] text-[#5f728c]">{description}</p>
                <div className="mt-auto pt-5">
                  <DemoFrame>
                    <LearningStepPreview stepIndex={index} />
                  </DemoFrame>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function MentorBenefitMockup({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mx-auto w-full max-w-[310px] rounded-[18px] border border-white/90 bg-white p-3.5 shadow-[0_14px_34px_rgba(32,79,126,0.09)]">
        <div className="flex items-center gap-3 border-b border-[#e7eff7] pb-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e8f5ff] text-primary">
            <UsersRound className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold text-[#12386e]">
              Mentor SkillSwap
            </strong>
            <span className="block truncate text-xs text-[#71839b]">Chuyên gia sản phẩm</span>
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[10px] font-bold tracking-[0.08em] text-[#8292a6] uppercase">
            Lĩnh vực chuyên môn
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {['UI/UX', 'Product', 'Portfolio'].map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#dceaf6] bg-[#f4f9ff] px-2.5 py-1 text-[10px] font-semibold text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-[#f7fbff] p-3">
          <div className="h-2 w-[88%] rounded-full bg-[#dce8f4]" />
          <div className="mt-2 h-2 w-[66%] rounded-full bg-[#e7eff7]" />
        </div>
      </div>
    );
  }

  if (index === 1) {
    const services = [
      { icon: Clock, label: 'Phiên 30 phút', price: 'Ví dụ 250.000đ' },
      { icon: Clock, label: 'Phiên 60 phút', price: 'Ví dụ 450.000đ' },
      { icon: BookOpen, label: 'Khóa học ngắn', price: 'Bạn tự đặt' },
    ];

    return (
      <div className="mx-auto w-full max-w-[310px] rounded-[18px] border border-white/90 bg-white p-3.5 shadow-[0_14px_34px_rgba(32,79,126,0.09)]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-bold text-[#12386e]">
            <BadgeDollarSign
              className="h-5 w-5 text-primary"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            Dịch vụ mentoring
          </span>
          <span className="rounded-full bg-[#fff7e8] px-2 py-1 text-[9px] font-bold tracking-[0.06em] text-[#9a6412] uppercase">
            Giá minh họa
          </span>
        </div>
        <div className="mt-2.5 space-y-2">
          {services.map(({ icon: Icon, label, price }, serviceIndex) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-xl border p-2 ${serviceIndex === 1 ? 'border-primary/55 bg-[#f4f9ff]' : 'border-[#e5edf6] bg-white'}`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf5ff] text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#526984]">
                {label}
              </span>
              <strong className="shrink-0 text-[11px] text-[#12386e]">{price}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[310px] rounded-[18px] border border-white/90 bg-white p-3.5 shadow-[0_14px_34px_rgba(32,79,126,0.09)]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-[#12386e]">
          <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Booking sắp tới
        </span>
        <span className="rounded-full bg-[#eaf5ff] px-2 py-1 text-[10px] font-bold text-primary">
          03 lịch
        </span>
      </div>
      <div className="mt-3 rounded-xl border border-[#e5edf6] bg-[#fbfdff] p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f5ff] text-xs font-bold text-primary">
            MH
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-bold text-[#12386e]">
              Mentoring 1:1
            </strong>
            <span className="block truncate text-[10px] text-[#8292a6]">14:00 · Thứ tư</span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[#8292a6]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-[#f4f9ff] p-3">
          <span className="text-[10px] text-[#71839b]">Booking tháng này</span>
          <strong className="mt-1 block text-lg text-[#12386e]">12</strong>
        </div>
        <div className="rounded-xl bg-[#f4f9ff] p-3">
          <span className="text-[10px] text-[#71839b]">Hoàn thành</span>
          <strong className="mt-1 block text-lg text-primary">92%</strong>
        </div>
      </div>
    </div>
  );
}

export function MentorSection({ locale }: { locale: string }) {
  const mentorRegistrationHref = `/${locale}/mentor-registration`;
  const mentorBenefitLinkLabels = [
    'Bắt đầu tạo hồ sơ mentor',
    'Thiết lập dịch vụ mentor',
    'Đăng ký để nhận booking',
  ] as const;

  return (
    <section
      id="mentor"
      className="scroll-mt-24 bg-[radial-gradient(circle_at_68%_28%,rgba(75,179,255,0.15),transparent_34%),radial-gradient(circle_at_10%_78%,rgba(81,178,255,0.09),transparent_28%),linear-gradient(180deg,#f7fcff_0%,#eef8ff_52%,#f8fcff_100%)] py-16 sm:py-[72px] lg:py-14"
    >
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-5 md:px-8">
        <Reveal>
          <div className="mx-auto max-w-[1100px] text-center">
            <p className="m-0 text-xs font-bold tracking-[0.12em] text-primary uppercase sm:text-[13px] sm:tracking-[0.14em]">
              Dành cho mentor
            </p>
            <h2 className="mt-4 text-[clamp(1.875rem,8vw,2.125rem)] leading-[1.17] font-bold tracking-[-0.02em] text-[#123568] sm:text-[clamp(2.125rem,2.7vw,2.625rem)] sm:leading-[1.12] sm:tracking-[-0.025em]">
              Chia sẻ kiến thức và tạo thu nhập minh bạch
            </h2>
            <p className="mx-auto mt-4 max-w-[760px] text-[15px] leading-[1.6] text-text-muted sm:text-[17px]">
              Tạo dịch vụ mentoring hoặc khóa học ngắn, thiết lập lịch học và mức giá của riêng bạn.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid items-stretch gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:mt-8 lg:grid-cols-3">
          {mentorBenefits.map((benefit, index) => (
            <Reveal
              key={benefit.title}
              delay={index * 90}
              className={`h-full ${index === 2 ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-10px)] lg:col-span-1 lg:w-full' : ''}`}
            >
              <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#dce8f4] bg-white shadow-[0_8px_24px_rgba(32,79,126,0.05)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(32,79,126,0.09)] sm:rounded-[18px]">
                <div className="flex aspect-[4/3] w-full items-center overflow-hidden bg-[radial-gradient(circle_at_78%_20%,rgba(17,156,247,0.14),transparent_31%),linear-gradient(145deg,#f7fcff,#eaf6ff)] p-4 sm:p-5 lg:aspect-[16/10]">
                  <DemoFrame>
                    <MentorBenefitMockup index={index} />
                  </DemoFrame>
                </div>
                <div className="grid flex-1 grid-cols-[minmax(0,1fr)_48px] items-center gap-3 p-[18px] sm:p-5">
                  <div className="min-w-0">
                    <h3 className="m-0 text-lg leading-[1.3] font-bold text-[#123568] sm:text-xl sm:leading-[1.25] lg:text-lg">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 mb-0 text-sm leading-[1.5] text-[#5b6f89] sm:text-[15px] sm:leading-[1.55] lg:text-sm">
                      {benefit.description}
                    </p>
                  </div>
                  <Link
                    href={mentorRegistrationHref}
                    aria-label={mentorBenefitLinkLabels[index]}
                    className="grid h-12 w-12 place-items-center self-center rounded-full border border-[#e2edf8] bg-[#f0f7ff] text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <ArrowRight className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220} className="mt-7 flex justify-center">
          <Link
            href={mentorRegistrationHref}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-[0_8px_20px_rgba(17,156,247,0.2)] transition hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Đăng ký làm mentor
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function MentorSteps() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_18%,rgba(17,156,247,0.10),transparent_26%),radial-gradient(circle_at_88%_82%,rgba(17,156,247,0.08),transparent_24%),linear-gradient(180deg,#f5faff_0%,#eef7ff_100%)] px-3 py-11 sm:px-6 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute top-10 left-[7%] h-24 w-24 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[8%] bottom-8 h-40 w-40 rounded-full border border-primary/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1280px]">
        <Reveal>
          <div className="mx-auto max-w-[720px] text-center">
            <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase sm:text-[13px]">
              Hành trình trở thành mentor
            </p>
            <h2 className="mt-2 py-1 text-[clamp(1.65rem,4vw,2.75rem)] leading-[1.22] font-extrabold tracking-[-0.03em] text-[#12386e] sm:mt-3">
              Cách đăng ký làm mentor
            </h2>
            <p className="mx-auto mt-3 max-w-[620px] text-sm leading-6 text-[#5f728c] sm:mt-4 sm:text-[17px] sm:leading-7">
              Hoàn thiện hồ sơ, thiết lập dịch vụ và bắt đầu kết nối với mentee chỉ qua 4 bước đơn
              giản.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-7 sm:mt-14 lg:mt-16">
          <div
            className="absolute top-10 right-[12.5%] left-[12.5%] hidden h-0.5 bg-[#c6e4f9] lg:block"
            aria-hidden="true"
          >
            <div className="h-full w-full bg-[linear-gradient(90deg,#119cf7_0%,#72c9ff_100%)]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {mentorSteps.map(({ number, title, description, icon: Icon }, index) => (
              <Reveal key={number} delay={index * 90} className="h-full">
                <article className="group relative grid h-full grid-cols-[42px_minmax(0,1fr)] items-start gap-3 overflow-visible rounded-2xl border border-white/90 bg-white/95 p-4 shadow-[0_8px_24px_rgba(32,79,126,0.065)] transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(32,79,126,0.12)] sm:flex sm:min-h-[210px] sm:flex-col sm:rounded-[20px] sm:p-6 lg:min-h-[248px] lg:items-center lg:pt-[68px] lg:text-center">
                  <div
                    className="absolute top-0 bottom-0 left-0 w-1 bg-[linear-gradient(180deg,#119cf7,#8bd5ff)] sm:hidden"
                    aria-hidden="true"
                  />
                  <span className="relative z-10 grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border-4 border-[#eff8ff] bg-primary text-xs font-extrabold text-white shadow-[0_5px_14px_rgba(17,156,247,0.22)] sm:h-12 sm:w-12 sm:border-[5px] sm:text-sm lg:absolute lg:-top-6 lg:left-1/2 lg:h-16 lg:w-16 lg:-translate-x-1/2 lg:text-base">
                    {number}
                  </span>
                  <div className="min-w-0 sm:ml-0">
                    <div className="flex items-center gap-2.5 sm:block">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#eaf5ff] text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white sm:h-11 sm:w-11 sm:rounded-xl lg:mx-auto">
                        <Icon
                          className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />
                      </span>
                      <h3 className="text-[15px] leading-5 font-bold text-[#12386e] sm:mt-4 sm:text-[17px] sm:leading-6">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-5 text-[#60738c] sm:mt-2 sm:text-sm sm:leading-6">
                      {description}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TransparentPricing({ locale }: { locale: string }) {
  // TODO: Hiển thị khoảng giá và mentor nổi bật khi backend có API tổng hợp dịch vụ công khai theo loại.
  const pricingSteps = [
    'Chọn mentor bạn quan tâm',
    'Xem giá và thời lượng từng dịch vụ trên hồ sơ mentor',
    'Đặt lịch và thanh toán khi bạn đã hài lòng',
  ] as const;

  const options = [
    {
      eyebrow: 'THEO BUỔI',
      title: 'Phiên 1:1 linh hoạt',
      description: 'Thanh toán theo từng buổi học.',
      icon: CalendarClock,
      features: [
        { icon: Clock3, label: '30 / 60 / 90 phút' },
        { icon: UserRound, label: 'Phù hợp khi cần hỗ trợ nhanh' },
        { icon: CalendarDays, label: 'Đặt lịch dễ dàng' },
      ],
    },
    {
      eyebrow: 'THEO KHÓA',
      title: 'Khóa học ngắn trọn gói',
      description: 'Thanh toán theo toàn bộ khóa học.',
      icon: BookOpen,
      features: [
        { icon: FileText, label: 'Nội dung và số buổi rõ ràng' },
        { icon: Play, label: 'Dễ bắt đầu' },
        { icon: Target, label: 'Phù hợp học kỹ năng cụ thể' },
      ],
    },
    {
      eyebrow: 'THEO GÓI',
      title: 'Lộ trình chuyên sâu',
      description: 'Thanh toán theo gói nhiều buổi.',
      icon: ChartNoAxesCombined,
      features: [
        { icon: ChartNoAxesCombined, label: 'Theo dõi dài hạn' },
        { icon: CircleDollarSign, label: 'Tiết kiệm hơn theo buổi' },
        { icon: Target, label: 'Phù hợp mục tiêu dài hạn' },
      ],
    },
  ] as const;

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-[radial-gradient(circle_at_50%_15%,rgba(17,156,247,0.06),transparent_36%),linear-gradient(180deg,#f8fcff_0%,#f3f9ff_48%,#f8fcff_100%)] px-4 py-12 sm:px-6 sm:py-14 lg:px-12 lg:py-8"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal className="text-center">
          <h2 className="text-[clamp(1.875rem,2.7vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#12386e]">
            Chi phí học tại SkillSwap
          </h2>
          <p className="mx-auto mt-2.5 max-w-4xl text-[15px] leading-6 text-[#5c718b] sm:text-base">
            Mỗi mentor tự đặt mức giá cho dịch vụ của mình. Bạn luôn thấy giá trước khi đặt lịch và
            thanh toán.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <ol className="mx-auto mt-6 grid max-w-[1200px] gap-3 sm:mt-7 md:grid-cols-3 lg:mt-5">
            {pricingSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-[#dce8f4] bg-white/85 p-3.5 text-sm leading-5 font-semibold text-[#405a78] shadow-[0_6px_18px_rgba(37,82,126,0.04)] sm:p-4 lg:p-3.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:mt-5 lg:grid-cols-3 lg:gap-5">
          {options.map(({ eyebrow, title, description, icon: Icon, features }, index) => (
            <Reveal key={eyebrow} delay={index * 90} className="h-full">
              <article className="group flex h-full min-h-0 flex-col rounded-[18px] border border-[#dce8f4] bg-white/95 p-5 shadow-[0_8px_24px_rgba(37,82,126,0.04)] transition duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_14px_30px_rgba(37,82,126,0.075)] sm:p-6 lg:p-5">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#eaf5ff] text-primary sm:h-14 sm:w-14 lg:h-12 lg:w-12">
                    <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className="inline-flex h-7 items-center rounded-full bg-[#eaf5ff] px-3.5 text-[11px] font-bold tracking-[0.1em] text-primary">
                    {eyebrow}
                  </span>
                </div>

                <h3 className="mt-4 text-lg leading-[1.2] font-bold text-[#12386e] sm:text-xl">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-5 text-[#5c718b]">{description}</p>

                <div className="mt-4 grid gap-2">
                  {features.map(({ icon: FeatureIcon, label }) => (
                    <div
                      key={label}
                      className="flex min-h-10 items-center gap-3 rounded-[10px] bg-[#f5f9fe] px-3.5 py-2 text-[13px] leading-5 text-[#405a78] sm:text-sm"
                    >
                      <FeatureIcon
                        className="h-[19px] w-[19px] shrink-0 text-primary"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-[#e4edf6] pt-3 text-[13px] font-bold text-primary">
                  Giá do mentor đặt
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <p className="mx-auto mt-4 flex max-w-2xl items-start justify-center gap-2.5 text-center text-[13px] leading-5 text-[#6e8198] sm:items-center sm:text-sm">
            <Info
              className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span>Giá do từng mentor tự đặt và hiển thị rõ trước khi bạn thanh toán.</span>
          </p>
        </Reveal>

        {PLATFORM_FEE_NOTE ? (
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-[#5c718b]">
            {PLATFORM_FEE_NOTE}
          </p>
        ) : null}

        <Reveal delay={300} className="mt-4 flex justify-center">
          <Link
            href={`/${locale}/mentor-booking`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-bold text-white shadow-[0_8px_20px_rgba(17,156,247,0.2)] transition hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Xem mentor và giá
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </Reveal>
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
