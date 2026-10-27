/**
 * @file KooKooDemoSection.tsx
 * @description Landing "#koukou" section: a local demo chat that looks like the KooKoo widget.
 * Suggestions answer from canned copy; typing a question opens the real widget instead.
 * Never calls the AI API.
 */

'use client';

import { Check, SendHorizontal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { openKouKou } from '@/components/domain/ai-chat/openKouKou';
import {
  Highlight,
  Mascot,
  SITE_CONTAINER,
  SITE_HEADLINE,
} from '@/components/domain/landing/LandingPrimitives';
import {
  KOUKOU_DEMO_GREETING,
  KOUKOU_DEMO_QA,
} from '@/components/domain/landing/landing.constants';

type DemoQa = (typeof KOUKOU_DEMO_QA)[number];

function BotBubble({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Mascot variant="icon" width={40} className="-m-1.5 mt-[-6px]" />
      <p className="m-0 rounded-[4px_16px_16px_16px] border border-solid border-site-bubble-border bg-site-bubble px-[13px] py-2.5 font-site-body text-sm leading-[21px] whitespace-pre-line text-site-body">
        {children}
      </p>
    </div>
  );
}

function UserBubble({ children }: { children: string }) {
  return (
    <p className="m-0 max-w-[80%] self-end rounded-[16px_4px_16px_16px] bg-site-blue px-[13px] py-2.5 font-site-body text-sm leading-5 text-white">
      {children}
    </p>
  );
}

function DemoChat() {
  const [askedIds, setAskedIds] = useState<DemoQa['id'][]>([]);
  const [draft, setDraft] = useState('');
  const asked = askedIds
    .map((id) => KOUKOU_DEMO_QA.find((item) => item.id === id))
    .filter((item): item is DemoQa => Boolean(item));
  const suggestions = KOUKOU_DEMO_QA.filter(({ id }) => !askedIds.includes(id));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: KouKouChatWidget has no prefill yet; pass `draft` once it accepts an initial message.
    openKouKou();
  };

  return (
    <div
      role="region"
      aria-label="Thử chat với KooKoo AI"
      className="flex w-full max-w-[380px] flex-col overflow-hidden rounded-[22px] border border-solid border-site-line-strong bg-white shadow-[0_24px_60px_rgba(30,58,138,0.18)]"
    >
      <div className="flex items-center gap-3 border-0 border-b border-solid border-site-line px-[18px] py-3.5">
        <Mascot variant="icon" width={44} className="-m-1.5" />
        <div className="min-w-0 flex-1">
          <p className="m-0 flex items-center gap-2 font-site-ui text-base font-bold text-[#111827]">
            KooKoo AI
            <span className="rounded-full bg-site-chip px-[7px] py-0.5 text-[10px] tracking-[0.04em] text-site-navy">
              BETA
            </span>
          </p>
          <p className="m-0 font-site-body text-xs text-site-muted">Trợ lý AI của SkillSwap</p>
        </div>
      </div>

      <div aria-live="polite" className="flex min-h-[250px] flex-col gap-3 bg-white p-4">
        <BotBubble>{KOUKOU_DEMO_GREETING}</BotBubble>
        {asked.map((item) => (
          <div key={item.id} className="flex flex-col gap-3">
            <UserBubble>{item.question}</UserBubble>
            <BotBubble>{item.answer}</BotBubble>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4 pb-3.5">
        {suggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAskedIds((current) => [...current, item.id])}
            className="flex min-h-[46px] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-solid border-site-line-strong bg-white px-3 py-2 text-left font-site-body text-sm text-site-body transition-colors hover:border-site-blue hover:bg-site-tint"
          >
            <span aria-hidden="true" className="font-bold text-site-blue">
              ›
            </span>
            <span className="flex-1">{item.question}</span>
          </button>
        ))}
        {askedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setAskedIds([])}
            className="min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 font-site-ui text-[13px] font-semibold text-site-blue hover:text-site-navy"
          >
            Hỏi lại từ đầu
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 border-0 border-t border-solid border-site-line px-4 py-3"
      >
        <label htmlFor="landing-koukou-question" className="sr-only">
          Nhập câu hỏi cho KooKoo
        </label>
        <input
          id="landing-koukou-question"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          className="h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-solid border-site-blue px-3.5 font-site-body text-sm text-site-body placeholder:text-site-muted"
        />
        <button
          type="submit"
          aria-label="Gửi câu hỏi"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-site-blue text-white transition-colors hover:bg-site-blue-hover"
        >
          <SendHorizontal className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </form>
      <p className="m-0 px-4 pb-3 font-site-body text-[11.5px] text-site-muted">
        KooKoo có thể sai, hãy kiểm tra lại với nguồn được dẫn.
      </p>
    </div>
  );
}

export function KooKooDemoSection() {
  return (
    <section id="koukou" className="relative overflow-hidden bg-site-tint">
      <svg
        aria-hidden="true"
        viewBox="0 0 600 600"
        className="pointer-events-none absolute bottom-[-220px] left-[-160px] h-[600px] w-[600px]"
      >
        <circle
          cx="300"
          cy="300"
          r="220"
          fill="none"
          className="stroke-site-chip"
          strokeWidth="90"
        />
      </svg>
      <div
        className={`${SITE_CONTAINER} relative grid items-center gap-14 py-20 sm:py-24 min-[900px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]`}
      >
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="m-0 inline-flex items-center gap-2 rounded-full border border-solid border-site-line-strong bg-white py-1.5 pr-3 pl-1.5 font-site-ui text-sm font-semibold text-site-navy">
            <Mascot variant="icon" width={36} className="-my-1.5 -ml-1" />
            KooKoo AI · trợ lý của SkillSwap
          </p>
          <h2 className={SITE_HEADLINE}>
            Chưa biết hỏi ai? <Highlight>Hỏi KooKoo trước.</Highlight>
          </h2>
          <p className="m-0 max-w-[480px] font-site-body text-[17px] leading-[26px] text-site-muted">
            KooKoo hiểu ngành và học kỳ của bạn, gợi ý mentor hợp, chỉ cách đặt lịch và giải thích
            S-coin. Bấm thử một câu bên khung chat.
          </p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 font-site-body text-[15px] text-site-body">
            {[
              'Đánh dấu mentor hợp với hồ sơ của bạn ngay trên từng thẻ',
              'Luôn ở góc màn hình, hỏi lúc nào cũng được',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <Check
                  className="h-5 w-5 shrink-0 text-site-blue"
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex min-w-0 justify-center">
          <Mascot
            width={150}
            className="absolute bottom-[-30px] left-[-10px] z-[2] hidden drop-shadow-[0_12px_18px_rgba(30,58,138,0.25)] min-[900px]:block"
          />
          <DemoChat />
        </div>
      </div>
    </section>
  );
}
