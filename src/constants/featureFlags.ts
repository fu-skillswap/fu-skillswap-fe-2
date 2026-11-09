/**
 * @file featureFlags.ts
 * @description Cờ bật/tắt các tính năng giao diện đang chờ API.
 */

/**
 * "AI gắn cờ" tab on the admin reports page and its sidebar link.
 * TODO(api): GET /api/admin/moderation/queue?decision=review — enable once the endpoint exists.
 */
export const AI_FLAGGED_ENABLED = false;

/**
 * Mentor-side "coupons for my services" view.
 * TODO(api): GET /api/me/mentor/coupons — enable once the endpoint exists.
 */
export const MENTOR_COUPONS_ENABLED = false;

/**
 * Suggested/usable coupons list on the mentee checkout screen (manual code entry works without it).
 * TODO(api): GET /api/me/coupons?bookingId= — enable once the endpoint exists.
 */
export const MENTEE_COUPON_SUGGESTIONS_ENABLED = false;
