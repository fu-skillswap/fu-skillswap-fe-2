/**
 * @file AosInitializer.tsx
 * @description Khởi tạo AOS một lần cho các hiệu ứng cuộn trên landing page.
 */

'use client';

import AOS from 'aos';
import { useEffect } from 'react';

let hasInitializedAos = false;

export function AosInitializer() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasInitializedAos) {
      AOS.init({
        disable: prefersReducedMotion,
        duration: 520,
        easing: 'ease-out-cubic',
        offset: 32,
        once: true,
      });
      hasInitializedAos = true;
    }

    const refreshAos = () => AOS.refreshHard();
    const animationFrame = window.requestAnimationFrame(refreshAos);
    window.addEventListener('load', refreshAos);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('load', refreshAos);
    };
  }, []);

  return null;
}
