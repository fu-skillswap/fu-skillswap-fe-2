/**
 * @file toast.ts
 * @description Utility quản lý hiển thị Toast thông báo và Hộp thoại xác nhận (Confirm Modal) dùng chung cho toàn bộ ứng dụng SkillSwap.
 */

import toast from "react-hot-toast";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

let confirmHandler: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export const registerConfirmHandler = (handler: (options: ConfirmOptions) => Promise<boolean>) => {
  confirmHandler = handler;
};

/**
 * Hiển thị Hộp thoại xác nhận cảnh báo (thay thế window.confirm mặc định của trình duyệt).
 * @param options - Cấu hình nội dung, tiêu đề và nút bấm
 * @returns Promise<boolean> (trả về true nếu người dùng chọn Đồng ý/Xác nhận, false nếu chọn Hủy)
 */
export const confirmAction = (options: ConfirmOptions | string): Promise<boolean> => {
  const opts: ConfirmOptions = typeof options === "string" ? { message: options } : options;
  if (confirmHandler) {
    return confirmHandler(opts);
  }
  return Promise.resolve(window.confirm(opts.message));
};

/** Hiển thị Toast thông báo Thành công */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
  });
};

/** Hiển thị Toast thông báo Lỗi */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
  });
};

/** Hiển thị Toast thông báo Cảnh báo */
export const showWarning = (message: string) => {
  toast(message, {
    icon: "⚠️",
    duration: 4500,
    style: {
      background: "#fefce8",
      border: "1px solid #fef08a",
      color: "#ca8a04",
      fontWeight: 600,
    },
  });
};

/** Hiển thị Toast thông báo Thông tin */
export const showInfo = (message: string) => {
  toast(message, {
    icon: "ℹ️",
    duration: 4000,
    style: {
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#2563eb",
      fontWeight: 600,
    },
  });
};
