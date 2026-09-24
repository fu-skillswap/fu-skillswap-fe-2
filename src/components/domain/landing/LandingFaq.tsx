/**
 * @file LandingFaq.tsx
 * @description Accordion câu hỏi thường gặp trên landing page.
 */

'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { SectionHeading } from '@/components/domain/landing/SectionHeading';

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

  return (
    <section id="faq" className="landing-section scroll-mt-24 bg-[#f8fbff]">
      <div className="landing-container">
        <SectionHeading title="Câu hỏi thường gặp" />
        <div className="grid gap-x-8 lg:grid-cols-2">
          {questions.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="border-b border-[#dfe8f3]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left text-sm font-bold text-[#102a56] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {question}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-4 text-sm leading-6 text-text-muted">{answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
