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
  specializationId?: string | null;
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

/** Ràng buộc tạo dịch vụ mentoring do nền tảng cấu hình. */
export interface MentorServiceConstraintsResponse {
  allowedDurationMinutes: number[];
  minimumPriceScoinPerMinute: number;
  maximumPriceScoinPerMinute: number;
}

/** Current mentor booking policy. */
export interface MentorBookingPolicyResponse {
  minimumBookingLeadTimeMinutes: number;
  maximumBookingHorizonDays: number;
  timezone: string;
  version: number;
}

/** Request payload for PATCH /api/me/mentor-booking-policy. */
export interface UpdateMentorBookingPolicyRequest {
  minimumBookingLeadTimeMinutes?: number;
  maximumBookingHorizonDays?: number;
  timezone?: string;
  expectedVersion: number;
}

/** Platform constraints used when managing mentor availability slots. */
export interface MentorSchedulingConstraintsResponse {
  maximumAvailabilityQueryDays: number;
  maximumParentSlotDurationMinutes: number;
}

/** Current mentor Google Calendar connection and synchronization state. */
export interface GoogleCalendarStatusResponse {
  connected: boolean;
  syncEnabled: boolean;
  email: string | null;
  grantedScopes: string[];
  needsReconnect: boolean;
  lastSyncStatus: string | null;
  lastSyncAt: string | null;
  lastSyncErrorCode: string | null;
  lastSyncErrorMessage: string | null;
}

export interface GoogleAuthorizationContextResponse {
  state: string;
  expiresAt: string;
}

export interface GoogleCalendarConnectRequest {
  authorizationCode: string;
  redirectUri: string;
  codeVerifier: string;
  state: string;
}

export type WeekdayEnum =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface LocalTimeObject {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
}

export type LocalTime = string | LocalTimeObject;

export interface AvailabilityTemplateBlockedOccurrenceResponse {
  date: string;
  reason?: string | null;
  slotId?: string | null;
}

