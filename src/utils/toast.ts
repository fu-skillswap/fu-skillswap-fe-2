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
  return /NEXT_PUBLIC_|request failed with status code|\b(?:AxiosError|HTTP|API|OAuth|endpoint|payload|access token|client id|statusText|unauthorized|forbidden|conflict|validation|exception|stack trace|ECONNREFUSED|ERR_NETWORK|NetworkError|Failed to fetch|load failed)\b|\bHTTP\s*[45]\d{2}\b|\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b|\b(?:java|spring|hibernate|sql|database)\b|\bat\s+[\w.$]+\([^)]*:\d+(?::\d+)?\)/i.test(
    message,
  );
}

function usableBusinessMessage(message: string) {
  const normalized = message.trim();
  return (
    normalized.length >= 4 &&
    normalized.length <= 240 &&
    !looksTechnical(normalized) &&
    !/[{}<>]|https?:\/\/|\/api\/|\\[\w.-]+\\|[\w.-]+\.(?:java|kt|js|ts):\d+/i.test(normalized)
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
      /network|failed to fetch|load failed|ECONNREFUSED|ERR_NETWORK/i.test(technicalText)
    ) {
      return {
        title: 'Không thể kết nối',
        description: 'Hiện chưa thể kết nối đến SkillSwap. Vui lòng kiểm tra mạng và thử lại.',
      };
    }
    if (/ECONNABORTED|ETIMEDOUT|timeout|timed out/i.test(technicalText)) {
      return {
        title: context.title || 'Yêu cầu chưa hoàn tất',
        description: 'Yêu cầu mất nhiều thời gian hơn dự kiến. Vui lòng thử lại.',
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
        title: context.title || 'Thao tác chưa được thực hiện',
        description: 'Bạn chưa có quyền thực hiện thao tác này.',
      };
    }
    if (reason.status === 404) {
      return {
        title: context.title || 'Không tìm thấy thông tin',
        description: context.notFoundDescription || 'Không tìm thấy thông tin bạn đang tìm kiếm.',
      };
    }
    if (reason.status === 408) {
      return {
        title: context.title || 'Yêu cầu chưa hoàn tất',
        description: 'Yêu cầu mất nhiều thời gian hơn dự kiến. Vui lòng thử lại.',
      };
    }
    if (reason.status === 409) {
      if (usableBusinessMessage(reason.message)) {
        return {
          title: context.title || 'Không thể hoàn tất thay đổi',
          description: reason.message.trim(),
        };
      }
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
      if (usableBusinessMessage(reason.message)) {
        return {
          title: context.title || 'Thông tin cần được kiểm tra',
          description: reason.message.trim(),
        };
      }
      return {
        title: context.title || 'Thông tin chưa hợp lệ',
        description: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
      };
    }
    if (reason.status >= 500) {
      return {
        title: context.title || 'Hệ thống đang tạm gián đoạn',
        description: 'SkillSwap đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.',
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
  if (/network|failed to fetch|load failed|ECONNREFUSED|ERR_NETWORK/i.test(message)) {
    return {
      title: 'Không thể kết nối',
      description: 'Hiện chưa thể kết nối đến SkillSwap. Vui lòng kiểm tra mạng và thử lại.',
    };
  }
  if (/ECONNABORTED|ETIMEDOUT|timeout|timed out/i.test(message)) {
    return {
      title: context.title || 'Yêu cầu chưa hoàn tất',
      description: 'Yêu cầu mất nhiều thời gian hơn dự kiến. Vui lòng thử lại.',
    };
  }
  if (typeof reason === 'string' && usableBusinessMessage(message)) {
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

/** Lấy riêng phần mô tả an toàn để hiển thị trong error state/form inline. */
export function getUserFriendlyErrorMessage(
  reason: unknown,
  fallback = 'Không thể hoàn tất thao tác. Vui lòng thử lại sau.',
) {
  return getUserFriendlyError(reason, { description: fallback }).description || fallback;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  simple?: boolean;
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
