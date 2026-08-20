/**
 * @file ScheduleManageView.tsx
 * @description React Component giao diện Quản lý lịch rảnh của Mentor (Schedule Management Page View).
 * Cho phép Mentor thiết lập các mốc ngày/giờ khả dụng để Mentee có thể đặt lịch tư vấn.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { useScheduleManage } from "./useScheduleManage";

/**
 * Component trang Quản lý lịch rảnh dành riêng cho Mentor.
 */
export function ScheduleManageView() {
  const { available, addSlot, removeSlot } = useScheduleManage();
  return (
    <main className="page-shell narrow">
      <section className="content-section">
        <span className="eyebrow">MENTOR PORTAL</span>
        <h1>Quản lý lịch rảnh</h1>
        <p>Thêm các khung giờ để mentee có thể đặt lịch trao đổi với bạn.</p>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const field = event.currentTarget.elements.namedItem(
              "slot",
            ) as HTMLInputElement;
            if (field.value) {
              addSlot(new Date(field.value).toLocaleString("vi-VN"));
              field.value = "";
            }
          }}
        >
          <input name="slot" type="datetime-local" />
          <Button type="submit">Thêm lịch</Button>
        </form>
        <div className="schedule-list">
          {available.map((slot) => (
            <div className="card schedule-item" key={slot}>
              <span>{slot}</span>
              <button
                className="link-button danger"
                onClick={() => removeSlot(slot)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
