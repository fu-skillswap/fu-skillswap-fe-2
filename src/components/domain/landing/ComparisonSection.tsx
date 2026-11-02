/**
 * @file ComparisonSection.tsx
 * @description "Vẫn hỏi trong group được mà?": Facebook group vs SkillSwap comparison table.
 */

import {
  Highlight,
  Mascot,
  SITE_CONTAINER,
  SITE_HEADLINE,
  SpeechBubble,
} from '@/components/domain/landing/LandingPrimitives';
import { COMPARISON_ROWS } from '@/components/domain/landing/landing.constants';

const CELL = 'px-5 py-[18px] text-left align-top sm:px-6';

export function ComparisonSection() {
  return (
    <section className="bg-site-tint">
      <div className={`${SITE_CONTAINER} flex flex-col gap-8 pt-4 pb-20 sm:pb-24`}>
        <h2 className={SITE_HEADLINE}>
          Vẫn hỏi trong group <Highlight>được mà?</Highlight>
        </h2>

        <div className="relative min-[900px]:pt-14">
          <div className="absolute top-[-18px] right-[9%] hidden items-start gap-2 min-[900px]:flex">
            <SpeechBubble className="mt-2 px-3.5 py-2.5">Khỏi ngồi chờ comment nha!</SpeechBubble>
            <Mascot variant="peek" width={96} className="-scale-x-100" />
          </div>

          <div className="relative overflow-x-auto rounded-[28px] border border-solid border-site-line-strong bg-white">
            <table className="w-full min-w-[620px] border-collapse font-site-body text-[15px] leading-[22px]">
              <caption className="sr-only">
                So sánh tìm người hỏi trong Group Facebook và trên SkillSwap
              </caption>
              <thead>
                <tr className="font-site-ui text-[15px] font-bold">
                  <td className={`${CELL} w-[36%]`} />
                  <th scope="col" className={`${CELL} font-bold text-site-muted`}>
                    Group Facebook
                  </th>
                  <th scope="col" className={`${CELL} bg-site-blue font-bold text-white`}>
                    SkillSwap
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.topic} className="border-0 border-t border-solid border-site-line">
                    <th scope="row" className={`${CELL} font-site-ui font-semibold text-site-ink`}>
                      {row.topic}
                    </th>
                    <td className={`${CELL} text-site-muted`}>{row.facebook}</td>
                    <td className={`${CELL} bg-site-bubble font-medium text-site-ink`}>
                      {row.skillswap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
