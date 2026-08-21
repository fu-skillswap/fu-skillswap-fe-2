/**
 * @file google.ts
 * @description Helper hỗ trợ điều hướng Onboarding cho xác thực Google OAuth.
 */

/**
 * Xử lý xác định đường dẫn điều hướng phù hợp sau khi đăng nhập thành công
 * dựa trên hành động tiếp theo được khuyến nghị (nextRecommendedAction) từ Backend.
 *
 * @param locale - Mã ngôn ngữ hiện tại của ứng dụng (ví dụ: "vi", "en")
 * @param action - Mã hành động tiếp theo từ Backend (`COMPLETE_STUDENT_PROFILE`, `REVISE_MENTOR_VERIFICATION`,...)
 * @returns Đường dẫn URL tương đối hoàn chỉnh để điều hướng router
 */
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
