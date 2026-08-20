/**
 * @file auth.ts
 * @description Định nghĩa các kiểu dữ liệu DTO (Data Transfer Object) xác thực,
 * cấu trúc API Envelope chuẩn từ Backend, các yêu cầu/phản hồi hồ sơ sinh viên và trạng thái Onboarding.
 */

/** Chi tiết lỗi validation dữ liệu theo từng trường từ Backend */
export interface ValidationError {
  /** Tên trường bị lỗi validation */
  field: string | null;
  /** Thông điệp lỗi chi tiết */
  message: string;
  /** Giá trị không hợp lệ đã bị từ chối */
  rejectedValue: unknown;
}

/** Cấu trúc Phản hồi API Envelope tiêu chuẩn của hệ thống Backend SkillSwap */
export interface ApiResponse<T> {
  /** Thời gian tạo phản hồi dạng ISO string */
  timestamp: string;
  /** Mã trạng thái HTTP (200, 400, 401,...) */
  status: number;
  /** Mã lỗi nghiệp vụ hệ thống (ví dụ: "SUCCESS", "AUTH_1004", "SYS_0010") */
  code: string;
  /** Thông điệp mô tả kết quả */
  message: string;
  /** Dữ liệu payload kiểu T hoặc mảng ValidationError nếu xảy ra lỗi validation */
  data: T | ValidationError[] | null;
  /** Thời gian khuyến nghị chờ trước khi gửi lại request (dành cho lỗi Rate Limit) */
  retryAfterSeconds?: number;
}

/** Phản hồi mã Nonce cho Google Login */
export interface GoogleLoginNonceResponse {
  /** Chuỗi nonce dùng một lần */
  nonce: string;
  /** Thời điểm hết hạn của nonce */
  expiresAt: string;
}

/** Phản hồi chứa Access Token xác thực */
export interface TokenResponse {
  /** Chuỗi Access Token (Bearer token) */
  accessToken: string;
  /** Loạt token (thường là "Bearer") */
  tokenType: string;
}

/** Yêu cầu đăng nhập bằng Google */
export interface GoogleLoginRequest {
  /** ID Token do Google cấp */
  credential: string;
  /** Mã Nonce dùng một lần khớp với request trước đó */
  nonce: string;
}

/** Thông tin cơ sở / Campus đại học */
export interface CampusResponse {
  id: string;
  code: string;
  name: string;
  city: string;
}

/** Thông tin chương trình / ngành đào tạo */
export interface AcademicProgramResponse {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
}

/** Thông tin chuyên ngành hẹp */
export interface SpecializationResponse {
  id: string;
  programId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  expected?: boolean;
  other?: boolean;
}

/** Yêu cầu cập nhật Hồ sơ sinh viên (Onboarding Step) */
export interface StudentProfileRequest {
  /** Mã số sinh viên (ví dụ: SE123456) */
  studentCode: string;
  /** Tên hiển thị */
  displayName?: string;
  /** Ảnh đại diện */
  avatarUrl?: string;
  /** ID Cơ sở / Campus đại học */
  campusId: string;
  /** ID Chương trình / Ngành học */
  programId: string;
  /** ID Chuyên ngành hẹp */
  specializationId: string;
  /** Học kỳ hiện tại */
  semester: number;
  /** Khóa học / Năm nhập học */
  intakeYear: number;
  /** Đã tốt nghiệp hay chưa */
  isAlumni: boolean;
  /** Năm tốt nghiệp (nếu là Alumni) */
  graduationYear?: number;
  /** Giới thiệu bản thân ngắn */
  bio?: string;
}

/** Phản hồi thông tin hồ sơ sinh viên đầy đủ từ hệ thống Backend */
export interface StudentProfileResponse {
  userId: string;
  email: string;
  studentCode: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  campus: CampusResponse;
  program: AcademicProgramResponse;
  specialization: SpecializationResponse;
  semester: number;
  intakeYear: number;
  graduationYear?: number | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
  alumni: boolean;
}

export type BackendRole = "MENTEE" | "MENTOR" | "ADMIN" | "SYSTEM_ADMIN";

/** Phản hồi thông tin cá nhân người dùng (`/api/auth/me`) */
export interface UserMeResponse {
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | "BANNED" | "DELETED";
  roles: BackendRole[];
  profileCompleted: boolean;
  hasStudentProfile: boolean;
  googleCalendarConnected: boolean;
  googleCalendarSyncEnabled: boolean;
  googleCalendarEmail?: string | null;
  googleCalendarNeedsReconnect: boolean;
  googleCalendarLastSyncStatus?: string | null;
  googleCalendarLastSyncAt?: string | null;
}

/** Phản hồi trạng thái hoàn thiện hồ sơ Onboarding (`/api/me/onboarding-status`) */
export interface OnboardingStatusResponse {
  studentProfileCompleted: boolean;
  mentorProfileCompleted: boolean;
  mentorVerificationStatus?: string | null;
  roles: BackendRole[];
  nextRecommendedAction?: string | null;
}

/** Đối tượng người dùng đã xác thực hoàn chỉnh sử dụng trong Frontend Auth Context */
export interface AuthenticatedUser extends UserMeResponse {
  /** Tương đương publicId để phục vụ việc truy xuất tiện lợi trong UI */
  id: string;
}
