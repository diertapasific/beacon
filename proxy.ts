import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: Middleware is now "Proxy". Optimistic auth gate (cookie presence
// only) — real JWT verification happens per-handler via getUser().
const COOKIE_NAME = "beacon_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = !!request.cookies.get(COOKIE_NAME)?.value;

  if (!hasToken) {
    // API routes → 401 JSON (don't redirect XHR callers to an HTML login page).
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Page routes → redirect to login preserving the intended destination.
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated — redirect away from auth pages.
  if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected pages
    "/dashboard/:path*",
    "/lesson/:path*",
    "/profile/:path*",
    "/paths/:path*",
    "/onboarding/:path*",
    // Auth pages (for redirect-if-logged-in)
    "/auth/login",
    "/auth/signup",
    // All API routes except auth (login/signup/logout) and cron (CRON_SECRET auth)
    "/api/((?!auth/|cron/).*)",
  ],
};
