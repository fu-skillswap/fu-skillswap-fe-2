/**
 * @file page.tsx
 * @description Google Calendar OAuth Callback Route (`/[locale]/mentor/google-calendar/callback`).
 */

import { Suspense } from 'react';
import { GoogleCalendarCallbackView } from '@/views/mentor/google-calendar/GoogleCalendarCallbackView';
import { Loader2 } from 'lucide-react';

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      }
    >
      <GoogleCalendarCallbackView />
    </Suspense>
  );
}
