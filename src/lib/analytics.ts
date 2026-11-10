/**
 * @file analytics.ts
 * @description Thin wrapper around the site-wide Google tag (`gtag`).
 * Every call is a no-op when NEXT_PUBLIC_GOOGLE_TAG_ID is not set (local dev) or on the server,
 * and never throws (e.g. when the tag is blocked by an ad blocker).
 *
 * Privacy: event params are typed per event so no PII (email, name, phone, user ids) can be sent.
 */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** Every custom event and the only params it may carry. */
export interface AnalyticsEvents {
  sign_up: { method: 'google' | 'email' };
  login: { method: 'google' | 'email' };
  booking_created: { subject: string };
  booking_cancelled: { by: 'mentor' | 'mentee' };
  booking_rejected: undefined;
  mentor_apply: undefined;
}

type EventName = keyof AnalyticsEvents;
type EventArgs<E extends EventName> = AnalyticsEvents[E] extends undefined
  ? []
  : [params: AnalyticsEvents[E]];

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
/** GA4 drops event param values longer than 100 characters. */
const PARAM_VALUE_MAX = 100;

/**
 * Returns `window.gtag`, defining the standard shim first if the tag script has not loaded yet,
 * so early calls are queued as `arguments` objects (the only shape the Google tag processes).
 */
function getGtag(): Gtag | null {
  if (!GOOGLE_TAG_ID || typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- the Google tag only reads `arguments`
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

function cleanParams(params: Record<string, unknown> | undefined) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim().slice(0, PARAM_VALUE_MAX) : value,
    ]),
  );
}

/** Sends a custom GA4 event. Call only after the related API request succeeded. */
export function track<E extends EventName>(event: E, ...args: EventArgs<E>): void {
  try {
    const params = cleanParams(args[0] as Record<string, unknown> | undefined);
    getGtag()?.('event', event, ...(params ? [params] : []));
  } catch {
    /* Analytics must never break the app. */
  }
}

let internalTrafficMarked = false;

/** Tags this browser's hits as internal (admin) traffic so GA filters can exclude them. */
export function markInternalTraffic(): void {
  if (internalTrafficMarked) return;
  try {
    const gtag = getGtag();
    if (!gtag) return;
    gtag('set', { traffic_type: 'internal' });
    internalTrafficMarked = true;
  } catch {
    /* Analytics must never break the app. */
  }
}
