/**
 * @file useScheduleManage.ts
 * @description Custom React Hook quản lý khung thời gian rảnh của Mentor (Schedule Management Hook).
 */

"use client";

import { useState } from "react";

/**
 * Hook quản lý danh sách khung giờ mở lịch giảng dạy/tư vấn của Mentor.
 */
export function useScheduleManage() {
  const [available, setAvailable] = useState([
    "20/08/2026 · 09:00",
    "21/08/2026 · 14:00",
  ]);

  /** Thêm một slot khung giờ rảnh mới */
  const addSlot = (slot: string) => setAvailable((slots) => [...slots, slot]);

  /** Xóa một slot khung giờ rảnh */
  const removeSlot = (slot: string) =>
    setAvailable((slots) => slots.filter((item) => item !== slot));

  return { available, addSlot, removeSlot };
}
