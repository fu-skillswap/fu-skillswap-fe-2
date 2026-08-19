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
export interface CampusResponse { id: string; code: string; name: string; city: string; }
export interface AcademicProgramResponse { id: string; code: string; nameVi: string; nameEn: string; }
export interface SpecializationResponse { id: string; programId: string; code: string; nameVi: string; nameEn: string; expected?: boolean; other?: boolean; }
export interface StudentProfileRequest {
  studentCode: string; displayName?: string; avatarUrl?: string; campusId: string; programId: string;
  specializationId: string; semester: number; intakeYear: number; isAlumni: boolean; graduationYear?: number; bio?: string;
}
export interface StudentProfileResponse {
  userId: string; email: string; studentCode: string; displayName?: string | null; avatarUrl?: string | null;
  campus: CampusResponse; program: AcademicProgramResponse; specialization: SpecializationResponse;
  semester: number; intakeYear: number; graduationYear?: number | null; bio?: string | null;
  createdAt: string; updatedAt: string; alumni: boolean;
}
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
