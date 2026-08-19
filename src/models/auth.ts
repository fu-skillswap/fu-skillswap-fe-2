export interface ValidationError {
  field: string | null;
  message: string;
  rejectedValue: unknown;
}

export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  data: T | ValidationError[] | null;
  retryAfterSeconds?: number;
}

export interface GoogleLoginNonceResponse { nonce: string; expiresAt: string; }
export interface TokenResponse { accessToken: string; tokenType: string; }
export interface GoogleLoginRequest { credential: string; nonce: string; }
export type BackendRole = "MENTEE" | "MENTOR" | "ADMIN" | "SYSTEM_ADMIN";
export interface UserMeResponse {
  publicId: string; email: string; fullName: string; avatarUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | "BANNED" | "DELETED";
  roles: BackendRole[]; profileCompleted: boolean; hasStudentProfile: boolean;
  googleCalendarConnected: boolean; googleCalendarSyncEnabled: boolean;
  googleCalendarEmail?: string | null; googleCalendarNeedsReconnect: boolean;
  googleCalendarLastSyncStatus?: string | null; googleCalendarLastSyncAt?: string | null;
}
export interface OnboardingStatusResponse {
  studentProfileCompleted: boolean; mentorProfileCompleted: boolean;
  mentorVerificationStatus?: string | null; roles: BackendRole[];
  nextRecommendedAction?: string | null;
}
export interface AuthenticatedUser extends UserMeResponse { id: string; }
