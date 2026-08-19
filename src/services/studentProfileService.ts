import { apiClient } from "@/models/apiClient";
import type { AcademicProgramResponse, CampusResponse, SpecializationResponse, StudentProfileRequest } from "@/models/auth";

export const studentProfileService = {
  getCampuses: () => apiClient<CampusResponse[]>("/api/campuses"),
  getPrograms: () => apiClient<AcademicProgramResponse[]>("/api/academic-programs"),
  getSpecializations: (programId: string) => apiClient<SpecializationResponse[]>(`/api/academic-programs/${programId}/specializations`),
  save: (profile: StudentProfileRequest) => apiClient<unknown>("/api/me/student-profile", { method: "PUT", body: JSON.stringify(profile) }),
};
