export function onboardingDestination(locale: string, action?: string | null) {
  switch (action) {
    case 'COMPLETE_STUDENT_PROFILE':
      return `/${locale}/onboarding/student-profile`;
    case 'REVISE_MENTOR_VERIFICATION':
      return `/${locale}/mentor/verification-edit`;
    case 'WAIT_FOR_APPROVE':
      return `/${locale}/mentor/verification-status`;
    default:
      return `/${locale}/dashboard`;
  }
}
