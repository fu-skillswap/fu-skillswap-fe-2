/**
 * @file LandingFooter.tsx
 * @description Footer public của SkillSwap, chỉ sử dụng route hiện có.
 */

import Image from 'next/image';
import Link from 'next/link';

export function LandingFooter({ locale }: { locale: string }) {
  return (
    <footer className="border-t border-border-light bg-white">
      <div className="mx-auto grid max-w-[1220px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-7">
        <div>
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={174}
            height={58}
            className="h-12 w-[162px] object-cover object-center"
          />
          <p className="mt-3 max-w-xs text-xs leading-5 text-text-muted">
            Kết nối tri thức. Trao giá trị thật.
          </p>
        </div>
        <nav aria-label="Sản phẩm">
          <h2 className="text-xs font-bold text-[#102a56]">Sản phẩm</h2>
          <ul className="mt-4 grid gap-2.5 text-xs text-text-muted">
            <li>
              <a href="#mentee" className="hover:text-primary">
                Dành cho mentee
              </a>
            </li>
            <li>
              <a href="#mentor" className="hover:text-primary">
                Dành cho mentor
              </a>
            </li>
            <li>
              <a href="#courses" className="hover:text-primary">
                Khóa học ngắn
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-primary">
                Bảng giá
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Hỗ trợ">
          <h2 className="text-xs font-bold text-[#102a56]">Hỗ trợ</h2>
          <ul className="mt-4 grid gap-2.5 text-xs text-text-muted">
            <li>
              <a href="#faq" className="hover:text-primary">
                Câu hỏi thường gặp
              </a>
            </li>
            <li>
              <Link href={`/${locale}/login`} className="hover:text-primary">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border-light px-5 py-5 text-center text-[11px] text-text-muted">
        © 2026 SkillSwap. Kết nối tri thức, phát triển kỹ năng.
      </div>
    </footer>
  );
}
