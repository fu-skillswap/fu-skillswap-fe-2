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
 * Mentor coupon opt-in on "Dịch vụ & Lịch dạy" (apply / change / stop a SkillSwap-funded coupon per
 * service), the matching admin scope option and the service-detail source of truth.
 * Off, or the offers endpoint missing → every page renders exactly as before.
 * TODO(api): GET /api/me/mentor/coupon-offers and PUT /api/me/mentor/coupon-offers/{couponId}/services
 * — enable once both are deployed.
 */
export const MENTOR_COUPON_OPTIN_ENABLED = false;
