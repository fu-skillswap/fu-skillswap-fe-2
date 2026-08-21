/**
 * @file apiClient.ts
 * @description HTTP Client trung tâm cho ứng dụng SkillSwap Frontend (sử dụng Axios).
 * Quản lý gửi request API, tự động đính kèm Access Token trong bộ nhớ (In-memory),
 * bóc tách dữ liệu từ API Envelope chuẩn của Backend, tự động làm mới token (Refresh Token) khi hết hạn (HTTP 401),
 * và xử lý lỗi chuẩn hóa qua ApiClientError.
 */

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, TokenResponse, ValidationError } from '@/models/auth';

/** Chuẩn hóa địa chỉ API gốc từ biến môi trường (xóa bỏ khoảng trắng và dấu ngoặc kép thừa nếu có) */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/^['"]|['"]$/g, '');

/** Access token được lưu trực tiếp trong bộ nhớ tạm (đảm bảo an toàn khỏi tấn công XSS) */
let memoryToken: string | null = null;

/** Promise giữ trạng thái của request làm mới token đang chạy (tránh gửi nhiều request refresh đồng thời) */
let refreshPromise: Promise<string> | null = null;

/** Callback gọi khi phiên đăng nhập hết hạn hoàn toàn và không thể làm mới token */
let unauthenticatedHandler: (() => void) | undefined;

/**
 * Lỗi HTTP API tùy chỉnh chứa phản hồi chi tiết từ Backend.
 */
export class ApiClientError extends Error {
  /**
   * Khởi tạo đối tượng ApiClientError
   * @param status - Mã trạng thái HTTP (ví dụ: 400, 401, 403, 429, 500)
   * @param code - Mã lỗi nghiệp vụ riêng của hệ thống Backend (ví dụ: "AUTH_1004", "SYS_0010")
   * @param message - Thông điệp mô tả lỗi chi tiết
   * @param data - Danh sách chi tiết lỗi validation theo từng trường (nếu có)
   * @param retryAfterSeconds - Số giây phải chờ trước khi thử lại (dành cho lỗi Rate Limit HTTP 429)
   */
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data: ValidationError[] | null = null,
    public retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

/**
 * Cập nhật Access Token trong bộ nhớ tạm.
 * @param token - Chuỗi Access Token mới hoặc null để xóa token khi đăng xuất
 */
export const setAccessToken = (token: string | null) => {
  memoryToken = token;
};

/**
 * Lấy Access Token hiện tại đang được lưu trong bộ nhớ.
 * @returns Chuỗi Access Token hoặc null nếu chưa đăng nhập
 */
export const getAccessToken = () => memoryToken;

/**
 * Đăng ký hàm xử lý khi người dùng bị hủy xác thực (ví dụ: đăng xuất người dùng hoặc xóa auth state).
 * @param handler - Hàm callback xử lý hủy xác thực
 */
export const setUnauthenticatedHandler = (handler?: () => void) => {
  unauthenticatedHandler = handler;
};

/**
 * Kiểm tra path API có phù hợp để thực hiện tự động Refresh Token khi nhận lỗi HTTP 401 hay không.
 * @param path - Đường dẫn API (ví dụ: "/api/auth/refresh")
 */
function canRefresh(path: string) {
  return (
    !path.startsWith('/api/auth/refresh') &&
    !path.startsWith('/api/auth/logout') &&
    !path.startsWith('/api/auth/google')
  );
}

/** Axios instance chính cấu hình mặc định baseURL và withCredentials: true */
const axiosInstance = axios.create({
  baseURL: API_URL || undefined,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Request Interceptor: Tự động đính kèm Authorization Header nếu memoryToken tồn tại */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (memoryToken && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${memoryToken}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** Response Interceptor: Bóc tách ApiResponse Envelope & Tự động Refresh Token khi nhận lỗi 401 */
axiosInstance.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiResponse<unknown> | null;
    if (envelope && typeof envelope === 'object' && 'data' in envelope) {
      if (response.status >= 200 && response.status < 300 && envelope.data !== null) {
        return envelope.data as any;
      }
      throw new ApiClientError(
        response.status,
        envelope.code ?? 'ERROR',
        envelope.message ?? 'API request failed.',
        Array.isArray(envelope.data) ? envelope.data : null,
        envelope.retryAfterSeconds,
      );
    }
    return response.data;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status ?? 500;
    const path = originalRequest?.url ?? '';

    if (status === 401 && originalRequest && !originalRequest._retry && canRefresh(path)) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        }
        const res = await axiosInstance(originalRequest);
        return res;
      } catch (refreshErr) {
        unauthenticatedHandler?.();
        return Promise.reject(refreshErr);
      }
    }

    const envelope = error.response?.data;
    throw new ApiClientError(
      status,
      envelope?.code ?? error.code ?? 'NETWORK_ERROR',
      envelope?.message ?? error.message ?? `API request failed (${status}).`,
      Array.isArray(envelope?.data) ? envelope.data : null,
      envelope?.retryAfterSeconds,
    );
  },
);

/**
 * Thực hiện gửi Yêu cầu làm mới Access Token từ refreshToken cookie qua API `/api/auth/refresh`.
 * Sử dụng cơ chế gom request (Promise singleton) để tránh gửi trùng lặp nhiều request refresh.
 * @returns Promise chứa Access Token mới
 */
async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = apiClient<TokenResponse>('/api/auth/refresh', {
      method: 'POST',
    })
      .then((tokenRes) => {
        setAccessToken(tokenRes.accessToken);
        return tokenRes.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Hàm gọi API chính xuất ra cho toàn bộ Repositories và Services sử dụng.
 * Tương thích cả Axios config lẫn RequestInit legacy (body/method).
 *
 * @template T Kiểu dữ liệu mong đợi trả về từ API
 * @param path - Đường dẫn API tương đối (ví dụ: "/api/me/onboarding-status")
 * @param config - Tùy chọn Axios HTTP Request hoặc RequestInit
 * @returns Dữ liệu kiểu T bóc tách từ ApiResponse
 */
export const apiClient = async <T>(
  path: string,
  config: (AxiosRequestConfig & { body?: unknown }) | RequestInit = {},
): Promise<T> => {
  const method = (config.method ?? 'GET').toString().toUpperCase();
  let data = 'data' in config ? config.data : undefined;
  if (data === undefined && 'body' in config && config.body) {
    try {
      data = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    } catch {
      data = config.body;
    }
  }

  const res = await axiosInstance.request<ApiResponse<T>>({
    url: path,
    method,
    data,
    headers: config.headers as any,
  });

  return res as unknown as T;
};

/**
 * Chủ động thực hiện làm mới phiên đăng nhập hiện tại từ cookie.
 * Thường dùng khi khởi động ứng dụng để khôi phục phiên người dùng.
 */
export const refreshSession = () => refreshAccessToken();