export interface AvailabilityTemplateResponse {
  templateId: string;
  startTime: LocalTime;
  endTime: LocalTime;
  weekdays: WeekdayEnum[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  timezone: string;
  note?: string | null;
  configuredStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | string;
  effectiveStatus: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED' | string;
  configVersion: number;
  services: AvailabilitySlotServiceBasicResponse[];
  generationBlockedReason?: string | null;
  skippedDates?: string[] | null;
  blockedOccurrences?: AvailabilityTemplateBlockedOccurrenceResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CursorPageResponseAvailabilityTemplateResponse {
  items: AvailabilityTemplateResponse[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface CreateAvailabilityTemplateRequest {
  startTime: string;
  endTime: string;
  weekdays: WeekdayEnum[];
  effectiveFrom: string;
  effectiveTo?: string;
  serviceIds: string[];
  note?: string;
}

export interface UpdateAvailabilityTemplateRequest {
  startTime: string;
  endTime: string;
  weekdays: WeekdayEnum[];
  effectiveFrom?: string;
  effectiveTo?: string;
  serviceIds: string[];
  expectedVersion: number;
  note?: string;
  rejectPendingBookings?: boolean;
}

export interface AvailabilityTemplateVersionRequest {
  expectedVersion: number;
  rejectPendingBookings?: boolean;
}

export interface AvailabilityTemplateExceptionRequest {
  expectedVersion: number;
  rejectPendingBookings?: boolean;
}

/** Direct availability-slot read query, limited to the published backend parameters. */
export interface AvailabilitySlotsQuery {
  isActive?: boolean;
  fromDate?: string;
  toDate?: string;
}

/** Capability state for a slot mutation when bookings may be affected. */
export interface SlotMutationCapabilityResponse {
  mode: 'ALLOWED' | 'REQUIRES_PENDING_REJECTION' | 'BLOCKED_BY_LOCKING_BOOKING' | string;
  restrictionCode?: string | null;
  affectedPendingBookingCount: number;
}

/** Basic mentor service bound to an availability slot. */
export interface AvailabilitySlotServiceBasicResponse {
  serviceId: string;
  title: string;
  durationMinutes: number;
  isFree: boolean;
  priceScoin?: number | null;
  bindingRemoval?: SlotMutationCapabilityResponse | null;
}

/** Service info attached to public availability slots (GET /api/mentors/{mentorUserId}/availability-slots). */
export interface PublicSlotServiceInfo {
  serviceId: string;
  title: string;
  durationMinutes: number;
  isFree: boolean;
  priceScoin: number;
  bindingRemoval?: {
    mode?: string;
    restrictionCode?: string;
    affectedPendingBookingCount?: number;
  } | null;
}

/** Public availability slot returned by GET /api/mentors/{mentorUserId}/availability-slots. */
export interface PublicAvailabilitySlotResponse {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  pendingRequestCount?: number;
  acceptedSlotCount?: number;
  services: PublicSlotServiceInfo[];
}

/** Candidate service slot item returned in candidateServiceSlots array from GET /api/mentors/{mentorUserId}/availability-slots/{slotId}/candidates */
export interface CandidateServiceSlot {
  startTime: string;
  endTime: string;
  pendingCount?: number;
  remainingPendingQuota?: number;
  isSelectable?: boolean;
  reasonIfBlocked?: string | null;
  blockedByAcceptedBooking?: boolean;
  blockingBookingId?: string | null;
  blockingServiceId?: string | null;
  blockingServiceTitle?: string | null;
  blockedBySameService?: boolean;
  blockedByDifferentService?: boolean;
  bookingConflictNote?: string | null;

  // Extra helper properties mapped for calendar UI
  segmentId?: string;
  candidateId?: string;
  slotId?: string;
  serviceId?: string;
  title?: string;
  isBlocked?: boolean;
  blockedReason?: string | null;
}

/** Response payload of GET /api/mentors/{mentorUserId}/availability-slots/{slotId}/candidates */
export interface GetCandidateSlotsResponse {
  candidateServiceSlots: CandidateServiceSlot[];
}

/** Alias CandidateSegmentResponse for backward compatibility */
export type CandidateSegmentResponse = CandidateServiceSlot;

/** Payload for POST /api/bookings */
export interface CreateBookingRequest {
  slotId: string;
  serviceId: string;
  startAt: string;
  learningGoalTitle?: string;
  learningGoalDescription?: string;
  legacySelectedEndTime?: string;
}

/** Item payload returned by GET /api/me/bookings */
export interface UserBookingItem {
  id: string;
  bookingId?: string;
  slotId?: string;
  serviceId?: string;
  mentorId?: string;
  mentorName?: string;
  mentorDisplayName?: string;
  mentorAvatarUrl?: string;
  serviceName?: string;
  serviceTitle?: string;
  serviceDescription?: string;
  priceScoins?: number;
  durationMinutes?: number;
  startAt?: string;
  endAt?: string;
  startsAt?: string;
  endsAt?: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
  bookingStatus: MentorBookingStatus | string;
  status?: MentorBookingStatus | string;
  learningGoalTitle?: string;
  learningGoalDescription?: string;
  createdAt?: string;
}

export type MentorBookingStatus =
  | 'PENDING'
  | 'PAID'
  | 'NO_SHOW'
  | 'CANCELLED_BY_MENTOR'
  | 'AWAITING_MENTOR_COMPLETION'
  | 'AWAITING_MENTEE_CONFIRMATION'
  | 'COMPLETED'
  | 'AUTO_CLOSED'
  | 'UNDER_REVIEW'
  | 'EXPIRED_PENDING_MENTOR'
  | 'ACCEPTED_AWAITING_PAYMENT'
  | 'EXPIRED_AWAITING_PAYMENT'
  | 'CANCELLED_BY_MENTEE'
  | 'REJECTED'
  | 'REQUESTED'
  | 'WAITING_PAYMENT'
  | 'CONFIRMED'
  | 'REJECTED_BY_MENTOR'
  | 'CANCELED_BY_MENTEE'
  | 'CANCELED_BY_MENTOR'
  | 'REQUEST_EXPIRED'
  | 'PAYMENT_EXPIRED';

export type MentorBookingDisplayState =
  | 'PENDING_MENTOR_RESPONSE'
  | 'PAYMENT_REQUIRED'
  | 'MENTOR_ACTION_REQUIRED'
  | 'UPCOMING'
  | 'IN_SESSION'
  | 'WAITING_CONFIRMATION'
  | 'UNDER_REVIEW'
  | 'FEEDBACK_REQUIRED'
  | 'COMPLETED'
  | 'CANCELED_OR_EXPIRED';

export type MentorBookingNextAction =
  | 'NONE'
  | 'PAY_NOW'
  | 'ACCEPT_OR_REJECT'
  | 'JOIN_SESSION'
  | 'COMPLETE_SESSION'
  | 'CONFIRM_SESSION'
  | 'LEAVE_FEEDBACK'
  | 'VIEW_ISSUE';

/** Booking hiển thị trong khu vực quản lý của Mentor. */
export interface MentorBookingResponse {
  bookingId: string;
  mentorUserId?: string | null;
  mentorDisplayName?: string | null;
  mentorAvatarUrl?: string | null;
  menteeUserId: string;
  menteeDisplayName: string;
  menteeAvatarUrl?: string | null;
  serviceTitle?: string | null;
  serviceDescriptionSnapshot?: string | null;
  serviceDurationSnapshot?: number | null;
  servicePriceScoinSnapshot?: number | null;
  selectedStartTime: string;
  selectedEndTime: string;
  bookingStatus: MentorBookingStatus;
  actualSessionStatus?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | null;
  learningGoalTitle: string;
  learningGoalDescription?: string | null;
  mentorResponseNote?: string | null;
  rejectReason?: string | null;
  cancelReason?: string | null;
  meetingPlatform?:
    'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS' | 'DISCORD' | 'OFFLINE' | 'OTHER' | null;
  meetingLink?: string | null;
  calendarSyncStatus?: string | null;
  calendarSyncErrorCode?: string | null;
  calendarSyncErrorMessage?: string | null;
  googleMeetAutoGenerated?: boolean;
  googleCalendarManaged?: boolean;
  location?: string | null;
  displayState: MentorBookingDisplayState;
  nextAction?: MentorBookingNextAction | null;
  canAccept: boolean;
  canReject: boolean;
  canCompleteByMentor: boolean;
  canComplete?: boolean;
  canConfirmByMentee?: boolean;
  canCancel: boolean;
  canJoin: boolean;
  canPay?: boolean;
  canReportIssue?: boolean;
  canRespondIssue?: boolean;
  conversationId?: string | null;
  attendance?: {
    currentUserCheckedIn?: boolean | null;
    canCheckIn?: boolean | null;
    checkInOpensAt?: string | null;
    checkInClosesAt?: string | null;
  } | null;
  joinAvailableAt?: string | null;
  createdAt: string;
}

export interface MentorBookingPageResponse {
  content: MentorBookingResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AcceptMentorBookingRequest {
  mentorResponseNote?: string;
  meetingPlatform?: MentorBookingResponse['meetingPlatform'];
  meetingLink?: string;
  location?: string;
}

export interface RejectMentorBookingRequest {
  rejectReason: string;
  mentorResponseNote?: string;
}

export interface CompleteMentorBookingRequest {
  completionNote?: string;
}

export interface ConfirmBookingRequest {
  confirmationNote?: string;
}

export type BookingIssueType =
  | 'MENTOR_NO_SHOW'
  | 'MENTEE_NO_SHOW'
  | 'QUALITY_ISSUE'
  | 'TECHNICAL_PROBLEM'
  | 'OTHER'
  | 'NO_SHOW_OR_QUALITY_OR_OTHER';

export interface SubmitBookingIssueRequest {
  issueType: BookingIssueType;
  description: string;
  evidenceIds: string[];
}

export interface RespondBookingIssueRequest {
  responseNote: string;
  evidenceIds?: string[];
}

export interface PaymentCheckoutResponse {
  bookingId: string;
  status: string;
  checkoutUrl?: string | null;
  paymentLink?: string | null;
}

export interface CancelMentorBookingRequest {
  cancelReason: string;
}

export type MentorBlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MentorBlogVisibility = 'PUBLIC' | 'AUTHENTICATED' | 'BOOKED_MEMBERS';

export interface BlogCategoryResponse {
  id: string;
  code?: string;
  name: string;
  slug?: string;
}

export interface BlogTagResponse {
  id: string;
  name: string;
  slug?: string;
}

/** Bài viết Blog trong khu vực quản lý của Mentor. */
export interface MentorBlogPostDetailResponse {
  id: string;
  title: string;
  slug?: string | null;
  slugLocked?: boolean;
  excerpt?: string | null;
  contentMarkdown?: string | null;
  coverImageUrl?: string | null;
  ogImageUrl?: string | null;
  visibility: MentorBlogVisibility;
  status: MentorBlogPostStatus;
  categories?: BlogCategoryResponse[];
  tags?: BlogTagResponse[];
  entitledServiceIds?: string[];
  featured?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MentorBlogPostCreateRequest {
  title: string;
  excerpt?: string;
  contentMarkdown?: string;
  visibility?: MentorBlogVisibility;
  categoryIds?: string[];
  tagIds?: string[];
  entitledServiceIds?: string[];
}

export interface MentorBlogPostUpdateRequest extends MentorBlogPostCreateRequest {
  expectedVersion: number;
}

export interface BlogExpectedVersionRequest {
  expectedVersion: number;
}

/** Availability slot returned by GET /api/me/availability-slots. */
export interface MentorManagedAvailabilitySlotResponse {
  slotId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  isActive: boolean;
  note?: string | null;
  services: AvailabilitySlotServiceBasicResponse[];
  version: number;
  pendingBookingCount: number;
  lockingBookingCount: number;
  hasLockingBooking: boolean;
  timeMutation?: SlotMutationCapabilityResponse | null;
  deactivation?: SlotMutationCapabilityResponse | null;
  canEditNote: boolean;
}

/** The unwrapped data payload of GET /api/me/availability-slots. */
export type AvailabilitySlotsResponse = MentorManagedAvailabilitySlotResponse[];

/** Expected optimistic-lock version of a recurring availability template. */
export interface ExpectedTemplateVersionRequest {
  templateId: string;
  expectedVersion: number;
}

/** Payload for POST /api/me/availability-slots. Datetimes must be UTC whole-minute ISO instants. */
export interface CreateAvailabilitySlotRequest {
  startAt: string;
  endAt: string;
  serviceIds: string[];
  note?: string;
  replaceGeneratedOccurrences?: boolean;
  rejectPendingBookings?: boolean;
  expectedTemplateVersions?: ExpectedTemplateVersionRequest[];
  legacyJavaBridge?: boolean;
}

/** Payload for PUT /api/me/availability-slots/{slotId}. */
export interface UpdateAvailabilitySlotRequest {
  startAt: string;
  endAt: string;
  serviceIds: string[];
  expectedVersion: number;
  note?: string;
  rejectPendingBookings?: boolean;
  pendingRejectionToken?: string;
  replaceGeneratedOccurrences?: boolean;
  expectedTemplateVersions?: ExpectedTemplateVersionRequest[];
  legacyJavaBridge?: boolean;
}

/** Payload for POST /api/me/availability-slots/{slotId}/deactivate. */
export interface DeactivateAvailabilitySlotRequest {
  expectedVersion: number;
  rejectPendingBookings?: boolean;
  pendingRejectionToken?: string;
  expectedTemplateVersion?: number;
}

/** Payload tạo dịch vụ mentoring 1-1. */
export interface CreateMentorServiceRequest {
  title: string;
  description: string;
  expectedOutcome: string;
  durationMinutes: number;
  isFree: boolean;
  priceScoin: number;
  maintainPostSessionChat?: boolean;
  deliveryMode?: 'ONE_TO_ONE';
}

/** Dịch vụ do mentor sở hữu, dùng trong trang quản lý. */
export interface MentorServiceManagementResponse {
  serviceId: string;
  mentorUserId: string;
  title: string;
  description: string;
  expectedOutcome: string;
  durationMinutes: number;
  isFree: boolean;
  basePriceScoin: number | null;
  publicPriceScoin: number | null;
  estimatedMentorPayoutScoin: number | null;
  isActive: boolean;
  maintainPostSessionChat: boolean;
  deliveryMode: 'ONE_TO_ONE';
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload đổi trạng thái hiển thị/nhận booking của một dịch vụ. */
export interface MentorServiceActiveRequest {
  isActive: boolean;
  expectedVersion: number;
  rejectPendingBookings?: boolean;
  pendingRejectionToken?: string;
}

/** Payload cập nhật nội dung và pricing của một dịch vụ mentoring. */
export interface UpdateMentorServiceRequest {
  title: string;
  description: string;
  expectedOutcome: string;
  isFree: boolean;
  priceScoin: number;
  maintainPostSessionChat?: boolean;
  expectedVersion: number;
}

/** Dịch vụ công khai trong hồ sơ mentor, dùng để mentee chọn trước khi đặt lịch. */
export interface MentorServiceResponse {
  serviceId: string;
  mentorUserId: string;
  title: string;
  description: string;
  expectedOutcome: string;
  durationMinutes: number;
  isFree: boolean;
  priceScoin: number | null;
  isActive: boolean;
}

/** Phần dữ liệu phản hồi hồ sơ mentor công khai (`GET /api/mentors/{mentorUserId}`). */
export interface MentorDiscoveryDetailResponse {
  identity: {
    mentorUserId?: string;
    displayName?: string;
    avatarUrl?: string | null;
    headline?: string;
    isVerified?: boolean;
    verifiedAt?: string | null;
  };
  mentoring: {
    bio?: string;
    expertiseDescription?: string;
  };
  evidence: {
    featuredProjects?: MentorProjectResponse[];
    achievements?: MentorAchievementResponse[];
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    education?: {
      campusName?: string;
      specializationName?: string;
      programName?: string;
    };
  };
  reputation: {
    ratingState?: 'NO_REVIEWS' | 'RATED';
    ratingAverage?: number | null;
    reviewCount?: number;
    completedSessions?: number;
  };
  services: MentorServiceResponse[];
  availability?: {
    isAvailable?: boolean;
    suspendedUntil?: string | null;
    canRequestBooking?: boolean;
  };
}

/** Một đánh giá công khai của mentor (`GET /api/mentors/{mentorUserId}/reviews`). */
export interface MentorReviewResponse {
  reviewId: string;
  reviewerUserId: string;
  reviewerDisplayName: string;
  reviewerAvatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

/** Trang đánh giá công khai của mentor. */
export interface MentorReviewPageResponse {
  content: MentorReviewResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Tác giả blog công khai được trả về trong danh sách theo dõi. */
export interface BlogFollowMentorResponse {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  authorType: 'MENTOR' | 'PLATFORM';
}

/** Danh sách chủ đề và mentor mà người dùng hiện tại đang theo dõi. */
export interface BlogFollowResponse {
  categories: unknown[];
  mentors: BlogFollowMentorResponse[];
}

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
  /** Điểm đánh giá trung bình */
  ratingAverage?: number | null;
  /** Số lượt đánh giá */
  reviewCount?: number;
  /** Số buổi tư vấn đã hoàn thành */
  completedSessions?: number;
  /** Danh sách dự án nổi bật */
  featuredProjects?: MentorProjectResponse[];
  /** Danh sách thành tích & giải thưởng */
  achievements?: MentorAchievementResponse[];
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
  projectId?: string;
  title: string;
  content: string;
  projectDescription?: string;
  liveDemoUrl?: string;
  pictureUrl?: string;
  displayOrder?: number;
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
  achievementId?: string;
  title: string;
  awardDescription?: string;
  achievedAt?: string;
  productHeader?: string;
  productDescription?: string;
  demoUrl?: string;
  pictureUrl?: string;
  displayOrder?: number;
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
  contentType?: string;
  documentType?: string;
}

/** Request payload xác nhận tài liệu minh chứng đã upload (POST /api/me/mentor-verification/documents) */
export interface ConfirmDocumentRequest {
  documentType: string;
  uploadIntentId: string;
}

/** Response tiến độ xác thực Mentor (GET /api/me/mentor-verification/progress) */
export interface MentorVerificationProgressResponse {
  requestId?: string;
  applicationStatus?: string;
  submittedAt?: string;
  estimatedReviewBy?: string;
  reviewTargetHours?: number;
  reviewOverdue?: boolean;
  submissionSteps?: Array<{
    code: string;
    completed: boolean;
    requiredForSubmission: boolean;
    requiredForBookingOffer: boolean;
    actionPath?: string;
    message?: string;
  }>;
  activationSteps?: Array<{
    code: string;
    completed: boolean;
    requiredForSubmission: boolean;
    requiredForBookingOffer: boolean;
    actionPath?: string;
  }>;
}

/** Phản hồi thông tin 1 tài liệu minh chứng trong hồ sơ xác thực */
export interface VerificationDocumentResponse {
  id: string;
  documentType: 'FPTU_AFFILIATION_PROOF' | 'EXPERTISE_PROOF' | string;
  status: string;
  storageKind?: string;
  originalFilename?: string;
  contentType?: string;
  sizeBytes?: number;
  fileUrl?: string;
  isActive?: boolean;
  version?: number;
  reviewNote?: string;
  rejectedReason?: string;
  uploadedAt?: string;
}

/** Response hồ sơ đăng ký Mentor đầy đủ (GET /api/me/mentor-verification) */
export interface MentorVerificationResponse {
  id?: string;
  status?: string;
  rejectionReason?: string;
  revisionCount?: number;
  submittedAt?: string;
  estimatedReviewBy?: string;
  reviewTargetHours?: number;
  reviewOverdue?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  headline?: string;
  expertiseDescription?: string;
  isAvailable?: boolean;
  phoneNumber?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  foundationSupportLevel?: number;
  outputReviewSupportLevel?: number;
  directionSupportLevel?: number;
  minimumBookingLeadTimeMinutes?: number;
  maximumBookingHorizonDays?: number;
  subjectResults?: Array<{
    subjectCode: string;
    subjectName: string;
    scoreValue: number;
  }>;
  documents?: VerificationDocumentResponse[];
  timeline?: Array<unknown>;
  profile?: any;
}

export type WalletEntryType =
  | 'ISSUE'
  | 'RESERVE'
  | 'CONSUME'
  | 'RELEASE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'HOLD'
  | 'PAID_OUT'
  | 'COMMISSION'
  | 'VOID';

export type WalletSourceType =
  | 'PAYMENT_ORDER'
  | 'BOOKING'
  | 'CAMPAIGN'
  | 'COUPON'
  | 'MANUAL'
  | 'PAYOUT_REQUEST'
  | 'REFUND'
  | 'PAYMENT_ATTEMPT'
  | 'COURSE_ENROLLMENT'
  | 'BOOKING_ISSUE_RESOLUTION';

export interface WalletTransactionResponse {
  id: string;
  entryType: WalletEntryType;
  originType?: string | null;
  sourceType?: WalletSourceType | null;
  sourceId?: string | null;
  amountScoin: number;
  balanceEffectScoin: number;
  memo?: string | null;
  createdAt: string;
}

export interface MentorWalletResponse {
  availableScoin: number;
  recentTransactions: WalletTransactionResponse[];
}

export interface MentorPayoutProfileUpsertRequest {
  accountHolderName: string;
  bankCode?: string;
  bankName: string;
  accountNumber: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface MentorPayoutProfileResponse {
  payoutProfileId: string;
  mentorUserId: string;
  accountHolderName: string;
  bankCode?: string | null;
  bankName: string;
  accountNumberMasked: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequestCreateRequest {
  amountScoin: number;
  payoutProfileId?: string;
  note?: string;
}

export type PayoutRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

export interface PayoutRequestResponse {
  payoutRequestId: string;
  mentorUserId: string;
  settlementAccountId: string;
  payoutProfileId: string;
  amountScoin: number;
  status: PayoutRequestStatus;
  bankAccountNameSnapshot: string;
  bankNameSnapshot: string;
  bankAccountNumberMaskedSnapshot: string;
  adminUserId?: string | null;
  adminNote?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  rejectedAt?: string | null;
}
