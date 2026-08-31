/**
 * @file AdminLoadingState.tsx
 * @description Trạng thái chờ đồng nhất cho các màn hình quản trị.
 */

import { LoaderCircle } from 'lucide-react';

export function AdminLoadingState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6" role="status" aria-live="polite">
      <div className="bg-white p-8 rounded-3xl border border-solid border-border-light shadow-xl flex flex-col items-center text-center gap-3 max-w-sm w-full">
        <img src="/images/SkillSwapLogo.png" alt="SkillSwap" className="h-10 w-auto object-contain mb-1" />
        <LoaderCircle aria-hidden="true" className="w-7 h-7 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-main m-0">{message}</p>
        <span className="text-xs text-text-muted">Vui lòng chờ trong giây lát</span>
      </div>
    </main>
  );
}
