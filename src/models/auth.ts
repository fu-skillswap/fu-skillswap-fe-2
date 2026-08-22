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

export type BackendRole = 'MENTEE' | 'MENTOR' | 'ADMIN' | 'SYSTEM_ADMIN';

/** Phản hồi thông tin cá nhân người dùng (`/api/auth/me`) */
export interface UserMeResponse {
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
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

/** Kết quả môn học mà Mentor đảm nhận hướng dẫn kèm điểm số */
export interface MentorSubjectResult {
  id?: string;
  subjectCode: string;
  subjectName: string;
  scoreValue: number;
}

/** Yêu cầu cập nhật Hồ sơ Mentor (PUT `/api/me/mentor-profile`) */
export interface SaveMentorProfileRequest {
  /** Tiêu đề ngắn gọn về vai trò / vị trí chuyên môn */
  headline: string;
  /** Mô tả chi tiết về kinh nghiệm và kỹ năng chuyên môn */
  expertiseDescription: string;
  /** Trạng thái sẵn sàng nhận đặt lịch tư vấn */
  isAvailable: boolean;
  /** Danh sách kết quả môn học giảng dạy */
  subjectResults: MentorSubjectResult[];
  /** Mức độ hỗ trợ kiến thức căn bản (1-5) */
  foundationSupportLevel: number;
  /** Mức độ hỗ trợ review sản phẩm / đồ án (1-5) */
  outputReviewSupportLevel: number;
  /** Mức độ hỗ trợ định hướng (1-5) */
  directionSupportLevel: number;
  /** Trang GitHub cá nhân (tùy chọn) */
  githubUrl?: string;
  /** Trang Portfolio cá nhân (tùy chọn) */
  portfolioUrl?: string;
  /** Số điện thoại liên hệ */
  phoneNumber: string;
  /** Thời gian báo trước tối thiểu khi đặt lịch (tính bằng phút) */
  minimumBookingLeadTimeMinutes: number;
  /** Thời gian mở lịch đặt trước tối đa (tính bằng ngày) */
  maximumBookingHorizonDays: number;
  /** Múi giờ đặt lịch (ví dụ: "Asia/Ho_Chi_Minh") */
  bookingTimezone: string;
}

/** Phản hồi thông tin Hồ sơ Mentor từ hệ thống (GET / PUT `/api/me/mentor-profile`) */
export interface MentorProfileResponse {
  /** Trạng thái hồ sơ đã tồn tại hay chưa */
  exists: boolean;
  /** Trạng thái đã hoàn thành các trường thông tin bắt buộc */
  requiredFieldsCompleted: boolean;
  /** ID người dùng */
  userId: string;
  /** Email người dùng */
  email: string;
  /** Tên hiển thị */
  displayName: string;
  /** Link ảnh đại diện */
  avatarUrl?: string | null;
  /** Trạng thái duyệt Mentor (ACTIVE, PENDING, INACTIVE,...) */
  mentorStatus: string;
  /** Tiêu đề chuyên môn */
  headline: string;
  /** Mô tả kinh nghiệm chuyên môn */
  expertiseDescription: string;
  /** Trạng thái sẵn sàng nhận lịch */
  isAvailable: boolean;
  /** Thời điểm tạm dừng đặt lịch (nếu có) */
  bookingSuspendedUntil?: string | null;
  /** Điểm phạt hủy lịch muộn */
  lateCancellationPenaltyPoints?: number;
  /** Thời điểm xác minh tài khoản */
  verifiedAt?: string | null;
  /** Thời gian báo trước tối thiểu (phút) */
  minimumBookingLeadTimeMinutes: number;
  /** Hạn đặt trước tối đa (ngày) */
  maximumBookingHorizonDays: number;
  /** Múi giờ đặt lịch */
  bookingTimezone: string;
  /** Mảng danh sách môn học giảng dạy */
  subjectResults: MentorSubjectResult[];
  /** Cấp độ hỗ trợ căn bản (1-5) */
  foundationSupportLevel: number;
  /** Cấp độ hỗ trợ review đồ án (1-5) */
  outputReviewSupportLevel: number;
  /** Cấp độ hỗ trợ định hướng (1-5) */
  directionSupportLevel: number;
  /** Link GitHub */
  githubUrl?: string | null;
  /** Link Portfolio */
  portfolioUrl?: string | null;
  /** Số điện thoại */
  phoneNumber?: string | null;
}

/** Request payload tạo dự án tiêu biểu (POST /api/me/mentor-projects) */
export interface CreateMentorProjectRequest {
  /** Tên dự án (Ví dụ: "SWP391 Booking Platform") */
  title: string;
  /** Vai trò, công nghệ hoặc điểm nổi bật của dự án */
  content: string;
  /** Mô tả ngắn vấn đề, cách làm và kết quả của dự án (Tùy chọn) */
  projectDescription?: string;
  /** Đường dẫn Live Demo / Repository (Tùy chọn) */
  liveDemoUrl?: string;
}

/** Response thông tin dự án tiêu biểu từ server */
export interface MentorProjectResponse {
  id?: string;
  title: string;
  content: string;
  projectDescription?: string;
  liveDemoUrl?: string;
  createdAt?: string;
}

/** Request payload tạo học vấn / giải thưởng (POST /api/me/mentor-achievements) */
export interface CreateMentorAchievementRequest {
  /** Tên giải thưởng / thành tích (Ví dụ: "Top 10 Hackathon FPTU") */
  title: string;
  /** Mô tả ngắn giải thưởng hoặc thành tích (Tùy chọn) */
  awardDescription?: string;
  /** Ngày / thời điểm đạt được (YYYY-MM-DD) (Tùy chọn) */
  achievedAt?: string;
  /** Tiêu đề sản phẩm / case study đi kèm thành tích (Tùy chọn) */
  productHeader?: string;
  /** Mô tả sản phẩm / case study đi kèm thành tích (Tùy chọn) */
  productDescription?: string;
  /** Đường dẫn Demo / Chứng nhận (Tùy chọn) */
  demoUrl?: string;
}

/** Response thông tin giải thưởng / thành tích từ server */
export interface MentorAchievementResponse {
  id?: string;
  title: string;
  awardDescription?: string;
  achievedAt?: string;
  productHeader?: string;
  productDescription?: string;
  demoUrl?: string;
  createdAt?: string;
}

/** Request payload nộp hồ sơ xác thực Mentor (POST /api/me/mentor-verification/submit) */
export interface SubmitMentorVerificationRequest {
  /** Ghi chú khi nộp hồ sơ (Tùy chọn) */
  submitNote?: string;
  /** Trạng thái đồng ý với điều khoản vận hành */
  termsAccepted: boolean;
}

/** Request payload tạo URL upload minh chứng (POST /api/me/mentor-verification/documents/upload-intents) */
export interface CreateUploadIntentRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

/** Response từ API tạo URL upload minh chứng */
export interface UploadIntentResponse {
  uploadIntentId: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders?: Record<string, string>;
  status: string;
}

/** Request payload xác nhận tài liệu minh chứng đã upload (POST /api/me/mentor-verification/documents) */
export interface ConfirmDocumentRequest {
  documentType: string;
  uploadIntentId: string;
}
