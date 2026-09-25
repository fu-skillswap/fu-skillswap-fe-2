/**
 * @file LandingFooter.tsx
 * @description Footer public của SkillSwap, chỉ sử dụng route hiện có.
 */

import Image from 'next/image';
import Link from 'next/link';
import { Mail, Play } from 'lucide-react';

export function LandingFooter({ locale }: { locale: string }) {
  const linkClassName =
    'w-fit text-[15px] leading-6 text-[#536a84] transition-colors duration-150 hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#eaf5ff]';
  const socialClassName =
    'grid h-11 w-11 place-items-center rounded-full border border-primary/35 bg-white/55 text-[#516984] sm:h-12 sm:w-12';

  return (
    <footer className="relative isolate overflow-hidden border-t border-primary/30 bg-[radial-gradient(circle_at_0%_100%,rgba(17,156,247,0.12),transparent_24%),radial-gradient(circle_at_100%_100%,rgba(17,156,247,0.11),transparent_26%),linear-gradient(180deg,#eff7ff_0%,#e7f3ff_100%)] before:pointer-events-none before:absolute before:-bottom-52 before:-left-48 before:-z-10 before:h-[360px] before:w-[360px] before:rounded-full before:bg-primary/[0.07] before:content-[''] after:pointer-events-none after:absolute after:-right-56 after:-bottom-60 after:-z-10 after:h-[430px] after:w-[430px] after:rounded-full after:bg-primary/[0.075] after:content-['']">
      <div className="relative z-10 mx-auto w-[calc(100%_-_40px)] max-w-[1480px] pt-12 sm:w-[calc(100%_-_48px)] sm:pt-14 md:grid md:grid-cols-[1.4fr_1fr_1fr] md:gap-y-10 lg:pt-16 xl:w-[calc(100%_-_96px)] xl:grid-cols-[1.65fr_0.85fr_0.85fr_0.85fr] xl:pt-[72px]">
        <div className="border-b border-[#12386e]/10 pb-8 md:border-b-0 md:pr-10 xl:pr-14">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={246}
            height={82}
            className="h-auto w-[200px] object-contain sm:w-[230px]"
          />
          <p className="mt-5 text-[17px] leading-7 font-bold text-[#12386e] sm:text-lg">
            Kết nối tri thức. Trao giá trị thật.
          </p>
          <p className="mt-3 max-w-[390px] text-sm leading-6 text-[#536a84] sm:text-[15px]">
            Kết nối mentor và mentee qua những trải nghiệm học tập linh hoạt.
          </p>
        </div>

        <nav
          aria-label="Sản phẩm"
          className="border-b border-[#12386e]/10 py-8 md:border-b-0 md:px-8 md:py-0 xl:border-l xl:border-[#12386e]/10 xl:pl-12"
        >
          <h2 className="text-[17px] leading-6 font-bold text-[#12386e] sm:text-lg">Sản phẩm</h2>
          <ul className="mt-5 grid gap-3.5">
            <li>
              <a href="#mentee" className={linkClassName}>
                Dành cho mentee
              </a>
            </li>
            <li>
              <a href="#mentor" className={linkClassName}>
                Dành cho mentor
              </a>
            </li>
            <li>
              <a href="#courses" className={linkClassName}>
                Khóa học ngắn
              </a>
            </li>
            <li>
              <a href="#pricing" className={linkClassName}>
                Bảng giá
              </a>
            </li>
          </ul>
        </nav>

        <nav
          aria-label="Hỗ trợ"
          className="border-b border-[#12386e]/10 py-8 md:border-b-0 md:pr-0 md:pl-8 md:py-0 xl:border-l xl:border-[#12386e]/10 xl:px-12"
        >
          <h2 className="text-[17px] leading-6 font-bold text-[#12386e] sm:text-lg">Hỗ trợ</h2>
          <ul className="mt-5 grid gap-3.5">
            <li>
              <a href="#faq" className={linkClassName}>
                Câu hỏi thường gặp
              </a>
            </li>
            <li>
              <Link href={`/${locale}/login`} className={linkClassName}>
                Đăng nhập
              </Link>
            </li>
            <li>
              <span className="text-[15px] leading-6 text-[#536a84]">Liên hệ</span>
            </li>
          </ul>
        </nav>

        <div className="py-8 md:col-span-3 md:py-0 xl:col-span-1 xl:border-l xl:border-[#12386e]/10 xl:pl-12">
          <h2 className="text-[17px] leading-6 font-bold text-[#12386e] sm:text-lg">Theo dõi</h2>
          <div className="mt-5 flex flex-wrap gap-3" aria-label="Mạng xã hội SkillSwap">
            <span
              className={`${socialClassName} text-xl font-bold`}
              role="img"
              aria-label="Facebook"
            >
              f
            </span>
            <span
              className={`${socialClassName} text-sm font-bold`}
              role="img"
              aria-label="LinkedIn"
            >
              in
            </span>
            <span className={socialClassName} role="img" aria-label="YouTube">
              <Play className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className={socialClassName} role="img" aria-label="Email">
              <Mail className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="col-span-full mt-1 border-t border-[#12386e]/15 md:mt-10 xl:mt-12" />
        <p className="col-span-full px-2 py-7 text-center text-[13px] leading-5 text-[#61758e] sm:py-8 sm:text-sm">
          © 2026 SkillSwap. Kết nối tri thức, phát triển kỹ năng.
        </p>
      </div>
    </footer>
  );
}
