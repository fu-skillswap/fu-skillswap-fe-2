/**
 * @file settingsSupport.constants.ts
 * @description Nội dung FAQ và cấu hình liên hệ tập trung cho trang Cài đặt & hỗ trợ.
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';

export const SUPPORT_CONFIG = {
  responseTime: 'trong 24 giờ',
  workingHours: '08:00–17:30, Thứ Hai–Thứ Sáu',
  email: SKILLSWAP_CONTACT_EMAIL,
  cancellationRefundHours: 24,
} as const;

// TODO(api): Thay nội dung tĩnh bằng CMS/API FAQ khi backend cung cấp.
export const SETTINGS_FAQS = [
  {
    id: 'cancel-booking',
    category: 'Booking',
    question: 'Làm sao để hủy hoặc đổi lịch một buổi booking?',
    answer:
      'Vào Booking của tôi, chọn buổi học rồi bấm Đổi lịch hoặc Hủy. Hủy trước thời hạn theo chính sách sẽ được hoàn tiền theo chính sách.',
  },
  {
    id: 'mentor-no-show',
    category: 'Booking',
    question: 'Mentor không vào buổi học thì sao?',
    answer:
      'Mở chi tiết booking và chọn Báo cáo sự cố để đội ngũ SkillSwap kiểm tra, hỗ trợ đổi lịch hoặc xử lý hoàn tiền.',
  },
  {
    id: 'gmail-login',
    category: 'Tài khoản',
    question: 'Tôi không đăng nhập được bằng Gmail?',
    answer:
      'Hãy kiểm tra đúng tài khoản Google đã đăng ký, cho phép cookie và thử đăng nhập lại. Nếu vẫn lỗi, gửi yêu cầu hỗ trợ bên dưới.',
  },
  {
    id: 'change-profile',
    category: 'Tài khoản',
    question: 'Làm sao để đổi tên hiển thị hoặc ảnh đại diện?',
    answer: 'Mở Hồ sơ của tôi, chọn Chỉnh sửa hồ sơ và lưu lại thông tin mới.',
  },
  {
    id: 'become-mentor',
    category: 'Mentor',
    question: 'Làm thế nào để trở thành mentor?',
    answer:
      'Chọn Trở thành mentor trong menu tài khoản, hoàn thiện hồ sơ và gửi minh chứng để SkillSwap xét duyệt.',
  },
  {
    id: 'refund-time',
    category: 'Thanh toán',
    question: 'Bao lâu thì tôi nhận được tiền hoàn?',
    answer:
      'Thời gian hoàn phụ thuộc phương thức thanh toán và trạng thái xử lý. Theo dõi booking hoặc gửi yêu cầu để được kiểm tra cụ thể.',
  },
] as const;

export const FAQ_CATEGORIES = ['Tất cả', 'Booking', 'Tài khoản', 'Mentor', 'Thanh toán'] as const;

export type SettingsSection = 'settings' | 'help';
export type SettingsTab = 'account' | 'notifications' | 'privacy' | 'language' | 'booking';
