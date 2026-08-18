export function getGoogleCallbackUri(locale: string) {
  if (typeof window === "undefined") throw new Error("Google OAuth must start in the browser.");
  return `${window.location.origin}/${locale}/auth/google/callback`;
}

export function onboardingDestination(locale: string, action?: string | null) {
  switch (action) {
    case "COMPLETE_STUDENT_PROFILE": return `/${locale}/onboarding/student-profile`;
    case "REVISE_MENTOR_VERIFICATION": return `/${locale}/mentor/verification-edit`;
    case "WAIT_FOR_APPROVE": return `/${locale}/mentor/verification-status`;
    default: return `/${locale}/dashboard`;
  }
}
