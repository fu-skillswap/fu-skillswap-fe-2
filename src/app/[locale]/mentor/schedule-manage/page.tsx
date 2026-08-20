/**
 * @file page.tsx
 * @description Route Quản lý lịch rảnh Mentor (`/[locale]/mentor/schedule-manage`).
 * Render giao diện `ScheduleManageView`.
 */

import { ScheduleManageView } from "@/views/mentor/schedule-manage/ScheduleManageView";

/**
 * Server Component cho trang Quản lý lịch dạy/tư vấn Mentor.
 */
export default function ScheduleManagePage() {
  return <ScheduleManageView />;
}
