import type { FieldPath } from 'react-hook-form';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

export const MENTOR_REVIEW_DURATION = '2–3 ngày làm việc'; // TODO(product): Đồng bộ SLA chính thức.
export const MENTOR_TESTIMONIAL: null | { quote: string; author: string; role: string } = null;
export const MAX_EVIDENCE_SIZE = 15 * 1024 * 1024;
export const ALLOWED_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const MENTOR_STEPS = [
  {
    id: 1,
    label: 'Thông tin cơ bản',
    purpose: 'Giúp mentee hiểu bạn là ai và bạn có thể hỗ trợ điều gì.',
  },
  {
    id: 2,
    label: 'Kinh nghiệm & thế mạnh',
    purpose: 'Chia sẻ môn học, dự án và thế mạnh tư vấn nổi bật.',
  },
  {
    id: 3,
    label: 'Thời gian tư vấn',
    purpose: 'Thiết lập cách mentee có thể chủ động đặt lịch với bạn.',
  },
  { id: 4, label: 'Minh chứng', purpose: 'Xác thực tư cách FPTU và năng lực chuyên môn của bạn.' },
  {
    id: 5,
    label: 'Xem lại & gửi',
    purpose: 'Kiểm tra thông tin, xác nhận điều khoản và nộp hồ sơ.',
  },
] as const;

export const STEP_FIELDS: Record<number, FieldPath<MentorProfileFormValues>[]> = {
  1: ['headline', 'expertiseDescription', 'phoneNumber', 'githubUrl', 'portfolioUrl'],
  2: [
    'subjectResults',
    'foundationSupportLevel',
    'outputReviewSupportLevel',
    'directionSupportLevel',
    'projects',
    'achievements',
  ],
  3: ['isAvailable', 'minimumBookingLeadTimeMinutes', 'maximumBookingHorizonDays'],
  4: [],
  5: ['agreeTerms'],
};

export const TITLE_EXAMPLES = [
  'Sinh viên năm 4 | AI/ML',
  'UI/UX Designer | Figma',
  'Học bổng & trao đổi quốc tế',
] as const;
