/**
 * @file middleware.ts
 * @description Next.js Middleware điều hướng đa ngôn ngữ (Internationalization / i18n routing).
 * Tự động chuyển hướng các đường dẫn chưa có tiền tố ngôn ngữ về ngôn ngữ mặc định (Tiếng Việt `/vi`).
 */

import { NextRequest, NextResponse } from "next/server";

/** Danh sách ngôn ngữ được hỗ trợ trong hệ thống */
const supportedLocales = ["vi", "en"];

/**
 * Middleware kiểm tra và bổ sung prefix locale vào URL request nếu thiếu.
 * Bỏ qua tài nguyên tĩnh (`/_next`, file static) và API endpoints.
 *
 * @param request - NextRequest đại diện cho HTTP Request gửi đến
 * @returns NextResponse chuyển hướng (Redirect) hoặc tiếp tục (Next)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.includes("."))
    return NextResponse.next();
  const hasLocale = supportedLocales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();
  return NextResponse.redirect(
    new URL(`/vi${pathname === "/" ? "" : pathname}`, request.url),
  );
}

/** Cấu hình matcher áp dụng middleware cho tất cả đường dẫn trừ `/api` */
export const config = { matcher: ["/((?!api).*)"] };
