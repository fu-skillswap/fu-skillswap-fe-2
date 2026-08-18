"use client";

import { useState } from "react";

export function useScheduleManage() {
  const [available, setAvailable] = useState(["20/08/2026 · 09:00", "21/08/2026 · 14:00"]);
  const addSlot = (slot: string) => setAvailable((slots) => [...slots, slot]);
  const removeSlot = (slot: string) => setAvailable((slots) => slots.filter((item) => item !== slot));
  return { available, addSlot, removeSlot };
}
