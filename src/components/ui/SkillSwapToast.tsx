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

export function SkillSwapToast({ id, type, title, description, visible }: SkillSwapToastProps) {
  const Icon = icons[type];
  const isAssertive = type === 'error';

  return (
    <article
      className={`skillswap-toast skillswap-toast-${type}`}
      data-visible={visible}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <Icon className="skillswap-toast-icon" aria-hidden="true" />
      <div className="skillswap-toast-content">
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      <button type="button" aria-label="Đóng thông báo" onClick={() => toast.dismiss(id)}>
        <X aria-hidden="true" />
      </button>
    </article>
  );
}
