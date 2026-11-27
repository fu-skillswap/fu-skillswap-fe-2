/**
 * @file PolicyDialog.tsx
 * @description Hộp thoại xem Điều khoản sử dụng, Chính sách hủy & hoàn tiền và Chính sách bảo mật
 * ngay trên trang thanh toán, để người dùng đọc mà không rời trang (không mất mã giảm giá đã nhập).
 */

'use client';

import { Modal } from '@/components/ui/Modal';
import { PRIVACY_POLICY_META, PRIVACY_SECTIONS } from '@/constants/privacyPolicy';
import { TERMS_SECTIONS, buildRefundSections, type LegalSection } from '@/constants/termsOfUse';
import type { BookingCancellationRefundPolicy } from '@/models/auth';
import { LegalBlock } from '@/views/legal/LegalBlock';
import { ExternalLink, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef } from 'react';

export type PolicyKind = 'terms' | 'refund' | 'privacy';

const TABS: Array<{ kind: PolicyKind; label: string }> = [
  { kind: 'terms', label: 'Điều khoản sử dụng' },
  { kind: 'refund', label: 'Chính sách hủy & hoàn tiền' },
  { kind: 'privacy', label: 'Chính sách bảo mật' },
];

const SUBTITLES: Record<PolicyKind, string> = {
  terms: 'Quy định chung khi bạn dùng SkillSwap và đặt lịch với mentor.',
  refund: 'Mức hoàn tiền dưới đây áp dụng cho chính lịch hẹn bạn đang thanh toán.',
  privacy: `Cập nhật ${PRIVACY_POLICY_META.updatedAt}. SkillSwap thu thập dữ liệu gì và dùng để làm gì.`,
};

export function PolicyDialog({
  kind,
  refundPolicy,
  privacyHref,
  onChange,
  onClose,
}: {
  kind: PolicyKind | null;
  refundPolicy?: BookingCancellationRefundPolicy | null;
  privacyHref: string;
  onChange: (kind: PolicyKind) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const sections = useMemo<LegalSection[]>(() => {
    if (kind === 'refund') return buildRefundSections(refundPolicy);
    if (kind === 'privacy') return PRIVACY_SECTIONS;
    return TERMS_SECTIONS;
  }, [kind, refundPolicy]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [kind]);

  const active = TABS.find((tab) => tab.kind === kind) ?? TABS[0];

  return (
    <Modal
      open={kind !== null}
      onClose={onClose}
      hideHeader
      labelledBy={titleId}
      className="!max-w-3xl"
      contentClassName="!p-0 flex min-h-0 flex-col"
    >
      <header className="shrink-0 border-0 border-b border-solid border-border-color px-5 pb-0 pt-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 text-xl font-extrabold text-text-main">
              {active.label}
            </h2>
            <p className="mb-0 mt-1 text-sm text-text-secondary">{SUBTITLES[active.kind]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-main"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Các văn bản" className="-mb-px mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const selected = tab.kind === active.kind;
            return (
              <button
                key={tab.kind}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => onChange(tab.kind)}
                className={`cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3 py-2.5 text-sm font-bold ${
                  selected
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-main'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div
        ref={bodyRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-2 text-[15px] leading-7 text-text-main sm:px-7"
      >
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`${titleId}-${section.id}`}>
            <h3
              id={`${titleId}-${section.id}`}
              className="mb-0 mt-5 text-base font-extrabold text-text-main"
            >
              {section.title}
            </h3>
            {section.blocks.map((block, index) => (
              <LegalBlock key={index} block={block} />
            ))}
          </section>
        ))}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-border-color px-5 py-4 sm:px-7">
        {active.kind === 'privacy' ? (
          <a
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
          >
            Mở trang đầy đủ <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 cursor-pointer rounded-xl border-0 bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          Đã hiểu
        </button>
      </footer>
    </Modal>
  );
}
