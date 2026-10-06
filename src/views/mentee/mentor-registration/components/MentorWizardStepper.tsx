'use client';

import { Check } from 'lucide-react';
import { MENTOR_STEPS } from '../mentorRegistration.constants';

export function MentorWizardStepper({
  step,
  onGoBack,
}: {
  step: number;
  onGoBack: (step: number) => void;
}) {
  const current = MENTOR_STEPS[step - 1];
  return (
    <>
      <div className="hidden grid-cols-5 md:grid" aria-label="Tiến độ đăng ký mentor">
        {MENTOR_STEPS.map((item, index) => {
          const done = item.id < step;
          const active = item.id === step;
          return (
            <div key={item.id} className="relative flex flex-col items-center text-center">
              {index > 0 && (
                <span
                  className={`absolute left-0 right-1/2 top-4 h-px ${item.id <= step ? 'bg-sky-500' : 'bg-slate-200'}`}
                />
              )}
              {index < 4 && (
                <span
                  className={`absolute left-1/2 right-0 top-4 h-px ${item.id < step ? 'bg-sky-500' : 'bg-slate-200'}`}
                />
              )}
              <button
                type="button"
                disabled={!done}
                onClick={() => done && onGoBack(item.id)}
                aria-current={active ? 'step' : undefined}
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${done || active ? 'border-sky-500 bg-sky-500 text-white' : 'cursor-default border-slate-300 bg-white text-slate-500'}`}
              >
                {done ? <Check className="h-4 w-4" /> : item.id}
              </button>
              <span
                className={`mt-2 text-[11px] font-semibold ${active ? 'text-sky-700' : 'text-slate-500'}`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="md:hidden" aria-current="step">
        <div className="flex justify-between text-sm font-semibold text-slate-800">
          <span>
            Bước {step}/5 · {current.label}
          </span>
          <span className="text-sky-600">{step * 20}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-sky-500" style={{ width: `${step * 20}%` }} />
        </div>
      </div>
    </>
  );
}
