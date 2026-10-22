/**
 * @file publicSite.ts
 * @description Routes and external links used by the public site (landing, policy pages, footer).
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';

// TODO(link): set the official SkillSwap fanpage URL (env NEXT_PUBLIC_FACEBOOK_URL). The icon is
// hidden while this is empty so we never ship a dead link.
export const FANPAGE_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || '';

export const PUBLIC_CONTACT_EMAIL = SKILLSWAP_CONTACT_EMAIL;

/**
 * Public routes, as paths after `/${locale}` (or a landing anchor). `null` means the page does not
 * exist yet: the footer renders that label as plain text until a route is set.
 */
export const PUBLIC_ROUTES = {
  home: '',
  login: '/login',
  findMentor: '/mentor-booking',
  mentorRegistration: '/mentor-registration',
  communityBoard: '/dashboard',
  blog: '/blog',
  privacy: '/chinh-sach-bao-mat',
  accountDeletion: '/chinh-sach-bao-mat#xoa-tai-khoan',
  bookingGuide: '#cach-hoat-dong',
  sCoinFaq: '#faq',
  koukou: '#koukou',
  // TODO(route): help center page.
  helpCenter: null,
  // TODO(route): terms of use page.
  terms: null,
  // TODO(route): booking & cancellation policy page.
  bookingPolicy: null,
  // TODO(route): rules for mentors page.
  mentorRules: null,
} as const satisfies Record<string, string | null>;

export type PublicRouteKey = keyof typeof PUBLIC_ROUTES;

/** Resolves a public route to an href, or `null` when the page does not exist yet. */
export function publicHref(locale: string, key: PublicRouteKey): string | null {
  const path: string | null = PUBLIC_ROUTES[key];
  if (path === null) return null;
  return `/${locale}${path}`;
}

/** Find-mentor URL, optionally with the `?q=` keyword the search page reads. */
export function findMentorHref(locale: string, query?: string): string {
  const base = `/${locale}${PUBLIC_ROUTES.findMentor}`;
  const keyword = query?.trim();
  return keyword ? `${base}?q=${encodeURIComponent(keyword)}` : base;
}
