/**
 * @file KouKouQuickActions.tsx
 * @description Các câu hỏi gợi ý cho trợ lý KouKou.
 */

import { CalendarDays, ChevronRight, Lightbulb, Search, WalletCards } from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Tìm mentor phù hợp với mục tiêu của mình', icon: Search },
  { label: 'Hướng dẫn cách đặt lịch với mentor', icon: CalendarDays },
  { label: 'Giải thích về S-coin và cách sử dụng', icon: WalletCards },
  { label: 'Gợi ý kỹ năng nên học dựa trên mục tiêu', icon: Lightbulb },
] as const;

type KouKouQuickActionsProps = { onSelect: (message: string) => void };

export function KouKouQuickActions({ onSelect }: KouKouQuickActionsProps) {
  return (
    <div className="grid gap-2" aria-label="Câu hỏi gợi ý">
      {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(label)}
          className="group flex min-h-11 w-full items-center gap-3 rounded-xl border border-border-color bg-white px-3 py-2 text-left text-xs font-medium text-text-secondary outline-none transition-colors duration-150 hover:border-primary-border hover:bg-primary-light/50 hover:text-text-main focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          <Icon className="h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 leading-snug">{label}</span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-text-disabled transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
