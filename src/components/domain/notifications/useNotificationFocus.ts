/**
 * @file useNotificationFocus.ts
 * @description Landing on the item a notification is about: read `?focus=`, scroll the element
 * into view, outline it with "Mở từ thông báo" for ~2 s, move keyboard focus to its heading, then
 * drop the param so a refresh doesn't highlight again.
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { FOCUS_PARAM } from './notificationTargets';

const HIGHLIGHT_MS = 2000;
const MAX_WAIT_FRAMES = 30;

/** The `?focus=` value and a way to remove it (keeps the other params, no scroll jump). */
export function useFocusParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focusId = searchParams.get(FOCUS_PARAM) ?? undefined;

  const clearFocus = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(FOCUS_PARAM)) return;
    params.delete(FOCUS_PARAM);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [pathname, router]);

  return { focusId, clearFocus };
}

/**
 * Highlights `elementId` once it is rendered and `ready` is true, then calls `onDone`.
 * Runs once per element id.
 */
export function useHighlightElement(
  elementId: string | undefined,
  ready: boolean,
  onDone?: () => void,
) {
  const doneForRef = useRef<string | undefined>(undefined);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    // Focus cleared: the same item may be opened from a notification again later.
    if (!elementId) doneForRef.current = undefined;
    if (!elementId || !ready || doneForRef.current === elementId) return;
    let frame = 0;
    let frames = 0;
    let timer: number | undefined;

    const run = () => {
      const element = document.getElementById(elementId);
      if (!element) {
        // The item may render a frame later (tab switch, list growth).
        if (frames++ < MAX_WAIT_FRAMES) frame = window.requestAnimationFrame(run);
        return;
      }
      doneForRef.current = elementId;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      element.setAttribute('data-notification-focus', '');
      const heading = element.querySelector<HTMLElement>('h1, h2, h3, h4') ?? element;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      timer = window.setTimeout(
        () => element.removeAttribute('data-notification-focus'),
        HIGHLIGHT_MS,
      );
      onDoneRef.current?.();
    };

    frame = window.requestAnimationFrame(run);
    return () => {
      window.cancelAnimationFrame(frame);
      // Keep the timer: the outline must still go away if the page re-renders meanwhile.
      if (timer && doneForRef.current !== elementId) window.clearTimeout(timer);
    };
  }, [elementId, ready]);
}
