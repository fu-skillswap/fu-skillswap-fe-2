/**
 * @file SampleWallet.tsx
 * @description "Tiền về ví S-coin thế nào?" (#vi-scoin): a simulated mentor wallet with two real tabs
 * (local state, sample data only) next to the 3 steps for withdrawing.
 */

'use client';

import { ArrowDown, Plus } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Mascot, nextTabIndex } from '@/components/domain/landing/LandingPrimitives';
import {
  LANDING_SAMPLE_WALLET,
  WALLET_HOW_TO_STEPS,
  type SampleWalletEntry,
  type WalletStatusTone,
} from '@/components/domain/landing/becomeMentor.constants';
import { PUBLIC_CONTACT_EMAIL } from '@/constants/publicSite';

const WALLET_TABS = [
  { id: 'transactions', label: 'Giao dịch gần đây' },
  { id: 'withdrawals', label: 'Yêu cầu rút' },
] as const;

type WalletTabId = (typeof WALLET_TABS)[number]['id'];

const STATUS_TONE_CLASS: Record<WalletStatusTone, string> = {
  pending: 'bg-amber-100 text-amber-800',
  credited: 'bg-green-100 text-green-800',
  processing: 'bg-sky-100 text-sky-800',
  transferred: 'bg-slate-100 text-slate-600',
};

const WALLET_STATS = [
  { label: 'Có thể rút', value: LANDING_SAMPLE_WALLET.withdrawable },
  { label: 'Chờ xác nhận', value: LANDING_SAMPLE_WALLET.pending },
  { label: 'Yêu cầu đang xử lý', value: LANDING_SAMPLE_WALLET.openRequests },
] as const;

function WalletDemo() {
  const [tabId, setTabId] = useState<WalletTabId>('transactions');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const entries: readonly SampleWalletEntry[] = LANDING_SAMPLE_WALLET[tabId];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextTabIndex(event.key, index, WALLET_TABS.length);
    if (next === undefined) return;
    event.preventDefault();
    setTabId(WALLET_TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-[28px] border border-solid border-site-line bg-slate-50 p-4 font-site-body sm:p-5">
      <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[20px] bg-gradient-to-r from-sky-700 to-sky-600 px-6 py-[22px] text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-[60px] -right-10 h-[220px] w-[220px] rounded-full bg-white/10"
        />
        <p className="relative m-0">
          <span className="block text-[13.5px]">Số dư khả dụng</span>
          <b className="block font-site-ui text-[28px] leading-[1.15] font-extrabold sm:text-[34px]">
            {LANDING_SAMPLE_WALLET.available}
          </b>
          <span className="text-[12.5px]">Cập nhật trực tiếp sau mỗi buổi học</span>
        </p>
        <div aria-hidden="true" className="relative flex flex-wrap gap-2 font-site-ui text-sm">
          <span className="inline-flex min-h-[42px] items-center rounded-xl border-[1.5px] border-solid border-white/70 px-4 font-semibold">
            {LANDING_SAMPLE_WALLET.bankAccount}
          </span>
          <span className="inline-flex min-h-[42px] items-center rounded-xl bg-white px-4 font-bold text-sky-700">
            Rút tiền
          </span>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        {WALLET_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[14px] border border-solid border-site-line bg-white p-3.5"
          >
            <dt className="text-[11.5px] tracking-[0.03em] text-site-muted">{stat.label}</dt>
            <dd className="m-0 font-site-ui text-lg font-bold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-[18px] border border-solid border-site-line bg-white">
        <div
          role="tablist"
          aria-label="Lịch sử ví"
          className="flex gap-1.5 overflow-x-auto border-0 border-b border-solid border-slate-100 p-2.5"
        >
          {WALLET_TABS.map((tab, index) => {
            const isSelected = tab.id === tabId;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`landing-wallet-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="landing-wallet-panel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setTabId(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`min-h-11 shrink-0 cursor-pointer rounded-[10px] border-0 px-3.5 font-site-ui text-sm font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-site-bubble text-sky-700'
                    : 'bg-transparent text-site-muted hover:text-site-ink'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <ul
          id="landing-wallet-panel"
          role="tabpanel"
          aria-labelledby={`landing-wallet-tab-${tabId}`}
          className="m-0 list-none p-0"
        >
          {entries.map((entry) => {
            const isIncoming = entry.direction === 'in';
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 border-0 border-t border-solid border-slate-100 px-4 py-3 first:border-t-0"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                    isIncoming ? 'bg-green-100 text-green-800' : 'bg-site-bubble text-sky-700'
                  }`}
                >
                  {isIncoming ? (
                    <Plus className="h-4 w-4" strokeWidth={2.6} />
                  ) : (
                    <ArrowDown className="h-4 w-4" strokeWidth={2.6} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm font-semibold text-slate-900">
                    {entry.title}
                  </b>
                  <span className="text-[12.5px] text-site-muted">{entry.time}</span>
                </span>
                <span className="shrink-0 text-right">
                  <b
                    className={`block font-site-ui text-sm whitespace-nowrap ${
                      isIncoming ? 'text-green-800' : 'text-site-body'
                    }`}
                  >
                    {entry.amount}
                  </b>
                  <span
                    className={`mt-[3px] inline-block rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${STATUS_TONE_CLASS[entry.tone]}`}
                  >
                    {entry.status}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function SampleWallet() {
  return (
    <div id="vi-scoin" className="flex scroll-mt-6 flex-col gap-6">
      <div>
        <h3 className="m-0 mb-1.5 font-site-ui text-[22px] font-bold text-site-ink sm:text-[26px]">
          Tiền về ví S-coin thế nào?
        </h3>
        <p className="m-0 font-site-body text-[15.5px] text-site-muted">
          Ví mẫu của một mentor sau 2 tuần chia sẻ. Bấm thử hai tab.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <WalletDemo />
        <ol className="m-0 flex list-none flex-col gap-3 p-0 font-site-body">
          {WALLET_HOW_TO_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3.5 rounded-[20px] bg-site-tint px-5 py-[18px]"
            >
              <span
                aria-hidden="true"
                className="w-6 shrink-0 font-site-display text-[26px] leading-none font-black text-site-blue"
              >
                {index + 1}
              </span>
              <span>
                <b className="block font-site-ui text-site-ink">{step.title}</b>
                <span className="text-sm leading-[21px] text-site-muted">{step.description}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center gap-3 rounded-[20px] border border-dashed border-site-sky bg-white px-5 py-4">
            <Mascot variant="icon" width={40} />
            <span className="min-w-0 text-sm leading-[21px] text-site-body">
              Cần đối chiếu một giao dịch? Hỏi KooKoo AI hoặc gửi mã giao dịch về{' '}
              <a
                href={`mailto:${PUBLIC_CONTACT_EMAIL}`}
                className="font-semibold break-all text-site-blue hover:text-site-navy"
              >
                {PUBLIC_CONTACT_EMAIL}
              </a>
              .
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
