/**
 * @file LandingPrimitives.tsx
 * @description Small building blocks shared by the public landing sections and the site footer:
 * section headline with one highlighted phrase, KooKoo mascot images, speech bubble, Google icon.
 */

import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

/** Shared page gutter: 16px on phones, 24px from `sm`, content capped at 1240px. */
export const SITE_CONTAINER = 'mx-auto w-full max-w-[1240px] px-4 sm:px-6';

export const SITE_HEADLINE =
  'm-0 font-site-display text-[clamp(32px,3.6vw,48px)] leading-[1.02] font-black text-site-ink uppercase';

/** Primary pill link/button (action blue). */
export const SITE_PILL_PRIMARY =
  'inline-flex min-h-14 items-center justify-center rounded-full bg-site-blue px-8 font-site-ui text-[17px] font-bold whitespace-nowrap text-white no-underline shadow-site-cta transition-colors hover:bg-site-blue-hover';

/** The single highlighted phrase of a headline. */
export function Highlight({ children }: { children: ReactNode }) {
  return <span className="text-site-blue">{children}</span>;
}

const MASCOT_SOURCES = {
  // Full-body KooKoo for the large illustrations.
  full: { src: '/images/mascot/kookoo.png', width: 491, height: 700 },
  // Top half, used where KooKoo "peeks" over an edge.
  peek: { src: '/images/mascot/kookoo-peek.png', width: 700, height: 618 },
  // Existing chat-widget avatar, reused for small icon sizes (already cached by the widget).
  icon: { src: '/images/Koko.png', width: 1500, height: 1500 },
} as const;

interface MascotProps {
  variant?: keyof typeof MASCOT_SOURCES;
  /** Rendered width in px (height follows the aspect ratio); a `w-*` class overrides it. */
  width: number;
  className?: string;
  style?: CSSProperties;
  /** Above-the-fold illustrations load eagerly; everything else is lazy. */
  eager?: boolean;
}

/** Decorative KooKoo illustration: always `alt=""` and hidden from assistive tech. */
export function Mascot({ variant = 'full', width, className = '', style, eager }: MascotProps) {
  const source = MASCOT_SOURCES[variant];
  const height = Math.round((width * source.height) / source.width);
  return (
    <Image
      src={source.src}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      // `/_next/image` returns the original file on this Cloudflare build, so serve it directly.
      unoptimized
      loading={eager ? 'eager' : 'lazy'}
      draggable={false}
      className={`pointer-events-none h-auto shrink-0 select-none ${className}`}
      style={style}
    />
  );
}

interface SpeechBubbleProps {
  children: ReactNode;
  /** Side the tail points to (towards KooKoo). */
  tail?: 'right' | 'bottom-left' | 'none';
  className?: string;
}

export function SpeechBubble({ children, tail = 'none', className = '' }: SpeechBubbleProps) {
  return (
    <p
      className={`relative m-0 rounded-[18px] border-[1.5px] border-solid border-site-chip-border bg-white px-3.5 py-3 font-site-ui text-sm leading-5 font-semibold text-site-ink shadow-site-soft ${className}`}
    >
      {children}
      {tail !== 'none' && (
        <span
          aria-hidden="true"
          className={`absolute h-3.5 w-3.5 border-0 border-r-[1.5px] border-b-[1.5px] border-solid border-site-chip-border bg-white ${
            tail === 'right'
              ? '-right-2 bottom-[18px] -rotate-45'
              : 'bottom-[-8px] left-10 rotate-45'
          }`}
        />
      )}
    </p>
  );
}

export function GoogleIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}
