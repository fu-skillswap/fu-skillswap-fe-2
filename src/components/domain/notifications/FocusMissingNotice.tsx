/**
 * @file FocusMissingNotice.tsx
 * @description Shown at the top of a page when the item a notification pointed to is gone.
 */

import { Info } from 'lucide-react';

export function FocusMissingNotice() {
  return (
    <p
      role="status"
      className="m-0 flex items-center gap-2.5 rounded-xl border border-solid border-primary-border bg-primary-light px-4 py-3 text-sm text-text-main"
    >
      <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      Mục này không còn nữa hoặc đã được cập nhật.
    </p>
  );
}
