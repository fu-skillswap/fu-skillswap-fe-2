/**
 * @file apiClient.ts
 * @description HTTP Client trung tâm cho ứng dụng SkillSwap Frontend.
 * Quản lý gửi request API, tự động đính kèm Access Token trong bộ nhớ (In-memory),
 * bóc tách dữ liệu từ API Envelope chuẩn của Backend, tự động làm mới token (Refresh Token) khi hết hạn (HTTP 401),
 * và xử lý lỗi chuẩn hóa qua ApiClientError.
 */

import type {
  ApiResponse,
  TokenResponse,
  ValidationError,
} from "@/models/auth";

/** Chuẩn hóa địa chỉ API gốc từ biến môi trường (xóa bỏ khoảng trắng và dấu ngoặc kép thừa nếu có) */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "")
  .trim()
  .replace(/^['"]|['"]$/g, "");

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
 * Các path liên quan đến authentication chính không được phép refresh tự động để tránh vòng lặp vô tận.
 * @param path - Đường dẫn API (ví dụ: "/api/auth/refresh")
 */
function canRefresh(path: string) {
  return (
    !path.startsWith("/api/auth/refresh") &&
    !path.startsWith("/api/auth/logout") &&
    !path.startsWith("/api/auth/google")
  );
}

/**
 * Hàm core thực hiện gọi HTTP Fetch và bóc tách dữ liệu theo chuẩn ApiResponse Envelope của Backend.
 * Tự động gắn Authorization Header và thực hiện làm mới Token nếu gặp lỗi HTTP 401.
 *
 * @template T Kiểu dữ liệu mong đợi của payload trả về trong `envelope.data`
 * @param path - Đường dẫn tương đối của endpoint API (ví dụ: "/api/auth/me")
 * @param init - Tùy chọn cấu hình cho fetch (method, body, headers,...)
 * @param retry - Cờ đánh dấu request này có phải là lần thử lại sau khi refresh token hay không
 * @returns Payload dữ liệu kiểu T thu được từ API
 * @throws {Error} Khi chưa cấu hình biến môi trường NEXT_PUBLIC_API_URL
 * @throws {ApiClientError} Khi request thất bại, phản hồi không thành công hoặc lỗi dữ liệu từ Backend
 */
async function requestEnvelope<T>(
  path: string,
  init: RequestInit = {},
  retry = false,
): Promise<T> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  if (memoryToken && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${memoryToken}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const envelope = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  // Xử lý tự động làm mới Access Token khi gặp lỗi HTTP 401 Unauthorized
  if (response.status === 401 && !retry && canRefresh(path)) {
    try {
      await refreshAccessToken();
      return requestEnvelope<T>(path, init, true);
    } catch {
      unauthenticatedHandler?.();
    }
  }

  // Ném lỗi ApiClientError chuẩn hóa nếu HTTP không ok hoặc envelope không hợp lệ
  if (!response.ok || !envelope || envelope.data === null) {
    throw new ApiClientError(
      response.status,
      envelope?.code ?? "NETWORK_ERROR",
      envelope?.message ?? `API request failed (${response.status}).`,
      Array.isArray(envelope?.data) ? envelope.data : null,
      envelope?.retryAfterSeconds,
    );
  }

  return envelope.data as T;
}

/**
 * Thực hiện gửi Yêu cầu làm mới Access Token từ refreshToken cookie qua API `/api/auth/refresh`.
 * Sử dụng cơ chế gom request (Promise singleton) để tránh gửi trùng lặp nhiều request refresh.
 * @returns Promise chứa Access Token mới
 */
async function refreshAccessToken() {
  if (!refreshPromise)
    refreshPromise = requestEnvelope<TokenResponse>(
      "/api/auth/refresh",
      { method: "POST" },
      true,
    )
      .then(({ accessToken }) => {
        setAccessToken(accessToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
}

/**
 * Hàm gọi API chính được xuất ra cho toàn bộ các dịch vụ frontend sử dụng.
 *
 * @template T Kiểu dữ liệu mong đợi trả về từ API
 * @param path - Đường dẫn API tương đối (ví dụ: "/api/me/onboarding-status")
 * @param init - Tùy chọn HTTP Fetch Request
 * @returns Dữ liệu kiểu T
 */
export const apiClient = <T>(path: string, init: RequestInit = {}) =>
  requestEnvelope<T>(path, init);

/**
 * Chủ động thực hiện làm mới phiên đăng nhập hiện tại từ cookie.
 * Thường dùng khi khởi động ứng dụng để khôi phục phiên người dùng.
 */
export const refreshSession = () => refreshAccessToken();
