
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages and admin API endpoints
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Check environment variable ENABLE_ADMIN_PORTAL (defaults to true if not explicitly "false")
    const enableAdmin = process.env.ENABLE_ADMIN_PORTAL;
    if (enableAdmin === "false") {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Allow admin authentication endpoints without prior session
    if (pathname === "/admin/login" || pathname === "/api/admin/auth/login" || pathname === "/api/admin/auth/logout") {
      // If user is already an authenticated admin visiting /admin/login, redirect to /admin dashboard
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token && pathname === "/admin/login") {
        const payload = await verifySessionToken(token);
        if (payload && payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      }
      return NextResponse.next();
    }

    // Verify JWT session token for role authorization
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized access: Administrator session required." },
          { status: 401 }
        );
      }
      // For admin page routes, redirect to dedicated admin login
      const redirectUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        redirectUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(redirectUrl);
    }

    const payload = await verifySessionToken(token);
    if (!payload || payload.role !== "admin") {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Administrator privileges required." },
          { status: 403 }
        );
      }
      // Non-admin user trying to access admin pages is redirected to admin login with alert
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "insufficient_privileges");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
