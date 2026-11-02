/**
 * @file QuickFaq.tsx
 * @description Landing "Hỏi nhanh" FAQ (#faq): KooKoo aside + single-open accordion.
 */

'use client';

import { useState } from 'react';
import { Mascot, SpeechBubble } from '@/components/domain/landing/LandingPrimitives';
import { LANDING_QUICK_FAQS } from '@/data/landingFaq';

export function QuickFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className="bg-site-tint">
      <div className="mx-auto grid w-full max-w-[1040px] items-start gap-10 px-4 py-20 sm:px-6 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col items-start gap-[18px]">
          <h2 className="m-0 font-site-display text-[32px] font-black text-site-ink uppercase">
            Hỏi nhanh
          </h2>
          <SpeechBubble tail="bottom-left" className="max-w-[240px] px-4">
            Còn thắc mắc? Hỏi KooKoo AI ở góc màn hình, mình trả lời liền.
          </SpeechBubble>
          <Mascot width={130} className="w-[100px] min-[900px]:w-[130px]" />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {LANDING_QUICK_FAQS.map(({ id, question, answer }) => {
            const isOpen = openId === id;
            const buttonId = `landing-faq-question-${id}`;
            const panelId = `landing-faq-answer-${id}`;
            return (
              <div key={id} className="rounded-[18px] bg-white px-[22px]">
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : id)}
                    className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-4 text-left font-site-ui text-[17px] font-semibold text-site-ink"
                  >
                    {question}
                    <span aria-hidden="true" className="text-2xl leading-none text-site-blue">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
                  <p className="m-0 mb-5 font-site-body text-[15px] leading-[23px] text-site-muted">
                    {answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
