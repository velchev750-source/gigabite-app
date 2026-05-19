import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";

const protectedRoutes = ["/account", "/staff", "/admin", "/checkout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (hasAuthCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/staff/:path*", "/admin/:path*", "/checkout"],
};
