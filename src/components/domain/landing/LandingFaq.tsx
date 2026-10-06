/**
 * @file LandingFaq.tsx
 * @description FAQ theo chủ đề với accordion và khối hỗ trợ trên landing page.
 */

'use client';

import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  CreditCard,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sprout,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState, type KeyboardEvent } from 'react';
import { Reveal } from '@/components/domain/landing/Reveal';
import { CONTACT_EMAIL } from '@/constants/contact';
import { LANDING_FAQ_GROUPS } from '@/data/landingFaq';

const categoryMeta: Record<string, { label: string; description: string; icon: LucideIcon }> = {
  'getting-started': {
    label: 'Bắt đầu',
    description: 'Tài khoản, mentor, cách hoạt động',
    icon: Sprout,
  },
  'pricing-and-payment': {
    label: 'Thanh toán',
    description: 'Giá, phương thức, hoàn tiền',
    icon: CreditCard,
  },
  'learning-sessions': {
    label: 'Buổi học',
    description: 'Lịch học, hủy/đổi lịch',
    icon: CalendarDays,
  },
  'for-mentors': {
    label: 'Mentor',
    description: 'Xác minh, chất lượng',
    icon: UserRoundCheck,
  },
};

const faqValues = [
  {
    title: 'Minh bạch – rõ ràng',
    description: 'Thông tin chính xác, dễ hiểu',
    icon: UsersRound,
    iconClassName: 'bg-[#eaf5ff] text-primary',
  },
  {
    title: 'An toàn – đáng tin cậy',
    description: 'Mentor được xác minh',
    icon: ShieldCheck,
    iconClassName: 'bg-[#e8f8f2] text-[#15976f]',
  },
  {
    title: 'Luôn đồng hành cùng bạn',
    description: 'Đội ngũ hỗ trợ sẵn sàng giúp đỡ',
    icon: Heart,
    iconClassName: 'bg-[#fff0f2] text-[#ef5670]',
  },
] as const;

