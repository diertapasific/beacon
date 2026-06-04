import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "beacon_token";

/**
 * Coarse authentication gate — verifies the session cookie is present
 * before a request reaches any route handler.
 *
 * Full JWT verification (signature, expiry, user resolution) is still
 * performed per-handler via getUser(). This acts as defence-in-depth and
 * prevents unauthenticated requests from reaching business logic at all.
 */
export function middleware(request: NextRequest) {
  const hasToken = !!request.cookies.get(COOKIE_NAME)?.value;
  if (hasToken) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // API routes → 401 JSON (don't redirect XHR callers to an HTML login page).
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page routes → redirect to login, preserving the intended destination.
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Protected pages
    "/dashboard/:path*",
    "/lesson/:path*",
    "/profile/:path*",
    "/paths/:path*",
    "/onboarding/:path*",
    // All API routes except auth (login/signup/logout) and cron (CRON_SECRET auth)
    "/api/((?!auth/|cron/).*)",
  ],
};
