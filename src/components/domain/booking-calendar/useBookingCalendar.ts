"use client";

import { useEffect, useState } from "react";

export function useBookingCalendar(value?: string) {
  const [slot, setSlot] = useState<string | undefined>(value);

  useEffect(() => {
    setSlot(value);
  }, [value]);

  return { slot: value ?? slot, setSlot };
}
