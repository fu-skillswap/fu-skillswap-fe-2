/**
 * @file featureFlags.ts
 * @description Cờ bật/tắt các tính năng giao diện đang chờ API.
 */

/**
 * "AI gắn cờ" tab on the admin reports page and its sidebar link.
 * TODO(api): GET /api/admin/moderation/queue?decision=review — enable once the endpoint exists.
 */
export const AI_FLAGGED_ENABLED = false;
