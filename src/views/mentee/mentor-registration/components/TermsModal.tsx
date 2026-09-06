/**
 * @file TermsModal.tsx
 * @description Modal hiển thị điều khoản vận hành của SkillSwap cho Mentor.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowRight,
  Check,
  FileCheck2,
  Info,
  ShieldCheck,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

interface TermSection {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  rules: string[];
}

const termSections: TermSection[] = [
  {
    title: 'Quy định dành cho Mentor',
    subtitle: 'Trách nhiệm và cam kết khi tham gia giảng dạy trên SkillSwap',
    icon: UsersRound,
    rules: [
      'Mentor cam kết cung cấp thông tin trung thực, chính xác về trình độ chuyên môn, kinh nghiệm làm việc và kỹ năng hướng dẫn.',
      'Đảm bảo giữ đúng lịch hẹn và tư vấn nhiệt tình, văn minh với Mentee.',
    ],
  },
  {
    title: 'Quy trình Xác thực & Duyệt Hồ sơ',
    subtitle: 'Quy trình kiểm duyệt để đảm bảo chất lượng và an toàn',
    icon: FileCheck2,
    rules: [
      'Hồ sơ đăng ký làm Mentor sau khi gửi sẽ được Ban quản trị (Admin) kiểm tra và duyệt dựa trên các tiêu chuẩn chất lượng của nền tảng.',
      'Nền tảng có quyền từ chối hoặc tạm khóa quyền Mentor nếu phát hiện thông tin giả mạo hoặc vi phạm tiêu chuẩn cộng đồng.',
    ],
  },
  {
    title: 'Quyền sở hữu và Bảo mật',
    subtitle: 'Tôn trọng quyền riêng tư và sử dụng thông tin đúng mục đích',
    icon: ShieldCheck,
    rules: [
      'Tôn trọng và bảo mật thông tin cá nhân cũng như nội dung trao đổi giữa Mentor và Mentee.',
      'Không sử dụng thông tin của nền tảng cho mục đích lừa đảo, thương mại hóa trái phép.',
    ],
  },
];

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Điều khoản vận hành của SkillSwap"
      hideHeader
      disableScaleAnimation
      className="terms-modal !w-[calc(100vw-16px)] !max-w-[calc(100vw-16px)] !rounded-[20px] sm:!max-w-[1240px] lg:!rounded-[24px]"
      contentClassName="!overflow-hidden !p-0"
      overlayClassName="!overflow-hidden !p-2 sm:!p-4"
    >
      <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden lg:grid lg:grid-cols-[29fr_71fr]">
        <header className="relative shrink-0 border-b border-solid border-border-color bg-white px-4 py-3 pr-14 lg:hidden">
          <h2 className="m-0 max-w-[calc(100%-44px)] break-words text-[21px] font-extrabold leading-[1.2] tracking-[-0.025em] text-text-main">
            Điều khoản vận hành của SkillSwap
          </h2>
          <p className="mb-0 mt-1 text-[13px] leading-[1.4] text-text-secondary">
            Vui lòng đọc kỹ để đảm bảo trải nghiệm an toàn và minh bạch.
          </p>
          <IconButton
            icon={<X size={21} aria-hidden="true" />}
            aria-label="Đóng điều khoản"
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 !h-10 !w-10 !rounded-xl"
          />
        </header>

        <div className="terms-modal-mobile-scroll min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain lg:contents">
          <aside className="relative hidden overflow-hidden border-r border-solid border-border-color bg-primary-light/45 px-7 py-7 lg:block">
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5"
              aria-hidden="true"
            />
            <div className="relative z-10 flex h-full flex-col">
              <Image
                src="/images/SkillSwap_Logo_Text.png"
                alt="SkillSwap"
                width={220}
                height={72}
                className="h-[58px] w-[180px] object-cover object-center sm:h-[62px] sm:w-[195px]"
              />
              <div className="my-4 h-px w-full bg-primary/10" />
              <h2 className="m-0 max-w-[280px] text-[22px] font-extrabold leading-[1.35] tracking-[-0.02em] text-text-main sm:text-[25px]">
                Cùng xây dựng
                <br />
                môi trường học tập
                <br />
                an toàn và minh bạch
              </h2>
              <p className="mb-2 mt-3 max-w-[280px] text-sm leading-[1.5] text-text-secondary">
                Các điều khoản này giúp đảm bảo quyền lợi của bạn và cộng đồng trên SkillSwap.
              </p>
              <div className="mt-3 flex justify-center pt-1 lg:mt-auto lg:pt-2">
                <Image
                  src="/images/rule-pic.png"
                  alt="Kookoo nhắc nhở tuân thủ điều khoản SkillSwap"
                  width={270}
                  height={380}
                  className="terms-modal-mascot h-auto max-h-[220px] w-[160px] object-contain sm:max-h-[250px] sm:w-[185px] lg:max-h-[300px] lg:w-[220px] xl:w-[230px]"
                  priority
                />
              </div>
            </div>
          </aside>

          <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-x-hidden bg-white lg:overflow-hidden">
            <div className="hidden lg:block">
              <IconButton
                icon={<X size={22} aria-hidden="true" />}
                aria-label="Đóng điều khoản"
                variant="secondary"
                size="lg"
                onClick={onClose}
                className="absolute right-6 top-6 z-20 !h-10 !w-10 !rounded-xl"
              />
            </div>

            <div className="terms-modal-scroll min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden px-4 pb-3 pt-3 sm:px-5 lg:px-8 lg:pb-2 lg:pt-5">
              <header className="hidden pr-12 lg:block">
                <h2 className="m-0 text-[26px] font-extrabold leading-[1.15] tracking-[-0.025em] text-text-main sm:text-[29px]">
                  Điều khoản vận hành của SkillSwap
                </h2>
                <p className="mb-0 mt-1 text-sm leading-[1.4] text-text-secondary">
                  Vui lòng đọc kỹ các điều khoản dưới đây để đảm bảo trải nghiệm an toàn và minh
                  bạch.
                </p>
              </header>

              <div className="mb-3 flex justify-center lg:hidden">
                <Image
                  src="/images/rule-pic.png"
                  alt="Kookoo nhắc nhở tuân thủ điều khoản SkillSwap"
                  width={100}
                  height={120}
                  className="h-[104px] w-auto object-contain"
                  priority
                />
              </div>

              <div className="flex flex-col gap-2.5 lg:mt-4 lg:gap-3">
                {termSections.map((section, index) => {
                  const SectionIcon = section.icon;
                  return (
                    <section
                      key={section.title}
                      className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-solid border-border-color bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-base font-extrabold text-primary lg:h-11 lg:w-11 lg:text-lg">
                          {index + 1}
                        </span>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary lg:h-11 lg:w-11">
                          <SectionIcon size={21} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="m-0 break-words text-base font-bold leading-[1.25] text-text-main lg:text-[17px] lg:leading-[1.3]">
                            {section.title}
                          </h3>
                          <p className="mb-0 mt-0.5 text-[12.5px] leading-[1.35] text-text-muted sm:text-[13px]">
                            {section.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 rounded-xl bg-primary-light/65 p-3 lg:px-3.5 lg:py-2.5">
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                          {section.rules.map((rule) => (
                            <li
                              key={rule}
                              className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-text-secondary sm:text-sm lg:gap-3"
                            >
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                <Check size={15} strokeWidth={3} aria-hidden="true" />
                              </span>
                              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                                {rule}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <footer className="hidden shrink-0 border-t border-solid border-border-color bg-white px-6 py-3 lg:block">
              <div className="flex items-center justify-between gap-3">
                <div className="flex shrink-0 items-center gap-3 sm:max-w-[490px] sm:flex-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Info size={21} aria-hidden="true" />
                  </span>
                  <p className="m-0 hidden text-xs leading-relaxed text-text-secondary sm:block sm:text-[13px]">
                    Bằng việc tiếp tục sử dụng SkillSwap, bạn đồng ý tuân thủ tất cả các điều khoản
                    vận hành này.
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={onClose}
                  rightIcon={<ArrowRight size={19} aria-hidden="true" />}
                  className="min-w-0 flex-1 rounded-xl sm:w-[230px] sm:flex-none"
                >
                  Tôi đã hiểu
                </Button>
              </div>
            </footer>
          </div>
        </div>

        <footer className="terms-modal-mobile-footer shrink-0 border-t border-solid border-border-color bg-white px-3 pt-3 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
              <Info size={21} aria-hidden="true" />
            </span>
            <Button
              type="button"
              size="lg"
              onClick={onClose}
              rightIcon={<ArrowRight size={19} aria-hidden="true" />}
              className="min-w-0 flex-1 rounded-xl"
            >
              Tôi đã hiểu
            </Button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}
