/**
 * @file toast.ts
 * @description Utility quản lý hiển thị Toast thông báo và Hộp thoại xác nhận (Confirm Modal) dùng chung cho toàn bộ ứng dụng SkillSwap.
 */

import { createElement } from 'react';
import toast from 'react-hot-toast';
import { SkillSwapToast, type SkillSwapToastType } from '@/components/ui/SkillSwapToast';
import { ApiClientError } from '@/models/apiClient';

export interface ToastContent {
  title: string;
  description?: string;
}

interface ShowToastOptions extends ToastContent {
  type: SkillSwapToastType;
  duration?: number;
  id?: string;
}

export interface FriendlyErrorContext {
  title?: string;
  description?: string;
  conflictDescription?: string;
  notFoundDescription?: string;
}

const toastDurations: Record<SkillSwapToastType, number> = {
  success: 4500,
  info: 5000,
  warning: 6000,
  error: 8000,
};

const activeToastIds: string[] = [];
const toastCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

function toastId(type: SkillSwapToastType, title: string, description?: string) {
  const normalized = `${type}-${title}-${description ?? ''}`
    .toLocaleLowerCase('vi-VN')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9à-ỹ-]/gi, '')
    .slice(0, 160);
  return `skillswap-${normalized}`;
}

function trackToast(id: string, duration: number) {
  const existingIndex = activeToastIds.indexOf(id);
  if (existingIndex >= 0) activeToastIds.splice(existingIndex, 1);
  activeToastIds.push(id);

  while (activeToastIds.length > 4) {
    const oldestId = activeToastIds.shift();
    if (oldestId) toast.dismiss(oldestId);
  }

  const existingTimer = toastCleanupTimers.get(id);
  if (existingTimer) clearTimeout(existingTimer);
  toastCleanupTimers.set(
    id,
    setTimeout(() => {
      const index = activeToastIds.indexOf(id);
      if (index >= 0) activeToastIds.splice(index, 1);
      toastCleanupTimers.delete(id);
    }, duration + 1000),
  );
}

export function showToast({ type, title, description, duration, id }: ShowToastOptions) {
  const resolvedDuration = duration ?? toastDurations[type];
  const resolvedId = id ?? toastId(type, title, description);
  trackToast(resolvedId, resolvedDuration);
  toast.custom(
    (toastItem) =>
      createElement(SkillSwapToast, {
        id: toastItem.id,
        type,
        title,
        description,
        visible: toastItem.visible,
      }),
    { id: resolvedId, duration: resolvedDuration },
  );
}

function contentOf(content: string | ToastContent, defaultDescription: string): ToastContent {
  return typeof content === 'string'
    ? { title: content, description: defaultDescription }
    : content;
}

function looksTechnical(message: string) {
  return /NEXT_PUBLIC_|\b(?:HTTP|API|OAuth|endpoint|payload|access token|client id|unauthorized|forbidden|conflict|validation|exception)\b|\b(?:400|401|403|404|409|422|500|502|503)\b|\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b|NetworkError|Failed to fetch/i.test(
    message,
  );
}

