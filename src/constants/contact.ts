/**
 * @file contact.ts
 * @description Cấu hình kênh liên hệ và mạng xã hội công khai của SkillSwap.
 */

/** Official SkillSwap contact mailbox (single source of truth for UI copy). */
export const SKILLSWAP_CONTACT_EMAIL = 'skillswapvn.contact@gmail.com';

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || SKILLSWAP_CONTACT_EMAIL;

// TODO: Điền URL mạng xã hội thật qua các biến môi trường tương ứng.
const configuredSocialLinks = [
  {
    platform: 'facebook',
    label: 'Facebook',
    url: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    url: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    url: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
  },
] as const;

export const SOCIAL_LINKS = configuredSocialLinks.filter(({ url }) => Boolean(url));
