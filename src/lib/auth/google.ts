/**
 * @file google.ts
 * @description Helper hỗ trợ điều hướng Onboarding cho xác thực Google OAuth.
 */

import type { OnboardingStatusResponse } from '@/models/auth';

/**
 * Xử lý xác định đường dẫn điều hướng phù hợp sau khi đăng nhập thành công
 * dựa trên trạng thái onboarding của người dùng từ Backend.
 *
 * @param locale - Mã ngôn ngữ hiện tại của ứng dụng (ví dụ: "vi", "en")
 * @param onboarding - Đối tượng trạng thái Onboarding thu được từ Backend hoặc mã action
 * @returns Đường dẫn URL tương đối hoàn chỉnh để điều hướng router
 */
export function onboardingDestination(
  locale: string,
  onboarding?: OnboardingStatusResponse | string | null,
) {
  // Trường hợp đối tượng truyền vào là chuỗi mã hành động
  if (typeof onboarding === 'string') {
    if (onboarding === 'COMPLETE_STUDENT_PROFILE') {
      return `/${locale}/onboarding/student-profile`;
    }
    return `/${locale}/dashboard`;
  }

  // Nếu người dùng đã có tài khoản (đã hoàn thiện hồ sơ sinh viên) -> Chuyển thẳng về Dashboard
  if (onboarding?.studentProfileCompleted) {
    return `/${locale}/dashboard`;
  }

  // Chỉ khi người dùng mới đăng nhập lần đầu (chưa hoàn thành hồ sơ) mới dẫn đến trang Onboarding
  if (onboarding?.nextRecommendedAction === 'COMPLETE_STUDENT_PROFILE') {
    return `/${locale}/onboarding/student-profile`;
  }

  return `/${locale}/dashboard`;
}
