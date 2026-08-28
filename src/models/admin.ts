/**
 * @file admin.ts
 * @description Kiểu dữ liệu cho cổng quản trị, dashboard vận hành và hàng đợi xử lý case.
 */

export type AdminQueueKey =
  | 'BOOKING_DISPUTE'
  | 'MENTOR_VERIFICATION'
  | 'FORUM_REPORT'
  | 'PAYOUT_REQUEST'
  | 'FAILED_PAYMENT_ORDER'
  | 'EMAIL_OUTBOX_DEAD_LETTER';

export interface AdminDashboardOverviewResponse {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  pendingMentorVerifications: number;
  activeMentors: number;
  activeBookings: number;
  disputedBookings: number;
  pendingForumReports: number;
  pendingPayoutRequests: number;
  pendingPayoutAmountScoin: number;
  failedPaymentOrders: number;
}

export interface AdminQueueCardResponse {
  queueKey: AdminQueueKey;
  title: string;
  description: string;
  pendingCount: number;
  oldestPendingAt: string | null;
  slaBreachCount: number;
  priorityOrder: number;
}

export interface AdminDashboardQueuesResponse {
  queues: AdminQueueCardResponse[];
}

export interface AdminDailyMetric {
  date: string;
  newUsersCount: number;
  mentorVerificationSubmits: number;
  newBookingsCount: number;
  paidPaymentsCount: number;
  forumReportsCount: number;
  payoutRequestsCount: number;
}

export interface AdminDashboardTimeseriesResponse {
  dailyMetrics: AdminDailyMetric[];
}

export interface AdminQueueItem {
  caseId: string;
  caseType: string;
  title: string;
  submittedAt: string;
  assignedAdminEmail: string | null;
  slaRemainingMinutes: number;
}

export interface AdminPageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
}

export interface AdminUserAcademicProfile {
  claimedStudentCode: string | null;
}

export interface AdminUser {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
  academicProfile: AdminUserAcademicProfile | null;
}