function SupportCard() {
  const content = (
    <>
      <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      <span>Liên hệ hỗ trợ</span>
      <ArrowRight className="ml-auto h-4 w-4" strokeWidth={2} aria-hidden="true" />
    </>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,#eef8ff,#f8fbff)] p-5 shadow-[0_12px_30px_rgba(32,79,126,0.07)] sm:p-6">
      <div
        className="absolute -top-7 -right-7 h-24 w-24 rounded-full bg-primary/5"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 left-8 h-20 w-20 rounded-full border border-primary/10"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[68%] sm:max-w-[72%] xl:max-w-none xl:pr-24">
        <h3 className="text-lg font-extrabold text-[#12386e]">Chưa tìm thấy câu trả lời?</h3>
        <p className="mt-2 text-sm leading-6 text-[#5c718b]">
          Đội ngũ SkillSwap luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi bất cứ khi nào bạn
          cần.
        </p>
        {CONTACT_EMAIL ? (
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(17,156,247,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {content}
          </a>
        ) : (
          // TODO: Điền NEXT_PUBLIC_CONTACT_EMAIL để kích hoạt nút liên hệ hỗ trợ.
          <span
            aria-disabled="true"
            title="Kênh liên hệ đang được cập nhật"
            className="mt-5 inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full bg-[#7d91a8] px-5 text-sm font-bold text-white"
          >
            {content}
          </span>
        )}
      </div>

      <Image
        src="/images/Koko.png"
        alt="Koko, linh vật SkillSwap"
        width={150}
        height={150}
        className="pointer-events-none absolute right-1 bottom-0 h-28 w-28 object-contain mix-blend-multiply select-none sm:right-4 sm:h-32 sm:w-32 xl:-right-2 xl:h-28 xl:w-28"
      />
    </div>
  );
}

export function LandingFaq() {
  const [activeCategoryId, setActiveCategoryId] = useState(LANDING_FAQ_GROUPS[0]?.id ?? '');
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const activeGroup =
    LANDING_FAQ_GROUPS.find(({ id }) => id === activeCategoryId) ?? LANDING_FAQ_GROUPS[0];
  const selectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setOpenQuestionId(null);
  };
  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = LANDING_FAQ_GROUPS.length - 1;
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    }

    if (nextIndex === undefined) return;
    const nextGroup = LANDING_FAQ_GROUPS[nextIndex];
    if (!nextGroup) return;

    event.preventDefault();
    selectCategory(nextGroup.id);
    window.requestAnimationFrame(() => document.getElementById(`faq-tab-${nextGroup.id}`)?.focus());
  };

  if (!activeGroup) return null;

  return (
    <section
      id="faq"
      className="scroll-mt-24 overflow-x-clip bg-[radial-gradient(circle_at_0%_100%,rgba(17,156,247,0.05),transparent_24%),#f8fcff] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 xl:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-10 xl:grid-cols-[minmax(0,0.33fr)_minmax(0,0.67fr)] xl:gap-12">
        <aside className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf5ff] px-3.5 py-2 text-xs font-extrabold tracking-[0.08em] text-primary uppercase">
              <CircleHelp className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              FAQ
            </span>
            <h2 className="mt-5 text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.04] font-extrabold tracking-[-0.045em]">
              <span className="block text-[#12386e]">Câu hỏi</span>
              <span className="block text-primary">thường gặp</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-[#586f89] sm:text-base">
              Giải đáp nhanh những câu hỏi phổ biến trước khi bạn bắt đầu với SkillSwap.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
            {faqValues.map(({ title, description, icon: Icon, iconClassName }, index) => (
              <Reveal key={title} delay={index * 60}>
                <div className="flex items-center gap-4">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${iconClassName}`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-extrabold text-[#12386e]">{title}</h3>
                    <p className="mt-0.5 text-sm leading-5 text-[#667b94]">{description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 hidden xl:block" delay={180}>
            <SupportCard />
          </Reveal>
        </aside>

        <Reveal className="min-w-0" delay={80}>
          <div className="rounded-3xl border border-[#e2ebf5] bg-white p-4 shadow-[0_18px_48px_rgba(32,79,126,0.08)] sm:p-6">
            <div
              role="tablist"
              aria-label="Chủ đề câu hỏi thường gặp"
              className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
            >
              {LANDING_FAQ_GROUPS.map((group, index) => {
                const meta = categoryMeta[group.id];
                if (!meta) return null;
                const Icon = meta.icon;
                const isActive = group.id === activeGroup.id;

                return (
                  <button
                    key={group.id}
                    id={`faq-tab-${group.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`faq-category-panel-${group.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => selectCategory(group.id)}
                    onKeyDown={(event) => handleCategoryKeyDown(event, index)}
                    className={`group flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 text-left outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-3.5 ${
                      isActive
                        ? 'border-primary bg-primary text-white shadow-[0_8px_20px_rgba(17,156,247,0.22)]'
                        : 'border-[#e2ebf5] bg-[#fbfdff] text-[#12386e] hover:border-primary/30 hover:bg-[#f3f9ff]'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${isActive ? 'bg-white/18 text-white' : 'bg-[#eaf5ff] text-primary'}`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold">{meta.label}</span>
                      <span
                        className={`mt-0.5 hidden truncate text-[10px] leading-4 sm:block ${isActive ? 'text-white/80' : 'text-[#6a7f97]'}`}
                      >
                        {meta.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              id={`faq-category-panel-${activeGroup.id}`}
              role="tabpanel"
              aria-labelledby={`faq-tab-${activeGroup.id}`}
              className="mt-5 grid gap-3"
            >
              {activeGroup.items.map(({ id, question, answer }, index) => {
                const isOpen = openQuestionId === id;
                const questionId = `faq-question-${id}`;
                const answerId = `faq-panel-${id}`;

                return (
                  <article
                    key={id}
                    className={`overflow-hidden rounded-2xl border bg-white transition duration-200 hover:border-primary/25 hover:shadow-[0_8px_22px_rgba(32,79,126,0.06)] ${isOpen ? 'border-primary/25 shadow-[0_8px_22px_rgba(32,79,126,0.06)]' : 'border-[#e2ebf5]'}`}
                  >
                    <h3>
                      <button
                        id={questionId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        onClick={() => setOpenQuestionId(isOpen ? null : id)}
                        className="grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:px-5"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eaf5ff] text-sm font-extrabold text-primary">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 text-sm leading-5 font-bold text-[#12386e] sm:text-[15px]">
                          {question}
                        </span>
                        {isOpen ? (
                          <ChevronUp
                            className="h-5 w-5 shrink-0 text-primary"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronDown
                            className="h-5 w-5 shrink-0 text-primary"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </h3>

                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={questionId}
                      aria-hidden={!isOpen}
                      className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <p className="mx-4 mb-4 rounded-xl bg-[#f3f8fd] px-4 py-3.5 text-[13px] leading-6 text-[#536a84] sm:mx-5 sm:px-5 sm:text-sm">
                          {answer}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal className="xl:hidden" delay={140}>
          <SupportCard />
        </Reveal>
      </div>
    </section>
  );
}
