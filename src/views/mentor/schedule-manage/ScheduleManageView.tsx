/**
 * @file ScheduleManageView.tsx
 * @description React Component giao diện Quản lý lịch rảnh của Mentor (Schedule Management Page View).
 * Cho phép Mentor thiết lập các mốc ngày/giờ khả dụng để Mentee có thể đặt lịch tư vấn.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import {
  scheduleSchema,
  type ScheduleFormValues,
} from "@/models/schemas/scheduleSchema";
import { useScheduleManage } from "./useScheduleManage";

/**
 * Component trang Quản lý lịch rảnh dành riêng cho Mentor.
 */
export function ScheduleManageView() {
  const { available, addSlot, removeSlot } = useScheduleManage();

  const form = useForm<ScheduleFormValues>({
    resolver: yupResolver(scheduleSchema),
    defaultValues: {
      slot: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const submitSlot = (data: ScheduleFormValues) => {
    addSlot(new Date(data.slot).toLocaleString("vi-VN"));
    reset();
  };

  return (
    <main className="page-shell narrow">
      <section className="content-section">
        <span className="eyebrow">MENTOR PORTAL</span>
        <h1>Quản lý lịch rảnh</h1>
        <p>Thêm các khung giờ để mentee có thể đặt lịch trao đổi với bạn.</p>
        <form
          className="inline-form"
          onSubmit={handleSubmit(submitSlot)}
          noValidate
        >
          <input type="datetime-local" {...register("slot")} />
          <Button type="submit">Thêm lịch</Button>
        </form>
        {errors.slot && (
          <p className="figma-field-error" style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px" }}>
            {errors.slot.message}
          </p>
        )}
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
