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

export type MentorVerificationStatus =
  'DRAFT' | 'PENDING' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED';

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
  page?: number;
  size?: number;
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
