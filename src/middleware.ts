import { NextRequest, NextResponse } from "next/server";

const supportedLocales = ["vi", "en"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();
  const hasLocale = supportedLocales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();
  return NextResponse.redirect(new URL(`/vi${pathname === "/" ? "" : pathname}`, request.url));
}

export const config = { matcher: ["/((?!api).*)"] };
