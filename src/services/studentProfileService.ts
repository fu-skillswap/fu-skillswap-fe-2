import { apiClient } from '@/models/apiClient';
import type {
  AcademicProgramResponse,
  CampusResponse,
  SpecializationResponse,
  StudentProfileRequest,
  StudentProfileResponse,
} from '@/models/auth';

export const studentProfileService = {
  get: () => apiClient<StudentProfileResponse>('/api/me/student-profile'),
  getCampuses: () => apiClient<CampusResponse[]>('/api/campuses'),
  getPrograms: () => apiClient<AcademicProgramResponse[]>('/api/academic-programs'),
  getSpecializations: (programId: string) =>
    apiClient<SpecializationResponse[]>(`/api/academic-programs/${programId}/specializations`),
  save: (profile: StudentProfileRequest) =>
    apiClient<unknown>('/api/me/student-profile', { method: 'PUT', body: JSON.stringify(profile) }),
};
