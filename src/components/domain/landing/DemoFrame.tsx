/**
 * @file DemoFrame.tsx
 * @description Khung nhận diện và vô hiệu hóa tương tác cho nội dung minh họa trên landing page.
 */

import type { ReactNode } from 'react';

interface DemoFrameProps {
  children: ReactNode;
}

export function DemoFrame({ children }: DemoFrameProps) {
  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none relative w-full cursor-default select-none"
    >
      {children}
    </div>
  );
}
