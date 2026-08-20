/**
 * @file useBookingCalendar.ts
 * @description Custom hook quản lý trạng thái chọn khung giờ khả dụng trong lịch đặt hẹn (Booking Calendar Hook).
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Hook đồng bộ trạng thái khung giờ được chọn với props truyền vào từ ngoài.
 * @param value - Khung giờ mặc định được chọn (ISO String)
 */
export function useBookingCalendar(value?: string) {
  const [slot, setSlot] = useState<string | undefined>(value);

  useEffect(() => {
    setSlot(value);
  }, [value]);

  return { slot: value ?? slot, setSlot };
}
