/**
 * @file AdminLoadingState.tsx
 * @description Trạng thái chờ đồng nhất cho các màn hình quản trị.
 */

import { LoaderCircle } from 'lucide-react';

export function AdminLoadingState({ message }: { message: string }) {
  return (
    <main className="admin-loading-state" role="status" aria-live="polite">
      <div className="admin-loading-card">
        <img src="/images/SkillSwapLogo.png" alt="SkillSwap" />
        <LoaderCircle aria-hidden="true" className="admin-loading-spinner" />
        <p>{message}</p>
        <span>Vui lòng chờ trong giây lát</span>
      </div>
    </main>
  );
}
