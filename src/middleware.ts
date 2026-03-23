import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/account", "/training", "/progress", "/stack", "/orders", "/rewards", "/community"];
const AFFILIATE_ONLY = ["/affiliate"];
const ADMIN_ONLY = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAppStoreBuild =
    process.env.NEXT_PUBLIC_APP_STORE_BUILD === "true";

  // App Store build: block direct access to /admin (no nav entry; redirect if URL is typed/bookmarked).
  if (isAppStoreBuild && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const supabaseResponse = await updateSession(request);

  // Role check is done in layout/server for protected routes (we don't have role in middleware without a round-trip).
  // Here we only ensure auth for protected paths.
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAffiliateRoute = AFFILIATE_ONLY.some((p) => pathname.startsWith(p));
  const isAdminRoute = ADMIN_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected || isAffiliateRoute || isAdminRoute) {
    const authCookie = request.cookies.get("sb-auth-token");
    const hasSession =
      request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.value?.length) ||
      authCookie?.value;
    // Supabase stores session in multiple cookies; redirect to login if no auth detected.
    // More robust: use getSession in a route handler or layout and redirect there.
    // For MVP we rely on server layout to redirect unauthenticated users.
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
