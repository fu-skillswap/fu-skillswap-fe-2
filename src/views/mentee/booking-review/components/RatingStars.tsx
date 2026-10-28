/**
 * @file RatingStars.tsx
 * @description Large 1–5 star picker following the radiogroup pattern: one tab stop, arrow keys
 * move and select, hover previews, live word label next to the stars.
 */

'use client';

import { Star } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import { STAR_EMPTY_CLASS, STAR_FILLED_CLASS } from '@/components/ui/StarDisplay';
import {
  RATING_EMPTY_LABEL,
  RATING_WORDS,
  REVIEW_MAX_STARS,
  starAriaLabel,
} from '../review.constants';

export interface RatingStarsHandle {
  /** Focuses the selected star, or the first one when none is selected. */
  focus: () => void;
}

interface RatingStarsProps {
  value: number;
  onChange: (rating: number) => void;
  /** Id of the visible question that names the group. */
  labelledBy: string;
  describedBy?: string;
}

const STARS = Array.from({ length: REVIEW_MAX_STARS }, (_, index) => index + 1);

export const RatingStars = forwardRef<RatingStarsHandle, RatingStarsProps>(function RatingStars(
  { value, onChange, labelledBy, describedBy },
  ref,
) {
  const [hovered, setHovered] = useState(0);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hovered || value;
  const tabStop = value || 1;

  useImperativeHandle(ref, () => ({ focus: () => starRefs.current[tabStop - 1]?.focus() }), [
    tabStop,
  ]);

  const select = (rating: number) => {
    onChange(rating);
    starRefs.current[rating - 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, rating: number) => {
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? (rating % REVIEW_MAX_STARS) + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? ((rating + REVIEW_MAX_STARS - 2) % REVIEW_MAX_STARS) + 1
          : event.key === 'Home'
            ? 1
            : event.key === 'End'
              ? REVIEW_MAX_STARS
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="flex"
        onMouseLeave={() => setHovered(0)}
      >
        {STARS.map((rating) => (
          <button
            key={rating}
            ref={(node) => {
              starRefs.current[rating - 1] = node;
            }}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={starAriaLabel(rating)}
            tabIndex={rating === tabStop ? 0 : -1}
            onClick={() => select(rating)}
            onKeyDown={(event) => handleKeyDown(event, rating)}
            onMouseEnter={() => setHovered(rating)}
            className="inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border-0 bg-transparent transition-transform outline-none hover:scale-105 focus-visible:ring-4 focus-visible:ring-primary/30 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <Star
              aria-hidden="true"
              strokeWidth={1.6}
              className={`h-10 w-10 ${rating <= shown ? STAR_FILLED_CLASS : STAR_EMPTY_CLASS}`}
            />
          </button>
        ))}
      </div>
      <span aria-live="polite" className="min-w-[9rem] text-sm font-bold text-text-main">
        {shown ? RATING_WORDS[shown - 1] : RATING_EMPTY_LABEL}
      </span>
    </div>
  );
});
