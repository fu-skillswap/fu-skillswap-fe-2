/**
 * @file LandingFaq.tsx
 * @description Accordion câu hỏi thường gặp trên landing page.
 */

'use client';

import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react';
import { useState } from 'react';
import { Reveal } from '@/components/domain/landing/Reveal';

const questions = [
  [
    'SkillSwap phù hợp với ai?',
    'SkillSwap dành cho người muốn học kỹ năng thực tế và những người có kinh nghiệm muốn chia sẻ kiến thức.',
  ],
  [
    'Mentee có thể học những gì?',
    'Nội dung học phụ thuộc vào dịch vụ và khóa học do từng mentor công khai trên SkillSwap.',
  ],
  [
    'Làm thế nào để tìm mentor phù hợp?',
    'Bạn có thể xem thông tin mentor, kinh nghiệm và dịch vụ trước khi lựa chọn.',
  ],
  [
    'Mentor đăng ký như thế nào?',
    'Tạo hồ sơ mentor, hoàn thiện thông tin chuyên môn và thiết lập dịch vụ để bắt đầu.',
  ],
  [
    'Giá được hiển thị ra sao?',
    'Mức giá và thời lượng được hiển thị trong thông tin của từng dịch vụ trước khi bạn đặt.',
  ],
] as const;

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const columns = [
    [0, 2],
    [4, 1, 3],
  ] as const;

  return (
    <section
      id="faq"
      className="scroll-mt-28 bg-[radial-gradient(circle_at_0%_100%,rgba(17,156,247,0.06),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(17,156,247,0.06),transparent_24%),#f8fcff] px-4 py-12 sm:px-6 sm:py-14 lg:px-12 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <Reveal className="max-w-3xl">
          <span
            className="block h-[5px] w-12 rounded-full bg-primary sm:h-1.5 sm:w-14"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-[clamp(1.75rem,3vw,3rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#12386e] sm:mt-5">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-[#586f89] sm:mt-4 sm:text-[17px] sm:leading-7 lg:text-lg">
            Giải đáp nhanh những câu hỏi phổ biến trước khi bạn bắt đầu với SkillSwap.
          </p>
        </Reveal>

        <div className="mt-7 grid items-start gap-4 sm:mt-8 sm:gap-5 lg:mt-10 lg:grid-cols-2 lg:gap-6">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="grid gap-4 sm:gap-5">
              {column.map((index, itemIndex) => {
                const [question, answer] = questions[index];
                const isOpen = openIndex === index;
                const answerId = `faq-answer-${index}`;

                return (
                  <Reveal key={question} delay={(columnIndex * 2 + itemIndex) * 70}>
                    <article
                      className={`overflow-hidden rounded-2xl border bg-white/95 shadow-[0_6px_18px_rgba(32,79,126,0.04)] transition-colors duration-200 ${isOpen ? 'border-primary/25' : 'border-[#dce8f4]'}`}
                    >
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={answerId}
                          onClick={() => setOpenIndex(isOpen ? null : index)}
                          className="grid min-h-[84px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-[#f8fcff] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:min-h-[94px] sm:gap-4 sm:px-5 sm:py-4 lg:px-6"
                        >
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf5ff] text-primary sm:h-12 sm:w-12">
                            <CircleHelp
                              className="h-5 w-5 sm:h-[22px] sm:w-[22px]"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                          </span>
                          <span className="min-w-0 text-[15.5px] leading-[1.35] font-bold text-[#12386e] sm:text-[17px] lg:text-lg">
                            {question}
                          </span>
                          {isOpen ? (
                            <ChevronUp
                              className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </h3>

                      <div
                        id={answerId}
                        aria-hidden={!isOpen}
                        className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                      >
                        <div className="overflow-hidden">
                          <div className="mx-4 h-px bg-[#e2ecf5] sm:mx-5 lg:mx-6" />
                          <p className="max-w-[95%] px-4 pt-4 pb-5 text-sm leading-[1.6] text-[#536a84] sm:px-5 sm:text-[15px] lg:px-6">
                            {answer}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
