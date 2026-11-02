/**
 * @file AuthLayout.tsx
 * @description Shared two-column shell for the login, register and verify-email screens:
 * the auth card on the left (first on mobile) and the same honest pitch on the right.
 */

import { Be_Vietnam_Pro, Montserrat } from 'next/font/google';
import Image from 'next/image';
import { AuthPitch } from './AuthPitch';
import styles from './Auth.module.css';

const displayFont = Montserrat({
  weight: '800',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-auth-display',
});

const labelFont = Be_Vietnam_Pro({
  weight: '600',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-auth-label',
});

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${styles.page} ${displayFont.variable} ${labelFont.variable}`}>
      <div className={styles.column}>{children}</div>
      <div className={styles.column}>
        <AuthPitch />
      </div>
      <svg
        className={styles.wave}
        viewBox="0 0 720 260"
        preserveAspectRatio="xMaxYMax meet"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M0 260C120 190 250 150 390 160C520 170 610 120 720 40V260H0Z"
          fill="#a8d8fc"
          fillOpacity="0.35"
        />
        <path
          d="M140 260C260 210 370 196 490 204C590 210 660 180 720 140V260H140Z"
          fill="#e0effc"
        />
      </svg>
    </main>
  );
}

/** White card holding one auth screen. Every screen starts with the SkillSwap logo. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.card}>
      <Image
        src="/images/SkillSwap_Logo_Text.png"
        alt="SkillSwap"
        width={360}
        height={128}
        priority
        className={styles.logo}
      />
      {children}
    </section>
  );
}
