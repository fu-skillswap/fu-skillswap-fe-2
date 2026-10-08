/**
 * @file privacyPolicy.ts
 * @description Nội dung trang Chính sách bảo mật (`/[locale]/chinh-sach-bao-mat`).
 * Văn bản pháp lý được chép nguyên văn; giữ nguyên các chỗ [trong ngoặc vuông] để điền sau.
 * Cho phép in đậm bằng `**chữ**`.
 */

import { SKILLSWAP_CONTACT_EMAIL } from '@/constants/contact';

export type PrivacySectionId =
  | 'chung-toi-la-ai'
  | 'du-lieu-thu-thap'
  | 'muc-dich'
  | 'ai-xu-ly'
  | 'chia-se'
  | 'thoi-gian-luu'
  | 'xoa-tai-khoan'
  | 'quyen-cua-ban'
  | 'bao-ve'
  | 'do-tuoi'
  | 'thay-doi'
  | 'lien-he';

export type PrivacyBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'note'; tone: 'info' | 'warning'; text: string };

export interface PrivacySection {
  id: PrivacySectionId;
  title: string;
  blocks: PrivacyBlock[];
}

export const PRIVACY_POLICY_META = {
  updatedAt: '08/10/2026',
  effectiveFrom: '[ngày công bố]',
  contactEmail: SKILLSWAP_CONTACT_EMAIL,
} as const;

/** The 5 bullets of "Đọc nhanh". */
export const PRIVACY_QUICK_READ: string[] = [];

export const PRIVACY_SECTIONS: PrivacySection[] = [];
