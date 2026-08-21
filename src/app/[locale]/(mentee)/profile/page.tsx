/**
 * @file page.tsx
 * @description Route Hồ sơ của tôi (`/[locale]/profile`).
 * Render giao diện `MyProfileView`.
 */

import { MyProfileView } from '@/views/mentee/MyProfileView';

/**
 * Server Component cho trang Hồ sơ cá nhân.
 */
export default function MyProfilePage() {
  return <MyProfileView />;
}
