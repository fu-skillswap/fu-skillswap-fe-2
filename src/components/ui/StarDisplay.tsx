/**
 * @file StarDisplay.tsx
 * @description Read-only 5-star rating, announced as one image ("Bạn đã chấm 4 trên 5 sao").
 */

import { Star } from 'lucide-react';

export const STAR_FILLED_CLASS = 'fill-amber-500 text-amber-600';
export const STAR_EMPTY_CLASS = 'fill-white text-slate-300';

interface StarDisplayProps {
  rating: number;
  /** Accessible name; defaults to "{rating} trên 5 sao". */
  label?: string;
  /** Icon size in px. */
  size?: number;
  className?: string;
}

export function StarDisplay({ rating, label, size = 16, className = '' }: StarDisplayProps) {
  return (
    <span
      role="img"
      aria-label={label ?? `${rating} trên 5 sao`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          strokeWidth={1.75}
          style={{ width: size, height: size }}
          className={value <= rating ? STAR_FILLED_CLASS : STAR_EMPTY_CLASS}
        />
      ))}
    </span>
  );
}
