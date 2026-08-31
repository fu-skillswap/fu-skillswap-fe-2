/**
 * @file SkillSwapToast.tsx
 * @description Giao diện toast thống nhất cho toàn bộ SkillSwap.
 */

'use client';

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';

export type SkillSwapToastType = 'success' | 'error' | 'warning' | 'info';

interface SkillSwapToastProps {
  id: string;
  type: SkillSwapToastType;
  title: string;
  description?: string;
  visible: boolean;
}

const icons = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

const typeStyles: Record<SkillSwapToastType, { bg: string; border: string; iconColor: string }> = {
  success: { bg: 'bg-white', border: 'border-emerald-200', iconColor: 'text-success' },
  error: { bg: 'bg-white', border: 'border-red-200', iconColor: 'text-danger' },
  warning: { bg: 'bg-white', border: 'border-amber-200', iconColor: 'text-warning' },
  info: { bg: 'bg-white', border: 'border-blue-200', iconColor: 'text-primary' },
};

export function SkillSwapToast({ id, type, title, description, visible }: SkillSwapToastProps) {
  const Icon = icons[type];
  const isAssertive = type === 'error';

  return (
    <article
      className={`flex items-start gap-3 p-3.5 rounded-xl border border-solid shadow-lg max-w-md w-full transition-all duration-200 ${typeStyles[type].bg} ${typeStyles[type].border}`}
      data-visible={visible}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <Icon className={`w-5 h-5 shrink-0 ${typeStyles[type].iconColor} mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <strong className="block text-xs font-bold text-text-main">{title}</strong>
        {description && <p className="text-[11px] text-text-secondary mt-0.5 m-0 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => toast.dismiss(id)}
        className="shrink-0 p-1 text-text-muted hover:text-text-main rounded-md hover:bg-surface-subtle transition-colors border-none bg-transparent cursor-pointer"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </article>
  );
}
