/**
 * @file lookerEmbed.ts
 * @description Reads the Looker Studio report URL from NEXT_PUBLIC_LOOKER_EMBED_URL and derives
 * both the embed URL (for the iframe) and the normal report URL (for "Mở Looker Studio").
 */

export type LookerReportConfig =
  | { status: 'missing' }
  | { status: 'invalid'; value: string }
  | { status: 'ready'; embedUrl: string; reportUrl: string };

const LOOKER_HOSTS = new Set(['lookerstudio.google.com', 'datastudio.google.com']);

export function getLookerReportConfig(
  value = process.env.NEXT_PUBLIC_LOOKER_EMBED_URL,
): LookerReportConfig {
  const raw = value?.trim();
  if (!raw) return { status: 'missing' };
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !LOOKER_HOSTS.has(url.hostname)) {
      return { status: 'invalid', value: raw };
    }
    const embed = new URL(url);
    if (!embed.pathname.startsWith('/embed/')) embed.pathname = `/embed${embed.pathname}`;
    const report = new URL(url);
    report.pathname = report.pathname.replace(/^\/embed(?=\/)/, '');
    return { status: 'ready', embedUrl: embed.toString(), reportUrl: report.toString() };
  } catch {
    return { status: 'invalid', value: raw };
  }
}
