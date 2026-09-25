/**
 * @file Reveal.tsx
 * @description Hiệu ứng xuất hiện nhẹ khi nội dung landing page đi vào viewport.
 */

'use client';

import type { ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  return (
    <div
      className={className}
      data-aos="fade-up"
      data-aos-delay={delay}
      data-aos-duration="520"
      data-aos-once="true"
    >
      {children}
    </div>
  );
}
