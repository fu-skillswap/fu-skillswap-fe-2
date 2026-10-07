/**
 * @file url.ts
 * @description Tiện ích xử lý URL dùng chung.
 */

/**
 * Returns the URL only when a browser can open it (http/https). Storage references such as
 * `private://bucket/key` returned by the API are not viewable and yield `undefined`.
 */
export function browsableUrl(url?: string | null): string | undefined {
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}
