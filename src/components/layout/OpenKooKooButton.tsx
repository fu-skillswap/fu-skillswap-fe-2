/**
 * @file OpenKooKooButton.tsx
 * @description Button that opens the floating KooKoo widget mounted on the current page.
 */

'use client';

import type { ReactNode } from 'react';
import { openKouKou } from '@/components/domain/ai-chat/openKouKou';

export function OpenKooKooButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={openKouKou} className={className}>
      {children}
    </button>
  );
}
