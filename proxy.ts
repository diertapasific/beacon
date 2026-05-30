import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: Middleware is now "Proxy". This does OPTIMISTIC auth checks only
// (cookie presence) for redirect UX — real verification happens in each page
// via getUser(). See node_modules/next/dist/docs/.../16-proxy.md
const COOKIE_NAME = "beacon_token";
const PROTECTED = ["/dashboard", "/onboarding", "/lesson"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(COOKIE_NAME);

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/lesson/:path*", "/auth/:path*"],
};
