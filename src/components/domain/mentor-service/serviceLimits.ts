/**
 * @file serviceLimits.ts
 * @description Single source of truth for mentor service text/cover limits.
 * Backend still allows title 200 / description 1000 / expectedOutcome 1000; these stricter
 * limits are frontend-only so every service card on the profile takes the same space.
 */

export const TITLE_MAX = 60;
export const INTRO_MAX = 120;
export const AUDIENCE_MAX_COUNT = 3;
export const AUDIENCE_ITEM_MAX = 24;
export const ITEMS_MIN = 2;
export const ITEMS_MAX = 5;
export const ITEM_MAX = 80;
export const ITEMS_SHOWN_ON_CARD = 3;
export const OUTCOME_MAX = 140;

export const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const COVER_MAX_BYTES = 2 * 1024 * 1024;
export const COVER_RATIO = 16 / 9;
/** Backend limit for the upload-intent `filename` field. */
export const COVER_FILENAME_MAX = 180;

/** Counts user-visible characters after trim (a Vietnamese letter with diacritics counts as 1). */
export function countChars(value: string): number {
  return [...value.trim()].length;
}

/** Counter tone: neutral, amber at >= 90% of the limit, red when over. */
export type CounterTone = 'neutral' | 'warning' | 'error';

export function counterTone(length: number, max: number): CounterTone {
  if (length > max) return 'error';
  if (length >= Math.ceil(max * 0.9)) return 'warning';
  return 'neutral';
}