export function getUserFriendlyError(
  reason: unknown,
  context: FriendlyErrorContext = {},
): ToastContent {
  if (reason instanceof ApiClientError) {
    const technicalText = `${reason.code} ${reason.message}`;
    if (/google calendar|oauth|CAL_/i.test(technicalText)) {
      return {
        title: 'Không thể kết nối Google Calendar',
        description: 'Tính năng kết nối lịch hiện chưa sẵn sàng. Vui lòng thử lại sau.',
      };
    }
    if (/SLOT_HAS_LOCKING_BOOKINGS|locking booking/i.test(technicalText)) {
      return {
        title: 'Không thể thay đổi khung giờ',
        description: 'Khung giờ này đã có mentee đặt lịch.',
      };
    }
    if (/insufficient.*s.?coins|not enough.*s.?coins/i.test(technicalText)) {
      return {
        title: 'Không đủ S-coins',
        description: 'Vui lòng nạp thêm S-coins để tiếp tục.',
      };
    }
    if (
      reason.code === 'NETWORK_ERROR' ||
      /network|failed to fetch|load failed/i.test(reason.message)
    ) {
      return {
        title: 'Không thể kết nối',
        description: 'Kiểm tra kết nối mạng và thử lại.',
      };
    }
    if (reason.status === 401) {
      return {
        title: 'Phiên đăng nhập đã hết hạn',
        description: 'Vui lòng đăng nhập lại để tiếp tục.',
      };
    }
    if (reason.status === 403) {
      return {
        title: 'Bạn chưa thể thực hiện thao tác này',
        description: 'Tài khoản của bạn không có quyền thực hiện hành động này.',
      };
    }
    if (reason.status === 404) {
      return {
        title: 'Không tìm thấy dữ liệu',
        description:
          context.notFoundDescription || 'Nội dung này có thể đã được xóa hoặc không còn khả dụng.',
      };
    }
    if (reason.status === 409) {
      return {
        title: context.title || 'Không thể hoàn tất thay đổi',
        description:
          context.conflictDescription || 'Dữ liệu vừa được thay đổi. Vui lòng tải lại và thử lại.',
      };
    }
    if (reason.status === 429) {
      return {
        title: 'Bạn đang thao tác quá nhanh',
        description: 'Vui lòng chờ một chút rồi thử lại.',
      };
    }
    if (reason.status === 400 || reason.status === 422) {
      return {
        title: 'Thông tin chưa hợp lệ',
        description: 'Vui lòng kiểm tra lại các thông tin đã nhập.',
      };
    }
    if (reason.status >= 500) {
      return {
        title: 'Có lỗi xảy ra',
        description: 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.',
      };
    }
    return {
      title: context.title || 'Không thể hoàn tất thao tác',
      description: context.description || 'Vui lòng thử lại sau.',
    };
  }

  const message =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
  if (/google calendar|NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID|oauth/i.test(message)) {
    return {
      title: 'Không thể kết nối Google Calendar',
      description: 'Tính năng kết nối lịch hiện chưa sẵn sàng. Vui lòng thử lại sau.',
    };
  }
  if (/network|failed to fetch|load failed/i.test(message)) {
    return {
      title: 'Không thể kết nối',
      description: 'Kiểm tra kết nối mạng và thử lại.',
    };
  }
  if (typeof reason === 'string' && message && !looksTechnical(message)) {
    return {
      title: context.title || 'Không thể hoàn tất thao tác',
      description: message,
    };
  }
  return {
    title: context.title || 'Không thể hoàn tất thao tác',
    description: context.description || 'Vui lòng thử lại sau.',
  };
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
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
  const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
  if (confirmHandler) {
    return confirmHandler(opts);
  }
  return Promise.resolve(window.confirm(opts.message));
};

/** Hiển thị Toast thông báo Thành công */
export const showSuccess = (content: string | ToastContent) => {
  showToast({
    type: 'success',
    ...contentOf(content, 'Thao tác đã được hoàn tất.'),
  });
};

/** Hiển thị Toast thông báo Lỗi */
export const showError = (reason: unknown, context?: FriendlyErrorContext) => {
  console.error('[SkillSwap]', reason);
  showToast({ type: 'error', ...getUserFriendlyError(reason, context) });
};

/** Hiển thị Toast thông báo Cảnh báo */
export const showWarning = (content: string | ToastContent) => {
  showToast({
    type: 'warning',
    ...(typeof content === 'string'
      ? { title: 'Vui lòng kiểm tra lại', description: content }
      : content),
  });
};

/** Hiển thị Toast thông báo Thông tin */
export const showInfo = (content: string | ToastContent) => {
  showToast({
    type: 'info',
    ...(typeof content === 'string' ? { title: 'Thông tin mới', description: content } : content),
  });
};
