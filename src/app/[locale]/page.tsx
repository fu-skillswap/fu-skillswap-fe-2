/**
 * @file page.tsx
 * @description Route trang chủ mặc định (`/[locale]`).
 * Tự động chuyển hướng (Redirect) người dùng tới trang Đăng nhập (`/[locale]/login`).
 */

import { redirect } from "next/navigation";

/**
 * Server Component điều hướng trang chủ về trang Đăng nhập.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
