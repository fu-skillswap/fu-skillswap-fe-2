/**
 * @file PrivacyPolicyView.tsx
 * @description Trang công khai Chính sách bảo mật: dải tiêu đề + "Đọc nhanh", mục lục dính và
 * nội dung các mục. Không dùng analytics, cookie hay lưu trữ phía trình duyệt.
 */

import { LandingFooter } from '@/components/domain/landing/LandingFooter';
import { LandingHeader } from '@/components/domain/landing/LandingHeader';
import {
  PRIVACY_POLICY_META,
  PRIVACY_QUICK_READ,
  PRIVACY_SECTIONS,
  type PrivacyBlock,
  type PrivacySection,
} from '@/constants/privacyPolicy';
import { ArrowUp, CircleCheck, Info, Settings, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { LegalText } from './LegalText';
import { PrivacyToc } from './PrivacyToc';

/** Section 7 (account deletion) ends with a shortcut to the privacy settings. */
const SETTINGS_LINK_SECTION: PrivacySection['id'] = 'xoa-tai-khoan';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

function Block({ block }: { block: PrivacyBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="my-4">
          <LegalText text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className="my-4 grid list-disc gap-2 pl-6 marker:text-primary">
          {block.items.map((item, index) => (
            <li key={index}>
              <LegalText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="my-4 grid list-none gap-3 p-0">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-50 text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="sr-only">Bước {index + 1}: </span>
                <LegalText text={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="my-5 overflow-x-auto rounded-2xl border border-solid border-sky-100">
          <table className="w-full min-w-[520px] border-collapse text-left text-[15px] leading-6">
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-0 border-b border-solid border-sky-100 bg-sky-50 px-4 py-3 font-bold text-[#12386e]"
                  >
                    <LegalText text={column} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="align-top">
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th
                        key={cellIndex}
                        scope="row"
                        className="border-0 border-t border-solid border-sky-100 px-4 py-3 font-bold text-[#12386e]"
                      >
                        <LegalText text={cell} />
                      </th>
                    ) : (
                      <td
                        key={cellIndex}
                        className="border-0 border-t border-solid border-sky-100 px-4 py-3"
                      >
                        <LegalText text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'note': {
      const isWarning = block.tone === 'warning';
      const Icon = isWarning ? TriangleAlert : Info;
      return (
        <div
          className={`my-5 flex gap-3 rounded-2xl border border-solid px-4 py-3.5 ${
            isWarning ? 'border-amber-200 bg-amber-50' : 'border-sky-100 bg-sky-50'
          }`}
        >
          <Icon
            className={`mt-1 h-5 w-5 shrink-0 ${isWarning ? 'text-amber-600' : 'text-primary'}`}
            aria-hidden="true"
          />
          <p className="m-0">
            <LegalText text={block.text} />
          </p>
        </div>
      );
    }
  }
}

export function PrivacyPolicyView({ locale }: { locale: string }) {
  const tocItems = PRIVACY_SECTIONS.map(({ id, title }) => ({ id, title }));

  return (
    <div
      id="dau-trang"
      className="min-h-screen w-full max-w-full overflow-x-clip bg-white text-text-main"
    >
      <LandingHeader locale={locale} isOutsideLanding />

      <main>
        {/* Title band */}
        <section className="landing-hero-canvas border-0 border-b border-solid border-sky-100">
          <div className="relative z-10 mx-auto grid w-[calc(100%_-_32px)] max-w-[1220px] gap-8 py-10 sm:w-[calc(100%_-_48px)] sm:py-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-12">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb">
                <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm text-[#536a84]">
                  <li>
                    <Link
                      href={`/${locale}`}
                      className={`rounded-sm text-[#536a84] no-underline hover:text-primary ${focusRing}`}
                    >
                      Trang chủ
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="font-semibold text-[#12386e]">
                    Chính sách bảo mật
                  </li>
                </ol>
              </nav>
              <h1 className="mb-0 mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-[#12386e] sm:text-[40px] lg:text-[46px]">
                Chính sách bảo mật
              </h1>
              <p className="mb-0 mt-4 max-w-[62ch] text-base leading-7 text-[#435b78] sm:text-[17px]">
                SkillSwap thu thập dữ liệu gì, dùng để làm gì, chia sẻ với ai, giữ bao lâu và cách
                xóa tài khoản.
              </p>
              <p className="mb-0 mt-4 text-sm text-[#61758e]">
                Cập nhật lần cuối: <b className="text-[#12386e]">{PRIVACY_POLICY_META.updatedAt}</b>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                Có hiệu lực từ:{' '}
                <b className="text-[#12386e]">
                  <LegalText text={PRIVACY_POLICY_META.effectiveFrom} />
                </b>
              </p>
            </div>

            {PRIVACY_QUICK_READ.length > 0 && (
              <aside
                aria-labelledby="privacy-quick-read"
                className="rounded-3xl border border-solid border-sky-100 bg-white p-6 shadow-[0_12px_32px_rgba(18,56,110,0.08)]"
              >
                <h2 id="privacy-quick-read" className="m-0 text-lg font-extrabold text-[#12386e]">
                  Đọc nhanh trong 30 giây
                </h2>
                <ul className="m-0 mt-4 grid list-none gap-3 p-0">
                  {PRIVACY_QUICK_READ.map((item, index) => (
                    <li key={index} className="flex gap-2.5 text-[15px] leading-6 text-[#435b78]">
                      <CircleCheck
                        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <LegalText text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </section>

        {/* Body */}
        <div className="mx-auto grid w-[calc(100%_-_32px)] max-w-[1220px] gap-6 py-8 sm:w-[calc(100%_-_48px)] sm:py-12 lg:grid-cols-[250px_minmax(0,760px)] lg:gap-12">
          <div className="min-w-0">
            <PrivacyToc items={tocItems} />
          </div>

          <article className="min-w-0 max-w-[72ch] text-base leading-[1.75] text-[#435b78]">
            {PRIVACY_SECTIONS.map((section, index) => (
              <section
                key={section.id}
                aria-labelledby={section.id}
                className="border-0 border-b border-solid border-sky-100 pb-6 pt-2 last:border-b-0"
              >
                <h2
                  id={section.id}
                  className="mb-2 mt-6 scroll-mt-[120px] text-2xl font-extrabold leading-tight text-[#12386e]"
                >
                  {index + 1}. {section.title}
                </h2>
                {section.blocks.map((block, blockIndex) => (
                  <Block key={blockIndex} block={block} />
                ))}
                {section.id === SETTINGS_LINK_SECTION && (
                  <Link
                    href={`/${locale}/settings?section=settings&tab=privacy#quyen-rieng-tu`}
                    className={`mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white no-underline transition hover:bg-primary-hover ${focusRing}`}
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Mở Cài đặt quyền riêng tư
                  </Link>
                )}
              </section>
            ))}

            <p className="mb-0 mt-8">
              <a
                href="#dau-trang"
                className={`inline-flex items-center gap-1.5 rounded-sm text-sm font-bold text-primary no-underline hover:underline ${focusRing}`}
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                Lên đầu trang
              </a>
            </p>
          </article>
        </div>
      </main>

      <LandingFooter locale={locale} isOutsideLanding />
    </div>
  );
}
