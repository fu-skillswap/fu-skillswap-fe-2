/**
 * @file layout.tsx
 * @description Layout cho nhóm Route hỗ trợ đa ngôn ngữ (`/[locale]`).
 * Bọc các Provider toàn cục QueryProvider và AuthProvider cho toàn bộ cây component con.
 */

import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";

/**
 * Component LocaleLayout cấp cao nhất dưới route `/[locale]`.
 */
export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  void params;
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