export interface AdminUsersResponse {
  content: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminUsersQuery {
  page?: number;
  size?: number;
}

export interface AdminMentor {
  mentorUserId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  primaryLabel: string | null;
  completedSessions: number;
  ratingAverage: number | null;
  mentorStatus: string;
  createdAt: string;
}

export interface AdminMentorsResponse {
  content: AdminMentor[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminMentorsQuery {
  page?: number;
  size?: number;
}

export interface AdminBookingAttendance {
  mentorCheckedInAt: string | null;
  menteeCheckedInAt: string | null;
  summary: string | null;
}

export interface AdminBooking {
  bookingId: string;
  actualSessionId: string | null;
  actualSessionStatus: string | null;
  mentorUserId: string;
  mentorDisplayName: string;
  mentorAvatarUrl: string | null;
  menteeUserId: string;
  menteeDisplayName: string;
  menteeAvatarUrl: string | null;
  serviceId: string | null;
  serviceTitle: string | null;
  serviceDescriptionSnapshot: string | null;
  serviceDurationSnapshot: number | null;
  serviceIsFreeSnapshot: boolean;
  servicePriceScoinSnapshot: number | null;
  servicePriceWithSurchargeScoin: number | null;
  bookingStatus: string;
  paymentStatus: string;
  settlementStatus: string | null;
  learningGoalTitle: string | null;
  mentorResponseNote: string | null;
  meetingPlatform: string | null;
  location: string | null;
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  attendance: AdminBookingAttendance | null;
  completedAt: string | null;
  cancelledAt: string | null;
  issueType: string | null;
  issueDescription: string | null;
  displayState: string | null;
  nextAction: string | null;
  actionDeadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingsResponse {
  content: AdminBooking[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminBookingsQuery {
  page?: number;
  size?: number;
}

export type ForumReportStatus =
  'OPEN' | 'RESOLVED_NO_ACTION' | 'RESOLVED_ACTION_TAKEN' | 'DISMISSED';

export interface AdminForumReport {
  reportId: string;
  targetType: string;
  targetId: string;
  targetStatus: string | null;
  targetTitle: string | null;
  targetContentPreview: string | null;
  targetAuthorUserId: string | null;
  targetAuthorFullName: string | null;
  reporterUserId: string | null;
  reporterFullName: string | null;
  reasonType: string;
  description: string | null;
  status: ForumReportStatus;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminForumReportsResponse {
  content: AdminForumReport[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminForumReportsQuery {
  page?: number;
  size?: number;
  keyword?: string;
  status?: ForumReportStatus;
  targetType?: 'POST' | 'COMMENT';
}

export interface AdminCaseOwnership {
  caseType: string;
  caseId: string;
  assigned: boolean;
  assignedAdminUserId: string | null;
  assignedAdminDisplayName: string | null;
  assignedAt: string | null;
}

export interface AdminCaseActivity {
  eventType: string;
  occurredAt: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  title: string;
  description: string | null;
  source: string | null;
}

export interface AdminCaseActivityResponse {
  content: AdminCaseActivity[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminCaseActivityQuery {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

export interface AdminMentorSubjectResult {
  id: string;
  subjectCode: string;
  subjectName: string;
  scoreValue: number | null;
  displayOrder: number;
}

export interface AdminMentorFeaturedProject {
  id: string;
  title: string;
  pictureUrl: string | null;
  content: string | null;
  projectDescription: string | null;
  liveDemoUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMentorAchievement {
  id: string;
  title: string;
  pictureUrl: string | null;
  awardDescription: string | null;
  achievedAt: string | null;
  productHeader: string | null;
  productDescription: string | null;
  demoUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMentorDetail {
  mentorUserId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  userStatus: string;
  mentorStatus: string;
  isAvailable: boolean;
  bookingSuspendedUntil: string | null;
  headline: string | null;
  expertiseDescription: string | null;
  subjectResults: AdminMentorSubjectResult[];
  foundationSupportLevel: number | null;
  outputReviewSupportLevel: number | null;
  directionSupportLevel: number | null;
  featuredProjects: AdminMentorFeaturedProject[];
  achievements: AdminMentorAchievement[];
  ratingAverage: number | null;
  reviewCount: number;
  completedSessions: number;
  rejectedBookings: number;
  portfolioUrl: string | null;
  githubUrl: string | null;
  primaryLabel: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserAcademicProfileSummary {
  studentCode: string | null;
  campusCode: string | null;
  campusName: string | null;
  programCode: string | null;
  programName: string | null;
  specializationCode: string | null;
  specializationName: string | null;
  semester: number | null;
  isAlumni: boolean;
}

export interface AdminUserMentorProfileSummary {
  exists: boolean;
  mentorStatus: string | null;
  isAvailable: boolean;
  verifiedAt: string | null;
  headline: string | null;
  averageRating: number | null;
  totalCompletedSessions: number | null;
}

export interface AdminUserActivitySummary {
  menteeBookingCount: number;
  mentorBookingCount: number;
  paymentOrderCount: number;
  payoutRequestCount: number;
  forumReportCreatedCount: number;
}

export interface AdminUserSummary {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
  academicProfile: AdminUserAcademicProfileSummary | null;
  mentorProfile: AdminUserMentorProfileSummary | null;
  activitySummary: AdminUserActivitySummary;
}

export type MentorVerificationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'NEEDS_REVISION'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface MentorVerificationRequest {
  requestId: string;
  mentorUserId: string;
  mentorEmail: string;
  mentorFullName: string;
  mentorAvatarUrl: string | null;
  status: MentorVerificationStatus;
  revisionCount: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorVerificationRequestsResponse {
  content: MentorVerificationRequest[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface MentorVerificationRequestsQuery {
  status?: MentorVerificationStatus;
  keyword?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

export interface MentorVerificationDocument {
  id: string;
  documentType: string;
  status: string;
  storageKind: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  fileUrl: string;
  isActive: boolean;
  version: number;
  reviewNote: string | null;
  rejectedReason: string | null;
  uploadedAt: string;
}

export interface MentorVerificationTimelineItem {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorUserId: string;
  actorEmail: string;
  actorFullName: string;
  note: string | null;
  createdAt: string;
}

export interface MentorVerificationChecklist {
  academicProfileCompleted: boolean;
  mentorProfileCompleted: boolean;
  hasAffiliationProof: boolean;
  hasExpertiseProof: boolean;
  canSubmit: boolean;
}

export interface MentorProfileDetail {
  displayName: string;
  headline: string | null;
  expertiseDescription: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  phoneNumber: string | null;
  ratingAverage: number | null;
  reviewCount: number;
  completedSessions: number;
}

export interface StudentProfileDetail {
  studentCode: string | null;
  displayName: string;
  campus: { name: string; city: string } | null;
  program: { nameVi: string; nameEn: string } | null;
  specialization: { nameVi: string; nameEn: string } | null;
  semester: number | null;
  intakeYear: number | null;
  graduationYear: number | null;
  bio: string | null;
  alumni: boolean;
}

export interface MentorVerificationRequestDetail extends MentorVerificationRequest {
  submitNote: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
  reviewerEmail: string | null;
  lockedByAdminEmail: string | null;
  lockedAt: string | null;
  lockExpiresAt: string | null;
  canReview: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  withdrawnAt: string | null;
  documents: MentorVerificationDocument[];
  timeline: MentorVerificationTimelineItem[];
  checklist: MentorVerificationChecklist;
  mentorProfile: MentorProfileDetail | null;
  studentProfile: StudentProfileDetail | null;
}

export interface MentorVerificationLock {
  requestId: string;
  locked: boolean;
  canReview: boolean;
  lockedByAdminId: string | null;
  lockedByAdminEmail: string | null;
  lockedByAdminFullName: string | null;
  lockedAt: string | null;
  lockExpiresAt: string | null;
  secondsRemaining: number;
}

export interface AdminQueueItemsQuery {
  queueKey: AdminQueueKey;
  assignedToMeOnly?: boolean;
  unassignedOnly?: boolean;
  page?: number;
  size?: number;
}
